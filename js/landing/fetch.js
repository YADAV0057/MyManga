// ==========================================
// landing/fetch.js
// ==========================================
// Pure data layer for the landing page's always-visible rows.
// No DOM access here — this file only ever returns arrays of
// normalized manga objects (or throws/logs and returns []).
//
// Isolation note: everything this file imports comes from OUTSIDE
// the landing/ folder (../firebase.js, ../config.js, ../resultNormalizer.js
// — the shared project infrastructure). Everything it EXPORTS is only ever
// consumed by other files inside landing/. If the search engine changes
// its API or caching breaks, the blast radius is contained to this folder.
//
// REWIRED (search-engine cutover): all 5 feeds now call the new Supabase
// engine (CONFIG.SEARCH_ENGINE_URL) instead of AniList directly. Caching
// (2-tier: LocalStorage then Firestore, 6h TTL) is unchanged.
//
// Per-feed status against the confirmed engine contract (see
// "Backend Update List — search engine" in Notion for the authoritative,
// up-to-date version of this list):
//   - Trending Today  — engine has no trending signal. Approximated with
//     a broader fetch + client-side sort by `popularity` (a real field on
//     every UnifiedResult), not faked. Not a true "trending" signal, but
//     not degraded to nothing either.
//   - Hidden Gems     — engine has no minScore/maxPopularity filter.
//     Fixed client-side: fetch a wider pool sorted by rating, then filter
//     by `globalScore`/`popularity` locally (both real fields).
//   - New Releases    — GENUINELY DEGRADED. UnifiedResult has no release
//     date field at all, so "newest first" can't be reconstructed
//     client-side. Falls back to `filters.status: 'RELEASING'` only, no
//     ordering guarantee. Needs either a date field in the engine
//     response or a real date-sort — tracked in the Backend Update List.
//   - Most Awaited    — engine only recognizes sort:'rating', not
//     'popularity'. Fixed client-side: fetch a wider
//     `status: 'NOT_YET_RELEASED'` pool, then sort by `popularity` locally.
//   - Short Reads     — engine accepts but doesn't apply `maxChapters`
//     (dead field server-side, confirmed). Fixed client-side: fetch a
//     wider pool, filter by parsed `chapters` locally.

import { db, doc, getDoc, setDoc } from '../firebase.js';
import { CONFIG } from '../config.js';
import { normalizeResult } from '../resultNormalizer.js';

const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

function todayCacheKey(name) {
    const day = new Date().toISOString().slice(0, 10);
    return `home:${name}:${day}`;
}

async function readCache(key) {
    // Tier 0: Instantaneous local browser cache check
    try {
        const localData = localStorage.getItem(`local_${key}`);
        if (localData) {
            const parsed = JSON.parse(localData);
            if (Date.now() - parsed.cachedAt < CACHE_TTL_MS) {
                console.log(`[Cache Hit] Tier 0 LocalStorage for: ${key}`);
                return parsed.results;
            }
        }
    } catch (e) {
        console.warn('[landing/fetch.js] LocalStorage read failed:', e.message);
    }

    // Tier 1: Fallback to Firestore cloud cache if local missed or expired
    if (!db) return null;
    try {
        const snap = await getDoc(doc(db, 'cache', key));
        if (!snap.exists()) return null;
        const data = snap.data();
        if (Date.now() - data.cachedAt > CACHE_TTL_MS) return null;

        // Backfill into LocalStorage so the next load is immediate
        try {
            localStorage.setItem(`local_${key}`, JSON.stringify({ results: data.results, cachedAt: data.cachedAt }));
        } catch (localErr) {
            /* Silently catch if storage is full or in private browsing mode */
        }

        console.log(`[Cache Hit] Tier 1 Firestore for: ${key}`);
        return data.results;
    } catch (e) {
        console.warn('[landing/fetch.js] Firestore cache read failed:', e.message);
        return null;
    }
}

async function writeCache(key, results) {
    const now = Date.now();

    // Save to LocalStorage instantly
    try {
        localStorage.setItem(`local_${key}`, JSON.stringify({ results, cachedAt: now }));
    } catch (e) {
        console.warn('[landing/fetch.js] LocalStorage write failed:', e.message);
    }

    // Mirror to Firestore cloud cache asynchronously
    if (!db) return;
    try {
        await setDoc(doc(db, 'cache', key), { results, cachedAt: now });
    } catch (e) {
        console.warn('[landing/fetch.js] Firestore cache write failed:', e.message);
    }
}

// Small local fetch-with-timeout wrapper, same pattern used across the
// other rewired files.
async function postToSearchEngine(body, timeoutMs = CONFIG.REQUEST_TIMEOUT) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(CONFIG.SEARCH_ENGINE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`Search engine responded ${res.status}`);
        return await res.json();
    } catch (e) {
        clearTimeout(timeout);
        throw e;
    }
}

// Shared fetch+normalize step for every feed below.
async function fetchAndNormalize(query, filters) {
    const data = await postToSearchEngine({ domain: 'manga', query, filters });
    const raw = data.results || [];
    return raw.map(m => normalizeResult(m, m.source || 'AniList'));
}

