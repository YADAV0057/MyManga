// ==========================================
// MANGA SEMANTIC PROFILES (js/mangaProfiles.js)
// ==========================================
// Phase 3: real per-title mood vectors, replacing recommendationScorer.js's
// documented placeholder (genre/theme overlap approximation).
//
// Storage: Firestore collection `mangaProfiles`, one doc per `${source}_${id}`
// (kept per-source rather than merged-by-title, since the same manga can
// carry slightly different genre/tag sets across AniList/Jikan/Kitsu/MangaDex
// and merging is a dedup problem this file deliberately doesn't solve).
//
// Doc shape:
// {
//   title, source, version, lastUpdated,
//   sampleGenres: string[], sampleThemes: string[],
//   matchedConcepts: [{ id, strength }],
//   profile: { [moodAtom]: { value, confidence, sources: string[] } }
// }
//
// Vector space: NOT concept names (revenge/horror/healing...) — those are
// query-side vocabulary. The stored profile lives in the smaller, consistent
// "mood atom" space already present as `moodWeights` on concepts in
// properties.js/harvested_knowledge.js (exciting, dark, violent, emotional,
// tragic, mysterious, happy, ...). This is the same space moodEngine.js's
// `analyzeMood()` produces as `intent.moodProfile`, so the two are directly
// cosine-comparable with no translation layer.
//
// Wired to match firebase.js's existing export style exactly — it already
// initializes Firestore and re-exports doc/getDoc/setDoc itself, so this
// file pulls everything from there rather than importing firebase-firestore
// a second time (a bare 'firebase/firestore' specifier can't resolve in a
// browser without an import map — that was the bug that broke search).
import { db, doc, getDoc, setDoc } from './firebase.js';

const COLLECTION = 'mangaProfiles';
const PROFILE_VERSION = 1;
const STALE_AFTER_DAYS = 60;      // re-derive if the concept dictionary has likely moved on
const MATCH_FLOOR = 0.15;         // concept matches weaker than this are noise, not signal

/** Stable Firestore doc id for a UnifiedResult. */
export function profileKey(item) {
    return `${item.source}_${item.id}`;
}

/** Weighted-recall overlap strength of one concept's genre/theme list against a manga's tags. Same method recommendationScorer.js already uses for listOverlap/weightedOverlap — reused so "concept match strength" means the same thing everywhere in the app. */
function weightedOverlapStrength(conceptList, haveNames) {
    if (!conceptList || conceptList.length === 0) return 0;
    const have = new Set(haveNames);
    let total = 0, matched = 0;
    conceptList.forEach(c => {
        total += c.weight;
        if (have.has(c.name.toLowerCase())) matched += c.weight;
    });
    return total > 0 ? matched / total : 0;
}

/**
 * Builds a manga's mood-atom vector by finding which dictionary concepts
 * (properties.js + harvested_knowledge.js, merged by the caller) this
 * manga's actual genres/themes match, then blending those concepts'
 * `moodWeights` together, weighted by how strongly each concept matched.
 *
 * @param {import('./resultNormalizer.js').UnifiedResult} item
 * @param {object} conceptDictionary  merged CONCEPT_PROPERTIES + HARVESTED_RULES
 * @returns {{profile: object, matchedConcepts: Array<{id:string, strength:number}>}}
 */
