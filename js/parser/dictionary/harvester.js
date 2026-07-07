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
const REVIEW_QUEUE_PATH = path.join(__dirname, 'review_queue.json');
// queue.txt is at the root of the repo (3 folders up from js/parser/dictionary)
const QUEUE_PATH = path.join(__dirname, '../../../queue.txt');

const CONFIDENCE_THRESHOLD = 0.75;

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

function loadReviewQueue() {
    try {
        return JSON.parse(fs.readFileSync(REVIEW_QUEUE_PATH, 'utf8'));
    } catch (e) {
        return [];
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

    // 4. Process only unique tags, then gate by confidence instead of
    //    writing straight to properties.js.
    const reviewQueue = loadReviewQueue();
    let autoPublishedCount = 0;
    let queuedForReviewCount = 0;

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
                    if (confidence >= CONFIDENCE_THRESHOLD) {
                        harvestedRules[key] = data;
                        autoPublishedCount++;
                        console.log(`[Auto-Published] ${tag} (Conf: ${confidence})`);
                    } else {
                        reviewQueue.push(data);
                        queuedForReviewCount++;
                        console.log(`[Queued for Review] ${tag} (Conf: ${confidence})`);
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
    if (autoPublishedCount > 0) {
        const fileBody = `export const HARVESTED_RULES = ${JSON.stringify(harvestedRules, null, 4)};\n`;
        fs.writeFileSync(HARVESTED_PATH, fileBody);
        console.log(`[Saved] Added ${autoPublishedCount} new concept(s) to harvested_knowledge.js`);
    }

    if (queuedForReviewCount > 0) {
        fs.writeFileSync(REVIEW_QUEUE_PATH, JSON.stringify(reviewQueue, null, 4));
        console.log(`[Saved] Added ${queuedForReviewCount} concept(s) to review_queue.json`);
    }

    if (autoPublishedCount === 0 && queuedForReviewCount === 0) {
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
