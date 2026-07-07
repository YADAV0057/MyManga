// ==========================================
// RECOMMENDATION SCORER (js/parser/recommendationScorer.js)
// ==========================================
// Takes the UnifiedResult[] array (resultNormalizer.js) plus the MangaIntent
// (pipeline.js) and SearchPlan (searchPlanner.js) that produced the search,
// and scores + ranks every result. This replaces "sort by API order" with
// "sort by how well this manga actually matches what the user asked for."
//
// Design note on "mood match": individual manga don't carry a mood vector
// (that's Phase 3's Mood Similarity engine, which needs a per-title mood
// dataset we don't have yet). Until then, we treat intent.genres/intent.themes
// — the FULL weighted list genreMapper.js produced from the user's moods,
// not just the >=0.80 subset that made it into plan.primaryGenres — as the
// user's "mood signature" in genre-space, and score overlap against that.
// This is a deliberate approximation, documented so Phase 3 knows exactly
// what it's replacing.

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

/**
 * @param {import('../resultNormalizer.js').UnifiedResult} item
 * @param {object} intent   - buildIntent() output
 * @param {import('./searchPlanner.js').SearchPlan} plan
 * @param {(v:number)=>number} normPopularity
 */
function scoreOne(item, intent, plan, normPopularity) {
    const itemGenres = item.rawGenres || [];
    const itemThemes = (item.themes && item.themes.length > 0) ? item.themes : itemGenres;
    const reasons = [];

    // --- Mood match (40%) — overlap against the FULL mood-weighted genre/theme signature
    const moodSignal = [...(intent.genres || []), ...(intent.themes || [])];
    const moodOverlap = weightedOverlap(moodSignal, [...itemGenres, ...itemThemes]);
    const moodScore = moodOverlap ?? NEUTRAL;
    if (intent.moods && intent.moods.length > 0 && moodScore >= 0.5) {
        const label = intent.moods[0];
        reasons.push({ ok: true, text: `Strong "${label}" match` });
    }

    // --- Genre match (25%) — required primaryGenres from the plan
    const genreResult = listOverlap(plan.primaryGenres, itemGenres);
    const genreScore = genreResult ? genreResult.fraction : NEUTRAL;
    (genreResult?.matched || []).forEach(g => reasons.push({ ok: true, text: g }));

    // --- Theme match (15%) — secondaryThemes from the plan
    const themeResult = listOverlap(plan.secondaryThemes, itemThemes);
    const themeScore = themeResult ? themeResult.fraction : NEUTRAL;
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

    const total =
        moodScore * WEIGHTS.mood +
        genreScore * WEIGHTS.genre +
        themeScore * WEIGHTS.theme +
        constraintScore * WEIGHTS.constraint +
        popularityScore * WEIGHTS.popularity +
        ratingScore * WEIGHTS.rating;

    return {
        matchScore: Math.round(total * 100),
        matchBreakdown: {
            mood: Math.round(moodScore * 100),
            genre: Math.round(genreScore * 100),
            theme: Math.round(themeScore * 100),
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
 * @param {Array} unifiedResults
 * @param {object} intent
 * @param {import('./searchPlanner.js').SearchPlan} plan
 * @returns {Array} same objects, each with matchScore/matchBreakdown/matchReasons, sorted desc by matchScore
 */
export function scoreResults(unifiedResults, intent, plan) {
    if (!unifiedResults || unifiedResults.length === 0) return [];

    const normPopularity = minMaxNormalize(unifiedResults.map(r => r.popularity));

    const scored = unifiedResults.map(item => ({
        ...item,
        ...scoreOne(item, intent, plan, normPopularity)
    }));

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored;
}
