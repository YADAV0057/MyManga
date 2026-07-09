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
// pair goes into AniList's genre_in filter (usually 2, rarely 4 genres).
// Manually-picked genre chips are never sent to AniList as a hard filter.
//
// STEP 3: Mixer results run through the same recommendationScorer.js used
// by the main search flow — manual genre chips go in as intent.boosts.genres
// (extra signal, not a hard filter). Cards get the same ⭐ match % badge and
// "Why?" panel as normal search results.
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
// Isolation note: self-contained like landing/, using the same "fixed
// overlay toggled by a .open class" pattern as mangaDetail.js (no router
// needed).

import { allMoods } from './moods.js';
import { buildPlanFromGenreList } from './parser/searchPlanner.js';
import { fetchFromAniListUnified } from './anilist.js';
import { normalizeResult } from './resultNormalizer.js';
import { getMangaCardHTML } from './renderer.js';
import { scoreResults } from './parser/recommendationScorer.js';
import { MangaIntent } from './parser/intentSchema.js';
import { CONCEPT_PROPERTIES } from './parser/dictionary/properties.js';
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

let CONCEPT_DICTIONARY = { ...CONCEPT_PROPERTIES };
const dictionaryLoadPromise = (async () => {
    try {
        const mod = await import('./parser/dictionary/harvested_knowledge.js');
        CONCEPT_DICTIONARY = { ...mod.HARVESTED_RULES, ...CONCEPT_PROPERTIES };
    } catch (e) {
        console.warn('[mixerPage.js] harvested_knowledge.js not available, using base properties.', e.message);
    }
})();

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
    const el = document.getElementById('mixer-blend-preview');
    if (!el) return;
    if (selectedMoodIndexes.length !== 2) {
        el.classList.remove('visible');
        el.innerHTML = '';
        return;
    }
    const [a, b] = selectedMoodIndexes.map(i => allMoods[i].label);
    const info = getBlendInfo(a, b);
    el.innerHTML = `You're mixing <strong>${info.name}</strong> — ${info.blurb}`;
    el.classList.add('visible');
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

    // Genre chips — unlimited multi-select. Not sent to AniList's genre_in
    // (that's mood-only) — these feed the scorer as extra boost signal.
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

function buildMixerIntent(moodGenres, extraGenres) {
    const intent = new MangaIntent();
    intent.originalQuery = [...moodGenres, ...extraGenres].join(', ');
    intent.confidence = 1.0;
    intent.genres = moodGenres.map(name => ({ name, confidence: 1.0 }));
    intent.moods = selectedMoodIndexes.map(i => allMoods[i].label);
    if (extraGenres.length > 0) {
        intent.boosts.genres = extraGenres.map(name => ({ name, confidence: 1.0 }));
    }
    return intent;
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

async function runMixerSearch() {
    const grid = document.getElementById('mixer-results-grid');
    const section = document.getElementById('mixer-results-section');
    const countEl = document.getElementById('mixer-results-count');
    const submitBtn = document.getElementById('mixer-submit-btn');
    if (!grid || !section) return;

    checkNewBlend();

    const moodGenres = collectMoodGenres();
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
        const plan = buildPlanFromGenreList(moodGenres.length ? moodGenres : ['']);
        if (statusValue) plan.filters.statusFilter = statusValue;

        const raw = await fetchFromAniListUnified(plan, 1, false, 30);
        let results = raw.map(m => normalizeResult(m, 'AniList'));

        results = results.filter(m => {
            const ch = typeof m.chapters === 'number' ? m.chapters : parseInt(m.chapters, 10);
            if (isNaN(ch)) return true;
            if (typeof minChapters === 'number' && ch < minChapters) return false;
            if (typeof maxChapters === 'number' && ch > maxChapters) return false;
            return true;
        });

        if (results.length > 0) {
            const intent = buildMixerIntent(moodGenres, extraGenres);
            await dictionaryLoadPromise;
            results = await scoreResults(results, intent, plan, CONCEPT_DICTIONARY);
        }

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
