// ==========================================
// MODE SWITCHER (js/modeSwitcher.js)
// ==========================================
// Replaces the old Manga/Movies pill toggle (.mode-toggle in movies.css)
// with a dropdown that scales past two options. Add a new entry to
// MODES below when TV Shows / Books ship — no markup or CSS changes
// needed elsewhere, both index.html and movies.html import this same
// module and mount it into #mode-switcher-mount.
//
// available:false entries render as disabled "Soon" rows instead of
// links, so upcoming categories can be teased without shipping a
// broken page for them.

const MODES = [
    { key: 'manga',  label: 'Manga',  icon: '📖', href: './index.html',  available: true },
    { key: 'movies', label: 'Movies', icon: '🎬', href: './movies.html', available: true },
    { key: 'tv',     label: 'TV Shows', icon: '📺', href: null, available: false },
    { key: 'books',  label: 'Books', icon: '📚', href: null, available: false },
];

function buildMenuHTML(activeKey) {
    return MODES.map(m => {
        if (!m.available) {
            return `<li role="option"><span class="mode-switcher-item disabled">${m.icon} ${m.label} <em>Soon</em></span></li>`;
        }
        const activeClass = m.key === activeKey ? 'active' : '';
        return `<li role="option"><a href="${m.href}" class="mode-switcher-item ${activeClass}">${m.icon} ${m.label}</a></li>`;
    }).join('');
}

/**
 * Mounts the dropdown into `container`. `activeKey` should be 'manga' or
 * 'movies' (whichever page is currently loaded).
 */
export function initModeSwitcher(container, activeKey) {
    if (!container) return;
    const active = MODES.find(m => m.key === activeKey) || MODES[0];

    container.innerHTML = `
        <div class="mode-switcher" id="mode-switcher">
            <button class="mode-switcher-btn" id="mode-switcher-btn" aria-haspopup="listbox" aria-expanded="false">
                <span>${active.icon} ${active.label}</span>
                <span class="mode-switcher-chevron">▾</span>
            </button>
            <ul class="mode-switcher-menu" role="listbox">
                ${buildMenuHTML(activeKey)}
            </ul>
        </div>
    `;

    const root = container.querySelector('#mode-switcher');
    const btn = container.querySelector('#mode-switcher-btn');

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = root.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
        if (!root.contains(e.target)) {
            root.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
}