export function computeMoodAtomProfile(item, conceptDictionary) {
    const haveNames = [
        ...(item.rawGenres || []),
        ...(item.themes || [])
    ].map(n => n.toLowerCase());

    const atomAccum = {};      // atom -> { sum, weight, sources: Set }
    const matchedConcepts = [];

    Object.values(conceptDictionary || {}).forEach(concept => {
        if (!concept.moodWeights) return; // no atom mapping for this concept yet

        // Max, not average, of genre-strength vs theme-strength: a single
        // strong theme match (e.g. this manga IS tagged "Revenge") is real
        // signal on its own and shouldn't be diluted just because the
        // concept's genre list didn't also line up.
        const genreStrength = weightedOverlapStrength(concept.genres, haveNames);
        const themeStrength = weightedOverlapStrength(concept.themes, haveNames);
        const matchStrength = Math.max(genreStrength, themeStrength);

        if (matchStrength < MATCH_FLOOR) return;
        matchedConcepts.push({ id: concept.id, strength: parseFloat(matchStrength.toFixed(2)) });

        Object.entries(concept.moodWeights).forEach(([atom, w]) => {
            if (!atomAccum[atom]) atomAccum[atom] = { sum: 0, weight: 0, sources: new Set() };
            atomAccum[atom].sum += w * matchStrength;
            atomAccum[atom].weight += matchStrength;
            atomAccum[atom].sources.add(concept.id);
        });
    });

    const profile = {};
    Object.entries(atomAccum).forEach(([atom, { sum, weight, sources }]) => {
        profile[atom] = {
            value: parseFloat((sum / weight).toFixed(3)),
            // more independently-matched concepts agreeing on this atom = more confidence
            confidence: parseFloat(Math.min(1, weight / 2).toFixed(2)),
            sources: [...sources]
        };
    });

    return { profile, matchedConcepts };
}

/**
 * Cosine similarity between the user's mood vector (intent.moodProfile,
 * plain {atom: weight}) and a stored/computed manga profile
 * ({atom: {value,...}} OR plain {atom: weight} — both accepted).
 * Returns null if either side has no usable signal (all-zero vector).
 */
export function cosineSimilarity(vecA, vecB) {
    const keys = new Set([...Object.keys(vecA || {}), ...Object.keys(vecB || {})]);
    let dot = 0, normA = 0, normB = 0;
    keys.forEach(k => {
        const a = typeof vecA?.[k] === 'number' ? vecA[k] : 0;
        const rawB = vecB?.[k];
        const b = typeof rawB === 'number' ? rawB : (rawB?.value ?? 0);
        dot += a * b;
        normA += a * a;
        normB += b * b;
    });
    if (normA === 0 || normB === 0) return null;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/** Reads a cached profile doc, treating wrong-version or stale docs as a miss. */
async function getCachedProfile(key) {
    if (!db) return null; // matches search.js's own `if (db)` guard — init failure degrades to no cache, not a crash
    try {
        const snap = await getDoc(doc(db, COLLECTION, key));
        if (!snap.exists()) return null;
        const data = snap.data();
        if (data.version !== PROFILE_VERSION) return null;
        const ageDays = (Date.now() - new Date(data.lastUpdated).getTime()) / 86400000;
        if (ageDays > STALE_AFTER_DAYS) return null;
        return data;
    } catch (e) {
        console.error('[mangaProfiles] read failed:', e.message);
        return null; // treat any read failure as a cache miss, never block scoring on it
    }
}

/** Writes a freshly-computed profile. Deliberately NOT awaited by callers — a slow or failed write must never delay search results rendering. */
function saveProfileFireAndForget(key, item, computed) {
    if (!db) return;
    const docBody = {
        title: item.title,
        source: item.source,
        version: PROFILE_VERSION,
        lastUpdated: new Date().toISOString(),
        sampleGenres: item.rawGenres || [],
        sampleThemes: item.themes || [],
        matchedConcepts: computed.matchedConcepts,
        profile: computed.profile
    };
    setDoc(doc(db, COLLECTION, key), docBody).catch(e =>
        console.error('[mangaProfiles] write failed:', e.message)
    );
}

/**
 * Cache-through accessor: returns the manga's mood-atom profile (map only,
 * not the full doc), building + persisting it on a cache miss.
 * @returns {Promise<object>} plain {atom: {value, confidence, sources}} — possibly {}
 */
export async function getOrBuildProfile(item, conceptDictionary) {
    const key = profileKey(item);
    const cached = await getCachedProfile(key);
    if (cached) return cached.profile;

    const computed = computeMoodAtomProfile(item, conceptDictionary);
    saveProfileFireAndForget(key, item, computed);
    return computed.profile;
}
