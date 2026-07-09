// ==========================================
// PROPERTIES REWEIGHTER (js/parser/dictionary/reweightProperties.js)
// ==========================================
// One-off/rerunnable script that recomputes REAL genre/theme/demographic
// weights for every concept in properties.js using weightCalculator.js's
// co-occurrence lift method (genre_in/tag_in + lift vs baseline), instead of
// the hand-typed weights currently sitting in properties.js (e.g.
// revenge.genres[0].weight: 0.95 was typed by hand, not measured).
//
// Also doubles as a live test of weightCalculator.js: if computeConceptWeights()
// throws, returns no match, or produces numbers wildly different from the
// hand-typed originals for well-known concepts, that's a signal to go look
// at weightCalculator.js itself, not just the data.
//
// NOTE: this intentionally does NOT enforce one universal weight per tag
// name across all concepts. weightCalculator.js's own design (see its
// header) is that a tag's weight is concept-specific lift, not a fixed
// prior — "Action" can legitimately score differently for "revenge" than
// for "romance". If you actually want a single shared weight per tag
// regardless of concept, that's a different, simpler system (basically
// back to a WEIGHT_MAP) and this script isn't it — say so and I'll build
// that instead.
//
// WRITES DIRECTLY TO properties.js. This deviates from the convention noted
// in upgrade.js/harvester.js ("properties.js is the human-curated base,
// never auto-written") — done on explicit instruction. Safety net: a
// timestamped backup of the pre-run file is written first
// (properties.pre-reweight.<timestamp>.js.bak), and a full old-vs-new diff
// report is still written to properties.reweighted.json for review.
//
// Only genres/themes/demographics are ever touched. aliases/boosts/excludes/
// tone/intensity/id/metadata are copied through unchanged — weightCalculator.js
// has no way to compute those, so nothing here invents them.
//
// Concepts where AniList finds no genre/tag match at all are left completely
// unchanged (status: 'no_match' in the report) rather than guessed at.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONCEPT_PROPERTIES } from './properties.js';
import { computeConceptWeights } from './weightCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROPERTIES_PATH = path.join(__dirname, 'properties.js');
const REPORT_PATH = path.join(__dirname, 'properties.reweighted.json');
const BACKUP_PATH = path.join(__dirname, `properties.pre-reweight.${Date.now()}.js.bak`);

const DELAY_BETWEEN_CALLS_MS = 1500; // same politeness budget as harvester.js

// AniList doesn't expose "demographic" as its own queryable field —
// Shounen/Seinen/Shoujo/Josei/Kids show up as regular tags, so
// weightCalculator.js's `themes` output will have them mixed in with
// everything else. Pull them back out to match properties.js's existing
// {genres, themes, demographics} shape.
const DEMOGRAPHIC_TAGS = new Set(['Shounen', 'Shoujo', 'Seinen', 'Josei', 'Kids']);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Some existing properties.js keys carry an invisible zero-width space
// (U+200B) — a copy-paste artifact. Querying AniList with that character in
// the string returns zero matches, which looks identical to "this concept
// genuinely doesn't exist on AniList." Strip it only for the outgoing
// query; the source key/id in properties.js is left untouched here — key
// renaming for cyberpunk/necromancer was already handled separately, and
// the time_loop key collision is still unresolved.
const ZERO_WIDTH_RE = /[\u200B-\u200D\uFEFF]/g;
function cleanForQuery(id) {
    return id.replace(ZERO_WIDTH_RE, '');
}

function splitDemographics(themes) {
    const demographics = [];
    const rest = [];
    themes.forEach(t => (DEMOGRAPHIC_TAGS.has(t.name) ? demographics : rest).push(t));
    return { demographics, themes: rest };
}

/** Matches the 2-decimal-place style already used in properties.js's hand-typed weights. */
function round2(n) {
    return Math.round(n * 100) / 100;
}

