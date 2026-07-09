 
// ==========================================
// js/advancedFilter/index.js
// ==========================================
// SINGLE ENTRY POINT for the whole Advanced Filter feature, isolated the
// same way js/landing/ is: fetching (fetchAll.js), merging/dedup/filtering
// (merge.js), form UI (formUI.js), and grid rendering (render.js) all live
// inside this folder, plus its own self-injected stylesheet. If this page
// breaks, the fix happens entirely here — nothing else in the codebase is
// touched or affected.
//
// main.js only needs to import this file and wire two exports to window
// (openAdvancedFilter / closeAdvancedFilter), the same pattern already used
// for mixerPage.js / myListPage.js / mangaDetail.js.
//
// Deliberately does NOT go through search.js's runSearch(), buildIntent(),
// or searchPlanner.js — see fetchAll.js's header comment for why that's
// safe. This page queries every source directly and combines results,
// rather than stopping at the first tier that responds.
import { buildFormMarkup, wireFormEvents, resetForm, readFilterState } from './formUI.js';
import { fetchAllSources } from './fetchAll.js';
import { mergeSources, applyPostFilters, sortResults } from './merge.js';
import { showSkeletons, renderResultsGrid } from './render.js';

const VIEW_ID = 'advanced-filter-view';
const GRID_ID = 'adv-results-grid';

const STYLE_ID = 'advanced-filter-styles';
const STYLE_HREF = new URL('./css/advancedFilter.css', import.meta.url).href;

function injectStylesheetOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = STYLE_HREF;
    document.head.appendChild(link);
}

// Page-local state — resets to a fresh search every time "Apply Filters" is
// pressed; only used while this view is open, same lifecycle as
// searchResultsPage.js's currentPage/hasMoreResults.
let lastState = null;
let currentPage = 1;
let isLoading = false;
let shownTitleKeys = new Set();

function ensureViewEl() {
    let el = document.getElementById(VIEW_ID);
    if (!el) {
        injectStylesheetOnce();
        el = document.createElement('div');
        el.id = VIEW_ID;
        el.className = 'adv-filter-view';
        document.body.appendChild(el);
        el.innerHTML = buildMarkup();
        wireEvents(el);
    }
    return el;
}

function buildMarkup() {
    return `
        <div class="adv-filter-scroll">
            <button class="adv-back-btn" id="adv-back-btn" aria-label="Back">‹</button>
            <div class="adv-filter-header">
                <h1>🔎 Advanced Filter</h1>
                <p>Search every source directly — no mood engine, just raw filters.</p>
            </div>

            <form id="adv-filter-form" onsubmit="return false;">
                ${buildFormMarkup()}
            </form>

            <div class="adv-results-header" id="adv-results-header">
                <h2>Results</h2>
                <p class="adv-results-count" id="adv-results-count"></p>
            </div>
            <div class="grid" id="${GRID_ID}"></div>

            <div class="adv-pagination">
                <button class="adv-btn adv-btn-primary" id="adv-load-more-btn" style="display:none;">Load More</button>
                <p class="adv-end-msg" id="adv-end-msg" style="display:none;">No more results.</p>
            </div>
        </div>
    `;
}

function wireEvents(root) {
    root.querySelector('#adv-back-btn')?.addEventListener('click', closeAdvancedFilter);
    root.querySelector('#adv-apply-btn')?.addEventListener('click', () => runFilterSearch(root));
    root.querySelector('#adv-load-more-btn')?.addEventListener('click', () => loadMore(root));
    wireFormEvents(root);
}

function setResultsCount(n) {
    const el = document.getElementById('adv-results-count');
    if (el) el.textContent = n > 0 ? `${n} result${n === 1 ? '' : 's'}` : '';
}

function updatePaginationUI(hasMore) {
    const btn = document.getElementById('adv-load-more-btn');
    const endMsg = document.getElementById('adv-end-msg');
    if (!btn || !endMsg) return;

    if (isLoading) {
        btn.style.display = '';
        btn.disabled = true;
        btn.textContent = 'Loading…';
        endMsg.style.display = 'none';
        return;
    }

    btn.disabled = false;
    btn.textContent = 'Load More';
    btn.style.display = hasMore ? '' : 'none';
    endMsg.style.display = hasMore ? 'none' : '';
}

async function runFilterSearch(root) {
    if (isLoading) return;
    isLoading = true;

    lastState = readFilterState(root);
    currentPage = 1;
    shownTitleKeys = new Set();

    const grid = document.getElementById(GRID_ID);
    showSkeletons(grid, 12);
    document.getElementById('adv-results-header')?.scrollIntoView?.({ behavior: 'smooth' });

    try {
        const bySource = await fetchAllSources(lastState, currentPage);
        let merged = mergeSources(bySource);
        merged = applyPostFilters(merged, lastState);
        merged = sortResults(merged, lastState.sort);

        merged.forEach(r => shownTitleKeys.add(String(r.id)));
        renderResultsGrid(grid, merged, 'replace');
        setResultsCount(merged.length);
        updatePaginationUI(merged.length >= 10); // heuristic: a thin first page is probably the last page
    } catch (e) {
        console.error('[advancedFilter] Search failed:', e);
        renderResultsGrid(grid, [], 'replace');
        setResultsCount(0);
        updatePaginationUI(false);
    } finally {
        isLoading = false;
    }
}

async function loadMore(root) {
    if (isLoading || !lastState) return;
    isLoading = true;
    updatePaginationUI(true);

    currentPage += 1;
    const grid = document.getElementById(GRID_ID);

    try {
        const bySource = await fetchAllSources(lastState, currentPage);
        let merged = mergeSources(bySource);
        merged = applyPostFilters(merged, lastState);
        merged = sortResults(merged, lastState.sort);

        // Drop anything already on screen (either an exact repeat from the
        // same source, or the same title surfacing again from a different
        // source's next page) before appending.
        const freshOnly = merged.filter(r => !shownTitleKeys.has(String(r.id)));
        freshOnly.forEach(r => shownTitleKeys.add(String(r.id)));

        renderResultsGrid(grid, freshOnly, 'append');
        setResultsCount(shownTitleKeys.size);
        updatePaginationUI(merged.length >= 10);
    } catch (e) {
        console.error('[advancedFilter] Load more failed:', e);
        updatePaginationUI(false);
    } finally {
        isLoading = false;
    }
}

export function openAdvancedFilter() {
    const el = ensureViewEl();
    document.body.classList.add('advanced-filter-open');
    requestAnimationFrame(() => el.classList.add('open'));
}

export function closeAdvancedFilter() {
    const el = document.getElementById(VIEW_ID);
    if (el) el.classList.remove('open');
    document.body.classList.remove('advanced-filter-open');
}
