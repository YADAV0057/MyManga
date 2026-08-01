// ==========================================
// TV FILTER PANEL (js/tv/tvFilters.js)
// ==========================================
// Mirrors movieFilters.js's structure, but GENRE_OPTIONS is TMDB's TV genre
// set, not movie's — TV has no standalone Horror/Romance/Thriller/Sci-Fi
// genres; those get folded into "Sci-Fi & Fantasy" etc. Matches the
// TV_GENRE_NAME_TO_ID map added to movie-search/domains.js (2026-08-01) so
// chip clicks map to real TMDB TV genre IDs the backend already knows how
// to handle.
//
// PROVIDER_OPTIONS reused verbatim from movieFilters.js — same caveat
// applies (short curated list, IDs not all individually re-verified for
// TV; TMDB uses the same provider ID namespace for movie and TV watch
// providers, so movie's already-spot-checked IDs — see movieFilters.js's
// header note re: JioHotstar — carry over safely).
const GENRE_OPTIONS = [
    { name: 'Action & Adventure', id: 10759 }, { name: 'Comedy', id: 35 }, { name: 'Drama', id: 18 },
    { name: 'Crime', id: 80 }, { name: 'Mystery', id: 9648 }, { name: 'Sci-Fi & Fantasy', id: 10765 },
    { name: 'Animation', id: 16 }, { name: 'Documentary', id: 99 }, { name: 'Family', id: 10751 },
    { name: 'Kids', id: 10762 }, { name: 'Reality', id: 10764 }, { name: 'War & Politics', id: 10768 },
];

const LANGUAGE_OPTIONS = [
    { name: 'Any language', code: '' },
    { name: 'English', code: 'en' },
    { name: 'Hindi', code: 'hi' },
    { name: 'Japanese', code: 'ja' },
    { name: 'Korean', code: 'ko' },
    { name: 'Spanish', code: 'es' },
    { name: 'French', code: 'fr' },
];

// UNVERIFIED IDs — see movieFilters.js's header note.
const PROVIDER_OPTIONS = [
    { name: 'Netflix', id: 8 },
    { name: 'Amazon Prime Video', id: 119 },
    { name: 'Disney+', id: 337 },
    { name: 'Apple TV+', id: 350 },
];

let selectedGenres = new Set();
let selectedProviders = new Set();
let selectedLanguage = '';

function buildMarkup() {
    const genreChips = GENRE_OPTIONS.map(g =>
        `<button class="filter-chip" data-genre="${g.id}">${g.name}</button>`
    ).join('');

    const providerChips = PROVIDER_OPTIONS.map(p =>
        `<button class="filter-chip" data-provider="${p.id}">${p.name}</button>`
    ).join('');

    const languageOptions = LANGUAGE_OPTIONS.map(l =>
        `<option value="${l.code}">${l.name}</option>`
    ).join('');

    return `
        <div class="movie-filter-group">
            <label class="movie-filter-label" for="tv-language-select">Language</label>
            <select id="tv-language-select" class="movie-filter-select">${languageOptions}</select>
        </div>
        <div class="movie-filter-group">
            <span class="movie-filter-label">Where to watch</span>
            <div class="filter-chip-row" id="tv-provider-chips">${providerChips}</div>
        </div>
        <div class="movie-filter-group">
            <span class="movie-filter-label">Genre</span>
            <div class="filter-chip-row" id="tv-genre-chips">${genreChips}</div>
        </div>
    `;
}

function wireEvents(root) {
    root.querySelector('#tv-language-select')?.addEventListener('change', (e) => {
        selectedLanguage = e.target.value;
    });

    root.querySelector('#tv-genre-chips')?.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-genre]');
        if (!chip) return;
        const id = chip.dataset.genre;
        chip.classList.toggle('active');
        if (selectedGenres.has(id)) selectedGenres.delete(id); else selectedGenres.add(id);
    });

    root.querySelector('#tv-provider-chips')?.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-provider]');
        if (!chip) return;
        const id = chip.dataset.provider;
        chip.classList.toggle('active');
        if (selectedProviders.has(id)) selectedProviders.delete(id); else selectedProviders.add(id);
    });
}

export function initTvFilters(mountEl) {
    if (!mountEl) return;
    mountEl.innerHTML = buildMarkup();
    wireEvents(mountEl);
}

/**
 * Returns the current filter selections shaped exactly as movie-search's
 * request body expects (comma-separated ID strings). `mediaType: 'tv'` is
 * added by tvSearch.js itself, not here.
 */
export function getActiveTvFilters() {
    const filters = {};
    if (selectedLanguage) filters.language = selectedLanguage;
    if (selectedGenres.size > 0) filters.genres = Array.from(selectedGenres).join(',');
    if (selectedProviders.size > 0) {
        filters.watchProviders = Array.from(selectedProviders).join(',');
        // watchRegion defaults server-side to "IN" when omitted, same as movies.
    }
    return filters;
}
