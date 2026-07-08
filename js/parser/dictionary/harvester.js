import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import your modules using ESM syntax
import { HarvesterAPI } from './HarvesterAPI.js';
import { calculateMood } from './upgrade.js';
import { CONCEPT_PROPERTIES } from './properties.js';

// Reconstruct __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve paths correctly
const HARVESTED_PATH = path.join(__dirname, 'harvested_knowledge.js');
// queue.txt is at the root of the repo (3 folders up from js/parser/dictionary)
const QUEUE_PATH = path.join(__dirname, '../../../queue.txt');

// Below this confidence, a tag still gets written straight to
// harvested_knowledge.js (no more review_queue.json / manual move step) —
// it's just flagged in the console output as worth a human glance.
const LOW_CONFIDENCE_WARNING = 0.75;

// AniList/ANN don't expose "demographic" as its own filterable field, so
// Shounen/Shoujo/Seinen/Josei/Kids can come back mixed into genres/themes.
// Jikan gives us demographics directly (see HarvesterAPI.fetchFromJikan), but
// this catches the rest as a fallback. Same set reweightProperties.js uses.
const DEMOGRAPHIC_TAGS = new Set(['Shounen', 'Shoujo', 'Seinen', 'Josei', 'Kids']);

/** Matches the 2-decimal-place style used elsewhere (properties.js, reweightProperties.js). */
function round2(n) {
    return Math.round(n * 100) / 100;
}

/** Pulls any stray demographic tags out of genres/themes and merges them with `existing`. */
function extractDemographics(list, existing = []) {
    const demographics = new Map(existing.map(d => [d.name, d]));
    const rest = [];
    (list || []).forEach(item => {
        if (DEMOGRAPHIC_TAGS.has(item.name)) {
            if (!demographics.has(item.name)) demographics.set(item.name, item);
        } else {
            rest.push(item);
        }
    });
    return { demographics: Array.from(demographics.values()), rest };
}

/**
 * Builds the final harvested_knowledge.js entry in the same shape as the
 * hand-curated entries in properties.js (id, aliases, genres, themes,
 * demographics, boosts, excludes, tone, intensity).
 *
 * IMPORTANT: boosts / excludes / tone / intensity are NOT derivable from
 * ANN/AniList/Jikan/Datamuse data — nothing in this codebase computes them
 * automatically (see reweightProperties.js's header, which explicitly
 * declines to invent them). Rather than fake plausible-looking values,
 * this fills them with neutral, inert placeholders ([], {genres:[],
 * themes:[]}, "neutral", 0.5) that are safe defaults and won't skew
 * scoring, and leaves them for you to hand-tune later if a concept
 * deserves them. moodWeights is appended at the end since
 * recommendationScorer.js actually reads it at runtime.
 */
function buildEntry(data) {
    const { demographics: genreDemos, rest: genres } = extractDemographics(data.genres);
    const { demographics: allDemos, rest: themes } = extractDemographics(data.themes, genreDemos);
    const demographics = [...allDemos, ...(data.demographics || [])]
        .filter((d, i, arr) => arr.findIndex(x => x.name === d.name) === i);

    const round = (arr) => arr.map(x => ({ name: x.name, weight: round2(x.weight) }));

    return {
        id: data.id,
        aliases: data.aliases,
        genres: round(genres),
        themes: round(themes),
        demographics: round(demographics),
        boosts: [],
        excludes: { genres: [], themes: [] },
        tone: "neutral",
        intensity: 0.5,
        moodWeights: data.moodWeights
    };
}

// --- Rate-limit protection ---
// How many tags to process before taking a longer breather, and how long to
// pause between every single API call. Tune these if you still get 429s.
const BATCH_SIZE = 20;
const DELAY_BETWEEN_CALLS_MS = 1500;
const DELAY_BETWEEN_BATCHES_MS = 15000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Read the current harvested_knowledge.js so we can merge into it instead of
// clobbering everything that's already been auto-published.
async function loadHarvestedRules() {
    try {
        // Cache-bust so repeated runs in the same process pick up the latest file.
        const mod = await import(`${HARVESTED_PATH}?update=${Date.now()}`);
        return mod.HARVESTED_RULES || {};
    } catch (e) {
        console.warn('[System] No existing harvested_knowledge.js, starting fresh.');
        return {};
    }
}

