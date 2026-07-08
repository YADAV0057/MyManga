// ==========================================
// ENTITY RELATIONS (js/parser/dictionary/entityRelations.js)
// ==========================================
// Builds the two fields the concept schema was missing (see properties.js
// entries like "revenge"): `entities` (specific manga tied to this
// concept) and `opposite` (concepts this one tonally contradicts).
//
// COST CONTROL: this is the "genuinely expensive" piece flagged when this
// was first scoped — title-granularity harvesting instead of tag-granularity.
// To keep it bounded, every source function below fetches a SMALL seed set
// (top 3 search hits) per concept, then pulls each seed's recommendation
// list — not a full crawl. Run this behind a feature flag (see
// ENTITY_HARVEST_ENABLED in harvester.js) so you can measure real API-call
// volume on a small batch before turning it on for a big queue.txt run.
//
// CONFIDENCE MODEL: a title only becomes an `entities` entry if it's
// suggested by at least 2 of the 4 independent sources (AniList community
// votes, MAL/Jikan community votes, Shikimori's similarity engine,
// MangaUpdates' hand-curated + category recs). This is what keeps
// "Berserk" from getting attached to every dark-adjacent concept off a
// single source's noisy suggestion — it needs corroboration.

import axios from 'axios';

const MIN_SOURCE_AGREEMENT = 2;   // a title needs votes from this many distinct sources
const MAX_ENTITIES = 6;           // cap so a concept doesn't accumulate an unbounded list
const MAX_OPPOSITES = 3;
const OPPOSITE_SIMILARITY_CEILING = 0.12; // near-zero shared genre/theme signature — see computeOppositeConcepts() note below

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Source 1: AniList community-voted `recommendations` field ---
// One extra field on the same kind of search-by-text query
// HarvesterAPI.fetchFromAniList already runs, so this costs nothing beyond
// what the harvester was already spending on AniList.
async function fetchAniListRelatedTitles(query, seedLimit = 3) {
    const searchQuery = `
        query ($search: String, $perPage: Int) {
            Page(page: 1, perPage: $perPage) {
                media(search: $search, type: MANGA) {
                    recommendations(sort: RATING_DESC, perPage: 5) {
                        nodes { rating mediaRecommendation { title { romaji english } } }
                    }
                }
            }
        }`;
    try {
        const res = await axios.post('https://graphql.anilist.co', {
            query: searchQuery,
            variables: { search: query, perPage: seedLimit }
        });
        const names = new Set();
        (res.data?.data?.Page?.media || []).forEach(m => {
            (m.recommendations?.nodes || []).forEach(n => {
                if (n.rating > 0) { // ignore downvoted/zero-rated suggestions
                    const title = n.mediaRecommendation?.title?.english || n.mediaRecommendation?.title?.romaji;
                    if (title) names.add(title);
                }
            });
        });
        return Array.from(names);
    } catch (e) {
        console.warn(`[entityRelations] AniList recommendations failed for "${query}": ${e.message}`);
        return [];
    }
}

// --- Source 2: Jikan (MAL) community-voted recommendations ---
async function fetchJikanRelatedTitles(query, seedLimit = 3) {
    try {
        const searchRes = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(query)}&limit=${seedLimit}`);
        const seeds = (searchRes.data?.data || []).map(m => m.mal_id).filter(Boolean);
        const names = new Set();
        for (let i = 0; i < seeds.length; i++) {
            try {
                const recRes = await axios.get(`https://api.jikan.moe/v4/manga/${seeds[i]}/recommendations`);
                (recRes.data?.data || []).forEach(r => {
                    const title = r.entry?.title;
                    if (title) names.add(title);
                });
            } catch (e) { /* one seed failing shouldn't drop the rest */ }
            // Jikan's public rate limit is 60 req/min — small courtesy gap between calls.
            if (i < seeds.length - 1) await sleep(1100);
        }
        return Array.from(names);
    } catch (e) {
        console.warn(`[entityRelations] Jikan recommendations failed for "${query}": ${e.message}`);
        return [];
    }
}

