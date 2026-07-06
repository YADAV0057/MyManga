/**
 * MOOD_TO_GENRE_MAP
 * Maps abstract internal moods to standard genres.
 * Weights determine how strongly a mood correlates to a genre.
 */
export const MOOD_TO_GENRE_MAP = {
    // EMOTIONS
    sad: { Drama: 1.0, Tragedy: 0.9, SliceOfLife: 0.4 },
    emotional: { Drama: 0.8, SliceOfLife: 0.6, Romance: 0.5 },
    happy: { Comedy: 1.0, SliceOfLife: 0.8, Adventure: 0.5 },
    uplifting: { SliceOfLife: 0.9, Fantasy: 0.6, Comedy: 0.5 },
    
    // VIBES
    wholesome: { SliceOfLife: 1.0, Romance: 0.8, Comedy: 0.6 },
    soft: { SliceOfLife: 0.9, Romance: 0.7 },
    dark: { Psychological: 1.0, Horror: 0.9, Thriller: 0.8, Mystery: 0.5 },
    serious: { Drama: 0.8, Psychological: 0.7, Action: 0.5 },
    
    // THEMES
    revenge: { Drama: 1.0, Psychological: 0.9, Action: 0.8, Mystery: 0.4 },
    psychological: { Psychological: 1.0, Mystery: 0.8, Thriller: 0.8 },
    romance: { Romance: 1.0, Drama: 0.6, SliceOfLife: 0.5 },
    comedy: { Comedy: 1.0, SliceOfLife: 0.7, Parody: 0.6 }
};

/**
 * Converts an array of detected moods into standard API genres.
 * 
 * @param {Array<string>} detectedMoods - e.g., ["dark", "revenge", "sad"]
 * @param {number} maxResults - How many top genres to return
 * @returns {Array<string>} - e.g., ["Psychological", "Drama", "Horror"]
 */
export function mapMoodsToGenres(detectedMoods, maxResults = 3) {
    if (!detectedMoods || detectedMoods.length === 0) return [];

    const genreScores = {};

    // 1. Tally up the weights for all detected moods
    detectedMoods.forEach(mood => {
        const normalizedMood = mood.toLowerCase();
        const mappings = MOOD_TO_GENRE_MAP[normalizedMood];
        
        if (mappings) {
            for (const [genre, weight] of Object.entries(mappings)) {
                if (!genreScores[genre]) {
                    genreScores[genre] = 0;
                }
                // Accumulate the score (e.g., if "dark" and "revenge" both trigger Psychological, it stacks)
                genreScores[genre] += weight;
            }
        }
    });

    // 2. Convert the scores object into an array of [genre, score] pairs
    const sortedGenres = Object.entries(genreScores)
        // Sort descending by score
        .sort((a, b) => b[1] - a[1])
        // Extract just the genre name
        .map(entry => entry[0]);

    // 3. Return the top N genres
    return sortedGenres.slice(0, maxResults);
}

