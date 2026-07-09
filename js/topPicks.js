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
// Isolation note: self-contained like landing/ and mixerPage.js — only
// imports project infrastructure (firebase.js, anilist.js,
// resultNormalizer.js, searchPlanner.js) and renderer.js's renderMangaCard
// (which already knows how to append into #community-grid).

import { db, doc, getDoc, setDoc } from './firebase.js';
import { fetchFromAniListUnified } from './anilist.js';
import { normalizeResult } from './resultNormalizer.js';
import { buildPlanFromGenreList } from './parser/searchPlanner.js';
import { renderMangaCard } from './renderer.js';
import { renderSkeletonLoaders } from './search.js';

const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const PICKS_COUNT = 15;
const PAGE_POOL = 15; // how many AniList pages of "top rated" we rotate across

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

export async function fetchTodaysTopPicks(limit = PICKS_COUNT) {
    const key = currentWindowKey();
    const cached = await readCache(key);
    if (cached) return cached;

    // Plain "top rated" browse — no genres, no free text — sorted by
    // SCORE_DESC (anilist.js maps plan.filters.sort === 'rating' to that).
    // Deliberately no popularity ceiling here (unlike landing/fetch.js's
    // Hidden Gems), so this reads as "the best of everything" rather than
    // duplicating either the Trending or Hidden Gems rows.
    const plan = buildPlanFromGenreList([]);
    plan.filters.sort = 'rating';

    const page = seededPage(key);

    let results = [];
    try {
        const raw = await fetchFromAniListUnified(plan, page, false, limit);
        results = raw.map(m => normalizeResult(m, 'AniList'));
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
