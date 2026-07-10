// js/parser/dictionary/upgrade.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GENRE_WEIGHTS, THEME_WEIGHTS, DEMOGRAPHIC_WEIGHTS, SOURCE_MULTIPLIERS } from './MoodConfig.js';
import { CONCEPT_PROPERTIES } from './properties.js';

// FIX: previously this file had no __dirname resolution at all, and its
// standalone execution block (runUpgrade(), below) wrote output via bare
// relative paths — './harvested_knowledge.js', './review_queue.json' —
// which resolve against the process's CURRENT WORKING DIRECTORY, not this
// file's own folder. Every sibling script (backfillMoodWeights.js,
// backfillPropertiesMoodWeights.js, autoExpandMoodConfig.js) correctly uses
// path.join(__dirname, ...) instead. If upgrade.js were ever run directly
// (as its own execution block is clearly meant to support) from anywhere
// other than js/parser/dictionary/ itself — e.g. the repo root, which is
// how every sibling script's own header comment documents its invocation
// (`node js/parser/dictionary/backfillMoodWeights.js` from the repo root)
// — it would silently write a stray harvested_knowledge.js/review_queue.json
// at the wrong location, invisible to dictionary.js's
// import('./dictionary/harvested_knowledge.js') and to every other script
// in this family that reads the real one from js/parser/dictionary/.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HARVESTED_OUTPUT_PATH = path.join(__dirname, 'harvested_knowledge.js');
const REVIEW_QUEUE_PATH = path.join(__dirname, 'review_queue.json');

/**
 * Calculates a mood vector based on genre, theme, and source weights.
 */
export function calculateMood(concept) {
    let scores = {};

    // FIX: this helper used to be named `process`, shadowing Node's global
    // `process` object (process.env, process.argv, etc.) for the rest of
    // this function's scope. Harmless today since nothing inside needed
    // the global, but a landmine for any future edit to this function that
    // does. Renamed to `accumulate` — same behavior, no shadowing.
    const accumulate = (items = [], map, mult) => {
        items.forEach(item => {
            const moodMap = map[item.name];
            if (!moodMap) return;

            const weight = Number(item.weight);
            if (!Number.isFinite(weight)) {
                // Missing/invalid weight used to silently produce NaN here,
                // which JSON.stringify writes out as `null` -- a "successful"
                // run that quietly corrupts moodWeights with no error, no
                // warning, nothing in the logs. Skip the item instead and
                // say so, so a bad concept shows up as a console warning,
                // not as null values discovered later in production.
                console.warn(`[calculateMood] Skipping "${item.name}" — missing/invalid weight (got: ${item.weight})`);
                return;
            }

            for (let [m, v] of Object.entries(moodMap)) {
                scores[m] = (scores[m] || 0) + (v * weight * mult);
            }
        });
    };

    accumulate(concept.genres || [], GENRE_WEIGHTS, SOURCE_MULTIPLIERS.Genre);
    accumulate(concept.themes || [], THEME_WEIGHTS, SOURCE_MULTIPLIERS.Theme);
    accumulate(concept.demographics || [], DEMOGRAPHIC_WEIGHTS, SOURCE_MULTIPLIERS.Demographic);

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
    fs.writeFileSync(HARVESTED_OUTPUT_PATH, harvestFile);
    fs.writeFileSync(REVIEW_QUEUE_PATH, JSON.stringify(reviewQueue, null, 4));

    console.log(`Upgrade complete. Harvested knowledge written to ${HARVESTED_OUTPUT_PATH}`);
    console.log(`Review queue written to ${REVIEW_QUEUE_PATH}`);
}
