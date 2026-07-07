// js/parser/pipeline.js

import { MangaIntent } from './intentSchema.js'; // Fixed capitalization
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
    let cleanText = " " + text + " "; // Pad for easier boundary matching

    negations.forEach(neg => {
        // Use Regex with word boundaries to prevent "no" from matching "novel"
        const regex = new RegExp(`\\b${neg}\\b`, 'i');
        
        if (regex.test(cleanText)) {
            const parts = cleanText.split(regex);
            if (parts.length > 1) {
                // Grab the word immediately following the negation
                const term = parts[1].trim().split(" ")[0];
                if (term) {
                    excluded.push(term.charAt(0).toUpperCase() + term.slice(1));
                    // Replace only the specific negation and the targeted word
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
    
    // 2. Extract Hard Filters (Status, Sort, etc.)
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

    // [ADD THIS BLOCK] 6.5 Merge Manual Exclusions
    // Ensure the manual negations (like "no comedy") aren't overwritten by the rules
    if (intent.excluded && intent.excluded.length > 0) {
        if (!intent.avoids) intent.avoids = { genres: [], themes: [] };
        
        // Merge and remove duplicates
        intent.avoids.genres = [...new Set([...intent.avoids.genres, ...intent.excluded])];
    }


      // 7. Deduplicate and Clean (The "Hardening" step)
    const mergeUnique = (primary, suggested) => {
        const map = new Map();
        
        // Extract value using either property name to be safe
        primary.forEach(item => {
            const val = item.confidence ?? item.score ?? 0.5;
            map.set(item.name, val);
        });
        
        // Merge suggested items, keeping the highest value
        [...suggested].forEach(item => {
            const existing = map.get(item.name) || 0;
            const current = item.confidence ?? item.score ?? 0.5;
            if (current > existing) {
                map.set(item.name, current);
            }
        });
        
        // Output BOTH confidence and score so the UI never prints NaN%
        return Array.from(map.entries()).map(([name, val]) => ({ 
            name, 
            confidence: Math.min(Number(val), 1.0),
            score: Math.min(Number(val), 1.0)
        }));
    };
  

    intent.boosts.genres = mergeUnique(intent.genres, [...intent.boosts.genres, ...suggestedGenres]);
    intent.boosts.themes = mergeUnique(intent.themes, [...intent.boosts.themes, ...suggestedThemes]);

    // 8. Final Confidence Check
    if (!intent.moods || intent.moods.length === 0) {
        intent.confidence = 0.2;
    }

    return intent;
}
