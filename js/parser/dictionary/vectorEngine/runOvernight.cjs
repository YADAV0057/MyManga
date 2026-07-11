#!/usr/bin/env node
/**
 * runOvernight.cjs — single long-running local process. Replaces the two
 * separate worker scripts + progress files with one script and 4 files
 * total, shared across Job 2 (tag atom-scoring) and Job 3 (phrase
 * generation):
 *
 *   1. review_queue.json   — anything that failed/came back malformed
 *                             after retries. Nothing is silently dropped —
 *                             it lands here so you can eyeball it later
 *                             and re-push just those items.
 *   2. tags.json            — Job 2 output, accumulating live as it's
 *                             generated. Also doubles as the resumability
 *                             checkpoint — no separate progress file.
 *   3. phrases.json         — Job 3 output, same deal.
 *   4. final.json           — NOT written by this script. Written by
 *                             finalizeQuality.js after the judge pass,
 *                             once you're back and want to sign off.
 *
 * Run this LOCALLY (not as a GitHub Action) — GitHub Actions hard-caps a
 * single job at 6 hours even with timeout-minutes set higher, so it can't
 * survive a full overnight run as one workflow. Leave a terminal open:
 *
 *   GEMINI_KEYS=key1,key2,key3 GROQ_KEYS=key1,key2 OPENROUTER_KEYS=key1 \
 *   GITHUB_MODELS_KEYS=key1 \
 *   node runOvernight.cjs js/parser/dictionary/vectorEngine/job2_taxonomy_input.json
 *
 * Every provider env var takes a COMMA-SEPARATED list of keys — as many
 * as you have. Each key becomes its own lane automatically (no code
 * changes needed to add more keys later, just add them to the list).
 * Old single-key names (GOOGLE_API_KEY etc.) still work as a lane of one.
 *
 * Order: Job 2 (tags) runs to completion first, then Job 3 (phrases)
 * picks up automatically with whatever lane budget is left — no manual
 * restart between them.
 */

const fs = require('fs');
const path = require('path');

// ---- Shared vocab (with defensive fallbacks, same pattern as before) ----

let ATOMS;
try {
  ATOMS = require('./atoms.js').ATOMS;
  if (!Array.isArray(ATOMS)) throw new Error('not an array');
} catch (err) {
  console.log(`[atoms.js fallback] ${err.message}`);
  ATOMS = [
    'dark', 'emotional', 'exciting', 'funny', 'happy', 'hopeful', 'intense',
    'mysterious', 'nostalgic', 'relaxing', 'romantic', 'scary', 'tragic',
    'violent', 'wholesome', 'cognitive_load',
  ];
}

let GENRE_NAMES;
try {
  GENRE_NAMES = Object.keys(require('./genreEmotionMoodWeights.js').GENRE_EMOTION_WEIGHTS);
} catch (err) {
  console.log(`[genreEmotionMoodWeights.js fallback] ${err.message}`);
  GENRE_NAMES = [
    'Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 'Fantasy',
    'Historical Fiction', 'Horror', 'Mystery', 'Psychological',
    'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
  ];
}

const [, , taxonomyPathArg] = process.argv;
if (!taxonomyPathArg) {
  console.error('Usage: node runOvernight.cjs <taxonomy_path>');
  process.exit(1);
}

const REVIEW_PATH = path.join(__dirname, 'review_queue.json');
const TAGS_PATH = path.join(__dirname, 'tags.json');
const PHRASES_PATH = path.join(__dirname, 'phrases.json');

function loadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function saveJSON(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2)); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function pushToReview(entries) {
  const existing = loadJSON(REVIEW_PATH, []);
  existing.push(...entries.map((e) => ({ ...e, flaggedAt: new Date().toISOString() })));
  saveJSON(REVIEW_PATH, existing);
}

// ---- Key parsing — the actual point of this rewrite ----------------------

function parseKeys(...envVarNames) {
  const keys = [];
  for (const name of envVarNames) {
    const raw = process.env[name];
    if (!raw) continue;
    raw.split(',').map((k) => k.trim()).filter(Boolean).forEach((k) => keys.push(k));
  }
  return [...new Set(keys)]; // de-dupe in case the same key got pasted into two vars
}

// ---- Provider call functions (unchanged mechanics, prompt is passed in) --

async function callGemini(model, apiKey, promptText, maxOutputTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens },
    }),
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json?.error?.message || `HTTP ${res.status}`), { status: res.status });
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  return { parsed: JSON.parse(text), tokensUsed: json?.usageMetadata?.totalTokenCount || 0 };
}

async function callOpenAICompatible(baseUrl, model, apiKey, promptText, maxTokens, extraHeaders = {}) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, ...extraHeaders },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: promptText }],
      response_format: { type: 'json_object' },
      max_tokens: maxTokens,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json?.error?.message || `HTTP ${res.status}`), { status: res.status });
  const text = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response');
  return { parsed: JSON.parse(text), tokensUsed: json?.usage?.total_tokens || 0 };
}

