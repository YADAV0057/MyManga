// ==========================================
// MENU DRAWER (js/menuDrawer.js)
// ==========================================

// Pre-defined set of highly distinct themes to cycle through
const THEMES = [
    '😊 happy',        // Dark Amber
    '😭 sad',          // Abyss Blue
    '🔥 hype',         // Smoldering Red
    '👻 spooky',       // Void Purple
    '🍵 chill',        // Dark Teal
    '🎀 cute'          // Dark Fuchsia
];

let currentThemeIndex = 0;

export function openMenu() {
    const drawer = document.getElementById('menu-drawer');
    const overlay = document.getElementById('menu-overlay');
    if (!drawer || !overlay) return;

    overlay.classList.add('open');
    drawer.classList.add('open');
    document.body.style.overflow = 'hidden';
}

export function closeMenu() {
    const drawer = document.getElementById('menu-drawer');
    const overlay = document.getElementById('menu-overlay');
    if (!drawer || !overlay) return;

    overlay.classList.remove('open');
    drawer.classList.remove('open');
    document.body.style.overflow = '';
}

export function cycleTheme() {
    currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
    const newTheme = THEMES[currentThemeIndex];
    
    if (window.applyMoodTheme) {
        window.applyMoodTheme(newTheme);
    }
}

