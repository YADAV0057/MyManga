// clean_queue.js
//
// Turns a messy paste (prose + ```json fences + [ ] brackets + comma-separated
// quoted tags, possibly many tags on one line) into a clean queue.txt with
// exactly one tag per line, de-duplicated, no quotes, no punctuation noise.
//
// Usage:
//   node clean_queue.js <raw_input_file> [output_file]
//
// Examples:
//   node clean_queue.js raw_paste.txt queue.txt
//   node clean_queue.js raw_paste.txt          -> writes to queue.txt by default

import fs from 'fs';

const inputPath = process.argv[2];
const outputPath = process.argv[3] || 'queue.txt';

if (!inputPath) {
    console.error('Usage: node clean_queue.js <raw_input_file> [output_file]');
    process.exit(1);
}

if (!fs.existsSync(inputPath)) {
    console.error(`[Error] Input file not found: ${inputPath}`);
    process.exit(1);
}

const raw = fs.readFileSync(inputPath, 'utf8');

// 1. Pull out every double-quoted string in the file. This alone strips out
//    prose sentences (not quoted), ```json fences, and [ ] brackets, since
//    none of those are inside quotes.
const quoted = [...raw.matchAll(/"([^"]+)"/g)].map(m => m[1].trim());

// 2. Fallback: if the file has no quotes at all (e.g. it's already a plain
//    one-tag-per-line or comma-separated list), split on commas/newlines too.
let candidates = quoted;
if (candidates.length === 0) {
    candidates = raw
        .split(/[\n,]/)
        .map(t => t.trim())
        .filter(Boolean);
}

// 3. Filter out anything that isn't a plausible tag:
//    - too long (prose sentences, descriptions)
//    - too many words (real tags are 1-4 words)
//    - stray artifacts like ``` or [ or ]
const MAX_LEN = 50;
const MAX_WORDS = 6;

const cleaned = candidates
    .map(t => t.replace(/`/g, '').trim())
    .filter(t => t.length > 0 && t.length <= MAX_LEN)
    .filter(t => t.split(/\s+/).length <= MAX_WORDS)
    .filter(t => !/^[\[\]{}]+$/.test(t))       // reject bare brackets
    .filter(t => !/^json$/i.test(t));          // reject stray "json" fence label

// 4. De-duplicate case-insensitively, keep first-seen casing, preserve order.
const seen = new Set();
const deduped = [];
for (const tag of cleaned) {
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
        seen.add(key);
        deduped.push(tag);
    }
}

// 5. Write one tag per line.
fs.writeFileSync(outputPath, deduped.join('\n') + '\n');

console.log(`[Done] Extracted ${deduped.length} clean tag(s) from ${candidates.length} candidate(s).`);
console.log(`[Saved] Written to ${outputPath}`);

if (deduped.length < 10) {
    console.log('[Warning] Very few tags extracted — check the input format, or lower/raise MAX_LEN / MAX_WORDS in the script.');
}

