import { MangaIntent } from './intentSchema.js';
import { normalize } from './normalize.js';
import { applySynonyms } from './synonyms.js';
import { analyzeMood } from './moodEngine.js';
import { mapMoodsToGenres } from './genreMapper.js';

export function buildIntent(rawUserInput) {
    // 1. Instantiate the contract
    const intent = new MangaIntent();
    intent.originalQuery = rawUserInput;

    // 2. Clean and Translate
    intent.normalizedQuery = normalize(rawUserInput);
    const translatedText = applySynonyms(intent.normalizedQuery);

    // 3. Extract Moods
    const moodData = analyzeMood(translatedText);
    intent.moods = moodData.moods;
    intent.intensity = moodData.intensity;

    // 4. Map to Standard Genres
    intent.genres = mapMoodsToGenres(intent.moods, 3);

    return intent;
}
