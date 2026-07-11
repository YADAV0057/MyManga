// js/parser/dictionary/vectorEngine/scoreTagAtoms.worker.js
//
// Job 2 worker — multi-provider round robin (4 lanes).
//
// Rewritten after gemini-flash-latest silently drifted to a stricter
// free-tier model (resolved to gemini-3.5-flash, ~20 req/window) and blew
// through quota mid-run on the single-provider version. Splitting the
// taxonomy 4 ways across independent free-tier accounts means no single
// provider's quota can stall the whole job — each lane runs concurrently
// against its own quota pool.
//
// Lanes:
//   1. Gemini      — pinned to gemini-2.5-flash (not an alias, see postmortem above)
//   2. Groq        — llama-3.3-70b-versatile
//   3. OpenRouter #1 — meta-llama/llama-3.3-70b-instruct:free
//   4. OpenRouter #2 — same model, second account, doubles that lane's headroom
//
// Usage: node scoreTagAtoms.worker.js <taxonomy.json>
// Writes: job2_scored_raw.json (in the same directory as the taxonomy file)

import fs from 'fs';
import path from 'path';
import { ATOMS } from './atoms.js';

const TAXONOMY_PATH = process.argv[2];
if (!TAXONOMY_PATH || !fs.existsSync(TAXONOMY_PATH)) {
  console.error(`[Fatal] Usage: node scoreTagAtoms.worker.js <taxonomy.json>. File not found: ${TAXONOMY_PATH}`);
  process.exit(1);
}

const taxonomy = JSON.parse(fs.readFileSync(TAXONOMY_PATH, 'utf8'));
const OUTPUT_PATH = path.join(path.dirname(TAXONOMY_PATH), 'job2_scored_raw.json');

const BATCH_SIZE = 20;
const MAX_RETRIES = 3;

// ---------------------------------------------------------------------------
// Provider configs
// ---------------------------------------------------------------------------
// Each provider gets its own pacing tuned conservatively below its documented
// free-tier RPM (padding built in since free-tier numbers drift — see the
// gemini-flash-latest incident this rewrite is responding to). Providers run
// concurrently; one provider's 429 backoff never blocks another's progress.

const PROVIDERS = [
  {
    name: 'gemini',
    envKey: 'GOOGLE_API_KEY',
    model: 'gemini-2.5-flash',
    rpm: 10,
    call: callGemini,
  },
  {
    name: 'groq',
    // Secret is named GORQ in the repo (typo kept as-is, do not rename
    // without updating this file and the workflow's env mapping).
    envKey: 'GORQ',
    model: 'llama-3.3-70b-versatile',
    rpm: 25,
    call: callOpenAICompatible('https://api.groq.com/openai/v1/chat/completions'),
  },
  {
    name: 'openrouter_1',
    envKey: 'OPEN_ROUTER',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    rpm: 15,
    call: callOpenAICompatible('https://openrouter.ai/api/v1/chat/completions'),
  },
  {
    name: 'openrouter_2',
    // Secret is named YOUR_SECERET_NAME in the repo — a naming accident kept
    // as-is since GitHub secrets can't be renamed in place. This is
    // OpenRouter account #2 (separate account from OPEN_ROUTER above), not a
    // different provider. Do not rename without updating this file.
    envKey: 'YOUR_SECERET_NAME',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    rpm: 15,
    call: callOpenAICompatible('https://openrouter.ai/api/v1/chat/completions'),
  },
];

// ---------------------------------------------------------------------------
// Prompt construction — shared across all providers
// ---------------------------------------------------------------------------

function buildPrompt(items) {
  const atomList = ATOMS.join(', ');
  const itemNames = items.map((it) => `${it.name} (${it.type})`).join('\n');
  return `You are scoring manga/story concepts against a fixed list of mood/emotion atoms.

Atoms (score each item against ALL of these): ${atomList}

For each concept below, return an integer 1-100 for EVERY atom, reflecting how
strongly that concept evokes that atom. Ties across atoms are fine and expected.

Concepts:
${itemNames}

Return ONLY a JSON array, no prose, no markdown fences. Shape:
[{"name": "<exact concept name>", "scores": {"<atom>": <1-100>, ...}}, ...]
One object per concept, in the same order given above.`;
}

