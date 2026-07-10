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
//
// CHANGED (moved from cards to detail page): rating/reading-time/confidence
// badges, mood tags, and the "Similar Titles"/"Share" quick actions were
// originally attempted directly on the homepage cards. That made the grid
// noisy and cramped on mobile, so they now live here instead -- the card
// stays exactly as before (cover, title, score badge, fav button) and this
// richer info only renders once a title is actually opened. Everything
// added below is derived synchronously from fields resultNormalizer.js /
// recommendationScorer.js already put on the item (globalScore, chapters,
// rawGenres, themes, matchScore) -- no new API calls, no new async data
// source (mangaProfiles.js's real mood-vector profile is Firestore-backed
// and async, which is too heavy for a page-open render, so the mood tags
// here are a lightweight synchronous keyword heuristic, not that system).

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

// ---- NEW: badges (rating / reading-time / match confidence) ----
// All three are derived synchronously from fields already on the item --
// no extra fetch, no extra Firestore round-trip.

function getReadingTimeInfo(item) {
    const match = String(item.chapters || '').match(/\d+/);
    if (!match) return null;
    const count = parseInt(match[0], 10);
    if (count <= 20) return { icon: '⚡', label: 'Quick Read' };
    if (count <= 100) return { icon: '📖', label: 'Medium Read' };
    return { icon: '📚', label: 'Long Saga' };
}

function getConfidenceInfo(matchScore) {
    if (matchScore >= 80) return { icon: '🎯', label: 'Strong Match' };
    if (matchScore >= 55) return { icon: '👍', label: 'Good Match' };
    return { icon: '🤔', label: 'Loose Match' };
}

function renderDetailBadgeRow(item) {
    const chips = [];

    if (typeof item.globalScore === 'number') {
        chips.push(`<span class="detail-badge detail-badge-rating">⭐ ${(item.globalScore / 10).toFixed(1)} Rating</span>`);
    }

    const readTime = getReadingTimeInfo(item);
    if (readTime) {
        chips.push(`<span class="detail-badge detail-badge-readtime">${readTime.icon} ${readTime.label}</span>`);
    }

    if (typeof item.matchScore === 'number') {
        const conf = getConfidenceInfo(item.matchScore);
        chips.push(`<span class="detail-badge detail-badge-confidence">${conf.icon} ${conf.label}</span>`);
    }

    if (chips.length === 0) return '';
    return `<div class="detail-badge-row">${chips.join('')}</div>`;
}

// ---- NEW: mood tags ----
// Lightweight synchronous keyword heuristic against rawGenres/themes.
// Deliberately NOT mangaProfiles.js's real cosine-compared mood-atom vector
// (that's async/Firestore-backed and meant for search scoring, not a quick
// page-open render) -- this is a simpler, honest "inferred from genre" label.
const MOOD_TAG_RULES = [
    { tag: 'Tearjerker', icon: '😢', keywords: ['drama', 'tragedy', 'tragic'] },
    { tag: 'Wholesome', icon: '🌼', keywords: ['slice of life', 'iyashikei', 'healing'] },
    { tag: 'Dark', icon: '🌑', keywords: ['horror', 'psychological', 'gore', 'thriller'] },
    { tag: 'Slow Burn', icon: '🔥', keywords: ['romance'] },
    { tag: 'Action-Packed', icon: '⚔️', keywords: ['action', 'martial arts'] }
];

function deriveMoodTags(item) {
    const haystack = [...(item.rawGenres || []), ...(item.themes || [])].map(s => s.toLowerCase());
    const tags = [];
    MOOD_TAG_RULES.forEach(rule => {
        const matched = rule.keywords.some(k => haystack.some(h => h.includes(k)));
        if (matched) tags.push(rule);
    });
    return tags.slice(0, 3); // cap so it can't crowd the page
}

function renderMoodTagRow(item) {
    const tags = deriveMoodTags(item);
    if (tags.length === 0) return '';
    return `<div class="detail-mood-row">${tags.map(t => `<span class="detail-mood-chip">${t.icon} ${t.tag}</span>`).join('')}</div>`;
}

// ---- NEW: quick actions (Save / Similar Titles / Share) ----
// Save reuses the existing bookmark button/handler unchanged. Similar
// Titles and Share are new -- both act on the cached item by id so they
// work the same way handleDetailFavoriteClick already does.

