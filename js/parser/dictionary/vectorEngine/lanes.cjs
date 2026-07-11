#!/usr/bin/env node
/**
 * lanes.cjs — shared lane-building logic for Job 2 (tags) and Job 3
 * (phrases), used by job2Tags.cjs and job3Phrases.cjs respectively.
 *
 * Each API key becomes its own "lane" with its OWN tracked budget. A lane
 * self-disables (rather than retrying into a wall) on a 429/quota error or
 * a "model no longer available" error — this is what actually prevents a
 * repeat of the Monkey-key situation: no single account gets hammered past
 * what it's really rated for.
 *
 * Job-scoping: pass 'JOB2' or 'JOB3' to buildLanes(). Each job only reads
 * its OWN <JOB2_*|JOB3_*>_KEYS env vars, so when Job 2 and Job 3 run as
 * separate parallel GitHub Actions jobs, they draw from entirely different
 * accounts and never collide on the same quota.
 *
 * Real free-tier caps this is calibrated against (per account, verified
 * July 2026 — re-check before relying on these long-term, free tiers move):
 *   Gemini (Flash):    ~15 RPM / ~1,500 requests per day
 *   OpenRouter (:free): 20 RPM / 50 requests per day (no credit purchased)
 *   BazaarLink (auto:free): 10 RPM / 150 requests per day
 * dailyLimit below is set noticeably under each real cap — the actual
 * workload (a few hundred requests total) never gets close to it anyway,
 * so there's no reason to run a lane right up against its real ceiling.
 */

function parseKeys(...envVarNames) {
  const keys = [];
  for (const name of envVarNames) {
    const raw = process.env[name];
    if (!raw) continue;
    raw.split(',').map((k) => k.trim()).filter(Boolean).forEach((k) => keys.push(k));
  }
  return [...new Set(keys)]; // de-dupe in case a key got pasted into two vars
}

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

function buildLanes(jobPrefix) {
  const geminiKeys = parseKeys(`${jobPrefix}_GEMINI_KEYS`);
  const openrouterKeys = parseKeys(`${jobPrefix}_OPENROUTER_KEYS`);
  const bazaarlinkKeys = parseKeys(`${jobPrefix}_BAZAARLINK_KEYS`);
  // Optional extras — only activate if you still have keys for these.
  const githubKeys = parseKeys(`${jobPrefix}_GITHUB_MODELS_KEYS`);
  const groqKeys = parseKeys(`${jobPrefix}_GROQ_KEYS`);

  const lanes = [
    ...expandLanes('gemini', geminiKeys, 8, 'requests', 1400, 30000,
      (key, promptText, maxOut) => callGemini('gemini-2.5-flash', key, promptText, maxOut)),
    ...expandLanes('openrouter', openrouterKeys, 8, 'requests', 45, 3200,
      (key, promptText, maxOut) => callOpenAICompatible(
        'https://openrouter.ai/api/v1',
        'meta-llama/llama-3.3-70b-instruct:free',
        key, promptText, maxOut,
        { 'HTTP-Referer': 'https://github.com/yadav0057/mymanga', 'X-Title': 'MangaMood' }
      )),
    ...expandLanes('bazaarlink', bazaarlinkKeys, 6, 'requests', 140, 6500,
      (key, promptText, maxOut) => callOpenAICompatible('https://bazaarlink.ai/api/v1', 'auto:free', key, promptText, maxOut)),
    ...expandLanes('github-models', githubKeys, 4, 'requests', 90, 6500,
      (key, promptText, maxOut) => callOpenAICompatible(
        'https://models.inference.ai.azure.com',
        process.env.GITHUB_MODELS_MODEL || 'gpt-4o-mini',
        key, promptText, Math.min(maxOut, 4096)
      )),
    ...expandLanes('groq', groqKeys, 12, 'tokens', 55000, 2500,
      (key, promptText, maxOut) => callOpenAICompatible('https://api.groq.com/openai/v1', 'llama-3.3-70b-versatile', key, promptText, maxOut)),
  ];

  console.log(`[${jobPrefix}] ${lanes.length} lane(s) — gemini:${geminiKeys.length} openrouter:${openrouterKeys.length} bazaarlink:${bazaarlinkKeys.length} github-models:${githubKeys.length} groq:${groqKeys.length}`);
  if (lanes.length === 0) {
    console.error(`[${jobPrefix}] Fatal: no keys found in any ${jobPrefix}_*_KEYS secret/env var.`);
    process.exit(1);
  }
  return lanes;
}

function laneHasBudget(lane) {
  if (lane.disabled) return false;
  return lane.dailyLimitType === 'requests' ? lane.requestsUsed < lane.dailyLimit : lane.tokensUsed < lane.dailyLimit;
}

module.exports = { buildLanes, laneHasBudget, parseKeys };
