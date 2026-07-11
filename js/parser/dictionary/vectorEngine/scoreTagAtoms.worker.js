#!/usr/bin/env node
/**
 * Job 2 worker — multi-lane, quota-safe, resumable.
 *
 * Round-robins across several free-tier providers, each with its OWN
 * tracked daily budget. A lane that hits its real limit self-disables for
 * the rest of the day instead of retrying into a wall (that's what killed
 * the earlier 4-lane attempt — OpenRouter's free model was congested
 * upstream, no amount of backoff fixes that, and Groq's real limit is
 * tokens/day, not requests/day).
 *
 * Usage:
 *   node scoreTagAtoms.worker.js <taxonomy_path>
 *
 * Env vars (all optional except the API keys you actually want to use —
 * a lane with no key just gets skipped):
 *   GOOGLE_API_KEY, GITHUB_MODELS_KEY, GROQ_API_KEY, OPENROUTER_API_KEY
 */

const fs = require('fs');
const path = require('path');
const { ATOMS } = require('./atoms.js');

const [, , taxonomyPathArg] = process.argv;
if (!taxonomyPathArg) {
  console.error('Usage: node scoreTagAtoms.worker.js <taxonomy_path>');
  process.exit(1);
}

const SCORED_PATH = path.join(__dirname, 'job2_scored_raw.json');
const PROGRESS_PATH = path.join(__dirname, 'job2_progress.json');

function loadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function saveJSON(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2)); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
function todayKey() { return new Date().toISOString().slice(0, 10); } // UTC date; cron already runs after Pacific reset so this is close enough

function buildPrompt(items) {
  const atomList = ATOMS.join(', ');
  return `Score each of the following manga tags/themes on a 1-100 scale for ` +
    `EACH of these atoms: ${atomList}.\n\n` +
    `Return ONLY JSON, shape: {"items": [{"name": "<exact name>", "scores": {"<atom>": <1-100>, ...}}]}\n\n` +
    `Items to score:\n${items.map((i) => `- ${i.name} (${i.type})`).join('\n')}`;
}

function validateEntry(entry) {
  if (!entry || typeof entry.name !== 'string' || !entry.scores) return false;
  for (const atom of ATOMS) {
    const v = entry.scores[atom];
    if (typeof v !== 'number' || v < 1 || v > 100) return false;
  }
  return true;
}

// ---- Provider call functions -----------------------------------------

async function callGemini(model, apiKey, items) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(items) }] }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192 },
    }),
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json?.error?.message || `HTTP ${res.status}`), { status: res.status });
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty Gemini response');
  const parsed = JSON.parse(text);
  return { items: parsed.items || [], tokensUsed: json?.usageMetadata?.totalTokenCount || 0 };
}

async function callOpenAICompatible(baseUrl, model, apiKey, items, extraHeaders = {}) {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: buildPrompt(items) }],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json?.error?.message || `HTTP ${res.status}`), { status: res.status });
  const text = json?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response');
  const parsed = JSON.parse(text);
  return { items: parsed.items || [], tokensUsed: json?.usage?.total_tokens || 0 };
}

// ---- Lane definitions ---------------------------------------------------
// Each lane self-reports whether it's usable (has a key) and tracks its own
// daily budget in progress.laneUsage. dailyLimitType is 'requests' or 'tokens'.

function buildLanes() {
  return [
    {
      id: 'gemini-2.5-flash',
      batchSize: 40,
      dailyLimitType: 'requests',
      dailyLimit: 15,
      rpmSpacingMs: 6500,
      enabled: !!process.env.GOOGLE_API_KEY,
      call: (items) => callGemini('gemini-2.5-flash', process.env.GOOGLE_API_KEY, items),
    },
    {
      id: 'gemini-3.5-flash',
      batchSize: 40,
      dailyLimitType: 'requests',
      dailyLimit: 15,
      rpmSpacingMs: 30000,
      enabled: !!process.env.GOOGLE_API_KEY,
      call: (items) => callGemini('gemini-3.5-flash', process.env.GOOGLE_API_KEY, items),
    },
    {
      id: 'gemini-2.5-flash-alt',
      batchSize: 40,
      dailyLimitType: 'requests',
      dailyLimit: 15,
      rpmSpacingMs: 6500,
      enabled: !!process.env.GOOGLE_API_KEY_ALT,
      call: (items) => callGemini('gemini-2.5-flash', process.env.GOOGLE_API_KEY_ALT, items),
    },
    {
      id: 'gemini-3.5-flash-alt',
      batchSize: 40,
      dailyLimitType: 'requests',
      dailyLimit: 15,
      rpmSpacingMs: 30000,
      enabled: !!process.env.GOOGLE_API_KEY_ALT,
      call: (items) => callGemini('gemini-3.5-flash', process.env.GOOGLE_API_KEY_ALT, items),
    },
    {
      id: 'github-models',
      batchSize: 10, // small — this tier has an 8K in / 4K out per-request cap
      dailyLimitType: 'requests',
      dailyLimit: 100, // safety margin under mini-tier's 150 RPD
      rpmSpacingMs: 6500, // stay under 10 RPM
      enabled: !!process.env.GITHUB_MODELS_KEY,
      call: (items) => callOpenAICompatible(
        'https://models.inference.ai.azure.com',
        process.env.GITHUB_MODELS_MODEL || 'gpt-4o-mini',
        process.env.GITHUB_MODELS_KEY,
        items
      ),
    },
    {
      id: 'groq',
      batchSize: 30,
      dailyLimitType: 'tokens',
      dailyLimit: 60000, // conservative slice of Groq's real 100K TPD cap
      rpmSpacingMs: 2500,
      enabled: !!process.env.GROQ_API_KEY,
      call: (items) => callOpenAICompatible(
        'https://api.groq.com/openai/v1',
        'llama-3.3-70b-versatile',
        process.env.GROQ_API_KEY,
        items
      ),
    },
    {
      id: 'openrouter',
      batchSize: 20,
      dailyLimitType: 'requests',
      dailyLimit: 5, // opportunistic only — self-disables hard on first failure below
      rpmSpacingMs: 3000,
      enabled: !!process.env.OPENROUTER_API_KEY,
      call: (items) => callOpenAICompatible(
        'https://openrouter.ai/api/v1',
        'meta-llama/llama-3.3-70b-instruct:free',
        process.env.OPENROUTER_API_KEY,
        items,
        { 'HTTP-Referer': 'https://github.com/yadav0057/mymanga', 'X-Title': 'MangaMood' }
      ),
    },
  ];
}

