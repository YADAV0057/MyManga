// ==========================================
// AI SEARCH INTELLIGENCE PANEL (js/aiPanel.js)
// ==========================================
// REWIRED 2026-07-17 (Notion "wiring search engine" Entry 33, following on
// from Entry 32) to consume the NEW Supabase engine's response fields
// directly, instead of the old client-side buildIntent()'s MangaIntent
// object. The old pipeline (parser/pipeline.js, moodEngine.js, ruleEngine.js
// etc.) is gone — mood/routing/classification are now computed server-side,
// INSIDE the same POST that returns results, not as a separate client-side
// pre-step. That has two real consequences for this file, not just a
// find-and-replace of field names:
//
// 1. STAGE 1 (runIntentAnimation) used to show real per-line reasoning
//    ("Detected melancholy", "Looking for Romance", ...) built from the
//    client-side intent BEFORE any fetch fired. There is no data to show
//    at that point anymore — the reasoning only exists once the response
//    comes back. This stage is now a generic "thinking" indicator only.
//
// 2. STAGE 2 (setApiTierStatus) used to animate live per-source chips
//    (AniList pending -> Jikan pending -> Kitsu success, etc.) because
//    search.js called it once per waterfall attempt. The waterfall now
//    runs entirely inside the Edge Function — the client only ever learns
//    the single `source` that won (or `cached: true`). This function is
//    kept as a documented no-op so it doesn't throw if search.js still
//    calls it, but it no longer drives an animation. Recommend deleting
//    the call sites in search.js once confirmed safe.
//
// EXPECTED CALL CONTRACT (for whoever finishes/updates search.js):
//   await runIntentAnimation(query)                    // before the fetch
//   const response = await fetch(...).then(r => r.json())
//   await finishAnimation(response.results?.length ?? 0)
//   settlePanel(response, query)                       // after the fetch
//
// `response` is the raw JSON body of POST /functions/v1/search:
//   { results, cached, source, mood, page, hasMore, routing, classification }
// `mood`/`routing`/`classification` are ALL omitted on a cache hit
// (search_cache only ever stores `results` — confirmed in index.ts's own
// comments) — every helper below handles that as a normal case, not an
// error.
//
// DOM contract (index.html) — UNCHANGED:
//   #ai-panel            - outer <section>, toggled via .hidden
//   #ai-panel-live        - "while searching" view: reasoning lines + API chips
//   #ai-panel-summary     - "search finished" compact bar (icon, confidence, toggle)
//   #ai-confidence-pill   - confidence % text inside the summary bar
//   #ai-panel-toggle      - "▼ Details" button, expands #ai-panel-details
//   #ai-panel-details     - full breakdown (mood bars, must/nice/avoid, route, rules)

import { sleep, escapeHTML } from './utils.js';

const CATEGORY_LABELS = {
    TITLE: 'Title match',
    GENRE: 'Genre',
    TAG: 'Tag',
    EMOTION: 'Mood'
};

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function prettyGenre(name) {
    // routing/classification genre strings are plain labels (e.g. "Slice of
    // Life", "psychological") straight out of MANGA_ROUTING / matched
    // lexicon terms — normalize casing only, don't assume a fixed format.
    if (!name) return '';
    return name
        .split(' ')
        .map((w) => capitalize(w))
        .join(' ');
}

// ===============================
// SETUP (called once from main.js)
// ===============================
export function initAIPanel() {
    const toggleBtn = document.getElementById('ai-panel-toggle');
    const details = document.getElementById('ai-panel-details');
    if (!toggleBtn || !details) return;

    toggleBtn.addEventListener('click', () => {
        const open = details.classList.toggle('open');
        details.classList.toggle('hidden', !open);
        toggleBtn.textContent = open ? '▲ Details' : '▼ Details';
        toggleBtn.setAttribute('aria-expanded', String(open));
    });
}

// ===============================
// VISIBILITY
// ===============================
export function hideAIPanel() {
    const panel = document.getElementById('ai-panel');
    if (panel) panel.classList.add('hidden');
}

