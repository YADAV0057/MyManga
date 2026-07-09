// ==========================================
// ANILIST API ENGINE (js/anilist.js)
// ==========================================
// CHANGED: now consumes a SearchPlan (js/parser/searchPlanner.js) instead of
// the simple parser's { cleanQuery, statusFilter, isVibeOrTag }. The old
// top-level parser.js / parseSmartQuery import is kept as a re-export only
// for any other file that may still depend on it — it's no longer used here.
import { parseSmartQuery } from './parser.js';

export { parseSmartQuery };

/**
 * @param {import('./parser/searchPlanner.js').SearchPlan} plan
 * @param {number} page
 * @param {boolean} isKorean - restrict to countryOfOrigin: KR (used for the
 *   dual Korean/global fetch in search.js when the plan is genre-driven)
 * @param {number} limit
 */
export async function fetchFromAniListUnified(plan, page = 1, isKorean = false, limit = 10) {
    // Country enum must be raw (unquoted), not a string
    const countryFilter = isKorean ? ', countryOfOrigin: "KR"' : '';
    let queryArgs = `$page: Int, $perPage: Int`;

    let mediaArgs = `type: MANGA, isAdult: false${countryFilter}`;
    let variables = { page: page, perPage: limit };

    // A plan is "genre-driven" if the planner surfaced any primary genres or
    // secondary themes (both are AniList genre strings post-normalization —
    // AniList doesn't distinguish "genre" from "theme" the way our intent
    // object does, so we search on the union of both).
    const genreList = [...(plan.primaryGenres || []), ...(plan.secondaryThemes || [])];
    const isGenreSearch = genreList.length > 0;
    const freeText = (plan.cleanQuery || '').trim();

    if (isGenreSearch) {
        queryArgs += `, $genres: [String]`;
        mediaArgs += `, genre_in: $genres`;
        variables.genres = genreList;
    } else if (freeText.length > 0) {
        queryArgs += `, $search: String`;
        mediaArgs += `, search: $search`;
        variables.search = freeText;
    }
    // else: blank query (default page load / browse) — no search/genre_in arg at all

    // NEW: exclude genres the planner determined should be avoided (mood-based
    // avoids + explicit "no romance"-style negations, per ruleEngine.js/pipeline.js)
    if (plan.excludedGenres && plan.excludedGenres.length > 0) {
        queryArgs += `, $excludedGenres: [String]`;
        mediaArgs += `, genre_not_in: $excludedGenres`;
        variables.excludedGenres = plan.excludedGenres;
    }

    if (plan.filters?.statusFilter) {
        queryArgs += `, $status: MediaStatus`;
        mediaArgs += `, status: $status`;
        variables.status = plan.filters.statusFilter;
    }

    // Sort: preserves the original defaults (POPULARITY_DESC for genre/blank
    // search, [SEARCH_MATCH, POPULARITY_DESC] for free text) and adds an
    // explicit "rating" option now that the planner can request one.
    let sortValues;
    if (plan.filters?.sort === 'rating') {
        sortValues = ['SCORE_DESC'];
    } else if (isGenreSearch || !variables.search) {
        sortValues = ['POPULARITY_DESC'];
    } else {
        sortValues = ['SEARCH_MATCH', 'POPULARITY_DESC'];
    }
    mediaArgs += `, sort: [${sortValues.join(', ')}]`;

    const query = `
        query (${queryArgs}) {
            Page(page: $page, perPage: $perPage) {
                media(${mediaArgs}) {
                    id title { romaji english } averageScore genres description(asHtml: false) coverImage { large } chapters status popularity
                }
            }
        }
    `;

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            console.error(`AniList API returned HTTP ${response.status}`);
            return [];
        }

        const data = await response.json();

        if (data.errors) {
            console.error("AniList GraphQL Error:", data.errors);
            return [];
        }

        return data.data ? data.data.Page.media : [];
    } catch (error) {
        console.error("AniList API Error:", error);
        return [];
    }
}
