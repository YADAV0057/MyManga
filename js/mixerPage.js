// ==========================================
// MOOD MIXER PAGE (js/mixerPage.js)
// ==========================================
// STEP 2: the homepage "Mood Mixer" panel now only decides which 1-2 moods
// are actively being blended for an *instant* search (see moods.js, Step 1).
// This file is the dedicated page it opens into: pick up to 2 moods, add
// extra genre chips, set status/length filters, and submit once to see a
// full grid of matches — instead of every tap re-searching immediately.
//
// STEP 2 FIX (too-few-results bug): only each selected mood's own genre
// pair goes into the hard genre filter (usually 2, rarely 4 genres).
// Manually-picked genre chips are never sent as a hard filter.
//
// STEP 6: picking mood(s) blends their theme.js colors into the page's own
// background (separate from the site-wide --bg-dark), and selected chips
// get a subtle animated glow/shift — purely visual, isolated to this page.
//
// STEP 7: picking exactly 2 moods shows a live "named blend" preview line
// (js/mixerBlends.js — curated pairs + generated fallback).
//
// STEP 8: the first time a given mood pair is actually mixed (submitted),
// an unlock toast fires once; tried pairs are tracked in localStorage so it
// never re-fires for a repeat combo, same pattern as favorites.js's local
// persistence.
//
// REWIRED (search-engine cutover), per "wiring search engine" Notion log
// Entry 16's Phase 3 decision:
//   - STEP 3 (the old ⭐ match-%/"Why?" panel scoring) was REMOVED, not
//     faked, at the time of this cutover. The engine's per-result scoring
//     existed (rankResults.js), but for Mixer's request shape (hard
//     filters.genres + no free text) the emotionMatch/genreMatch signals
//     saturated to 1/0 and collapsed to a popularity sort dressed up as a
//     mood match (confirmed live, Entry 26). Showing a match % badge backed
//     by a saturated/meaningless number would've been worse than not
//     showing one.
//   - The whole old-engine scorer chain (recommendationScorer.js,
//     MangaIntent, CONCEPT_PROPERTIES/harvested_knowledge.js) is gone —
//     none of it exists in the new engine anyway (rip-out list, Entry 14).
//   - Fetch now goes to CONFIG.SEARCH_ENGINE_URL. Selected mood genres
//     still go in as a hard filters.genres (matching the old "only mood
//     genres are a hard filter" rule above). Selected mood LABELS (not
//     genres) plus manually-picked genre chips are sent as the free-text
//     query — partly to satisfy the engine's non-empty-query requirement
//     (confirmed 400 on empty query, Entry 26), partly so the engine's own
//     classifier/mood pipeline still gets real signal to work with.
//   - Chapter-range filtering stays client-side, unchanged — engine's
//     filters.maxChapters is accepted but confirmed dead server-side
//     (Entry 17), same as it always needed a client-side pass.
//
// RESTORED (Backend Update List follow-up): rankResults.js's
// computeRankingWeights()/genreMatchScore() now factor in filters.genres
// directly, not just classifier query-text terms — the saturate-to-0/1
// problem above is fixed at the source, so the badge/panel is no longer
// backed by a meaningless number. No changes needed in THIS file:
// getMangaCardHTML() (renderer.js) never stopped reading
// factSheet.matchScore/matchReasons, and normalizeResult()
// (resultNormalizer.js) now maps the engine's finalScore/_rankDebug onto
// those fields instead of dropping them. This file just needed its stale
// "no downstream change" claim above corrected.
//
// Isolation note: self-contained like landing/, using the same "fixed
// overlay toggled by a .open class" pattern as mangaDetail.js (no router
// needed).

import { allMoods } from './moods.js';
import { CONFIG } from './config.js';
import { normalizeResult } from './resultNormalizer.js';
import { getMangaCardHTML } from './renderer.js';
import { blendMoodColors } from './theme.js';
import { getBlendInfo } from './mixerBlends.js';

const VIEW_ID = 'mixer-view';

const GENRE_OPTIONS = [
    'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
    'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life',
    'Sports', 'Supernatural', 'Thriller', 'Mecha', 'Music', 'Mahou Shoujo'
];