// ===============================
// STAGE 1: "reading your request" — plays before the fetch fires.
// No real reasoning data exists yet (see header note #1), so this is now a
// generic thinking indicator, not a per-line reveal.
// ===============================
export async function runIntentAnimation(query) {
    const panel = document.getElementById('ai-panel');
    const live = document.getElementById('ai-panel-live');
    const summary = document.getElementById('ai-panel-summary');
    const details = document.getElementById('ai-panel-details');
    const toggleBtn = document.getElementById('ai-panel-toggle');
    if (!panel || !live) return;

    panel.classList.remove('hidden');
    live.classList.remove('hidden');
    summary?.classList.add('hidden');
    details?.classList.add('hidden');
    details?.classList.remove('open');
    if (toggleBtn) { toggleBtn.textContent = '▼ Details'; toggleBtn.setAttribute('aria-expanded', 'false'); }

    live.innerHTML = '';
    const trimmed = (query || '').trim();
    appendLine(live, trimmed ? `🧠 Reading "${escapeHTML(trimmed)}"...` : '🧠 Reading your request...', 'ai-line-lead');
    await sleep(200);
    appendLine(live, '🔎 Searching manga databases...', 'ai-line-status');
}

function appendLine(container, text, extraClass = '') {
    const div = document.createElement('div');
    div.className = `ai-line ${extraClass}`.trim();
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// ===============================
// STAGE 2: per-source waterfall chips — DEPRECATED, see header note #2.
// Kept as a documented no-op so old call sites in search.js don't throw.
// ===============================
export function setApiTierStatus(_tier, _status) {
    // no-op — the waterfall runs server-side now, the client never sees
    // individual tier attempts. Nothing to render here anymore.
    return;
}

// ===============================
// STAGE 3: ranking + "done"
// ===============================
export async function finishAnimation(resultCount) {
    const live = document.getElementById('ai-panel-live');
    if (!live) return;

    const label = typeof resultCount === 'number' ? resultCount.toLocaleString() : resultCount;
    appendLine(live, `📊 Ranking ${label} match${resultCount === 1 ? '' : 'es'}...`, 'ai-line-status');
    await sleep(220);
    appendLine(live, '✨ Done!', 'ai-line-done');
    await sleep(320);
}

// ===============================
// STAGE 4: settle into the compact summary + collapsible details
// ===============================
// `response` is the raw JSON body of POST /functions/v1/search:
// { results, cached, source, mood, page, hasMore, routing, classification }
export function settlePanel(response, query) {
    const live = document.getElementById('ai-panel-live');
    const summary = document.getElementById('ai-panel-summary');
    const pill = document.getElementById('ai-confidence-pill');

    if (live) {
        live.classList.add('hidden');
        live.innerHTML = '';
    }
    if (summary) summary.classList.remove('hidden');

    const panelData = buildPanelData(response || {}, query);

    if (pill) pill.textContent = panelData.confidenceText;

    renderDetails(panelData);
}

// ===============================
// Turns a raw backend response into everything the details view needs.
// Handles the cache-hit case (mood/routing/classification all absent) as a
// normal, expected shape — not an error path.
// ===============================
function buildPanelData(response, query) {
    const { cached, source, mood, routing, classification } = response;

    // --- Mood bars ---
    // mood.aggregate is a plain {tone: score} object (e.g. {positive: 3,
    // negative: 10}, sometimes a richer taxonomy from the custom lexicon
    // table). Normalize into percentages of the total signal so bars are
    // comparable regardless of the raw magnitude.
    let moodBars = [];
    if (mood?.aggregate && Object.keys(mood.aggregate).length > 0) {
        const entries = Object.entries(mood.aggregate).filter(([, v]) => Number(v) !== 0);
        const total = entries.reduce((sum, [, v]) => sum + Math.abs(Number(v)), 0);
        if (total > 0) {
            moodBars = entries
                .map(([name, v]) => ({ name, percent: Math.round((Math.abs(Number(v)) / total) * 100) }))
                .sort((a, b) => b.percent - a.percent);
        }
    }

    // --- Must / nice / avoid tags ---
    // Must have: real matched vocab terms from the query classifier (actual
    // genre/tag names it recognized, not raw query words).
    const mustHave = Array.isArray(classification?.genreTerms) ? [...classification.genreTerms] : [];
    // Nice to have: genres the mood signal is soft-boosting in ranking.
    const niceToHave = Array.isArray(routing?.boostGenres)
        ? routing.boostGenres.map((b) => prettyGenre(b.genre))
        : [];
    // Avoid: genres hard-excluded by the mood signal.
    const avoid = Array.isArray(routing?.excludeGenres) ? routing.excludeGenres.map(prettyGenre) : [];

    // --- Route line ---
    const route = cached ? 'Cache' : source ? capitalize(source) : 'No source responded';

    // --- Reasoning lines ---
    const reasoning = [];
    if (Array.isArray(classification?.ranked)) {
        classification.ranked
            .filter((c) => c.score > 0)
            .slice(0, 3)
            .forEach((c) => reasoning.push(`Detected ${CATEGORY_LABELS[c.category] || c.category.toLowerCase()} signal`));
    }
    if (niceToHave.length > 0) reasoning.push(`Boosting ${niceToHave.slice(0, 3).join(', ')} based on mood`);
    if (avoid.length > 0) reasoning.push(`Avoiding ${avoid.slice(0, 3).join(', ')} based on mood`);
    if (cached) reasoning.push('Served from cache — no fresh reasoning trail for this result set');

    // --- Confidence ---
    // No per-title/per-query confidence score exists server-side today.
    // Approximate from the classifier's top category score when we have
    // one; cache hits carry no signal at all, so label them explicitly
    // rather than show a fabricated percentage.
    let confidenceText;
    if (cached) {
        confidenceText = 'Cached result';
    } else {
        const topScore = classification?.ranked?.[0]?.score;
        const pct = typeof topScore === 'number' ? Math.max(0, Math.min(100, Math.round(topScore * 100))) : null;
        confidenceText = pct !== null ? `${pct}% confidence` : '— confidence';
    }

    return { moodBars, mustHave, niceToHave, avoid, route, reasoning, confidenceText, cached };
}

function renderDetails(panelData) {
    const details = document.getElementById('ai-panel-details');
    if (!details) return;

    const { moodBars, mustHave, niceToHave, avoid, route, reasoning, cached } = panelData;

    const moodBarsHTML = moodBars.length > 0
        ? moodBars.map((m) => `
            <div class="ai-mood-bar">
                <div class="ai-mood-bar-label">
                    <span>${escapeHTML(capitalize(m.name))}</span>
                    <span>${m.percent}%</span>
                </div>
                <div class="ai-mood-bar-track">
                    <div class="ai-mood-bar-fill" style="width:${m.percent}%"></div>
                </div>
            </div>
        `).join('')
        : `<p class="ai-empty">${cached ? 'No mood data on cached results' : 'No strong mood detected'}</p>`;

    const tagGroup = (list, cls, symbol) =>
        list.length > 0
            ? list.map((n) => `<span class="ai-tag ${cls}">${symbol} ${escapeHTML(n)}</span>`).join('')
            : '<span class="ai-empty">None</span>';

    const reasoningHTML = reasoning.length > 0
        ? reasoning.map((l) => `<li>${escapeHTML(l)}</li>`).join('')
        : '<li class="ai-empty">No special rules triggered</li>';

    details.innerHTML = `
        <div class="ai-detail-section">
            <h4>Mood Analysis</h4>
            <div class="ai-mood-bars">${moodBarsHTML}</div>
        </div>

        <div class="ai-detail-section ai-tag-columns">
            <div>
                <h4>Must Have</h4>
                <div class="ai-tag-group">${tagGroup(mustHave, 'ai-tag-must', '✓')}</div>
            </div>
            <div>
                <h4>Nice to Have</h4>
                <div class="ai-tag-group">${tagGroup(niceToHave, 'ai-tag-nice', '✓')}</div>
            </div>
            <div>
                <h4>Avoid</h4>
                <div class="ai-tag-group">${tagGroup(avoid, 'ai-tag-avoid', '✕')}</div>
            </div>
        </div>

        <div class="ai-detail-section">
            <h4>API Strategy</h4>
            <p class="ai-route">${escapeHTML(route)}</p>
        </div>

        <div class="ai-detail-section">
            <h4>Reasoning</h4>
            <ul class="ai-reasoning-list">${reasoningHTML}</ul>
        </div>
    `;
}
