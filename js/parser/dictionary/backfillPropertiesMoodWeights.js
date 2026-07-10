// js/parser/dictionary/backfillPropertiesMoodWeights.js
//
// PARITY FIX: properties.js's 250 hand-curated concepts have never had
// `moodWeights` computed for them. upgrade.js computes moodWeights from
// properties.js's concepts, but writes the result into harvested_knowledge.js 
// / review_queue.json — never back into properties.js itself. backfillMoodWeights.js 
// only touches harvested_knowledge.js. So properties.js concepts have always been
// silently invisible to mangaProfiles.js's computeMoodAtomProfile(), which skips
// any concept where `!concept.moodWeights` — meaning only the 2000+ harvested
// concepts have ever contributed to mood-vector (cosine similarity) scoring,
// which is 40% of a result's match score in recommendationScorer.js.
//
// This script closes that gap: same calculateMood() math already used for
// harvested_knowledge.js (from upgrade.js / MoodConfig.js's GENRE_WEIGHTS /
// THEME_WEIGHTS / DEMOGRAPHIC_WEIGHTS tables), run against properties.js's
// concepts, written back into properties.js itself.
//
// Safe to rerun any time properties.js concepts change or MoodConfig.js's
// weight tables are updated (same reasoning as backfillMoodWeights.js for
// the harvested side).
//
//   node js/parser/dictionary/backfillPropertiesMoodWeights.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONCEPT_PROPERTIES } from './properties.js';
import { calculateMood } from './upgrade.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROPERTIES_PATH = path.join(__dirname, 'properties.js');
const BACKUP_PATH = path.join(__dirname, `properties.pre-moodweights-backfill.${Date.now()}.js.bak`);

async function run() {
    if (!fs.existsSync(PROPERTIES_PATH)) {
        console.log('[Skip] No properties.js found at', PROPERTIES_PATH);
        return;
    }

    const keys = Object.keys(CONCEPT_PROPERTIES);
    if (keys.length === 0) {
        console.log('[Skip] properties.js has no concepts.');
        return;
    }

    // Backup first, same safety pattern as reweightProperties.js — this
    // script writes directly to properties.js (the hand-curated base),
    // which is normally never auto-written, so a rollback copy matters.
    fs.copyFileSync(PROPERTIES_PATH, BACKUP_PATH);
    console.log('[Backup] Wrote', BACKUP_PATH);

    let changed = 0;
    let stillEmpty = [];

    keys.forEach(key => {
        const concept = CONCEPT_PROPERTIES[key];
        const before = JSON.stringify(concept.moodWeights || {});
        concept.moodWeights = calculateMood(concept);
        const after = JSON.stringify(concept.moodWeights);
        if (before !== after) changed++;
        if (Object.keys(concept.moodWeights).length === 0) stillEmpty.push(key);
    });

    // properties.js is hand-typed/curated source, so preserve everything
    // else exactly as-is — only moodWeights is added/overwritten per concept.
    const fileBody = `export const CONCEPT_PROPERTIES = ${JSON.stringify(CONCEPT_PROPERTIES, null, 4)};\n`;
    fs.writeFileSync(PROPERTIES_PATH, fileBody);

    console.log(`[Backfill] Computed moodWeights for ${keys.length} properties.js concept(s), ${changed} changed.`);
    if (stillEmpty.length > 0) {
        console.log(`[Backfill] ${stillEmpty.length} concept(s) still have empty moodWeights — their genres/themes/demographics ` +
            `aren't in MoodConfig.js's tables: ${stillEmpty.slice(0, 20).join(', ')}` +
            (stillEmpty.length > 20 ? `, +${stillEmpty.length - 20} more` : ''));
    }
    console.log('[Done] properties.js now has moodWeights parity with harvested_knowledge.js.');
    console.log('       Diff the file against the backup before committing, same as reweightProperties.js.');
}

run().catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
});
