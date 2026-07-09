// ==========================================
// SHIKIMORI CLIENT (js/parser/dictionary/shikimoriClient.js)
// ==========================================
// Shikimori is a MAL-style catalog/community site with its own independent
// user base (mostly Russian-speaking), which is exactly why it's useful
// here: when Shikimori's community and AniList's/MAL's community both
// suggest the same title for the same concept, that's two INDEPENDENT
// crowds agreeing, not one crowd's opinion counted twice. No API key
// required for read-only catalog endpoints.
//
// Docs: https://shikimori.one/api/doc/1.0/mangas/index

import axios from 'axios';

const SHIKIMORI_URL = 'https://shikimori.one/api';

// Shikimori asks integrators to identify themselves via User-Agent instead
// of an API key for unauthenticated catalog reads.
const HEADERS = { 'User-Agent': 'MangaMood-Harvester' };

/**
 * Searches Shikimori manga by free-text query (same "search the concept
 * word/alias, take the top few hits" pattern HarvesterAPI.fetchFromAniList
 * / fetchFromJikan already use), returning just the ids we need to look up
 * each hit's related/similar list.
 */
export async function searchShikimoriManga(query, limit = 3) {
    try {
        const res = await axios.get(`${SHIKIMORI_URL}/mangas`, {
            headers: HEADERS,
            params: { search: query, limit, order: 'popularity' }
        });
        return (res.data || []).map(m => ({ id: m.id, name: m.name || m.russian }));
    } catch (e) {
        console.warn(`[shikimoriClient] search failed for "${query}": ${e.message}`);
        return [];
    }
}

/**
 * Shikimori's /similar endpoint returns titles the site's own recommender
 * (genre/theme/staff overlap, not raw user votes) considers related — a
 * third, structurally different signal from AniList's/Jikan's user-voted
 * recommendations, useful for cross-checking rather than just re-confirming
 * the same kind of vote from a different crowd.
 */
export async function getShikimoriSimilar(mangaId) {
    try {
        const res = await axios.get(`${SHIKIMORI_URL}/mangas/${mangaId}/similar`, { headers: HEADERS });
        return (res.data || []).map(m => ({ id: m.id, name: m.name || m.russian }));
    } catch (e) {
        console.warn(`[shikimoriClient] similar lookup failed for id ${mangaId}: ${e.message}`);
        return [];
    }
}

/**
 * Convenience wrapper matching the shape entityRelations.js expects from
 * every source client: given a concept's search query, return a flat list
 * of related title names (deduped, this concept's own seed titles
 * excluded by the caller). Internally: search → take top N seeds → pull
 * each seed's /similar → flatten.
 */
export async function fetchShikimoriRelatedTitles(query, { seedLimit = 3, delayMs = 700 } = {}) {
    const seeds = await searchShikimoriManga(query, seedLimit);
    const names = new Set();
    for (let i = 0; i < seeds.length; i++) {
        const related = await getShikimoriSimilar(seeds[i].id);
        related.forEach(r => { if (r.name) names.add(r.name); });
        // Be polite between calls — same courtesy delay style as
        // weightCalculator.js's sleep() between AniList pages.
        if (i < seeds.length - 1) await new Promise(r => setTimeout(r, delayMs));
    }
    return Array.from(names);
}
