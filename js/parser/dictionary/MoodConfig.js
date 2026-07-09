// js/parser/dictionary/MoodConfig.js
//
// Maps genre/theme/demographic NAMES (as they appear on concepts in
// properties.js/harvested_knowledge.js, and on real manga records) to a
// small, consistent "mood atom" vocabulary. This is what calculateMood()
// (upgrade.js) uses to build every concept's moodWeights — which in turn is
// the ONLY input mangaProfiles.js's computeMoodAtomProfile() has for
// building a manga's mood vector, which is what the 40%-weighted "mood"
// score in recommendationScorer.js compares against the user's query.
//
// A name missing from these tables doesn't error — it just contributes
// nothing, silently. Previously this table only covered 3 genres and 2
// themes, so most real genre/theme names (Fantasy, Comedy, Horror, Slice of
// Life, Romance, Sci-Fi, Iyashikei, Survival, Gore, FoundFamily, ...)
// produced an EMPTY moodWeights for the concept, which cascades into an
// empty mood vector for most manga, which silently disables the real
// cosine-similarity mood match in favor of the cruder overlap fallback.
// This table is expanded to cover the genre/theme vocabulary already used
// elsewhere in this codebase (ruleEngine.js's RULES, lexicon.js's
// MANGA_ROUTING, searchPlanner.js's GENRE_NORMALIZE) so that vocabulary
// actually stays "wired up" end to end.
//
// Mood atom vocabulary (kept intentionally small so vectors stay
// comparable): exciting, violent, dark, mysterious, emotional, tragic,
// wholesome, happy, funny, romantic, scary, relaxing, hopeful, intense,
// nostalgic. Values are 0-1, hand-estimated the same way the original
// Action/Psychological/Drama/Revenge/Betrayal entries were.
//
// Genre names are kept in AniList spelling (searchPlanner.js's
// GENRE_NORMALIZE target), since that's Tier 1 and the source of truth for
// genre strings elsewhere in this app.

export const SOURCE_MULTIPLIERS = { Genre: 1.0, Theme: 0.8, Demographic: 0.2 };

export const GENRE_WEIGHTS = {
    // --- original entries, unchanged ---
    "Action": { exciting: 1.0, violent: 0.8 },
    "Psychological": { dark: 0.9, mysterious: 0.7, emotional: 0.5 },
    "Drama": { emotional: 0.9, tragic: 0.6 },

    // --- expanded coverage ---
    "Adventure": { exciting: 0.9, hopeful: 0.5 },
    "Comedy": { funny: 1.0, happy: 0.6 },
    "Fantasy": { exciting: 0.6, mysterious: 0.5, hopeful: 0.4 },
    "Horror": { scary: 1.0, dark: 0.8, violent: 0.4 },
    "Mystery": { mysterious: 1.0, intense: 0.5 },
    "Romance": { romantic: 1.0, emotional: 0.6, happy: 0.3 },
    "Sci-Fi": { mysterious: 0.5, exciting: 0.5, intense: 0.3 },
    "Slice of Life": { relaxing: 0.9, wholesome: 0.6, happy: 0.4 },
    "Sports": { exciting: 0.8, hopeful: 0.6, intense: 0.6 },
    "Supernatural": { mysterious: 0.7, dark: 0.4, scary: 0.4 },
    "Thriller": { intense: 1.0, dark: 0.6, mysterious: 0.5 },
    "Tragedy": { tragic: 1.0, emotional: 0.9, dark: 0.5 },
    "Ecchi": { funny: 0.3, romantic: 0.4 },
    "Parody": { funny: 1.0 },
    "Mahou Shoujo": { hopeful: 0.6, exciting: 0.5, wholesome: 0.3 },
    "Mecha": { exciting: 0.7, intense: 0.6 },
    "Historical": { nostalgic: 0.6, emotional: 0.4 },
    "Music": { emotional: 0.5, happy: 0.3, nostalgic: 0.3 },
    "Martial Arts": { exciting: 0.8, violent: 0.5, intense: 0.6 },
    "Military": { intense: 0.7, dark: 0.4, violent: 0.5 },
    "Boys Love": { romantic: 1.0, emotional: 0.5 },
    "Girls Love": { romantic: 1.0, emotional: 0.5 },
    "Suspense": { intense: 1.0, dark: 0.5, mysterious: 0.5 },
    "Gourmet": { happy: 0.5, relaxing: 0.4 }
};

export const THEME_WEIGHTS = {
    // --- original entries, unchanged ---
    "Revenge": { dark: 0.8, emotional: 0.5, violent: 0.7 },
    "Betrayal": { dark: 0.9, emotional: 0.8 },

    // --- expanded coverage ---
    "Villainess": { dark: 0.3, funny: 0.3, romantic: 0.3 },
    "Iyashikei": { relaxing: 1.0, wholesome: 0.8, happy: 0.5 },
    "FoundFamily": { wholesome: 0.8, emotional: 0.6, happy: 0.4 },
    "SchoolLife": { wholesome: 0.4, happy: 0.4, relaxing: 0.3 },
    "Survival": { intense: 0.9, dark: 0.5, scary: 0.4 },
    "Monsters": { scary: 0.6, dark: 0.4, mysterious: 0.4 },
    "Loss": { tragic: 0.9, emotional: 0.9 },
    "CharacterGrowth": { hopeful: 0.7, emotional: 0.5 },
    "Gore": { dark: 0.8, violent: 1.0, scary: 0.5 },
    "Despair": { dark: 1.0, tragic: 0.8, emotional: 0.6 },
    "Gag": { funny: 1.0 },
    "Fluff": { wholesome: 0.9, happy: 0.7, relaxing: 0.5 },
    "Isekai": { exciting: 0.6, hopeful: 0.5, mysterious: 0.3 },
    "Reincarnation": { hopeful: 0.4, mysterious: 0.4 },
    "TimeTravel": { mysterious: 0.6, exciting: 0.4 },
    "Tournament": { exciting: 0.8, intense: 0.6 },
    "War": { intense: 0.8, dark: 0.6, tragic: 0.5 },
    "ComingOfAge": { emotional: 0.5, hopeful: 0.5, nostalgic: 0.3 },
    "Nostalgia": { nostalgic: 1.0, emotional: 0.4 }
};

// Demographics are a much weaker, broader signal than genre/theme (hence
// SOURCE_MULTIPLIERS.Demographic = 0.2 above — already defined, but never
// actually applied anywhere until calculateMood processes this table too).
export const DEMOGRAPHIC_WEIGHTS = {
    "Shounen": { exciting: 0.6, hopeful: 0.4 },
    "Shoujo": { romantic: 0.6, emotional: 0.4 },
    "Seinen": { dark: 0.4, mysterious: 0.3, intense: 0.3 },
    "Josei": { emotional: 0.5, romantic: 0.3 },
    "Kids": { happy: 0.6, wholesome: 0.5 }
};
