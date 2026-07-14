// ==========================================
// js/advancedFilter/fetchAll.js
// ==========================================
// Data only — no DOM, no rendering.
//
// REWIRED (search-engine cutover): previously fired all 4 source adapters
// (anilist/jikan/kitsu/mangadex) in parallel with Promise.all() and
// returned one {source, items}[] entry per source, which merge.js then
// deduped/combined. The new engine doesn't expose a "fetch all 4 sources"
// mode — like the old search.js's runSearch(), it waterfalls tier-by-tier
// server-side and returns ONE merged/ranked result set (confirmed —
// "wiring search engine" Notion log Entry 17: runManga() calls
// source.fetch(plan) singular, stops at the first tier with results).
//
// To keep merge.js working unchanged (per Entry 7, it only cares about the
// {source, items}[] shape, not that every source is populated), this wraps
// the engine's single response as one populated bucket and 3 empty ones.
// Real behavior change worth flagging: this loses the old genuine
// 4-source parallel fan-out (results merged from whichever sources
// actually had data) in favor of whatever single source the engine's own
// waterfall picked. If Advanced Filter results feel thinner than before,
// that's the likely cause — a product/backend decision (e.g. an engine
// mode that fans out and merges server-side) would fix it properly,
// not a frontend-only fix.
import { CONFIG } from '../config.js';
import { normalizeResult } from '../resultNormalizer.js';

const PER_SOURCE_LIMIT = 20;

// Small local fetch-with-timeout wrapper, same pattern used across the
// other rewired files.
async function postToSearchEngine(body, timeoutMs = CONFIG.REQUEST_TIMEOUT) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(CONFIG.SEARCH_ENGINE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`Search engine responded ${res.status}`);
        return await res.json();
    } catch (e) {
        clearTimeout(timeout);
        throw e;
    }
}

/**
 * @param {object} state - formUI.js's readFilterState() output
 * @returns {object} the engine's request body (domain/query/filters)
 */
export function buildEngineRequest(state, page = 1) {
    const includeGenres = state.includeGenres || [];

    // NOTE: the engine hard-rejects an empty query string with a 400
    // (confirmed live — "wiring search engine" Notion log, Entry 26).
    // Advanced Filter can be submitted with genres/status/sort only and
    // no free text, so this falls back to the genre list, then a fixed
    // term, rather than ever sending ''.
    const query = (state.query && state.query.trim())
        || includeGenres.join(' ')
        || 'manga';

    return {
        domain: 'manga',
        query,
        filters: {
            // filters.genres routes through buildPlanFromGenreList
            // server-side, bypassing free-text search — confirmed
            // supported (Entry 17).
            genres: includeGenres,
            excludedGenres: state.excludeGenres || [],
            status: state.status || undefined,
            sort: state.sort === 'rating' ? 'rating' : undefined,
            page,
            perPage: PER_SOURCE_LIMIT
        }
    };
}

/**
 * @param {object} state - formUI.js's readFilterState() output
 * @param {number} page
 * @returns {Promise<{source: string, items: object[]}[]>} same shape as
 *   before — one entry per "source" — so merge.js needs zero changes.
 *   Only the first entry is ever populated now (see header note); the
 *   other 3 are kept as empty stubs purely for shape compatibility.
 */
export async function fetchAllSources(state, page = 1) {
    // Always the same 4 known source names merge.js's priority-fill order
    // expects (AniList > Jikan > MangaDex > Kitsu) — only whichever one
    // the engine actually served gets populated, the rest stay empty.
    const buckets = { AniList: [], Jikan: [], Kitsu: [], MangaDex: [] };

    try {
        const data = await postToSearchEngine(buildEngineRequest(state, page));
        const raw = data.results || [];

        // Engine results are still raw per-source shapes with
        // finalScore/_rankDebug attached server-side — normalizeResult()
        // maps them into the UnifiedResult shape merge.js/render.js
        // already expect, same as every other rewired file.
        const items = raw.map(m => normalizeResult(m, m.source || data.source || 'AniList'));
        const key = Object.prototype.hasOwnProperty.call(buckets, data.source) ? data.source : 'AniList';
        buckets[key] = items;
    } catch (e) {
        console.warn('[fetchAll.js] search engine request failed:', e.message);
    }

    return Object.entries(buckets).map(([source, items]) => ({ source, items }));
}
