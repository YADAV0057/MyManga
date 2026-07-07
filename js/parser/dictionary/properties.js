/**
 * MASTER CONCEPT DICTIONARY
 * A semantic knowledge base for the parser. 
 * Every concept acts as a self-contained node containing its own synonyms, 
 * weighted API categories, relational boosts, and strict exclusions.
 */

export const CONCEPT_PROPERTIES = {
    
    // 💀 DARK & EDGY CONCEPTS
    revenge: {
        id: "revenge",
        aliases: ["revenge", "vengeance", "payback", "retaliation", "get even", "retribution", "avenge"],
        genres: [
            { name: "Action", weight: 0.95 },
            { name: "Psychological", weight: 0.90 },
            { name: "Drama", weight: 0.85 }
        ],
        themes: [
            { name: "Revenge", weight: 1.0 },
            { name: "Betrayal", weight: 0.80 },
            { name: "Villainess", weight: 0.60 }
        ],
        demographics: [
            { name: "Seinen", weight: 0.80 }
        ],
        // Pointers to other concept IDs in this file for ontology mapping
        boosts: ["dark", "survival"], 
        excludes: {
            genres: ["Comedy", "SliceOfLife"],
            themes: ["Iyashikei", "Fluff", "Gag"]
        },
        tone: "negative",
        intensity: 0.9
    },

    horror: {
        id: "horror",
        aliases: ["gore", "blood", "violent", "terrifying", "creepy", "nightmare", "fear", "horror", "scary", "spooky"],
        genres: [
            { name: "Horror", weight: 1.0 },
            { name: "Psychological", weight: 0.85 },
            { name: "Mystery", weight: 0.60 }
        ],
        themes: [
            { name: "Monsters", weight: 0.90 },
            { name: "Survival", weight: 0.85 },
            { name: "Gore", weight: 0.95 }
        ],
        demographics: [
            { name: "Seinen", weight: 0.90 }
        ],
        boosts: ["dark", "mystery", "tragedy"],
        excludes: {
            genres: ["Comedy", "Romance", "SliceOfLife"],
            themes: ["Iyashikei", "SchoolLife", "FoundFamily"]
        },
        tone: "negative",
        intensity: 1.0
    },

    // 🥰 COZY & ROMANTIC CONCEPTS
    healing: {
        id: "healing",
        aliases: ["healing", "comfort", "comforting", "cozy", "warm", "heartwarming", "feel good", "wholesome", "soft", "gentle", "peaceful", "relaxing"],
        genres: [
            { name: "SliceOfLife", weight: 1.0 },
            { name: "Comedy", weight: 0.70 },
            { name: "Romance", weight: 0.60 }
        ],
        themes: [
            { name: "Iyashikei", weight: 1.0 },
            { name: "FoundFamily", weight: 0.85 }
        ],
        demographics: [
            { name: "Shoujo", weight: 0.60 },
            { name: "Josei", weight: 0.50 }
        ],
        boosts: ["happy", "romance"],
        excludes: {
            genres: ["Horror", "Psychological", "Tragedy", "Action"],
            themes: ["Survival", "Gore", "Revenge", "Betrayal"]
        },
        tone: "positive",
        intensity: 0.2
    },

    romance: {
        id: "romance",
        aliases: ["love", "relationship", "dating", "girlfriend", "boyfriend", "romance", "romantic", "couple", "kiss", "crush"],
        genres: [
            { name: "Romance", weight: 1.0 },
            { name: "Drama", weight: 0.60 },
            { name: "SliceOfLife", weight: 0.50 }
        ],
        themes: [
            { name: "SchoolLife", weight: 0.70 },
            { name: "LoveTriangle", weight: 0.60 },
            { name: "FirstLove", weight: 0.80 }
        ],
        demographics: [
            { name: "Shoujo", weight: 0.90 },
            { name: "Josei", weight: 0.80 }
        ],
        boosts: ["healing", "drama", "happy"],
        excludes: {
            genres: ["Horror"],
            themes: ["Survival", "Gore"]
        },
        tone: "mixed",
        intensity: 0.5
    },

    // 😭 EMOTIONAL CONCEPTS
    tragedy: {
        id: "tragedy",
        aliases: ["cry", "sad", "depressing", "tragedy", "angst", "bittersweet", "tearjerker", "heartbreak", "devastating"],
        genres: [
            { name: "Drama", weight: 0.95 },
            { name: "Tragedy", weight: 0.90 },
            { name: "Psychological", weight: 0.70 }
        ],
        themes: [
            { name: "Loss", weight: 0.85 },
            { name: "CharacterGrowth", weight: 0.70 }
        ],
        demographics: [],
        boosts: ["dark", "romance"],
        excludes: {
            genres: ["Comedy", "Parody", "Ecchi"],
            themes: ["Gag", "Iyashikei"]
        },
        tone: "negative",
        intensity: 0.9
    }
};

