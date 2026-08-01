// ==========================================
// TV DETAIL PAGE (js/tv/tvDetail.js)
// ==========================================
// Mirrors movieDetail.js exactly, reading the same normalized field shape
// (title/release_date/overview/genre_names/watchProviders) that
// movie-search's normalizeTmdbTv produces. Own view element / own cache /
// own window.openTvDetail so it never collides with movieDetail.js's
// #movie-detail-view if both pages' scripts were ever loaded together —
// same "own everything per domain" convention as tvRenderer.js.

import { escapeHTML } from '../utils.js';
import { CONFIG } from '../config.js';
import { getCachedTvShow } from './tvRenderer.js';

const VIEW_ID = 'tv-detail-view';

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

function buildMarkup(show) {
    const safeTitle = escapeHTML(show.title || 'Untitled');
    const overview = escapeHTML(show.overview || 'No description available.');
    const year = formatYear(show.release_date);
    const rating = typeof show.vote_average === 'number' ? show.vote_average.toFixed(1) : null;
    const posterUrl = resolvePosterUrl(show.poster_path);
    const backdropUrl = resolveBackdropUrl(show.backdrop_path);
    const genres = Array.isArray(show.genre_names) ? show.genre_names.slice(0, 4) : [];
    const saved = window.getAllFavorites
        ? window.getAllFavorites().some(f => String(f.id) === String(show.id))
        : false;

    return `
        <div class="movie-detail-backdrop" style="background-image:url('${backdropUrl || posterUrl}')"></div>
        <div class="movie-detail-scroll">
            <button class="movie-detail-back-btn" onclick="window.closeTvDetail()" aria-label="Back">‹</button>
            <div class="movie-detail-poster-wrap">
                <img src="${posterUrl}" alt="${safeTitle}" class="movie-detail-poster"
                     onerror="this.onerror=null;this.src='${CONFIG.TMDB_POSTER_FALLBACK}';">
            </div>
            <div class="movie-detail-body">
                <h1 class="movie-detail-title">${safeTitle}</h1>
                <p class="movie-detail-meta">
                    <span>${year}</span>
                    ${rating ? `<span>⭐ ${rating}</span>` : ''}
                </p>
                ${genres.length ? `<div class="movie-detail-genre-row">${genres.map(g => `<span class="movie-detail-genre-chip">${escapeHTML(g)}</span>`).join('')}</div>` : ''}

                <div class="movie-detail-actions">
                    <button class="movie-detail-save-btn ${saved ? 'active' : ''}" id="tv-detail-fav-btn"
                            onclick="window.handleTvDetailFavoriteClick && window.handleTvDetailFavoriteClick()">
                        ${saved ? '♥ Saved' : '♡ Save'}
                    </button>
                    <button class="movie-detail-share-btn" onclick="window.shareTvShow && window.shareTvShow('${show.id}')">
                        🔗 Share
                    </button>
                </div>

                <h3 class="movie-detail-section-heading">Overview</h3>
                <p class="movie-detail-overview">${overview}</p>

                <h3 class="movie-detail-section-heading">Where to Watch</h3>
                ${renderProviderRow(show.watchProviders)}
            </div>
        </div>
    `;
}

window.handleTvDetailFavoriteClick = function () {
    const view = document.getElementById(VIEW_ID);
    const id = view && view.dataset.openId;
    const item = id ? getCachedTvShow(id) : null;
    if (!item || !window.toggleFavorite) return;

    window.toggleFavorite(item);
    const btn = document.getElementById('tv-detail-fav-btn');
    if (!btn) return;
    const nowSaved = window.getAllFavorites
        ? window.getAllFavorites().some(f => String(f.id) === String(item.id))
        : btn.classList.contains('active') === false;
    btn.classList.toggle('active', nowSaved);
    btn.innerHTML = nowSaved ? '♥ Saved' : '♡ Save';
};

window.shareTvShow = function (id) {
    const item = getCachedTvShow(id);
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
 * Opens the detail page for a TV show. Accepts the show's id (already
 * cached by tvRenderer.js's getTvCardHTML on render).
 */
export function openTvDetail(idOrItem) {
    const item = (idOrItem && typeof idOrItem === 'object') ? idOrItem : getCachedTvShow(idOrItem);
    if (!item) {
        console.warn('[tvDetail.js] No cached data for id:', idOrItem);
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

export function closeTvDetail() {
    const view = document.getElementById(VIEW_ID);
    if (!view) return;
    view.classList.remove('open');
    document.body.classList.remove('detail-open');
}
