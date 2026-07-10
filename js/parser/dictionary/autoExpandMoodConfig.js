
// js/parser/dictionary/autoExpandMoodConfig.js
//
// AUTOMATES what checkMoodConfigCoverage.js could only diagnose: for every
// genre/theme/demographic name that's missing from MoodConfig.js's
// GENRE_WEIGHTS/THEME_WEIGHTS/DEMOGRAPHIC_WEIGHTS tables, this INFERS a mood
// vector for it automatically — no hand-typing — and writes it straight into
// MoodConfig.js at the // AUTO-EXPAND markers those tables already have.
//
// METHOD (no network calls, no LLM — pure local co-occurrence inference,
// same family of technique weightCalculator.js/entityRelations.js already
// use elsewhere in this codebase):
//   For missing name X, look at every concept (properties.js +
//   harvested_knowledge.js) that actually carries X. On each of those
//   concepts, look at X's siblings — the OTHER genres/themes/demographics on
//   that same concept that ALREADY have a mood vector in MoodConfig.js.
//   Each sibling "votes" its own mood vector into X's estimate, weighted by:
//     (X's own weight on that concept) * (sibling's own weight on that
//     concept) * SOURCE_MULTIPLIERS[sibling's field]
//   Summed across every concept/sibling pair, then normalized so the
//   strongest atom = 1 (same normalization calculateMood() already uses),
//   then trimmed to the top few atoms so entries stay comparable in shape to
//   the hand-typed ones already in this file (e.g. "Action": { exciting:
//   1.0, violent: 0.8 } — 2 atoms, not all 15).
//
// A name that ONLY ever co-occurs with OTHER missing names has nothing to
// infer from (no known signal to vote). Those are left alone and reported
// separately — genuinely need a human's first hand-typed entry, same as the
// very first pass in this file did for everything.
//
// Every inferred entry is commented with how many concepts and how many
// known co-occurring signals it was built from, so a low-confidence guess
// (e.g. 1 concept, 1 signal) is visibly distinguishable from a well-supported
// one (dozens of concepts) during review — this is a best-estimate table,
// same caveat MoodConfig.js's own header already states for the hand-typed
// entries.
//
// Run this, then rerun backfillPropertiesMoodWeights.js and
// backfillMoodWeights.js to actually propagate the new coverage into
// properties.js/harvested_knowledge.js's moodWeights. (The GitHub Actions
// workflow for this script runs all three in sequence automatically.)
//
//   node js/parser/dictionary/autoExpandMoodConfig.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONCEPT_PROPERTIES } from './properties.js';
import { GENRE_WEIGHTS, THEME_WEIGHTS, DEMOGRAPHIC_WEIGHTS, SOURCE_MULTIPLIERS } from './MoodConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MOODCONFIG_PATH = path.join(__dirname, 'MoodConfig.js');
const BACKUP_PATH = path.join(__dirname, `MoodConfig.pre-autoexpand.${Date.now()}.js.bak`);

// Every atom an inferred vector keeps must clear this normalized floor —
// mirrors weightCalculator.js's LIFT_FLOOR idea: below this, it's noise, not
// signal, and would just clutter the entry.
const ATOM_FLOOR = 0.2;
// Cap so an inferred entry stays the same rough shape as the hand-typed
// ones (2-5 atoms), not a diffuse 15-atom vector nothing else in the file has.
const MAX_ATOMS = 5;
// Concepts backing an inferred entry below this count get flagged as
// low-confidence in the comment, not skipped — still better than nothing,
// just worth a human glance.
const LOW_CONFIDENCE_CONCEPT_COUNT = 3;

async function loadHarvested() {
    try {
        const mod = await import('./harvested_knowledge.js');
        return mod.HARVESTED_RULES || {};
    } catch (e) {
        console.warn('[Skip] harvested_knowledge.js not found, using properties.js only.');
        return {};
    }
}

const FIELDS = [
    { key: 'genres', table: GENRE_WEIGHTS, multiplier: SOURCE_MULTIPLIERS.Genre, marker: 'GENRE' },
    { key: 'themes', table: THEME_WEIGHTS, multiplier: SOURCE_MULTIPLIERS.Theme, marker: 'THEME' },
    { key: 'demographics', table: DEMOGRAPHIC_WEIGHTS, multiplier: SOURCE_MULTIPLIERS.Demographic, marker: 'DEMOGRAPHIC' }
];

/** Every {name, weight} item across genres+themes+demographics for one concept, tagged with which field/table it came from. */
function allTaggedItems(concept) {
    const items = [];
    FIELDS.forEach(f => {
        (concept[f.key] || []).forEach(item => items.push({ ...item, field: f }));
    });
    return items;
}

/** Finds every missing name in `field`, with how many concepts use it (same tally checkMoodConfigCoverage.js does). */
function findMissing(allConcepts, field) {
    const counts = {};
    Object.values(allConcepts).forEach(concept => {
        (concept[field.key] || []).forEach(item => {
            if (!field.table[item.name]) {
                counts[item.name] = (counts[item.name] || 0) + 1;
            }
        });
    });
    return counts;
}

