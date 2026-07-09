// ==========================================
// MOOD MIXER PAGE (js/mixerPage.js) 
// ==========================================
// STEP 2: the homepage "Mood Mixer" panel now only decides which 1-2 moods
// are actively being blended for an *instant* search (see moods.js, Step 1).
// This file is the dedicated page it opens into: pick up to 2 moods, add
// extra genre chips, set status/length filters, and submit once to see a
// full grid of matches — instead of every tap re-searching immediately.
//
// STEP 2 FIX (too-few-results bug): AniList's genre_in is an AND filter
// across the whole array, not "any of these" — see PROJECT_BRIEF Section 1.
// Approach (c) from the brief: only each selected mood's own genre pair
// goes into the AniList genre_in query (so usually 2, rarely 4 genres).
// Manually-picked genre chips are no longer sent to AniList at all — they're
// used client-side after fetching, to sort results by how many of those
// chips they overlap with (rawGenres/themes), rather than hard-filtering
// them out. This avoids the 0-result problem for chip combos that don't
// exist in the same title, while still surfacing better matches first.
//
// Isolation note: self-contained like landing/, using the same "fixed
// overlay toggled by a .open class" pattern as mangaDetail.js (no router
// needed). Only imports from outside this file: allMoods (moods.js, pure
// data), buildPlanFromGenreList (searchPlanner.js), fetchFromAniListUnified
// (anilist.js), normalizeResult (resultNormalizer.js), and getMangaCardHTML
// (renderer.js, pure string builder — doesn't touch #community-grid).

import { allMoods } from './moods.js';
import { buildPlanFromGenreList } from './parser/searchPlanner.js';
import { fetchFromAniListUnified } from './anilist.js';
import { normalizeResult } from './resultNormalizer.js';
import { getMangaCardHTML } from './renderer.js';

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
        `<button type="button" class="mixer-chip" data-genre="${g}">${g}</button>`
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

            <section class="mixer-section">
                <h3>1. Pick your moods <span class="mixer-hint" id="mixer-mood-hint">Tap up to 2</span></h3>
                <div class="mixer-chip-grid">${moodChips}</div>
            </section>

            <section class="mixer-section">
                <h3>2. Add genres <span class="mixer-hint" id="mixer-genre-hint">Boosts matches, optional</span></h3>
                <div class="mixer-chip-grid">${genreChips}</div>
            </section>

            <section class="mixer-section">
                <h3>3. Filters</h3>
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
            </section>

            <button class="mixer-submit-btn" id="mixer-submit-btn">Find My Mix</button>

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
        });
    });

    // Genre chips — unlimited multi-select. STEP 2 FIX: these no longer feed
    // the AniList genre_in filter directly — see collectMoodGenres/
    // runMixerSearch below. They're used only for client-side overlap sort.
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

// STEP 2 FIX: genres pulled from the selected mood(s) only — this is what
// actually gets sent to AniList as the hard genre_in filter. Usually 2
// genres (1 mood), rarely 4 (2 moods), instead of potentially 5-8 when
// manual genre chips were also being AND-ed in.
function collectMoodGenres() {
    const fromMoods = selectedMoodIndexes.flatMap(i =>
        allMoods[i].query.split(',').map(s => s.trim())
    );
    return Array.from(new Set(fromMoods)).filter(Boolean);
}

// STEP 2 FIX: how many of the manually-picked genre chips a result overlaps
// with, checked against both rawGenres and themes (some concepts like
// "Psychological" show up as a theme rather than a genre on AniList).
// Used only to sort, never to exclude — so an off-mix chip pick can't zero
// out the results the way hard-AND-ing it into genre_in used to.
function overlapScore(result, wantedGenres) {
    if (wantedGenres.size === 0) return 0;
    const have = new Set([
        ...(result.rawGenres || []),
        ...(result.themes || [])
    ].map(g => String(g).toLowerCase()));

    let score = 0;
    wantedGenres.forEach(g => {
        if (have.has(g.toLowerCase())) score++;
    });
    return score;
}

function chapterRangeFor(lengthValue) {
    if (lengthValue === 'short') return { max: 50 };
    if (lengthValue === 'medium') return { min: 50, max: 200 };
    if (lengthValue === 'long') return { min: 200 };
    return {};
}

async function runMixerSearch() {
    const grid = document.getElementById('mixer-results-grid');
    const section = document.getElementById('mixer-results-section');
    const countEl = document.getElementById('mixer-results-count');
    const submitBtn = document.getElementById('mixer-submit-btn');
    if (!grid || !section) return;

    // STEP 2 FIX: only mood genres go to AniList now. Manual genre chips
    // are kept aside in `selectedGenres` for client-side overlap sorting
    // after the fetch, instead of being AND-ed into the same genre_in call.
    const moodGenres = collectMoodGenres();
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
            if (isNaN(ch)) return true; // unknown chapter counts pass through rather than get hidden
            if (typeof minChapters === 'number' && ch < minChapters) return false;
            if (typeof maxChapters === 'number' && ch > maxChapters) return false;
            return true;
        });

        // STEP 2 FIX: sort by overlap with manually-picked genre chips
        // (higher overlap first), stable otherwise — this is the "closer
        // matches float up" behavior replacing the old hard AND-filter.
        if (selectedGenres.size > 0) {
            results = results
                .map((r, i) => ({ r, i, score: overlapScore(r, selectedGenres) }))
                .sort((a, b) => b.score - a.score || a.i - b.i)
                .map(x => x.r);
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
