// ==========================================
// SEARCH RESULTS PAGE (js/searchResultsPage.js)
// ==========================================
// STEP 7b: dedicated full-page view for search results, same fixed-overlay
// + .open-class pattern as mangaDetail.js / mixerPage.js / myListPage.js.
// This step only builds the page shell and gets a single first page of
// real results rendering on it — no pagination (7c) and no submit-button /
// index.html routing wiring (7d) yet.
//
// Deliberately does NOT reimplement any search logic. The NLU intent
// pipeline, multi-source waterfall, and mood-vector scoring all live in
// search.js's runSearch(), which STEP 7a already extended (appendMode,
// bigger PAGE_SIZE) specifically so this page could drive it. That
// function still renders into the homepage's #community-grid though
// (search.js itself isn't touched again here) — so once a search
// resolves, this page re-parents (moves, not clones) the freshly-rendered
// card elements from #community-grid into its own grid. That's what
// "moves search results off the homepage grid onto this dedicated page"
// means concretely at this step. Once 7d rewires the actual submit
// button / index.html to open this page directly, the homepage grid
// won't have had anything rendered into it in the first place for a
// typed search — this move step is what makes that transition safe in
// the meantime, since nothing gets left behind or duplicated on the
// homepage grid when the user backs out.
//
// Isolation note: no imports needed. Header text is set via textContent
// (auto-escaping), and everything else is read off `window.triggerSearch`,
// which main.js already assigns from search.js's exported triggerSearch.

const VIEW_ID = 'search-results-view';
const SOURCE_GRID_ID = 'community-grid'; // where search.js's runSearch renders
const OWN_GRID_ID = 'search-results-grid';

let currentQuery = '';

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
        </div>
    `;
}

function wireStaticEvents(root) {
    root.querySelector('#results-page-back-btn')?.addEventListener('click', closeSearchResultsPage);
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

async function loadFirstPage(query) {
    const grid = document.getElementById(OWN_GRID_ID);
    if (!grid) return;

    setHeader(query, 'Searching…');
    grid.innerHTML = '';
    renderSkeletons();

    if (typeof window.triggerSearch !== 'function') {
        setHeader(query, "Search isn't ready yet — try again in a moment.");
        grid.innerHTML = '';
        return;
    }

    await window.triggerSearch(query, 1);

    // search.js's runSearch (still targeting #community-grid as of this
    // step) has now rendered the first page of cards, or an empty-state /
    // did-you-mean block, into the homepage grid. Move every one of those
    // nodes onto this page's own grid rather than cloning them, so
    // nothing is left duplicated on the homepage grid underneath.
    const sourceGrid = document.getElementById(SOURCE_GRID_ID);
    grid.innerHTML = '';
    let movedCount = 0;
    if (sourceGrid) {
        Array.from(sourceGrid.children).forEach(child => {
            grid.appendChild(child); // appendChild on an existing node re-parents it
            if (child.classList?.contains('manga-card')) movedCount++;
        });
    }

    setHeader(
        query,
        movedCount > 0
            ? `${movedCount} result${movedCount === 1 ? '' : 's'}`
            : (grid.children.length > 0 ? '' : 'No results found.')
    );
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

// Reserved for 7c: current query needs to survive into the pagination
// step (the "Next Page" button will call window.triggerSearch(currentQuery, ...)).
export function getCurrentResultsQuery() {
    return currentQuery;
}
