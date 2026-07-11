#!/usr/bin/env node
/**
 * job3_1_harvestSplit.cjs — Job 3.1: queryable/phrase-only split +
 * tag reconciliation + harvest-time synopsis cache.
 *
 * One combined batch pass (per plan doc Section 2/3):
 *   1. For every taxonomy item, query AniList + Jikan.
 *      - Real genres/themes came back  -> queryable
 *      - Nothing came back             -> phrase-only (Job 3.2's input)
 *   2. Every individual genre/tag string seen in the API responses gets
 *      checked against job2_final.json. Not there yet -> queued for Job 2.
 *   3. Every manga touched along the way gets its synopsis grabbed and
 *      cached (Firestore, NOT a repo file — this is unbounded per-manga
 *      data, same reasoning as mangaProfiles.js's existing cache).
 *
 * IMPORTANT LIMITATION (read before relying on the synopsis cache):
 * Job 3.2 hasn't produced real generated phrases yet, so this pass can
 * only check synopses against the taxonomy's own item NAMES (a
 * bootstrap signal), not the richer natural-language phrases Job 3.2
 * will eventually produce ("brother complex", "slow burn romance",
 * etc.). Once phrases.json exists, re-run with PHRASE_ENRICH_PASS=1 to
 * fill in the richer matches on the same cached docs — this is
 * additive, not a rebuild.
 *
 * Usage: node job3_1_harvestSplit.cjs <taxonomy_path>
 *
 * Env vars:
 *   FIREBASE_SERVICE_ACCOUNT  - JSON service account key (same secret
 *                               deploy.yml already uses). Required for
 *                               the synopsis cache step; everything
 *                               else in this script still runs and
 *                               produces its JSON outputs without it —
 *                               the cache step just gets skipped with a
 *                               warning, it does not fail the run.
 */

const admin = require('firebase-admin');

// Local run: point at the downloaded key
// CI run: build the credential from the FIREBASE_SERVICE_ACCOUNT secret instead
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('/absolute/path/to/moodmanga-firebase-adminsdk.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;
const QUERYABLE_PATH = path.join(OUT_DIR, 'queryable.json');
const PHRASE_ONLY_PATH = path.join(OUT_DIR, 'phraseOnly.json');
const NEW_TAGS_QUEUE_PATH = path.join(OUT_DIR, 'newTagsQueue.json');
const PROGRESS_PATH = path.join(OUT_DIR, 'job3_1_progress.json');
const JOB2_FINAL_PATH = path.join(OUT_DIR, 'job2_final.json');

const RPM_SPACING_MS = 1500; // stay well under AniList/Jikan free-tier limits
const MAX_RETRIES = 2;

function loadJSON(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function saveJSON(p, data) { fs.writeFileSync(p, JSON.stringify(data, null, 2)); }
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ---------------------------------------------------------------------
// Local copies of the AniList/Jikan fetch logic (deliberately NOT
// require()'d from HarvesterAPI.js — that file is an ES module, this
// script is CommonJS, and package.json's "type":"module" means
// require() can't load it, same reasoning as atoms.js's fallback
// pattern in scoreTagAtoms.worker.cjs). Extended vs. HarvesterAPI.js to
// also pull each result's stable media id + raw synopsis text, which
// getNormalizedConcept() doesn't expose.
// ---------------------------------------------------------------------

async function fetchFromAniList(name) {
  const query = `query ($search: String) { Page(page: 1, perPage: 5) { media(search: $search, type: MANGA) { id genres tags { name } description(asHtml: false) } } }`;
  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { search: name } }),
    });
    const json = await res.json();
    const media = json?.data?.Page?.media || [];
    return media.map((m) => ({
      source: 'anilist',
      id: `anilist-${m.id}`,
      genres: m.genres || [],
      tags: (m.tags || []).map((t) => t.name),
      synopsis: m.description || '',
    }));
  } catch (err) {
    console.log(`[Job 3.1] AniList fetch failed for "${name}": ${err.message}`);
    return [];
  }
}

