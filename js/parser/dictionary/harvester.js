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
 * boosts / excludes / tone / intensity now come from HarvesterAPI's
 * textAnalysis (local AFINN-165 + manga-trope routing over the plot
 * synopsis/description — see lexicon.js / synopsisAnalyzer.js), not from
 * ANN/AniList/Jikan/Datamuse's tag data directly, since tags alone can't
 * tell you how intense or tonally positive/negative a concept is. If a
 * concept had no synopsis text to analyze, textAnalysis itself already
 * falls back to neutral/0.5/[] — buildEntry just passes that through.
 * moodWeights is appended at the end since recommendationScorer.js
 * actually reads it at runtime.
 */
function buildEntry(data) {
    const { demographics: genreDemos, rest: genres } = extractDemographics(data.genres);
    const { demographics: allDemos, rest: themes } = extractDemographics(data.themes, genreDemos);
    const demographics = [...allDemos, ...(data.demographics || [])]
        .filter((d, i, arr) => arr.findIndex(x => x.name === d.name) === i);

    const round = (arr) => arr.map(x => ({ name: x.name, weight: round2(x.weight) }));

    const analysis = data.textAnalysis || { tone: "neutral", intensity: 0.5, boosts: [], excludes: { genres: [], themes: [] } };

    return {
        id: data.id,
        aliases: data.aliases,
        genres: round(genres),
        themes: round(themes),
        demographics: round(demographics),
        boosts: analysis.boosts,
        excludes: analysis.excludes,
        tone: analysis.tone,
        intensity: analysis.intensity,
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

    // Also index every known concept's aliases, not just its id — otherwise
    // "vengeance" would sail through as "new" even though it's already
    // covered as an alias of the curated "revenge" concept, producing a
    // separate, possibly differently-weighted entry for the same idea.
    const aliasToId = {};
    Object.values(knownKeys).forEach(concept => {
        (concept.aliases || []).forEach(alias => {
            aliasToId[alias.toLowerCase()] = concept.id;
        });
    });

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
        if (aliasToId[key]) {
            console.log(`[Duplicate Skip] ${tag} is already an alias of "${aliasToId[key]}".`);
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
    //    no more review_queue.json / manual move step. Progress is
    //    checkpointed to disk after every batch (see below the inner loop).
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
                    const noSynopsis = (data.textAnalysis?.sampleSize || 0) === 0;
                    harvestedRules[key] = buildEntry(data);
                    publishedCount++;
                    if (confidence >= LOW_CONFIDENCE_WARNING && !noSynopsis) {
                        console.log(`[Published] ${tag} (Conf: ${confidence})`);
                    } else {
                        lowConfidenceCount++;
                        const reason = noSynopsis
                            ? 'no synopsis found — tone/intensity/boosts/excludes fell back to neutral defaults'
                            : `Conf: ${confidence}`;
                        console.log(`[Published, worth a look] ${tag} — ${reason}`);
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

        // Checkpoint after every batch (not just at the very end): persist
        // whatever's been published so far and shrink queue.txt to only the
        // still-unprocessed tags. On a big run (e.g. 1000 tags, ~1-2 hours),
        // this means a mid-run crash, timeout, or cancellation only loses
        // the current batch (≤ BATCH_SIZE tags), not everything done so
        // far — pairs with harvest.yml's `if: always()` commit step, which
        // commits whatever's on disk even if this process exits non-zero.
        //
        // Note: a tag that errored/returned no data still counts as
        // "processed" and drops out of queue.txt along with successful
        // ones — it won't auto-retry next run. Re-add it to queue.txt by
        // hand if you want it attempted again.
        if (publishedCount > 0) {
            const fileBody = `export const HARVESTED_RULES = ${JSON.stringify(harvestedRules, null, 4)};\n`;
            fs.writeFileSync(HARVESTED_PATH, fileBody);
        }
        const remaining = uniqueToProcess.slice((b + 1) * BATCH_SIZE);
        fs.writeFileSync(QUEUE_PATH, remaining.length > 0 ? remaining.join('\n') + '\n' : '');
        console.log(`[Checkpoint] After batch ${b + 1}/${totalBatches}: ${publishedCount} concept(s) saved, ${remaining.length} tag(s) left in queue.txt.`);

        // Longer breather between batches so we don't hammer Jikan/Datamuse.
        if (b < totalBatches - 1) {
            console.log(`[Cooldown] Waiting ${DELAY_BETWEEN_BATCHES_MS / 1000}s before next batch...`);
            await sleep(DELAY_BETWEEN_BATCHES_MS);
        }
    }

    if (publishedCount > 0) {
        console.log(`[Done] Harvest complete — ${publishedCount} concept(s) published to harvested_knowledge.js` +
            (lowConfidenceCount > 0 ? ` (${lowConfidenceCount} worth a manual look, not blocking).` : '.'));
    } else {
        console.log('[Done] No concepts were added.');
    }
}

run().catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
});
