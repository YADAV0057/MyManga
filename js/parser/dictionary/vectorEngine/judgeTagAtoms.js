
// js/parser/dictionary/vectorEngine/judgeTagAtoms.js
//
// Job 2 — judge pass. Takes a random sample of the worker's output
// (scoreTagAtoms.worker.js's job2_scored_raw.json) and re-scores just that
// sample independently via Cerebras (a different model family — gpt-oss
// -120b, not another Gemini call — so a disagreement is more likely a real
// judgment call than correlated bias from the same model re-asked). Per
// plan doc Section 1: "a second model (different provider) re-scores a
// sample; auto-merge on agreement, queue disagreements for manual review."
//
// Output:
//   - job2_final.json         — the worker's scores, unchanged, for every
//                                item that wasn't sampled OR was sampled
//                                and agreed with the judge.
//   - job2_review_queue.json  — items where judge and worker disagreed by
//                                more than DISAGREEMENT_THRESHOLD on any
//                                atom, with both scores shown side by side
//                                for manual review. NOT auto-merged.
//
//   CEREBRAS_API_KEY=... node js/parser/dictionary/vectorEngine/judgeTagAtoms.js [sampleRate]
//   sampleRate defaults to 0.15 (15% of items re-scored by the judge).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ATOMS } from './atoms.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAW_PATH = path.join(__dirname, 'job2_scored_raw.json');
const FINAL_PATH = path.join(__dirname, 'job2_final.json');
const REVIEW_PATH = path.join(__dirname, 'job2_review_queue.json');

const SAMPLE_RATE = parseFloat(process.argv[2]) || 0.15;
const DISAGREEMENT_THRESHOLD = 20; // points, on the 1-100 scale, per atom
const MODEL = process.env.CEREBRAS_MODEL || 'gpt-oss-120b';
const API_KEY = process.env.CEREBRAS_API_KEY;
const BATCH_SIZE = 20;
const RETRY_LIMIT = 3;

if (!API_KEY) {
    console.error('[Fatal] CEREBRAS_API_KEY not set.');
    process.exit(1);
}
if (!fs.existsSync(RAW_PATH)) {
    console.error('[Fatal] job2_scored_raw.json not found — run scoreTagAtoms.worker.js first.');
    process.exit(1);
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}

function sample(arr, rate) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    const n = Math.max(1, Math.round(arr.length * rate));
    return shuffled.slice(0, n);
}

function buildPrompt(items) {
    return `You are independently scoring manga/manhwa plot devices, romance tropes, and character archetypes against a fixed set of "mood atoms," as a QC check against a prior scoring pass (which you cannot see). Score honestly from your own judgment — do not try to guess or match any other score.

For EACH item below, score 1-100 how strongly that item's presence in a story signals EACH of these atoms. A low score (near 1) means "basically no signal," not "opposes it" — there is no negative direction.

Atoms (score all of these for every item): ${ATOMS.join(', ')}

Items to score:
${items.map((it, i) => `${i + 1}. "${it.name}" (${it.type})`).join('\n')}

Respond with ONLY a JSON array, one object per item, in the same order, no markdown fences, no commentary:
[{"name": "<exact item name>", "scores": {${ATOMS.map(a => `"${a}": <1-100>`).join(', ')}}}, ...]`;
}

