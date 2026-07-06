import { MangaIntent } from './intentSchema.js';
import { normalize } from './normalize.js';
import { applySynonyms } from './synonyms.js';
import { analyzeMood } from './moodEngine.js';
import { mapMoodsToCategories } from './genreMapper.js'; // Updated import

export function buildIntent(rawUserInput) {
    // 1. Instantiate the contract
    const intent = new MangaIntent();
    intent.originalQuery = rawUserInput;

    // 2. Clean and Translate
    intent.normalizedQuery = normalize(rawUserInput);
    
    let translatedText = intent.normalizedQuery;
    try {
        translatedText = applySynonyms(intent.normalizedQuery);
    } catch (e) {
        console.warn("Synonym engine skipped:", e.message);
    }

    
        // 3. Extract Moods
    const moodData = analyzeMood(translatedText);
    intent.moods = moodData.moods;
    intent.intensity = moodData.intensity;
    intent.moodProfile = moodData.moodProfile; // <-- ADD THIS LINE

    // (Optional: you can also attach moodData.moodProfile to intent if your UI needs it)

    // 4. Map to Standard Categories (Genres, Themes, Demographics)
    const mappedCategories = mapMoodsToCategories(intent.moods, 3);
    intent.genres = mappedCategories.genres;
    intent.themes = mappedCategories.themes;
    intent.demographics = mappedCategories.demographics;

    return intent;
}
