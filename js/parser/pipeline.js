import { MangaIntent } from './intentSchema.js';
import { normalize } from './normalize.js';
import { extractRules } from './rules.js'; // 🐛 FIXED IMPORT NAME
import { applySynonyms } from './synonyms.js';
import { analyzeMood } from './moodEngine.js';
import { mapMoodsToCategories } from './genreMapper.js';
import { applyReasoningRules } from './ruleEngine.js'; 

export function buildIntent(rawUserInput) {
    let intent = new MangaIntent();
    intent.originalQuery = rawUserInput;

    // 1. Normalize
    intent.normalizedQuery = normalize(rawUserInput);
    
    // 2. Extract Hard Filters
    const filterData = extractRules(intent.normalizedQuery); // 🐛 FIXED FUNCTION CALL
    intent.status = filterData.status;
    intent.sort = filterData.sort;
    intent.maxChapters = filterData.maxChapters;

    // ... (the rest of the file remains exactly the same)

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
    const mappedCategories = mapMoodsToCategories(intent.moods, 3);
    intent.genres = mappedCategories.genres;
    intent.themes = mappedCategories.themes;
    intent.demographics = mappedCategories.demographics;

    // 6. ⭐ Apply Smart Reasoning Rules
    intent = applyReasoningRules(intent);

    return intent;
}
