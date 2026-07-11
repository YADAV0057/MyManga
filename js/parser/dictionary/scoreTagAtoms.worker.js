// js/parser/dictionary/vectorEngine/scoreTagAtoms.worker.js
//
// Job 2 — worker pass. Scores every item in a taxonomy input file 1-100
// against every atom in ATOMS.js, via the Google Gemini API. This is the
// "one model scores" half of the worker+judge pipeline described in the
// plan doc (Section 1's job-runner skeleton pattern, cloned from
// backfillMoodWeights.js's rewrite-a-file/commit shape — but this one
// makes real network calls, so it's meant to run inside the GitHub Action,
// not locally without a key).
//
// Item-list agnostic on purpose: doesn't hardcode whether Job 2 is the
// 965-item (tags/themes only) or 1,427-item (+ archetypes) scope — that's
// still an open question (plan doc Section 9.1). Point INPUT_PATH at
// whichever taxonomy file you've decided on when you run this.
//
// Input file shape (JSON array):
//   [{ "name": "Enemies to Lovers", "type": "romance_trope" },
//    { "name": "Time Skip", "type": "plot_device" }, ...]
// `type` is carried through untouched — it's not used for scoring, just
// preserved so the output can be split back into properties.js's
// genre/theme/etc. shape later if needed.
//
// Output: vectorEngine/job2_scored_raw.json — one entry per input item:
//   { "name": ..., "type": ..., "scores": { "dark": 72, "funny": 5, ... } }
//
//   GOOGLE_API_KEY=... node js/parser/dictionary/vectorEngine/scoreTagAtoms.worker.js path/to/taxonomy.json

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ATOMS } from './atoms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = process.argv[2];
const OUTPUT_PATH = path.join(__dirname, 'job2_scored_raw.json');

// gemini-flash-latest is Google's auto-updated alias for their current
// GA flash-tier model (points at gemini-3.5-flash as of this pass) —
// deliberately using the alias, not a pinned dated snapshot, so this
// script doesn't silently start failing the next time Google retires a
// specific model id (this repo has already been bitten once by a stale
// hardcoded reference — see MoodConfig.js's absence, Section 7 q2).
const MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';
const API_KEY = process.env.GOOGLE_API_KEY;
const BATCH_SIZE = 20;          // items per API call — keeps prompts + JSON responses manageable

// Free-tier pacing. Gemini Flash's free tier is ~10-15 RPM (checked live,
// not assumed) — well under what 3 concurrent workers would burn through.
// CONCURRENCY=1 + a fixed delay between requests keeps this under the cap
// by construction instead of firing as fast as possible and leaning on
// 429 retries to sort it out after the fact (retries still exist below as
// a safety net, not as the primary pacing strategy).
// Set GEMINI_RPM higher (e.g. 60+) once billing is enabled on the project
// — this script will run proportionally faster with no other changes.
const RPM = parseInt(process.env.GEMINI_RPM, 10) || 10;
const REQUEST_SPACING_MS = Math.ceil(60000 / RPM);
const RETRY_LIMIT = 3;
const RATE_LIMIT_BACKOFF_MS = 20000; // 429s get a much longer wait than other transient errors

if (!API_KEY) {
    console.error('[Fatal] GOOGLE_API_KEY not set.');
    process.exit(1);
}
if (!INPUT_PATH || !fs.existsSync(INPUT_PATH)) {
    console.error('[Fatal] Usage: node scoreTagAtoms.worker.js <taxonomy.json>. File not found:', INPUT_PATH);
    process.exit(1);
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

function buildPrompt(items) {
    return `You are scoring manga/manhwa plot devices, romance tropes, and character archetypes against a fixed set of "mood atoms" for a recommendation engine.

For EACH item below, score 1-100 how strongly that item's presence in a story signals EACH of these atoms. Ties across items are fine and expected — this is not a ranking, it's independent per-atom scoring. A low score (near 1) means "this item carries basically no signal for this atom," not "this item opposes it" — there is no negative direction, 1 is the floor.

Atoms (score all of these for every item): ${ATOMS.join(', ')}

Items to score:
${items.map((it, i) => `${i + 1}. "${it.name}" (${it.type})`).join('\n')}

Respond with ONLY a JSON array, one object per item, in the same order, no markdown fences, no commentary:
[{"name": "<exact item name>", "scores": {${ATOMS.map(a => `"${a}": <1-100>`).join(', ')}}}, ...]`;
}

async function callGemini(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
    const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
    };
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        const err = new Error(`Gemini ${res.status}: ${text.slice(0, 500)}`);
        err.isRateLimit = (res.status === 429);
        throw err;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini response had no text content: ' + JSON.stringify(data).slice(0, 500));
    return JSON.parse(text);
}

