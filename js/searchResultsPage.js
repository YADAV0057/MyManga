// ==========================================
// SEARCH RESULTS PAGE (js/searchResultsPage.js) 
// ==========================================
// STEP 7b built the page shell and a single first page of real results
// (fixed-overlay pattern, re-parenting cards out of #community-grid).
//
// STEP 7c adds pagination on top of that: a "Next Page" button that calls
// search.js's triggerSearch(query, page+1, appendMode=true) — the plumbing
// 7a added specifically for this — and moves each newly-rendered batch of
// cards into this page's own grid too, appending rather than replacing.
// currentPage/hasMoreResults/isLoadingMore are page-local state that only
// exists while this view is open; they reset every time openSearchResultsPage()
// runs. runSearch()'s return value ({ appended, hasMore }) is what drives
// the button's enabled/disabled state and the "no more results" end case —
// see search.js STEP 7a for how hasMore is derived (full page ⇒ probably
// more, partial/empty page ⇒ last page).
//
// Deliberately does NOT reimplement any search logic. The NLU intent
// pipeline, multi-source waterfall, and mood-vector scoring all live in
// search.js's runSearch(). That function still renders into the homepage's
// #community-grid though (search.js itself isn't touched again here) — so
// once a search resolves, this page re-parents (moves, not clones) the
// freshly-rendered card elements from #community-grid into its own grid.
// That's what "moves search results off the homepage grid onto this
// dedicated page" means concretely at this step. Once 7d rewires the
// actual submit button / index.html to open this page directly, the
// homepage grid won't have had anything rendered into it in the first
// place for a typed search — this move step is what makes that transition
// safe in the meantime, since nothing gets left behind or duplicated on
// the homepage grid when the user backs out.
//
// Isolation note: no imports needed. Header text is set via textContent
// (auto-escaping), and everything else is read off `window.triggerSearch`,
// which main.js already assigns from search.js's exported triggerSearch.

const VIEW_ID = 'search-results-view';
const SOURCE_GRID_ID = 'community-grid'; // where search.js's runSearch renders
const OWN_GRID_ID = 'search-results-grid';

let currentQuery = '';
let currentPage = 1;
let hasMoreResults = false;
let isLoadingMore = false;
let totalLoadedCount = 0;

function ensureViewEl() {
    let el = document.getElementById(VIEW_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = VIEW_ID;
        el.className = 'results-page-view';
        document.body.appendChild(el);
        el.innerHTML = buildMarkup();
        wireStaticEvents(el);
    }
    return el;
}

function buildMarkup() {
    return `
        <div class="results-page-scroll">
            <button class="results-page-back-btn" id="results-page-back-btn" aria-label="Back">‹</button>

            <div class="results-page-header">
                <h1 id="results-page-title">Search results</h1>
                <p class="results-page-count" id="results-page-count"></p>
            </div>

            <div class="grid" id="${OWN_GRID_ID}"></div>

            <div class="results-page-pagination">
                <button class="vibe-btn results-page-nextpage-btn" id="results-page-nextpage-btn" style="display:none;">Next Page</button>
                <p class="results-page-end-msg" id="results-page-end-msg" style="display:none;">No more results.</p>
            </div>
        </div>
    `;
}

function wireStaticEvents(root) {
    root.querySelector('#results-page-back-btn')?.addEventListener('click', closeSearchResultsPage);
    root.querySelector('#results-page-nextpage-btn')?.addEventListener('click', loadNextPage);
}

