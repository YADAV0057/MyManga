// ==========================================
// UNIFIED RESULT MODEL (js/resultNormalizer.js)
// ==========================================
// Every adapter (anilist.js, jikan.js, kitsu.js, mangadex.js) returns a
// "raw media" object in a mostly-shared shape:
//   { id, title:{romaji,english}, averageScore, genres, description,
//     coverImage:{large}, chapters, status, themes?, demographics?, popularity? }
// (themes/demographics/popularity are only populated where that specific API
// can provide them cheaply — see the per-adapter comments where each is set.)
//
// normalizeResult() turns ONE raw media object, plus the tier name it came
// from, into the single fully-uniform card object the rest of the app uses.
// It's a strict superset of the old inline factSheet shape built in
// search.js — every field renderer.js already reads (id, title, coverUrl,
// synopsis, status, chapters, globalScore, rawGenres) is still there,
// unchanged, so renderer.js needed NO changes for this step. The new fields
// (themes, demographics, popularity, source) are additive, for the
// upcoming Recommendation Scorer (Phase 2, Step 4).

import { CONFIG } from './config.js';
import { formatStatus } from './renderer.js';

/**
 * @typedef {Object} UnifiedResult
 * @property {string|number} id
 * @property {string} title
 * @property {string} coverUrl
 * @property {string} synopsis
 * @property {string} status          - formatted, e.g. "Completed" (via renderer.js's formatStatus)
 * @property {string} chapters        - formatted, e.g. "24 Chp." or "N/A"
 * @property {number|"N/A"} globalScore  - 0-100 rating, "N/A" if the source doesn't provide one
 * @property {number|null} popularity - raw popularity signal. ⚠️ NOT comparable
 *   across sources — AniList/Jikan/Kitsu each use a different follower-count
 *   base, and MangaDex has no cheap popularity field (always null here).
 *   Do not sort/score across mixed-source results using this field directly;
 *   normalize per-batch first (that's the Scorer's job, not this module's).
 * @property {string[]} rawGenres
 * @property {string[]} themes        - [] where the source API doesn't distinguish theme from genre
 * @property {string[]} demographics  - [] where the source API doesn't expose one
 * @property {"AniList"|"Jikan"|"Kitsu"|"MangaDex"|"AniList (cached)"} source
 */

/**
 * @param {object} rawMedia - one item from an adapter's fetch* return array
 * @param {string} source   - human-readable tier label (see SOURCE_LABELS in search.js)
 * @returns {UnifiedResult}
 */
export function normalizeResult(rawMedia, source) {
    const title = rawMedia.title?.english || rawMedia.title?.romaji || 'Unknown Title';
    // NEW (READLINKS_UPGRADE_PLAN.md Step 4): keep the other language variant
    // around when it differs from the primary title (e.g. AniList's
    // `title.romaji` when `title.english` was picked as primary). Without
    // this, the raw adapter object's alternate title is discarded here and
    // never available again downstream -- mangadex.js's fallback-link
    // builder needs it to try both variants against Manganato/Bato.to's
    // guessed search-pattern URLs. null when there's no second variant, or
    // it's identical to the primary (nothing to gain from trying "twice").
    const altTitle = (rawMedia.title?.english && rawMedia.title?.romaji && rawMedia.title.english !== rawMedia.title.romaji)
        ? (title === rawMedia.title.english ? rawMedia.title.romaji : rawMedia.title.english)
        : null;
    const cleanSynopsis = rawMedia.description
        ? rawMedia.description.replace(/<[^>]*>?/gm, '')
        : "No synopsis available.";

    return {
        id: rawMedia.id,
        title,
        altTitle,
        coverUrl: rawMedia.coverImage?.large || CONFIG.IMAGE_FALLBACK,
        synopsis: cleanSynopsis,
        status: formatStatus(rawMedia.status),
        chapters: rawMedia.chapters ? `${rawMedia.chapters} Chp.` : "N/A",
        globalScore: (rawMedia.averageScore !== null && rawMedia.averageScore !== undefined) ? rawMedia.averageScore : "N/A",
        popularity: rawMedia.popularity ?? null,
        rawGenres: rawMedia.genres || [],
        themes: rawMedia.themes || [],
        demographics: rawMedia.demographics || [],
        source
    };
}
