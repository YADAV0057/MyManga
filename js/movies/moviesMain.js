// ==========================================
// MOVIES PAGE ENTRY POINT (js/movies/moviesMain.js)
// ==========================================
// Entry point for movies.html — a real separate page/route, not an overlay
// (per the Architecture & UX Plan's explicit decision: shareable/bookmarkable
// URLs, Google-indexable, correct browser back/forward). Deliberately does
// NOT reuse main.js's module loader — this page doesn't need Firebase
// favorites, the manga AI panel, mixer, or advanced filter modules. Follows
// the same loadModule try/catch-and-log pattern as main.js for consistency,
// just scoped to what this page actually uses.

window.addEventListener('error', (e) => {
    console.error('JS ERROR:', e.message, e.filename, e.lineno);
});
window.addEventListener('unhandledrejection', (e) => {
    console.error('PROMISE ERROR:', e.reason?.message || e.reason);
});

import { triggerMovieSearch } from './movieSearch.js';
import { initMovieFilters, getActiveMovieFilters } from './movieFilters.js';

let currentQuery = '';
let currentPage = 1;
let hasMoreResults = false;
let isLoadingMore = false;
let totalLoadedCount = 0;

function setStatus(text) {
    const el = document.getElementById('movie-results-status');
    if (el) el.textContent = text;
}

function updatePaginationUI() {
    const btn = document.getElementById('movie-nextpage-btn');
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
    const result = await triggerMovieSearch(currentQuery, page, append, getActiveMovieFilters());

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
    const input = document.getElementById('movie-search-input');
    const btn = document.getElementById('movie-search-submit-btn');
    if (!input || !btn) return;

    const submit = () => runSearch(input.value.trim());
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
    });
}

function setupPagination() {
    const btn = document.getElementById('movie-nextpage-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (!isLoadingMore && hasMoreResults) runSearch(currentQuery, { append: true });
    });
}

function setupFilterApply() {
    // Filter chip/dropdown changes take effect on next search rather than
    // re-searching on every click — same "apply on submit" UX as the
    // manga app's Advanced Filter panel, avoids a flood of requests while
    // someone is still picking chips.
    const btn = document.getElementById('movie-apply-filters-btn');
    if (!btn) return;
    btn.addEventListener('click', () => runSearch(currentQuery));
}

async function initializeMoviesPage() {
    try {
        initMovieFilters(document.getElementById('movie-filter-mount'));
        setupSearchBar();
        setupPagination();
        setupFilterApply();

        // Landing state: show popular/trending movies immediately rather
        // than an empty grid, same "don't make the user search first"
        // philosophy as the manga homepage's Today's Top Picks.
        await runSearch('');
    } catch (e) {
        console.error('Movies page init failed:', e);
        setStatus('Something went wrong loading movies — try refreshing.');
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMoviesPage);
} else {
    initializeMoviesPage();
}

