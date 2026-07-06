// ==========================================
// RENDERING ENGINE (js/renderer.js)
// ==========================================

import { isFavorite } from './favorites.js';

// Keeps the full data for every card ever rendered so the ♡ button
// can hand the complete manga object off to favorites.js by id alone.
const factSheetCache = {};

export function getCachedFactSheet(id) {
    return factSheetCache[String(id)];
}

export function formatStatus(status) {
    if (!status) return "Unknown";
    const map = {
        FINISHED: "Completed",
        RELEASING: "Releasing",
        NOT_YET_RELEASED: "Upcoming",
        CANCELLED: "Cancelled",
        HIATUS: "Hiatus"
    };
    return map[status] || status;
}

// Maps a (possibly already-formatted) status string to a meaningful icon,
// instead of using the same pin 📌 for every status regardless of meaning.
function getStatusIcon(status) {
    const key = String(status || '').toUpperCase();
    const map = {
        FINISHED: '✅', COMPLETED: '✅',
        RELEASING: '🔄',
        NOT_YET_RELEASED: '⏳', UPCOMING: '⏳',
        CANCELLED: '🚫',
        HIATUS: '⏸️'
    };
    return map[key] || '📍';
}

export function renderDidYouMean(originalQuery, suggestions) {
    const grid = document.getElementById('community-grid');
    if (!grid) return;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 20px;';

    let chipsHtml = suggestions.map(s =>
        `<button class="vibe-btn" onclick="window.triggerSearch('${s.replace(/'/g, "\\'")}', 1)">${s}</button>`
    ).join(' ');

    wrapper.innerHTML = `
        <p style="color: var(--text-muted); margin-bottom: 12px;">
            No results for "<b>${originalQuery}</b>". Did you mean:
        </p>
        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
            ${chipsHtml}
        </div>
    `;
    grid.appendChild(wrapper);
}

export function renderFallbackBanner(originalQuery, usedQuery, otherSuggestions) {
    const grid = document.getElementById('community-grid');
    if (!grid) return;

    const banner = document.createElement('div');
    banner.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 10px 0 20px 0;';

    let altHtml = otherSuggestions.length > 0
        ? `<div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
             ${otherSuggestions.map(s => `<button class="vibe-btn" style="padding:6px 14px; font-size:0.85rem;" onclick="window.triggerSearch('${s.replace(/'/g, "\\'")}', 1)">${s}</button>`).join(' ')}
           </div>`
        : '';

    banner.innerHTML = `
        <p style="color: var(--text-muted);">
            No exact match for "<b>${originalQuery}</b>" — showing results for "<b>${usedQuery}</b>" instead.
        </p>
        ${altHtml}
    `;
    grid.appendChild(banner);
}

export function renderMangaCard(factSheet) {
    const grid = document.getElementById('community-grid');
    if (!grid) return;

    factSheetCache[String(factSheet.id)] = factSheet;

    const card = document.createElement('div');
    card.className = 'manga-card';

    const genresText = (factSheet.rawGenres && factSheet.rawGenres.length > 0) ? factSheet.rawGenres.slice(0, 3).join(' • ') : "Various";
    const hasScore = factSheet.globalScore && factSheet.globalScore !== "N/A";
    const statusText = factSheet.status || 'Unknown';
    const statusIcon = getStatusIcon(statusText);
    const saved = isFavorite(factSheet.id);

    let linksHtml = '';
    (factSheet.readLinks || []).forEach((link) => {
        const linkBg = link.isValidated
            ? '#22c55e'
            : (link.name === "🌐 Google Search" ? '#ef4444' : '#64748b');

        linksHtml += `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="read-link-btn"
               style="background: ${linkBg}; color: #ffffff;" onclick="event.stopPropagation()">
               ${link.name}
            </a>`;
    });

    card.innerHTML = `
        <div class="manga-cover-container" onclick="window.toggleOptions('${factSheet.id}')">
            <img src="${factSheet.coverUrl}" alt="${factSheet.title.replace(/"/g, '&quot;')}" class="manga-cover" loading="lazy">
            <button class="fav-btn ${saved ? 'active' : ''}" id="fav-${factSheet.id}"
                    onclick="window.handleFavoriteClick(event, '${factSheet.id}')"
                    title="${saved ? 'Remove from My List' : 'Save to My List'}">${saved ? '♥' : '♡'}</button>
            ${hasScore ? `<div class="score-badge">⭐ ${factSheet.globalScore}%</div>` : ''}
            <div class="read-options" id="overlay-${factSheet.id}">
                <span style="color: white; margin-bottom: 5px; font-weight: 600;">Available Sources:</span>
                ${linksHtml}
            </div>
        </div>
        <div class="manga-info">
            <h3 class="manga-title" title="${factSheet.title.replace(/"/g, '&quot;')}">${factSheet.title}</h3>
            <p class="manga-meta">${genresText}</p>
            <div class="manga-facts">
                <span>📚 ${factSheet.chapters || 'N/A'}</span>
                <span>${statusIcon} ${statusText}</span>
            </div>
            <p class="manga-synopsis" onclick="window.toggleSynopsis(this)" title="Click to read full description">
                ${factSheet.synopsis || 'No description available.'}
            </p>
        </div>
    `;
    grid.appendChild(card);
}
