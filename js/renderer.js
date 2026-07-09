// ==========================================
// RENDERING ENGINE (js/renderer.js) 
// ==========================================
// CHANGED (bug fixes):
//   1. handleFavoriteClick was referenced by onclick but never defined
//      anywhere — now exported here and must be wired to window in main.js
//      (see bottom of this file for the exact line to add there), matching 
//      this codebase's "only main.js touches window" convention.
//   2. fav-btn now calls event.stopPropagation() so favoriting no longer
//      also triggers the parent cover's toggleOptions() overlay.
//   3. hasScore now checks typeof === 'number' instead of truthiness, so a
//      legitimate globalScore of 0 still shows its badge.
//   4. originalQuery/usedQuery/title/synopsis/genres/status are now run
//      through escapeHTML() (utils.js) before hitting innerHTML — closes an
//      XSS hole where a typed search query could inject HTML/JS.
// CHANGED (new feature): renderMangaCard renders the matchScore that
// recommendationScorer.js attaches to each factSheet via .match-badge, same
// as before. matchReasons, however, no longer render as an always-visible
// block — they now live behind a "Why?" button (renderMatchBreakdown) that
// toggles a .why-panel open/closed via toggleWhyPanel(), exported below and
// wired to window.toggleWhyPanel in main.js (same pattern as
// handleFavoriteClick). This keeps cards compact by default while still
// giving power users the full match explanation on demand.

import { isFavorite, toggleFavorite } from './favorites.js';
import { escapeHTML } from './utils.js';
import { cacheMangaForDetail } from './mangaDetail.js';

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

// BUGFIX #1/#2: was referenced via onclick as window.handleFavoriteClick
// but never defined anywhere — clicking ♥ threw a silent ReferenceError.
// Exported here; main.js must add:  window.handleFavoriteClick = handleFavoriteClick;
// (matches the existing "only main.js writes to window" convention, so this
// file doesn't touch window itself).
export function handleFavoriteClick(event, id) {
    event.stopPropagation(); // don't also trigger the cover's toggleOptions()

    const factSheet = getCachedFactSheet(id);
    if (!factSheet) return;

    toggleFavorite(factSheet);

    const btn = document.getElementById(`fav-${id}`);
    if (!btn) return;
    const nowSaved = isFavorite(id);
    btn.classList.toggle('active', nowSaved);
    btn.textContent = nowSaved ? '♥' : '♡';
    btn.title = nowSaved ? 'Remove from My List' : 'Save to My List';
}

// NEW: toggles the "Why?" match-breakdown panel open/closed. Exported here
// for the same reason handleFavoriteClick is — main.js must add:
//   window.toggleWhyPanel = toggleWhyPanel;
export function toggleWhyPanel(event, id) {
    event.stopPropagation(); // don't also trigger the cover's toggleOptions()

    const panel = document.getElementById(`why-${id}`);
    const btn = document.getElementById(`why-btn-${id}`);
    if (!panel) return;

    const open = panel.classList.toggle('open');
    if (btn) btn.textContent = open ? 'Why? ▴' : 'Why? ▾';
}

