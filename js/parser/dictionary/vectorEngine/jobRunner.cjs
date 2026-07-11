#!/usr/bin/env node
/**
 * jobRunner.cjs — shared round-robin run loop for a single job (Job 2 or
 * Job 3). Each job now runs as its OWN GitHub Actions job (see the
 * workflow), so this loop runs to completion or until its lanes exhaust
 * their budget within that job's own runner — no cross-job interaction.
 *
 * Nothing here is provider-specific; buildPrompt/validateEntry are passed
 * in by the caller (job2Tags.cjs / job3Phrases.cjs).
 */

const fs = require('fs');
const { laneHasBudget } = require('./lanes.cjs');

function loadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function saveJSON(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2)); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function pushToReview(reviewPath, entries) {
  const existing = loadJSON(reviewPath, []);
  existing.push(...entries.map((e) => ({ ...e, flaggedAt: new Date().toISOString() })));
  saveJSON(reviewPath, existing);
}

async function runJob({ jobName, items, outputPath, reviewPath, maxOutTokens, buildPrompt, validateEntry, lanes }) {
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
        if (invalid.length) pushToReview(reviewPath, invalid.map((r) => ({ job: jobName, reason: 'malformed/out-of-range', data: r })));
        if (missingNames.length) pushToReview(reviewPath, missingNames.map((m) => ({ job: jobName, reason: 'model skipped this item entirely', item: m })));

        remaining = remaining.filter((i) => !doneSet.has(i.name));
        lane.requestsUsed += 1;
        lane.tokensUsed += tokensUsed;
        console.log(`[${jobName}][${lane.id}] +${valid.length} saved, ${invalid.length} malformed, ${missingNames.length} skipped`);
      } catch (err) {
        const isQuota = err.status === 429 || /quota|rate.?limit/i.test(err.message);
        const isGone = err.status === 404 || /no longer available/i.test(err.message);
        console.log(`[${jobName}][${lane.id}] failed: ${err.message}${isQuota || isGone ? ' — disabling lane' : ' — will retry next round'}`);
        if (isQuota || isGone) lane.disabled = true;
        else pushToReview(reviewPath, batch.map((b) => ({ job: jobName, reason: `lane error: ${err.message}`, item: b })));
      }

      saveJSON(outputPath, existing);
      await sleep(lane.rpmSpacingMs);
    }
  }

  const stillRemaining = items.length - doneSet.size;
  console.log(`[${jobName}] Pass complete. ${stillRemaining} item(s) still remaining (lanes exhausted, or genuinely stuck — check review_queue.json).`);
  return stillRemaining;
}

module.exports = { runJob, loadJSON, saveJSON };
