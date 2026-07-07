import fs from 'fs'; 
import { GENRE_WEIGHTS, THEME_WEIGHTS, SOURCE_MULTIPLIERS } from './MoodConfig.js';
import { CONCEPT_PROPERTIES } from './properties.js'; 

export function calculateMood(concept) {
    let scores = {};
    const process = (items = [], map, mult) => {
        items.forEach(item => {
            const moodMap = map[item.name];
            if (moodMap) {
                for (let [m, v] of Object.entries(moodMap)) {
                    scores[m] = (scores[m] || 0) + (v * item.weight * mult);
                }
            }
        });
    };
    
    // Added fallback to empty arrays to prevent crashes if genres/themes are missing
    process(concept.genres || [], GENRE_WEIGHTS, SOURCE_MULTIPLIERS.Genre);
    process(concept.themes || [], THEME_WEIGHTS, SOURCE_MULTIPLIERS.Theme);
    
    // Normalize
    const max = Math.max(...Object.values(scores), 1);
    Object.keys(scores).forEach(m => scores[m] = parseFloat((scores[m]/max).toFixed(2)));
    return scores;
}

// Check if this script is being run directly (e.g., node upgrade.js) 
// rather than being imported by harvester.js
if (process.argv[1] && process.argv[1].endsWith('upgrade.js')) {
    for (let key in CONCEPT_PROPERTIES) {
        CONCEPT_PROPERTIES[key].moodWeights = calculateMood(CONCEPT_PROPERTIES[key]);
    }
    console.log("Calculated mood vectors for all concepts.");
    
    // Optional: Write it back to the file if you run this manually
    // const fileBody = `export const CONCEPT_PROPERTIES = ${JSON.stringify(CONCEPT_PROPERTIES, null, 4)};\n`;
    // fs.writeFileSync('./properties.js', fileBody);
}
