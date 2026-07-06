// ==========================================
// DYNAMIC THEME ENGINE (js/theme.js)
// ==========================================

const THEMES = {
    // 🌌 The standard AniList dark mode (Default, Sci-Fi, Mystery)
    default: {
        '--bg-dark': '#0b1622',
        '--card-bg': '#151f2e',
        '--accent': '#3db4f2',
        '--accent-hover': '#1184be',
        '--text-main': '#9fadbd',
        '--text-title': '#e5e9f4',
        '--text-muted': '#647380'
    },
    // 🩸 Dark & oppressive (Sad, Spooky, Edgy, Thrillers)
    dark: {
        '--bg-dark': '#09090b',
        '--card-bg': '#18181b',
        '--accent': '#dc2626',
        '--accent-hover': '#991b1b',
        '--text-main': '#a1a1aa',
        '--text-title': '#f4f4f5',
        '--text-muted': '#52525b'
    },
    // 🌸 Soft & warm (Happy, Romantic, Cozy, Cute)
    light: {
        '--bg-dark': '#fdf2f8',
        '--card-bg': '#fce7f3',
        '--accent': '#e11d48',
        '--accent-hover': '#be123c',
        '--text-main': '#475569',
        '--text-title': '#0f172a',
        '--text-muted': '#94a3b8'
    },
    // 🔥 High energy (Hype, Action, Epic, Sports)
    energetic: {
        '--bg-dark': '#1e1b4b',
        '--card-bg': '#312e81',
        '--accent': '#f97316',
        '--accent-hover': '#c2410c',
        '--text-main': '#c7d2fe',
        '--text-title': '#ffffff',
        '--text-muted': '#6366f1'
    },
    // 🍵 Relaxing (Chill, Peaceful, Slice of Life)
    chill: {
        '--bg-dark': '#022c22',
        '--card-bg': '#064e3b',
        '--accent': '#10b981',
        '--accent-hover': '#047857',
        '--text-main': '#a7f3d0',
        '--text-title': '#ffffff',
        '--text-muted': '#059669'
    }
};

export function applyMoodTheme(moodLabel) {
    const name = (moodLabel || '').toLowerCase();
    let themeKey = 'default';

    // Sort moods into their color categories
    if (name.match(/sad|spooky|edgy|lonely|intense|gloomy|philosophical|gritty|paranormal|revenge|heartbroken|sleepless/)) {
        themeKey = 'dark';
    } else if (name.match(/happy|romantic|cozy|cute|heartwarming|dreamy|wholesome|academic/)) {
        themeKey = 'light';
    } else if (name.match(/hype|adrenaline|epic|rebellious|sweaty|overpowered|fearless|ambitious|heroic|tactical|strategic/)) {
        themeKey = 'energetic';
    } else if (name.match(/chill|escapism|peaceful|wanderlust|gourmet|mythological/)) {
        themeKey = 'chill';
    }

    // Inject the new colors into the CSS variables
    const root = document.documentElement;
    for (const [property, color] of Object.entries(THEMES[themeKey])) {
        root.style.setProperty(property, color);
    }
}
