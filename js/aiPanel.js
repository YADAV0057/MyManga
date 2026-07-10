// ==========================================
// AI SEARCH INTELLIGENCE PANEL (js/aiPanel.js)
// ==========================================
// NEW MODULE. Replaces the old standalone "Mood Intelligence Preview" /
// #mood-preview-board debug section (formerly wired by setupParserTester.js,
// which manually re-ran buildIntent() against its own separate input box).
// setupParserTester.js is no longer used anywhere and can be deleted.
//
// This panel is now driven by the REAL search — search.js calls into this
// module at each stage of triggerSearch() (intent built -> API waterfall ->
// results scored) so what the user sees is exactly what happened to their
// actual query, not a parallel simulation.
//
// DOM contract (index.html):
//   #ai-panel            - outer <section>, toggled via .hidden
//   #ai-panel-live        - "while searching" view: reasoning lines + API chips
//   #ai-panel-summary     - "search finished" compact bar (icon, confidence, toggle)
//   #ai-confidence-pill   - confidence % text inside the summary bar
//   #ai-panel-toggle      - "▼ Details" button, expands #ai-panel-details
//   #ai-panel-details     - full breakdown (mood bars, must/nice/avoid, route, rules)

import { sleep, escapeHTML } from './utils.js';

const API_LABELS = {
    cache: 'Cache',
    anilist: 'AniList',
    jikan: 'Jikan',
    kitsu: 'Kitsu',
    mangadex: 'MangaDex'
};

const API_ICONS = {
    pending: '⏳',
    success: '✓',
    fail: '✗',
    skip: '—'
};

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
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
// STAGE 1: "reading your request" — plays before any API call fires
// ===============================
export async function runIntentAnimation(intent) {
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
    appendLine(live, '🧠 Reading your request...', 'ai-line-lead');

    const lines = buildReasoningLines(intent);
    for (const text of lines) {
        await sleep(180);
        appendLine(live, `✓ ${text}`);
    }

    await sleep(150);
    appendLine(live, '🔎 Searching manga databases...', 'ai-line-status');
}

function buildReasoningLines(intent) {
    const lines = [];

    if (intent.moodProfile && intent.moodProfile.length > 0) {
        lines.push(`Detected ${intent.moodProfile[0].name}`);
    }
    (intent.genres || []).slice(0, 2).forEach(g => lines.push(`Looking for ${g.name}`));
    (intent.themes || []).slice(0, 1).forEach(t => lines.push(`Boosting ${t.name} manga`));

    const avoidList = [...(intent.avoids?.genres || []), ...(intent.avoids?.themes || [])];
    if (avoidList.length > 0) lines.push(`Avoiding ${avoidList.slice(0, 2).join(', ')}`);

    if (lines.length === 0) lines.push('Analyzing your request');
    return lines.slice(0, 5); // keeps the animation to ~1 second, per design intent
}

function appendLine(container, text, extraClass = '') {
    const div = document.createElement('div');
    div.className = `ai-line ${extraClass}`.trim();
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// ===============================
// STAGE 2: live API waterfall progress
// ===============================
// status: 'pending' | 'success' | 'fail' | 'skip'
export function setApiTierStatus(tier, status) {
    const live = document.getElementById('ai-panel-live');
    if (!live) return;

    let row = document.getElementById('ai-api-row');
    if (!row) {
        row = document.createElement('div');
        row.id = 'ai-api-row';
        row.className = 'ai-api-row';
        live.appendChild(row);
    }

    let chip = document.getElementById(`ai-api-${tier}`);
    if (!chip) {
        chip = document.createElement('span');
        chip.id = `ai-api-${tier}`;
        chip.className = 'ai-api-chip';
        row.appendChild(chip);
    }

    chip.className = `ai-api-chip ai-api-${status}`;
    chip.textContent = `${API_LABELS[tier] || tier} ${API_ICONS[status] || ''}`;
    live.scrollTop = live.scrollHeight;
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
export function settlePanel(intent) {
    const live = document.getElementById('ai-panel-live');
    const summary = document.getElementById('ai-panel-summary');
    const pill = document.getElementById('ai-confidence-pill');

    if (live) {
        live.classList.add('hidden');
        live.innerHTML = '';
    }
    if (summary) summary.classList.remove('hidden');
    if (pill) pill.textContent = `${Math.round((intent.confidence ?? 0) * 100)}% confidence`;

    renderDetails(intent);
}

function renderDetails(intent) {
    const details = document.getElementById('ai-panel-details');
    if (!details) return;

    const moodBars = (intent.moodProfile || []).map(m => `
        <div class="ai-mood-bar">
        
            <div class="ai-mood-bar-label">
                <span>${escapeHTML(capitalize(m.name))}</span>
                <span>${m.percent}%</span>
            </div>
            <div class="ai-mood-bar-track">
                <div class="ai-mood-bar-fill" style="width:${m.percent}%"></div>
            </div>
        </div>
    `).join('') || '<p class="ai-empty">No strong mood detected</p>';
const debugVector = `<p style="font-size:10px;opacity:0.6">vector: ${JSON.stringify(intent.moodVector)}</p>`;
    const mustHave = [...(intent.genres || []), ...(intent.themes || [])].map(x => x.name);
    const niceToHave = [...(intent.boosts?.genres || []), ...(intent.boosts?.themes || [])].map(x => x.name);
    const avoid = [...(intent.avoids?.genres || []), ...(intent.avoids?.themes || [])];

    const tagGroup = (list, cls, symbol) =>
        list.length > 0
            ? list.map(n => `<span class="ai-tag ${cls}">${symbol} ${escapeHTML(n)}</span>`).join('')
            : '<span class="ai-empty">None</span>';

    const route = (intent.searchPriority && intent.searchPriority.length > 0)
        ? intent.searchPriority.join(' → ')
        : 'Default waterfall';

    const reasoning = (intent.ruleLogs && intent.ruleLogs.length > 0)
        ? intent.ruleLogs.map(l => `<li>${escapeHTML(l)}</li>`).join('')
        : '<li class="ai-empty">No special rules triggered</li>';

    details.innerHTML = `
        <div class="ai-detail-section">
            <h4>Mood Analysis</h4>
            <div class="ai-mood-bars"> ${debugVector}</div>
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
            <ul class="ai-reasoning-list">${reasoning}</ul>
        </div>
    `;
}

