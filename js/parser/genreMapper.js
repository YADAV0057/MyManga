

/**
 * Converts detected moods into standard API Genres, Themes, and Demographics.
 * 
 * @param {Array<string>} detectedMoods 
 * @param {number} maxResults - Max items per category
 * @returns {Object} - { genres: [], themes: [], demographics: [] }
 */
// js/parser/genreMapper.js
// (Keep MOOD_MAPPINGS the exact same as before)

// js/parser/genreMapper.js
import { MOOD_MAPPINGS } from './dictionary.js';

export function mapMoodsToCategories(detectedMoods, maxResults = 3) {
    const scores = { genres: {}, themes: {}, demographics: {} };

    // 1. Calculate weighted scores from all detected moods
    (detectedMoods || []).forEach(mood => {
        const map = MOOD_MAPPINGS[mood.toLowerCase()];
        if (map) {
            ['genres', 'themes', 'demographics'].forEach(category => {
                for (const [tag, weight] of Object.entries(map[category] || {})) {
                    if (!scores[category][tag]) scores[category][tag] = 0;
                    scores[category][tag] += weight;
                }
            });
        }
    });

    // 2. Universal helper to sort and apply confidence
    const extractWithConfidence = (scoreObj) => {
        return Object.entries(scoreObj)
            .sort((a, b) => b[1] - a[1]) // Sort by highest score
            .map(([name, score]) => ({
                name,
                confidence: Math.min(Number(score.toFixed(2)), 1.0)
            }))
            .slice(0, maxResults);
    };

    // 3. Return the unified object
    return {
        genres: extractWithConfidence(scores.genres),
        themes: extractWithConfidence(scores.themes),
        demographics: extractWithConfidence(scores.demographics)
    };
}
