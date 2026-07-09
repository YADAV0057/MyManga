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

// This was the missing function!
function renderSkeletonRow(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="skeleton-card--carousel"><div class="skeleton-cover"></div></div>`;
    }
    return html;
}

export function showSkeletons(...elements) {
    elements.forEach(el => {
        if (el) el.innerHTML = renderSkeletonRow(6);
    });
}

export function renderNewReleasesRow(el, items) {
    if (!el) return;
    el.innerHTML = items.length
        ? renderCards(items)
        : renderEmptyState('No new releases found right now.');
}

export function renderMostAwaitedRow(el, items) {
    if (!el) return;
    el.innerHTML = items.length
        ? renderCards(items)
        : renderEmptyState('No upcoming manga data available.');
}

export function renderShortReadsRow(el, items) {
    if (!el) return;
    el.innerHTML = items.length
        ? renderCards(items)
        : renderEmptyState('Could not find short reads at the moment.');
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

function renderEmptyState(message) {
    return `<div class="row-empty-state">${message}</div>`;
}

function renderCards(items) {
    return items.map(item => `<div class="carousel-card-wrap">${renderCompactCard(item)}</div>`).join('');
}