function renderQuickActions(item, saved) {
    const safeId = escapeHTML(String(item.id));
    return `
        <div class="detail-quick-actions">
            <button class="detail-bookmark-btn ${saved ? 'active' : ''}" id="detail-fav-btn"
                    onclick="window.handleDetailFavoriteClick && window.handleDetailFavoriteClick()">
                ${saved ? '♥ Saved' : '♡ Save'}
            </button>
            <button class="detail-action-btn" onclick="window.findSimilarTitles && window.findSimilarTitles('${safeId}')">
                🔍 Similar Titles
            </button>
            <button class="detail-action-btn" onclick="window.shareManga && window.shareManga('${safeId}')">
                🔗 Share
            </button>
        </div>
    `;
}

function showDetailToast(message) {
    const view = document.getElementById(VIEW_ID);
    if (!view) return;
    let toast = view.querySelector('.detail-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'detail-toast';
        view.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 2200);
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


function renderDetailMatchBreakdown(item) {
    if (typeof item.matchScore !== 'number' || !item.matchReasons || item.matchReasons.length === 0) {
        return '';
    }

    const items = item.matchReasons.map(r => `
        <div class="detail-match-item ${r.ok ? 'is-match' : ''}">
            <span class="detail-match-icon">${r.ok ? '✓' : '✗'}</span>
            <span>${escapeHTML(r.text)}</span>
        </div>
    `).join('');

    return `
        <div class="detail-match-container">
            <div class="detail-match-header">
                <span class="detail-match-score">✨ ${item.matchScore}% Match</span>
                <span class="detail-match-title">Why we picked this</span>
            </div>
            <div class="detail-match-list">${items}</div>
        </div>
    `;
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
                ${renderDetailBadgeRow(item)}
                ${renderMoodTagRow(item)}

                <div class="detail-stats-row">
                    ${hasScore ? `<div class="detail-stat"><span class="detail-stat-value">⭐ ${item.globalScore}%</span><span class="detail-stat-label">Score</span></div>` : ''}
                    <div class="detail-stat"><span class="detail-stat-value">${escapeHTML(item.chapters || 'N/A')}</span><span class="detail-stat-label">Chapters</span></div>
                    <div class="detail-stat"><span class="detail-stat-value">${getStatusIcon(statusText)} ${escapeHTML(statusText)}</span><span class="detail-stat-label">Status</span></div>
                </div>

                ${renderQuickActions(item, saved)}


<h3 class="detail-section-heading">Synopsis</h3>
<p class="detail-synopsis" onclick="window.toggleSynopsis(this)" title="Tap to expand/collapse">
    ${synopsis}
</p>


                ${renderDetailMatchBreakdown(item)}

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
    // meta.author is currently always undefined (item.author doesn't exist
    // in the data model yet -- see Step 8 of READLINKS_UPGRADE_PLAN.md).
    // Passed through anyway so the Google fallback query picks it up for
    // free the moment that field is added, with no further code change.
    const meta = { author: item.author };
    let links;
    try {
        links = await Promise.race([
            resolveReadLinks(item.title, meta).catch(() => getFallbackLinks(item.title, meta)),
            new Promise(resolve => setTimeout(() => resolve(getFallbackLinks(item.title, meta)), 2500))
        ]);
    } catch (e) {
        links = getFallbackLinks(item.title, meta);
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
    btn.innerHTML = nowSaved ? '♥ Saved' : '♡ Save';
};

// NEW: "Similar Titles" quick action -- closes the detail page and reuses
// the app's existing search pipeline (same one vibe-btn/preset buttons use)
// with a query built from this title's top genres. No new search logic.
window.findSimilarTitles = function (id) {
    const item = getCachedMangaDetail(id);
    if (!item) return;

    const genres = (item.rawGenres && item.rawGenres.length > 0) ? item.rawGenres.slice(0, 2) : [];
    if (genres.length === 0) {
        showDetailToast('No genre data to find similar titles.');
        return;
    }
    const query = genres.join(' ');

    closeMangaDetail();
    if (typeof window.openSearchResultsPage === 'function') {
        window.openSearchResultsPage(query);
    } else if (typeof window.triggerSearch === 'function') {
        window.triggerSearch(query, 1);
        document.getElementById('community-grid')?.scrollIntoView({ behavior: 'smooth' });
    }
};

// NEW: "Share" quick action -- native share sheet where available, clipboard
// fallback otherwise. Self-contained toast, no dependency on any other file.
window.shareManga = function (id) {
    const item = getCachedMangaDetail(id);
    if (!item) return;

    const shareData = {
        title: item.title,
        text: `Check out "${item.title}" on MangaMood`,
        url: window.location.href
    };

    if (navigator.share) {
        navigator.share(shareData).catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(`${item.title} -- ${window.location.href}`)
            .then(() => showDetailToast('Link copied to clipboard'))
            .catch(() => showDetailToast('Could not copy link'));
    } else {
        showDetailToast('Sharing not supported on this browser.');
    }
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
