// js/parser/pipeline.js

import { MangaIntent } from './intentSchema.js';
import { normalize } from './normalize.js';
import { extractRules } from './rules.js';
import { applySynonyms } from './synonyms.js';
import { analyzeMood } from './moodEngine.js';
import { mapMoodsToCategories } from './genreMapper.js';
import { applyReasoningRules } from './ruleEngine.js'; 

// js/parser/pipeline.js
export function buildIntent(rawUserInput) {
    let intent = new MangaIntent();
    intent.originalQuery = rawUserInput;

    // 1. Normalize
    intent.normalizedQuery = normalize(rawUserInput);
    
    // 2. Extract Hard Filters
    const filterData = extractRules(intent.normalizedQuery); 
    intent.status = filterData.status;
    intent.sort = filterData.sort;
    intent.maxChapters = filterData.maxChapters;

    // 3. Translate Synonyms
    let translatedText = filterData.cleanText; 
    try {
        translatedText = applySynonyms(filterData.cleanText);
    } catch (e) {
        console.warn("Synonym engine skipped:", e.message);
    }

    // 4. Extract Moods & Tone
    const moodData = analyzeMood(translatedText);
    intent.moods = moodData.moods;
    intent.intensity = moodData.intensity;
    intent.moodProfile = moodData.moodProfile;
    intent.tone = moodData.tone;

     // 5. Map to Standard Categories
    const allMapped = mapMoodsToCategories(intent.moods, 5);
    
    // NEW: Split into Primary vs Inferred
    // Anything with > 80% confidence is a Primary requirement
    intent.genres = allMapped.genres.filter(g => g.confidence >= 0.80);
    intent.themes = allMapped.themes.filter(t => t.confidence >= 0.80);
    
    // Anything < 80% confidence is relegated to "Inferred/Suggested"
    const suggestedGenres = allMapped.genres.filter(g => g.confidence < 0.80);
    const suggestedThemes = allMapped.themes.filter(t => t.confidence < 0.80);

    // 6. Apply Smart Reasoning Rules
    intent = applyReasoningRules(intent);

    // Merge rule-based boosts into the suggested bucket
    intent.boosts.genres = [...intent.boosts.genres, ...suggestedGenres];
    intent.boosts.themes = [...intent.boosts.themes, ...suggestedThemes];

    return intent;
}