/** Case/whitespace-insensitive key for de-duping the same title across sources. */
function titleKey(name) {
    return (name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Runs all 4 source lookups for one concept and merges their votes.
 * Returns the deduped, corroborated title list (display-cased from
 * whichever source's spelling was seen first) — this becomes `entities`.
 *
 * @param {string} conceptQuery - the concept tag/alias text to search with (same text HarvesterAPI already searches with)
 * @param {{fetchShikimoriRelatedTitles: Function, fetchMangaUpdatesRelatedTitles: Function}} clients - injected so this stays testable without hitting the network in isolation
 */
export async function buildEntityVotes(conceptQuery, clients) {
    const [aniListTitles, jikanTitles, shikimoriTitles, mangaUpdatesTitles] = await Promise.all([
        fetchAniListRelatedTitles(conceptQuery),
        fetchJikanRelatedTitles(conceptQuery),
        clients.fetchShikimoriRelatedTitles(conceptQuery).catch(() => []),
        clients.fetchMangaUpdatesRelatedTitles(conceptQuery).catch(() => [])
    ]);

    const votes = new Map(); // titleKey -> { display: string, sources: Set<string> }
    const record = (list, sourceName) => {
        list.forEach(name => {
            const key = titleKey(name);
            if (!key) return;
            if (!votes.has(key)) votes.set(key, { display: name, sources: new Set() });
            votes.get(key).sources.add(sourceName);
        });
    };
    record(aniListTitles, 'anilist');
    record(jikanTitles, 'jikan');
    record(shikimoriTitles, 'shikimori');
    record(mangaUpdatesTitles, 'mangaupdates');

    return Array.from(votes.values())
        .filter(v => v.sources.size >= MIN_SOURCE_AGREEMENT)
        .sort((a, b) => b.sources.size - a.sources.size)
        .slice(0, MAX_ENTITIES)
        .map(v => v.display);
}

// --- Opposite-concept detection ---
// Genre/theme weights are non-negative, so a vector space can't express a
// true negative correlation the way a "dislikes this" score could — the
// closest defensible proxy is "shares almost none of the same genre/theme
// signature", i.e. near-zero cosine similarity. This is a real signal
// (revenge and iyashikei genuinely don't overlap), but it's an
// approximation, not a measured opposition — worth revisiting once
// conceptCooccurrence.js (co-occurrence tallies) has enough runs to
// support genuine anti-correlation detection instead.
function toVector(genres = [], themes = []) {
    const v = {};
    [...genres, ...themes].forEach(item => {
        const name = (item.name || '').toLowerCase();
        if (name) v[name] = Math.max(v[name] || 0, item.weight ?? 1);
    });
    return v;
}

function cosineSim(a, b) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    let dot = 0, magA = 0, magB = 0;
    keys.forEach(k => {
        const av = a[k] || 0, bv = b[k] || 0;
        dot += av * bv;
        magA += av * av;
        magB += bv * bv;
    });
    if (magA === 0 || magB === 0) return 0;
    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * @param {Array} newGenres - this concept's freshly-harvested genres ({name, weight}[])
 * @param {Array} newThemes - this concept's freshly-harvested themes
 * @param {object} knownConcepts - merged CONCEPT_PROPERTIES + HARVESTED_RULES (harvester.js already builds this as `knownKeys`)
 * @param {string} selfId - this concept's own id, so it's excluded from its own opposite list
 * @returns {string[]} up to MAX_OPPOSITES concept ids with near-zero shared genre/theme signature
 */
export function computeOppositeConcepts(newGenres, newThemes, knownConcepts, selfId) {
    const selfVector = toVector(newGenres, newThemes);
    if (Object.keys(selfVector).length === 0) return [];

    const candidates = Object.values(knownConcepts)
        .filter(c => c.id && c.id !== selfId && (c.genres?.length || c.themes?.length))
        .map(c => ({ id: c.id, similarity: cosineSim(selfVector, toVector(c.genres, c.themes)) }))
        .filter(c => c.similarity <= OPPOSITE_SIMILARITY_CEILING)
        .sort((a, b) => a.similarity - b.similarity);

    return candidates.slice(0, MAX_OPPOSITES).map(c => c.id);
}

// --- Concept-to-concept co-occurrence (the harvester "getting smarter" piece) ---
// `boosts` (see synopsisAnalyzer.js) currently comes ONLY from local
// AFINN-165 + trope-routing over one concept's own synopsis text — it has
// no visibility into which OTHER concepts' catalog signatures this one
// actually resembles. This reuses the same genre/theme vectors as
// computeOppositeConcepts(), just checking the opposite end of the
// similarity range: known concepts whose genre/theme signature strongly
// OVERLAPS this one are catalog-corroborated boost candidates (e.g.
// "revenge" and "antihero" sharing Action/Psychological/Seinen weight),
// not just a text-analysis guess. harvester.js merges these into
// data.textAnalysis.boosts rather than replacing it, so a concept never
// loses a boost it already had — this only ever adds corroborated ones.
const RELATED_SIMILARITY_FLOOR = 0.55;
const MAX_RELATED_CONCEPTS = 3;

export function computeRelatedConcepts(newGenres, newThemes, knownConcepts, selfId) {
    const selfVector = toVector(newGenres, newThemes);
    if (Object.keys(selfVector).length === 0) return [];

    const candidates = Object.values(knownConcepts)
        .filter(c => c.id && c.id !== selfId && (c.genres?.length || c.themes?.length))
        .map(c => ({ id: c.id, similarity: cosineSim(selfVector, toVector(c.genres, c.themes)) }))
        .filter(c => c.similarity >= RELATED_SIMILARITY_FLOOR)
        .sort((a, b) => b.similarity - a.similarity);

    return candidates.slice(0, MAX_RELATED_CONCEPTS).map(c => c.id);
}
