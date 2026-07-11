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
import { SYNONYM_MAP } from './dictionary.js';

const WEIGHTS = {
    mood: 0.40,
    genre: 0.20,
    theme: 0.15,
    demographic: 0.05,
    constraint: 0.10,
    popularity: 0.05,
    rating: 0.05,
    // NEW — entity/opposite data from the concept dictionary (see
    // properties.js schema + harvester's entityRelations.js). Small weight
    // and null when there's no signal (see components.filter below), so
    // this is purely additive: a concept with no entities/opposite data
    // yet scores byte-identical to before this change.
    entity: 0.05,
    // NEW — fallback signal for concepts with no moodWeights (the "root
    // structural gap": AniList has no genre/tag equivalent for an invented/
    // compound trope name, so calculateMood() could never produce a
    // mood-atom vector for it — see PARSER_DICTIONARY_BUG_FINDINGS.md
    // Section 1). Rather than leaving such a concept invisible to scoring,
    // this uses the two things every concept has regardless of AniList
    // coverage — its own `excludes` and `boosts` — as a substitute signal.
    // Null (not 0) whenever no moodless concept was actually matched, so
    // this never touches scoring for concepts that already have real
    // moodWeights.
    conceptSignal: 0.08
};

// A query word matches MOOD_DICTIONARY by the concept's own id (see
// dictionary.js's injection step: `MOOD_DICTIONARY[id] = {moods:[id],...}`),
// so intent.moods already doubles as "which concept ids fired for this
// query" whenever a match came from an injected concept rather than the
// hand-authored "cry"/"depressing" entries. This is what lets entity/
// opposite scoring below work without any pipeline.js/intentSchema.js
// changes — it just reads concept data straight off the ids already
// sitting in intent.moods.
function matchedConcepts(intent, conceptDictionary) {
    if (!intent?.moods || !conceptDictionary) return [];
    return intent.moods
        .map(id => conceptDictionary[id])
        .filter(Boolean);
}

/**
 * A concept's `boosts` array is a list of trope/mood-id strings (e.g.
 * ["dark", "survival", "antihero"]) — plain keywords, not genre/theme
 * names. Some of those ids happen to BE other concepts in the same
 * dictionary (harvested or hand-curated), which DO carry real genres/
 * themes. This resolves each boost id through the dictionary and returns
 * the union of whatever genre/theme names those sibling concepts have —
 * a proxy signal for a concept that has none of its own.
 *
 * Resolution tries two paths per boost id:
 *   1. Direct match — the boost string IS some concept's own id.
 *   2. Alias match, via SYNONYM_MAP (dictionary.js) — the boost string is
 *      an ALIAS of a differently-named concept (e.g. "antihero" might not
 *      be any concept's own id, but could be an alias of a concept whose
 *      id is "morally-grey-protagonist"). Without this fallback, boosts
 *      only ever resolved against exact concept keys, silently missing
 *      every alias-only match and understating how much real genre/theme
 *      signal a concept's boosts actually carry.
 *
 * Also reports how many of the concept's boosts actually resolved to
 * something, vs how many exist total — used upstream to discount the
 * conceptSignal score's confidence when resolution coverage is sparse
 * (a concept where 4/5 boosts resolved is a stronger bet than one where
 * only 1/5 did, even if the resulting hit-rate looks identical).
 *
 * @returns {{names: Set<string>, resolved: number, total: number}}
 */
function resolveBoostGenres(concept, conceptDictionary) {
    const names = new Set();
    const boosts = concept.boosts || [];
    let resolved = 0;
    boosts.forEach(boostId => {
        const key = String(boostId).toLowerCase();
        let boostConcept = conceptDictionary?.[key];
        if (!boostConcept && SYNONYM_MAP[key]) {
            boostConcept = conceptDictionary?.[SYNONYM_MAP[key]];
        }
        if (!boostConcept) return;
        resolved++;
        (boostConcept.genres || []).forEach(g => g?.name && names.add(g.name));
        (boostConcept.themes || []).forEach(t => t?.name && names.add(t.name));
    });
    return { names, resolved, total: boosts.length };
}

const NEUTRAL = 0.6; // score used when a signal has nothing to compare against

function namesOf(list) {
    return (list || []).map(x => (typeof x === 'string' ? x : x.name)).filter(Boolean);
}

/**
 * Weighted-recall overlap: of the total confidence/weight in `weighted`,
 * how much is present in `haveNames`? Returns 0-1, or null when there's no
 * signal to score at all.
 * @param {Array<{name:string, confidence?:number, score?:number}>} weighted
 * @param {string[]} haveNames
 * @param {boolean} [treatEmptyHaveAsNoSignal=false] - when true, an empty
 *   `haveNames` returns null instead of 0. Use this for fields a source API
 *   might simply not report (e.g. demographics — resultNormalizer.js
 *   defaults that to [] for AniList/MangaDex/Kitsu, which don't expose it,
 *   not just when a title genuinely has none). Without this, "the API
 *   didn't tell us" and "definitely not Seinen" score identically, which
 *   falsely penalizes the majority of results from sources that don't
 *   report that field at all. Left off by default (genres in particular
 *   are essentially always present, so an empty list there really is a
 *   mismatch, not a reporting gap).
 */
