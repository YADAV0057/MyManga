// ==========================================
// MOVIE SEARCH (js/movies/movieSearch.js)
// ==========================================
// Calls the live `movie-search` Supabase Edge Function directly. Confirmed
// contract via Supabase:get_edge_function against the deployed v7 source
// (index.ts / domains.js / rankResults.js), 2026-07-29:
//
//   POST CONFIG.MOVIE_SEARCH_ENGINE_URL
//   Headers: Content-Type: application/json,
//            Authorization: Bearer <CONFIG.MOVIE_SEARCH_ANON_KEY>
//            (REQUIRED — movie-search has verify_jwt: true, unlike manga's
//            `search` function. Omitting this returns a 401, not a graceful
//            empty result.)
//   Body: {
//     query?: string,            // free-text mood/keyword query
//     language?: string,         // ISO 639-1, e.g. "en", "hi"
//     watchProviders?: string,   // comma-separated TMDB provider IDs
//     watchRegion?: string,      // ISO 3166-1, defaults server-side to "IN"
//     genres?: string,           // comma-separated TMDB genre IDs
//     page?: number
//   }
//   Response: {
//     results: [...ranked movie objects, see movieRenderer.js header...],
//     meta: { tier: 'tmdb'|'omdb'|'trakt', count, watchRegion, exclusions }
//   }
//
// IMPORTANT — no `hasMore` field in the live response (unlike manga's
// `search` function, which returns one directly). This file infers it from
// TMDB's fixed page size (20 results/page is TMDB's own constant, not
// configurable) — a full page of 20 probably means more; the OMDb/Trakt
// fallback tiers return fewer per page and pagination against them is
// unconfirmed, so hasMore is forced false whenever meta.tier !== 'tmdb' to
// avoid a "Next Page" button that silently does nothing.
//
// No aiPanel-equivalent reasoning trail exists yet for movies (that's manga-
// specific, see search.js) — this file does not attempt to fake one.

import { CONFIG } from '../config.js';
import { getMovieCardHTML } from './movieRenderer.js';

const GRID_ID = 'movie-results-grid';
const TMDB_PAGE_SIZE = 20;

function getGrid() {
    return document.getElementById(GRID_ID);
}

export function renderMovieSkeletons(count = 12) {
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
async function callMovieSearchEngine(query, filters = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT || 8000);

    try {
        const response = await fetch(CONFIG.MOVIE_SEARCH_ENGINE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.MOVIE_SEARCH_ANON_KEY}`,
            },
            body: JSON.stringify({ query, ...filters }),
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Movie search engine returned HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

/**
 * Core entry point. Matches search.js's triggerSearch(query, page, appendMode)
 * shape so moviesMain.js/moviesResultsPage-equivalent code can follow the
 * same pattern the manga side already uses.
 *
 * @param {string} query
 * @param {number} page
 * @param {boolean} appendMode
 * @param {object} [extraFilters] — language/watchProviders/watchRegion/genres
 * @returns {Promise<{appended: number, hasMore: boolean, meta: object}>}
 */
export async function triggerMovieSearch(query, page = 1, appendMode = false, extraFilters = {}) {
    const grid = getGrid();
    if (!grid) return { appended: 0, hasMore: false, meta: {} };

    if (!appendMode) {
        renderMovieSkeletons();
    }

    let data;
    try {
        data = await callMovieSearchEngine(query || '', { page, ...extraFilters });
    } catch (error) {
        console.error('[movieSearch.js] Movie search engine call failed:', error);
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

    results.forEach(movie => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = getMovieCardHTML(movie).trim();
        if (wrapper.firstElementChild) grid.appendChild(wrapper.firstElementChild);
    });

    // See header note — only the TMDB tier's pagination is confirmed.
    const hasMore = meta.tier === 'tmdb' && results.length >= TMDB_PAGE_SIZE;

    return { appended: results.length, hasMore, meta };
}

