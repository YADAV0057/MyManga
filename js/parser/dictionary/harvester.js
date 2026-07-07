const fs = require('fs');
const HarvesterAPI = require('./HarvesterAPI');

const PATH = 'js/parser/dictionary/properties.js';

async function run() {
    const queue = fs.readFileSync('queue.txt', 'utf8').split('\n').filter(Boolean);
    let fileContent = fs.readFileSync(PATH, 'utf8');

    for (const tag of queue) {
        const cleanTag = tag.trim();
        if (fileContent.includes(`${cleanTag}: {`)) {
            console.log(`[Skip] ${cleanTag} already in properties.js`);
            continue;
        }

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
