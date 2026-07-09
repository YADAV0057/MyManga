// js/parser/dictionary/backfillMoodWeights.js
//
// Recomputes moodWeights for every entry ALREADY in harvested_knowledge.js,
// using the current MoodConfig.js tables. Zero network calls — genres,
// themes, and demographics are already stored for each concept, so this
// just re-runs the local calculateMood() math and rewrites the file.
//
// Run this any time MoodConfig.js's GENRE_WEIGHTS/THEME_WEIGHTS/
// DEMOGRAPHIC_WEIGHTS tables change (like this one just did — they went
// from 3 genres/2 themes to full coverage), so concepts harvested under the
// old, sparser table get their moodWeights refreshed without spending
// another multi-hour run against ANN/AniList/Jikan/Datamuse.
//
//   node js/parser/dictionary/backfillMoodWeights.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { calculateMood } from './upgrade.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HARVESTED_PATH = path.join(__dirname, 'harvested_knowledge.js');

async function run() {
    if (!fs.existsSync(HARVESTED_PATH)) {
        console.log('[Skip] No harvested_knowledge.js found.');
        return;
    }

    const mod = await import(`${HARVESTED_PATH}?update=${Date.now()}`);
    const rules = mod.HARVESTED_RULES || {};
    const keys = Object.keys(rules);

    if (keys.length === 0) {
        console.log('[Skip] harvested_knowledge.js has no concepts yet.');
        return;
    }

    let changed = 0;
    let stillEmpty = [];

    keys.forEach(key => {
        const concept = rules[key];
        const before = JSON.stringify(concept.moodWeights || {});
        concept.moodWeights = calculateMood(concept);
        const after = JSON.stringify(concept.moodWeights);
        if (before !== after) changed++;
        if (Object.keys(concept.moodWeights).length === 0) stillEmpty.push(key);
    });

    const fileBody = `export const HARVESTED_RULES = ${JSON.stringify(rules, null, 4)};\n`;
    fs.writeFileSync(HARVESTED_PATH, fileBody);

    console.log(`[Backfill] Recomputed moodWeights for ${keys.length} concept(s), ${changed} changed.`);
    if (stillEmpty.length > 0) {
        console.log(`[Backfill] ${stillEmpty.length} concept(s) still have empty moodWeights — their genres/themes/demographics ` +
            `aren't in MoodConfig.js's tables even after this update: ${stillEmpty.slice(0, 20).join(', ')}` +
            (stillEmpty.length > 20 ? `, +${stillEmpty.length - 20} more` : ''));
    }
}

run().catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
});