function getLaneUsage(progress, laneId) {
  const today = todayKey();
  const rec = progress.laneUsage[laneId];
  if (!rec || rec.date !== today) {
    progress.laneUsage[laneId] = { date: today, requestsUsed: 0, tokensUsed: 0, disabled: false };
  }
  return progress.laneUsage[laneId];
}

function laneHasBudget(lane, usage) {
  if (usage.disabled) return false;
  if (lane.dailyLimitType === 'requests') return usage.requestsUsed < lane.dailyLimit;
  return usage.tokensUsed < lane.dailyLimit;
}

// ---- Main ----------------------------------------------------------------

async function main() {
  const taxonomy = loadJSON(taxonomyPathArg, []);
  if (!taxonomy.length) {
    console.error(`No items found at ${taxonomyPathArg}`);
    process.exit(1);
  }

  const progress = loadJSON(PROGRESS_PATH, { scoredNames: [], laneUsage: {} });
  if (!progress.laneUsage) progress.laneUsage = {};
  const scoredSet = new Set(progress.scoredNames);
  const existingResults = loadJSON(SCORED_PATH, []);

  const lanes = buildLanes().filter((l) => l.enabled);
  console.log(`[Job 2 worker] Active lanes: ${lanes.map((l) => l.id).join(', ') || 'NONE — no API keys set'}`);

  let remaining = taxonomy.filter((i) => !scoredSet.has(i.name));
  console.log(`[Job 2 worker] ${taxonomy.length} total, ${remaining.length} remaining.`);

  let sawAnyBudget = true;
  while (remaining.length > 0 && sawAnyBudget) {
    sawAnyBudget = false;

    for (const lane of lanes) {
      if (remaining.length === 0) break;
      const usage = getLaneUsage(progress, lane.id);
      if (!laneHasBudget(lane, usage)) continue;
      sawAnyBudget = true;

      const batch = remaining.slice(0, lane.batchSize);
      console.log(`[${lane.id}] scoring ${batch.length} items (batch)...`);

      try {
        const { items: results, tokensUsed } = await lane.call(batch);
        const valid = results.filter(validateEntry);
        for (const r of valid) {
          existingResults.push(r);
          scoredSet.add(r.name);
        }
        remaining = remaining.filter((i) => !scoredSet.has(i.name));
        usage.requestsUsed += 1;
        usage.tokensUsed += tokensUsed;
        console.log(`[${lane.id}] +${valid.length} scored (${results.length - valid.length} malformed dropped)`);
      } catch (err) {
        const isQuota = err.status === 429 || /quota|rate.?limit/i.test(err.message);
        console.log(`[${lane.id}] failed: ${err.message}${isQuota ? ' — disabling lane for today' : ''}`);
        if (isQuota) usage.disabled = true;
        // Non-quota errors: don't disable the lane, just move on — next
        // round-robin pass will retry this lane with a fresh batch.
      }

      saveJSON(SCORED_PATH, existingResults);
      saveJSON(PROGRESS_PATH, { scoredNames: Array.from(scoredSet), laneUsage: progress.laneUsage });

      await sleep(lane.rpmSpacingMs);
    }
  }

  const stillRemaining = taxonomy.length - scoredSet.size;
  console.log(`[Job 2 worker] Run complete. ${stillRemaining} item(s) remaining.`);
  if (stillRemaining === 0) {
    console.log('[Job 2 worker] 🎉 Full taxonomy scored. Ready for judge pass.');
  } else {
    console.log('[Job 2 worker] All active lanes exhausted their daily budget. Resuming on next scheduled run.');
  }
}

main().catch((err) => {
  console.error('[Job 2 worker] Fatal error:', err);
  process.exit(1);
});
