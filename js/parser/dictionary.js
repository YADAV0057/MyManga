// Import your auto-harvested AI dictionary
import { CONCEPT_PROPERTIES } from './dictionary/properties.js';

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
    dark: { genres: { Psychological: 1.0, Horror: 0.9, Thriller: 0.8, Mystery: 0.5 }, themes: { Survival: 0.7, Monsters: 0.5 }, demographics: { Seinen: 0.8 } },
    // ... (Keep the rest of your hardcoded MOOD_MAPPINGS here) ...
};

export const MOOD_DICTIONARY = {
    "cry": { moods: ["sad", "emotional", "tragedy"], intensity: 0.9, tone: "negative" },
    "depressing": { moods: ["sad", "dark", "psychological"], intensity: 1.0, tone: "negative" },
    // ... (Keep the rest of your hardcoded MOOD_DICTIONARY here) ...
};

// We move your SYNONYM_MAP here so we can update it in one central place
export const SYNONYM_MAP = {
    "crying": "cry", "tearjerker": "cry", "tears": "cry", "sob": "cry",
    "lmao": "funny", "lol": "funny", "comedy": "funny", "laugh": "funny",
    "cute": "fluff", "adorable": "fluff", "sweet": "fluff",
    // ... (Keep the rest of your hardcoded SYNONYM_MAP here) ...
};

// --- THE AI INJECTION SCRIPT ---
// This runs automatically and merges your harvested concepts into the maps above.

if (CONCEPT_PROPERTIES) {
    Object.values(CONCEPT_PROPERTIES).forEach(concept => {
        const id = concept.id; // e.g., "time_loop"

        // 1. Inject Aliases into SYNONYM_MAP
        if (concept.aliases && Array.isArray(concept.aliases)) {
            concept.aliases.forEach(alias => {
                if (alias !== id) {
                    // This means "circle" and "cycle" will automatically map to "time_loop"
                    SYNONYM_MAP[alias.toLowerCase()] = id;
                }
            });
        }

        // 2. Inject Genres/Themes into MOOD_MAPPINGS
        if (!MOOD_MAPPINGS[id]) {
            MOOD_MAPPINGS[id] = { genres: {}, themes: {}, demographics: {} };
        }
        
        if (concept.genres) {
            concept.genres.forEach(g => { 
                MOOD_MAPPINGS[id].genres[g.name] = g.weight; 
            });
        }
        if (concept.themes) {
            concept.themes.forEach(t => { 
                MOOD_MAPPINGS[id].themes[t.name] = t.weight; 
            });
        }

        // 3. Inject into MOOD_DICTIONARY
        // Treat the concept ID as its own mood so the pipeline tracks it perfectly
        if (!MOOD_DICTIONARY[id]) {
            MOOD_DICTIONARY[id] = {
                moods: [id], 
                intensity: 0.8,  // Safe default for harvested concepts
                tone: "neutral" 
            };
        }
    });
}
