// ==========================================
// landing/render.js
// ==========================================
// DOM layer for the landing page's always-visible rows. Takes normalized
// manga data (from fetch.js) and renders it into the two containers.
//
// VISUAL NOTE: earlier versions of this file reused ../renderer.js's full
// search-result card (getMangaCardHTML) inside the 118px carousel slot.
// That card's design — cover + title + genres + facts row + synopsis +
// favorite button — is built for a ~260px grid card, so squeezed into a
// carousel it rendered cramped and cut off. These rows are meant to look
// like the compact "Trending Today" cards in the design mockup (image,
// score badge, title, one-line genre), so this file now builds that
// simpler card directly from the normalized data instead. No favorite
// button or read-options overlay here by design — tapping a card triggers
// a real search for its title instead (same window.triggerSearch used by
// the mood chips elsewhere), which is a better fit for a discovery row.
//
// Isolation note: the only external imports are escapeHTML from ../utils.js
// (a pure string helper — no DOM/app coupling) and cacheMangaForDetail from
// ../mangaDetail.js (a plain in-memory cache keyed by id — no DOM coupling
// either). Everything else here is local to landing/.
//
// Tapping a card now opens the full manga detail page (cover, synopsis,
// stats, and read-links from external sites) instead of re-running a
// title search — a better fit for a discovery row, and consistent with
// how the main search-result grid's cards behave (see renderer.js).

import { escapeHTML } from '../utils.js';
import { cacheMangaForDetail } from '../mangaDetail.js';

function renderCompactCard(item) {
    cacheMangaForDetail(item);

    const hasScore = typeof item.globalScore === 'number';
    const safeTitle = escapeHTML(item.title || 'Untitled');
    const safeId = escapeHTML(String(item.id));
    const genresText = (item.rawGenres && item.rawGenres.length > 0)
        ? item.rawGenres.slice(0, 2).join(' • ')
        : 'Manga';

    return `
        <div class="mm-trend-card" title="${safeTitle}"
             onclick="window.openMangaDetail && window.openMangaDetail('${safeId}')">
            <div class="mm-trend-cover">
                <img src="${item.coverUrl}" alt="${safeTitle}" class="mm-trend-img" loading="lazy">
                ${hasScore ? `<div class="mm-trend-badge">⭐ ${item.globalScore}%</div>` : ''}
            </div>
            <div class="mm-trend-title">${safeTitle}</div>
            <div class="mm-trend-genre">${escapeHTML(genresText)}</div>
        </div>
    `;
}

function renderSkeletonRow(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        // NOTE: intentionally NOT combining this with cards.css's shared
        // .skeleton-card class here. Both .skeleton-card (cards.css) and
        // .skeleton-card--carousel (landing/styles.css) are single-class
        // selectors of equal specificity, so applying both to the same
        // element makes border-radius/background/sizing depend on
        // stylesheet load order. .skeleton-card--carousel already fully
        // defines this element's look, so it's used alone.
        html += `<div class="skeleton-card--carousel"><div class="skeleton-cover"></div></div>`;
    }
    return html;
}

function renderEmptyState(message) {
    return `<div class="row-empty-state">${message}</div>`;
}

function renderCards(items) {
    return items.map(item => `<div class="carousel-card-wrap">${renderCompactCard(item)}</div>`).join('');
}

export function showSkeletons(trendingEl, gemsEl, count = 6) {
    if (trendingEl) trendingEl.innerHTML = renderSkeletonRow(count);
    if (gemsEl) gemsEl.innerHTML = renderSkeletonRow(count);
}

export function renderTrendingRow(el, trending) {
    if (!el) return;
    el.innerHTML = trending.length
        ? renderCards(trending)
        : renderEmptyState('Trending data is warming up — check back in a bit.');
}

export function renderHiddenGemsRow(el, hiddenGems) {
    if (!el) return;
    el.innerHTML = hiddenGems.length
        ? renderCards(hiddenGems)
        : renderEmptyState('No hidden gems surfaced yet — check back in a bit.');
}


