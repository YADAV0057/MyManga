// ==========================================
// ANILIST API ENGINE (js/anilist.js)
// ==========================================
import { parseSmartQuery } from './parser.js';
 
export { parseSmartQuery };

export async function fetchFromAniListUnified(parsedData, page = 1, isKorean = false, limit = 10) {
    // Country enum must be raw (unquoted), not a string
    const countryFilter = isKorean ? ', countryOfOrigin: KR' : '';
    let queryArgs = `$page: Int, $perPage: Int`;

    let mediaArgs = `type: MANGA, isAdult: false${countryFilter}`;
    let variables = { page: page, perPage: limit };

    if (parsedData.isVibeOrTag) {
        queryArgs += `, $genres: [String]`;
        mediaArgs += `, genre_in: $genres, sort: POPULARITY_DESC`;
        variables.genres = parsedData.cleanQuery.split(',').map(g => g.trim()).filter(g => g.length > 0);
    } else if (parsedData.cleanQuery.length > 0) {
        queryArgs += `, $search: String`;
        mediaArgs += `, search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC]`;
        variables.search = parsedData.cleanQuery;
    } else {
        // Blank query (default page load / browse) — just show what's popular
        mediaArgs += `, sort: POPULARITY_DESC`;
    }

    if (parsedData.statusFilter) {
        queryArgs += `, $status: MediaStatus`;
        mediaArgs += `, status: $status`;
        variables.status = parsedData.statusFilter;
    }

    const query = `
        query (${queryArgs}) {
            Page(page: $page, perPage: $perPage) {
                media(${mediaArgs}) {
                    id title { romaji english } averageScore genres description(asHtml: false) coverImage { large } chapters status
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
