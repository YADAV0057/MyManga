// js/parser/moodEngine.js

import { MOOD_DICTIONARY, URGENCY_MODIFIERS, CONCEPT_PROPERTIES } from './dictionary.js';

// --------------------------------------------------------------------------
// Phrase index builders (module-scope cache — MOOD_DICTIONARY/
// URGENCY_MODIFIERS are fully populated by dictionary.js's synchronous
// injection step before any consumer calls analyzeMood(), so this is safe
// to build once and reuse).
//
// FIX: the previous version did `text.split(/\s+/)` and looked each single
// word up directly as `MOOD_DICTIONARY[word]`. That only ever worked for
// single-word, already-lowercase ids ("revenge", "cry"). It could never
// match:
//   - multi-word concept ids ("abandoned amusement park", "academic
//     rivalry") — the vast majority of harvested_knowledge.js
//   - case mismatches (fixed upstream in dictionary.js, but this file
//     still needs phrase-aware scanning to actually use it)
// This builds a longest-phrase-first index and does a greedy left-to-right
// scan so multi-word entries are matched before shorter/overlapping ones.
// --------------------------------------------------------------------------
let MOOD_PHRASES = null;
let MODIFIER_PHRASES = null;

function buildPhraseIndex(dict) {
    return Object.keys(dict)
        .map(key => ({ key, words: key.split(/\s+/).filter(Boolean) }))
        .sort((a, b) => b.words.length - a.words.length || b.key.length - a.key.length);
}

function getMoodPhrases() {
    if (!MOOD_PHRASES) MOOD_PHRASES = buildPhraseIndex(MOOD_DICTIONARY);
    return MOOD_PHRASES;
}

function getModifierPhrases() {
    if (!MODIFIER_PHRASES) MODIFIER_PHRASES = buildPhraseIndex(URGENCY_MODIFIERS);
    return MODIFIER_PHRASES;
}

/** Does phraseWords occur in `words` starting at index i? */
function matchesAt(words, i, phraseWords) {
    if (i + phraseWords.length > words.length) return false;
    for (let j = 0; j < phraseWords.length; j++) {
        if (words[i + j] !== phraseWords[j]) return false;
    }
    return true;
}

/** Finds the longest phrase from `phraseList` (already sorted longest-first) starting at index i, or null. */
function matchPhraseAt(words, i, phraseList) {
    for (const phrase of phraseList) {
        if (matchesAt(words, i, phrase.words)) return phrase;
    }
    return null;
}

// --------------------------------------------------------------------------
// Mood-atom vector construction.
//
// FIX: recommendationScorer.js compares intent.moodProfile against a
// title's stored profile via cosineSimilarity(vecA, vecB), which expects a
// plain {atom: weight} object (see mangaProfiles.js's cosineSimilarity:
// `Object.keys(vecA || {})`). But this file used to hand back moodProfile
// as an ARRAY of {mood, name, score, percent} objects. Object.keys() on an
// array returns index strings ("0","1",...), so vecA[k] was never a
// number, normA was always 0, and cosineSimilarity returned null on every
// single call — the Phase 3 real-vector scoring silently never ran; every
// search fell back to the old genre/theme overlap approximation.
//
// Separately, even a fixed object shape wasn't enough: moodProfile's keys
// are concept/mood ids ("revenge", "sad", "dark"), while a manga's stored
// profile lives in "mood atom" space (exciting, violent, dark, mysterious,
// emotional, tragic, funny, romantic, intense — each concept's own
// `moodWeights`, see properties.js / harvested_knowledge.js). Those two
// vocabularies only coincidentally overlap on words like "dark".
//
// buildMoodVector() below translates each matched concept, via its own
// moodWeights, into that same atom space — the same translation
// mangaProfiles.js's computeMoodAtomProfile() already does for titles — so
// intent.moodVector and a title's profile are finally directly comparable.
// --------------------------------------------------------------------------
function buildMoodVector(matchedMoodScores) {
    // matchedMoodScores: { moodId: accumulatedIntensity }
    const atomAccum = {}; // atom -> { sum, weight }

    Object.entries(matchedMoodScores).forEach(([moodId, strength]) => {
        const concept = CONCEPT_PROPERTIES[moodId];
        if (!concept || !concept.moodWeights) return;

        Object.entries(concept.moodWeights).forEach(([atom, w]) => {
            if (!atomAccum[atom]) atomAccum[atom] = { sum: 0, weight: 0 };
            atomAccum[atom].sum += w * strength;
            atomAccum[atom].weight += strength;
        });
    });

    const vector = {};
    Object.entries(atomAccum).forEach(([atom, { sum, weight }]) => {
        if (weight > 0) vector[atom] = parseFloat((sum / weight).toFixed(3));
    });
    return vector;
}

