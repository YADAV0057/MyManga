// js/parser/ruleEngine.js

/**
 * Independent rule blocks for scalable logic.
 * Boosts now use weights (0.1 to 1.0) to separate strong inferences from gentle nudges.
 */
const RULES = [
    {
        name: "Dark & Gritty",
        when: ["dark", "revenge", "gory", "despair", "creepy"],
        boosts: {
            genres: [
                { name: "Psychological", score: 0.90 }, 
                { name: "Action", score: 0.85 }, 
                { name: "Horror", score: 0.40 } // Gentle inference, not a hard requirement
            ],
            themes: [
                { name: "Survival", score: 0.80 }, 
                { name: "Monsters", score: 0.50 }
            ],
            demographics: [
                { name: "Seinen", score: 0.90 }
            ]
        },
        avoids: {
            genres: ["Comedy", "SliceOfLife"],
            themes: ["Iyashikei", "Fluff"]
        },
        priority: ["MangaDex", "AniList", "Kitsu", "Jikan"],
        confidenceModifier: 0.95
    },
    {
        name: "Wholesome Healing",
        when: ["healing", "wholesome", "fluff", "happy", "cozy", "relaxing", "soft"],
        boosts: {
            genres: [
                { name: "SliceOfLife", score: 0.95 }, 
                { name: "Comedy", score: 0.70 }
            ],
            themes: [
                { name: "Iyashikei", score: 0.90 }, 
                { name: "FoundFamily", score: 0.85 }, 
                { name: "SchoolLife", score: 0.60 }
            ],
            demographics: []
        },
        avoids: {
            genres: ["Horror", "Psychological", "Action", "Tragedy", "Mature"],
            themes: ["Gore", "Survival"]
        },
        priority: ["AniList", "MangaDex", "Jikan", "Kitsu"],
        confidenceModifier: 0.90
    },
    {
        name: "Tearjerker",
        when: ["cry", "sad", "depressing", "tragedy", "angst", "bittersweet"],
        boosts: {
            genres: [
                { name: "Drama", score: 0.95 }, 
                { name: "Tragedy", score: 0.90 }
            ],
            themes: [
                { name: "Loss", score: 0.85 }, 
                { name: "CharacterGrowth", score: 0.70 }
            ],
            demographics: []
        },
        avoids: {
            genres: ["Comedy", "Parody", "Ecchi"],
            themes: ["Gag"]
        },
        priority: ["AniList", "MangaDex", "Jikan", "Kitsu"],
        confidenceModifier: 0.92
    }
];

export function applyReasoningRules(intent) {
    if (!intent.moods || intent.moods.length === 0) return intent;

    // Use Maps to store the highest score if multiple rules boost the same tag
    const boostMaps = {
        genres: new Map(),
        themes: new Map(),
        demographics: new Map()
    };
    const avoids = { genres: new Set(), themes: new Set() };
    
    let appliedPriorities = [];
    let lowestConfidence = 1.0;

    // 1. Evaluate all rules
    RULES.forEach(rule => {
        const isMatch = rule.when.some(trigger => intent.moods.includes(trigger));
        
        if (isMatch) {
            // Merge Boosts (Keep the highest score)
            ['genres', 'themes', 'demographics'].forEach(category => {
                if (rule.boosts[category]) {
                    rule.boosts[category].forEach(item => {
                        // STRICT SEPARATION: Only add as a suggestion if it wasn't explicitly requested (Primary)
                        const isAlreadyPrimary = intent[category] && (
                            // Handle flat strings (genres/themes) or objects (demographics)
                            intent[category].includes(item.name) || 
                            intent[category].some(primaryItem => primaryItem.name === item.name)
                        );
                        
                        if (!isAlreadyPrimary) {
                            const currentScore = boostMaps[category].get(item.name) || 0;
                            if (item.score > currentScore) {
                                boostMaps[category].set(item.name, item.score);
                            }
                        }
                    });
                }
            });

            // Merge Avoids
            if (rule.avoids.genres) rule.avoids.genres.forEach(g => avoids.genres.add(g));
            if (rule.avoids.themes) rule.avoids.themes.forEach(t => avoids.themes.add(t));

            // Track Priority and Confidence
            if (appliedPriorities.length === 0) appliedPriorities = rule.priority;
            if (rule.confidenceModifier < lowestConfidence) lowestConfidence = rule.confidenceModifier;
        }
    });

    // 2. Convert Maps back to sorted arrays of objects { name, score }
    const mapToArray = (map) => Array.from(map.entries())
                                    .map(([name, score]) => ({ name, score }))
                                    .sort((a, b) => b.score - a.score);

    intent.boosts = {
        genres: mapToArray(boostMaps.genres),
        themes: mapToArray(boostMaps.themes),
        demographics: mapToArray(boostMaps.demographics)
    };
    
    intent.avoids = {
        genres: [...avoids.genres],
        themes: [...avoids.themes]
    };

    if (appliedPriorities.length > 0) intent.searchPriority = appliedPriorities;
    intent.confidence = lowestConfidence;

    return intent;
}
