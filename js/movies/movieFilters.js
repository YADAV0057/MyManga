// ==========================================
// MOVIE FILTER PANEL (js/movies/movieFilters.js)
// ==========================================
// Language + provider + genre filter chips, per the Architecture & UX Plan's
// "Filters" section. Mood/keyword search box stays primary (wired in
// moviesMain.js) — this panel only supplies the `extraFilters` object
// triggerMovieSearch() merges into its request body.
//
// GENRE_OPTIONS mirrors the exact GENRE_NAME_TO_ID map inside the live
// movie-search/domains.js (confirmed via Supabase:get_edge_function,
// 2026-07-29) so chip clicks always map to real TMDB genre IDs the backend
// already knows how to handle.
//
// PROVIDER_OPTIONS: movie-search has no "list providers" endpoint yet (its
// TMDB adapter only calls /movie/{id}/watch/providers per-result, not the
// catalog-level /watch/providers/movie list) — so this is a short, manually
// curated set of major providers' TMDB IDs, NOT pulled from a live check.
// Notion's Architecture doc flags that JioHotstar's ID specifically was
// confirmed via a live TMDB call before trusting it — these others have
// NOT had that same verification pass yet. Treat as a starting point; spot-
// check each ID against a live `GET /watch/providers/movie?watch_region=IN`
// call before relying on this for anything beyond manual testing.
const GENRE_OPTIONS = [
    { name: 'Action', id: 28 }, { name: 'Comedy', id: 35 }, { name: 'Drama', id: 18 },
    { name: 'Horror', id: 27 }, { name: 'Romance', id: 10749 }, { name: 'Sci-Fi', id: 878 },
    { name: 'Thriller', id: 53 }, { name: 'Animation', id: 16 }, { name: 'Fantasy', id: 14 },
    { name: 'Crime', id: 80 }, { name: 'Mystery', id: 9648 }, { name: 'Documentary', id: 99 },
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

// UNVERIFIED IDs — see header note.
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
            <label class="movie-filter-label" for="movie-language-select">Language</label>
            <select id="movie-language-select" class="movie-filter-select">${languageOptions}</select>
        </div>
        <div class="movie-filter-group">
            <span class="movie-filter-label">Where to watch</span>
            <div class="filter-chip-row" id="movie-provider-chips">${providerChips}</div>
        </div>
        <div class="movie-filter-group">
            <span class="movie-filter-label">Genre</span>
            <div class="filter-chip-row" id="movie-genre-chips">${genreChips}</div>
        </div>
    `;
}

function wireEvents(root) {
    root.querySelector('#movie-language-select')?.addEventListener('change', (e) => {
        selectedLanguage = e.target.value;
    });

    root.querySelector('#movie-genre-chips')?.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-genre]');
        if (!chip) return;
        const id = chip.dataset.genre;
        chip.classList.toggle('active');
        if (selectedGenres.has(id)) selectedGenres.delete(id); else selectedGenres.add(id);
    });

    root.querySelector('#movie-provider-chips')?.addEventListener('click', (e) => {
        const chip = e.target.closest('[data-provider]');
        if (!chip) return;
        const id = chip.dataset.provider;
        chip.classList.toggle('active');
        if (selectedProviders.has(id)) selectedProviders.delete(id); else selectedProviders.add(id);
    });
}

export function initMovieFilters(mountEl) {
    if (!mountEl) return;
    mountEl.innerHTML = buildMarkup();
    wireEvents(mountEl);
}

/**
 * Returns the current filter selections shaped exactly as
 * movie-search's request body expects (comma-separated ID strings).
 */
export function getActiveMovieFilters() {
    const filters = {};
    if (selectedLanguage) filters.language = selectedLanguage;
    if (selectedGenres.size > 0) filters.genres = Array.from(selectedGenres).join(',');
    if (selectedProviders.size > 0) {
        filters.watchProviders = Array.from(selectedProviders).join(',');
        // watchRegion defaults server-side to "IN" (DEFAULT_WATCH_REGION in
        // index.ts) when omitted — no override UI yet (Architecture plan's
        // "manual override dropdown for VPN users" is a follow-up, not in
        // this first pass).
    }
    return filters;
}

