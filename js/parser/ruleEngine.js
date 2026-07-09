// js/parser/ruleEngine.js

import { CONCEPT_PROPERTIES, SYNONYM_MAP } from './dictionary.js';

const RULES = [
    {
        name: "Dark & Gritty",
        rulePriority: 80,
        when: ["dark", "revenge", "gory", "despair", "creepy"],
        boosts: {
            genres: [
                { name: "Psychological", score: 0.90, reason: "Dark narratives rely on heavy psychological tension." }, 
                { name: "Action", score: 0.85, reason: "Common in gritty, revenge-driven stories." }, 
                { name: "Horror", score: 0.40, reason: "Often accompanies gory or creepy elements." }
            ],
            themes: [
                { name: "Survival", score: 0.80, reason: "Despair and dark themes often involve fighting to survive." }, 
                { name: "Monsters", score: 0.50, reason: "Associated with creepy and scary scenarios." }
            ],
            demographics: [{ name: "Seinen", score: 0.90, reason: "Targeted toward older audiences due to mature themes." }]
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
            genres: [
                { name: "SliceOfLife", score: 0.95, reason: "The core genre for relaxing, everyday stories." }, 
                { name: "Comedy", score: 0.70, reason: "Keeps the mood light and happy." }
            ],
            themes: [
                { name: "Iyashikei", score: 0.90, reason: "Directly translates to 'healing' in manga terminology." }, 
                { name: "FoundFamily", score: 0.85, reason: "A very common trope in cozy, wholesome stories." }, 
                { name: "SchoolLife", score: 0.60, reason: "A frequent setting for lighthearted fluff." }
            ],
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
            genres: [
                { name: "Drama", score: 0.95, reason: "Essential for emotional, character-driven narratives." }, 
                { name: "Tragedy", score: 0.90, reason: "Direct match for sad and depressing requests." }
            ],
            themes: [
                { name: "Loss", score: 0.85, reason: "A core theme in tragic stories." }, 
                { name: "CharacterGrowth", score: 0.70, reason: "Frequently associated with emotional drama." }
            ],
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
                            const validScore = (typeof item.score === 'number' && !isNaN(item.score)) ? item.score : 0.5;
                            
                            // Map score and reason as an object
                            boostMaps[category].set(item.name, {
                                score: validScore,
                                reason: item.reason || `Associated with the ${rule.name} mood profile.`
                            });
                        }
                    });
                }
            });

            if (rule.avoids.genres) rule.avoids.genres.forEach(g => avoids.genres.add(g));
            if (rule.avoids.themes) rule.avoids.themes.forEach(t => avoids.themes.add(t));
            
            if (apiPriority.length === 0) apiPriority = rule.priority;
            if (rule.confidenceModifier < lowestConfidence) lowestConfidence = rule.confidenceModifier;
        }
    });

    // Per-concept excludes/boosts — from properties.js curation or
    // harvester.js's synopsis analysis — layered on top of the static
    // RULES table above rather than replacing it.
    intent.moods.forEach(moodId => {
        const concept = CONCEPT_PROPERTIES[moodId];
        if (!concept) return;

        // concept.excludes is already { genres: [], themes: [] } — the same
        // shape as rule.avoids, so it drops straight into the same bucket.
        if (concept.excludes) {
            (concept.excludes.genres || []).forEach(g => avoids.genres.add(g));
            (concept.excludes.themes || []).forEach(t => avoids.themes.add(t));
        }

        // concept.boosts is a flat list of trope keywords (e.g.
        // ["dark","survival","antihero"]), not genre/theme names, so it
        // can't drop in directly. Where a keyword happens to resolve to
        // another known concept (by id or alias), pull in *that* concept's
        // genres/themes as a lower-confidence suggestion — safer than
        // guessing a genre/theme mapping for an arbitrary trope word.
        (concept.boosts || []).forEach(boostWord => {
            const boostId = SYNONYM_MAP[boostWord.toLowerCase()] || boostWord.toLowerCase();
            const boostConcept = CONCEPT_PROPERTIES[boostId];
            if (!boostConcept) return;

            (boostConcept.genres || []).forEach(g => {
                const isAlreadyPrimary = intent.genres && intent.genres.some(p => p.name === g.name);
                if (!isAlreadyPrimary && !boostMaps.genres.has(g.name)) {
                    boostMaps.genres.set(g.name, {
                        score: g.weight * 0.7,
                        reason: `Related to "${moodId}" via the "${boostWord}" trope.`
                    });
                }
            });
            (boostConcept.themes || []).forEach(t => {
                const isAlreadyPrimary = intent.themes && intent.themes.some(p => p.name === t.name);
                if (!isAlreadyPrimary && !boostMaps.themes.has(t.name)) {
                    boostMaps.themes.set(t.name, {
                        score: t.weight * 0.7,
                        reason: `Related to "${moodId}" via the "${boostWord}" trope.`
                    });
                }
            });
            (boostConcept.demographics || []).forEach(d => {
                const isAlreadyPrimary = intent.demographics && intent.demographics.some(p => p.name === d.name);
                if (!isAlreadyPrimary && !boostMaps.demographics.has(d.name)) {
                    boostMaps.demographics.set(d.name, {
                        score: d.weight * 0.7,
                        reason: `Related to "${moodId}" via the "${boostWord}" trope.`
                    });
                }
            });
        });
    });

    if (apiPriority.length === 0) {
        apiPriority = ["AniList", "MangaDex", "Jikan", "Kitsu"];
    }

    // Extract name, score, confidence, and reason for the UI
    const mapToArray = (map) => Array.from(map.entries())
                                    .map(([name, data]) => ({ 
                                        name, 
                                        score: data.score, 
                                        confidence: data.score,
                                        reason: data.reason
                                    }))
                                    .sort((a, b) => b.score - a.score);

    intent.boosts = {
        genres: mapToArray(boostMaps.genres),
        themes: mapToArray(boostMaps.themes),
        demographics: mapToArray(boostMaps.demographics)
    };
    
    intent.avoids = { genres: [...avoids.genres], themes: [...avoids.themes] };
    intent.ruleLogs = ruleLogs;
    intent.searchPriority = apiPriority; 
    intent.confidence = lowestConfidence;

    return intent;
}
