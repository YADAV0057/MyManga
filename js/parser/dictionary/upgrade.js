// js/parser/dictionary/upgrade.js
import fs from 'fs';
import { GENRE_WEIGHTS, THEME_WEIGHTS, SOURCE_MULTIPLIERS } from './MoodConfig.js';
import { CONCEPT_PROPERTIES } from './properties.js';

/**
 * Calculates a mood vector based on genre, theme, and source weights.
 */
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

    process(concept.genres || [], GENRE_WEIGHTS, SOURCE_MULTIPLIERS.Genre);
    process(concept.themes || [], THEME_WEIGHTS, SOURCE_MULTIPLIERS.Theme);
    
    const max = Math.max(...Object.values(scores), 1);
    Object.keys(scores).forEach(m => scores[m] = parseFloat((scores[m] / max).toFixed(2)));
    
    return scores;
}

// --- EXECUTION BLOCK ---
if (process.argv[1] && process.argv[1].endsWith('upgrade.js')) {
    runUpgrade();
}

function runUpgrade() {
    const finalProperties = { ...CONCEPT_PROPERTIES };
    const reviewQueue = [];

    for (let key in CONCEPT_PROPERTIES) {
        const concept = CONCEPT_PROPERTIES[key];
        concept.moodWeights = calculateMood(concept);
        
        const confidence = concept.metadata?.confidence || 0;
        if (confidence >= 0.75) {
            console.log(`[Auto-Published] ${key} (Conf: ${confidence})`);
        } else {
            console.log(`[Queued for Review] ${key} (Conf: ${confidence})`);
            reviewQueue.push(concept);
            delete finalProperties[key];
        }
    }

    const harvestFile = `export const HARVESTED_RULES = ${JSON.stringify(finalProperties, null, 4)};\n`;
    fs.writeFileSync('./harvested_knowledge.js', harvestFile);
    fs.writeFileSync('./review_queue.json', JSON.stringify(reviewQueue, null, 4));
    
    console.log("Upgrade complete. Harvested knowledge updated and review queue synchronized.");
}
