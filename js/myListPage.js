// ==========================================
// MY LIST PAGE (js/myListPage.js)
// ==========================================
// STEP 5: the ♡ "My List" button used to just swap the homepage grid's
// contents in place (see main.js's old setupViewToggle/renderFavoritesView
// — removed as part of this step, since this page replaces that flow
// entirely; see Step 6 notes in main.js). This is the dedicated page it
// opens into instead: your saved favorites, plus a "Recommended for you"
// row of popular manga that rotates hourly (same TTL-cache-keyed-by-time-
// window pattern as topPicks.js, just a 1-hour window instead of 12), with
// a "Recommend More" button to force a fresh batch on demand.
//
// Isolation note: same self-contained pattern as topPicks.js/mixerPage.js.
// Only imports project infrastructure (firebase.js, anilist.js,
// resultNormalizer.js, searchPlanner.js), favorites.js's getAllFavorites
// (pure data read), and renderer.js's getMangaCardHTML (pure string
// builder — used instead of renderMangaCard since this page has two
// separate grids, not the single #community-grid renderMangaCard targets).

import { db, doc, getDoc, setDoc } from './firebase.js';
import { fetchFromAniListUnified } from './anilist.js';
import { normalizeResult } from './resultNormalizer.js';
import { buildPlanFromGenreList } from './parser/searchPlanner.js';
import { getMangaCardHTML } from './renderer.js';
import { getAllFavorites } from './favorites.js';

const VIEW_ID = 'mylist-view';
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour
const REC_COUNT = 12;
const PAGE_POOL = 20;

// e.g. "myListRecs:2026-07-09T14" — changes every hour on the hour, giving
// the requested "changes every 1 hour" rotation for anyone who didn't hit
// "Recommend More" themselves.
function hourWindowKey() {
    return `myListRecs:${new Date().toISOString().slice(0, 13)}`;
}

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
        console.warn('[myListPage.js] cache read failed:', e.message);
        return null;
    }
}

async function writeCache(key, results) {
    if (!db) return;
    try {
        await setDoc(doc(db, 'cache', key), { results, cachedAt: Date.now() });
    } catch (e) {
        console.warn('[myListPage.js] cache write failed:', e.message);
    }
}

/**
 * @param {boolean} forceNew - true when the user tapped "Recommend More":
 *   skips the cache read and picks a genuinely random page instead of the
 *   window's deterministic one, then overwrites the cache with the result
 *   so a reload in the same hour keeps showing what they just picked.
 */
async function fetchRecommendations(forceNew = false) {
    const key = hourWindowKey();

    if (!forceNew) {
        const cached = await readCache(key);
        if (cached) return cached;
    }

    const plan = buildPlanFromGenreList([]); // plain popularity browse
    const page = forceNew ? (Math.floor(Math.random() * PAGE_POOL) + 1) : seededPage(key);

    let results = [];
    try {
        // fetch a few extra so filtering out already-favorited titles below
        // still leaves a full row
        const raw = await fetchFromAniListUnified(plan, page, false, REC_COUNT + 6);
        results = raw.map(m => normalizeResult(m, 'AniList'));
    } catch (e) {
        console.warn('[myListPage.js] fetchRecommendations failed:', e.message);
        return [];
    }

    const favIds = new Set(getAllFavorites().map(f => String(f.id)));
    results = results.filter(r => !favIds.has(String(r.id))).slice(0, REC_COUNT);

    if (results.length > 0) await writeCache(key, results);
    return results;
}

function ensureViewEl() {
    let el = document.getElementById(VIEW_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = VIEW_ID;
        el.className = 'mylist-view';
        document.body.appendChild(el);
        el.innerHTML = buildMarkup();
        wireStaticEvents(el);
    }
    return el;
}

function buildMarkup() {
    return `
        <div class="mylist-scroll">
            <button class="mylist-back-btn" id="mylist-back-btn" aria-label="Back">‹</button>

            <div class="mylist-header">
                <h1>♥ My List</h1>
                <p>Everything you've saved, plus a few we think you'll like.</p>
            </div>

            <section class="mylist-section">
                <h2>Saved</h2>
                <div class="grid" id="mylist-fav-grid"></div>
            </section>

            <section class="mylist-section">
                <div class="mylist-rec-header">
                    <h2>Recommended for you</h2>
                    <button class="mylist-recommend-btn" id="mylist-recommend-btn">🔁 Recommend More</button>
                </div>
                <div class="grid" id="mylist-rec-grid"></div>
            </section>
        </div>
    `;
}

function renderCardsInto(gridId, items, emptyMessage) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    grid.innerHTML = '';

    if (!items || items.length === 0) {
        grid.innerHTML = `<p class="mylist-empty">${emptyMessage}</p>`;
        return;
    }

    items.forEach(item => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = getMangaCardHTML(item).trim();
        if (wrapper.firstElementChild) grid.appendChild(wrapper.firstElementChild);
    });
}

function renderRecSkeletons() {
    const grid = document.getElementById('mylist-rec-grid');
    if (!grid) return;
    let html = '';
    for (let i = 0; i < 6; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton-cover"></div>
                <div class="skeleton-info">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-meta" style="margin-top:5px;margin-bottom:12px;"></div>
                    <div class="skeleton-line skeleton-text"></div>
                </div>
            </div>`;
    }
    grid.innerHTML = html;
}

async function loadRecommendations(forceNew = false) {
    const btn = document.getElementById('mylist-recommend-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Finding more…'; }
    renderRecSkeletons();

    const results = await fetchRecommendations(forceNew);
    renderCardsInto('mylist-rec-grid', results, "Couldn't load recommendations right now — try again in a bit.");

    if (btn) { btn.disabled = false; btn.textContent = '🔁 Recommend More'; }
}

function refreshFavoritesSection() {
    const favorites = getAllFavorites();
    renderCardsInto('mylist-fav-grid', favorites, 'Nothing saved yet — tap ♡ on any card to add it here.');
}

function wireStaticEvents(root) {
    root.querySelector('#mylist-back-btn')?.addEventListener('click', closeMyListPage);
    root.querySelector('#mylist-recommend-btn')?.addEventListener('click', () => loadRecommendations(true));
}

export function openMyListPage() {
    const view = ensureViewEl();

    // Favorites can change between opens (or while this page is closed),
    // so this always re-reads them fresh; recommendations use the hourly
    // cache and only refetch when it's actually stale.
    refreshFavoritesSection();
    loadRecommendations(false);

    void view.offsetWidth; // force reflow so the transition plays
    view.classList.add('open');
    document.body.classList.add('mylist-open');
    view.querySelector('.mylist-scroll')?.scrollTo(0, 0);
}

export function closeMyListPage() {
    const view = document.getElementById(VIEW_ID);
    if (!view) return;
    view.classList.remove('open');
    document.body.classList.remove('mylist-open');
}
