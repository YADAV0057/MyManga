// ==========================================
// TV PAGE ENTRY POINT (js/tv/tvMain.js)
// ==========================================
// Entry point for tv.html — mirrors moviesMain.js exactly, one level of
// find-and-replace over (movie -> tv, Movie -> Tv). Own real page/route
// (shareable/bookmarkable URL, correct browser back/forward), not an
// overlay — same decision moviesMain.js's header documents for Movies.

window.addEventListener('error', (e) => {
    console.error('JS ERROR:', e.message, e.filename, e.lineno);
});
window.addEventListener('unhandledrejection', (e) => {
    console.error('PROMISE ERROR:', e.reason?.message || e.reason);
});

import { triggerTvSearch } from './tvSearch.js';
import { initTvFilters, getActiveTvFilters } from './tvFilters.js';
import { openTvDetail, closeTvDetail } from './tvDetail.js';
import { toggleFavorite, getAllFavorites } from '../favorites.js';

let currentQuery = '';
let currentPage = 1;
let hasMoreResults = false;
let isLoadingMore = false;
let totalLoadedCount = 0;

function setStatus(text) {
    const el = document.getElementById('tv-results-status');
    if (el) el.textContent = text;
}

function updatePaginationUI() {
    const btn = document.getElementById('tv-nextpage-btn');
    if (!btn) return;
    if (isLoadingMore) {
        btn.style.display = '';
        btn.disabled = true;
        btn.textContent = 'Loading…';
        return;
    }
    btn.style.display = hasMoreResults ? '' : 'none';
    btn.disabled = false;
    btn.textContent = 'Next Page';
}

async function runSearch(query, { append = false } = {}) {
    if (append) {
        isLoadingMore = true;
        updatePaginationUI();
    } else {
        currentQuery = query;
        currentPage = 1;
        totalLoadedCount = 0;
        setStatus('Searching…');
    }

    const page = append ? currentPage + 1 : 1;
    const result = await triggerTvSearch(currentQuery, page, append, getActiveTvFilters());

    currentPage = page;
    totalLoadedCount += result.appended;
    hasMoreResults = result.hasMore;
    isLoadingMore = false;

    setStatus(
        totalLoadedCount > 0
            ? `${totalLoadedCount} result${totalLoadedCount === 1 ? '' : 's'}${result.meta?.tier && result.meta.tier !== 'tmdb' ? ` (via ${result.meta.tier})` : ''}`
            : (currentQuery ? `No results for "${currentQuery}".` : 'No results found.')
    );
    updatePaginationUI();
}

function setupSearchBar() {
    const input = document.getElementById('tv-search-input');
    const btn = document.getElementById('tv-search-submit-btn');
    if (!input || !btn) return;

    const submit = () => runSearch(input.value.trim());
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
    });
}

function setupPagination() {
    const btn = document.getElementById('tv-nextpage-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (!isLoadingMore && hasMoreResults) runSearch(currentQuery, { append: true });
    });
}

function setupFilterApply() {
    // Filter chip/dropdown changes take effect on next search rather than
    // re-searching on every click — same "apply on submit" UX as Movies.
    const btn = document.getElementById('tv-apply-filters-btn');
    if (!btn) return;
    btn.addEventListener('click', () => runSearch(currentQuery));
}

async function initializeTvPage() {
    // Expose tv-detail + favorites so tvRenderer.js's inline
    // onclick="window.openTvDetail(...)" (and the Save button inside the
    // detail view itself) can reach these without an import cycle — same
    // pattern moviesMain.js uses.
    window.openTvDetail = openTvDetail;
    window.closeTvDetail = closeTvDetail;
    window.toggleFavorite = toggleFavorite;
    window.getAllFavorites = getAllFavorites;

    try {
        initTvFilters(document.getElementById('tv-filter-mount'));
        setupSearchBar();
        setupPagination();
        setupFilterApply();

        // Landing state: show popular/trending shows immediately rather
        // than an empty grid, same philosophy as Movies/manga homepage.
        await runSearch('');
    } catch (e) {
        console.error('TV page init failed:', e);
        setStatus('Something went wrong loading TV shows — try refreshing.');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTvPage);
} else {
    initializeTvPage();
}

