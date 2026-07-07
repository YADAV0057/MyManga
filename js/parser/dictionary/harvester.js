const fs = require('fs');  
const HarvesterAPI = require('./HarvesterAPI');
const path = 'js/parser/dictionary/properties.js';

async function run() {
    // 1. Read existing dictionary
    const fileContent = fs.readFileSync(path, 'utf8');
    
    // Extract existing keys using a Regex that finds words followed by ": {"
    // This assumes your structure is "key: {"
    const existingKeys = new Set(
        [...fileContent.matchAll(/(\w+):\s*\{/g)].map(m => m[1])
    );

    // 2. Read requested queue
    const queue = fs.readFileSync('queue.txt', 'utf8').split('\n').filter(Boolean);
    
    // 3. Filter out duplicates from the queue
    const uniqueToProcess = queue.filter(tag => {
        const cleanTag = tag.trim();
        if (existingKeys.has(cleanTag)) {
            console.log(`[Duplicate Skip] ${cleanTag} already exists.`);
            return false;
        }
        return true;
    });

    // 4. Process only unique tags
    for (const tag of uniqueToProcess) {
        const cleanTag = tag.trim();
        console.log(`[Processing] ${cleanTag}`);
        
        const data = await HarvesterAPI.getNormalizedConcept(cleanTag);
        if (data) {
            // Append logic...
            // ... (your existing append code here)
        }
    }
}

run();