// ---- Lane construction — now expands automatically from key lists --------
// dailyLimit is tracked in-memory only, for the duration of this run. No
// cross-run persistence — this is a one-shot overnight process, not a
// multi-day scheduled job anymore, so there's nothing to resume across
// days. tags.json / phrases.json ARE the resumability if the process dies
// and you restart it manually.

function expandLanes(providerId, keys, batchSize, dailyLimitType, dailyLimit, rpmSpacingMs, callFn) {
  return keys.map((key, idx) => ({
    id: `${providerId}-${idx + 1}`,
    batchSize,
    dailyLimitType,
    dailyLimit,
    rpmSpacingMs,
    requestsUsed: 0,
    tokensUsed: 0,
    disabled: false,
    call: (promptText, maxOut) => callFn(key, promptText, maxOut),
  }));
}

function buildLanes({ tagMaxOut, phraseMaxOut }) {
  const geminiKeys = parseKeys('GEMINI_KEYS', 'GOOGLE_API_KEY', 'GEMINI_ACCT_KEY', 'MONKEY_ACCT_KEY');
  const githubKeys = parseKeys('GITHUB_MODELS_KEYS', 'GITHUB_MODELS_KEY', 'GIT_HUB_KEY');
  const groqKeys = parseKeys('GROQ_KEYS', 'GROQ_API_KEY');
  const openrouterKeys = parseKeys('OPENROUTER_KEYS', 'OPENROUTER_API_KEY');

  const lanes = [
    ...expandLanes('gemini', geminiKeys, 8, 'requests', 15, 30000,
      (key, promptText, maxOut) => callGemini('gemini-3.5-flash', key, promptText, maxOut)),
    ...expandLanes('github-models', githubKeys, 4, 'requests', 100, 6500,
      (key, promptText, maxOut) => callOpenAICompatible('https://models.inference.ai.azure.com', process.env.GITHUB_MODELS_MODEL || 'gpt-4o-mini', key, promptText, Math.min(maxOut, 4096))),
    ...expandLanes('groq', groqKeys, 12, 'tokens', 60000, 2500,
      (key, promptText, maxOut) => callOpenAICompatible('https://api.groq.com/openai/v1', 'llama-3.3-70b-versatile', key, promptText, maxOut)),
    ...expandLanes('openrouter', openrouterKeys, 8, 'requests', 40, 3000,
      (key, promptText, maxOut) => callOpenAICompatible('https://openrouter.ai/api/v1', 'meta-llama/llama-3.3-70b-instruct:free', key, promptText, maxOut, { 'HTTP-Referer': 'https://github.com/yadav0057/mymanga', 'X-Title': 'MangaMood' })),
  ];

  console.log(`[Lanes] ${lanes.length} total — gemini:${geminiKeys.length} github-models:${githubKeys.length} groq:${groqKeys.length} openrouter:${openrouterKeys.length}`);
  if (lanes.length === 0) {
    console.error('[Fatal] No API keys found in any *_KEYS env var. Nothing to do.');
    process.exit(1);
  }
  return lanes;
}

function laneHasBudget(lane) {
  if (lane.disabled) return false;
  return lane.dailyLimitType === 'requests' ? lane.requestsUsed < lane.dailyLimit : lane.tokensUsed < lane.dailyLimit;
}

// ---- Job 2: tag/theme atom scoring ---------------------------------------

function buildTagPrompt(items) {
  const atomList = ATOMS.join(', ');
  return `Score each of the following manga tags/themes on a 1-100 scale for ` +
    `EACH of these atoms: ${atomList}.\n\n` +
    `Return ONLY JSON, shape: {"items": [{"name": "<exact name>", "scores": {"<atom>": <1-100>, ...}}]}\n\n` +
    `Items to score:\n${items.map((i) => `- ${i.name} (${i.type})`).join('\n')}`;
}

function validateTagEntry(entry) {
  if (!entry || typeof entry.name !== 'string' || !entry.scores) return false;
  return ATOMS.every((atom) => {
    const v = entry.scores[atom];
    return typeof v === 'number' && v >= 1 && v <= 100;
  });
}

// ---- Job 3: phrase generation --------------------------------------------

