// ==========================================
// TODAY'S TOP PICKS (js/topPicks.js)
// ==========================================
// STEP 4: "#community-grid" used to sit empty until the user typed a search
// or tapped a mood — the "✨ Today's Top Picks" heading above it had
// nothing backing it. This module auto-fills that grid on page load with a
// small, deterministic set of well-rated manga that changes twice a day.
//
// "Changes every 12 hours" is implemented the same way landing/fetch.js
// caches Trending Today / Hidden Gems: the cache key itself encodes a time
// window (here, which 12-hour half of the day it is), so everyone loading
// the site within that window sees the same picks, and the very next
// window automatically produces a different (but still deterministic —
// not truly random) set, without needing any kind of live in-page timer
// that could clobber an active search.
//
// REWIRED (search-engine cutover): the fetch call now goes to the new
// Supabase search engine (CONFIG.SEARCH_ENGINE_URL) instead of anilist.js
// directly. Everything else — Firestore caching, window/page seeding,
// grid rendering — is unchanged. Confirmed against the "wiring search
// engine" Notion log Entries 17/20/24: sort:'rating' + no genres is
// already fully supported, no engine gaps for this file.
//
// Isolation note: self-contained like landing/ and mixerPage.js — only
// imports project infrastructure (firebase.js, config.js,
// resultNormalizer.js) and renderer.js's renderMangaCard (which already
// knows how to append into #community-grid).

import { db, doc, getDoc, setDoc } from './firebase.js';
import { CONFIG } from './config.js';
import { normalizeResult } from './resultNormalizer.js';
import { renderMangaCard } from './renderer.js';
import { renderSkeletonLoaders } from './search.js';

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const PICKS_COUNT = 15;
const PAGE_POOL = 15; // how many result-pages of "top rated" we rotate across
const FETCH_TIMEOUT_MS = 8000;

// Satisfies the engine's `if (!query) return 400` check while normalizing
// to an empty string server-side, so the AniList adapter never attaches a
// `search:` argument — see fetchTodaysTopPicks() below. Same constant,
// same value, same reasoning as landing/fetch.js's BLANK_QUERY (kept local
// rather than imported — this file's isolation note above says it only
// pulls in firebase.js/config.js/resultNormalizer.js/renderer.js/
// search.js's renderSkeletonLoaders, and a one-line string constant isn't
// worth breaking that for).
const BLANK_QUERY = ' ';

// e.g. "topPicks:2026-07-09:AM" / "topPicks:2026-07-09:PM" — changes at
// midnight and again at noon (local time), giving the promised 2x/day rotation.
function currentWindowKey() {
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const half = now.getHours() < 12 ? 'AM' : 'PM';
    return `topPicks:${day}:${half}`;
}

// Deterministic (not random) page number derived from the window key, so
// the "auto generated" pick is stable for everyone during that window and
// only changes when the window itself changes.
function seededPage(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    return (hash % PAGE_POOL) + 1;
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
        console.warn('[topPicks.js] cache read failed:', e.message);
        return null;
    }
}

async function writeCache(key, results) {
    if (!db) return;
    try {
        await setDoc(doc(db, 'cache', key), { results, cachedAt: Date.now() });
    } catch (e) {
        console.warn('[topPicks.js] cache write failed:', e.message);
    }
}

// Small local fetch-with-timeout wrapper, same pattern landing/fetch.js's
// queryAniList() already uses — kept local rather than assuming a shared
// utils.js helper's exact signature, since that hasn't been confirmed.
async function postToSearchEngine(body, timeoutMs = FETCH_TIMEOUT_MS) {
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

export async function fetchTodaysTopPicks(limit = PICKS_COUNT) {
    const key = currentWindowKey();
    const cached = await readCache(key);
    if (cached) return cached;

    const page = seededPage(key);

    let results = [];
    try {
        // FIXED 2026-07-26: this used to send a real free-text term
        // ('top rated manga') to satisfy the engine's non-empty-query
        // check. That was wrong in a way that wasn't obvious from this
        // file alone — confirmed directly against the live AniList
        // adapter (search/adapters/anilist.js): whenever
        // plan.cleanQuery.trim().length > 0, the adapter attaches a real
        // `search: $search` GraphQL argument, COMPLETELY INDEPENDENTLY of
        // what `sort` resolves to. So even though filters.sort:'rating'
        // correctly maps to SCORE_DESC (that part was never broken), the
        // query was still "media matching the text 'top rated manga',
        // sorted by score" — not "browse the whole catalog by score" — a
        // real narrowing filter, not just a hint. Same failure mode
        // landing/fetch.js's fetchNewReleases() already hit and fixed
        // (see that file's header) for the exact same reason: this file
        // was never updated to match once that pattern was understood.
        // BLANK_QUERY (a single space) satisfies the engine's non-empty
        // check but trims to '' server-side, so freeText.length is 0 and
        // no `search` argument gets attached at all — a real top-rated
        // browse, same fix, same constant name as landing/fetch.js.
        const data = await postToSearchEngine({
            domain: 'manga',
            query: BLANK_QUERY,
            filters: {
                sort: 'rating',
                page,
                perPage: limit
            }
        });

        const raw = data.results || [];

        // Engine results are still raw per-source shapes (AniList/Jikan/
        // Kitsu/MangaDex) with finalScore/_rankDebug attached by the
        // backend's rankResults.js — normalizeResult() maps them into the
        // same UnifiedResult shape as before, just ignoring those two
        // extra fields (resultNormalizer.js doesn't read them).
        results = raw.map(m => normalizeResult(m, m.source || 'AniList'));
    } catch (e) {
        console.warn('[topPicks.js] fetchTodaysTopPicks failed:', e.message);
        return [];
    }

    if (results.length > 0) await writeCache(key, results);
    return results;
}

/**
 * Fills #community-grid with today's picks. Only runs if the grid is still
 * empty (i.e. nothing has searched/mood-clicked yet), so this never clobbers
 * an in-progress or completed user search.
 */
export async function loadTodaysTopPicks() {
    const grid = document.getElementById('community-grid');
    if (!grid || grid.children.length > 0) return;

    renderSkeletonLoaders(PICKS_COUNT);

    try {
        const results = await fetchTodaysTopPicks();

        // FLAGGED 2026-07-26, not fixed here (out of scope for this pass —
        // fixing it for real means adding a currentActiveQuery flag
        // somewhere in search.js/searchResultsPage.js and setting it when
        // a real search starts, which touches files this pass didn't
        // otherwise need to change): `window.currentActiveQuery` is never
        // actually set anywhere in the codebase (grepped the full repo —
        // this is the only reference to it). `undefined !== undefined` is
        // always false, so this check never returns early — it's dead,
        // not a working guard. In practice this hasn't caused visible
        // clobbering because loadTodaysTopPicks() is itself gated by
        // `grid.children.length > 0` at the top of the function, and nothing
        // else currently races it fast enough to matter — but that's
        // incidental, not something this check is actually providing.
        if (window.currentActiveQuery !== undefined) return;

        grid.innerHTML = '';
        if (results.length === 0) {
            grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Couldn\'t load today\'s picks — try a search instead.</p>';
            return;
        }

        results.forEach(renderMangaCard);

        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) refreshBtn.style.display = 'block';
    } catch (e) {
        console.error('[topPicks.js] loadTodaysTopPicks failed:', e);
        grid.innerHTML = '';
    }
}



