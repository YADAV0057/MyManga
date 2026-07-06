
// js/parser/ruleEngine.js

/**
 * Independent rule blocks for scalable logic.
 * If ANY word in `when` matches the user's detected moods, the rule fires.
 */
const RULES = [
    {
        name: "Dark & Gritty",
        when: ["dark", "revenge", "gory", "despair", "creepy"],
        boosts: {
            genres: ["Psychological", "Action", "Horror"],
            themes: ["Survival", "Monsters"],
            demographics: ["Seinen"]
        },
        avoids: {
            genres: ["Comedy", "SliceOfLife"],
            themes: ["Iyashikei", "Fluff"]
        },
        priority: ["MangaDex", "AniList", "Kitsu", "Jikan"], // MangaDex tags are great for specific dark themes
        confidenceModifier: 0.95
    },
    {
        name: "Wholesome Healing",
        when: ["healing", "wholesome", "fluff", "happy", "cozy", "relaxing", "soft"],
        boosts: {
            genres: ["SliceOfLife", "Comedy"],
            themes: ["Iyashikei", "FoundFamily", "SchoolLife"],
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
            genres: ["Drama", "Tragedy"],
            themes: ["Loss", "CharacterGrowth"],
            demographics: []
        },
        avoids: {
            genres: ["Comedy", "Parody", "Ecchi"],
            themes: ["Gag"]
        },
        priority: ["AniList", "MangaDex", "Jikan", "Kitsu"],
        confidenceModifier: 0.92
    },
    {
        name: "Hype Action",
        when: ["hype", "badass", "tournament", "epic"],
        boosts: {
            genres: ["Action", "Adventure", "Fantasy"],
            themes: ["MartialArts", "SuperPower"],
            demographics: ["Shounen"]
        },
        avoids: {
            genres: ["SliceOfLife", "Romance"],
            themes: ["Iyashikei"]
        },
        priority: ["AniList", "Jikan", "MangaDex", "Kitsu"], // Jikan (MAL) is excellent for Shounen metrics
        confidenceModifier: 0.88
    }
];

/**
 * Enriches the Universal Intent Schema based on detected moods.
 * @param {Object} intent - The current MangaIntent object
 * @returns {Object} - The enriched MangaIntent
 */
export function applyReasoningRules(intent) {
    if (!intent.moods || intent.moods.length === 0) return intent;

    // Use Sets to prevent duplicate entries from multiple overlapping rules
    const boosts = { genres: new Set(), themes: new Set(), demographics: new Set() };
    const avoids = { genres: new Set(), themes: new Set() };
    
    let appliedPriorities = [];
    let lowestConfidence = 1.0;

    // 1. Evaluate all rules
    RULES.forEach(rule => {
        // Does the user's mood profile intersect with this rule's triggers?
        const isMatch = rule.when.some(trigger => intent.moods.includes(trigger));
        
        if (isMatch) {
            // Merge Boosts
            if (rule.boosts.genres) rule.boosts.genres.forEach(g => boosts.genres.add(g));
            if (rule.boosts.themes) rule.boosts.themes.forEach(t => boosts.themes.add(t));
            if (rule.boosts.demographics) rule.boosts.demographics.forEach(d => boosts.demographics.add(d));

            // Merge Avoids
            if (rule.avoids.genres) rule.avoids.genres.forEach(g => avoids.genres.add(g));
            if (rule.avoids.themes) rule.avoids.themes.forEach(t => avoids.themes.add(t));

            // Track Priority and Confidence
            if (appliedPriorities.length === 0) appliedPriorities = rule.priority;
            if (rule.confidenceModifier < lowestConfidence) lowestConfidence = rule.confidenceModifier;
        }
    });

    // 2. Attach enriched data back to the intent payload
    intent.boosts = {
        genres: [...boosts.genres],
        themes: [...boosts.themes],
        demographics: [...boosts.demographics]
    };
    
    intent.avoids = {
        genres: [...avoids.genres],
        themes: [...avoids.themes]
    };

    if (appliedPriorities.length > 0) {
        intent.searchPriority = appliedPriorities;
    }
    
    intent.confidence = lowestConfidence;

    return intent;
}
