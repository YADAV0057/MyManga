// ==========================================
// MANGAUPDATES CLIENT (js/parser/dictionary/mangaUpdatesClient.js)
// ==========================================
// MangaUpdates (Baka-Updates) has the deepest community-curated
// "recommended series" data of any manga source — richer than AniList's or
// Jikan's, because MangaUpdates' whole community culture is built around
// hand-curated similar-series lists, not just star ratings. Official API,
// no key required for these read-only endpoints: https://api.mangaupdates.com/v1
//
// HONESTY NOTE: I could not verify the exact recommendation field names
// against a live response from here (no network access in this session).
// The field names below (`recommendations[].series_name`,
// `category_recommendations[].series_name`) match the shape MangaUpdates'
// v1 API is documented/reported to return, but treat this file as the one
// most likely to need a field-name tweak on its first real run — the
// defensive fallbacks below mean a wrong field name degrades to "no data
// from this source" (silently skipped by entityRelations.js's voting),
// not a crash.

import axios from 'axios';

const MANGAUPDATES_URL = 'https://api.mangaupdates.com/v1';

/**
 * Searches MangaUpdates by title, returning just the series id we need to
 * pull its recommendation list. MangaUpdates' search is POST, unlike every
 * other client here (GET) — that's their API's design, not ours.
 */
export async function searchMangaUpdates(query, limit = 3) {
    try {
        const res = await axios.post(`${MANGAUPDATES_URL}/series/search`, {
            search: query,
            page: 1,
            perpage: limit
        });
        const results = res.data?.results || [];
        return results.map(r => ({
            id: r.record?.series_id ?? r.record?.id,
            title: r.record?.title
        })).filter(r => r.id);
    } catch (e) {
        console.warn(`[mangaUpdatesClient] search failed for "${query}": ${e.message}`);
        return [];
    }
}

/**
 * Pulls a series' user-submitted + category-based recommendations.
 * MangaUpdates distinguishes the two on the site itself (hand-picked
 * "Recommendations" vs auto-generated "Category Recommendations"), so we
 * keep that distinction and let entityRelations.js weight them
 * differently — a human-curated rec is a stronger signal than a
 * genre-overlap auto-suggestion.
 */
export async function getMangaUpdatesRecommendations(seriesId) {
    try {
        const res = await axios.get(`${MANGAUPDATES_URL}/series/${seriesId}`);
        const data = res.data || {};
        const curated = (data.recommendations || []).map(r => r.series_name).filter(Boolean);
        const categoryBased = (data.category_recommendations || []).map(r => r.series_name).filter(Boolean);
        return { curated, categoryBased };
    } catch (e) {
        console.warn(`[mangaUpdatesClient] recommendations lookup failed for id ${seriesId}: ${e.message}`);
        return { curated: [], categoryBased: [] };
    }
}

/**
 * Same shape as shikimoriClient's convenience wrapper: concept query in,
 * flat deduped related-title list out. Curated recs count once;
 * category-based recs count once too, but entityRelations.js can weight
 * them separately if it's ever worth the extra complexity — for now both
 * just feed the same "this source suggested this title" vote.
 */
export async function fetchMangaUpdatesRelatedTitles(query, { seedLimit = 3, delayMs = 700 } = {}) {
    const seeds = await searchMangaUpdates(query, seedLimit);
    const names = new Set();
    for (let i = 0; i < seeds.length; i++) {
        const { curated, categoryBased } = await getMangaUpdatesRecommendations(seeds[i].id);
        [...curated, ...categoryBased].forEach(name => names.add(name));
        if (i < seeds.length - 1) await new Promise(r => setTimeout(r, delayMs));
    }
    return Array.from(names);
}
