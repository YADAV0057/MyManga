// ==========================================
// SEARCH (js/search.js) — calls the new Supabase engine
// ==========================================
//
// Replaces the old client-side pipeline entirely:
//   buildIntent() -> buildSearchPlan() -> Firestore cache check ->
//   AniList/Jikan/Kitsu/MangaDex waterfall -> scoreResults() -> render
//
// The new flow is just:
//   one POST to the engine -> normalizeResult() (KEPT, unchanged) ->
//   renderMangaCard() (KEPT, unchanged)
//
// The engine (Supabase Edge Function, POST /functions/v1/search) does its
// own caching (Postgres search_cache), its own mood/routing/classification,
// its own tiered AniList->Jikan->Kitsu->MangaDex fallback server-side, and
// (as of 2026-07-14) its own pagination. This file's only job is: call it,
// shape the response for the existing UI, and preserve the
// triggerSearch/triggerPresetSearch/triggerQuickFilter contract that
// main.js and searchResultsPage.js already depend on.
//
// CONFIRMED against the live engine (see "wiring search engine" Notion
// page, Entries 17-20 — live domains.js/index.ts read + a real page-1 vs
// page-2 test that returned different result sets):
//   Request:  POST { domain: "manga", query, filters: {
//               genres?, excludedGenres?, status?, sort?, maxChapters?,
//               page?, perPage?
//             } }
//   Response: { results, cached, source?, mood?, page, hasMore }
//   - `page`/`perPage` are real, live-tested pagination params — no longer
//     a guess. `hasMore` comes straight from the engine (its own "a full
//     page probably means more" heuristic, computed server-side) — this
//     file no longer estimates it locally.
//   - `filters.status`/`maxChapters`/`excludedGenres` are confirmed
//     supported request fields (read directly off buildBasicPlan() in the
//     live domains.js). NOTE: `maxChapters` is accepted into the plan but
//     not currently read/applied by any of the 4 adapters — it's a no-op
//     server-side today, not a bug in this file.
//   - Per-result match score / reasoning trail — the engine still does not
//     return either (response's `mood` is an AGGREGATE for the whole
//     query, not per-title). Cards render without a matchScore
//     (renderer.js already handles that gracefully) — mixerPage.js's
//     match-% scoring is still a follow-up once the engine is extended.
//   - aiPanel.js IS now wired in (2026-07-17): on a fresh, non-append
//     search this file calls runIntentAnimation() before the fetch, then
//     finishAnimation()/settlePanel(data, query) once the response lands,
//     following aiPanel.js's own "EXPECTED CALL CONTRACT" header comment.
//     Append-mode (load-more) calls intentionally skip all four panel
//     hooks — the panel reflects the query's overall intent, not each
//     page, so re-running it on every "load more" click would just
//     replay the same summary. setApiTierStatus() is NOT called anywhere
//     here — it's a documented no-op in aiPanel.js now that the waterfall
//     runs entirely server-side, so there was nothing to wire it to.
//
// STILL UNCONFIRMED / NOT YET DONE:
//   1. Endpoint URL — CONFIG.SEARCH_ENGINE_URL is a NEW config.js field
//      that does not exist yet. Needs to be added: the live project's URL
//      is https://uvperhzhnosjtkwxxnte.supabase.co/functions/v1/search
//      (confirmed via Supabase directly, 2026-07-14).
//
// If anything not covered above needs checking, the OLD search.js (from
// the yadav0057-mymanga dump, see Notion history) documents exactly what
// contract callers (searchResultsPage.js, main.js, moods.js, the quick
// filter chips) were relying on.

import { CONFIG } from './config.js';
import { normalizeResult } from './resultNormalizer.js';
import { getMangaCardHTML } from './renderer.js';
import { runIntentAnimation, finishAnimation, settlePanel, hideAIPanel } from './aiPanel.js';

const GRID_ID = 'community-grid';
const PAGE_SIZE = 10; // mirrors the old CONFIG.SEARCH_LIMIT default; sent as filters.perPage

function getGrid() {
    return document.getElementById(GRID_ID);
}