async function run() {
    const keys = Object.keys(CONCEPT_PROPERTIES);
    const etaMinutes = Math.ceil((keys.length * DELAY_BETWEEN_CALLS_MS) / 60000);
    console.log(`[Reweight] ${keys.length} concept(s) found in properties.js. Estimated time: ~${etaMinutes}-${etaMinutes + 4} min (longer if many concepts need the tag_in fallback).`);

    // Backup the current file before touching anything.
    fs.copyFileSync(PROPERTIES_PATH, BACKUP_PATH);
    console.log(`[Backup] Wrote ${BACKUP_PATH}`);

    // Deep clone so we can mutate freely without touching the live import
    // until we're ready to serialize it back out.
    const updated = JSON.parse(JSON.stringify(CONCEPT_PROPERTIES));

    const report = {};
    let reweightedCount = 0;
    let noMatchCount = 0;
    let errorCount = 0;

    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const concept = CONCEPT_PROPERTIES[key];
        console.log(`[${i + 1}/${keys.length}] Reweighting "${key}"...`);

        try {
            // computeConceptWeights queries AniList by concept.id (falls back
            // to the object key if id is missing) — same identifier
            // HarvesterAPI/harvester.js use to look this concept up. Stripped
            // of zero-width characters that would otherwise silently zero
            // out the AniList match (see cleanForQuery above).
            const rawId = concept.id || key;
            const queryId = cleanForQuery(rawId);
            if (queryId !== rawId) {
                console.warn(`  [Data Quality] "${key}" has hidden character(s) in its id — querying as "${queryId}" instead. Key itself left as-is.`);
            }
            const computed = await computeConceptWeights(queryId);

            if (!computed.matchedVia) {
                noMatchCount++;
                console.warn(`  [No Match] AniList found no genre/tag for "${key}" — left completely unchanged.`);
                report[key] = {
                    status: 'no_match',
                    old: { genres: concept.genres, themes: concept.themes, demographics: concept.demographics }
                };
                // no mutation to `updated[key]` — stays exactly as it was
            } else {
                const { demographics: newDemographics, themes: newThemes } = splitDemographics(computed.themes);
                const newGenres = computed.genres.map(g => ({ name: g.name, weight: round2(g.weight) }));
                const roundedThemes = newThemes.map(t => ({ name: t.name, weight: round2(t.weight) }));
                const roundedDemographics = newDemographics.map(d => ({ name: d.name, weight: round2(d.weight) }));

                report[key] = {
                    status: 'reweighted',
                    matchedVia: computed.matchedVia,   // "genre" | "tag"
                    sampleSize: computed.sampleSize,
                    old: {
                        genres: concept.genres,
                        themes: concept.themes,
                        demographics: concept.demographics
                    },
                    new: {
                        genres: newGenres,
                        themes: roundedThemes,
                        demographics: roundedDemographics
                    }
                    // aliases / boosts / excludes / tone / intensity are untouched —
                    // weightCalculator.js has no way to compute those.
                };

                // Only genres/themes/demographics are overwritten. If the
                // original concept had no `demographics` field at all (5
                // concepts in the current file don't), only add one if we
                // actually found demographic signal — don't invent an empty
                // array where the field never existed before.
                updated[key].genres = newGenres;
                updated[key].themes = roundedThemes;
                if (roundedDemographics.length > 0 || 'demographics' in concept) {
                    updated[key].demographics = roundedDemographics;
                }

                reweightedCount++;
                console.log(`  [Done] via ${computed.matchedVia}, sample=${computed.sampleSize}, ` +
                    `${newGenres.length} genre(s), ${roundedThemes.length} theme(s), ${roundedDemographics.length} demographic(s).`);
            }
        } catch (err) {
            errorCount++;
            console.error(`  [Error] "${key}": ${err.message}`);
            report[key] = { status: 'error', error: err.message };
            // no mutation to `updated[key]` — stays exactly as it was
        }

        // Be polite to AniList between concepts, skip after the last one.
        if (i < keys.length - 1) await sleep(DELAY_BETWEEN_CALLS_MS);
    }

    // Write the diff report first — if the properties.js write below fails
    // for any reason, you still have the full old-vs-new record.
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 4));
    console.log(`\n[Saved] ${REPORT_PATH}`);

    const fileBody = `export const CONCEPT_PROPERTIES = ${JSON.stringify(updated, null, 4)};\n`;
    fs.writeFileSync(PROPERTIES_PATH, fileBody);
    console.log(`[Saved] ${PROPERTIES_PATH} updated in place.`);

    console.log(`\n[Summary] ${keys.length} total — ${reweightedCount} reweighted, ${noMatchCount} no-match (unchanged), ${errorCount} error(s) (unchanged).`);
    console.log(`[Rollback] If anything looks wrong: cp "${BACKUP_PATH}" "${PROPERTIES_PATH}"`);
}

run().catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
});
