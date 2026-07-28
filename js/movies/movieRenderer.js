// ==========================================
// MOVIE CARD RENDERER (js/movies/movieRenderer.js)
// ==========================================
// Mirrors renderer.js's manga-card pattern (getMangaCardHTML / handleFavoriteClick
// / cache-then-render shape), but built around movie-native fields per the
// Architecture & UX Plan: poster aspect ratio, runtime/rating badge instead
// of chapter count, provider logos instead of a single "read" redirect
// button. Deliberately its own file, not an extension of renderer.js — same
// "own card component" decision as the rest of the movie-search fork.
//
// Card data shape (from the live movie-search v7 response, confirmed via
// Supabase:get_edge_function — see index.ts/rankResults.js):
//   {
//     id, tmdbId, title, overview, release_date, original_language,
//     vote_average, vote_count, popularity, poster_path, backdrop_path,
//     source: 'tmdb' | 'omdb' | 'trakt',
//     watchProviders: { flatrate: [{provider_id, provider_name, logo_path,
//       display_priority}], link } | null,
//     watchProvidersLink,
//     _rank: { textScore, quality, langScore, providerScore, semanticScore, finalScore }
//   }
// OMDb/Trakt fallback results use a slightly different shape (title/overview/
// release_date/vote_average still present; poster_path may be a full URL or
// null — see adapters/omdb.ts, adapters/trakt.ts) — this renderer treats
// poster_path as "either a TMDB-relative path or an absolute URL or null"
// so it degrades gracefully across all three tiers without branching logic.

import { CONFIG } from '../config.js';
import { escapeHTML } from '../utils.js';

const movieCache = {};

export function getCachedMovie(id) {
    return movieCache[String(id)];
}

// TMDB gives relative paths ("/abc123.jpg"); OMDb gives absolute URLs (or
// "N/A", already normalized to null upstream); Trakt gives null (no images
// on its free tier). Handles all three without the caller needing to know
// which tier a given result came from.
function resolvePosterUrl(posterPath) {
    if (!posterPath) return CONFIG.TMDB_POSTER_FALLBACK;
    if (/^https?:\/\//i.test(posterPath)) return posterPath;
    return `${CONFIG.TMDB_POSTER_BASE}${posterPath}`;
}

function formatYear(releaseDate) {
    if (!releaseDate) return 'TBA';
    const match = String(releaseDate).match(/^\d{4}/);
    return match ? match[0] : 'TBA';
}

function formatRating(voteAverage) {
    if (typeof voteAverage !== 'number' || Number.isNaN(voteAverage)) return null;
    return voteAverage.toFixed(1);
}

// Renders up to MAX_CARD_PROVIDERS logos (the backend already caps + sorts
// by display_priority — see movie-search/index.ts's attachWatchProviders —
// so this just renders what it's given, no re-sorting/re-slicing here).
function renderProviderLogos(watchProviders) {
    const flatrate = watchProviders?.flatrate;
    if (!Array.isArray(flatrate) || flatrate.length === 0) return '';

    const logos = flatrate.map(p => {
        const logoUrl = p.logo_path ? `${CONFIG.TMDB_POSTER_BASE}${p.logo_path}` : '';
        const safeName = escapeHTML(p.provider_name || 'Streaming provider');
        return logoUrl
            ? `<img class="provider-logo" src="${logoUrl}" alt="${safeName}" title="${safeName}" loading="lazy">`
            : '';
    }).filter(Boolean).join('');

    return logos
        ? `<div class="movie-providers" title="Where to watch">${logos}</div>`
        : `<p class="movie-providers-none">Not currently streaming</p>`;
}

export function getMovieCardHTML(movie) {
    movieCache[String(movie.id)] = movie;

    const safeTitle = escapeHTML(movie.title || 'Untitled');
    const year = formatYear(movie.release_date);
    const rating = formatRating(movie.vote_average);
    const posterUrl = resolvePosterUrl(movie.poster_path);
    const genresText = Array.isArray(movie.genre_names) && movie.genre_names.length > 0
        ? movie.genre_names.slice(0, 3).join(' • ')
        : '';

    return `
        <div class="movie-card" onclick="window.openMovieDetail && window.openMovieDetail('${movie.id}')">
            <div class="movie-poster-container">
                <img src="${posterUrl}" alt="${safeTitle}" class="movie-poster" loading="lazy"
                     onerror="this.onerror=null;this.src='${CONFIG.TMDB_POSTER_FALLBACK}';">
                ${rating ? `<div class="movie-rating-badge">⭐ ${rating}</div>` : ''}
            </div>
            <div class="movie-info">
                <h3 class="movie-title" title="${safeTitle}">${safeTitle}</h3>
                <p class="movie-meta">
                    <span class="movie-year">${year}</span>
                    ${genresText ? `<span class="movie-genres">${escapeHTML(genresText)}</span>` : ''}
                </p>
                ${renderProviderLogos(movie.watchProviders)}
                <p class="movie-overview">${escapeHTML(movie.overview || 'No description available.')}</p>
            </div>
        </div>
    `;
}

export function renderMovieCard(movie, gridId = 'movie-results-grid') {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const temp = document.createElement('div');
    temp.innerHTML = getMovieCardHTML(movie).trim();
    if (temp.firstElementChild) grid.appendChild(temp.firstElementChild);
}