const STATUS_OPTIONS = [
    { value: '', label: 'Any status' },
    { value: 'RELEASING', label: 'Releasing' },
    { value: 'FINISHED', label: 'Completed' },
    { value: 'NOT_YET_RELEASED', label: 'Upcoming' },
    { value: 'HIATUS', label: 'On hiatus' }
];

const LENGTH_OPTIONS = [
    { value: '', label: 'Any length' },
    { value: 'short', label: 'Short (under 50 chapters)' },
    { value: 'medium', label: 'Medium (50–200 chapters)' },
    { value: 'long', label: 'Long (200+ chapters)' }
];

// STEP 8: which mood pairs (sorted "labelA+labelB" keys) this device has
// already mixed at least once. Local-only, no Firestore — this is a small
// gamification nicety, not core data worth syncing cross-device.
const TRIED_BLENDS_KEY = 'mangamood_mixer_tried_blends';

function readTriedBlends() {
    try {
        return new Set(JSON.parse(localStorage.getItem(TRIED_BLENDS_KEY)) || []);
    } catch (e) {
        return new Set();
    }
}

function writeTriedBlends(set) {
    try {
        localStorage.setItem(TRIED_BLENDS_KEY, JSON.stringify(Array.from(set)));
    } catch (e) {
        console.warn('[mixerPage.js] Could not persist tried blends locally.', e);
    }
}

let triedBlends = readTriedBlends();

// This page's own selection state — deliberately separate from moods.js's
// homepage selection (Step 1), since picking a mood here should NOT fire
// an instant search; it just builds up the filter set until "Find My Mix".
let selectedMoodIndexes = [];
let selectedGenres = new Set();

function ensureViewEl() {
    let el = document.getElementById(VIEW_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = VIEW_ID;
        el.className = 'mixer-view';
        document.body.appendChild(el);
        el.innerHTML = buildMarkup();
        wireEvents(el);
    }
    return el;
}

function buildMarkup() {
    const moodChips = allMoods.map((m, i) =>
        `<button type="button" class="mixer-chip" data-mood-index="${i}">${m.label}</button>`
    ).join('');

    const genreChips = GENRE_OPTIONS.map(g =>
        `<button type="button" class="mixer-chip mixer-chip--compact" data-genre="${g}">${g}</button>`
    ).join('');

    const statusOpts = STATUS_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
    const lengthOpts = LENGTH_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('');

    return `
        <div class="mixer-scroll">
            <button class="mixer-back-btn" id="mixer-back-btn" aria-label="Back">‹</button>

            <div class="mixer-header">
                <h1>🔮 Mood Mixer</h1>
                <p>Pick up to 2 moods, stack on genres, and dial in filters — we'll find your match.</p>
            </div>

            <div class="mixer-card">
                <h3><span class="mixer-step-num">1</span>Pick your moods <span class="mixer-hint" id="mixer-mood-hint">Tap up to 2</span></h3>
                <div class="mixer-chip-grid">${moodChips}</div>
                <div class="mixer-blend-preview" id="mixer-blend-preview"></div>
            </div>

            <div class="mixer-card">
                <h3><span class="mixer-step-num">2</span>Add genres <span class="mixer-hint" id="mixer-genre-hint">Boosts matches, optional</span></h3>
                <div class="mixer-chip-grid mixer-chip-grid--compact">${genreChips}</div>
            </div>

            <div class="mixer-card">
                <h3><span class="mixer-step-num">3</span>Filters</h3>
                <div class="mixer-filter-row">
                    <label class="mixer-filter">
                        <span>Status</span>
                        <select id="mixer-status-select">${statusOpts}</select>
                    </label>
                    <label class="mixer-filter">
                        <span>Length</span>
                        <select id="mixer-length-select">${lengthOpts}</select>
                    </label>
                </div>
            </div>

            <div class="mixer-footer">
                <button class="mixer-submit-btn" id="mixer-submit-btn">Find My Mix</button>
            </div>

            <section class="mixer-results-section" id="mixer-results-section" style="display:none;">
                <div class="mixer-results-header">
                    <h2>Your Mix</h2>
                    <span id="mixer-results-count"></span>
                </div>
                <div class="grid" id="mixer-results-grid"></div>
            </section>
        </div>
    `;
}

