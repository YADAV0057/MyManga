// js/parser/genreMapper.js
import { MOOD_MAPPINGS } from './dictionary.js';

/**
 * Maps detected moods to API Genres, Themes, and Demographics.
 */
export function mapMoodsToCategories(detectedMoods, maxResults = 3) {
    const scores = { genres: {}, themes: {}, demographics: {} };

    // 1. Calculate weighted scores
    (detectedMoods || []).forEach(mood => {
        const map = MOOD_MAPPINGS[mood.toLowerCase()];
        if (map) {
            ['genres', 'themes', 'demographics'].forEach(category => {
                for (const [tag, weight] of Object.entries(map[category] || {})) {
                    scores[category][tag] = (scores[category][tag] || 0) + weight;
                }
            });
        }
    });

    // 2. Helper to extract and format
    const extractWithConfidence = (scoreObj) => {
    return Object.entries(scoreObj)
        .filter(([_, score]) => score > 0 && !isNaN(score)) // 👈 Add !isNaN check
        .sort((a, b) => b[1] - a[1])
        .map(([name, score]) => ({
            name,
            confidence: Math.min(Number(score.toFixed(2)), 1.0)
        }))
        .slice(0, maxResults);
};

    // 3. Return formatted object
    return {
        genres: extractWithConfidence(scores.genres),
        themes: extractWithConfidence(scores.themes),
        demographics: extractWithConfidence(scores.demographics)
    };
}
