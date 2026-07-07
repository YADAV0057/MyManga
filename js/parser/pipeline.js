// js/parser/pipeline.js

import { MangaIntent } from './intentSchema.js'; 
import { normalize } from './normalize.js';  
import { extractRules } from './rules.js';
import { applySynonyms } from './synonyms.js';
import { analyzeMood } from './moodEngine.js';
import { mapMoodsToCategories } from './genreMapper.js';
import { applyReasoningRules } from './ruleEngine.js'; 

/**
 * Strips negation terms from the input and tracks excluded intent.
 */
function handleNegations(text) {
    const negations = ["no", "not", "without", "avoid", "except", "don't"];
    let excluded = [];
    let cleanText = " " + text + " "; 

    negations.forEach(neg => {
        const regex = new RegExp(`\\b${neg}\\b`, 'i');
        
        if (regex.test(cleanText)) {
            const parts = cleanText.split(regex);
            if (parts.length > 1) {
                const term = parts[1].trim().split(" ")[0];
                if (term) {
                    excluded.push(term.charAt(0).toUpperCase() + term.slice(1));
                    cleanText = cleanText.replace(new RegExp(`\\b${neg}\\s+${term}\\b`, 'i'), "").trim();
                }
            }
        }
    });
    
    return { cleanText: cleanText.trim(), excluded };
}

/**
 * Orchestrates the full intent analysis pipeline.
 */
export function buildIntent(rawUserInput) {
    let intent = new MangaIntent();
    intent.originalQuery = rawUserInput;

    // 1. Normalize & Handle Negations
    const normalized = normalize(rawUserInput);
    const { cleanText, excluded } = handleNegations(normalized);
    intent.excluded = excluded;
    
    // 2. Extract Hard Filters 
    const filterData = extractRules(cleanText); 
    intent.status = filterData.status;
    intent.sort = filterData.sort;
    intent.maxChapters = filterData.maxChapters;

    // 3. Translate Synonyms
    let translatedText = applySynonyms(cleanText);

    // 4. Extract Moods & Tone
    const moodData = analyzeMood(translatedText);
    intent.moods = moodData.moods;
    intent.intensity = moodData.intensity;
    intent.moodProfile = moodData.moodProfile;
    intent.tone = moodData.tone;

    // 5. Map to Categories
    const allMapped = mapMoodsToCategories(intent.moods, 5);
    
    intent.genres = allMapped.genres.filter(g => g.confidence >= 0.80);
    intent.themes = allMapped.themes.filter(t => t.confidence >= 0.80);
    
    const suggestedGenres = allMapped.genres.filter(g => g.confidence < 0.80);
    const suggestedThemes = allMapped.themes.filter(t => t.confidence < 0.80);

    // 6. Apply Reasoning Rules
    intent = applyReasoningRules(intent);

    // 6.5 Merge Manual Exclusions
    if (intent.excluded && intent.excluded.length > 0) {
        if (!intent.avoids) intent.avoids = { genres: [], themes: [] };
        intent.avoids.genres = [...new Set([...intent.avoids.genres, ...intent.excluded])];
    }

    // 7. Deduplicate and Clean (The "Hardening" step)
    const filterSuggested = (primary, suggested) => {
        const map = new Map();
        
        [...suggested].forEach(item => {
            // Check if this item is already a primary requirement
            const isPrimary = primary.some(p => p.name === item.name);
            
            // If it is NOT primary, add it to suggestions
            if (!isPrimary) {
                const existing = map.get(item.name)?.score || 0;
                const current = item.confidence ?? item.score ?? 0.5;
                
                if (current > existing) {
                    map.set(item.name, {
                        name: item.name,
                        confidence: Math.min(Number(current), 1.0),
                        score: Math.min(Number(current), 1.0),
                        reason: item.reason || null 
                    });
                }
            }
        });
        
        return Array.from(map.values()).sort((a, b) => b.score - a.score);
    };

    // Apply strict filtering (removes anything already in primary intent)
    intent.boosts.genres = filterSuggested(intent.genres, [...(intent.boosts?.genres || []), ...suggestedGenres]);
    intent.boosts.themes = filterSuggested(intent.themes, [...(intent.boosts?.themes || []), ...suggestedThemes]);

    // 8. Final Confidence Check
    if (!intent.moods || intent.moods.length === 0) {
        intent.confidence = 0.2;
    }

    return intent;
}
