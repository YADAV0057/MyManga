// ==========================================
// MANGA DETAIL PAGE (js/mangaDetail.js)
// ==========================================
// Full-page "detail view" shown when a manga card is tapped anywhere in the
// app (search grid, Trending Today, Hidden Gems). Replaces the old inline
// .read-options hover-overlay on grid cards with a real page: cover,
// synopsis, stats, and a list of external sites where the title can be
// read (readLinks), matching the flow of dedicated manga-tracker apps.
//
// Data contract: this file accepts either a full factSheet-shaped object
// (already carrying readLinks, from renderer.js/search.js) or a lighter
// UnifiedResult from the landing carousels (no readLinks yet). In the
// latter case it lazily resolves links the same way search.js does,
// via mangadex.js's resolveReadLinks()/getFallbackLinks().
//
// Isolation note: only import here is escapeHTML (utils.js, pure string
// helper) and resolveReadLinks/getFallbackLinks (mangadex.js, no DOM
// coupling). This file owns its own cache and DOM node, so any other
// part of the app can call cacheMangaForDetail() + openMangaDetail(id)
// without needing to know this module's internals.

import { escapeHTML } from './utils.js';
import { resolveReadLinks, getFallbackLinks } from './mangadex.js';

const VIEW_ID = 'manga-detail-view';
const detailCache = {};

export function cacheMangaForDetail(item) {
    if (!item || item.id === undefined || item.id === null) return;
    detailCache[String(item.id)] = item;
}

export function getCachedMangaDetail(id) {
    return detailCache[String(id)];
}

function ensureViewEl() {
    let el = document.getElementById(VIEW_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = VIEW_ID;
        el.className = 'detail-view';
        document.body.appendChild(el);
    }
    return el;
}

function getStatusIcon(status) {
    const key = String(status || '').toUpperCase();
    const map = {
        COMPLETED: '✅', FINISHED: '✅',
        RELEASING: '🔄', ONGOING: '🔄',
        UPCOMING: '⏳', NOT_YET_RELEASED: '⏳',
        CANCELLED: '🚫', HIATUS: '⏸️'
    };
    return map[key] || '📍';
}

function renderLinksHTML(links) {
    if (!links || links.length === 0) {
        return `<p class="detail-links-empty">No read links found yet.</p>`;
    }
    return links.map(link => {
        const bg = link.isValidated
            ? '#22c55e'
            : (link.name === 'Google Search' || link.name === '🌐 Google Search' ? '#ef4444' : '#64748b');
        return `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer"
               class="detail-link-btn" style="background:${bg};">
               ${escapeHTML(link.name)}
            </a>`;
    }).join('');
}

function renderLinksSkeleton() {
    return `
        <div class="detail-links-skeleton">
            <div class="skel-pill"></div><div class="skel-pill"></div><div class="skel-pill"></div>
        </div>`;
}

