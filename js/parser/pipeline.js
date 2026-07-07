import { MangaIntent } from './intentSchema.js';
import { normalize } from './normalize.js';
import { extractRules } from './rules.js';
import { applySynonyms } from './synonyms.js';
import { analyzeMood } from './moodEngine.js';
import { mapMoodsToCategories } from './genreMapper.js';
import { applyReasoningRules } from './ruleEngine.js'; 

// NEW: Negation handler to strip "no comedy" before mood analysis
function handleNegations(text) {
    const negations = ["no", "not", "without", "avoid", "except", "don't"];
    let excluded = [];
    let cleanText = text;

    negations.forEach(neg => {
        if (cleanText.includes(neg)) {
            const parts = cleanText.split(neg);
            if (parts.length > 1) {
                const term = parts[1].trim().split(" ")[0];
                excluded.push(term.charAt(0).toUpperCase() + term.slice(1));
                cleanText = cleanText.replace(neg + " " + term, "");
            }
        }
    });
    return { cleanText, excluded };
}

export function buildIntent(rawUserInput) {
    let intent = new MangaIntent();
    intent.originalQuery = rawUserInput;

    // 1. Normalize & Handle Negations
    const normalized = normalize(rawUserInput);
    const { cleanText, excluded } = handleNegations(normalized);
    intent.excluded = excluded; // Store for the Search Planner
    
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

    // 7. Deduplicate and Clean (The "Hardening" step)
    const mergeUnique = (primary, suggested) => {
        const map = new Map();
        [...primary, ...suggested].forEach(item => {
            if (!map.has(item.name) || item.confidence > map.get(item.name)) {
                map.set(item.name, item.confidence || 0.5); // Default to 0.5 instead of NaN
            }
        });
        return Array.from(map.entries()).map(([name, confidence]) => ({ name, confidence }));
    };

    intent.boosts.genres = mergeUnique(intent.genres, [...intent.boosts.genres, ...suggestedGenres]);
    intent.boosts.themes = mergeUnique(intent.themes, [...intent.boosts.themes, ...suggestedThemes]);

    // 8. Final Confidence Check
    if (intent.moods.length === 0) intent.confidence = 0.2;

    return intent;
}