async function run() {
    // 1. Build a lookup of everything that already exists (curated + harvested)
    //    so we don't re-fetch or overwrite known concepts.
    const harvestedRules = await loadHarvestedRules();
    const knownKeys = { ...CONCEPT_PROPERTIES, ...harvestedRules };

    // 2. Read requested queue
    if (!fs.existsSync(QUEUE_PATH)) {
        console.log(`[Skip] No queue.txt found at ${QUEUE_PATH}`);
        return;
    }

    const queue = fs.readFileSync(QUEUE_PATH, 'utf8')
        .split('\n')
        .map(t => t.trim())
        .filter(Boolean);

    if (queue.length === 0) {
        console.log('[Skip] Queue is empty, nothing to harvest.');
        return;
    }

    // 3. Filter out duplicates from the queue
    const uniqueToProcess = queue.filter(tag => {
        const key = tag.toLowerCase();
        if (knownKeys[key]) {
            console.log(`[Duplicate Skip] ${tag} already exists.`);
            return false;
        }
        return true;
    });

    if (uniqueToProcess.length === 0) {
        console.log('[Skip] Nothing new after de-duping. Clearing queue.');
        fs.writeFileSync(QUEUE_PATH, '');
        return;
    }

    // 4. Process only unique tags. Every tag that comes back with data gets
    //    written straight to harvested_knowledge.js, properly arranged —
    //    no more review_queue.json / manual move step.
    let publishedCount = 0;
    let lowConfidenceCount = 0;

    const totalBatches = Math.ceil(uniqueToProcess.length / BATCH_SIZE);

    for (let b = 0; b < totalBatches; b++) {
        const batch = uniqueToProcess.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
        console.log(`[Batch ${b + 1}/${totalBatches}] Processing ${batch.length} tag(s)...`);

        for (let i = 0; i < batch.length; i++) {
            const tag = batch[i];
            const key = tag.toLowerCase();
            console.log(`[Processing] ${tag}`);

            try {
                const data = await HarvesterAPI.getNormalizedConcept(tag);
                if (!data) {
                    console.log(`[No Data] Skipping ${tag}, harvester returned nothing.`);
                } else {
                    // Ensure the concept has an id even if the API didn't set one.
                    data.id = data.id || key;

                    // Calculate mood vector based on the fetched genres/themes.
                    data.moodWeights = calculateMood(data);

                    const confidence = data.metadata?.confidence || 0;
                    harvestedRules[key] = buildEntry(data);
                    publishedCount++;
                    if (confidence >= LOW_CONFIDENCE_WARNING) {
                        console.log(`[Published] ${tag} (Conf: ${confidence})`);
                    } else {
                        lowConfidenceCount++;
                        console.log(`[Published, low confidence] ${tag} (Conf: ${confidence}) — worth a manual spot-check.`);
                    }
                }
            } catch (err) {
                console.log(`[Error] Failed to process ${tag}: ${err.message}`);
            }

            // Small delay between individual calls, skip after the very last tag.
            const isLastTagOverall = (b === totalBatches - 1) && (i === batch.length - 1);
            if (!isLastTagOverall) {
                await sleep(DELAY_BETWEEN_CALLS_MS);
            }
        }

        // Longer breather between batches so we don't hammer Jikan/Datamuse.
        if (b < totalBatches - 1) {
            console.log(`[Cooldown] Waiting ${DELAY_BETWEEN_BATCHES_MS / 1000}s before next batch...`);
            await sleep(DELAY_BETWEEN_BATCHES_MS);
        }
    }

    // 5. Write results back out. properties.js (the human-curated base) is
    //    never touched by the harvester.
    if (publishedCount > 0) {
        const fileBody = `export const HARVESTED_RULES = ${JSON.stringify(harvestedRules, null, 4)};\n`;
        fs.writeFileSync(HARVESTED_PATH, fileBody);
        console.log(`[Saved] Added ${publishedCount} new concept(s) to harvested_knowledge.js` +
            (lowConfidenceCount > 0 ? ` (${lowConfidenceCount} low-confidence — worth a look, but not blocking).` : '.'));
    } else {
        console.log('[Done] No concepts were added.');
        return;
    }

    // 6. Clear the queue now that everything in it has been handled.
    fs.writeFileSync(QUEUE_PATH, '');
    console.log('[Cleared] queue.txt reset.');
}

run().catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
});