function buildMarkup(item) {
    const safeTitle = escapeHTML(item.title || 'Untitled');
    const synopsis = escapeHTML(item.synopsis || 'No description available.');
    const genres = (item.rawGenres && item.rawGenres.length > 0) ? item.rawGenres.slice(0, 4) : [];
    const hasScore = typeof item.globalScore === 'number';
    const statusText = item.status || 'Unknown';
    const saved = window.getAllFavorites
        ? window.getAllFavorites().some(f => String(f.id) === String(item.id))
        : false;

    return `
        <div class="detail-backdrop" style="background-image:url('${item.coverUrl}')"></div>
        <div class="detail-scroll">
            <button class="detail-back-btn" onclick="window.closeMangaDetail()" aria-label="Back">‹</button>
            <div class="detail-cover-wrap">
                <img src="${item.coverUrl}" alt="${safeTitle}" class="detail-cover">
            </div>
            <div class="detail-body">
                <h1 class="detail-title">${safeTitle}</h1>
                ${genres.length ? `<div class="detail-genre-row">${genres.map(g => `<span class="detail-genre-chip">${escapeHTML(g)}</span>`).join('')}</div>` : ''}

                <div class="detail-stats-row">
                    ${hasScore ? `<div class="detail-stat"><span class="detail-stat-value">⭐ ${item.globalScore}%</span><span class="detail-stat-label">Score</span></div>` : ''}
                    <div class="detail-stat"><span class="detail-stat-value">${escapeHTML(item.chapters || 'N/A')}</span><span class="detail-stat-label">Chapters</span></div>
                    <div class="detail-stat"><span class="detail-stat-value">${getStatusIcon(statusText)} ${escapeHTML(statusText)}</span><span class="detail-stat-label">Status</span></div>
                </div>

                <button class="detail-bookmark-btn ${saved ? 'active' : ''}" id="detail-fav-btn"
                        onclick="window.handleDetailFavoriteClick && window.handleDetailFavoriteClick()">
                    ${saved ? '♥ Saved to My List' : '♡ Save to My List'}
                </button>

                <h3 class="detail-section-heading">Synopsis</h3>
                <p class="detail-synopsis">${synopsis}</p>

                <h3 class="detail-section-heading">Read Now</h3>
                <div class="detail-links-row" id="detail-links-row">
                    ${item.readLinks ? renderLinksHTML(item.readLinks) : renderLinksSkeleton()}
                </div>
            </div>
        </div>
    `;
}

async function loadLinksIfNeeded(item) {
    if (item.readLinks) return;
    let links;
    try {
        links = await Promise.race([
            resolveReadLinks(item.title).catch(() => getFallbackLinks(item.title)),
            new Promise(resolve => setTimeout(() => resolve(getFallbackLinks(item.title)), 2500))
        ]);
    } catch (e) {
        links = getFallbackLinks(item.title);
    }
    item.readLinks = links;
    cacheMangaForDetail(item);

    // Only patch the DOM if this item's detail page is still the one open.
    const view = document.getElementById(VIEW_ID);
    if (view && view.dataset.openId === String(item.id)) {
        const row = document.getElementById('detail-links-row');
        if (row) row.innerHTML = renderLinksHTML(links);
    }
}

window.handleDetailFavoriteClick = function () {
    const view = document.getElementById(VIEW_ID);
    const id = view && view.dataset.openId;
    const item = id ? getCachedMangaDetail(id) : null;
    if (!item || !window.toggleFavorite) return;

    window.toggleFavorite(item);
    const btn = document.getElementById('detail-fav-btn');
    if (!btn) return;
    const nowSaved = window.getAllFavorites
        ? window.getAllFavorites().some(f => String(f.id) === String(item.id))
        : btn.classList.contains('active') === false;
    btn.classList.toggle('active', nowSaved);
    btn.innerHTML = nowSaved ? '♥ Saved to My List' : '♡ Save to My List';
};

/**
 * Opens the detail page for a manga. Accepts either the manga's id (if it
 * was already cached via cacheMangaForDetail) or a full item object.
 */
export function openMangaDetail(idOrItem) {
    let item;
    if (idOrItem && typeof idOrItem === 'object') {
        item = idOrItem;
        cacheMangaForDetail(item);
    } else {
        item = getCachedMangaDetail(idOrItem);
    }
    if (!item) {
        console.warn('[mangaDetail.js] No cached data for id:', idOrItem);
        return;
    }

    const view = ensureViewEl();
    view.dataset.openId = String(item.id);
    view.innerHTML = buildMarkup(item);
    // Force reflow so the CSS transition below plays instead of being skipped.
    void view.offsetWidth;
    view.classList.add('open');
    document.body.classList.add('detail-open');
    view.querySelector('.detail-scroll')?.scrollTo(0, 0);

    loadLinksIfNeeded(item);
}

export function closeMangaDetail() {
    const view = document.getElementById(VIEW_ID);
    if (!view) return;
    view.classList.remove('open');
    document.body.classList.remove('detail-open');
}
