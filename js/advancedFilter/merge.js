// ==========================================
// js/advancedFilter/merge.js
// ==========================================
// Turns fetchAll.js's { source, items }[] into one deduped list of
// UnifiedResult cards (resultNormalizer.js's shape), keeping the best
// available data for any title that showed up from more than one source,
// then applies the filters no single source's API can enforce server-side
// (cross-source min rating, chapter range, hide-hiatus).
import { normalizeResult } from '../resultNormalizer.js';

// Priority order used only to decide which source "wins" first pass when
// the same title comes back from multiple tiers — AniList first since it
// has the richest/most consistent fields (mirrors search.js's own tier
// order). fillMissingFields() below then backfills any gaps from the
// lower-priority duplicates instead of discarding them outright.
const SOURCE_PRIORITY = ['AniList', 'Jikan', 'MangaDex', 'Kitsu'];

function titleKey(unified) {
    return (unified.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Fills any missing/placeholder field on `base` with a real value from
// `candidate` — so a title found on both AniList (great cover, no chapter
// count) and MangaDex (has chapter count) ends up as ONE card with both,
// instead of picking one source and losing the other's data.
function fillMissingFields(base, candidate) {
    const merged = { ...base };
    if (!merged.coverUrl) merged.coverUrl = candidate.coverUrl;
    if (merged.synopsis === 'No synopsis available.' && candidate.synopsis !== 'No synopsis available.') {
        merged.synopsis = candidate.synopsis;
    }
    if (merged.globalScore === 'N/A' && candidate.globalScore !== 'N/A') merged.globalScore = candidate.globalScore;
    if ((merged.popularity === null || merged.popularity === undefined) && candidate.popularity != null) {
        merged.popularity = candidate.popularity;
    }
    if ((!merged.rawGenres || merged.rawGenres.length === 0) && candidate.rawGenres?.length) {
        merged.rawGenres = candidate.rawGenres;
    }
    if ((!merged.themes || merged.themes.length === 0) && candidate.themes?.length) {
        merged.themes = candidate.themes;
    }
    if ((!merged.demographics || merged.demographics.length === 0) && candidate.demographics?.length) {
        merged.demographics = candidate.demographics;
    }
    if (merged.chapters === 'N/A' && candidate.chapters !== 'N/A') merged.chapters = candidate.chapters;
    return merged;
}

/**
 * @param {{source:string, items:object[]}[]} bySource - fetchAll.js's output
 * @returns {object[]} one merged UnifiedResult per unique title
 */
export function mergeSources(bySource) {
    const ordered = [...bySource].sort(
        (a, b) => SOURCE_PRIORITY.indexOf(a.source) - SOURCE_PRIORITY.indexOf(b.source)
    );

    const merged = new Map(); // titleKey -> UnifiedResult

    for (const { source, items } of ordered) {
        for (const raw of items) {
            const unified = normalizeResult(raw, source);
            const key = titleKey(unified);
            if (!key) continue;
            merged.set(key, merged.has(key) ? fillMissingFields(merged.get(key), unified) : unified);
        }
    }

    return Array.from(merged.values());
}

function chapterCount(unified) {
    const n = parseInt(unified.chapters, 10);
    return isNaN(n) ? null : n;
}

/**
 * Applies filters that can't be pushed down to every source's API — e.g.
 * Kitsu has no clean "exclude genre" param (same real limitation
 * jikan.js/kitsu.js already document), and there's no cross-source
 * min-rating query param at all. Runs client-side, after merge, so it
 * applies uniformly no matter which source(s) a title came from.
 *
 * @param {object[]} results - mergeSources() output
 * @param {object} state - formUI.js's readFilterState() output
 */
export function applyPostFilters(results, state) {
    return results.filter(r => {
        if (state.minRating > 0) {
            if (typeof r.globalScore !== 'number' || r.globalScore < state.minRating) return false;
        }

        const ch = chapterCount(r);
        if (state.minChapters != null && ch != null && ch < state.minChapters) return false;
        if (state.maxChapters != null && ch != null && ch > state.maxChapters) return false;

        // Kitsu can't enforce excludedGenres server-side (real API
        // limitation — see kitsu.js) so re-check it here for every source,
        // not just Kitsu, to guarantee it's actually honored end-to-end.
        if (state.excludeGenres?.length) {
            const hasExcluded = (r.rawGenres || []).some(g => state.excludeGenres.includes(g));
            if (hasExcluded) return false;
        }

        if (state.hideHiatus && r.status === 'Hiatus') return false;

        return true;
    });
}

/**
 * Cross-source sort. Popularity is intentionally NOT sorted on here — it's
 * not comparable across sources (each API uses a different base; see the
 * project README's Known Limitations), so "Popularity" mode leaves the
 * source-priority merge order as-is rather than implying a false global
 * ranking. "Rating" mode is safe to sort globally since globalScore is
 * already a normalized 0-100 scale from every adapter.
 */
export function sortResults(results, sort) {
    if (sort !== 'rating') return results;
    return [...results].sort((a, b) => {
        const sa = typeof a.globalScore === 'number' ? a.globalScore : -1;
        const sb = typeof b.globalScore === 'number' ? b.globalScore : -1;
        return sb - sa;
    });
}

