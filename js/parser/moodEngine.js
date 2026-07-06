// js/parser/moodEngine.js
import { MOOD_DICTIONARY, URGENCY_MODIFIERS } from "./dictionary.js";

export function analyzeMood(text) {
    const words = text.toLowerCase().split(" ");
    
    let moodScores = {}; 
    let uniqueMoods = new Set(); 
    
    // Intensity & Tone Trackers
    let baseIntensities = [];
    let urgencyMultiplier = 1.0;
    let toneScores = { positive: 0, negative: 0, neutral: 0 };

    words.forEach(word => {
        // 1. Check for urgency modifiers
        if (URGENCY_MODIFIERS[word]) {
            urgencyMultiplier *= URGENCY_MODIFIERS[word];
        }

        // 2. Check for core moods
        if (MOOD_DICTIONARY[word]) {
            const entry = MOOD_DICTIONARY[word];
            
            baseIntensities.push(entry.intensity);
            toneScores[entry.tone] += entry.intensity;

            entry.moods.forEach(m => {
                uniqueMoods.add(m);
                if (!moodScores[m]) moodScores[m] = 0;
                moodScores[m] += entry.intensity; 
            });
        }
    });

    // 3. Calculate Final Intensity
    let avgIntensity = baseIntensities.length > 0 
        ? baseIntensities.reduce((a, b) => a + b, 0) / baseIntensities.length 
        : 0;
    
    let finalIntensity = Math.min(avgIntensity * urgencyMultiplier, 1.0);

    // 4. Determine Dominant Tone
    let dominantTone = "neutral";
    if (toneScores.positive > toneScores.negative) dominantTone = "positive";
    if (toneScores.negative > toneScores.positive) dominantTone = "negative";

    // 5. Build Visual Profile
    const moodProfile = Object.keys(moodScores).map(mood => {
        const rawScore = Math.min(moodScores[mood], 1.0);
        return {
            category: mood,
            score: Math.round(rawScore * 100) 
        };
    }).sort((a, b) => b.score - a.score);

    return {
        moods: [...uniqueMoods],        
        moodProfile: moodProfile,       
        tone: dominantTone,             // NEW
        intensity: finalIntensity       // UPGRADED MATH
    };
}
