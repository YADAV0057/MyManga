// ==========================================
// DYNAMIC THEME ENGINE (js/theme.js)
// ==========================================

// Every single mood has its own unique, vibrant jewel tone. 
const MOOD_COLORS = {
    // Joy & Energy (Vibrant Yellows, Oranges, Bright Greens)
    '😊 happy': '#d97706',         // Vibrant Amber
    '😂 laugh out loud': '#ca8a04', // Bright Gold
    '🌟 inspiring': '#f59e0b',      // Glowing Yellow
    '🐶 wholesome': '#65a30d',      // Fresh Lime
    '🤪 chaotic': '#ea580c',        // Bright Orange
    '🃏 mischievous': '#84cc16',    // Acid Green

    // Sadness & Melancholy (Deep Blues, Cool Grays)
    '😭 sad': '#1e40af',            // Deep Royal Blue
    '🌧️ melancholic': '#3730a3',    // Indigo
    '💔 heartbroken': '#9f1239',    // Deep Crimson
    '🏚️ lonely': '#334155',         // Slate Blue
    '🩹 hopeful': '#0ea5e9',        // Bright Sky Blue

    // Action & Intensity (Reds, Burnt Oranges)
    '🔥 hype': '#dc2626',           // Pure Red
    '⚡ adrenaline': '#e11d48',      // Vibrant Rose
    '⚔️ epic': '#b91c1c',           // Strong Red
    '🥋 sweaty': '#c2410c',         // Burnt Orange
    '🦸 heroic': '#2563eb',         // Heroic Blue
    '💪 overpowered': '#991b1b',    // Dark Red
    '🕴️ fearless': '#be123c',       // Crimson
    '🎸 rebellious': '#be185d',     // Punk Pink
    '🗡️ revenge': '#881337',        // Blood Red
    '⏳ intense': '#7f1d1d',        // Dark Ruby

    // Love & Comfort (Pinks, Warm Browns)
    '💕 romantic': '#db2777',       // Bright Pink
    '☕ cozy': '#92400e',           // Warm Cinnamon
    '🧸 heartwarming': '#f43f5e',   // Soft Rose
    '🎀 cute': '#ec4899',           // Bubblegum Pink

    // Chill & Nature (Teals, Emeralds, Greens)
    '🍵 chill': '#0d9488',          // Calming Teal
    '🌿 peaceful': '#059669',       // Emerald Green
    '🗺️ wanderlust': '#16a34a',     // Bright Forest Green
    '🍳 gourmet': '#b45309',        // Caramel Brown

    // Mystery, Magic & Fear (Purples, Violets, Magentas)
    '👻 spooky': '#6b21a8',         // Eerie Purple
    '🦇 gloomy': '#475569',         // Stormy Blue
    '🕯️ paranormal': '#581c87',     // Dark Violet
    '🕵️ mysterious': '#4c1d95',     // Deep Purple
    '🔮 magical': '#8b5cf6',        // Bright Violet
    '🪄 dreamy': '#d946ef',         // Bright Fuchsia
    '👑 royal': '#7c3aed',          // Royal Purple
    '⛩️ mythological': '#a21caf',   // Magenta
    '🖤 edgy': '#171717',           // Pitch Black

    // Intellect & Sci-Fi (Navys, Cyans, Indigos)
    '🧠 big brain': '#4338ca',      // Bright Indigo
    '🌀 mind-bending': '#6d28d9',   // Deep Violet
    '📖 philosophical': '#1e3a8a',  // Navy Blue
    '♟️ strategic': '#1d4ed8',      // Sharp Blue
    '🎖️ tactical': '#3f6212',       // Olive Green
    '🦾 tech-savvy': '#0284c7',     // Cyber Cyan
    '🎒 academic': '#78350f',       // Leather Brown
    '🦉 sleepless': '#312e81',      // Midnight Indigo
    '🚬 gritty': '#4b5563',         // Ash Gray

    // Concepts
    '✨ escapism': '#c026d3',       // Vibrant Fuchsia
    '📼 nostalgic': '#d97706',      // Sepia Amber
    '📈 ambitious': '#047857'       // Success Green
};

export function applyMoodTheme(moodLabel) {
    // Standardize the label for exact matching
    const cleanLabel = (moodLabel || '').toLowerCase().trim();
    
    // Find the specific vibrant color, or fallback to default AniList dark blue
    const newBgColor = MOOD_COLORS[cleanLabel] || '#0b1622';

    // Apply it directly to the root background variable
    document.documentElement.style.setProperty('--bg-dark', newBgColor);
}