function buildPhrasePrompt(items) {
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

function validatePhraseEntry(entry) {
  if (!entry || typeof entry.name !== 'string' || !Array.isArray(entry.phrases) || entry.phrases.length === 0) return false;
  return entry.phrases.every((p) => p && typeof p.phrase === 'string' && p.phrase.trim()
    && typeof p.intensity === 'number' && p.intensity >= 1 && p.intensity <= 100
    && Array.isArray(p.similarPhrases) && p.similarPhrases.every((s) => typeof s === 'string'));
}

// ---- Generic run-one-job loop ---------------------------------------------

async function runJob({ jobName, items, outputPath, maxOutTokens, buildPrompt, validateEntry, lanes }) {
  const existing = loadJSON(outputPath, []);
  const doneSet = new Set(existing.map((e) => e.name));
  let remaining = items.filter((i) => !doneSet.has(i.name));
  console.log(`\n[${jobName}] ${items.length} total, ${remaining.length} remaining, ${existing.length} already saved.`);

  let sawAnyBudget = true;
  while (remaining.length > 0 && sawAnyBudget) {
    sawAnyBudget = false;
    for (const lane of lanes) {
      if (remaining.length === 0) break;
      if (!laneHasBudget(lane)) continue;
      sawAnyBudget = true;

      const batch = remaining.slice(0, lane.batchSize);
      console.log(`[${jobName}][${lane.id}] processing ${batch.length} item(s)...`);
      try {
        const { parsed, tokensUsed } = await lane.call(buildPrompt(batch), maxOutTokens);
        const results = parsed.items || [];
        const valid = results.filter(validateEntry);
        const invalid = results.filter((r) => !validateEntry(r));
        const missingNames = batch.filter((b) => !results.some((r) => r.name === b.name));

        valid.forEach((r) => { existing.push(r); doneSet.add(r.name); });
        if (invalid.length) pushToReview(invalid.map((r) => ({ job: jobName, reason: 'malformed/out-of-range', data: r })));
        if (missingNames.length) pushToReview(missingNames.map((m) => ({ job: jobName, reason: 'model skipped this item entirely', item: m })));

        remaining = remaining.filter((i) => !doneSet.has(i.name));
        lane.requestsUsed += 1;
        lane.tokensUsed += tokensUsed;
        console.log(`[${jobName}][${lane.id}] +${valid.length} saved, ${invalid.length} malformed, ${missingNames.length} skipped`);
      } catch (err) {
        const isQuota = err.status === 429 || /quota|rate.?limit/i.test(err.message);
        const isGone = err.status === 404 || /no longer available/i.test(err.message);
        console.log(`[${jobName}][${lane.id}] failed: ${err.message}${isQuota || isGone ? ' — disabling lane' : ' — will retry next round'}`);
        if (isQuota || isGone) lane.disabled = true;
        else pushToReview(batch.map((b) => ({ job: jobName, reason: `lane error: ${err.message}`, item: b })));
      }

      saveJSON(outputPath, existing);
      await sleep(lane.rpmSpacingMs);
    }
  }

  const stillRemaining = items.length - doneSet.size;
  console.log(`[${jobName}] Pass complete. ${stillRemaining} item(s) still remaining (lanes exhausted, or genuinely stuck — check ${path.basename(REVIEW_PATH)}).`);
  return stillRemaining;
}

// ---- Main ------------------------------------------------------------------

async function main() {
  const taxonomy = loadJSON(taxonomyPathArg, []);
  if (!taxonomy.length) {
    console.error(`No items found at ${taxonomyPathArg}`);
    process.exit(1);
  }

  const tagItems = taxonomy; // Job 2: tags/themes/archetypes as-is
  const genreItems = GENRE_NAMES.map((name) => ({ name, type: 'genre' }));
  const seenNames = new Set(genreItems.map((i) => i.name));
  const phraseItems = [...genreItems, ...taxonomy.filter((i) => !seenNames.has(i.name))]; // Job 3: genres + tags/themes

  const lanes = buildLanes({});

  // Job 2 first — tags.json
  await runJob({
    jobName: 'Job 2 (tags)',
    items: tagItems,
    outputPath: TAGS_PATH,
    maxOutTokens: 16384,
    buildPrompt: buildTagPrompt,
    validateEntry: validateTagEntry,
    lanes,
  });

  // Reset per-lane in-memory budgets between jobs? No — deliberately NOT
  // reset. If a lane hit its real daily cap scoring tags, it's still at
  // that cap for phrases; that's the provider's actual limit, not a
  // per-job allowance. Lanes that still have budget left just continue.

  // Job 3 next — phrases.json (smaller batch sizes, bigger token ceiling,
  // handled per-lane already via batchSize; only maxOutTokens changes here)
  await runJob({
    jobName: 'Job 3 (phrases)',
    items: phraseItems,
    outputPath: PHRASES_PATH,
    maxOutTokens: 32768,
    buildPrompt: buildPhrasePrompt,
    validateEntry: validatePhraseEntry,
    lanes,
  });

  console.log('\n[Done] Overnight run finished (or all lanes exhausted). Run finalizeQuality.js when you are back to QC and produce final.json.');
}

main().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
