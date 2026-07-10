// js/parser/dictionary/checkMoodConfigCoverage.js
//
// Data-driven gap-finder: scans every concept in properties.js AND
// harvested_knowledge.js, collects every genre/theme/demographic NAME
// actually used across all ~2250+ concepts, and reports which of those
// names are missing from MoodConfig.js's GENRE_WEIGHTS/THEME_WEIGHTS/
// DEMOGRAPHIC_WEIGHTS tables.
//
// Why this matters: calculateMood() (upgrade.js) only produces a
// moodWeights entry for names present in these tables. A concept whose
// genres/themes are entirely missing from MoodConfig.js gets an EMPTY
// moodWeights — same failure mode as the properties.js parity bug, just
// per-name instead of per-file. This tells you exactly which names to add,
// ranked by how many concepts they'd affect, instead of guessing at manga
// tag taxonomy.
//
//   node js/parser/dictionary/checkMoodConfigCoverage.js

import { CONCEPT_PROPERTIES } from './properties.js';
import { GENRE_WEIGHTS, THEME_WEIGHTS, DEMOGRAPHIC_WEIGHTS } from './MoodConfig.js';

async function loadHarvested() {
    try {
        const mod = await import('./harvested_knowledge.js');
        return mod.HARVESTED_RULES || {};
    } catch (e) {
        console.warn('[Skip] harvested_knowledge.js not found, checking properties.js only.');
        return {};
    }
}

function tally(concepts, field, coverage, counts) {
    Object.values(concepts).forEach(concept => {
        (concept[field] || []).forEach(item => {
            const name = item.name;
            if (!coverage[name]) {
                counts[name] = (counts[name] || 0) + 1;
            }
        });
    });
}

async function run() {
    const harvested = await loadHarvested();
    const allConcepts = { ...harvested, ...CONCEPT_PROPERTIES };
    const totalConcepts = Object.keys(allConcepts).length;

    const missingGenres = {};
    const missingThemes = {};
    const missingDemographics = {};

    tally(allConcepts, 'genres', GENRE_WEIGHTS, missingGenres);
    tally(allConcepts, 'themes', THEME_WEIGHTS, missingThemes);
    tally(allConcepts, 'demographics', DEMOGRAPHIC_WEIGHTS, missingDemographics);

    const report = (title, missing) => {
        const sorted = Object.entries(missing).sort((a, b) => b[1] - a[1]);
        console.log(`\n=== Missing ${title} (${sorted.length} distinct names) ===`);
        if (sorted.length === 0) {
            console.log('  None — full coverage.');
            return;
        }
        sorted.forEach(([name, count]) => {
            console.log(`  ${String(count).padStart(4)}  concepts use "${name}"`);
        });
    };

    console.log(`Scanned ${totalConcepts} concept(s) (properties.js + harvested_knowledge.js).`);
    report('genre names', missingGenres);
    report('theme names', missingThemes);
    report('demographic names', missingDemographics);

    console.log(
        `\nAdd the highest-count names above to GENRE_WEIGHTS / THEME_WEIGHTS / ` +
        `DEMOGRAPHIC_WEIGHTS in MoodConfig.js, then rerun both backfill scripts ` +
        `(backfillMoodWeights.js for harvested_knowledge.js, ` +
        `backfillPropertiesMoodWeights.js for properties.js) to apply them.`
    );
}

run().catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
});

