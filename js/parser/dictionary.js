// js/parser/dictionary.js


/**
 * MOOD_MAPPINGS
 * Maps internal moods to Genres, Themes, and Demographics.
 * Weights determine how strongly a mood correlates to a specific tag.
 */
export const MOOD_MAPPINGS = {
    // 😭 SAD & EMOTIONAL
    sad: { 
        genres: { Drama: 1.0, Tragedy: 0.9 },
        themes: {},
        demographics: {}
    }, 
    emotional: { 
        genres: { Drama: 0.8, Romance: 0.5, Psychological: 0.4 },
        themes: {},
        demographics: {}
    },
    
    // 💀 DARK & EDGY
    dark: { 
        genres: { Psychological: 1.0, Horror: 0.9, Thriller: 0.8, Mystery: 0.5 },
        themes: { Survival: 0.7, Monsters: 0.5 },
        demographics: { Seinen: 0.8 } 
    },
    serious: { 
        genres: { Drama: 0.8, Psychological: 0.7, Action: 0.5 },
        themes: {},
        demographics: {}
    },
    revenge: {
        genres: { Drama: 1.0, Psychological: 0.9, Action: 0.8, Mystery: 0.4 },
        themes: { Villainess: 0.7 },
        demographics: { Seinen: 0.6, Josei: 0.5 }
    },
    psychological: { 
        genres: { Psychological: 1.0, Mystery: 0.8, Thriller: 0.8 },
        themes: {},
        demographics: {}
    },
    horror: { 
        genres: { Horror: 1.0, Psychological: 0.9, Thriller: 0.8, Supernatural: 0.5 },
        themes: { Survival: 0.8, Monsters: 0.7 },
        demographics: { Seinen: 0.7 }
    },
    mystery: { 
        genres: { Mystery: 1.0, Psychological: 0.8, Thriller: 0.8 },
        themes: {},
        demographics: {}
    },
    thriller: { 
        genres: { Thriller: 1.0, Mystery: 0.9, Psychological: 0.9 },
        themes: { Survival: 0.6 },
        demographics: { Seinen: 0.6 }
    },
    tragedy: { 
        genres: { Tragedy: 1.0, Drama: 0.9, Psychological: 0.6 },
        themes: {},
        demographics: { Seinen: 0.5, Josei: 0.5 }
    },

    // 🥰 ROMANCE & FLUFF
    happy: { 
        genres: { Comedy: 1.0, SliceOfLife: 0.8, Adventure: 0.5 },
        themes: {},
        demographics: {}
    },
    uplifting: { 
        genres: { SliceOfLife: 0.9, Fantasy: 0.6, Comedy: 0.5 },
        themes: {},
        demographics: {}
    },
    wholesome: { 
        genres: { SliceOfLife: 1.0, Romance: 0.8, Comedy: 0.6 },
        themes: { SchoolLife: 0.8, FoundFamily: 0.7 },
        demographics: { Shoujo: 0.8, Shounen: 0.5 }
    },
    soft: { 
        genres: { SliceOfLife: 0.9, Romance: 0.7 },
        themes: { Iyashikei: 0.8 },
        demographics: {}
    },
    romance: { 
        genres: { Romance: 1.0, Drama: 0.6, SliceOfLife: 0.5 },
        themes: { SchoolLife: 0.6 },
        demographics: { Shoujo: 0.9, Josei: 0.8 }
    },
    spicy: {
        genres: { Romance: 1.0, Drama: 0.6 },
        themes: { Harem: 0.5 },
        demographics: { Josei: 0.9, Seinen: 0.7 }
    },
    mature: { 
        genres: { Mature: 1.0, Romance: 0.6, Drama: 0.6 },
        themes: {},
        demographics: { Josei: 1.0, Seinen: 1.0 }
    },

    // 😂 COMEDY & ACTION
    comedy: { 
        genres: { Comedy: 1.0, SliceOfLife: 0.7, Parody: 0.6 },
        themes: { Gag: 0.9 },
        demographics: { Shounen: 0.6 }
    },
    parody: { 
        genres: { Comedy: 1.0, Parody: 1.0 },
        themes: { Gag: 0.8 },
        demographics: {}
    },
    action: { 
        genres: { Action: 1.0, Adventure: 0.7, Fantasy: 0.5 },
        themes: {},
        demographics: { Shounen: 0.9, Seinen: 0.6 }
    },
    epic: { 
        genres: { Action: 1.0, Adventure: 1.0, Fantasy: 0.8 },
        themes: { Military: 0.6 },
        demographics: { Shounen: 0.8, Seinen: 0.7 }
    },
    cool: { 
        genres: { Action: 0.8, SciFi: 0.6, Thriller: 0.5 },
        themes: {},
        demographics: { Shounen: 0.7 }
    },
    sports: { 
        genres: { Sports: 1.0, Drama: 0.6, Action: 0.5 },
        themes: { SchoolLife: 0.7 },
        demographics: { Shounen: 0.9 }
    }
};


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
// Add to your mood extraction logic or dictionary
"scary": { moods: ["horror"], intensity: 0.8, tone: "negative" }

    // 😂 COMEDY (Positive Tone, Medium Intensity)
    "funny": { moods: ["comedy"], intensity: 0.6, tone: "positive" },
    "hilarious": { moods: ["comedy", "parody"], intensity: 0.9, tone: "positive" },
    
    // 🤯 MIND-BENDING (Neutral Tone, High Intensity)
    "mindfuck": { moods: ["psychological", "mystery", "thriller"], intensity: 1.0, tone: "neutral" }
};
