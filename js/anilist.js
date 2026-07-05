import { allMoods } from './moods.js';

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

    const isVibeOrTag = cleanQuery.includes(',') || allMoods.some(mood => mood.query === cleanQuery);
    return { cleanQuery, statusFilter, isVibeOrTag };
}

export async function fetchFromAniListUnified(parsedData, page = 1, isKorean = false, limit = 10) {
    // FIX 1: Removed quotation marks around KR. It must be a raw Enum, not a string!
    const countryFilter = isKorean ? ', countryOfOrigin: KR' : '';
    let queryArgs = `$page: Int, $perPage: Int`;
    
    // FIX 2: Removed 'sort: POPULARITY_DESC' from the base string to prevent duplicate sort errors
    let mediaArgs = `type: MANGA, isAdult: false${countryFilter}`;
    let variables = { page: page, perPage: limit };

    if (parsedData.isVibeOrTag) {
        queryArgs += `, $genres: [String]`;
        // Added the sort specifically for Tags and the Quiz here
        mediaArgs += `, genre_in: $genres, sort: POPULARITY_DESC`;
        variables.genres = parsedData.cleanQuery.split(',').map(g => g.trim()).filter(g => g.length > 0);
    } else if (parsedData.cleanQuery.length > 0) {
        queryArgs += `, $search: String`;
        // Search gets its own specific search-match sort
        mediaArgs += `, search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC]`;
        variables.search = parsedData.cleanQuery;
    } else {
        // Fallback sort if it's just a blank default page load
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
        
        // FIX 3: Added a safety check to log any future silent GraphQL syntax errors directly to your console
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
