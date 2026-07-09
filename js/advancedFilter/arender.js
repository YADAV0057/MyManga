// ==========================================
// js/advancedFilter/arender.js
// ==========================================
// DOM only — turns already-merged/filtered UnifiedResult cards into grid
// HTML. Reuses renderer.js's getMangaCardHTML() so cards are byte-identical
// to every other grid in the app (favorites, "Why?" panel button present
// but simply won't render since these cards have no matchScore — same
// backward-compatible behavior getMangaCardHTML already has for any
// factSheet without one).
import { getMangaCardHTML } from '../renderer.js';

export function showSkeletons(grid, count = 12) {
    if (!grid) return;
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton-cover"></div>
                <div class="skeleton-info">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-meta" style="margin-top:5px;margin-bottom:12px;"></div>
                    <div class="skeleton-line skeleton-text"></div>
                    <div class="skeleton-line skeleton-text"></div>
                    <div class="skeleton-line skeleton-text-short"></div>
                </div>
            </div>`;
    }
    grid.innerHTML = html;
}

export function renderResultsGrid(grid, results, mode = 'replace') {
    if (!grid) return;
    if (mode === 'replace') grid.innerHTML = '';

    if (results.length === 0 && mode === 'replace') {
        grid.innerHTML = `<p class="adv-empty-msg">No manga found matching your criteria.</p>`;
        return;
    }

    const html = results.map(getMangaCardHTML).join('');
    if (mode === 'append') {
        grid.insertAdjacentHTML('beforeend', html);
    } else {
        grid.innerHTML = html;
    }
}
