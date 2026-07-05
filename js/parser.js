// ==========================================
// SMART PARSER (js/parser.js)
// ==========================================
import { allMoods } from './moods.js';

export function parseSmartQuery(rawQuery) {
    let statusFilter = null;
    let cleanQuery = rawQuery;

    // Check for status filters
    const statusMatch = cleanQuery.match(/status:(completed|releasing|hiatus|cancelled)/i); 
    if (statusMatch) {
        const s = statusMatch[1].toUpperCase();
        if (s === 'COMPLETED') statusFilter = 'FINISHED';
        else statusFilter = s;
        cleanQuery = cleanQuery.replace(statusMatch[0], '').trim();
    }

    // List of standard standalone genres for direct validation fallback
    const validGenres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Psychological", "Romance", "Slice of Life", "Thriller", "Supernatural", "Sci-Fi", "Mecha", "Sports", "Music", "Mahou Shoujo"];

    // Normalize string comparisons to safely match case differences or whitespace variations
    const normalizedQuery = cleanQuery.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const isVibeOrTag =
        cleanQuery.includes(',') ||
        allMoods.some(mood => mood.query.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedQuery) ||
        validGenres.some(g => g.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedQuery);

    return { cleanQuery, statusFilter, isVibeOrTag };
}
