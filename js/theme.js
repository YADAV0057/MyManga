// ==========================================
// DYNAMIC THEME ENGINE (js/theme.js)
// ==========================================

// We only change --bg-dark to create a subtle ambient glow. 
// Cards, text, and buttons remain your standard default colors!
const THEMES = {
    // --- THE BASE DEFAULT ---
    default: { '--bg-dark': '#0b1622' },

    // --- BLUES (Calm, Intellect, Sadness) ---
    midnight_blue: { '--bg-dark': '#09101a' },
    steel_blue: { '--bg-dark': '#0a1017' },
    abyss_blue: { '--bg-dark': '#04080f' },

    // --- REDS & ORANGES (Action, Anger, Energy) ---
    dark_crimson: { '--bg-dark': '#140808' },
    rust_orange: { '--bg-dark': '#170c08' },
    blood_red: { '--bg-dark': '#0a0000' },

    // --- PINKS & MAUVES (Love, Comfort, Cute) ---
    dusky_rose: { '--bg-dark': '#170c12' },
    soft_plum: { '--bg-dark': '#140c14' },
    warm_blush: { '--bg-dark': '#1a1011' },

    // --- GREENS (Peace, Nature, Growth) ---
    forest_green: { '--bg-dark': '#05120c' },
    sage_green: { '--bg-dark': '#0c1410' },
    swamp_green: { '--bg-dark': '#0a0f0a' },

    // --- PURPLES (Mystery, Magic, Fear) ---
    deep_violet: { '--bg-dark': '#0f0a14' },
    obsidian_purple: { '--bg-dark': '#07040a' },
    
    // --- YELLOWS & BROWNS (Joy, Chaos, Nostalgia) ---
    dark_amber: { '--bg-dark': '#171108' },
    sepia_brown: { '--bg-dark': '#14110e' }
};

// Maps all 50 specific moods to their ambient background colors
const MOOD_TO_THEME_MAP = {
    // Joy & Energy
    '😊 happy': 'dark_amber',
    '😂 laugh out loud': 'dark_amber',
    '🤪 chaotic': 'rust_orange',
    '🌟 inspiring': 'sepia_brown',
    '🃏 mischievous': 'rust_orange',
    '🐶 wholesome': 'sage_green',

    // Sadness & Melancholy
    '😭 sad': 'abyss_blue',
    '🌧️ melancholic': 'midnight_blue',
    '💔 heartbroken': 'abyss_blue',
    '🏚️ lonely': 'steel_blue',
    '🩹 hopeful': 'midnight_blue',

    // Action & Intensity
    '🔥 hype': 'rust_orange',
    '⚡ adrenaline': 'dark_crimson',
    '⚔️ epic': 'dark_crimson',
    '🥋 sweaty': 'rust_orange',
    '🦸 heroic': 'rust_orange',
    '💪 overpowered': 'dark_crimson',
    '🕴️ fearless': 'blood_red',
    '🎸 rebellious': 'blood_red',
    '🗡️ revenge': 'blood_red',
    '⏳ intense': 'blood_red',

    // Love & Comfort
    '💕 romantic': 'dusky_rose',
    '☕ cozy': 'warm_blush',
    '🧸 heartwarming': 'warm_blush',
    '🎀 cute': 'soft_plum',

    // Chill & Nature
    '🍵 chill': 'sage_green',
    '🌿 peaceful': 'forest_green',
    '🗺️ wanderlust': 'forest_green',
    '🍳 gourmet': 'sage_green',

    // Mystery, Magic & Fear
    '👻 spooky': 'obsidian_purple',
    '🦇 gloomy': 'obsidian_purple',
    '🕯️ paranormal': 'obsidian_purple',
    '🕵️ mysterious': 'deep_violet',
    '🔮 magical': 'deep_violet',
    '🪄 dreamy': 'soft_plum',
    '👑 royal': 'deep_violet',
    '⛩️ mythological': 'deep_violet',
    '🖤 edgy': 'blood_red',

    // Intellect & Sci-Fi
    '🧠 big brain': 'midnight_blue',
    '🌀 mind-bending': 'obsidian_purple',
    '📖 philosophical': 'steel_blue',
    '♟️ strategic': 'steel_blue',
    '🎖️ tactical': 'steel_blue',
    '🦾 tech-savvy': 'midnight_blue',
    '🎒 academic': 'sepia_brown',
    '🦉 sleepless': 'abyss_blue',
    '🚬 gritty': 'swamp_green',
    
    // Concepts
    '✨ escapism': 'deep_violet',
    '📼 nostalgic': 'sepia_brown',
    '📈 ambitious': 'dark_amber'
};

export function applyMoodTheme(moodLabel) {
    const cleanLabel = (moodLabel || '').toLowerCase().trim();
    const themeKey = MOOD_TO_THEME_MAP[cleanLabel] || 'default';
    const selectedTheme = THEMES[themeKey];

    const root = document.documentElement;
    for (const [property, color] of Object.entries(selectedTheme)) {
        root.style.setProperty(property, color);
    }
}
