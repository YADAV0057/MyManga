// finalizeQuality.js — run this once runOvernight.cjs is done (or you've
// woken up and want a checkpoint). Samples tags.json and phrases.json,
// independently re-checks the sample via Cerebras, and writes the
// permanent file:
//
//   final.json — { tags: [...], phrases: [...] }, quality-checked.
//   review_queue.json — APPENDED to (not overwritten) with anything the
//                        judge disagreed with, alongside whatever
//                        runOvernight.cjs already flagged.
//
// Safe to run more than once, and safe to run before every item is
// scored/generated — it only judges what's already in tags.json/
// phrases.json at the time you run it, and anything not yet present just
// isn't in final.json yet either. Re-run it again later to top it up.
//
//   CEREBRAS_KEYS=key1,key2 node finalizeQuality.js [sampleRate]
//   sampleRate defaults to 0.15.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ATOMS } from './atoms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TAGS_PATH = path.join(__dirname, 'tags.json');
const PHRASES_PATH = path.join(__dirname, 'phrases.json');
const FINAL_PATH = path.join(__dirname, 'final.json');
const REVIEW_PATH = path.join(__dirname, 'review_queue.json');

const SAMPLE_RATE = parseFloat(process.argv[2]) || 0.15;
const DISAGREEMENT_THRESHOLD = 20;
const MODEL = process.env.CEREBRAS_MODEL || 'gpt-oss-120b';
const KEYS = (process.env.CEREBRAS_KEYS || process.env.CEREBRAS_API_KEY || '')
  .split(',').map((k) => k.trim()).filter(Boolean);
const BATCH_SIZE = 20;
const RETRY_LIMIT = 3;

if (KEYS.length === 0) {
  console.error('[Fatal] No CEREBRAS_KEYS / CEREBRAS_API_KEY set.');
  process.exit(1);
}
let keyCursor = 0;
function nextKey() { const k = KEYS[keyCursor % KEYS.length]; keyCursor += 1; return k; }

function loadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function saveJSON(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2)); }
function chunk(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; }
function sample(arr, rate) { const s = [...arr].sort(() => Math.random() - 0.5); return s.slice(0, Math.max(1, Math.round(arr.length * rate))); }

async function callCerebras(prompt) {
  const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${nextKey()}` },
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.2, response_format: { type: 'json_object' } }),
  });
  if (!res.ok) { const t = await res.text().catch(() => ''); throw new Error(`Cerebras ${res.status}: ${t.slice(0, 500)}`); }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty Cerebras response');
  return JSON.parse(text);
}

async function callWithRetry(prompt, attempt = 1) {
  try { return await callCerebras(prompt); }
  catch (err) {
    if (attempt >= RETRY_LIMIT) throw err;
    console.warn(`[Retry ${attempt}/${RETRY_LIMIT}] ${err.message}`);
    await new Promise((r) => setTimeout(r, 1000 * attempt));
    return callWithRetry(prompt, attempt + 1);
  }
}

// ---- Tags QC: re-score the sample's atom values, diff vs. worker --------

function buildTagJudgePrompt(items) {
  return `You are independently QC-scoring manga tags/themes against a fixed set of ` +
    `"mood atoms," as a check on a prior scoring pass you cannot see. Score fresh.\n\n` +
    `Atoms: ${ATOMS.join(', ')}\n\n` +
    `Items:\n${items.map((it, i) => `${i + 1}. "${it.name}" (${it.type})`).join('\n')}\n\n` +
    `Respond with ONLY {"items": [{"name": "<exact name>", "scores": {${ATOMS.map((a) => `"${a}": <1-100>`).join(', ')}}}, ...]}, same order.`;
}

async function judgeTagsSample(tagsData) {
  const sampled = sample(tagsData, SAMPLE_RATE);
  const sampledNames = new Set(sampled.map((s) => s.name));
  console.log(`[Tags QC] ${tagsData.length} scored, sampling ${sampled.length} (${Math.round(SAMPLE_RATE * 100)}%)...`);

  const judged = new Map();
  for (const batch of chunk(sampled, BATCH_SIZE)) {
    try {
      const parsed = await callWithRetry(buildTagJudgePrompt(batch));
      const list = parsed.items || [];
      list.forEach((entry) => {
        if (entry && typeof entry.name === 'string' && entry.scores) judged.set(entry.name, entry.scores);
      });
    } catch (err) {
      console.warn(`[Tags QC batch failed] ${err.message} — leaving that batch's worker scores as-is, unflagged.`);
    }
  }

  const flagged = new Set();
  const reviewEntries = [];
  sampledNames.forEach((name) => {
    const judgeScores = judged.get(name);
    if (!judgeScores) return;
    const item = tagsData.find((t) => t.name === name);
    const diffs = {};
    ATOMS.forEach((atom) => {
      const d = Math.abs((item.scores[atom] ?? 0) - (judgeScores[atom] ?? 0));
      if (d > DISAGREEMENT_THRESHOLD) diffs[atom] = { worker: item.scores[atom], judge: judgeScores[atom], diff: d };
    });
    if (Object.keys(diffs).length > 0) {
      flagged.add(name);
      reviewEntries.push({ job: 'Job 2 (tags) — judge QC', name, type: item.type, workerScores: item.scores, judgeScores, disagreements: diffs });
    }
  });

  return { passing: tagsData.filter((t) => !flagged.has(t.name)), reviewEntries };
}