function byPopularityDesc(a, b) {
    return (b.popularity || 0) - (a.popularity || 0);
}

function parseChapters(m) {
    const ch = typeof m.chapters === 'number' ? m.chapters : parseInt(m.chapters, 10);
    return isNaN(ch) ? null : ch;
}

export async function fetchTrendingToday(limit = 10) {
    const cacheKey = todayCacheKey('trending');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    let results = [];
    try {
        // No trending signal exists server-side — fetch a wider pool and
        // approximate with popularity, a real UnifiedResult field.
        const pool = await fetchAndNormalize('trending manga', { page: 1, perPage: Math.max(limit * 3, 30) });
        results = pool.slice().sort(byPopularityDesc).slice(0, limit);
        await writeCache(cacheKey, results);
    } catch (e) {
        console.warn('[landing/fetch.js] fetchTrendingToday failed:', e.message);
        return [];
    }
    return results;
}

export async function fetchHiddenGems(limit = 10, popularityCeiling = 15000, scoreFloor = 80) {
    const cacheKey = todayCacheKey('hiddenGems');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    let results = [];
    try {
        const pool = await fetchAndNormalize('acclaimed underrated manga', {
            sort: 'rating',
            page: 1,
            perPage: Math.max(limit * 4, 40)
        });

        const strict = pool.filter(m =>
            typeof m.globalScore === 'number' && m.globalScore >= scoreFloor &&
            typeof m.popularity === 'number' && m.popularity <= popularityCeiling
        );

        // Backfill from the rest of the pool (best score first) if the
        // strict filter came up short — better a full row than an
        // under-filled one, same "graceful degrade" pattern used
        // elsewhere in this project.
        if (strict.length < limit) {
            const usedIds = new Set(strict.map(m => m.id));
            const backfill = pool
                .filter(m => !usedIds.has(m.id))
                .sort((a, b) => (b.globalScore || 0) - (a.globalScore || 0));
            results = [...strict, ...backfill].slice(0, limit);
        } else {
            results = strict.slice(0, limit);
        }

        await writeCache(cacheKey, results);
    } catch (e) {
        console.warn('[landing/fetch.js] fetchHiddenGems failed:', e.message);
        return [];
    }
    return results;
}

export async function fetchNewReleases(limit = 10) {
    const cacheKey = todayCacheKey('newReleases');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    let results = [];
    try {
        // GENUINELY DEGRADED — see file header. No date field is
        // available client-side to sort by, so this only filters to
        // currently-releasing titles with whatever order the engine
        // returns; it is NOT guaranteed to be newest-first. Tracked in
        // the Backend Update List.
        const pool = await fetchAndNormalize('new manga releases', {
            status: 'RELEASING',
            page: 1,
            perPage: limit
        });
        results = pool.slice(0, limit);
        await writeCache(cacheKey, results);
    } catch (e) {
        console.warn('[landing/fetch.js] fetchNewReleases failed:', e.message);
        return [];
    }
    return results;
}

export async function fetchMostAwaited(limit = 10) {
    const cacheKey = todayCacheKey('mostAwaited');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    let results = [];
    try {
        // Engine only recognizes sort:'rating', not 'popularity' — fetch
        // a wider not-yet-released pool and sort by popularity locally.
        const pool = await fetchAndNormalize('most anticipated upcoming manga', {
            status: 'NOT_YET_RELEASED',
            page: 1,
            perPage: Math.max(limit * 3, 30)
        });
        results = pool.slice().sort(byPopularityDesc).slice(0, limit);
        await writeCache(cacheKey, results);
    } catch (e) {
        console.warn('[landing/fetch.js] fetchMostAwaited failed:', e.message);
        return [];
    }
    return results;
}

export async function fetchShortReads(limit = 10, minChapters = 1, maxChapters = 40) {
    const cacheKey = todayCacheKey('shortReads');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    let results = [];
    try {
        // filters.maxChapters is accepted by the engine but confirmed
        // dead server-side (no adapter reads it) — fetch a wider pool
        // sorted by rating and filter by parsed chapter count locally.
        const pool = await fetchAndNormalize('short completed manga series', {
            sort: 'rating',
            page: 1,
            perPage: Math.max(limit * 4, 40)
        });

        const strict = pool.filter(m => {
            const ch = parseChapters(m);
            return ch !== null && ch >= minChapters && ch <= maxChapters;
        });

        if (strict.length < limit) {
            const usedIds = new Set(strict.map(m => m.id));
            const backfill = pool.filter(m => !usedIds.has(m.id));
            results = [...strict, ...backfill].slice(0, limit);
        } else {
            results = strict.slice(0, limit);
        }

        await writeCache(cacheKey, results);
    } catch (e) {
        console.warn('[landing/fetch.js] fetchShortReads failed:', e.message);
        return [];
    }
    return results;
}

export async function fetchLandingFeeds() {
    const [trending, hiddenGems, newReleases, mostAwaited, shortReads] = await Promise.all([
        fetchTrendingToday(),
        fetchHiddenGems(),
        fetchNewReleases(),
        fetchMostAwaited(),
        fetchShortReads()
    ]);
    return { trending, hiddenGems, newReleases, mostAwaited, shortReads };
}
