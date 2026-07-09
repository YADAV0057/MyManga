// ==========================================
// landing/render.js
// ==========================================
// DOM layer for the landing page's always-visible rows. Takes normalized
// manga data (from fetch.js) and renders it into the two containers.
//
// Isolation note: the only external import is renderMangaCard from
// ../renderer.js (the shared card template). Everything else here is
// local to landing/. If a card renders wrong, the bug is either here
// or in ../renderer.js — never in fetch.js or search.js.

import { renderMangaCard } from '../renderer.js';

// VERIFY BEFORE SHIPPING: confirm renderMangaCard's real signature.
// Assumed here: renderMangaCard(unified) -> returns an HTML string.
// If it actually needs a second "variant"/options argument, or renders
// straight to a container instead of returning a string, update the
// two render*Row() functions below accordingly — this is the only
// file that would need to change.

function renderSkeletonRow(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="skeleton-card skeleton-card--carousel"><div class="skeleton-cover"></div></div>`;
    }
    return html;
}

function renderEmptyState(message) {
    return `<div class="row-empty-state">${message}</div>`;
}

function renderCards(items) {
    return items.map(unified => `<div class="carousel-card-wrap">${renderMangaCard(unified)}</div>`).join('');
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