function validateScores(entry) {
    if (!entry || typeof entry.name !== 'string' || !entry.scores) return false;
    return ATOMS.every(atom => {
        const v = entry.scores[atom];
        return typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 100;
    });
}

async function scoreBatch(items, attempt = 1) {
    const prompt = buildPrompt(items);
    try {
        const parsed = await callGemini(prompt);
        if (!Array.isArray(parsed) || parsed.length !== items.length) {
            throw new Error(`Expected ${items.length} scored items, got ${Array.isArray(parsed) ? parsed.length : typeof parsed}`);
        }
        return parsed.map((entry, i) => {
            if (!validateScores(entry)) {
                throw new Error(`Malformed/out-of-range scores for "${items[i].name}": ${JSON.stringify(entry).slice(0, 200)}`);
            }
            return { name: items[i].name, type: items[i].type, scores: entry.scores };
        });
    } catch (err) {
        if (attempt >= RETRY_LIMIT) {
            console.error(`[Batch failed after ${RETRY_LIMIT} attempts] ${items.map(i => i.name).join(', ')} — ${err.message}`);
            // Fail loud but don't kill the whole run — mark these for manual re-run.
            return items.map(it => ({ name: it.name, type: it.type, scores: null, error: err.message }));
        }
        const wait = err.isRateLimit ? RATE_LIMIT_BACKOFF_MS * attempt : 1000 * attempt;
        console.warn(`[Retry ${attempt}/${RETRY_LIMIT}, waiting ${wait}ms] ${err.message}`);
        await new Promise(r => setTimeout(r, wait));
        return scoreBatch(items, attempt + 1);
    }
}

async function runPaced(batches) {
    const results = [];
    for (let i = 0; i < batches.length; i++) {
        console.log(`[Batch ${i + 1}/${batches.length}] scoring ${batches[i].length} items...`);
        const start = Date.now();
        results.push(await scoreBatch(batches[i]));
        const elapsed = Date.now() - start;
        const remaining = REQUEST_SPACING_MS - elapsed;
        if (remaining > 0 && i < batches.length - 1) {
            await new Promise(r => setTimeout(r, remaining));
        }
    }
    return results.flat();
}

async function run() {
    const items = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
    const batches = chunk(items, BATCH_SIZE);
    const etaMinutes = Math.ceil((batches.length * REQUEST_SPACING_MS) / 60000);
    console.log(`[Job 2 worker] ${items.length} items, ${ATOMS.length} atoms, model=${MODEL}, batch=${BATCH_SIZE}, ` +
        `paced at ${RPM} RPM (${REQUEST_SPACING_MS}ms/request) — ${batches.length} requests, ~${etaMinutes} min ETA.`);

    const scored = await runPaced(batches);

    const failed = scored.filter(s => s.scores === null);
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(scored, null, 2));
    console.log(`[Done] Wrote ${scored.length} scored items to ${OUTPUT_PATH}.`);
    if (failed.length > 0) {
        console.warn(`[Warning] ${failed.length} item(s) failed all retries and have scores: null — re-run just those before proceeding to the judge pass: ${failed.map(f => f.name).join(', ')}`);
    }
}

run().catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
});
