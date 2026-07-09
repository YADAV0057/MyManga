// ==========================================
// DYNAMIC THEME ENGINE (js/theme.js)
// ==========================================

// DEEP CINEMA TONES: 
// Darker, richer shades to ensure text remains highly readable.
export const MOOD_COLORS = {
    // Joy & Energy (Deep Ambers & Dark Golds)
    '😊 happy': '#78350f',         // Dark Amber
    '😂 laugh out loud': '#713f12', // Deep Bronze
    '🌟 inspiring': '#92400e',      // Rich Caramel
    '🐶 wholesome': '#3f6212',      // Dark Olive
    '🤪 chaotic': '#7c2d12',        // Deep Rust
    '🃏 mischievous': '#4d7c0f',    // Dark Moss

    // Sadness & Melancholy (Midnight & Abyss Blues)
    '😭 sad': '#172554',            // Abyss Blue
    '🌧️ melancholic': '#1e3a8a',    // Midnight Blue
    '💔 heartbroken': '#4c0519',    // Very Dark Crimson
    '🏚️ lonely': '#0f172a',         // Deep Slate
    '🩹 hopeful': '#0369a1',        // Deep Ocean Blue

    // Action & Intensity (Smoldering Crimsons)
    '🔥 hype': '#7f1d1d',           // Smoldering Red (Fixed brightness)
    '⚡ adrenaline': '#881337',      // Deep Ruby
    '⚔️ epic': '#450a0a',           // Pitch Red
    '🥋 sweaty': '#7c2d12',         // Dark Burnt Orange
    '🦸 heroic': '#1e3a8a',         // Dark Heroic Blue
    '💪 overpowered': '#450a0a',    // Pitch Red
    '🕴️ fearless': '#4c0519',       // Deep Blood Red
    '🎸 rebellious': '#831843',     // Dark Magenta
    '🗡️ revenge': '#4c0519',        // Deep Blood Red
    '⏳ intense': '#450a0a',        // Pitch Red

    // Love & Comfort (Deep Plums & Warm Woods)
    '💕 romantic': '#831843',       // Deep Plum
    '☕ cozy': '#451a03',           // Dark Espresso
    '🧸 heartwarming': '#881337',   // Deep Rose
    '🎀 cute': '#701a75',           // Dark Fuchsia

    // Chill & Nature (Deep Forests & Teals)
    '🍵 chill': '#0f766e',          // Dark Teal
    '🌿 peaceful': '#064e3b',       // Midnight Forest
    '🗺️ wanderlust': '#14532d',     // Deep Pine
    '🍳 gourmet': '#78350f',        // Dark Caramel

    // Mystery, Magic & Fear (Void Purples)
    '👻 spooky': '#3b0764',         // Void Purple
    '🦇 gloomy': '#1e293b',         // Stormy Slate
    '🕯️ paranormal': '#2e1065',     // Pitch Violet
    '🕵️ mysterious': '#2e1065',     // Pitch Violet
    '🔮 magical': '#4c1d95',        // Deep Violet
    '🪄 dreamy': '#701a75',         // Dark Magenta
    '👑 royal': '#3b0764',          // Royal Plum
    '⛩️ mythological': '#4a044e',   // Deep Purple
    '🖤 edgy': '#000000',           // Pure Black

    // Intellect & Sci-Fi (Dark Cyans & Indigos)
    '🧠 big brain': '#312e81',      // Dark Indigo
    '🌀 mind-bending': '#2e1065',   // Pitch Violet
    '📖 philosophical': '#172554',  // Abyss Blue
    '♟️ strategic': '#1e3a8a',      // Midnight Blue
    '🎖️ tactical': '#14532d',       // Deep Pine
    '🦾 tech-savvy': '#0369a1',     // Dark Cyber Blue
    '🎒 academic': '#451a03',       // Dark Leather
    '🦉 sleepless': '#1e1b4b',      // Pitch Indigo
    '🚬 gritty': '#1f2937',         // Charcoal

    // Concepts
    '✨ escapism': '#701a75',       // Dark Magenta
    '📼 nostalgic': '#713f12',      // Deep Bronze
    '📈 ambitious': '#064e3b'       // Midnight Forest
};

export function applyMoodTheme(moodLabel) {
    const cleanLabel = (moodLabel || '').toLowerCase().trim();
    
    // Fallback to the standard AniList deep blue if no match is found
    const newBgColor = MOOD_COLORS[cleanLabel] || '#0b1622';

    document.documentElement.style.setProperty('--bg-dark', newBgColor);
}

function moodColorFor(label) {
    const clean = (label || '').toLowerCase().trim();
    return MOOD_COLORS[clean] || '#0b1622';
}

// STEP 6 (Mood Mixer visual overhaul): blends 1-2 selected moods' own theme
// colors into a CSS gradient string for the Mixer page's background. Kept
// separate from applyMoodTheme()/--bg-dark above on purpose — the Mixer is
// a self-contained overlay (see mixerPage.js's isolation note), so picking
// a mood there shouldn't repaint the rest of the site's theme underneath it.
export function blendMoodColors(labels) {
    const colors = (labels || []).map(moodColorFor);
    if (colors.length === 0) {
        return 'radial-gradient(circle at 30% 20%, #171233 0%, var(--bg-dark, #0c0a16) 70%)';
    }
    if (colors.length === 1) {
        return `radial-gradient(circle at 30% 20%, ${colors[0]} 0%, var(--bg-dark, #0c0a16) 75%)`;
    }
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 55%, var(--bg-dark, #0c0a16) 100%)`;
}
