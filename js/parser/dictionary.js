// js/parser/dictionary.js

// 1. Import your curated Base Knowledge
import { CONCEPT_PROPERTIES as BASE_PROPERTIES } from './dictionary/properties.js';

// 2. Import your auto-harvested Growth Layer
// We use a safe check; if the file doesn't exist yet, we default to an empty object
let HARVESTED_RULES = {};
try {
    const data = await import('./harvested_knowledge.js');
    HARVESTED_RULES = data.HARVESTED_RULES;
} catch (e) {
    console.warn("[System] Harvested knowledge not found, using base only.");
}

// 3. Merge Layers: Base (properties) overrides Harvested if keys conflict
const CONCEPT_PROPERTIES = { 
    ...HARVESTED_RULES, 
    ...BASE_PROPERTIES 
};

// --- YOUR EXISTING HARDCODED DATA ---
export const URGENCY_MODIFIERS = {
    "devastating": 1.5, "destroy": 1.5, "need": 1.3, "extremely": 1.4,
    "insanely": 1.5, "really": 1.2, "very": 1.2, "super": 1.2,
    "mild": 0.6, "chill": 0.7, "little": 0.8, "somewhat": 0.8,
    "slightly": 0.5, "a bit": 0.7
};

export const MOOD_MAPPINGS = {
    sad: { genres: { Drama: 1.0, Tragedy: 0.9 }, themes: {}, demographics: {} }, 
    emotional: { genres: { Drama: 0.8, Romance: 0.5, Psychological: 0.4 }, themes: {}, demographics: {} },
    dark: { genres: { Psychological: 1.0, Horror: 0.9, Thriller: 0.8, Mystery: 0.5 }, themes: { Survival: 0.7, Monsters: 0.5 }, demographics: { Seinen: 0.8 } }
};

export const MOOD_DICTIONARY = {
    "cry": { moods: ["sad", "emotional", "tragedy"], intensity: 0.9, tone: "negative" },
    "depressing": { moods: ["sad", "dark", "psychological"], intensity: 1.0, tone: "negative" }
};

export const SYNONYM_MAP = {
    "crying": "cry", "tearjerker": "cry", "tears": "cry", "sob": "cry",
    "lmao": "funny", "lol": "funny", "comedy": "funny", "laugh": "funny",
    "cute": "fluff", "adorable": "fluff", "sweet": "fluff"
};

// --- THE AI INJECTION SCRIPT ---
// This automatically merges all concepts into the operational maps above.

Object.values(CONCEPT_PROPERTIES).forEach(concept => {
    const id = concept.id;

    // 1. Inject Aliases
    if (concept.aliases && Array.isArray(concept.aliases)) {
        concept.aliases.forEach(alias => {
            if (alias !== id) SYNONYM_MAP[alias.toLowerCase()] = id;
        });
    }

    // 2. Inject Genres/Themes
    if (!MOOD_MAPPINGS[id]) {
        MOOD_MAPPINGS[id] = { genres: {}, themes: {}, demographics: {} };
    }
    
    if (concept.genres) {
        concept.genres.forEach(g => { MOOD_MAPPINGS[id].genres[g.name] = g.weight; });
    }
    if (concept.themes) {
        concept.themes.forEach(t => { MOOD_MAPPINGS[id].themes[t.name] = t.weight; });
    }

    // 3. Inject into MOOD_DICTIONARY
    if (!MOOD_DICTIONARY[id]) {
        MOOD_DICTIONARY[id] = { moods: [id], intensity: 0.8, tone: "neutral" };
    }
});