function parseModelJSON(raw) {
  // Strip markdown fences some models add despite instructions.
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

// ---------------------------------------------------------------------------
// Provider call implementations
// ---------------------------------------------------------------------------

async function callGemini(prompt, apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(data));
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return parseModelJSON(text);
}

function callOpenAICompatible(endpoint) {
  return async function (prompt, apiKey, model) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response');
    // Some OpenAI-compatible providers require an object schema for
    // response_format; if the model wraps the array under a key, unwrap it.
    const parsed = parseModelJSON(text);
    return Array.isArray(parsed) ? parsed : parsed.items || parsed.results || parsed;
  };
}

// ---------------------------------------------------------------------------
// Per-provider queue runner
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runProviderQueue(provider, items) {
  const apiKey = process.env[provider.envKey];
  if (!apiKey) {
    console.error(`[${provider.name}] Missing env var ${provider.envKey} — skipping this lane entirely.`);
    return { scored: [], failed: items.map((it) => it.name) };
  }

  const batches = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    batches.push(items.slice(i, i + BATCH_SIZE));
  }

  const requestSpacingMs = Math.ceil(60000 / provider.rpm);
  const scored = [];
  const failed = [];

  console.log(
    `[${provider.name}] ${items.length} items, ${batches.length} batches, model=${provider.model}, paced at ${provider.rpm} RPM (${requestSpacingMs}ms/request)`
  );

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];
    console.log(`[${provider.name}] Batch ${b + 1}/${batches.length} scoring ${batch.length} items...`);

    let attempt = 0;
    let success = false;
    while (attempt < MAX_RETRIES && !success) {
      attempt++;
      try {
        const prompt = buildPrompt(batch);
        const result = await provider.call(prompt, apiKey, provider.model);
        scored.push(...result);
        success = true;
      } catch (err) {
        const is429 = /429|RESOURCE_EXHAUSTED|rate.?limit/i.test(err.message);
        const waitMs = is429 ? 20000 * attempt : 1000 * attempt;
        console.log(`[${provider.name}] [Retry ${attempt}/${MAX_RETRIES}, waiting ${waitMs}ms] ${err.message.slice(0, 200)}`);
        if (attempt < MAX_RETRIES) await sleep(waitMs);
      }
    }

    if (!success) {
      const names = batch.map((it) => it.name);
      console.log(`[${provider.name}] [Batch failed after ${MAX_RETRIES} attempts] ${names.join(', ')}`);
      failed.push(...names);
    }

    if (b < batches.length - 1) await sleep(requestSpacingMs);
  }

  return { scored, failed };
}

// ---------------------------------------------------------------------------
// Main — split taxonomy 4 ways, run all lanes concurrently
// ---------------------------------------------------------------------------

function splitEvenly(arr, n) {
  const chunks = Array.from({ length: n }, () => []);
  arr.forEach((item, i) => chunks[i % n].push(item));
  return chunks;
}

async function main() {
  const chunks = splitEvenly(taxonomy, PROVIDERS.length);

  console.log(
    `[Job 2 worker] ${taxonomy.length} items, 16 atoms, ${PROVIDERS.length}-way split (${chunks.map((c) => c.length).join('/')}) across: ${PROVIDERS.map((p) => p.name).join(', ')}`
  );

  const results = await Promise.allSettled(
    PROVIDERS.map((provider, i) => runProviderQueue(provider, chunks[i]))
  );

  const allScored = [];
  const allFailed = [];

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      allScored.push(...result.value.scored);
      allFailed.push(...result.value.failed);
    } else {
      console.error(`[${PROVIDERS[i].name}] Lane crashed entirely: ${result.reason}`);
      allFailed.push(...chunks[i].map((it) => it.name));
    }
  });

  // Failed items get a null-score placeholder rather than silently vanishing,
  // matching the original single-provider behavior.
  allFailed.forEach((name) => {
    allScored.push({ name, scores: null });
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allScored, null, 2));
  console.log(`[Job 2 worker] Done. ${allScored.length - allFailed.length} scored, ${allFailed.length} failed. Written to ${OUTPUT_PATH}`);

  if (allFailed.length > 0) {
    console.log(`[Job 2 worker] Failed items: ${allFailed.join(', ')}`);
  }
}

main().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