function updateMoodHint() {
    const hint = document.getElementById('mixer-mood-hint');
    if (!hint) return;
    if (selectedMoodIndexes.length === 0) hint.textContent = 'Tap up to 2';
    else if (selectedMoodIndexes.length === 1) hint.textContent = `${allMoods[selectedMoodIndexes[0]].label} — tap 1 more`;
    else hint.textContent = `${allMoods[selectedMoodIndexes[0]].label} + ${allMoods[selectedMoodIndexes[1]].label}`;
}

function updateMixerBlend() {
    const view = document.getElementById(VIEW_ID);
    if (!view) return;
    const labels = selectedMoodIndexes.map(i => allMoods[i].label);
    view.style.setProperty('--mixer-blend', blendMoodColors(labels));
}

// STEP 7: live preview line, only shown once exactly 2 moods are picked.
function updateBlendPreview() {
    const preview = document.getElementById('mixer-blend-preview');
    if (!preview) return;
    if (selectedMoodIndexes.length !== 2) {
        preview.textContent = '';
        preview.classList.remove('visible');
        return;
    }
    const [a, b] = selectedMoodIndexes.map(i => allMoods[i].label);
    const info = getBlendInfo(a, b);
    preview.textContent = `✨ ${info.name} — ${info.blurb}`;
    preview.classList.add('visible');
}

function wireEvents(root) {
    root.querySelector('#mixer-back-btn')?.addEventListener('click', closeMixerPage);

    // Mood chips — max 2, oldest drops when a 3rd is picked (same rolling
    // behavior as the homepage chips in moods.js, for consistency).
    root.querySelectorAll('.mixer-chip[data-mood-index]').forEach(chip => {
        chip.addEventListener('click', () => {
            const idx = Number(chip.dataset.moodIndex);
            const pos = selectedMoodIndexes.indexOf(idx);

            if (pos !== -1) {
                selectedMoodIndexes.splice(pos, 1);
                chip.classList.remove('selected');
            } else {
                if (selectedMoodIndexes.length >= 2) {
                    const droppedIdx = selectedMoodIndexes.shift();
                    root.querySelector(`.mixer-chip[data-mood-index="${droppedIdx}"]`)?.classList.remove('selected');
                }
                selectedMoodIndexes.push(idx);
                chip.classList.add('selected');
            }
            updateMoodHint();
            updateMixerBlend();
            updateBlendPreview();
        });
    });

    // Genre chips — unlimited multi-select. Not sent as a hard filter
    // (that's mood-only, see file header) — folded into the free-text
    // query as soft signal instead. Unlike mood genres, these don't get
    // the filters.genres hard-filter treatment, so they score through
    // queryGenreTerms (via the engine's own classifier) rather than the
    // filterGenres path restored above.
    root.querySelectorAll('.mixer-chip[data-genre]').forEach(chip => {
        chip.addEventListener('click', () => {
            const genre = chip.dataset.genre;
            if (selectedGenres.has(genre)) {
                selectedGenres.delete(genre);
                chip.classList.remove('selected');
            } else {
                selectedGenres.add(genre);
                chip.classList.add('selected');
            }
        });
    });

    root.querySelector('#mixer-submit-btn')?.addEventListener('click', runMixerSearch);
}

function collectMoodGenres() {
    const fromMoods = selectedMoodIndexes.flatMap(i =>
        allMoods[i].query.split(',').map(s => s.trim())
    );
    return Array.from(new Set(fromMoods)).filter(Boolean);
}

function chapterRangeFor(lengthValue) {
    if (lengthValue === 'short') return { max: 50 };
    if (lengthValue === 'medium') return { min: 50, max: 200 };
    if (lengthValue === 'long') return { min: 200 };
    return {};
}

// STEP 8: fires the unlock toast the first time this exact mood pair is
// mixed on this device. No-op for 0 or 1 selected moods — "a blend" means
// two moods combined, not a single mood.
function checkNewBlend() {
    if (selectedMoodIndexes.length !== 2) return;
    const [a, b] = selectedMoodIndexes.map(i => allMoods[i].label);
    const key = [a, b].sort().join('+');
    if (triedBlends.has(key)) return;

    triedBlends.add(key);
    writeTriedBlends(triedBlends);

    const info = getBlendInfo(a, b);
    showMixerToast(`🎉 New blend discovered: ${info.name}!`);
}

