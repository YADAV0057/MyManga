// ==========================================
// landing/render.js
// ==========================================
// DOM layer for the landing page's always-visible rows. Takes normalized
// manga data (from fetch.js) and renders it into the two containers.
//
// Isolation note: the only external import is getMangaCardHTML from
// ../renderer.js (the shared card template, exposed as a pure
// string-returning function). Everything else here is local to landing/.
// If a card renders wrong, the bug is either here or in ../renderer.js —
// never in fetch.js or search.js.

import { getMangaCardHTML } from '../renderer.js';

// STEP 1 FINDING (verified against the real renderer.js): renderMangaCard's
// signature was NOT `renderMangaCard(unified) -> HTML string` — it appended
// straight into a real #community-grid and returned undefined. Fixed at the
// source: renderer.js now also exports getMangaCardHTML(factSheet), a pure
// function that returns the same markup as a string (and still caches the
// factSheet for the favorite/why-panel handlers) without touching the DOM.
// renderMangaCard() itself is now a thin wrapper around it. That keeps
// landing cards byte-for-byte identical to search-results cards without
// duplicating the template here.

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
    return items.map(unified => `<div class="carousel-card-wrap">${getMangaCardHTML(unified)}</div>`).join('');
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
