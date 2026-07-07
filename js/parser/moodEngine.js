// js/parser/moodEngine.js

import { MOOD_DICTIONARY, URGENCY_MODIFIERS } from './dictionary.js';

/**
 * Analyzes normalized text to extract moods, calculate intensity, and determine tone.
 * @param {string} text - The normalized and synonym-replaced user input.
 * @returns {object} - Contains moods (array), intensity (float), moodProfile (object), and tone (string).
 */
export function analyzeMood(text) {
    if (!text) {
        return { moods: [], intensity: 0.5, moodProfile: {}, tone: "neutral" };
    }

    const words = text.split(/\s+/);
    const detectedMoods = new Set();
    const moodProfile = {};
    const toneScores = { positive: 0, negative: 0, neutral: 0 };
    
    let totalIntensity = 0;
    let matchCount = 0;
    let currentModifier = 1.0;

    words.forEach(word => {
        // 1. Check for urgency modifiers (e.g., "extremely", "slightly")
        if (URGENCY_MODIFIERS[word]) {
            currentModifier = URGENCY_MODIFIERS[word];
            return; // Move to the next word, holding this modifier in memory
        }

        // 2. Check for mood dictionary matches
        const dictEntry = MOOD_DICTIONARY[word];
        if (dictEntry) {
            // Apply current modifier to this word's base intensity
            const adjustedIntensity = dictEntry.intensity * currentModifier;

            // Track each associated internal mood
            dictEntry.moods.forEach(mood => {
                detectedMoods.add(mood);
                // Accumulate score for the mood profile
                moodProfile[mood] = (moodProfile[mood] || 0) + adjustedIntensity;
            });

            // Track global metrics
            totalIntensity += adjustedIntensity;
            toneScores[dictEntry.tone] += 1;
            matchCount++;

            // Reset the modifier after it has been applied to a dictionary word
            currentModifier = 1.0;
        }
    });

    // 3. Calculate Global Intensity
    let globalIntensity = 0.5; // Default safe value
    if (matchCount > 0) {
        // Average the intensity of all matched words, capped at a maximum of 1.0
        globalIntensity = Math.min(totalIntensity / matchCount, 1.0);
    }

    // 4. Determine Dominant Tone
    let dominantTone = "neutral";
    if (toneScores.negative > toneScores.positive && toneScores.negative >= toneScores.neutral) {
        dominantTone = "negative";
    } else if (toneScores.positive > toneScores.negative && toneScores.positive >= toneScores.neutral) {
        dominantTone = "positive";
    }

    // 5. Normalize Mood Profile Scores
    const normalizedProfile = {};
    Object.keys(moodProfile).forEach(mood => {
        // Cap individual mood profile scores at 1.0 and format to 2 decimal places
        normalizedProfile[mood] = Number(Math.min(moodProfile[mood], 1.0).toFixed(2));
    });

    return {
        moods: Array.from(detectedMoods),
        intensity: Number(globalIntensity.toFixed(2)),
        moodProfile: normalizedProfile,
        tone: dominantTone
    };
}
