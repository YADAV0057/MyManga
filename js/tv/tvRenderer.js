// ==========================================
// TV CARD RENDERER (js/tv/tvRenderer.js)
// ==========================================
// Mirrors movieRenderer.js exactly — the movie-search backend's
// normalizeTmdbTv (2026-08-01) already maps TV's `name`/`first_air_date`
// into `title`/`release_date`, so this renderer reads the identical field
// shape movieRenderer.js does. Deliberately reuses the same .movie-* CSS
// classes (movie-card, movie-poster, movie-rating-badge, etc.) rather than
// a parallel .tv-* class set — see tv.html's header note on why no tv.css
// exists yet. Kept as its own file (not movieRenderer.js with a branch)
// so window.openTvDetail / the tv cache stay fully separate from movies',
// matching this codebase's "own everything per domain" convention.
//
// Card data shape (from movie-search's response with mediaType: 'tv'):
//   {
//     id, tmdbId, title, overview, release_date, original_language,
//     vote_average, vote_count, popularity, poster_path, backdrop_path,
//     source: 'tmdb', mediaType: 'tv',
//     watchProviders: { flatrate: [...], link } | null,
//     watchProvidersLink,
//     _rank: { textScore, quality, langScore, providerScore, moodScore, semanticScore, finalScore }
//   }
// No OMDb/Trakt fallback shape to handle for TV (see movie-search's
// runWaterfall — TV has TMDB only), so unlike movieRenderer.js this file
// doesn't need to defensively handle an absolute-URL or null poster_path
// from a fallback tier — TMDB always gives a relative path or null.

import { CONFIG } from '../config.js';
import { escapeHTML } from '../utils.js';

const tvCache = {};

export function getCachedTvShow(id) {
    return tvCache[String(id)];
}

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

// Backend caps + sorts by display_priority already (attachWatchProviders in
// movie-search/index.ts, shared by both movie and TV paths) — this just
// renders what it's given.
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

export function getTvCardHTML(show) {
    tvCache[String(show.id)] = show;

    const safeTitle = escapeHTML(show.title || 'Untitled');
    const year = formatYear(show.release_date);
    const rating = formatRating(show.vote_average);
    const posterUrl = resolvePosterUrl(show.poster_path);
    const genresText = Array.isArray(show.genre_names) && show.genre_names.length > 0
        ? show.genre_names.slice(0, 3).join(' • ')
        : '';

    return `
        <div class="movie-card" onclick="window.openTvDetail && window.openTvDetail('${show.id}')">
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
                ${renderProviderLogos(show.watchProviders)}
                <p class="movie-overview">${escapeHTML(show.overview || 'No description available.')}</p>
            </div>
        </div>
    `;
}

export function renderTvCard(show, gridId = 'tv-results-grid') {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const temp = document.createElement('div');
    temp.innerHTML = getTvCardHTML(show).trim();
    if (temp.firstElementChild) grid.appendChild(temp.firstElementChild);
}