function weightedOverlap(weighted, haveNames, treatEmptyHaveAsNoSignal = false) {
    if (!weighted || weighted.length === 0) return null; // no signal
    if (treatEmptyHaveAsNoSignal && (!haveNames || haveNames.length === 0)) return null;
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
 * @param {object} [conceptDictionary] - merged CONCEPT_PROPERTIES + HARVESTED_RULES, for entity/opposite lookups
 */
function scoreOne(item, intent, plan, normPopularity, mangaProfile, conceptDictionary) {
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
            matchBreakdown: { mood: 100, genre: 100, theme: 100, demographic: 100, constraint: 100, popularity: 100, rating: 100, entity: 100, conceptSignal: 100 },
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
    if (mangaProfile && intent.moodVector && Object.keys(mangaProfile).length > 0) {
        const sim = cosineSimilarity(intent.moodVector, mangaProfile);
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

    // --- Demographic match (5%) — Shounen/Shoujo/Seinen/Josei/Kids. Not
    // every source API exposes this (resultNormalizer.js defaults to []
    // where it's missing), and not every query implies one, so this uses
    // the same weighted-recall approach as mood rather than a hard
    // plan-level requirement — null (no signal) when either side is empty,
    // which correctly drops out of the weighted average below instead of
    // being scored as a mismatch.
    const demographicSignal = [...(intent.demographics || []), ...(intent.boosts?.demographics || [])];
    const demographicScore = weightedOverlap(demographicSignal, item.demographics || [], true);
    if (demographicScore !== null && demographicScore >= 0.5) {
        const itemDemos = new Set((item.demographics || []).map(d => d.toLowerCase()));
        const matchedDemo = demographicSignal.find(d => itemDemos.has((d.name || '').toLowerCase()));
        if (matchedDemo) reasons.push({ ok: true, text: `${matchedDemo.name} demographic match` });
    }

    // --- Constraint match (10%) — excluded genres/themes should NOT be present;
    // status/maxChapters are already enforced upstream (API query + search.js
    // filter), so this is mostly a defensive re-check plus positive framing.
    // ASYMMETRIC PENALTY (confirmed via manual mood-engine diagnostic): a
    // genre is a broad category, so brushing an avoided genre is a weaker
    // true-mismatch signal than a theme actually being present — themes are
    // specific, defining characteristics (e.g. "Iyashikei", "Revenge"). The
    // diagnostic used -2.0 genre / -2.5 theme (ratio 4:5); same ratio here,
    // rescaled to this function's 0-1 constraint scale.
    let constraintScore = 1.0;
    const itemHas = new Set([...itemGenres, ...itemThemes].map(g => g.toLowerCase()));
    (plan.excludedGenres || []).forEach(ex => {
        if (itemHas.has(ex.toLowerCase())) {
            constraintScore -= 0.4; // present when it shouldn't be — moderate penalty
            reasons.push({ ok: false, text: `Contains ${ex}` });
        } else {
            reasons.push({ ok: true, text: `No ${ex}` });
        }
    });
    (plan.excludedThemes || []).forEach(ex => {
        if (itemHas.has(ex.toLowerCase())) {
            constraintScore -= 0.5; // present when it shouldn't be — harder penalty than an excluded genre
            reasons.push({ ok: false, text: `Contains ${ex}` });
        } else {
            reasons.push({ ok: true, text: `No ${ex}` });
        }
    });
    if (plan.filters?.maxChapters) {
        const ch = typeof item.chapters === 'string' ? parseInt(item.chapters, 10) : item.chapters;
        if (!isNaN(ch) && ch > plan.filters.maxChapters) constraintScore -= 0.5;
    }

    // --- Opposite-concept penalty (NEW) — mirrors the excludedGenres/
    // excludedThemes pattern above, but the "what to avoid" list comes from
    // the matched concept's own `opposite` field (entityRelations.js's
    // computeOppositeConcepts) instead of the plan's authored excludes.
    // Smaller penalty than a direct exclude (-0.15 vs -0.4/-0.5) since this
    // is a derived heuristic, not an authored exclusion — and it only fires
    // when conceptDictionary/opposite data actually exists, so a concept
    // without this field yet behaves exactly as before.
    matchedConcepts(intent, conceptDictionary).forEach(concept => {
        (concept.opposite || []).forEach(oppositeId => {
            const oppositeConcept = conceptDictionary?.[oppositeId];
            const topOppositeGenre = oppositeConcept?.genres?.[0]?.name;
            if (topOppositeGenre && itemHas.has(topOppositeGenre.toLowerCase())) {
                constraintScore -= 0.15;
                reasons.push({ ok: false, text: `Leans ${oppositeId} instead of ${concept.id}` });
            }
        });
    });
    constraintScore = Math.max(0, constraintScore);

    // --- Concept signal fallback (NEW) — the "root structural gap" fix.
    // Concepts whose name has no AniList genre/tag equivalent (invented or
    // compound tropes, e.g. "Academic Rivalry") get moodWeights: {} forever
    // — calculateMood() has nothing to build a mood-atom vector from, so
    // buildMoodVector() in moodEngine.js silently skips them and they never
    // influence intent.moodVector or the mood score above. That doesn't
    // mean the concept has NO usable data, though: it still has `excludes`
    // (real genre/theme names, hand-authored or synopsis-derived) and
    // `boosts` (trope/mood-id strings, some of which resolve to sibling
    // concepts that DO have real genres/themes — see resolveBoostGenres()).
    // This uses both as a substitute recall signal, active only when a
    // matched concept actually has empty moodWeights — a concept with real
    // moodWeights is scored by the mood component above as before, so this
    // never double-counts or changes existing scoring.
    let conceptSignalScore = null;
    // Discount factor applied to WEIGHTS.conceptSignal based on how much of
    // the matched concept(s)' `boosts` lists actually resolved to sibling
    // concepts with real genre/theme data (see resolveBoostGenres). Floored
    // at 0.5 rather than going to 0 when nothing resolves, since the
    // `excludes` half of the signal is always fully resolvable on its own
    // and shouldn't be zeroed out just because boosts happened to be sparse
    // or unresolvable. Starts at 1 (no discount) when there are no boosts
    // at all to be incomplete about.
    let conceptSignalWeight = WEIGHTS.conceptSignal;
    const moodlessMatches = matchedConcepts(intent, conceptDictionary)
        .filter(c => !c.moodWeights || Object.keys(c.moodWeights).length === 0);
    if (moodlessMatches.length > 0) {
        let hits = 0, total = 0;
        let boostsResolved = 0, boostsTotal = 0;
        moodlessMatches.forEach(concept => {
            // Own excludes — same polarity as the plan-level excludedGenres/
            // excludedThemes check above: absence of an excluded name is
            // the desired case.
            [...(concept.excludes?.genres || []), ...(concept.excludes?.themes || [])].forEach(ex => {
                total++;
                if (!itemHas.has(ex.toLowerCase())) hits++;
            });
            // Boosts resolved through sibling concepts' real genre/theme data
            // (direct id match, or alias match via SYNONYM_MAP).
            const { names, resolved, total: boostTotal } = resolveBoostGenres(concept, conceptDictionary);
            boostsResolved += resolved;
            boostsTotal += boostTotal;
            names.forEach(name => {
                total++;
                if (itemHas.has(name.toLowerCase())) hits++;
            });
        });
        if (total > 0) {
            conceptSignalScore = hits / total;
            if (boostsTotal > 0) {
                const completeness = boostsResolved / boostsTotal;
                conceptSignalWeight = WEIGHTS.conceptSignal * (0.5 + 0.5 * completeness);
            }
            if (conceptSignalScore >= 0.7) {
                const label = moodlessMatches[0].id || intent.moods?.[0];
                reasons.push({ ok: true, text: `Fits "${label}" trope signature` });
            }
        }
    }

    // --- Entity match (5%, NEW) — is this item one of the specific manga
    // curated for the matched concept (entityRelations.js, 2+ independent
    // sources agreeing)? A stronger, catalog-verified signal than genre/
    // theme overlap alone. Null (no signal, not 0) when there's no
    // entities data to check against, so it never drags down concepts
    // that haven't been entity-harvested yet.
    let entityScore = null;
    const itemTitleNorm = normalizeTitle(item.title);
    for (const concept of matchedConcepts(intent, conceptDictionary)) {
        const hit = (concept.entities || []).some(name => normalizeTitle(name) === itemTitleNorm);
        if (hit) {
            entityScore = 1;
            reasons.push({ ok: true, text: `Known ${concept.id} pick` });
            break;
        }
    }

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
        { score: demographicScore, weight: WEIGHTS.demographic },
        { score: constraintScore, weight: WEIGHTS.constraint },
        { score: popularityScore, weight: WEIGHTS.popularity },
        { score: ratingScore, weight: WEIGHTS.rating },
        { score: entityScore, weight: WEIGHTS.entity },
        { score: conceptSignalScore, weight: conceptSignalWeight }
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
            demographic: demographicScore !== null ? Math.round(demographicScore * 100) : null,
            constraint: Math.round(constraintScore * 100),
            popularity: Math.round(popularityScore * 100),
            rating: Math.round(ratingScore * 100),
            entity: entityScore !== null ? Math.round(entityScore * 100) : null,
            conceptSignal: conceptSignalScore !== null ? Math.round(conceptSignalScore * 100) : null
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
        unifiedResults.map(item => {
            // OPTIMIZATION: skip the Firestore round-trip entirely if there is no mood profile vector to score against.
            if (!intent.moodVector || Object.keys(intent.moodVector).length === 0) {
                return Promise.resolve([profileKey(item), {}]);
            }
            return getOrBuildProfile(item, conceptDictionary)
                .then(profile => [profileKey(item), profile])
                .catch(() => [profileKey(item), {}]);
        })
    );
    const profileMap = new Map(profileEntries);

    const scored = unifiedResults.map(item => ({
        ...item,
        ...scoreOne(item, intent, plan, normPopularity, profileMap.get(profileKey(item)), conceptDictionary)
    }));

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored;
}



