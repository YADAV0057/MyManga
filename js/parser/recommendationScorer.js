// ==========================================
// RECOMMENDATION SCORER (js/parser/recommendationScorer.js)
// ==========================================
// Takes the UnifiedResult[] array (resultNormalizer.js) plus the MangaIntent
// (pipeline.js) and SearchPlan (searchPlanner.js) that produced the search,
// and scores + ranks every result. This replaces "sort by API order" with
// "sort by how well this manga actually matches what the user asked for."
//
// Design note on "mood match" — PHASE 3 UPDATE:
// Individual manga now DO carry a mood vector, via mangaProfiles.js
// (Firestore-cached, computed from the manga's actual genres/themes against
// the concept dictionary's moodWeights — see that file's header). Mood score
// is cosine similarity between intent.moodProfile and that stored vector.
// The ORIGINAL approximation (overlap against intent.genres/intent.themes —
// the full weighted list genreMapper.js produced from the user's moods, not
// just the >=0.80 subset in plan.primaryGenres) is kept as a fallback for
// when a title has no usable profile yet (first time seen, or the concept
// dictionary has no matching entries) — so scoring never regresses to
// NEUTRAL just because the cache hasn't warmed up for that title.
import { cosineSimilarity, getOrBuildProfile, profileKey } from '../mangaProfiles.js';

const WEIGHTS = {
    mood: 0.40,
    genre: 0.25,
    theme: 0.15,
    constraint: 0.10,
    popularity: 0.05,
    rating: 0.05
};

const NEUTRAL = 0.6; // score used when a signal has nothing to compare against

function namesOf(list) {
    return (list || []).map(x => (typeof x === 'string' ? x : x.name)).filter(Boolean);
}

/**
 * Weighted-recall overlap: of the total confidence/weight in `weighted`,
 * how much is present in `haveNames`? Returns 0-1.
 * @param {Array<{name:string, confidence?:number, score?:number}>} weighted
 * @param {string[]} haveNames
 */
function weightedOverlap(weighted, haveNames) {
    if (!weighted || weighted.length === 0) return null; // no signal
    const have = new Set(haveNames.map(n => n.toLowerCase()));
    let total = 0, matched = 0;
    weighted.forEach(w => {
        const weight = w.confidence ?? w.score ?? 1;
        total += weight;
        if (have.has((w.name || '').toLowerCase())) matched += weight;
    });
    return total > 0 ? matched / total : null;
}

/** Plain-list overlap (fraction of `required` present in `haveNames`). 0-1. */
function listOverlap(required, haveNames) {
    if (!required || required.length === 0) return null;
    const have = new Set(haveNames.map(n => n.toLowerCase()));
    const matched = required.filter(r => have.has(r.toLowerCase()));
    return { fraction: matched.length / required.length, matched };
}

function minMaxNormalize(values) {
    const nums = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (nums.length < 2) return () => NEUTRAL; // can't compare within a batch of 0-1
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    if (max === min) return () => 0.75; // everyone's equally popular — don't punish
    return (v) => (typeof v === 'number' && !isNaN(v)) ? (v - min) / (max - min) : NEUTRAL;
}

