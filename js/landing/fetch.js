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
// REWIRED (sort/filter batch cutover): every feed below previously sent a
// descriptive free-text PHRASE as `query` (e.g. "acclaimed underrated
// manga", "trending manga") and hoped the engine's title/synopsis search
// would happen to return something on-theme, then did a client-side
// wide-pool-and-filter pass on top. That was a workaround for gaps that
// existed before the engine's sort/filter batch — it was never reliable
// (AniList/Jikan/Kitsu/MangaDex free-text search matches literal title and
// description text, not intent, so most of those phrases matched nothing),
// and confirmed via the server's search_cache table: 4 of 5 landing rows
// had NEVER once returned a cached (i.e. non-empty) result.
//
// FIXED: every feed now sends a blank query (a single space — satisfies
// the engine's "query is required" check but normalizes to "", so no
// adapter attaches a text-search param) plus the REAL filters the engine
// now supports (confirmed live, Supabase `search` edge function v37):
//   - Trending Today — filters.sort: 'trending' (AniList: TRENDING_DESC;
//     other 3 sources fall back to their popularity order, per-adapter).
//   - Hidden Gems     — filters.minScore + filters.maxPopularity, applied
//     server-side as a post-fetch filter (domains.js applyPostFetchFilters).
//   - Short Reads     — filters.minChapters + filters.maxChapters, same
//     post-fetch filter mechanism (maxChapters used to be accepted but
//     dead server-side — now actually applied).
//   - Most Awaited    — filters.sort: 'popularity' is now real (previously
//     only 'rating' was recognized). filters.status: 'NOT_YET_RELEASED' is
//     still sent as documented by the engine contract, though note: this
//     hasn't been verified to actually narrow results server-side (open
//     question in domains.js's buildBasicPlan — worth confirming
//     separately, not a landing/ issue).
//   - New Releases    — CORRECTED again this pass. A prior pass added
//     sort:'date' + releaseDate support and called it fixed, but it still
//     sent a real text query ("new manga releases"). AniList's adapter
//     attaches BOTH `search:` and `sort: START_DATE_DESC` when freeText is
//     non-empty — so it wasn't browsing all new releases sorted by date,
//     it was date-sorting only the handful of titles whose title/synopsis
//     happened to match that literal phrase (3, per the live cache — same
//     failure mode as the other rows, just less visibly broken). Now uses
//     BLANK_QUERY like every other feed here, so it actually browses the
//     full RELEASING pool sorted by date instead of a lucky text match.
//
// KNOWN REMAINING LIMITATION (server-side, not fixable from this file):
// domains.js's waterfall stops at the FIRST source that returns any
// filtered survivors — it doesn't keep going to Jikan/Kitsu/MangaDex to
// top a thin result set back up. Combined with a strict filter (e.g.
// maxPopularity on a sort:'rating' pool, where the highest-rated titles
// are often also the most popular), this can leave Hidden Gems / Short
// Reads with as few as 1–3 survivors even though other sources might have
// had more. Mitigated here by requesting the engine's maximum raw perPage
// (25) so the filter has the largest possible candidate pool to work
// with — but a real fix means changing the waterfall itself to accumulate
// across sources instead of stopping at the first non-empty one.
//
// ROTATION (this pass): each feed now fetches and caches a POOL of up to
// POOL_SIZE items (not just the DISPLAY_LIMIT that gets shown at once).
// `rotatingWindow()` picks a different slice of that pool every
// ROTATION_INTERVAL_MS, based on wall-clock time — so the same cached pool
// (good for up to CACHE_TTL_MS, avoiding extra network calls) still shows
// different cards over time instead of the identical top-N forever. This
// file only computes WHICH slice to show; landing/index.js owns the timer
// that re-renders with the new slice (this file has no DOM access).
// Note: rotation only has something to rotate THROUGH if the pool is
// bigger than DISPLAY_LIMIT — for a filtered row that only ever survives
// with 1–3 items, rotation can't manufacture variety that doesn't exist;
// see the waterfall limitation above.

import { db, doc, getDoc, setDoc } from '../firebase.js';
import { CONFIG } from '../config.js';
import { normalizeResult } from '../resultNormalizer.js';

const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

// The engine clamps perPage to this regardless of what we ask for
// (resolvePagination in domains.js) — request it explicitly so the
// post-fetch filters (minScore/maxPopularity/minChapters/maxChapters) get
// the largest possible raw candidate pool to work with.
const ENGINE_MAX_PER_PAGE = 25;

// How many items to fetch/cache per row, vs. how many to actually show at
// once on the page.
const POOL_SIZE = ENGINE_MAX_PER_PAGE;
const DISPLAY_LIMIT = 10;

// How often the visible slice of a cached pool rotates. Kept out of the
// render layer's hands — index.js just calls rotatingWindow() on this
// interval, it doesn't decide the cadence.
export const ROTATION_INTERVAL_MS = 1000 * 60 * 5; // 5 minutes

// Satisfies the engine's `if (!query) return 400` check while normalizing
// to an empty string server-side, so no adapter attaches a text-search
// param and every source falls through to its pure sort/filter path.
const BLANK_QUERY = ' ';

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

// Shared fetch+normalize step for every feed below. `query` defaults to
// BLANK_QUERY so callers only need to pass the filters that actually
// matter for that row.
async function fetchAndNormalize(filters, query = BLANK_QUERY) {
    const data = await postToSearchEngine({ domain: 'manga', query, filters });
    const raw = data.results || [];
    return raw.map(m => normalizeResult(m, m.source || 'AniList'));
}