// ---- Phrases QC: resolves check + intensity re-score, per phrase --------

function buildPhraseJudgePrompt(pairs) {
  return `You are independently QC-checking machine-generated manga search phrases against ` +
    `the trait each was generated for. Judge fresh — you cannot see the original reasoning.\n\n` +
    `For EACH pair, judge:\n` +
    `  - "resolves": true/false — would a reader typing this phrase plausibly be searching ` +
    `for manga with that trait? false only if genuinely off-topic.\n` +
    `  - "intensity": your own 1-100 score for how strongly the phrase signals the trait.\n\n` +
    `Pairs:\n${pairs.map((p, i) => `${i + 1}. trait: "${p.itemName}" | phrase: "${p.phrase}"`).join('\n')}\n\n` +
    `Respond with ONLY {"items": [{"itemName": "<exact trait>", "phrase": "<exact phrase>", "resolves": <bool>, "intensity": <1-100>}, ...]}, same order.`;
}

function flattenPhrasePairs(phrasesData) {
  const pairs = [];
  phrasesData.forEach((item) => (item.phrases || []).forEach((p, idx) => {
    pairs.push({ itemName: item.name, itemType: item.type, phraseIndex: idx, phrase: p.phrase, workerIntensity: p.intensity });
  }));
  return pairs;
}

async function judgePhrasesSample(phrasesData) {
  const allPairs = flattenPhrasePairs(phrasesData);
  const sampled = sample(allPairs, SAMPLE_RATE);
  console.log(`[Phrases QC] ${allPairs.length} phrase(s) across ${phrasesData.length} item(s), sampling ${sampled.length} (${Math.round(SAMPLE_RATE * 100)}%)...`);

  const judged = new Map(); // key: itemName::phrase
  for (const batch of chunk(sampled, BATCH_SIZE)) {
    try {
      const parsed = await callWithRetry(buildPhraseJudgePrompt(batch));
      const list = parsed.items || [];
      list.forEach((entry) => {
        if (entry && typeof entry.itemName === 'string' && typeof entry.phrase === 'string') {
          judged.set(`${entry.itemName}::${entry.phrase}`, entry);
        }
      });
    } catch (err) {
      console.warn(`[Phrases QC batch failed] ${err.message} — leaving that batch's worker phrases as-is, unflagged.`);
    }
  }

  const flaggedKeys = new Set(); // itemName::phraseIndex
  const reviewEntries = [];
  sampled.forEach((p) => {
    const j = judged.get(`${p.itemName}::${p.phrase}`);
    if (!j) return;
    const diff = Math.abs(p.workerIntensity - j.intensity);
    const failsResolution = j.resolves === false;
    const failsIntensity = diff > DISAGREEMENT_THRESHOLD;
    if (failsResolution || failsIntensity) {
      flaggedKeys.add(`${p.itemName}::${p.phraseIndex}`);
      reviewEntries.push({
        job: 'Job 3 (phrases) — judge QC',
        itemName: p.itemName, itemType: p.itemType, phrase: p.phrase,
        workerIntensity: p.workerIntensity, judgeIntensity: j.intensity, intensityDiff: diff,
        judgeSaysResolves: j.resolves,
        reason: failsResolution ? 'judge says phrase does not resolve to this trait' : `intensity disagreement > ${DISAGREEMENT_THRESHOLD}`,
      });
    }
  });

  const passing = phrasesData
    .map((item) => ({ resolvedTo: item.name, type: item.type, phrases: item.phrases.filter((_, idx) => !flaggedKeys.has(`${item.name}::${idx}`)) }))
    .filter((item) => item.phrases.length > 0);

  return { passing, reviewEntries };
}

// ---- Main ------------------------------------------------------------------

async function run() {
  const tagsData = loadJSON(TAGS_PATH, []);
  const phrasesData = loadJSON(PHRASES_PATH, []);

  if (tagsData.length === 0 && phrasesData.length === 0) {
    console.log('[Nothing to do] tags.json and phrases.json are both empty — has runOvernight.cjs produced anything yet?');
    return;
  }

  const tagsResult = tagsData.length ? await judgeTagsSample(tagsData) : { passing: [], reviewEntries: [] };
  const phrasesResult = phrasesData.length ? await judgePhrasesSample(phrasesData) : { passing: [], reviewEntries: [] };

  const final = { tags: tagsResult.passing, phrases: phrasesResult.passing, generatedAt: new Date().toISOString() };
  saveJSON(FINAL_PATH, final);

  const existingReview = loadJSON(REVIEW_PATH, []);
  const newReviewEntries = [...tagsResult.reviewEntries, ...phrasesResult.reviewEntries].map((e) => ({ ...e, flaggedAt: new Date().toISOString() }));
  saveJSON(REVIEW_PATH, [...existingReview, ...newReviewEntries]);

  console.log(`\n[Done] final.json: ${tagsResult.passing.length} tag(s), ${phrasesResult.passing.length} item(s)-worth of phrases.`);
  console.log(`[Done] review_queue.json: +${newReviewEntries.length} newly flagged (${existingReview.length} carried over from the overnight run).`);
}

run().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});