/** Strips punctuation/casing/whitespace so title comparisons ignore formatting noise. */
function normalizeTitle(s) {
    return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * @param {import('../resultNormalizer.js').UnifiedResult} item
 * @param {object} intent   - buildIntent() output
 * @param {import('./searchPlanner.js').SearchPlan} plan
 * @param {(v:number)=>number} normPopularity
 * @param {object|null} mangaProfile - this item's stored mood-atom profile, or null/{} if none yet
 */
function scoreOne(item, intent, plan, normPopularity, mangaProfile) {
    const itemGenres = item.rawGenres || [];
    const itemThemes = (item.themes && item.themes.length > 0) ? item.themes : itemGenres;
    const reasons = [];

    // --- Exact/near-exact title match — if the user searched for a specific
    // title and we found it, that's a 100% match, full stop. No amount of
    // genre/mood/popularity math should override "this is the manga you typed."
    const queryNorm = normalizeTitle(plan.cleanQuery);
    const titleNorm = normalizeTitle(item.title);
    if (queryNorm.length > 0 && titleNorm.length > 0 &&
        (queryNorm === titleNorm || titleNorm.includes(queryNorm) || queryNorm.includes(titleNorm))) {
        reasons.push({ ok: true, text: 'Exact title match' });
        return {
            matchScore: 100,
            matchBreakdown: { mood: 100, genre: 100, theme: 100, constraint: 100, popularity: 100, rating: 100 },
            matchReasons: dedupeReasons(reasons).slice(0, 6)
        };
    }

    // --- Mood match (40%) — Phase 3: real per-title similarity when this
    // item has a usable stored profile, via cosine similarity against
    // intent.moodProfile (both live in the same mood-atom space — see
    // mangaProfiles.js header). Falls back to the original genre/theme
    // overlap approximation when there's no profile yet, so a cold cache
    // never silently degrades a search to NEUTRAL.
    let moodScore = null;
    if (mangaProfile && intent.moodProfile && Object.keys(mangaProfile).length > 0) {
        const sim = cosineSimilarity(intent.moodProfile, mangaProfile);
        if (sim !== null) moodScore = (sim + 1) / 2; // cosine is -1..1 → rescale to 0..1
    }
    if (moodScore === null) {
        const moodSignal = [
            ...(intent.genres || []), ...(intent.boosts?.genres || []),
            ...(intent.themes || []), ...(intent.boosts?.themes || [])
        ];
        moodScore = weightedOverlap(moodSignal, [...itemGenres, ...itemThemes]); // null when genuinely no signal either way
    }
    if (intent.moods && intent.moods.length > 0 && moodScore !== null && moodScore >= 0.5) {
        const label = intent.moods[0];
        reasons.push({ ok: true, text: `Strong "${label}" match` });
    }

    // --- Genre match (25%) — required primaryGenres from the plan
    const genreResult = listOverlap(plan.primaryGenres, itemGenres);
    const genreScore = genreResult ? genreResult.fraction : null;
    (genreResult?.matched || []).forEach(g => reasons.push({ ok: true, text: g }));

    // --- Theme match (15%) — secondaryThemes from the plan
    const themeResult = listOverlap(plan.secondaryThemes, itemThemes);
    const themeScore = themeResult ? themeResult.fraction : null;
    (themeResult?.matched || []).forEach(t => reasons.push({ ok: true, text: t }));

    // --- Constraint match (10%) — excluded genres/themes should NOT be present;
    // status/maxChapters are already enforced upstream (API query + search.js
    // filter), so this is mostly a defensive re-check plus positive framing.
    let constraintScore = 1.0;
    const allExcluded = [...(plan.excludedGenres || []), ...(plan.excludedThemes || [])];
    const itemHas = new Set([...itemGenres, ...itemThemes].map(g => g.toLowerCase()));
    allExcluded.forEach(ex => {
        if (itemHas.has(ex.toLowerCase())) {
            constraintScore -= 0.5; // present when it shouldn't be — hard penalty
            reasons.push({ ok: false, text: `Contains ${ex}` });
        } else {
            reasons.push({ ok: true, text: `No ${ex}` });
        }
    });
    if (plan.filters?.maxChapters) {
        const ch = typeof item.chapters === 'string' ? parseInt(item.chapters, 10) : item.chapters;
        if (!isNaN(ch) && ch > plan.filters.maxChapters) constraintScore -= 0.5;
    }
    constraintScore = Math.max(0, constraintScore);

    // --- Popularity (5%) — normalized within THIS result batch only, per
    // resultNormalizer.js's warning that raw popularity isn't cross-source comparable.
    const popularityScore = normPopularity(item.popularity);

    // --- Rating (5%)
    const ratingScore = (typeof item.globalScore === 'number') ? item.globalScore / 100 : NEUTRAL;
    if (typeof item.globalScore === 'number' && item.globalScore >= 75) {
        reasons.push({ ok: true, text: 'Highly rated' });
    }

    // --- Weighted average over only the signals that actually have data.
    // CHANGED: mood/genre/theme used to fall back to NEUTRAL (0.6) when the
    // query gave no signal for them, which silently capped every score with
    // a missing signal at ~58-68% no matter how well the item actually
    // fit — a query with no genre/theme requirement isn't a 60% genre match,
    // it's a component that shouldn't be counted at all. Constraint/
    // popularity/rating are always present (constraint defaults to a clean
    // 1.0, popularity/rating are batch/item properties independent of the
    // query), so they're always included.
    const components = [
        { score: moodScore, weight: WEIGHTS.mood },
        { score: genreScore, weight: WEIGHTS.genre },
        { score: themeScore, weight: WEIGHTS.theme },
        { score: constraintScore, weight: WEIGHTS.constraint },
        { score: popularityScore, weight: WEIGHTS.popularity },
        { score: ratingScore, weight: WEIGHTS.rating }
    ].filter(c => c.score !== null && c.score !== undefined);

    const weightSum = components.reduce((sum, c) => sum + c.weight, 0);
    const total = weightSum > 0
        ? components.reduce((sum, c) => sum + c.score * c.weight, 0) / weightSum
        : NEUTRAL;

    return {
        matchScore: Math.round(total * 100),
        matchBreakdown: {
            mood: moodScore !== null ? Math.round(moodScore * 100) : null,
            genre: genreScore !== null ? Math.round(genreScore * 100) : null,
            theme: themeScore !== null ? Math.round(themeScore * 100) : null,
            constraint: Math.round(constraintScore * 100),
            popularity: Math.round(popularityScore * 100),
            rating: Math.round(ratingScore * 100)
        },
        // De-duped, ✓ first then ✗, capped so cards don't get a wall of text.
        matchReasons: dedupeReasons(reasons).slice(0, 6)
    };
}

function dedupeReasons(reasons) {
    const seen = new Set();
    const ok = [], bad = [];
    reasons.forEach(r => {
        const key = r.ok + '|' + r.text.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        (r.ok ? ok : bad).push(r);
    });
    return [...ok, ...bad];
}

/**
 * Scores and re-sorts a full batch of UnifiedResults for one search.
 *
 * NOTE — now async (was sync). Phase 3 adds exactly one network-bound step:
 * warming every item's manga profile (Firestore read, or compute+write on a
 * miss). These are fetched in parallel via Promise.all rather than per-item
 * inside the score loop, so a 40-result batch costs one round of concurrent
 * reads, not 40 sequential ones. search.js's call site must be updated to
 * `await scoreResults(...)` and pass the merged concept dictionary through.
 *
 * @param {Array} unifiedResults
 * @param {object} intent
 * @param {import('./searchPlanner.js').SearchPlan} plan
 * @param {object} conceptDictionary - merged CONCEPT_PROPERTIES + HARVESTED_RULES (needed to build a profile on a cache miss)
 * @returns {Promise<Array>} same objects, each with matchScore/matchBreakdown/matchReasons, sorted desc by matchScore
 */
export async function scoreResults(unifiedResults, intent, plan, conceptDictionary) {
    if (!unifiedResults || unifiedResults.length === 0) return [];

    const normPopularity = minMaxNormalize(unifiedResults.map(r => r.popularity));

    const profileEntries = await Promise.all(
        unifiedResults.map(item =>
            getOrBuildProfile(item, conceptDictionary)
                .then(profile => [profileKey(item), profile])
                .catch(() => [profileKey(item), {}]) // a profile failure degrades to the fallback score, never breaks the search
        )
    );
    const profileMap = new Map(profileEntries);

    const scored = unifiedResults.map(item => ({
        ...item,
        ...scoreOne(item, intent, plan, normPopularity, profileMap.get(profileKey(item)))
    }));

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored;
}