// Deterministically picks a `size`-item window out of `pool`, advancing to
// the next window every ROTATION_INTERVAL_MS of wall-clock time. Same tick
// -> same window for everyone (no per-render randomness/flicker), but the
// window itself changes over time. Wraps around the pool, and wraps
// silently to the whole pool if it's smaller than `size`.
export function rotatingWindow(pool, size = DISPLAY_LIMIT) {
    if (!Array.isArray(pool) || pool.length === 0) return [];
    if (pool.length <= size) return pool;

    const tick = Math.floor(Date.now() / ROTATION_INTERVAL_MS);
    const start = tick % pool.length;

    const windowed = [];
    for (let i = 0; i < size; i++) {
        windowed.push(pool[(start + i) % pool.length]);
    }
    return windowed;
}

export async function fetchTrendingToday() {
    const cacheKey = todayCacheKey('trending');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    let pool = [];
    try {
        // Real trending signal now — engine's sort:'trending' (AniList:
        // TRENDING_DESC; other sources fall back to popularity order).
        // Fetches the full pool (up to ENGINE_MAX_PER_PAGE), not just
        // DISPLAY_LIMIT — see ROTATION note above.
        pool = await fetchAndNormalize({ sort: 'trending', page: 1, perPage: POOL_SIZE });
        await writeCache(cacheKey, pool);
    } catch (e) {
        console.warn('[landing/fetch.js] fetchTrendingToday failed:', e.message);
        return [];
    }
    return pool;
}

export async function fetchHiddenGems(popularityCeiling = 15000, scoreFloor = 80) {
    const cacheKey = todayCacheKey('hiddenGems');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    let pool = [];
    try {
        // Real minScore/maxPopularity filter now — applied server-side as
        // a post-fetch filter (domains.js applyPostFetchFilters). Requests
        // the engine's max perPage so the filter has as many raw
        // candidates as possible to survive against — see the waterfall
        // limitation noted above (this can still come back thin).
        pool = await fetchAndNormalize({
            sort: 'rating',
            minScore: scoreFloor,
            maxPopularity: popularityCeiling,
            page: 1,
            perPage: POOL_SIZE
        });
        await writeCache(cacheKey, pool);
    } catch (e) {
        console.warn('[landing/fetch.js] fetchHiddenGems failed:', e.message);
        return [];
    }
    return pool;
}

export async function fetchNewReleases() {
    const cacheKey = todayCacheKey('newReleases');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    let pool = [];
    try {
        // BLANK_QUERY — see file header. A real text query here would make
        // AniList (and the others) attach a search filter alongside the
        // date sort, narrowing the pool to literal phrase matches instead
        // of browsing all RELEASING titles by date. Engine returns a
        // `releaseDate` field on every result and recognizes
        // filters.sort: 'date' as a real newest-first sort per source.
        const data = await postToSearchEngine({
            domain: 'manga',
            query: BLANK_QUERY,
            filters: { status: 'RELEASING', sort: 'date', page: 1, perPage: POOL_SIZE }
        });
        const raw = data.results || [];

        // Normalize as usual, but also carry releaseDate through explicitly
        // rather than trusting normalizeResult() to preserve an unlisted
        // field.
        const normalized = raw.map(m => ({
            ...normalizeResult(m, m.source || 'AniList'),
            releaseDate: m.releaseDate || null
        }));

        // Belt-and-suspenders re-sort: the engine's sort:'date' should
        // already return newest-first from whichever source won the
        // waterfall, but re-sorting client-side costs nothing and covers
        // any source whose native date-sort is imperfect. Results with no
        // releaseDate are pushed to the end instead of left in whatever
        // order they arrived.
        const dated = normalized.filter(m => m.releaseDate);
        const undated = normalized.filter(m => !m.releaseDate);
        dated.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));

        pool = [...dated, ...undated];
        await writeCache(cacheKey, pool);
    } catch (e) {
        console.warn('[landing/fetch.js] fetchNewReleases failed:', e.message);
        return [];
    }
    return pool;
}

export async function fetchMostAwaited() {
    const cacheKey = todayCacheKey('mostAwaited');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    let pool = [];
    try {
        // sort:'popularity' is now real server-side (previously only
        // 'rating' was recognized, forcing a client-side popularity sort
        // on a wider pool — no longer needed).
        pool = await fetchAndNormalize({
            status: 'NOT_YET_RELEASED',
            sort: 'popularity',
            page: 1,
            perPage: POOL_SIZE
        });
        await writeCache(cacheKey, pool);
    } catch (e) {
        console.warn('[landing/fetch.js] fetchMostAwaited failed:', e.message);
        return [];
    }
    return pool;
}

export async function fetchShortReads(minChapters = 1, maxChapters = 40) {
    const cacheKey = todayCacheKey('shortReads');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    let pool = [];
    try {
        // Real minChapters/maxChapters filter now — applied server-side
        // (domains.js applyPostFetchFilters). maxChapters used to be
        // accepted into the plan but never read by any adapter; both
        // bounds are now actually enforced. Requests the engine's max
        // perPage for the same reason as Hidden Gems above.
        pool = await fetchAndNormalize({
            sort: 'rating',
            minChapters,
            maxChapters,
            page: 1,
            perPage: POOL_SIZE
        });
        await writeCache(cacheKey, pool);
    } catch (e) {
        console.warn('[landing/fetch.js] fetchShortReads failed:', e.message);
        return [];
    }
    return pool;
}

// Returns POOLS (up to POOL_SIZE items each), not the final displayed
// list — callers should run each pool through rotatingWindow() to get the
// slice to actually render, and re-run it on a ROTATION_INTERVAL_MS timer
// to rotate the display without re-fetching.
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