/**
 * Infers a mood vector for `missingName` in `field` by pooling votes from
 * every ALREADY-KNOWN sibling item (any field) on every concept that
 * carries missingName. Returns { vector, conceptCount, signalCount } —
 * vector is {} (nothing to infer) if no known siblings were ever found.
 */
function inferVector(missingName, field, allConcepts) {
    const scores = {};
    let conceptCount = 0;
    let signalCount = 0;

    Object.values(allConcepts).forEach(concept => {
        const selfItem = (concept[field.key] || []).find(i => i.name === missingName);
        if (!selfItem) return;

        const siblings = allTaggedItems(concept).filter(i =>
            !(i.field === field && i.name === missingName) && i.field.table[i.name]
        );
        if (siblings.length === 0) return;

        conceptCount++;
        const xWeight = Number(selfItem.weight);
        const selfInfluence = Number.isFinite(xWeight) ? xWeight : 1; // untyped weight still counts as full presence, not zero

        siblings.forEach(sib => {
            const sibVector = sib.field.table[sib.name];
            const sibWeight = Number(sib.weight);
            const sibInfluence = Number.isFinite(sibWeight) ? sibWeight : 1;
            const influence = selfInfluence * sibInfluence * sib.field.multiplier;
            if (influence <= 0) return;

            signalCount++;
            Object.entries(sibVector).forEach(([atom, val]) => {
                scores[atom] = (scores[atom] || 0) + val * influence;
            });
        });
    });

    const max = Math.max(...Object.values(scores), 0);
    if (max <= 0) return { vector: {}, conceptCount, signalCount: 0 };

    const trimmed = Object.entries(scores)
        .map(([atom, val]) => [atom, parseFloat((val / max).toFixed(2))])
        .filter(([, val]) => val >= ATOM_FLOOR)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_ATOMS);

    return { vector: Object.fromEntries(trimmed), conceptCount, signalCount };
}

function formatEntry(name, vector, conceptCount, signalCount) {
    const atomStr = Object.entries(vector).map(([a, v]) => `${a}: ${v}`).join(', ');
    const confidenceNote = conceptCount < LOW_CONFIDENCE_CONCEPT_COUNT ? ' — LOW CONFIDENCE, review' : '';
    return `    "${name}": { ${atomStr} }, // AUTO: inferred from ${conceptCount} concept(s), ${signalCount} co-occurring signal(s)${confidenceNote}\n`;
}

async function run() {
    if (!fs.existsSync(MOODCONFIG_PATH)) {
        console.log('[Skip] No MoodConfig.js found at', MOODCONFIG_PATH);
        return;
    }

    const harvested = await loadHarvested();
    const allConcepts = { ...harvested, ...CONCEPT_PROPERTIES };
    const totalConcepts = Object.keys(allConcepts).length;
    console.log(`[AutoExpand] Scanning ${totalConcepts} concept(s) (properties.js + harvested_knowledge.js).`);

    fs.copyFileSync(MOODCONFIG_PATH, BACKUP_PATH);
    console.log('[Backup] Wrote', BACKUP_PATH);

    let fileText = fs.readFileSync(MOODCONFIG_PATH, 'utf8');

    let totalAdded = 0;
    const unresolved = {}; // field marker -> [names with zero inferable signal]

    FIELDS.forEach(field => {
        const missing = findMissing(allConcepts, field);
        const names = Object.keys(missing).sort((a, b) => missing[b] - missing[a]);

        let insertBlock = '';
        const noSignal = [];

        names.forEach(name => {
            const { vector, conceptCount, signalCount } = inferVector(name, field, allConcepts);
            if (Object.keys(vector).length === 0) {
                noSignal.push(name);
                return;
            }
            insertBlock += formatEntry(name, vector, conceptCount, signalCount);
            totalAdded++;
        });

        if (noSignal.length > 0) unresolved[field.marker] = noSignal;

        if (insertBlock) {
            const markerLine = `    // AUTO-EXPAND:${field.marker} — autoExpandMoodConfig.js inserts new ${field.marker.toLowerCase()} entries above this line. Don't remove this marker.`;
            if (!fileText.includes(markerLine)) {
                console.warn(`[AutoExpand] Could not find the ${field.marker} marker line in MoodConfig.js — skipping insertion for this field. (Did the marker comment get edited/removed?)`);
                return;
            }
            fileText = fileText.replace(markerLine, insertBlock + markerLine);
        }
    });

    fs.writeFileSync(MOODCONFIG_PATH, fileText);

    console.log(`[AutoExpand] Added ${totalAdded} new entrie(s) to MoodConfig.js.`);
    Object.entries(unresolved).forEach(([marker, names]) => {
        if (names.length === 0) return;
        console.log(`[AutoExpand] ${names.length} ${marker.toLowerCase()} name(s) had NO known co-occurring signal to infer from — needs a first hand-typed entry: ${names.slice(0, 20).join(', ')}` +
            (names.length > 20 ? `, +${names.length - 20} more` : ''));
    });
    console.log('[Done] Rerun backfillPropertiesMoodWeights.js and backfillMoodWeights.js to apply these to your concepts\' moodWeights.');
}

run().catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
});
