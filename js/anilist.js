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
    
    // We dynamically build the query so we never send empty variables that crash AniList
    let queryArgs = `$page: Int, $perPage: Int`;
    let mediaArgs = `type: MANGA, isAdult: false${countryFilter}`;
    let variables = { page: page, perPage: limit };

    if (parsedData.statusFilter) {
        queryArgs += `, $status: MediaStatus`;
        mediaArgs += `, status: $status`;
        variables.status = parsedData.statusFilter;
    }

    if (parsedData.isVibeOrTag) {
        queryArgs += `, $genres: [String]`;
        mediaArgs += `, genre_in: $genres, sort: [POPULARITY_DESC]`;
        
        // The master list of acceptable AniList genres
        const validAniListGenres = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"];
        
        // This takes the query, strips formatting, and forces it to perfectly match the AniList master list
        variables.genres = parsedData.cleanQuery.split(',')
            .map(g => g.trim().toLowerCase().replace(/[^a-z]/g, ''))
            .map(cleaned => validAniListGenres.find(vg => vg.toLowerCase().replace(/[^a-z]/g, '') === cleaned))
            .filter(Boolean); // Removes any null/undefined results

        // Absolute fallback: If the quiz sends complete garbage, default to Action so the app doesn't crash
        if (variables.genres.length === 0) {
            variables.genres = ["Action"];
        }

    } else if (parsedData.cleanQuery.trim().length > 0) {
        queryArgs += `, $search: String`;
        mediaArgs += `, search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC]`;
        variables.search = parsedData.cleanQuery.trim();
    } else {
        mediaArgs += `, sort: [POPULARITY_DESC]`;
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

        const data = await response.json();
        
        // If AniList rejects the query, log it so we can see why, rather than crashing
        if (data.errors) {
            console.error("AniList GraphQL Error:", data.errors);
            return [];
        }

        return data.data && data.data.Page ? data.data.Page.media : [];
    } catch (error) {
        console.error("AniList Fetch Error:", error);
        return [];
    }
}
