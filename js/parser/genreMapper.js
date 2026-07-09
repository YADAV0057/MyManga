// js/parser/genreMapper.js
import { MOOD_MAPPINGS } from './dictionary.js';

/**
 * Maps detected moods to API Genres, Themes, and Demographics.
 * Now includes strict normalization and deduplication.
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

    // 2. Helper to extract, format, deduplicate, and normalize
    const extractWithConfidence = (scoreObj) => {
        const unique = new Map();
        
        Object.entries(scoreObj).forEach(([name, score]) => {
            // Force a valid number: default to 0.5 if NaN, undefined, or zero
            const safeScore = (typeof score !== 'number' || isNaN(score) || score <= 0) ? 0.5 : score;
            
            // Keep the highest score if this genre/theme was added multiple times
            if (!unique.has(name) || unique.get(name) < safeScore) {
                unique.set(name, safeScore);
            }
        });

        // Convert Map back to array, sort, cap at 1.0, and limit results
        return Array.from(unique.entries())
            .sort((a, b) => b[1] - a[1]) // Sort highest confidence first
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
