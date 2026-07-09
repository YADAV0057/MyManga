// ==========================================
// js/advancedFilter/formUI.js
// ==========================================
// Pure markup + state-reading for the Advanced Filter form. No fetching, no
// merging, no card rendering — those live in fetchAll.js / merge.js /
// render.js. This file only knows how to (a) draw the form and (b) read
// whatever's currently selected in it into a plain filter-state object.
//
// Deliberately bypasses the mood/NLU engine entirely: nothing here imports
// parser/pipeline.js, parser/searchPlanner.js, or moods.js. The filter
// state this produces is turned into an adapter-ready "plan" object by
// fetchAll.js's buildPlanFromFilterState(), which just hand-builds the same
// { cleanQuery, primaryGenres, secondaryThemes, excludedGenres, filters }
// shape the adapters already expect — the same trick buildPlanFromGenreList()
// in parser/searchPlanner.js uses for preset buttons.

export const GENRE_OPTIONS = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
    'Sports', 'Supernatural', 'Thriller', 'Mecha', 'Music', 'Mahou Shoujo'
];

export const STATUS_OPTIONS = [
    { value: '', label: 'Any status' },
    { value: 'RELEASING', label: 'Releasing' },
    { value: 'FINISHED', label: 'Completed' },
    { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
    { value: 'HIATUS', label: 'On hiatus' },
    { value: 'CANCELLED', label: 'Cancelled' }
];

export const SORT_OPTIONS = [
    { value: 'popularity', label: 'Popularity' },
    { value: 'rating', label: 'Rating' }
];

// Selected genre chips are tracked as Sets, module-local to this page (same
// pattern as mixerPage.js's selectedGenres) — not shared with the homepage
// mood grid or the mixer's own selection state.
let includeGenres = new Set();
let excludeGenres = new Set();

function genreChipsMarkup(groupName, selectedSet) {
    return GENRE_OPTIONS.map(g => `
        <button type="button" class="adv-chip"
                data-group="${groupName}" data-genre="${g}">${g}</button>
    `).join('');
}

export function buildFormMarkup() {
    return `
        <div class="adv-card">
            <h3>Search</h3>
            <input type="text" id="adv-query" class="adv-input" placeholder="Search by title...">
        </div>

        <div class="adv-card">
            <h3>Status &amp; Sort</h3>
            <label class="adv-label" for="adv-status">Status</label>
            <select id="adv-status" class="adv-select">
                ${STATUS_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
            </select>
            <label class="adv-label" for="adv-sort">Sort by</label>
            <select id="adv-sort" class="adv-select">
                ${SORT_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
            </select>
        </div>

        <div class="adv-card">
            <h3>Include Genres</h3>
            <p class="adv-hint">Only show series that match at least one selected genre.</p>
            <div class="adv-chip-row" id="adv-include-genres">${genreChipsMarkup('include', includeGenres)}</div>
        </div>

        <div class="adv-card">
            <h3>Exclude Genres</h3>
            <p class="adv-hint">Hide series that contain any of these genres.</p>
            <div class="adv-chip-row" id="adv-exclude-genres">${genreChipsMarkup('exclude', excludeGenres)}</div>
        </div>

        <div class="adv-card">
            <h3>Chapter Count</h3>
            <p class="adv-hint">Target on-going binges (high min) or short completed reads (low max).</p>
            <div class="adv-row">
                <label class="adv-label" for="adv-min-chapters">Min chapters</label>
                <input type="number" id="adv-min-chapters" class="adv-input adv-input-small" min="0" placeholder="0">
            </div>
            <div class="adv-row">
                <label class="adv-label" for="adv-max-chapters">Max chapters</label>
                <input type="number" id="adv-max-chapters" class="adv-input adv-input-small" min="0" placeholder="Any">
            </div>
        </div>

        <div class="adv-card">
            <h3>Minimum Rating</h3>
            <p class="adv-hint">Filter out low-rated series.</p>
            <div class="adv-row">
                <input type="range" id="adv-min-rating" class="adv-slider" min="0" max="100" step="5" value="0">
                <span class="adv-slider-value" id="adv-min-rating-value">Any</span>
            </div>
        </div>

        <div class="adv-card">
            <h3>Extra Options</h3>
            <label class="adv-checkbox"><input type="checkbox" id="adv-only-completed"> Only completed series</label>
            <label class="adv-checkbox"><input type="checkbox" id="adv-min-50"> At least 50+ chapters</label>
            <label class="adv-checkbox"><input type="checkbox" id="adv-hide-hiatus"> Hide long hiatus titles</label>
        </div>

        <div class="adv-actions">
            <button type="button" class="adv-btn adv-btn-primary" id="adv-apply-btn">Apply Filters</button>
            <button type="button" class="adv-btn adv-btn-ghost" id="adv-reset-btn">Reset</button>
        </div>
    `;
}

// Wires the chip toggles + the min-rating slider's live label. Genre chips
// use event delegation on their row container, same click-to-toggle pattern
// as mixerPage.js's mood chips.
export function wireFormEvents(root) {
    root.querySelector('#adv-include-genres')?.addEventListener('click', (e) => {
        const chip = e.target.closest('.adv-chip');
        if (!chip) return;
        toggleChip(chip, includeGenres);
    });

    root.querySelector('#adv-exclude-genres')?.addEventListener('click', (e) => {
        const chip = e.target.closest('.adv-chip');
        if (!chip) return;
        toggleChip(chip, excludeGenres);
    });

    const ratingSlider = root.querySelector('#adv-min-rating');
    const ratingValue = root.querySelector('#adv-min-rating-value');
    ratingSlider?.addEventListener('input', () => {
        const v = Number(ratingSlider.value);
        if (ratingValue) ratingValue.textContent = v === 0 ? 'Any' : `${v}%`;
    });

    root.querySelector('#adv-reset-btn')?.addEventListener('click', () => resetForm(root));
}

function toggleChip(chip, set) {
    const genre = chip.dataset.genre;
    const isSelected = chip.classList.toggle('selected');
    if (isSelected) set.add(genre); else set.delete(genre);
}

export function resetForm(root) {
    includeGenres = new Set();
    excludeGenres = new Set();
    root.querySelectorAll('.adv-chip.selected').forEach(c => c.classList.remove('selected'));
    root.querySelector('#adv-query').value = '';
    root.querySelector('#adv-status').value = '';
    root.querySelector('#adv-sort').value = 'popularity';
    root.querySelector('#adv-min-chapters').value = '';
    root.querySelector('#adv-max-chapters').value = '';
    root.querySelector('#adv-min-rating').value = 0;
    root.querySelector('#adv-min-rating-value').textContent = 'Any';
    root.querySelector('#adv-only-completed').checked = false;
    root.querySelector('#adv-min-50').checked = false;
    root.querySelector('#adv-hide-hiatus').checked = false;
}

/**
 * @param {HTMLElement} root - the advanced-filter view element
 * @returns {object} plain filter state, consumed by fetchAll.js and merge.js
 */
export function readFilterState(root) {
    const onlyCompleted = root.querySelector('#adv-only-completed').checked;
    const min50 = root.querySelector('#adv-min-50').checked;
    const minChaptersInput = parseInt(root.querySelector('#adv-min-chapters').value, 10);
    const maxChaptersInput = parseInt(root.querySelector('#adv-max-chapters').value, 10);

    return {
        query: root.querySelector('#adv-query').value.trim(),
        status: onlyCompleted ? 'FINISHED' : (root.querySelector('#adv-status').value || null),
        sort: root.querySelector('#adv-sort').value,
        includeGenres: Array.from(includeGenres),
        excludeGenres: Array.from(excludeGenres),
        minChapters: !isNaN(minChaptersInput) ? Math.max(minChaptersInput, min50 ? 50 : 0) : (min50 ? 50 : null),
        maxChapters: !isNaN(maxChaptersInput) ? maxChaptersInput : null,
        minRating: Number(root.querySelector('#adv-min-rating').value) || 0,
        hideHiatus: root.querySelector('#adv-hide-hiatus').checked
    };
}
