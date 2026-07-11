#!/usr/bin/env node
/**
 * job2Tags.cjs — Job 2 (tag/theme atom-scoring), standalone entry point.
 *
 * Runs as its own GitHub Actions job (see run-vector-jobs.yml), in true
 * parallel with job3Phrases.cjs — separate runner, separate keys
 * (JOB2_GEMINI_KEYS etc.), so it never competes with Job 3 for quota.
 *
 * Usage: node job2Tags.cjs <taxonomy_path>
 */

const path = require('path');
const { buildLanes } = require('./lanes.cjs');
const { runJob, loadJSON } = require('./jobRunner.cjs');

let ATOMS;
try {
  ATOMS = require('./atoms.js').ATOMS;
  if (!Array.isArray(ATOMS)) throw new Error('not an array');
} catch (err) {
  console.log(`[Job 2] Could not require('./atoms.js') (${err.message}) — using built-in fallback atom list.`);
  ATOMS = [
    'dark', 'emotional', 'exciting', 'funny', 'happy', 'hopeful', 'intense',
    'mysterious', 'nostalgic', 'relaxing', 'romantic', 'scary', 'tragic',
    'violent', 'wholesome', 'cognitive_load',
  ];
}

const [, , taxonomyPathArg] = process.argv;
if (!taxonomyPathArg) {
  console.error('Usage: node job2Tags.cjs <taxonomy_path>');
  process.exit(1);
}

const OUT_PATH = path.join(__dirname, 'tags.json');
const REVIEW_PATH = path.join(__dirname, 'review_queue.json');

function buildPrompt(items) {
  const atomList = ATOMS.join(', ');
  return `Score each of the following manga tags/themes on a 1-100 scale for ` +
    `EACH of these atoms: ${atomList}.\n\n` +
    `Return ONLY JSON, shape: {"items": [{"name": "<exact name>", "scores": {"<atom>": <1-100>, ...}}]}\n\n` +
    `Items to score:\n${items.map((i) => `- ${i.name} (${i.type})`).join('\n')}`;
}

function validateEntry(entry) {
  if (!entry || typeof entry.name !== 'string' || !entry.scores) return false;
  return ATOMS.every((atom) => {
    const v = entry.scores[atom];
    return typeof v === 'number' && v >= 1 && v <= 100;
  });
}

async function main() {
  const taxonomy = loadJSON(taxonomyPathArg, []);
  if (!taxonomy.length) {
    console.error(`No items found at ${taxonomyPathArg}`);
    process.exit(1);
  }

  const lanes = buildLanes('JOB2');
  await runJob({
    jobName: 'Job 2 (tags)',
    items: taxonomy,
    outputPath: OUT_PATH,
    reviewPath: REVIEW_PATH,
    maxOutTokens: 16384,
    buildPrompt,
    validateEntry,
    lanes,
  });
  console.log('\n[Job 2] Done. Run finalizeQuality.js once Job 3 also finishes.');
}

main().catch((err) => { console.error('[Job 2] Fatal:', err); process.exit(1); });
