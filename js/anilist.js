
// ==========================================
// ANILIST API STACK (js/anilist.js)
// ==========================================
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

    // List of standard standalone genres for direct validation fallback
    const validGenres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Psychological", "Romance", "Slice of Life", "Thriller", "Supernatural", "Sci-Fi", "Mecha", "Sports", "Music"];
    
    // Normalize string comparisons to safely match case differences or whitespace variations
    const normalizedQuery = cleanQuery.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const isVibeOrTag = 
        cleanQuery.includes(',') || 
        allMoods.some(mood => mood.query.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedQuery) ||
        validGenres.some(g => g.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedQuery);

    return { cleanQuery, statusFilter, isVibeOrTag };
}

export async function fetchFromAniListUnified(parsedData, page = 1, isKorean = false, limit = 10) {
    const countryFilter = isKorean ? ', countryOfOrigin: "KR"' : '';
    let queryArgs = `$page: Int, $perPage: Int`;
    let mediaArgs = `type: MANGA, isAdult: false${countryFilter}`;
    let variables = { page: page, perPage: limit };

    if (parsedData.isVibeOrTag) {
        queryArgs += `, $genres: [String]`;
        mediaArgs += `, genre_in: $genres, sort: POPULARITY_DESC`;
        
        // Ensure keys like 'SliceOfLife' translate perfectly to 'Slice of Life' for AniList syntax
        variables.genres = parsedData.cleanQuery.split(',').map(g => {
            let item = g.trim();
            if (item.toLowerCase() === 'sliceoflife') return 'Slice of Life';
            return item;
        }).filter(g => g.length > 0);
        
    } else if (parsedData.cleanQuery.length > 0) {
        queryArgs += `, $search: String`;
        mediaArgs += `, search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC]`;
        variables.search = parsedData.cleanQuery;
    } else {
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
        return data.data ? data.data.Page.media : [];
    } catch (error) {
        console.error("AniList API Error:", error);
        return [];
    }
}