async function callCerebras(prompt) {
    const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
            model: MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2,
            response_format: { type: 'json_object' } // note: wrapped below since this expects an object, not a bare array
        })
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Cerebras ${res.status}: ${text.slice(0, 500)}`);
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Cerebras response had no content: ' + JSON.stringify(data).slice(0, 500));
    return JSON.parse(text);
}

// response_format: json_object requires a JSON *object* back, not a bare
// array — Cerebras' structured-output mode won't accept a top-level array
// schema the same way Gemini's responseMimeType does. Wrap/unwrap under an
// "items" key rather than fighting the API for a bare-array response.
function buildPromptWrapped(items) {
    return buildPrompt(items).replace(
        'Respond with ONLY a JSON array, one object per item, in the same order, no markdown fences, no commentary:\n[{"name"',
        'Respond with ONLY a JSON object of the form {"items": [...]}, one entry per item, in the same order, no markdown fences, no commentary:\n{"items": [{"name"'
    ).concat(']}');
}

function validateScores(entry) {
    if (!entry || typeof entry.name !== 'string' || !entry.scores) return false;
    return ATOMS.every(atom => {
        const v = entry.scores[atom];
        return typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 100;
    });
}

async function judgeBatch(items, attempt = 1) {
    const prompt = buildPromptWrapped(items);
    try {
        const parsed = await callCerebras(prompt);
        const list = Array.isArray(parsed) ? parsed : parsed.items;
        if (!Array.isArray(list) || list.length !== items.length) {
            throw new Error(`Expected ${items.length} scored items, got ${Array.isArray(list) ? list.length : typeof list}`);
        }
        return list.map((entry, i) => {
            if (!validateScores(entry)) {
                throw new Error(`Malformed/out-of-range scores for "${items[i].name}": ${JSON.stringify(entry).slice(0, 200)}`);
            }
            return { name: items[i].name, scores: entry.scores };
        });
    } catch (err) {
        if (attempt >= RETRY_LIMIT) {
            console.error(`[Judge batch failed after ${RETRY_LIMIT} attempts] ${items.map(i => i.name).join(', ')} — ${err.message}`);
            return items.map(it => ({ name: it.name, scores: null, error: err.message }));
        }
        console.warn(`[Retry ${attempt}/${RETRY_LIMIT}] ${err.message}`);
        await new Promise(r => setTimeout(r, 1000 * attempt));
        return judgeBatch(items, attempt + 1);
    }
}

function diffAtoms(workerScores, judgeScores) {
    const diffs = {};
    ATOMS.forEach(atom => {
        const d = Math.abs((workerScores[atom] ?? 0) - (judgeScores[atom] ?? 0));
        if (d > DISAGREEMENT_THRESHOLD) diffs[atom] = { worker: workerScores[atom], judge: judgeScores[atom], diff: d };
    });
    return diffs;
}

async function run() {
    const raw = JSON.parse(fs.readFileSync(RAW_PATH, 'utf8'));
    const scoredItems = raw.filter(r => r.scores !== null);
    const unscoredItems = raw.filter(r => r.scores === null);

    if (unscoredItems.length > 0) {
        console.warn(`[Skipping] ${unscoredItems.length} item(s) have no worker score (failed all retries) — excluded from judging, still need a worker re-run.`);
    }

    const sampled = sample(scoredItems, SAMPLE_RATE);
    const sampledNames = new Set(sampled.map(s => s.name));
    console.log(`[Job 2 judge] ${scoredItems.length} scored items, sampling ${sampled.length} (${Math.round(SAMPLE_RATE * 100)}%) via ${MODEL}...`);

    const batches = chunk(sampled, BATCH_SIZE);
    const judged = [];
    for (let i = 0; i < batches.length; i++) {
        console.log(`[Judge batch ${i + 1}/${batches.length}] scoring ${batches[i].length} items...`);
        judged.push(...await judgeBatch(batches[i]));
    }
    const judgeMap = new Map(judged.filter(j => j.scores !== null).map(j => [j.name, j.scores]));

    const reviewQueue = [];
    scoredItems.forEach(item => {
        if (!sampledNames.has(item.name)) return; // not sampled — no judge opinion, passes through
        const judgeScores = judgeMap.get(item.name);
        if (!judgeScores) return; // judge call failed for this one — leave worker score as-is, don't silently flag
        const diffs = diffAtoms(item.scores, judgeScores);
        if (Object.keys(diffs).length > 0) {
            reviewQueue.push({ name: item.name, type: item.type, workerScores: item.scores, judgeScores, disagreements: diffs });
        }
    });

    const flaggedNames = new Set(reviewQueue.map(r => r.name));
    const final = scoredItems.filter(item => !flaggedNames.has(item.name));

    fs.writeFileSync(FINAL_PATH, JSON.stringify(final, null, 2));
    fs.writeFileSync(REVIEW_PATH, JSON.stringify(reviewQueue, null, 2));

    console.log(`[Done] ${final.length} item(s) auto-passed (unsampled, or sampled + agreed within ${DISAGREEMENT_THRESHOLD} pts on every atom) -> ${FINAL_PATH}`);
    console.log(`[Done] ${reviewQueue.length} item(s) flagged for manual review -> ${REVIEW_PATH}`);
    if (reviewQueue.length > 0) {
        console.log(`[Review sample] ${reviewQueue.slice(0, 5).map(r => r.name).join(', ')}${reviewQueue.length > 5 ? ', ...' : ''}`);
    }
}

run().catch(err => {
    console.error('[Fatal]', err);
    process.exit(1);
});
