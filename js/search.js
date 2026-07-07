// ==========================================
// SEARCH PLANNER (js/parser/searchPlanner.js)
// ==========================================
// Translates a MangaIntent (the object returned by js/parser/pipeline.js's
// buildIntent()) into a flat, API-agnostic SearchPlan that the API adapters
// (anilist.js, jikan.js, kitsu.js, mangadex.js) can consume without knowing
// anything about moods, confidence scores, or the reasoning rules that
// produced them.
//
// This does NOT replace anything ruleEngine.js already computed — it just
// flattens/normalizes the final intent object. apiOrder, avoids, and boosts
// are all read from `intent`, not recalculated here.

// AniList is Tier 1 and the source of truth for genre spelling — the other
// adapters (jikan.js's GENRE_ID_MAP, kitsu.js's filter[categories]) key off
// these exact strings. ruleEngine.js's RULES currently emit a few genre
// names without the AniList spelling (e.g. "SliceOfLife"), so we normalize
// here rather than touching ruleEngine.js's hardcoded rule data.
const GENRE_NORMALIZE = {
    SliceOfLife: "Slice of Life",
    Scifi: "Sci-Fi",
    SciFi: "Sci-Fi",
    MahouShoujo: "Mahou Shoujo"
};

function normalizeGenreName(name) {
    return GENRE_NORMALIZE[name] || name;
}

// Matches the confidence threshold pipeline.js already uses to split
// "primary" (intent.genres/themes) from "suggested" (intent.boosts) —
// keep these in sync if that threshold ever changes in pipeline.js.
const DEFAULT_INCLUSION_THRESHOLD = 0.80;

// Matches search.js's actual hardcoded waterfall order (Tier 1-4).
// Only used if the intent has no rule-derived searchPriority.
const DEFAULT_API_ORDER = ["AniList", "Jikan", "Kitsu", "MangaDex"];

// rules.js (extractRules) produces lowercase "completed"/"ongoing", but the
// existing fetchers (anilist.js's mediaArgs, jikan.js's STATUS_TO_JIKAN,
// kitsu.js's STATUS_TO_KITSU) all key off AniList's MediaStatus enum. We
// normalize here so those three files don't need to know about the parser's
// vocabulary at all.
const STATUS_TO_ANILIST_ENUM = {
    completed: "FINISHED",
    ongoing: "RELEASING"
};

/**
 * @typedef {Object} SearchPlan
 * @property {string} cleanQuery
 * @property {string[]} primaryGenres
 * @property {string[]} secondaryThemes
 * @property {string[]} excludedGenres
 * @property {string[]} excludedThemes
 * @property {string[]} apiOrder
 * @property {{status: string|null, sort: string, maxChapters: number|null}} filters
 * @property {number} confidence
 */

/**
 * Build a SearchPlan from a MangaIntent.
 *
 * @param {object} intent - return value of buildIntent() from pipeline.js
 * @param {object} [options]
 * @param {number} [options.threshold=0.80] - min confidence (0-1) to count as "primary"
 * @param {boolean} [options.includeBoosts=true] - promote strong intent.boosts entries into the plan
 * @returns {SearchPlan}
 */
export function buildSearchPlan(intent, options = {}) {
    if (!intent) {
        throw new Error("buildSearchPlan: intent is required");
    }

    const threshold = options.threshold ?? DEFAULT_INCLUSION_THRESHOLD;
    const includeBoosts = options.includeBoosts ?? true;

    const plan = {
        cleanQuery: intent.originalQuery || "",
        primaryGenres: [],
        secondaryThemes: [],
        excludedGenres: [],
        excludedThemes: [],
        apiOrder: (intent.searchPriority && intent.searchPriority.length > 0)
            ? intent.searchPriority
            : DEFAULT_API_ORDER,
        filters: {
            // Kept as-is for display/debugging (matches rules.js's own vocabulary)
            status: intent.status || null,          // "completed" | "ongoing" | null
            // What the API adapters actually consume — same enum shape the
            // old parseSmartQuery()/parser.js used to emit as statusFilter.
            statusFilter: STATUS_TO_ANILIST_ENUM[intent.status] || null,
            sort: intent.sort || "relevance",         // "relevance" | "popularity" | "rating"
            maxChapters: intent.maxChapters ?? null
        },
        confidence: typeof intent.confidence === "number" ? intent.confidence : 0.5
    };

    // 1. Primary genres/themes: pipeline.js already filtered these to >= 0.80
    //    confidence (step 5), so this loop is mostly a normalize+extract pass —
    //    it re-applies `threshold` too in case a caller passes a stricter one.
    (intent.genres || []).forEach(g => {
        if (g.confidence >= threshold) {
            plan.primaryGenres.push(normalizeGenreName(g.name));
        }
    });

    (intent.themes || []).forEach(t => {
        if (t.confidence >= threshold) {
            plan.secondaryThemes.push(normalizeGenreName(t.name));
        }
    });

    // 2. Optionally promote strong "suggested" boosts (below pipeline.js's
    //    primary threshold, but still confident) so a thin primary intent
    //    still gives adapters useful genre coverage. Never duplicates a
    //    genre/theme that's already primary.
    if (includeBoosts) {
        (intent.boosts?.genres || []).forEach(g => {
            const name = normalizeGenreName(g.name);
            if (g.score >= threshold && !plan.primaryGenres.includes(name)) {
                plan.primaryGenres.push(name);
            }
        });
        (intent.boosts?.themes || []).forEach(t => {
            const name = normalizeGenreName(t.name);
            if (t.score >= threshold && !plan.secondaryThemes.includes(name)) {
                plan.secondaryThemes.push(name);
            }
        });
    }

    // 3. Exclusions: intent.avoids.genres/themes already merges manual
    //    negations ("no romance") with mood-based avoids from ruleEngine.js.
    //    A primary requirement always wins over an avoid (e.g. if the user's
    //    mood strongly implies Drama, don't let a rule's avoid list drop it).
    plan.excludedGenres = [...new Set((intent.avoids?.genres || []).map(normalizeGenreName))]
        .filter(g => !plan.primaryGenres.includes(g));

    plan.excludedThemes = [...new Set((intent.avoids?.themes || []).map(normalizeGenreName))]
        .filter(t => !plan.secondaryThemes.includes(t));

    return plan;
}

/**
 * Incremental-adoption helper: collapses a SearchPlan's genres/themes back
 * into the single comma-separated string that parseSmartQuery() (js/parser.js)
 * and fetchFromAniListUnified() (anilist.js) expect today via
 * parsedData.cleanQuery + isVibeOrTag. Lets search.js start consuming plans
 * from the advanced pipeline without every adapter being rewritten in the
 * same change.
 *
 * @param {SearchPlan} plan
 * @returns {string}
 */
export function planToLegacyQuery(plan) {
    return [...plan.primaryGenres, ...plan.secondaryThemes].join(", ");
}
