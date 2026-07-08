// ==========================================
// TAG WEIGHT CALCULATOR (js/parser/dictionary/weightCalculator.js)
// ==========================================
// Computes REAL, concept-specific genre/theme weights via co-occurrence lift
// against a corpus baseline. Replaces HarvesterAPI.js's old approach:
//   (a) free-text searching the concept's NAME against manga titles/synopses
//       (AniList `search`, Jikan `q=`) — which only finds manga whose TITLE
//       happens to contain the word (e.g. "Iyashikei"), completely unrelated
//       to which manga are actually tagged Iyashikei.
//   (b) a static global WEIGHT_MAP + hardcoded 0.80 for every theme, which
//       assigns the exact same weight to a genre/theme no matter which
//       concept it's being scored for — i.e. no concept-specific signal at
//       all, just a fixed prior.
//
// Method: pull N manga that AniList says ACTUALLY carry this genre/tag
// (genre_in / tag_in — real membership, not a text match), tally how often
// every other genre/theme co-occurs in that sample, then subtract each one's
// baseline frequency across the general manga population (lift = P(G | has
// concept) - P(G | overall)). A genre that's just generically common (e.g.
// "Shounen" appears on a huge fraction of all manga) gets pulled back toward
// 0 instead of inflating every concept's weights equally.

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASELINE_PATH = path.join(__dirname, 'baseline_frequencies.json');

const ANILIST_URL = 'https://graphql.anilist.co';
const SAMPLE_SIZE = 40;            // manga pulled per concept to compute weights from
const BASELINE_SIZE = 200;         // manga pulled once to build the general-population baseline
const BASELINE_MAX_AGE_DAYS = 30;  // re-fetch the baseline periodically as AniList's catalog shifts
const LIFT_FLOOR = 0.05;           // co-occurrences below this lift are treated as noise, not signal

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const MEDIA_QUERY_BY_GENRE = `
    query ($genre: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
            media(genre_in: [$genre], type: MANGA, sort: POPULARITY_DESC) {
                genres
                tags { name }
            }
        }
    }
`;

const MEDIA_QUERY_BY_TAG = `
    query ($tag: String, $page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
            media(tag_in: [$tag], type: MANGA, sort: POPULARITY_DESC) {
                genres
                tags { name }
            }
        }
    }
`;

const MEDIA_QUERY_BASELINE = `
    query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
            media(type: MANGA, sort: POPULARITY_DESC) {
                genres
                tags { name }
            }
        }
    }
`;

async function fetchAniListPage(query, variables, page, perPage) {
    try {
        const res = await axios.post(ANILIST_URL, { query, variables: { ...variables, page, perPage } });
        return res.data?.data?.Page?.media || [];
    } catch (e) {
        console.warn(`[weightCalculator] AniList fetch failed: ${e.message}`);
        return [];
    }
}

/** Tallies genre/theme frequency across a sample of media. */
function tally(mediaList) {
    const genres = new Map();
    const themes = new Map();
    mediaList.forEach(m => {
        (m.genres || []).forEach(g => genres.set(g, (genres.get(g) || 0) + 1));
        (m.tags || []).forEach(t => themes.set(t.name, (themes.get(t.name) || 0) + 1));
    });
    return { genres, themes, total: mediaList.length };
}

/**
 * Loads (or builds + disk-caches) the general-population genre/theme
 * frequency table used as the "baseline" every concept's lift is measured
 * against. Cached to baseline_frequencies.json so this expensive multi-page
 * fetch doesn't re-run on every single harvester invocation.
 */
export async function getBaselineFrequencies({ forceRefresh = false } = {}) {
    if (!forceRefresh && fs.existsSync(BASELINE_PATH)) {
        try {
            const cached = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
            const ageDays = (Date.now() - new Date(cached.generatedAt).getTime()) / 86400000;
            if (ageDays < BASELINE_MAX_AGE_DAYS) return cached;
        } catch (e) { /* fall through and rebuild */ }
    }

    console.log('[weightCalculator] Building baseline frequency table...');
    const perPage = 50;
    const pages = Math.ceil(BASELINE_SIZE / perPage);
    let all = [];
    for (let p = 1; p <= pages; p++) {
        const page = await fetchAniListPage(MEDIA_QUERY_BASELINE, {}, p, perPage);
        all = all.concat(page);
        if (p < pages) await sleep(700); // be polite to AniList's rate limit
    }

    const { genres, themes, total } = tally(all);
    const baseline = {
        generatedAt: new Date().toISOString(),
        sampleSize: total,
        genreFreq: Object.fromEntries([...genres.entries()].map(([k, v]) => [k, v / total])),
        themeFreq: Object.fromEntries([...themes.entries()].map(([k, v]) => [k, v / total]))
    };
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 4));
    console.log(`[weightCalculator] Baseline built from ${total} manga.`);
    return baseline;
}

/**
 * Computes concept-specific genre/theme weights for `conceptName` via
 * co-occurrence lift against the baseline. Tries genre_in first (works for
 * real AniList genre names, e.g. "Action"), falls back to tag_in (works for
 * tag-only concepts, e.g. "Iyashikei", "Revenge") since AniList doesn't let
 * you query both in one filter.
 */
export async function computeConceptWeights(conceptName) {
    const baseline = await getBaselineFrequencies();

    let sample = await fetchAniListPage(MEDIA_QUERY_BY_GENRE, { genre: conceptName }, 1, SAMPLE_SIZE);
    let matchedVia = 'genre';
    if (sample.length === 0) {
        await sleep(700);
        sample = await fetchAniListPage(MEDIA_QUERY_BY_TAG, { tag: conceptName }, 1, SAMPLE_SIZE);
        matchedVia = 'tag';
    }

    if (sample.length === 0) {
        console.warn(`[weightCalculator] No AniList matches for "${conceptName}" via genre or tag.`);
        return { genres: [], themes: [], sampleSize: 0, matchedVia: null };
    }

    const { genres, themes, total } = tally(sample);

    const toWeightedList = (freqMap, baselineFreq) => {
        const lifts = [];
        freqMap.forEach((count, name) => {
            const p = count / total;
            const base = baselineFreq[name] || 0.01; // small floor so an ultra-rare baseline tag doesn't spike
            const lift = p - base;
            if (lift > LIFT_FLOOR) lifts.push({ name, lift });
        });
        const max = Math.max(...lifts.map(l => l.lift), 0.0001);
        return lifts
            .map(l => ({ name: l.name, weight: parseFloat(Math.min(1, l.lift / max).toFixed(2)) }))
            .sort((a, b) => b.weight - a.weight);
    };

    return {
        genres: toWeightedList(genres, baseline.genreFreq),
        themes: toWeightedList(themes, baseline.themeFreq),
        sampleSize: total,
        matchedVia // "genre" | "tag" — which AniList filter actually found this concept
    };
}
