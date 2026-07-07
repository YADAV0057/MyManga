/**
 * MOOD_MAPPINGS
 * Maps internal moods to Genres, Themes, and Demographics.
 * Weights determine how strongly a mood correlates to a specific tag.
 */
export const MOOD_MAPPINGS = {
    // 😭 SAD & EMOTIONAL
    sad: { 
        genres: { Drama: 1.0, Tragedy: 0.9 },
        themes: {},
        demographics: {}
    }, 
    emotional: { 
        genres: { Drama: 0.8, Romance: 0.5, Psychological: 0.4 },
        themes: {},
        demographics: {}
    },
    
    // 💀 DARK & EDGY
    dark: { 
        genres: { Psychological: 1.0, Horror: 0.9, Thriller: 0.8, Mystery: 0.5 },
        themes: { Survival: 0.7, Monsters: 0.5 },
        demographics: { Seinen: 0.8 } 
    },
    serious: { 
        genres: { Drama: 0.8, Psychological: 0.7, Action: 0.5 },
        themes: {},
        demographics: {}
    },
    revenge: {
        genres: { Drama: 1.0, Psychological: 0.9, Action: 0.8, Mystery: 0.4 },
        themes: { Villainess: 0.7 },
        demographics: { Seinen: 0.6, Josei: 0.5 }
    },
    psychological: { 
        genres: { Psychological: 1.0, Mystery: 0.8, Thriller: 0.8 },
        themes: {},
        demographics: {}
    },
    horror: { 
        genres: { Horror: 1.0, Psychological: 0.9, Thriller: 0.8, Supernatural: 0.5 },
        themes: { Survival: 0.8, Monsters: 0.7 },
        demographics: { Seinen: 0.7 }
    },
    mystery: { 
        genres: { Mystery: 1.0, Psychological: 0.8, Thriller: 0.8 },
        themes: {},
        demographics: {}
    },
    thriller: { 
        genres: { Thriller: 1.0, Mystery: 0.9, Psychological: 0.9 },
        themes: { Survival: 0.6 },
        demographics: { Seinen: 0.6 }
    },
    tragedy: { 
        genres: { Tragedy: 1.0, Drama: 0.9, Psychological: 0.6 },
        themes: {},
        demographics: { Seinen: 0.5, Josei: 0.5 }
    },

    // 🥰 ROMANCE & FLUFF
    happy: { 
        genres: { Comedy: 1.0, SliceOfLife: 0.8, Adventure: 0.5 },
        themes: {},
        demographics: {}
    },
    uplifting: { 
        genres: { SliceOfLife: 0.9, Fantasy: 0.6, Comedy: 0.5 },
        themes: {},
        demographics: {}
    },
    wholesome: { 
        genres: { SliceOfLife: 1.0, Romance: 0.8, Comedy: 0.6 },
        themes: { SchoolLife: 0.8, FoundFamily: 0.7 },
        demographics: { Shoujo: 0.8, Shounen: 0.5 }
    },
    soft: { 
        genres: { SliceOfLife: 0.9, Romance: 0.7 },
        themes: { Iyashikei: 0.8 },
        demographics: {}
    },
    romance: { 
        genres: { Romance: 1.0, Drama: 0.6, SliceOfLife: 0.5 },
        themes: { SchoolLife: 0.6 },
        demographics: { Shoujo: 0.9, Josei: 0.8 }
    },
    spicy: {
        genres: { Romance: 1.0, Drama: 0.6 },
        themes: { Harem: 0.5 },
        demographics: { Josei: 0.9, Seinen: 0.7 }
    },
    mature: { 
        genres: { Mature: 1.0, Romance: 0.6, Drama: 0.6 },
        themes: {},
        demographics: { Josei: 1.0, Seinen: 1.0 }
    },

    // 😂 COMEDY & ACTION
    comedy: { 
        genres: { Comedy: 1.0, SliceOfLife: 0.7, Parody: 0.6 },
        themes: { Gag: 0.9 },
        demographics: { Shounen: 0.6 }
    },
    parody: { 
        genres: { Comedy: 1.0, Parody: 1.0 },
        themes: { Gag: 0.8 },
        demographics: {}
    },
    action: { 
        genres: { Action: 1.0, Adventure: 0.7, Fantasy: 0.5 },
        themes: {},
        demographics: { Shounen: 0.9, Seinen: 0.6 }
    },
    epic: { 
        genres: { Action: 1.0, Adventure: 1.0, Fantasy: 0.8 },
        themes: { Military: 0.6 },
        demographics: { Shounen: 0.8, Seinen: 0.7 }
    },
    cool: { 
        genres: { Action: 0.8, SciFi: 0.6, Thriller: 0.5 },
        themes: {},
        demographics: { Shounen: 0.7 }
    },
    sports: { 
        genres: { Sports: 1.0, Drama: 0.6, Action: 0.5 },
        themes: { SchoolLife: 0.7 },
        demographics: { Shounen: 0.9 }
    }
};

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
