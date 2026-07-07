const fs = require('fs');
const path = require('path');
const HarvesterAPI = require('./HarvesterAPI');
const { calculateMood } = require('./upgrade'); // upgrade.js must export calculateMood (see note below)

// Resolve paths relative to THIS file's location, not the process cwd.
// This makes the script safe to run from repo root (as the Action does)
// or directly from inside js/parser/dictionary/ during local testing.
const PROPERTIES_PATH = path.join(__dirname, 'properties.js');
const QUEUE_PATH = path.join(__dirname, 'queue.txt');

async function run() {
    // 1. Read existing dictionary as a real object, not via regex-scraping the file text.
    delete require.cache[require.resolve(PROPERTIES_PATH)];
    const { CONCEPT_PROPERTIES } = require(PROPERTIES_PATH);

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

    // 3. Filter out duplicates from the queue (Gatekeeper)
    const uniqueToProcess = queue.filter(tag => {
        const key = tag.toLowerCase();
        if (CONCEPT_PROPERTIES[key]) {
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

    // 4. Process only unique tags
    let addedCount = 0;
    for (const tag of uniqueToProcess) {
        const key = tag.toLowerCase();
        console.log(`[Processing] ${tag}`);

        try {
            const data = await HarvesterAPI.getNormalizedConcept(tag);
            if (!data) {
                console.log(`[No Data] Skipping ${tag}, harvester returned nothing.`);
                continue;
            }

            // Ensure the concept has an id even if the API didn't set one.
            data.id = data.id || key;

            // Calculate mood vector based on the fetched genres/themes.
            data.moodWeights = calculateMood(data);

            CONCEPT_PROPERTIES[key] = data;
            addedCount++;
        } catch (err) {
            console.log(`[Error] Failed to process ${tag}: ${err.message}`);
        }
    }

    if (addedCount === 0) {
        console.log('[Done] No concepts were added, leaving properties.js untouched.');
        return;
    }

    // 5. Write the updated dictionary back to disk as a real JS module.
    const fileBody =
        `export const CONCEPT_PROPERTIES = ${JSON.stringify(CONCEPT_PROPERTIES, null, 4)};\n`;
    fs.writeFileSync(PROPERTIES_PATH, fileBody);
    console.log(`[Saved] Added ${addedCount} new concept(s) to properties.js`);

    // 6. Clear the queue now that everything in it has been handled.
    fs.writeFileSync(QUEUE_PATH, '');
    console.log('[Cleared] queue.txt reset.');
}

run().catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
});