// Same skeleton-card markup as search.js's renderSkeletonLoaders(), just
// targeting this page's own grid instead of #community-grid.
function renderSkeletons(count = 12) {
    const grid = document.getElementById(OWN_GRID_ID);
    if (!grid) return;
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton-cover"></div>
                <div class="skeleton-info">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-meta" style="margin-top:5px;margin-bottom:12px;"></div>
                    <div class="skeleton-line skeleton-text"></div>
                    <div class="skeleton-line skeleton-text"></div>
                    <div class="skeleton-line skeleton-text-short"></div>
                </div>
            </div>`;
    }
    grid.innerHTML = html;
}

function setHeader(query, statusText) {
    const titleEl = document.getElementById('results-page-title');
    const countEl = document.getElementById('results-page-count');
    if (titleEl) {
        titleEl.textContent = query ? `Results for "${query}"` : 'Search results';
    }
    if (countEl) countEl.textContent = statusText || '';
}

// Moves whatever runSearch just rendered into #community-grid onto this
// page's own grid. `mode: 'replace'` clears the destination first (first
// page / a fresh search); `mode: 'append'` leaves existing cards alone and
// adds the new ones after them (Next Page). Returns how many `.manga-card`
// nodes were moved, which is what driven the "N results" / hasMore logic —
// deliberately not trusting runSearch's `appended` count on its own, since
// that number is pre-filter (chapter-count filters can drop items after
// the fact) and this is the true count of what actually landed on screen.
function moveResultsIntoOwnGrid(mode) {
    const grid = document.getElementById(OWN_GRID_ID);
    const sourceGrid = document.getElementById(SOURCE_GRID_ID);
    if (!grid) return 0;

    if (mode === 'replace') grid.innerHTML = '';

    let movedCount = 0;
    if (sourceGrid) {
        Array.from(sourceGrid.children).forEach(child => {
            grid.appendChild(child); // appendChild on an existing node re-parents it
            if (child.classList?.contains('manga-card')) movedCount++;
        });
    }
    return movedCount;
}

function updatePaginationUI() {
    const btn = document.getElementById('results-page-nextpage-btn');
    const endMsg = document.getElementById('results-page-end-msg');
    if (!btn || !endMsg) return;

    if (isLoadingMore) {
        btn.style.display = '';
        btn.disabled = true;
        btn.textContent = 'Loading…';
        endMsg.style.display = 'none';
        return;
    }

    if (hasMoreResults) {
        btn.style.display = '';
        btn.disabled = false;
        btn.textContent = 'Next Page';
        endMsg.style.display = 'none';
    } else {
        btn.style.display = 'none';
        // Only announce "no more results" once there's actually something
        // on screen — an empty first page already has its own empty-state
        // message from setHeader(), no need to double up.
        endMsg.style.display = totalLoadedCount > 0 ? '' : 'none';
    }
}

async function loadFirstPage(query) {
    const grid = document.getElementById(OWN_GRID_ID);
    if (!grid) return;

    currentPage = 1;
    hasMoreResults = false;
    isLoadingMore = false;
    totalLoadedCount = 0;

    setHeader(query, 'Searching…');
    grid.innerHTML = '';
    renderSkeletons();
    updatePaginationUI();

    if (typeof window.triggerSearch !== 'function') {
        setHeader(query, "Search isn't ready yet — try again in a moment.");
        grid.innerHTML = '';
        return;
    }

    const result = await window.triggerSearch(query, 1);

    // search.js's runSearch (still targeting #community-grid as of this
    // step) has now rendered the first page of cards, or an empty-state /
    // did-you-mean block, into the homepage grid. Move every one of those
    // nodes onto this page's own grid rather than cloning them, so
    // nothing is left duplicated on the homepage grid underneath.
    const movedCount = moveResultsIntoOwnGrid('replace');
    totalLoadedCount = movedCount;
    hasMoreResults = Boolean(result?.hasMore) && movedCount > 0;

    setHeader(
        query,
        movedCount > 0
            ? `${movedCount} result${movedCount === 1 ? '' : 's'}`
            : (grid.children.length > 0 ? '' : 'No results found.')
    );
    updatePaginationUI();
}

async function loadNextPage() {
    if (isLoadingMore || !hasMoreResults) return;
    if (typeof window.triggerSearch !== 'function') return;

    isLoadingMore = true;
    updatePaginationUI();

    const nextPage = currentPage + 1;
    let result;
    try {
        result = await window.triggerSearch(currentQuery, nextPage, true);
    } catch (e) {
        console.warn('[searchResultsPage.js] loadNextPage failed:', e?.message);
        result = { appended: 0, hasMore: false };
    }

    const movedCount = moveResultsIntoOwnGrid('append');
    currentPage = nextPage;
    totalLoadedCount += movedCount;
    // Trust the grid over the raw appended count (see moveResultsIntoOwnGrid),
    // but still fall back to runSearch's own hasMore signal so a page that's
    // fully filtered out by chapter-count filters doesn't get treated as
    // "definitely no more results ever" on a single empty page.
    hasMoreResults = movedCount > 0 && Boolean(result?.hasMore);

    setHeader(currentQuery, `${totalLoadedCount} result${totalLoadedCount === 1 ? '' : 's'}`);
    isLoadingMore = false;
    updatePaginationUI();
}

export function openSearchResultsPage(query) {
    currentQuery = typeof query === 'string' ? query : '';
    const view = ensureViewEl();

    void view.offsetWidth; // force reflow so the open transition plays
    view.classList.add('open');
    document.body.classList.add('search-results-open');
    view.querySelector('.results-page-scroll')?.scrollTo(0, 0);

    loadFirstPage(currentQuery);
}

export function closeSearchResultsPage() {
    const view = document.getElementById(VIEW_ID);
    if (!view) return;
    view.classList.remove('open');
    document.body.classList.remove('search-results-open');
}

// Exposed for anything outside this module that needs to know what's
// currently open on the results page (e.g. 7d's wiring, or a future
// "share this search" affordance). loadNextPage() above uses the
// module-local currentQuery directly rather than calling this.
export function getCurrentResultsQuery() {
    return currentQuery;
}