async function fetchFromJikan(name) {
  try {
    const res = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(name)}&limit=5`);
    const json = await res.json();
    const data = json?.data || [];
    return data.map((m) => ({
      source: 'jikan',
      id: `jikan-${m.mal_id}`,
      genres: (m.genres || []).map((g) => g.name),
      tags: (m.themes || []).map((t) => t.name),
      synopsis: m.synopsis || '',
    }));
  } catch (err) {
    console.log(`[Job 3.1] Jikan fetch failed for "${name}": ${err.message}`);
    return [];
  }
}

// ---------------------------------------------------------------------
// Firestore (synopsis cache) — optional, degrades gracefully if the
// service-account env var isn't present or firebase-admin isn't
// installed. This is the FIRST script in this repo writing to Firestore
// from Node/Actions (everything else touching Firestore is client-side,
// firebase.js's web SDK), so failures here are treated as non-fatal —
// the queryable/phraseOnly/newTagsQueue outputs (the parts Job 2/3.2
// actually depend on) must still complete either way.
// ---------------------------------------------------------------------

let firestoreDb = null;
function initFirestoreAdmin() {
  if (firestoreDb) return firestoreDb;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    console.log('[Job 3.1] No FIREBASE_SERVICE_ACCOUNT set — synopsis cache step will be skipped, everything else still runs.');
    return null;
  }
  try {
    // eslint-disable-next-line global-require
    const admin = require('firebase-admin');
    const serviceAccount = JSON.parse(raw);
    if (!admin.apps.length) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    firestoreDb = admin.firestore();
    return firestoreDb;
  } catch (err) {
    console.log(`[Job 3.1] Firestore admin init failed (${err.message}) — synopsis cache step will be skipped.`);
    return null;
  }
}

async function writeSynopsisCache(db, mangaId, patch) {
  if (!db) return;
  try {
    const ref = db.collection('synopsisPhraseCache').doc(mangaId);
    await ref.set({ ...patch, cachedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.log(`[Job 3.1] Firestore write failed for ${mangaId}: ${err.message}`);
  }
}

// Bootstrap phrase source: taxonomy item names themselves, since Job
// 3.2's real generated phrases don't exist yet (see file header).
function findNameMatchesInText(text, names) {
  if (!text) return [];
  const lower = text.toLowerCase();
  return names.filter((n) => lower.includes(n.toLowerCase()));
}

async function main() {
  const taxonomyPath = process.argv[2];
  if (!taxonomyPath) {
    console.error('Usage: node job3_1_harvestSplit.cjs <taxonomy_path>');
    process.exit(1);
  }

  const taxonomy = loadJSON(taxonomyPath, []);
  if (!taxonomy.length) {
    console.error(`No items found at ${taxonomyPath}`);
    process.exit(1);
  }

  const scored = loadJSON(JOB2_FINAL_PATH, []);
  const scoredNames = new Set(scored.map((s) => s.name));
  const allTaxonomyNames = taxonomy.map((t) => t.name);

  const queryable = loadJSON(QUERYABLE_PATH, []);
  const phraseOnly = loadJSON(PHRASE_ONLY_PATH, []);
  const newTagsQueue = loadJSON(NEW_TAGS_QUEUE_PATH, []);
  const newTagsSeen = new Set(newTagsQueue.map((t) => t.name));

  const progress = loadJSON(PROGRESS_PATH, { doneNames: [] });
  const doneNames = new Set(progress.doneNames);
  const remaining = taxonomy.filter((t) => !doneNames.has(t.name));

  console.log(`[Job 3.1] ${taxonomy.length} total, ${remaining.length} remaining, ${doneNames.size} already processed.`);

  const db = initFirestoreAdmin();

  for (const item of remaining) {
    let results = [];
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      const [aniList, jikan] = await Promise.all([fetchFromAniList(item.name), fetchFromJikan(item.name)]);
      results = [...aniList, ...jikan];
      if (results.length > 0 || attempt === MAX_RETRIES) break;
      await sleep(RPM_SPACING_MS);
    }

    const totalGenresThemes = results.reduce((sum, r) => sum + r.genres.length + r.tags.length, 0);

    if (totalGenresThemes > 0) {
      queryable.push({ name: item.name, type: item.type, sources: [...new Set(results.map((r) => r.source))] });

      // Tag reconciliation: every genre/tag string seen, not just the
      // search term itself, gets checked against the scored set.
      for (const r of results) {
        for (const g of [...r.genres.map((g) => (typeof g === 'string' ? g : g.name)), ...r.tags]) {
          if (!scoredNames.has(g) && !newTagsSeen.has(g)) {
            newTagsSeen.add(g);
            newTagsQueue.push({ name: g, type: 'tag', discoveredVia: item.name });
          }
        }
      }
    } else {
      phraseOnly.push({ name: item.name, type: item.type });
    }

    // Synopsis cache — bootstrap pass (taxonomy names only, see header).
    for (const r of results) {
      if (!r.synopsis) continue;
      const nameMatches = findNameMatchesInText(r.synopsis, allTaxonomyNames);
      const tagDensity = r.tags.length;
      const genreDensity = r.genres.length;
      // eslint-disable-next-line no-await-in-loop
      await writeSynopsisCache(db, r.id, {
        source: r.source,
        bootstrapNameMatches: nameMatches,
        tagDensity,
        genreDensity,
        phraseEnriched: false, // flips to true once a Job-3.2-phrase pass runs
      });
    }

    doneNames.add(item.name);
    progress.doneNames = [...doneNames];
    saveJSON(PROGRESS_PATH, progress);
    saveJSON(QUERYABLE_PATH, queryable);
    saveJSON(PHRASE_ONLY_PATH, phraseOnly);
    saveJSON(NEW_TAGS_QUEUE_PATH, newTagsQueue);

    await sleep(RPM_SPACING_MS);
  }

  console.log(`[Job 3.1] Done. queryable=${queryable.length} phraseOnly=${phraseOnly.length} newTagsQueue=${newTagsQueue.length}`);
  if (!db) console.log('[Job 3.1] Reminder: synopsis cache was skipped (no FIREBASE_SERVICE_ACCOUNT) — re-run with it set to backfill.');
}

main().catch((err) => { console.error('[Job 3.1] Fatal:', err); process.exit(1); });
