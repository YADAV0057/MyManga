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
        // NOTE: the engine hard-rejects an empty query string with a 400
        // (confirmed live — "wiring search engine" Notion log, Entry 26).
        // This browse has no genres/mood to derive a query from, so we
        // send a fixed non-empty term. It isn't paired with any
        // filters.genres here, so it can't trigger the genre/query
        // saturation issue flagged for Mixer (Entry 26) — sort:'rating'
        // does all the real work.
        const data = await postToSearchEngine({
            domain: 'manga',
            query: 'top rated manga',
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

        // Bail out quietly if the user already started a real search while
        // this was in flight — don't stomp on it with stale picks.
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
