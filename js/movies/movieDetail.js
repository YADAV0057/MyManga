// ==========================================
// MOVIE DETAIL PAGE (js/movies/movieDetail.js)
// ==========================================
// Full-page detail view shown when a movie card is tapped, mirroring
// mangaDetail.js's structure (own cache, own DOM node, exposed on
// window so movieRenderer.js's inline onclick="window.openMovieDetail(...)"
// can call it without an import cycle). Movie-native fields instead of
// manga's chapters/status: runtime badge would need a second TMDB call
// (not in the current /movie-search response), so this sticks to fields
// already on the card payload — release date, rating, overview, genres,
// watch providers — same "no new network call on open" rule mangaDetail.js
// follows for readLinks.

import { escapeHTML } from '../utils.js';
import { CONFIG } from '../config.js';
import { getCachedMovie } from './movieRenderer.js';

const VIEW_ID = 'movie-detail-view';

function ensureViewEl() {
    let el = document.getElementById(VIEW_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = VIEW_ID;
        el.className = 'movie-detail-view';
        document.body.appendChild(el);
    }
    return el;
}

function resolveBackdropUrl(backdropPath) {
    if (!backdropPath) return '';
    if (/^https?:\/\//i.test(backdropPath)) return backdropPath;
    return `${CONFIG.TMDB_BACKDROP_BASE || CONFIG.TMDB_POSTER_BASE}${backdropPath}`;
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

function renderProviderRow(watchProviders) {
    const flatrate = watchProviders?.flatrate;
    if (!Array.isArray(flatrate) || flatrate.length === 0) {
        return `<p class="movie-detail-providers-none">Not currently streaming on a tracked service.</p>`;
    }
    const logos = flatrate.map(p => {
        const logoUrl = p.logo_path ? `${CONFIG.TMDB_POSTER_BASE}${p.logo_path}` : '';
        const safeName = escapeHTML(p.provider_name || 'Streaming provider');
        return logoUrl
            ? `<img class="movie-detail-provider-logo" src="${logoUrl}" alt="${safeName}" title="${safeName}" loading="lazy">`
            : '';
    }).filter(Boolean).join('');

    const linkOut = watchProviders?.link
        ? `<a href="${watchProviders.link}" target="_blank" rel="noopener noreferrer" class="movie-detail-provider-link">Where to watch ›</a>`
        : '';

    return `<div class="movie-detail-providers">${logos}</div>${linkOut}`;
}

function buildMarkup(movie) {
    const safeTitle = escapeHTML(movie.title || 'Untitled');
    const overview = escapeHTML(movie.overview || 'No description available.');
    const year = formatYear(movie.release_date);
    const rating = typeof movie.vote_average === 'number' ? movie.vote_average.toFixed(1) : null;
    const posterUrl = resolvePosterUrl(movie.poster_path);
    const backdropUrl = resolveBackdropUrl(movie.backdrop_path);
    const genres = Array.isArray(movie.genre_names) ? movie.genre_names.slice(0, 4) : [];
    const saved = window.getAllFavorites
        ? window.getAllFavorites().some(f => String(f.id) === String(movie.id))
        : false;

    return `
        <div class="movie-detail-backdrop" style="background-image:url('${backdropUrl || posterUrl}')"></div>
        <div class="movie-detail-scroll">
            <button class="movie-detail-back-btn" onclick="window.closeMovieDetail()" aria-label="Back">‹</button>
            <div class="movie-detail-poster-wrap">
                <img src="${posterUrl}" alt="${safeTitle}" class="movie-detail-poster"
                     onerror="this.onerror=null;this.src='${CONFIG.TMDB_POSTER_FALLBACK}';">
            </div>
            <div class="movie-detail-body">
                <h1 class="movie-detail-title">${safeTitle}</h1>
                <p class="movie-detail-meta">
                    <span>${year}</span>
                    ${rating ? `<span>⭐ ${rating}</span>` : ''}
                    ${movie.source && movie.source !== 'tmdb' ? `<span class="movie-detail-source-tag">via ${escapeHTML(movie.source)}</span>` : ''}
                </p>
                ${genres.length ? `<div class="movie-detail-genre-row">${genres.map(g => `<span class="movie-detail-genre-chip">${escapeHTML(g)}</span>`).join('')}</div>` : ''}

                <div class="movie-detail-actions">
                    <button class="movie-detail-save-btn ${saved ? 'active' : ''}" id="movie-detail-fav-btn"
                            onclick="window.handleMovieDetailFavoriteClick && window.handleMovieDetailFavoriteClick()">
                        ${saved ? '♥ Saved' : '♡ Save'}
                    </button>
                    <button class="movie-detail-share-btn" onclick="window.shareMovie && window.shareMovie('${movie.id}')">
                        🔗 Share
                    </button>
                </div>

                <h3 class="movie-detail-section-heading">Overview</h3>
                <p class="movie-detail-overview">${overview}</p>

                <h3 class="movie-detail-section-heading">Where to Watch</h3>
                ${renderProviderRow(movie.watchProviders)}
            </div>
        </div>
    `;
}

window.handleMovieDetailFavoriteClick = function () {
    const view = document.getElementById(VIEW_ID);
    const id = view && view.dataset.openId;
    const item = id ? getCachedMovie(id) : null;
    if (!item || !window.toggleFavorite) return;

    window.toggleFavorite(item);
    const btn = document.getElementById('movie-detail-fav-btn');
    if (!btn) return;
    const nowSaved = window.getAllFavorites
        ? window.getAllFavorites().some(f => String(f.id) === String(item.id))
        : btn.classList.contains('active') === false;
    btn.classList.toggle('active', nowSaved);
    btn.innerHTML = nowSaved ? '♥ Saved' : '♡ Save';
};

window.shareMovie = function (id) {
    const item = getCachedMovie(id);
    if (!item) return;
    const shareData = {
        title: item.title,
        text: `Check out "${item.title}" on MangaMood`,
        url: window.location.href
    };
    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(`${item.title} -- ${window.location.href}`);
    }
};

/**
 * Opens the detail page for a movie. Accepts the movie's id (already
 * cached by movieRenderer.js's getMovieCardHTML on render).
 */
export function openMovieDetail(idOrItem) {
    const item = (idOrItem && typeof idOrItem === 'object') ? idOrItem : getCachedMovie(idOrItem);
    if (!item) {
        console.warn('[movieDetail.js] No cached data for id:', idOrItem);
        return;
    }

    const view = ensureViewEl();
    view.dataset.openId = String(item.id);
    view.innerHTML = buildMarkup(item);
    void view.offsetWidth; // force reflow so the open transition plays
    view.classList.add('open');
    document.body.classList.add('detail-open');
    view.querySelector('.movie-detail-scroll')?.scrollTo(0, 0);
}

export function closeMovieDetail() {
    const view = document.getElementById(VIEW_ID);
    if (!view) return;
    view.classList.remove('open');
    document.body.classList.remove('detail-open');
}