function renderSkeletonLoaders(count = 12) {
    const grid = getGrid();
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

function renderEmptyState(message) {
    const grid = getGrid();
    if (!grid) return;
    grid.innerHTML = `<p class="search-empty-state">${message}</p>`;
}

/**
 * Calls the new engine directly. Returns the raw { results, cached,
 * source, mood, page, hasMore } response, or throws on a network/HTTP
 * failure.
 * @param {string} query
 * @param {object} filters — genres/excludedGenres/status/sort/maxChapters/
 *   page/perPage, all confirmed supported request fields (see header note)
 */
async function callSearchEngine(query, filters = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT || 8000);

    try {
        const response = await fetch(CONFIG.SEARCH_ENGINE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domain: 'manga', query, filters }),
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            throw new Error(`Search engine returned HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        clearTimeout(timeout);
        throw error;
    }
}

/**
 * Core entry point. Matches the old triggerSearch(query, page, appendMode)
 * contract exactly: renders into #community-grid, returns { appended,
 * hasMore } so searchResultsPage.js / advancedFilter can move/track cards
 * the same way they always have.
 *
 * @param {string} query
 * @param {number} page — real pagination param, sent as filters.page
 * @param {boolean} appendMode
 * @param {object} [extraFilters] — merged into the request's filters
 * @returns {Promise<{appended: number, hasMore: boolean}>}
 */
export async function triggerSearch(query, page = 1, appendMode = false, extraFilters = {}) {
    const grid = getGrid();
    if (!grid) return { appended: 0, hasMore: false };

    if (!appendMode) {
        renderSkeletonLoaders();
        // Stage 1 — generic "thinking" indicator. No reasoning data exists
        // yet at this point (mood/routing/classification are computed
        // server-side, inside the same call below), see aiPanel.js header.
        await runIntentAnimation(query || '');
    }

    const filters = {
        page,
        perPage: PAGE_SIZE,
        ...extraFilters
    };

    let data;
    try {
        data = await callSearchEngine(query || '', filters);
    } catch (error) {
        console.error('[search.js] Search engine call failed:', error);
        if (!appendMode) {
            renderEmptyState('Something went wrong searching — try again in a moment.');
            hideAIPanel();
        }
        return { appended: 0, hasMore: false };
    }

    const rawResults = Array.isArray(data?.results) ? data.results : [];
    const source = data?.source || 'AniList';

    const normalized = rawResults.map(raw => normalizeResult(raw, source));

    if (!appendMode) {
        // Stage 3 — ranking + "done", then Stage 4 — collapse into the
        // compact summary bar with the mood/routing/classification
        // breakdown (or the graceful "no reasoning trail" state on a
        // cache hit, handled inside settlePanel/buildPanelData).
        await finishAnimation(normalized.length);
        settlePanel(data || {}, query || '');
    }

    if (!appendMode) grid.innerHTML = '';

    if (normalized.length === 0 && !appendMode) {
        renderEmptyState(query ? `No results for "${query}".` : 'No results found.');
        return { appended: 0, hasMore: false };
    }

    normalized.forEach(item => {
        const wrapper = document.createElement('div');
        // BUGFIX: renderMangaCard() has no return value — it finds
        // #community-grid itself and appends the card directly, which
        // both double-renders here AND made `.trim()` crash on undefined
        // (the original "Cannot read properties of undefined (reading
        // 'trim')" bug). getMangaCardHTML() is the pure string version
        // renderer.js already exports for exactly this kind of caller.
        wrapper.innerHTML = getMangaCardHTML(item).trim();
        if (wrapper.firstElementChild) grid.appendChild(wrapper.firstElementChild);
    });

    // hasMore now comes straight from the engine — confirmed real via a
    // live page-1 vs page-2 test (Notion "wiring search engine" Entry 20).
    // Falls back to the old length-based heuristic only if the engine
    // response is ever missing the field (e.g. an old cached deploy),
    // so this degrades gracefully rather than breaking pagination outright.
    const hasMore = typeof data?.hasMore === 'boolean' ? data.hasMore : normalized.length >= PAGE_SIZE;

    return { appended: normalized.length, hasMore };
}

/**
 * Mood-preset buttons (moods.js's allMoods) bypass free-text query
 * classification and search directly on a genre list, same intent as the
 * old buildPlanFromGenreList() bypass path.
 * @param {string} genreQuery — comma-separated genre string, e.g. "Action, Drama"
 */
export async function triggerPresetSearch(genreQuery) {
    return triggerSearch(genreQuery, 1, false);
}

/**
 * Quick filter chips ("Finish tonight" / "Long binge" / "Completed").
 * @param {string} type
 */
export async function triggerQuickFilter(type) {
    const filterMap = {
        'finish-tonight': { maxChapters: 20 },
        'long-binge': { maxChapters: null }, // TODO: old code used a min-chapters bound here; engine has no min-chapters filter today (confirmed — buildBasicPlan() only reads maxChapters as an upper bound, and it's not even applied by any adapter yet, see header note)
        'completed': { status: 'completed' }
    };

    const extraFilters = filterMap[type] || {};
    return triggerSearch('', 1, false, extraFilters);
}
