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
// nothing, silently. The previous pass covered the 19 fixed AniList genres
// plus a first round of themes (~19). That's not enough: harvested_knowledge.js
// alone has 2000+ concepts pulling from AniList's/MangaUpdates' full tag
// taxonomy (hundreds of theme names), so most theme names on those concepts
// were still landing on nothing here, producing an empty or near-empty
// moodWeights for large swaths of the harvested set.
//
// This pass adds broad coverage for the theme/setting/relationship-dynamic
// vocabulary that shows up constantly across AniList tags and MangaUpdates
// genres: character archetypes (Yandere, Tsundere...), settings (Cyberpunk,
// PostApocalyptic, Royalty...), relationship dynamics (ArrangedMarriage,
// LoveTriangle, AgeGap...), and common tropes (Vampire, Ninja, Magic,
// TimeSkip...).
//
// IMPORTANT: this is still a best-estimate table, same as the original —
// values are hand-estimated, not measured. Run checkMoodConfigCoverage.js
// after this to see exactly which names in YOUR real properties.js /
// harvested_knowledge.js are still uncovered, ranked by how many concepts
// each one would affect, instead of guessing further in the dark.
//
// Mood atom vocabulary (kept intentionally small so vectors stay
// comparable): exciting, violent, dark, mysterious, emotional, tragic,
// wholesome, happy, funny, romantic, scary, relaxing, hopeful, intense,
// nostalgic. Values are 0-1.
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
    "Gourmet": { happy: 0.5, relaxing: 0.4 },

    // --- new coverage ---
    "Hentai": { romantic: 0.5 },
    "Isekai": { exciting: 0.6, hopeful: 0.5, mysterious: 0.3 }, // some sources tag Isekai as a genre, not just a theme — see THEME_WEIGHTS too

    // AUTO-EXPAND:GENRE — autoExpandMoodConfig.js inserts new genre entries above this line. Don't remove this marker.
};

export const THEME_WEIGHTS = {
    // --- original entries, unchanged ---
    "Revenge": { dark: 0.8, emotional: 0.5, violent: 0.7 },
    "Betrayal": { dark: 0.9, emotional: 0.8 },
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
    "Nostalgia": { nostalgic: 1.0, emotional: 0.4 },

    // --- character archetypes / relationship dynamics ---
    "Yandere": { dark: 0.6, romantic: 0.5, scary: 0.4, intense: 0.5 },
    "Tsundere": { funny: 0.5, romantic: 0.6 },
    "Kuudere": { mysterious: 0.4, romantic: 0.5 },
    "Dandere": { relaxing: 0.3, romantic: 0.4 },
    "LoveTriangle": { romantic: 0.8, emotional: 0.6, intense: 0.4 },
    "OneSidedLove": { romantic: 0.7, emotional: 0.8, tragic: 0.3 },
    "ArrangedMarriage": { romantic: 0.6, emotional: 0.5, intense: 0.3 },
    "AgeGap": { romantic: 0.6, emotional: 0.4 },
    "ChildhoodFriends": { romantic: 0.4, nostalgic: 0.6, wholesome: 0.4 },
    "Harem": { romantic: 0.6, funny: 0.4, exciting: 0.3 },
    "ReverseHarem": { romantic: 0.6, funny: 0.4, exciting: 0.3 },
    "Polyamory": { romantic: 0.6, emotional: 0.4 },
    "SecretIdentity": { mysterious: 0.6, exciting: 0.5, intense: 0.3 },
    "Rivalry": { exciting: 0.6, intense: 0.5 },
    "AntiHero": { dark: 0.5, exciting: 0.5, intense: 0.4 },
    "Parenthood": { wholesome: 0.7, emotional: 0.6, happy: 0.3 },

    // --- settings / worlds ---
    "Cyberpunk": { dark: 0.5, mysterious: 0.5, exciting: 0.4, intense: 0.4 },
    "PostApocalyptic": { dark: 0.6, intense: 0.7, scary: 0.3, tragic: 0.4 },
    "Royalty": { intense: 0.4, romantic: 0.3, exciting: 0.3 },
    "KingdomManagement": { intense: 0.5, mysterious: 0.3, exciting: 0.4 },
    "Pirates": { exciting: 0.7, intense: 0.5, hopeful: 0.3 },
    "Workplace": { relaxing: 0.3, emotional: 0.3, funny: 0.3 },
    "VirtualReality": { exciting: 0.5, mysterious: 0.5, intense: 0.4 },
    "VideoGameWorld": { exciting: 0.6, hopeful: 0.4, funny: 0.3 },
    "Noir": { mysterious: 0.7, dark: 0.6, intense: 0.5 },
    "Delinquents": { intense: 0.4, exciting: 0.4, funny: 0.3 },

    // --- tropes / plot devices ---
    "Vampire": { dark: 0.5, mysterious: 0.5, scary: 0.3, romantic: 0.3 },
    "Zombie": { scary: 0.7, dark: 0.6, intense: 0.6 },
    "Ghost": { scary: 0.6, mysterious: 0.6, dark: 0.3 },
    "Ninja": { exciting: 0.6, intense: 0.5 },
    "Magic": { exciting: 0.5, mysterious: 0.4, hopeful: 0.3 },
    "Swordplay": { exciting: 0.6, intense: 0.5, violent: 0.3 },
    "Superpowers": { exciting: 0.7, intense: 0.5, hopeful: 0.3 },
    "MemoryLoss": { tragic: 0.5, mysterious: 0.6, emotional: 0.5 },
    "BodySwap": { funny: 0.5, mysterious: 0.4, exciting: 0.3 },
    "GenderBender": { funny: 0.5, exciting: 0.3 },
    "Crossdressing": { funny: 0.5, romantic: 0.3 },
    "TimeSkip": { nostalgic: 0.4, emotional: 0.4, hopeful: 0.3 },
    "Heist": { exciting: 0.7, intense: 0.5, mysterious: 0.3 },
    "Slavery": { dark: 0.8, tragic: 0.7, intense: 0.5 },
    "Kidnapping": { dark: 0.7, intense: 0.6, scary: 0.4 },
    "Bullying": { dark: 0.5, tragic: 0.5, emotional: 0.6 },
    "Idol": { happy: 0.5, exciting: 0.4, hopeful: 0.4 },
    "Cooking": { happy: 0.4, relaxing: 0.4, wholesome: 0.3 },

    // AUTO-EXPAND:THEME — autoExpandMoodConfig.js inserts new theme entries above this line. Don't remove this marker.
};

// Demographics are a much weaker, broader signal than genre/theme (hence
// SOURCE_MULTIPLIERS.Demographic = 0.2 above — already defined, but never
// actually applied anywhere until calculateMood processes this table too).
export const DEMOGRAPHIC_WEIGHTS = {
    "Shounen": { exciting: 0.6, hopeful: 0.4 },
    "Shoujo": { romantic: 0.6, emotional: 0.4 },
    "Seinen": { dark: 0.4, mysterious: 0.3, intense: 0.3 },
    "Josei": { emotional: 0.5, romantic: 0.3 },
    "Kids": { happy: 0.6, wholesome: 0.5 },
    "Kodomo": { happy: 0.6, wholesome: 0.5 },

    // AUTO-EXPAND:DEMOGRAPHIC — autoExpandMoodConfig.js inserts new demographic entries above this line. Don't remove this marker.
};
