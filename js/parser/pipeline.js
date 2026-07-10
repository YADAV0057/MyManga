// js/parser/pipeline.js

import { MangaIntent } from './intentSchema.js';
import { normalize } from './normalize.js';
import { extractRules } from './rules.js';
import { applySynonyms } from './synonyms.js';
import { analyzeMood } from './moodEngine.js';
import { mapMoodsToCategories } from './genreMapper.js';
import { applyReasoningRules } from './ruleEngine.js';
import { correctTypos } from './fuzzyMatch.js';
import { SYNONYM_MAP, MOOD_MAPPINGS } from './dictionary.js';

// --------------------------------------------------------------------------
// Negation handling.
//
// FIX (this used to be dead code + single-word-only):
//   1. buildIntent() never attached this function's `excluded` result onto
//      `intent` — the merge step below (`if (intent.excluded...)`) always
//      read `undefined`. Every negation ("no romance", "avoid gore") did
//      nothing at all, silently, end to end. buildIntent() now sets
//      `intent.excluded` / `intent.excludedThemes` right after this runs.
//   2. This used to grab only the single next word after a negation term
//      ("no found family stuff" -> only "found"). It now tries the longest
//      known phrase first (same technique as synonyms.js/moodEngine.js's
//      phrase indexes), so multi-word concepts are captured whole.
//   3. The captured phrase is resolved through SYNONYM_MAP -> a concept id
//      -> that concept's real genre/theme names (via MOOD_MAPPINGS),
//      instead of blindly Title-Casing whatever word followed "no" and
//      assuming it's a real genre. Falls back to the old Title-Case guess
//      only when the phrase doesn't resolve to anything known, so cases
//      that happened to work before (a negated word that IS a literal
//      genre name) don't regress.
//   4. Scans left-to-right in one pass instead of once per negation word,
//      so two different negations sharing the same trigger word (e.g.
//      "no romance no gore") both register instead of only the first.
// --------------------------------------------------------------------------

const NEGATION_TRIGGERS = ["no", "not", "without", "avoid", "except", "don't"];

let NEGATION_VOCAB = null;
function getNegationVocab() {
    if (NEGATION_VOCAB) return NEGATION_VOCAB;
    NEGATION_VOCAB = Object.keys(SYNONYM_MAP)
        .map(key => ({ key, words: key.split(/\s+/).filter(Boolean) }))
        .sort((a, b) => b.words.length - a.words.length || b.key.length - a.key.length);
    return NEGATION_VOCAB;
}

/** Does phraseWords occur in `words` starting at index i? */
function matchesAt(words, i, phraseWords) {
    if (i + phraseWords.length > words.length) return false;
    for (let j = 0; j < phraseWords.length; j++) {
        if (words[i + j] !== phraseWords[j]) return false;
    }
    return true;
}

/**
 * Strips negation terms from the input and tracks excluded genres/themes.
 * @param {string} text
 * @returns {{ cleanText: string, excluded: string[], excludedThemes: string[] }}
 */
function handleNegations(text) {
    const words = text.split(/\s+/).filter(Boolean);
    const vocab = getNegationVocab();

    const excludedGenres = new Set();
    const excludedThemes = new Set();
    const keptWords = [];

    let i = 0;
    while (i < words.length) {
        const isTrigger = NEGATION_TRIGGERS.includes(words[i]);

        if (isTrigger) {
            // Try the longest known phrase starting right after the trigger word.
            let matchedPhrase = null;
            for (const phrase of vocab) {
                if (matchesAt(words, i + 1, phrase.words)) { matchedPhrase = phrase; break; }
            }

            if (matchedPhrase) {
                const conceptId = SYNONYM_MAP[matchedPhrase.key];
                const mapping = MOOD_MAPPINGS[conceptId];
                if (mapping) {
                    Object.keys(mapping.genres || {}).forEach(g => excludedGenres.add(g));
                    Object.keys(mapping.themes || {}).forEach(t => excludedThemes.add(t));
                }
                i += 1 + matchedPhrase.words.length; // skip trigger word + matched phrase
                continue;
            }

            // Fallback: nothing known matched — same guess the old code
            // always made, kept so previously-working cases don't regress.
            const nextWord = words[i + 1];
            if (nextWord) {
                excludedGenres.add(nextWord.charAt(0).toUpperCase() + nextWord.slice(1));
                i += 2; // skip trigger word + guessed word
                continue;
            }
        }

        keptWords.push(words[i]);
        i += 1;
    }

    return {
        cleanText: keptWords.join(' ').trim(),
        excluded: [...excludedGenres],
        excludedThemes: [...excludedThemes]
    };
}


