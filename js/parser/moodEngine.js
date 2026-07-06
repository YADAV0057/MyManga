
import { MOOD_DICTIONARY } from "./dictionary.js";

export function analyzeMood(text) {
    const words = text.toLowerCase().split(" ");
    
    let moodScores = {}; 
    let globalIntensity = 0;
    let uniqueMoods = new Set(); 

    words.forEach(word => {
        if (MOOD_DICTIONARY[word]) {
            const entry = MOOD_DICTIONARY[word];
            
            // Add to global intensity
            globalIntensity += entry.intensity;

            // Tally individual mood scores for the visual profile
            entry.moods.forEach(m => {
                uniqueMoods.add(m); // Keep flat list for the genreMapper
                
                if (!moodScores[m]) {
                    moodScores[m] = 0;
                }
                moodScores[m] += entry.intensity; 
            });
        }
    });

    // Format the data for your frontend UI visual bars
    const moodProfile = Object.keys(moodScores).map(mood => {
        // Cap individual mood score at 1.0 (100%)
        const rawScore = Math.min(moodScores[mood], 1.0);
        return {
            category: mood,
            // Convert to a clean integer percentage (e.g., 0.9 -> 90)
            score: Math.round(rawScore * 100) 
        };
    });

    // Sort the profile so the highest percentages appear first
    moodProfile.sort((a, b) => b.score - a.score);

    return {
        moods: [...uniqueMoods],        // For genreMapper.js
        moodProfile: moodProfile,       // For the UI Preview Board
        intensity: Math.min(globalIntensity, 1) 
    };
}