function showMixerToast(message) {
    const view = document.getElementById(VIEW_ID);
    if (!view) return;
    let toast = view.querySelector('.mixer-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'mixer-toast';
        view.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('show');
    void toast.offsetWidth; // force reflow so re-triggering restarts the animation
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

// Small local fetch-with-timeout wrapper, same pattern used across the
// other rewired files.
async function postToSearchEngine(body, timeoutMs = CONFIG.REQUEST_TIMEOUT) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(CONFIG.SEARCH_ENGINE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`Search engine responded ${res.status}`);
        return await res.json();
    } catch (e) {
        clearTimeout(timeout);
        throw e;
    }
}

async function runMixerSearch() {
    const grid = document.getElementById('mixer-results-grid');
    const section = document.getElementById('mixer-results-section');
    const countEl = document.getElementById('mixer-results-count');
    const submitBtn = document.getElementById('mixer-submit-btn');
    if (!grid || !section) return;

    checkNewBlend();

    const moodGenres = collectMoodGenres();
    const moodLabels = selectedMoodIndexes.map(i => allMoods[i].label);
    const extraGenres = Array.from(selectedGenres);
    const statusValue = document.getElementById('mixer-status-select')?.value || '';
    const lengthValue = document.getElementById('mixer-length-select')?.value || '';
    const { min: minChapters, max: maxChapters } = chapterRangeFor(lengthValue);

    section.style.display = 'block';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Mixing…';
    countEl.textContent = '';
    grid.innerHTML = renderSkeletons(8);
    section.scrollIntoView({ behavior: 'smooth' });

    try {
        // NOTE: the engine hard-rejects an empty query string with a 400
        // (Entry 26). Mood labels + any extra genre chips become the
        // free-text query — real signal for the engine's own
        // classifier/mood pipeline, even though this page no longer reads
        // a per-result score back out of it (see file header).
        const query = [...moodLabels, ...extraGenres].join(' ') || 'manga';

        const data = await postToSearchEngine({
            domain: 'manga',
            query,
            filters: {
                genres: moodGenres,
                status: statusValue || undefined,
                page: 1,
                perPage: 30
            }
        });

        const raw = data.results || [];
        let results = raw.map(m => normalizeResult(m, m.source || 'AniList'));

        results = results.filter(m => {
            const ch = typeof m.chapters === 'number' ? m.chapters : parseInt(m.chapters, 10);
            if (isNaN(ch)) return true;
            if (typeof minChapters === 'number' && ch < minChapters) return false;
            if (typeof maxChapters === 'number' && ch > maxChapters) return false;
            return true;
        });

        grid.innerHTML = '';
        if (results.length === 0) {
            grid.innerHTML = '<p class="mixer-empty">No matches for this mix yet — try loosening a filter or dropping a genre.</p>';
        } else {
            results.forEach(r => {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = getMangaCardHTML(r).trim();
                if (wrapper.firstElementChild) grid.appendChild(wrapper.firstElementChild);
            });
        }
        countEl.textContent = `${results.length} match${results.length === 1 ? '' : 'es'}`;
    } catch (e) {
        console.error('[mixerPage.js] search failed:', e);
        grid.innerHTML = '<p class="mixer-empty">Something went wrong finding your mix — try again.</p>';
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Find My Mix';
    }
}

function renderSkeletons(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton-cover"></div>
                <div class="skeleton-info">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-meta" style="margin-top:5px;margin-bottom:12px;"></div>
                    <div class="skeleton-line skeleton-text"></div>
                </div>
            </div>`;
    }
    return html;
}

export function openMixerPage() {
    const view = ensureViewEl();
    updateMixerBlend();
    void view.offsetWidth; // force reflow so the transition plays
    view.classList.add('open');
    document.body.classList.add('mixer-open');
    view.querySelector('.mixer-scroll')?.scrollTo(0, 0);
}

export function closeMixerPage() {
    const view = document.getElementById(VIEW_ID);
    if (!view) return;
    view.classList.remove('open');
    document.body.classList.remove('mixer-open');
}
