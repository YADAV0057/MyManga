// ==========================================
// TV SEARCH (js/tv/tvSearch.js)
// ==========================================
// Calls the same `movie-search` Supabase Edge Function movieSearch.js uses,
// with `mediaType: 'tv'` in the request body — see the 2026-08-01 TV
// SUPPORT changes to movie-search/index.ts, domains.js, adapters/tmdb.ts.
// Deliberately NOT a separate edge function; this file is the frontend-side
// mirror of that decision. Everything else (contract, headers, hasMore
// inference) matches movieSearch.js exactly, since the backend response
// shape is identical between mediaType: 'movie' and 'tv' — TMDB's `name`/
// `first_air_date` are already normalized into `title`/`release_date` by
// index.ts's normalizeTmdbTv before this ever sees them.
//
//   POST CONFIG.MOVIE_SEARCH_ENGINE_URL
//   Headers: Content-Type: application/json,
//            Authorization: Bearer <CONFIG.MOVIE_SEARCH_ANON_KEY>
//   Body: {
//     query?: string,
//     mediaType: 'tv',
//     language?: string,
//     watchProviders?: string,
//     watchRegion?: string,
//     genres?: string,
//     page?: number
//   }
//   Response: {
//     results: [...ranked show objects, see tvRenderer.js header...],
//     meta: { mediaType: 'tv', tier: 'tmdb', count, watchRegion, exclusions }
//   }
//
// Same hasMore caveat as movieSearch.js: only the TMDB tier's pagination is
// confirmed (TV has no OMDb/Trakt fallback tier at all — see index.ts's
// runWaterfall — so in practice tier is always 'tmdb' for TV, but this
// still gates on it defensively in case that ever changes).

import { CONFIG } from '../config.js';
import { getTvCardHTML } from './tvRenderer.js';

const GRID_ID = 'tv-results-grid';
const TMDB_PAGE_SIZE = 20;

function getGrid() {
    return document.getElementById(GRID_ID);
}

export function renderTvSkeletons(count = 12) {
    const grid = getGrid();
    if (!grid) return;
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card movie-skeleton-card">
                <div class="skeleton-cover movie-skeleton-poster"></div>
                <div class="skeleton-info">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-meta" style="margin-top:5px;margin-bottom:12px;"></div>
                    <div class="skeleton-line skeleton-text"></div>
                    <div class="skeleton-line skeleton-text-short"></div>
                </div>
            </div>`;
    }
    grid.innerHTML = html;
}

function renderEmptyState(message) {
    const grid = getGrid();
    if (!grid) return;
    grid.innerHTML = `<p class="search-empty-state">${message}</p>`;
}

/**
 * @param {string} query
 * @param {object} filters — language/watchProviders/watchRegion/genres/page
 */
async function callTvSearchEngine(query, filters = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT || 8000);

    try {
        const response = await fetch(CONFIG.MOVIE_SEARCH_ENGINE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.MOVIE_SEARCH_ANON_KEY}`,
            },
            body: JSON.stringify({ query, mediaType: 'tv', ...filters }),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`TV search engine returned HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

/**
 * Core entry point. Matches movieSearch.js's triggerMovieSearch(query, page,
 * appendMode) shape so tvMain.js can follow the exact same pattern.
 *
 * @param {string} query
 * @param {number} page
 * @param {boolean} appendMode
 * @param {object} [extraFilters] — language/watchProviders/watchRegion/genres
 * @returns {Promise<{appended: number, hasMore: boolean, meta: object}>}
 */
export async function triggerTvSearch(query, page = 1, appendMode = false, extraFilters = {}) {
    const grid = getGrid();
    if (!grid) return { appended: 0, hasMore: false, meta: {} };

    if (!appendMode) {
        renderTvSkeletons();
    }

    let data;
    try {
        data = await callTvSearchEngine(query || '', { page, ...extraFilters });
    } catch (error) {
        console.error('[tvSearch.js] TV search engine call failed:', error);
        if (!appendMode) {
            renderEmptyState('Something went wrong searching — try again in a moment.');
        }
        return { appended: 0, hasMore: false, meta: {} };
    }

    const results = Array.isArray(data?.results) ? data.results : [];
    const meta = data?.meta || {};

    if (!appendMode) grid.innerHTML = '';

    if (results.length === 0 && !appendMode) {
        const reason = data?.error ? `Error: ${data.error}` : (query ? `No results for "${query}".` : 'No results found.');
        renderEmptyState(reason);
        return { appended: 0, hasMore: false, meta };
    }

    results.forEach(show => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = getTvCardHTML(show).trim();
        if (wrapper.firstElementChild) grid.appendChild(wrapper.firstElementChild);
    });

    const hasMore = meta.tier === 'tmdb' && results.length >= TMDB_PAGE_SIZE;

    return { appended: results.length, hasMore, meta };
}
