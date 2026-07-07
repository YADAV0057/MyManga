// js/parser/ruleEngine.js

const RULES = [
    {
        name: "Dark & Gritty",
        rulePriority: 80,
        when: ["dark", "revenge", "gory", "despair", "creepy"],
        boosts: {
            genres: [
                { name: "Psychological", score: 0.90 }, 
                { name: "Action", score: 0.85 }, 
                { name: "Horror", score: 0.40 }
            ],
            themes: [
                { name: "Survival", score: 0.80 }, 
                { name: "Monsters", score: 0.50 }
            ],
            demographics: [{ name: "Seinen", score: 0.90 }]
        },
        avoids: { genres: ["Comedy", "SliceOfLife"], themes: ["Iyashikei", "Fluff"] },
        priority: ["MangaDex", "AniList", "Kitsu", "Jikan"],
        confidenceModifier: 0.95
    },
    {
        name: "Wholesome Healing",
        rulePriority: 70,
        when: ["healing", "wholesome", "fluff", "happy", "cozy", "relaxing", "soft"],
        boosts: { 
            genres: [{ name: "SliceOfLife", score: 0.95 }, { name: "Comedy", score: 0.70 }],
            themes: [{ name: "Iyashikei", score: 0.90 }, { name: "FoundFamily", score: 0.85 }, { name: "SchoolLife", score: 0.60 }],
            demographics: []
        },
        avoids: { genres: ["Horror", "Psychological", "Action", "Tragedy", "Mature"], themes: ["Gore", "Survival"] },
        priority: ["AniList", "MangaDex", "Jikan", "Kitsu"],
        confidenceModifier: 0.90
    },
    {
        name: "Tearjerker",
        rulePriority: 90,
        when: ["cry", "sad", "depressing", "tragedy", "angst", "bittersweet"],
        boosts: {
            genres: [{ name: "Drama", score: 0.95 }, { name: "Tragedy", score: 0.90 }],
            themes: [{ name: "Loss", score: 0.85 }, { name: "CharacterGrowth", score: 0.70 }],
            demographics: []
        },
        avoids: { genres: ["Comedy", "Parody", "Ecchi"], themes: ["Gag"] },
        priority: ["AniList", "MangaDex", "Jikan", "Kitsu"],
        confidenceModifier: 0.92
    }
];

export function applyReasoningRules(intent) {
    if (!intent.moods || intent.moods.length === 0) return intent;

    const boostMaps = { genres: new Map(), themes: new Map(), demographics: new Map() };
    const avoids = { genres: new Set(), themes: new Set() };
    const ruleLogs = [];
    
    const sortedRules = [...RULES].sort((a, b) => b.rulePriority - a.rulePriority);

    let apiPriority = []; 
    let lowestConfidence = 1.0;

    sortedRules.forEach(rule => {
        const isMatch = rule.when.some(trigger => intent.moods.includes(trigger));
        
        if (isMatch) {
            ruleLogs.push(`✓ Triggered: ${rule.name} (Priority: ${rule.rulePriority})`);

            ['genres', 'themes', 'demographics'].forEach(category => {
                if (rule.boosts[category]) {
                    rule.boosts[category].forEach(item => {
                        const isAlreadyPrimary = intent[category] && intent[category].some(primaryItem => primaryItem.name === item.name);
                        
                        if (!isAlreadyPrimary && !boostMaps[category].has(item.name)) {
                            // FORCE DEFAULT: If item.score is missing or NaN, set to 0.5
                            const validScore = (typeof item.score === 'number' && !isNaN(item.score)) ? item.score : 0.5;
                            boostMaps[category].set(item.name, validScore);
                        }
                    });
                }
            });

            if (rule.avoids.genres) rule.avoids.genres.forEach(g => avoids.genres.add(g));
            if (rule.avoids.themes) rule.avoids.themes.forEach(t => avoids.themes.add(t));
            // ... inside sortedRules.forEach ...
            if (apiPriority.length === 0) apiPriority = rule.priority;
            if (rule.confidenceModifier < lowestConfidence) lowestConfidence = rule.confidenceModifier;
        }
    });

    // [ADD THIS]: Provide a default API fallback if no specific rules were triggered
    if (apiPriority.length === 0) {
        apiPriority = ["AniList", "MangaDex", "Jikan", "Kitsu"];
    }

    // Ensure mapToArray provides both 'score' and 'confidence' to match the pipeline
    const mapToArray = (map) => Array.from(map.entries())
                                    .map(([name, score]) => ({ name, score, confidence: score }))
                                    .sort((a, b) => b.score - a.score);

    intent.boosts = {
        genres: mapToArray(boostMaps.genres),
        themes: mapToArray(boostMaps.themes),
        demographics: mapToArray(boostMaps.demographics)
    };
    
    intent.avoids = { genres: [...avoids.genres], themes: [...avoids.themes] };
    intent.ruleLogs = ruleLogs;
    intent.searchPriority = apiPriority; // Now guaranteed to have a route!
    intent.confidence = lowestConfidence;

    return intent;
}

            
