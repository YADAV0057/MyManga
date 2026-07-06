// js/parser/dictionary.js

// 1. Add Urgency Modifiers
export const URGENCY_MODIFIERS = {
    // Amplifiers
    "devastating": 1.5,
    "destroy": 1.5,
    "need": 1.3,
    "extremely": 1.4,
    "really": 1.2,
    "very": 1.2,
    "super": 1.2,
    
    // Dampeners
    "mild": 0.6,
    "chill": 0.7,
    "little": 0.8,
    "somewhat": 0.8
};

// 2. Add Tone to Core Dictionary (Positive, Negative, Neutral)
export const MOOD_DICTIONARY = {
    // 😭 SAD & EMOTIONAL (Negative Tone, High Base Intensity)
    "cry": { moods: ["sad", "emotional", "tragedy"], intensity: 0.9, tone: "negative" },
    "depressing": { moods: ["sad", "dark", "psychological"], intensity: 1.0, tone: "negative" },
    "bittersweet": { moods: ["sad", "romance", "emotional"], intensity: 0.7, tone: "neutral" },

    // 🥰 ROMANCE & FLUFF (Positive Tone, Lower Base Intensity)
    "romance": { moods: ["romance", "emotional"], intensity: 0.6, tone: "positive" },
    "fluff": { moods: ["wholesome", "romance", "happy"], intensity: 0.4, tone: "positive" },
    "healing": { moods: ["wholesome", "sliceoflife", "soft"], intensity: 0.3, tone: "positive" },

    // 💀 DARK & EDGY (Negative Tone, High Base Intensity)
    "dark": { moods: ["dark", "serious", "psychological"], intensity: 0.8, tone: "negative" },
    "revenge": { moods: ["dark", "revenge", "action"], intensity: 0.9, tone: "negative" },
    "gory": { moods: ["horror", "dark", "action"], intensity: 1.0, tone: "negative" },

    // 😂 COMEDY (Positive Tone, Medium Intensity)
    "funny": { moods: ["comedy"], intensity: 0.6, tone: "positive" },
    "hilarious": { moods: ["comedy", "parody"], intensity: 0.9, tone: "positive" },
    
    // 🤯 MIND-BENDING (Neutral Tone, High Intensity)
    "mindfuck": { moods: ["psychological", "mystery", "thriller"], intensity: 1.0, tone: "neutral" }
};
