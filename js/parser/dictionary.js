// js/parser/dictionary.js

// 1. Import your curated Base Knowledge
import { CONCEPT_PROPERTIES as BASE_PROPERTIES } from './dictionary/properties.js';

// 2. Import your auto-harvested Growth Layer
// We use a safe check; if the file doesn't exist yet, we default to an empty object
let HARVESTED_RULES = {};
try {
    const harvestedModule = await import('./dictionary/harvested_knowledge.js');
    HARVESTED_RULES = harvestedModule.HARVESTED_RULES || {};
} catch (e) {
    console.warn("[System] Harvested knowledge not found, using base only.");
}

// 3. Merge Layers: Base (properties) overrides Harvested if keys conflict
export const CONCEPT_PROPERTIES = {
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
    "cute": "fluff", "adorable": "fluff", "sweet": "fluff",
    "lmao": "funny", "lol": "funny", "laugh": "funny",
};

// --- THE AI INJECTION SCRIPT ---
// This automatically merges all concepts into the operational maps above.
//
// FIX: every key we inject into SYNONYM_MAP / MOOD_DICTIONARY / MOOD_MAPPINGS
// is now the LOWERCASED concept id, not the raw concept.id string. Two bugs
// this fixes:
//   1. harvested_knowledge.js concepts carry a title-cased id
//      ("Abandoned Amusement Park") while every downstream lookup
//      (normalize.js lowercases user input; synonyms.js / moodEngine.js do
//      lowercase phrase matching) only ever sees lowercase text. A
//      case-sensitive key never matched, silently disabling every harvested
//      concept.
//   2. This lowercased id is exactly the same string as the concept's own
//      top-level key in CONCEPT_PROPERTIES/HARVESTED_RULES (see
//      harvested_knowledge.js: `"abandoned amusement park": { "id":
//      "Abandoned Amusement Park", ... }`). recommendationScorer.js's
//      matchedConcepts() does `conceptDictionary[id]` using the ids that
//      ended up in intent.moods — those now resolve correctly instead of
//      silently returning undefined for every harvested concept.
//
// concept.id itself (original casing) is left untouched on the concept
// object, since it's used for display text elsewhere (match reasons, "Known
// {concept.id} pick", etc).
Object.values(CONCEPT_PROPERTIES).forEach(concept => {
    const rawId = concept.id;
    if (!rawId) return;
    const id = rawId.toLowerCase();

    // 1. Inject Aliases
    if (concept.aliases && Array.isArray(concept.aliases)) {
        concept.aliases.forEach(alias => {
            const aliasKey = alias.toLowerCase();
            if (aliasKey !== id) SYNONYM_MAP[aliasKey] = id;
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
    if (concept.demographics) {
        concept.demographics.forEach(d => { MOOD_MAPPINGS[id].demographics[d.name] = d.weight; });
    }

    // 3. Inject into MOOD_DICTIONARY. Use the concept's own tone/intensity
    // (from properties.js's curation, or harvester.js's synopsis analysis)
    // when present, instead of a flat neutral/0.8 default — this is what
    // moodEngine.js actually reads for intent.tone/intent.intensity when a
    // user's query matches this concept's id/aliases.
    if (!MOOD_DICTIONARY[id]) {
        MOOD_DICTIONARY[id] = {
            moods: [id],
            intensity: (typeof concept.intensity === 'number') ? concept.intensity : 0.8,
            tone: concept.tone || "neutral"
        };
    }
});