/**
 * Analyzes normalized text to extract moods, calculate intensity, and determine tone.
 * @param {string} text - The normalized and synonym-replaced user input.
 * @returns {object} - Contains moods (array), intensity (float), moodProfile
 *   (array, for UI display — aiPanel.js reads .name/.percent off this),
 *   moodVector (plain {atom: weight} object, for cosine-similarity scoring
 *   against stored manga profiles), and tone (string).
 */
export function analyzeMood(text) {
    if (!text) {
        return { moods: [], intensity: 0.5, moodProfile: [], moodVector: {}, tone: "neutral" };
    }

    const words = text.split(/\s+/).filter(Boolean);
    const detectedMoods = new Set();
    const moodProfile = {};
    const toneScores = { positive: 0, negative: 0, neutral: 0 };

    let totalIntensity = 0;
    let matchCount = 0;
    let currentModifier = 1.0;

    const moodPhrases = getMoodPhrases();
    const modifierPhrases = getModifierPhrases();

    let i = 0;
    while (i < words.length) {
        // 1. Check for urgency modifiers (e.g., "extremely", "a bit") —
        // phrase-aware so multi-word modifiers like "a bit" work too.
        const modMatch = matchPhraseAt(words, i, modifierPhrases);
        if (modMatch) {
            currentModifier = URGENCY_MODIFIERS[modMatch.key];
            i += modMatch.words.length;
            continue;
        }

        // 2. Check for mood dictionary matches — longest phrase first, so
        // "abandoned amusement park" matches as one concept rather than
        // three unrelated single words being checked (and failing) individually.
        const dictMatch = matchPhraseAt(words, i, moodPhrases);
        if (dictMatch) {
            const dictEntry = MOOD_DICTIONARY[dictMatch.key];
            const adjustedIntensity = dictEntry.intensity * currentModifier;

            dictEntry.moods.forEach(mood => {
                detectedMoods.add(mood);
                moodProfile[mood] = (moodProfile[mood] || 0) + adjustedIntensity;
            });

            totalIntensity += adjustedIntensity;
            toneScores[dictEntry.tone] += 1;
            matchCount++;

            currentModifier = 1.0; // reset after applying
            i += dictMatch.words.length;
            continue;
        }

        // No match at this position — advance one word.
        i += 1;
    }

    // 3. Calculate Global Intensity
    let globalIntensity = 0.5; // Default safe value
    if (matchCount > 0) {
        globalIntensity = Math.min(totalIntensity / matchCount, 1.0);
    }

    // 4. Determine Dominant Tone
    let dominantTone = "neutral";
    if (toneScores.negative > toneScores.positive && toneScores.negative >= toneScores.neutral) {
        dominantTone = "negative";
    } else if (toneScores.positive > toneScores.negative && toneScores.positive >= toneScores.neutral) {
        dominantTone = "positive";
    }

    // 5. Normalize Mood Profile Scores (Formatted safely for UI)
    const normalizedProfile = Object.keys(moodProfile).map(mood => {
        const rawScore = Math.min(moodProfile[mood], 1.0);
        return {
            mood: mood,
            name: mood,
            score: rawScore,
            percent: Math.round(rawScore * 100)
        };
    }).sort((a, b) => b.score - a.score);

    // 6. Build the mood-atom vector for real cosine-similarity scoring
    // against stored manga profiles (see buildMoodVector's header comment).
    const moodVector = buildMoodVector(moodProfile);

    return {
        moods: Array.from(detectedMoods),
        intensity: Number(globalIntensity.toFixed(2)),
        moodProfile: normalizedProfile,
        moodVector,
        tone: dominantTone
    };
}
