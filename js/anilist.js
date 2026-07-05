// ==========================================
// ANILIST API STACK (js/anilist.js)
// ==========================================
import { allMoods } from './moods.js';

// If you moved this to parser.js, you can delete this block, 
// but it is safe to leave here if it is currently exported!
export function parseSmartQuery(rawQuery) {
    let statusFilter = null;
    let cleanQuery = rawQuery;

    const statusMatch = cleanQuery.match(/status:(completed|releasing|hiatus|cancelled)/i);
    if (statusMatch) {
        const s = statusMatch[1].toUpperCase();
        if (s === 'COMPLETED') statusFilter = 'FINISHED';
        else statusFilter = s;
        cleanQuery = cleanQuery.replace(statusMatch[0], '').trim();
    }

    const validGenres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Psychological", "Romance", "Slice of Life", "Thriller", "Supernatural", "Sci-Fi", "Mecha", "Sports", "Music"];
    const normalizedQuery = cleanQuery.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const isVibeOrTag = 
        cleanQuery.includes(',') || 
        allMoods.some(mood => mood.query.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedQuery) ||
        validGenres.some(g => g.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedQuery);

    return { cleanQuery, statusFilter, isVibeOrTag };
}

export async function fetchFromAniListUnified(parsedData, page = 1, isKorean = false, limit = 10) {
    const countryFilter = isKorean ? ', countryOfOrigin: "KR"' : '';
    let query, variables;

    // Hardcoding the exact GraphQL syntax prevents strict parsing errors
    if (parsedData.isVibeOrTag) {
        query = `
            query ($page: Int, $perPage: Int, $genres: [String]) {
                Page(page: $page, perPage: $perPage) {
                    media(type: MANGA, isAdult: false${countryFilter}, genre_in: $genres, sort: [POPULARITY_DESC]) {
                        id title { romaji english } averageScore genres description(asHtml: false) coverImage { large } chapters status
                    }
                }
            }
        `;
        
        const validGenres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller", "Ecchi"];
        
        variables = { 
            page: page, 
            perPage: limit,
            // Forces exact casing so AniList doesn't reject the query
            genres: parsedData.cleanQuery.split(',').map(g => {
                let item = g.trim();
                let normalizedItem = item.toLowerCase().replace(/[^a-z0-9]/g, '');
                let match = validGenres.find(v => v.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedItem);
                return match ? match : item; 
            }).filter(g => g.length > 0)
        };
    } else if (parsedData.cleanQuery.length > 0) {
        query = `
            query ($page: Int, $perPage: Int, $search: String) {
                Page(page: $page, perPage: $perPage) {
                    media(type: MANGA, isAdult: false${countryFilter}, search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC]) {
                        id title { romaji english } averageScore genres description(asHtml: false) coverImage { large } chapters status
                    }
                }
            }
        `;
        variables = { page: page, perPage: limit, search: parsedData.cleanQuery };
    } else {
        query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(type: MANGA, isAdult: false${countryFilter}, sort: [POPULARITY_DESC]) {
                        id title { romaji english } averageScore genres description(asHtml: false) coverImage { large } chapters status
                    }
                }
            }
        `;
        variables = { page: page, perPage: limit };
    }

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            // Throw a specific error if we hit the limit
            if (response.status === 429) {
                throw new Error("RATELIMIT");
            }
            console.error(`AniList API returned HTTP ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data.data ? data.data.Page.media : [];
    } catch (error) {
        if (error.message === "RATELIMIT") throw error; // Send to search.js UI
        console.error("AniList API Error:", error);
        return [];
    }
}
