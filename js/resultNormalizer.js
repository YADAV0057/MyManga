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
//
// CHANGED (READLINKS_UPGRADE_PLAN.md Step 8): added `author`, read from
// rawMedia.staff (only AniList's adapter currently requests this field --
// see anilist.js). Jikan/Kitsu/MangaDex raw media objects have no `staff`
// property at all, so the optional-chaining below just resolves to null
// for those sources, same degrade-gracefully pattern as every other
// source-specific-only field here (themes, demographics, popularity).
//
// RESTORED (search engine cutover, Notion "Backend Update List" follow-up
// to Entry 26/28): rankResults.js's rankResults() now attaches a real
// `finalScore` (0-1) and `_rankDebug` ({textMatch, genreMatch,
// emotionMatch, popularity, weights}) to every result it returns, including
// Mixer's filters.genres-only flow (computeRankingWeights/genreMatchScore
// both now factor in filters.genres, not just classifier query-text terms).
// Previously normalizeResult() silently dropped both fields since it builds
// a fixed-shape object rather than spreading rawMedia -- that's what made
// mixerPage.js's ⭐ badge/Why-panel disappear even though renderer.js's
// getMangaCardHTML() never stopped reading factSheet.matchScore/
// matchReasons (Entry 28 removed the *data*, not the render code). Mapped
// here rather than in renderer.js, same "one normalization point" reasoning
// as every other field in this file. Degrades gracefully to null when a
// result has no _rankDebug (e.g. an older cached shape) -- renderer.js's
// `typeof factSheet.matchScore !== 'number'` guard already handles that.

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
 * @property {string|null} author - primary creator name from AniList's staff
 *   data (highest-relevance entry). null for results from any other source,
 *   or when AniList has no staff data for that title.
 * @property {number|null} matchScore - 0-100, rounded from the search
 *   engine's rankResults().finalScore (0-1). null when the source object has
 *   no finalScore (e.g. not run through the engine's ranker at all).
 * @property {Array<{ok:boolean,text:string}>|null} matchReasons - per-signal
 *   breakdown for the "Why?" panel, derived from rankResults()'s
 *   `_rankDebug`. Only includes signals the engine actually weighted (>0)
 *   for this query, plus popularity (always weighted). null alongside
 *   matchScore when there's no _rankDebug to build reasons from.
 */

// Turns rankResults.js's _rankDebug ({textMatch, genreMatch, emotionMatch,
// popularity, weights, finalScore}) into the {ok, text} list renderer.js's
// renderMatchBreakdown() expects. Only surfaces a signal if the engine
// actually put weight behind it for this query (weights.X > 0) -- e.g.
// textMatch is 0-weighted for Mixer's no-free-text-signal queries, and
// showing "Title match: 0%" there would just be noise, not a real reason.
// Popularity has no entry in `weights` (it's blended in separately via
// rankResults.js's fixed POPULARITY_WEIGHT, not the per-query intent
// weights), so it's always included.
function buildMatchReasons(rankDebug) {
    const { textMatch, genreMatch, emotionMatch, popularity, weights } = rankDebug;
    const reasons = [];

    if (weights?.textMatch > 0) {
        reasons.push({ ok: textMatch >= 0.5, text: `Title/name match: ${Math.round(textMatch * 100)}%` });
    }
    if (weights?.genreMatch > 0) {
        reasons.push({ ok: genreMatch >= 0.5, text: `Genre match: ${Math.round(genreMatch * 100)}%` });
    }
    if (weights?.emotionMatch > 0) {
        reasons.push({ ok: emotionMatch >= 0.5, text: `Mood match: ${Math.round(emotionMatch * 100)}%` });
    }
    reasons.push({ ok: popularity >= 0.5, text: `Popularity: ${Math.round(popularity * 100)}%` });

    return reasons;
}

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
    // NEW (READLINKS_UPGRADE_PLAN.md Step 8): first staff edge = highest
    // relevance per anilist.js's `sort: RELEVANCE` on the query, which in
    // practice is almost always the actual author/artist rather than a
    // minor contributor. Optional-chained all the way through since only
    // AniList's raw media objects have a `staff` property at all.
    const author = rawMedia.staff?.edges?.[0]?.node?.name?.full || null;

    return {
        id: rawMedia.id,
        title,
        altTitle,
        author,
        coverUrl: rawMedia.coverImage?.large || CONFIG.IMAGE_FALLBACK,
        synopsis: cleanSynopsis,
        status: formatStatus(rawMedia.status),
        chapters: rawMedia.chapters ? `${rawMedia.chapters} Chp.` : "N/A",
        globalScore: (rawMedia.averageScore !== null && rawMedia.averageScore !== undefined) ? rawMedia.averageScore : "N/A",
        popularity: rawMedia.popularity ?? null,
        rawGenres: rawMedia.genres || [],
        themes: rawMedia.themes || [],
        demographics: rawMedia.demographics || [],
        source,
        matchScore: typeof rawMedia.finalScore === 'number' ? Math.round(rawMedia.finalScore * 100) : null,
        matchReasons: rawMedia._rankDebug ? buildMatchReasons(rawMedia._rankDebug) : null
    };
}
