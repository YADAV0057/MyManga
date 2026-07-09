// ==========================================
// js/advancedFilter/fetchAll.js
// ==========================================
// Data only — no DOM, no rendering. Calls all 4 source adapters directly
// with a hand-built plan object, deliberately bypassing the mood/NLU engine
// (parser/pipeline.js's buildIntent(), parser/searchPlanner.js's
// buildSearchPlan()) entirely. The adapters only care about the SHAPE of
// the plan they're given — { cleanQuery, primaryGenres, secondaryThemes,
// excludedGenres, filters } — not where it came from. buildPlanFromGenreList()
// in searchPlanner.js already does the same thing for preset mood buttons,
// so this isn't a new pattern, just a new (non-mood) source for that shape.
//
// Unlike search.js's runSearch(), which waterfalls tier-by-tier and stops at
// the first one with results, this fires all 4 in parallel with
// Promise.all() and returns everything — merge.js (not this file) is what
// combines/dedupes them into one grid.
import { fetchFromAniListUnified } from '../anilist.js';
import { fetchFromJikanFallback } from '../jikan.js';
import { fetchFromKitsuFallback } from '../kitsu.js';
import { fetchFromMangaDexFallback } from '../mangadex.js';

const PER_SOURCE_LIMIT = 20;

/**
 * @param {object} state - formUI.js's readFilterState() output
 * @returns {import('../parser/searchPlanner.js').SearchPlan} adapter-ready plan
 */
export function buildPlanFromFilterState(state) {
    return {
        cleanQuery: state.query || '',
        primaryGenres: state.includeGenres || [],
        secondaryThemes: [],
        excludedGenres: state.excludeGenres || [],
        filters: {
            statusFilter: state.status || null,
            sort: state.sort === 'rating' ? 'rating' : null
        }
    };
}

/**
 * @param {object} state - formUI.js's readFilterState() output
 * @param {number} page
 * @returns {Promise<{source: string, items: object[]}[]>} raw (un-normalized)
 *   results per source, in the same "raw media" shape resultNormalizer.js
 *   expects — never throws, each tier independently falls back to [].
 */
export async function fetchAllSources(state, page = 1) {
    const plan = buildPlanFromFilterState(state);

    // Every adapter already catches its own errors and resolves to [] rather
    // than rejecting (see resultNormalizer.js's header comment on the
    // "silent-failure waterfall") — the .catch() here is just defense in
    // depth in case that ever changes for one adapter.
    const [anilistRaw, jikanRaw, kitsuRaw, mangadexRaw] = await Promise.all([
        fetchFromAniListUnified(plan, page, false, PER_SOURCE_LIMIT).catch(() => []),
        fetchFromJikanFallback(plan, page, PER_SOURCE_LIMIT).catch(() => []),
        fetchFromKitsuFallback(plan, page, PER_SOURCE_LIMIT).catch(() => []),
        fetchFromMangaDexFallback(plan, page, PER_SOURCE_LIMIT).catch(() => [])
    ]);

    return [
        { source: 'AniList', items: anilistRaw || [] },
        { source: 'Jikan', items: jikanRaw || [] },
        { source: 'Kitsu', items: kitsuRaw || [] },
        { source: 'MangaDex', items: mangadexRaw || [] }
    ];
}