/**
 * Orchestrates the full intent analysis pipeline.
 */
export function buildIntent(rawUserInput) {
    let intent = new MangaIntent();
    intent.originalQuery = rawUserInput;

    // 1. Normalize, Correct Typos & Handle Negations
    const normalized = normalize(rawUserInput);
    const corrected = correctTypos(normalized);
    const { cleanText, excluded, excludedThemes } = handleNegations(corrected);
    intent.excluded = excluded;
    intent.excludedThemes = excludedThemes;

    // 2. Extract Hard Filters
    const filterData = extractRules(cleanText);
    intent.status = filterData.status;
    intent.sort = filterData.sort;
    intent.maxChapters = filterData.maxChapters;

    // 3. Translate Synonyms
    let translatedText = applySynonyms(cleanText);

    // 4. Extract Moods & Tone
    const moodData = analyzeMood(translatedText);
    intent.moods = moodData.moods;
    intent.intensity = moodData.intensity;
    intent.moodProfile = moodData.moodProfile;
    intent.moodVector = moodData.moodVector;
    intent.tone = moodData.tone;

    // 5. Map to Categories
    const allMapped = mapMoodsToCategories(intent.moods, 5);

    intent.genres = allMapped.genres.filter(g => g.confidence >= 0.80);
    intent.themes = allMapped.themes.filter(t => t.confidence >= 0.80);
    intent.demographics = allMapped.demographics.filter(d => d.confidence >= 0.80);

    const suggestedGenres = allMapped.genres.filter(g => g.confidence < 0.80);
    const suggestedThemes = allMapped.themes.filter(t => t.confidence < 0.80);
    const suggestedDemographics = allMapped.demographics.filter(d => d.confidence < 0.80);

    // 6. Apply Reasoning Rules
    intent = applyReasoningRules(intent);

    // 6.5 Merge Manual Exclusions (now actually reachable — see fix notes above)
    if ((intent.excluded && intent.excluded.length > 0) || (intent.excludedThemes && intent.excludedThemes.length > 0)) {
        if (!intent.avoids) intent.avoids = { genres: [], themes: [] };
        intent.avoids.genres = [...new Set([...intent.avoids.genres, ...(intent.excluded || [])])];
        intent.avoids.themes = [...new Set([...intent.avoids.themes, ...(intent.excludedThemes || [])])];
    }

    // 7. Deduplicate and Clean (The "Hardening" step)
    const filterSuggested = (primary, suggested) => {
        const map = new Map();

        [...suggested].forEach(item => {
            // Check if this item is already a primary requirement
            const isPrimary = primary.some(p => p.name === item.name);

            // If it is NOT primary, add it to suggestions
            if (!isPrimary) {
                const existing = map.get(item.name)?.score || 0;
                const current = item.confidence ?? item.score ?? 0.5;

                if (current > existing) {
                    map.set(item.name, {
                        name: item.name,
                        confidence: Math.min(Number(current), 1.0),
                        score: Math.min(Number(current), 1.0),
                        reason: item.reason || null
                    });
                }
            }
        });

        return Array.from(map.values()).sort((a, b) => b.score - a.score);
    };

    // Apply strict filtering (removes anything already in primary intent)
    intent.boosts.genres = filterSuggested(intent.genres, [...(intent.boosts?.genres || []), ...suggestedGenres]);
    intent.boosts.themes = filterSuggested(intent.themes, [...(intent.boosts?.themes || []), ...suggestedThemes]);
    intent.boosts.demographics = filterSuggested(intent.demographics, [...(intent.boosts?.demographics || []), ...suggestedDemographics]);

    // 8. Final Confidence Check
    if (!intent.moods || intent.moods.length === 0) {
        intent.confidence = 0.2;
    }

    return intent;
}