export function renderDidYouMean(originalQuery, suggestions) {
    const grid = document.getElementById('community-grid');
    if (!grid) return;

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 20px;';

    // BUGFIX #4: escape suggestion text used inside the onclick string too —
    // a raw single-quote breaks out of the handler, not just innerHTML.
    let chipsHtml = suggestions.map(s => {
        const safe = escapeHTML(s);
        return `<button class="vibe-btn" onclick="window.triggerSearch('${s.replace(/'/g, "\\'")}', 1)">${safe}</button>`;
    }).join(' ');

    wrapper.innerHTML = `
        <p style="color: var(--text-muted); margin-bottom: 12px;">
            No results for "<b>${escapeHTML(originalQuery)}</b>". Did you mean:
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
             ${otherSuggestions.map(s => `<button class="vibe-btn" style="padding:6px 14px; font-size:0.85rem;" onclick="window.triggerSearch('${s.replace(/'/g, "\\'")}', 1)">${escapeHTML(s)}</button>`).join(' ')}
           </div>`
        : '';

    banner.innerHTML = `
        <p style="color: var(--text-muted);">
            No exact match for "<b>${escapeHTML(originalQuery)}</b>" — showing results for "<b>${escapeHTML(usedQuery)}</b>" instead.
        </p>
        ${altHtml}
    `;
    grid.appendChild(banner);
}

// Renders the .match-badge (recommendationScorer.js's matchScore). Returns
// '' if the factSheet wasn't scored (e.g. an older cached shape), so this
// stays backward-compatible rather than showing a broken/empty badge.
function renderMatchBadge(factSheet) {
    if (typeof factSheet.matchScore !== 'number') return '';
    const score = factSheet.matchScore;
    const tier = score >= 75 ? 'match-high' : (score < 45 ? 'match-low' : '');
    return `<div class="match-badge ${tier}">✨ ${score}% Match</div>`;
}

// NEW: renders the "Why?" trigger button + its collapsible breakdown panel
// (recommendationScorer.js's matchReasons, same {ok, text} shape as before —
// just no longer shown inline by default). Returns '' if there's nothing to
// show, so cards without a matchScore render exactly as before.
function renderMatchBreakdown(factSheet) {
    if (typeof factSheet.matchScore !== 'number') return '';

    const reasons = factSheet.matchReasons || [];
    const items = reasons.length > 0
        ? reasons.map(r =>
            `<div class="match-reason ${r.ok ? 'is-match' : ''}">
                <span class="match-reason-icon">${r.ok ? '✓' : '✗'}</span>
                <span>${escapeHTML(r.text)}</span>
            </div>`
          ).join('')
        : `<div class="match-reason">No detailed signals for this result.</div>`;

    return `
        <button class="why-btn" id="why-btn-${factSheet.id}"
                onclick="window.toggleWhyPanel(event, '${factSheet.id}')">Why? ▾</button>
        <div class="why-panel" id="why-${factSheet.id}">
            <div class="why-panel-score">${factSheet.matchScore}% Match</div>
            <div class="match-reasons">${items}</div>
        </div>
    `;
}

// Builds the full <div class="manga-card">...</div> markup for one
// factSheet and caches it (for handleFavoriteClick/toggleWhyPanel lookups),
// but never touches the DOM itself. Exported so other rendering contexts
// (e.g. landing/render.js's carousel rows) can produce byte-identical cards
// without needing a real #community-grid to append into.

function renderReadingBadge(chapters) {
    // If chapters is not a number or N/A, we show generic info
    if (chapters === 'N/A' || !chapters) return '📚 Series';
    
    // Extract number
    const count = parseInt(chapters);
    if (isNaN(count)) return '📚 Series';
    
    // Logic for "Quick read"
    const label = count < 50 ? '⚡ Quick read' : `📚 ${count} Chp.`;
    return `<span class="reading-badge">${label}</span>`;
}

function renderMoodTags(themes) {
    if (!themes || themes.length === 0) return '';
    return `
        <div class="mood-tag-row">
            ${themes.slice(0, 3).map(t => `<span class="mood-tag">${escapeHTML(t)}</span>`).join('')}
        </div>
    `;
}




export function getMangaCardHTML(factSheet) {
    factSheetCache[String(factSheet.id)] = factSheet;
    cacheMangaForDetail(factSheet);

    const genresText = (factSheet.rawGenres && factSheet.rawGenres.length > 0) ? factSheet.rawGenres.slice(0, 3).join(' • ') : "Various";
    const hasScore = typeof factSheet.globalScore === 'number';
    const statusText = factSheet.status || 'Unknown';
    const statusIcon = getStatusIcon(statusText);
    const saved = isFavorite(factSheet.id);
    const safeTitle = escapeHTML(factSheet.title);

    return `
        <div class="manga-card" onclick="window.openMangaDetail && window.openMangaDetail('${factSheet.id}')">
            <div class="manga-cover-container">
                <img src="${factSheet.coverUrl}" alt="${safeTitle}" class="manga-cover" loading="lazy">
                <button class="fav-btn ${saved ? 'active' : ''}" id="fav-${factSheet.id}"
                        onclick="window.handleFavoriteClick(event, '${factSheet.id}')"
                        title="${saved ? 'Remove from My List' : 'Save to My List'}">${saved ? '♥' : '♡'}</button>
                ${hasScore ? `<div class="score-badge">⭐ ${factSheet.globalScore}%</div>` : ''}
            </div>
            <div class="manga-info">
                <h3 class="manga-title" title="${safeTitle}">${safeTitle}</h3>
                ${renderMatchBadge(factSheet)}
                
                <!-- NEW: Mood Tags added below title/match -->
                ${renderMoodTags(factSheet.themes || [])}

                <p class="manga-meta">${escapeHTML(genresText)}</p>
                <div class="manga-facts">
                    <!-- NEW: Reading Badge -->
                    ${renderReadingBadge(factSheet.chapters)}
                    <span>${statusIcon} ${escapeHTML(statusText)}</span>
                </div>
                ${renderMatchBreakdown(factSheet)}
                <p class="manga-synopsis">
                    ${escapeHTML(factSheet.synopsis || 'No description available.')}
                </p>
            </div>
        </div>
    `;
}


export function renderMangaCard(factSheet) {
    const grid = document.getElementById('community-grid');
    if (!grid) return;

    const temp = document.createElement('div');
    temp.innerHTML = getMangaCardHTML(factSheet).trim();
    const card = temp.firstElementChild;
    if (card) grid.appendChild(card);
}


