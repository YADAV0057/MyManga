#!/usr/bin/env node
/**
 * job3Phrases.cjs — Job 3 (phrase generation), standalone entry point.
 *
 * Runs as its own GitHub Actions job, in true parallel with job2Tags.cjs —
 * separate runner, separate keys (JOB3_GEMINI_KEYS etc.), so it never
 * competes with Job 2 for quota.
 *
 * Item universe (per Section 19.2 of the plan): Job 2's taxonomy input
 * file, PLUS Job 1's genre names pulled live from genreEmotionMoodWeights.js
 * — no separate phrase corpus/taxonomy file needed.
 *
 * Usage: node job3Phrases.cjs <taxonomy_path>
 */

const path = require('path');
const { buildLanes } = require('./lanes.cjs');
const { runJob, loadJSON } = require('./jobRunner.cjs');

let GENRE_NAMES;
try {
  GENRE_NAMES = Object.keys(require('./genreEmotionMoodWeights.js').GENRE_EMOTION_WEIGHTS);
} catch (err) {
  console.log(`[Job 3] Could not require('./genreEmotionMoodWeights.js') (${err.message}) — using built-in fallback genre list.`);
  GENRE_NAMES = [
    'Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 'Fantasy',
    'Historical Fiction', 'Horror', 'Mystery', 'Psychological',
    'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
  ];
}

const [, , taxonomyPathArg] = process.argv;
if (!taxonomyPathArg) {
  console.error('Usage: node job3Phrases.cjs <taxonomy_path>');
  process.exit(1);
}

const OUT_PATH = path.join(__dirname, 'phrases.json');
const REVIEW_PATH = path.join(__dirname, 'review_queue.json');

function buildPrompt(items) {
  return `For EACH of the following manga genres/tags/themes, generate 4-6 natural, ` +
    `varied phrases a reader would actually type into a search box when looking for ` +
    `manga with that trait — real search language, not just the trait name restated.\n\n` +
    `For each phrase also give:\n` +
    `  - "intensity": 1-100 — how strongly/directly the phrase signals the trait\n` +
    `  - "similarPhrases": 2-4 other ways to say roughly the same thing. Meaning-based ` +
    `only — NOT sound-alike/phonetic matches, NOT typo variants.\n\n` +
    `Return ONLY JSON, shape: {"items": [{"name": "<exact item name>", "phrases": ` +
    `[{"phrase": "<text>", "intensity": <1-100>, "similarPhrases": ["...", ...]}, ...]}]}\n\n` +
    `Items:\n${items.map((i) => `- ${i.name} (${i.type})`).join('\n')}`;
}

function validateEntry(entry) {
  if (!entry || typeof entry.name !== 'string' || !Array.isArray(entry.phrases) || entry.phrases.length === 0) return false;
  return entry.phrases.every((p) => p && typeof p.phrase === 'string' && p.phrase.trim()
    && typeof p.intensity === 'number' && p.intensity >= 1 && p.intensity <= 100
    && Array.isArray(p.similarPhrases) && p.similarPhrases.every((s) => typeof s === 'string'));
}

async function main() {
  const taxonomy = loadJSON(taxonomyPathArg, []);
  if (!taxonomy.length) {
    console.error(`No items found at ${taxonomyPathArg}`);
    process.exit(1);
  }

  const genreItems = GENRE_NAMES.map((name) => ({ name, type: 'genre' }));
  const seenNames = new Set(genreItems.map((i) => i.name));
  const phraseItems = [...genreItems, ...taxonomy.filter((i) => !seenNames.has(i.name))];

  const lanes = buildLanes('JOB3');
  await runJob({
    jobName: 'Job 3 (phrases)',
    items: phraseItems,
    outputPath: OUT_PATH,
    reviewPath: REVIEW_PATH,
    maxOutTokens: 32768,
    buildPrompt,
    validateEntry,
    lanes,
  });
  console.log('\n[Job 3] Done. Run finalizeQuality.js once Job 2 also finishes.');
}

main().catch((err) => { console.error('[Job 3] Fatal:', err); process.exit(1); });
