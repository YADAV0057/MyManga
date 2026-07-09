// ==========================================
// landing/fetch.js
// ==========================================
// Pure data layer for the landing page's always-visible rows.
// No DOM access here — this file only ever returns arrays of
// normalized manga objects (or throws/logs and returns []).
//
// Isolation note: everything this file imports comes from OUTSIDE
// the landing/ folder (../firebase.js, ../resultNormalizer.js — the
// shared project infrastructure). Everything it EXPORTS is only ever
// consumed by other files inside landing/. If AniList changes its API
// or caching breaks, the blast radius is contained to this folder.

import { db, doc, getDoc, setDoc } from '../firebase.js';
import { normalizeResult } from '../resultNormalizer.js';

const ANILIST_API = 'https://graphql.anilist.co';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

function todayCacheKey(name) {
    const day = new Date().toISOString().slice(0, 10);
    return `home:${name}:${day}`;
}

async function readCache(key) {
    if (!db) return null;
    try {
        const snap = await getDoc(doc(db, 'cache', key));
        if (!snap.exists()) return null;
        const data = snap.data();
        if (Date.now() - data.cachedAt > CACHE_TTL_MS) return null;
        return data.results;
    } catch (e) {
        console.warn('[landing/fetch.js] cache read failed:', e.message);
        return null;
    }
}

async function writeCache(key, results) {
    if (!db) return;
    try {
        await setDoc(doc(db, 'cache', key), { results, cachedAt: Date.now() });
    } catch (e) {
        console.warn('[landing/fetch.js] cache write failed:', e.message);
    }
}

async function queryAniList(query, variables, timeoutMs = 4000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(ANILIST_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables }),
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`AniList responded ${res.status}`);
        const json = await res.json();
        return json?.data?.Page?.media ?? [];
    } catch (e) {
        clearTimeout(timeout);
        throw e;
    }
}

const MEDIA_FIELDS = `
    id
    title { romaji english }
    coverImage { large color }
    genres
    averageScore
    popularity
    status
    chapters
    description(asHtml: false)
`;

// NOTE: normalizeResult's exact expected input shape should be verified
// against the real resultNormalizer.js before shipping. If it needs a
// differently-shaped object than a raw AniList `media` node, adjust the
// .map() calls below — that's the only place a shape mismatch would surface.

export async function fetchTrendingToday(limit = 10) {
    const cacheKey = todayCacheKey('trending');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    const query = `
        query ($perPage: Int) {
            Page(perPage: $perPage) {
                media(type: MANGA, sort: TRENDING_DESC, isAdult: false) {
                    ${MEDIA_FIELDS}
                    trending
                }
            }
        }
    `;

    try {
        const raw = await queryAniList(query, { perPage: limit });
        const results = raw.map(m => normalizeResult(m, 'anilist'));
        await writeCache(cacheKey, results);
        return results;
    } catch (e) {
        console.warn('[landing/fetch.js] fetchTrendingToday failed:', e.message);
        return [];
    }
}

export async function fetchHiddenGems(limit = 10, popularityCeiling = 15000) {
    const cacheKey = todayCacheKey('hiddenGems');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    const query = `
        query ($perPage: Int) {
            Page(perPage: $perPage) {
                media(
                    type: MANGA,
                    sort: SCORE_DESC,
                    averageScore_greater: 80,
                    popularity_lesser: ${popularityCeiling},
                    isAdult: false
                ) {
                    ${MEDIA_FIELDS}
                }
            }
        }
    `;

    try {
        const raw = await queryAniList(query, { perPage: limit });
        const results = raw.map(m => normalizeResult(m, 'anilist'));
        await writeCache(cacheKey, results);
        return results;
    } catch (e) {
        console.warn('[landing/fetch.js] fetchHiddenGems failed:', e.message);
        return [];
    }
}

export async function fetchNewReleases(limit = 10) {
    const cacheKey = todayCacheKey('newReleases');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    const query = `
        query ($perPage: Int) {
            Page(perPage: $perPage) {
                media(type: MANGA, sort: START_DATE_DESC, status: RELEASING, isAdult: false) {
                    ${MEDIA_FIELDS}
                }
            }
        }
    `;

    try {
        const raw = await queryAniList(query, { perPage: limit });
        const results = raw.map(m => normalizeResult(m, 'anilist'));
        await writeCache(cacheKey, results);
        return results;
    } catch (e) {
        console.warn('[landing/fetch.js] fetchNewReleases failed:', e.message);
        return [];
    }
}

export async function fetchMostAwaited(limit = 10) {
    const cacheKey = todayCacheKey('mostAwaited');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    const query = `
        query ($perPage: Int) {
            Page(perPage: $perPage) {
                media(type: MANGA, sort: POPULARITY_DESC, status: NOT_YET_RELEASED, isAdult: false) {
                    ${MEDIA_FIELDS}
                }
            }
        }
    `;

    try {
        const raw = await queryAniList(query, { perPage: limit });
        const results = raw.map(m => normalizeResult(m, 'anilist'));
        await writeCache(cacheKey, results);
        return results;
    } catch (e) {
        console.warn('[landing/fetch.js] fetchMostAwaited failed:', e.message);
        return [];
    }
}

export async function fetchShortReads(limit = 10) {
    const cacheKey = todayCacheKey('shortReads');
    const cached = await readCache(cacheKey);
    if (cached) return cached;

    const query = `
        query ($perPage: Int) {
            Page(perPage: $perPage) {
                media(type: MANGA, sort: SCORE_DESC, chapters_lesser: 40, chapters_greater: 1, isAdult: false) {
                    ${MEDIA_FIELDS}
                }
            }
        }
    `;

    try {
        const raw = await queryAniList(query, { perPage: limit });
        const results = raw.map(m => normalizeResult(m, 'anilist'));
        await writeCache(cacheKey, results);
        return results;
    } catch (e) {
        console.warn('[landing/fetch.js] fetchShortReads failed:', e.message);
        return [];
    }
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
