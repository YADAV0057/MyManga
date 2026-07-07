import fs from 'fs'; 
import { GENRE_WEIGHTS, THEME_WEIGHTS, SOURCE_MULTIPLIERS } from './MoodConfig.js';
import { CONCEPT_PROPERTIES } from './properties.js'; 

// ... calculateMood function remains exactly as is ...

if (process.argv[1] && process.argv[1].endsWith('upgrade.js')) {
    const finalProperties = { ...CONCEPT_PROPERTIES };
    const reviewQueue = [];

    for (let key in CONCEPT_PROPERTIES) {
        const concept = CONCEPT_PROPERTIES[key];
        
        // Calculate mood vectors
        concept.moodWeights = calculateMood(concept);
        
        // --- STEP 2: GATEKEEPER LOGIC ---
        // We check the confidence metadata we added in Step 1
        const confidence = concept.metadata?.confidence || 0;

        if (confidence >= 0.75) {
            console.log(`[Auto-Published] ${key} (Conf: ${confidence})`);
        } else {
            console.log(`[Queued for Review] ${key} (Conf: ${confidence})`);
            reviewQueue.push(concept);
            // Remove from main properties so it doesn't pollute production
            delete finalProperties[key];
        }
    }

    // ... (Your calculateMood function and loop logic remains exactly the same)

    // --- STEP 3 INTEGRATION: WRITE TO HARVESTED LAYER ONLY ---
    // Instead of overwriting properties.js, we write only to harvested_knowledge.js
    const harvestFile = `export const HARVESTED_RULES = ${JSON.stringify(finalProperties, null, 4)};\n`;
    fs.writeFileSync('./harvested_knowledge.js', harvestFile);

    // Write the review queue (This remains the same)
    fs.writeFileSync('./review_queue.json', JSON.stringify(reviewQueue, null, 4));
    
    console.log("Upgrade complete. Harvested knowledge updated and review queue synchronized.");
}
