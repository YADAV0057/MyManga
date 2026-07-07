const fs = require('fs');
const HarvesterAPI = require('./HarvesterAPI');

const PATH = 'js/parser/dictionary/properties.js';

async function run() {
    // Read the current state of your dictionary
    let fileContent = fs.readFileSync(PATH, 'utf8');
    
    // Read your new requested tags
    const queue = fs.readFileSync('queue.txt', 'utf8').split('\n').filter(Boolean);
    
    // Process only if not a duplicate
    for (const tag of queue) {
        const cleanTag = tag.trim();
        
        // --- DUPLICATE CHECK GATEKEEPER ---
        // Checks if the key 'tagname: {' already exists in your file
        const regex = new RegExp(`${cleanTag}:\\s*\\{`);
        if (regex.test(fileContent)) {
            console.log(`[Skip] ${cleanTag} already exists. Skipping...`);
            continue;
        }
        // ----------------------------------

        console.log(`[Processing] New tag: ${cleanTag}`);
        const data = await HarvesterAPI.getNormalizedConcept(cleanTag);
        
        if (data) {
            const entry = `\n    ${data.id}: ${JSON.stringify(data, null, 4)},`;
            fileContent = fileContent.trim().replace(/};$/, '') + entry + '\n};';
            console.log(`[Success] Added ${cleanTag}`);
        }
    }
    fs.writeFileSync(PATH, fileContent);
}

run();
