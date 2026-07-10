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

    "SliceOfLife": { emotional: 1, funny: 0.41, romantic: 0.4, happy: 0.38, tragic: 0.37 }, // AUTO: inferred from 40 concept(s), 133 co-occurring signal(s)
    "SciFi": { exciting: 1, mysterious: 0.69, dark: 0.56, intense: 0.43, violent: 0.4 }, // AUTO: inferred from 29 concept(s), 78 co-occurring signal(s)
    "DarkFantasy": { dark: 1, scary: 0.98, violent: 0.68, exciting: 0.4, mysterious: 0.37 }, // AUTO: inferred from 2 concept(s), 7 co-occurring signal(s) — LOW CONFIDENCE, review
    "Erotica": { emotional: 1, exciting: 0.96, romantic: 0.93, intense: 0.63, tragic: 0.53 }, // AUTO: inferred from 1 concept(s), 8 co-occurring signal(s) — LOW CONFIDENCE, review
    "GirlsLove": { romantic: 1, emotional: 0.6, happy: 0.49 }, // AUTO: inferred from 1 concept(s), 2 co-occurring signal(s) — LOW CONFIDENCE, review
    "Medical": { emotional: 1, tragic: 0.61 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "Survival": { intense: 1, emotional: 0.78, dark: 0.6, tragic: 0.52, scary: 0.42 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
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

    "Full Color": { emotional: 1, exciting: 0.95, romantic: 0.79, mysterious: 0.63, happy: 0.43 }, // AUTO: inferred from 753 concept(s), 3766 co-occurring signal(s)
    "Male Protagonist": { exciting: 1, emotional: 0.84, romantic: 0.65, mysterious: 0.64, violent: 0.42 }, // AUTO: inferred from 666 concept(s), 3519 co-occurring signal(s)
    "Boys' Love": { emotional: 1, romantic: 0.89, exciting: 0.53, mysterious: 0.48, happy: 0.47 }, // AUTO: inferred from 620 concept(s), 2717 co-occurring signal(s)
    "Anthology": { romantic: 1, emotional: 0.9, exciting: 0.62, mysterious: 0.56, happy: 0.45 }, // AUTO: inferred from 543 concept(s), 2239 co-occurring signal(s)
    "Female Protagonist": { emotional: 1, exciting: 0.94, romantic: 0.8, mysterious: 0.7, happy: 0.49 }, // AUTO: inferred from 460 concept(s), 2459 co-occurring signal(s)
    "School": { emotional: 1, romantic: 0.95, exciting: 0.69, happy: 0.59, mysterious: 0.54 }, // AUTO: inferred from 389 concept(s), 1851 co-occurring signal(s)
    "Heterosexual": { romantic: 1, emotional: 0.99, exciting: 0.56, happy: 0.52, mysterious: 0.41 }, // AUTO: inferred from 285 concept(s), 1296 co-occurring signal(s)
    "Long Strip": { emotional: 1, exciting: 0.84, romantic: 0.75, mysterious: 0.54, tragic: 0.4 }, // AUTO: inferred from 246 concept(s), 1154 co-occurring signal(s)
    "Nudity": { emotional: 1, romantic: 0.95, exciting: 0.67, mysterious: 0.46, happy: 0.42 }, // AUTO: inferred from 179 concept(s), 840 co-occurring signal(s)
    "Yuri": { romantic: 1, emotional: 1, exciting: 0.6, happy: 0.56, mysterious: 0.43 }, // AUTO: inferred from 168 concept(s), 703 co-occurring signal(s)
    "Primarily Adult Cast": { emotional: 1, romantic: 0.84, happy: 0.54, exciting: 0.52, mysterious: 0.48 }, // AUTO: inferred from 161 concept(s), 744 co-occurring signal(s)
    "Historical": { exciting: 1, emotional: 0.88, romantic: 0.63, mysterious: 0.58, violent: 0.42 }, // AUTO: inferred from 153 concept(s), 822 co-occurring signal(s)
    "Age Gap": { emotional: 1, romantic: 0.96, happy: 0.52, exciting: 0.5, funny: 0.41 }, // AUTO: inferred from 111 concept(s), 468 co-occurring signal(s)
    "Large Breasts": { romantic: 1, emotional: 0.69, exciting: 0.5, mysterious: 0.38, happy: 0.37 }, // AUTO: inferred from 101 concept(s), 348 co-occurring signal(s)
    "Tragedy": { emotional: 1, mysterious: 0.94, exciting: 0.88, dark: 0.83, romantic: 0.57 }, // AUTO: inferred from 101 concept(s), 584 co-occurring signal(s)
    "Nakadashi": { romantic: 1, emotional: 0.71, exciting: 0.47, mysterious: 0.36, happy: 0.33 }, // AUTO: inferred from 91 concept(s), 291 co-occurring signal(s)
    "Demons": { exciting: 1, mysterious: 0.71, emotional: 0.52, violent: 0.44, romantic: 0.41 }, // AUTO: inferred from 89 concept(s), 549 co-occurring signal(s)
    "Female Harem": { exciting: 1, romantic: 0.71, emotional: 0.59, funny: 0.48, mysterious: 0.42 }, // AUTO: inferred from 87 concept(s), 453 co-occurring signal(s)
    "Primarily Male Cast": { emotional: 1, romantic: 0.85, exciting: 0.72, happy: 0.57, mysterious: 0.51 }, // AUTO: inferred from 86 concept(s), 402 co-occurring signal(s)
    "Work": { emotional: 1, romantic: 0.86, happy: 0.7, exciting: 0.61, mysterious: 0.59 }, // AUTO: inferred from 84 concept(s), 394 co-occurring signal(s)
    "Super Power": { exciting: 1, mysterious: 0.7, emotional: 0.53, violent: 0.4, romantic: 0.37 }, // AUTO: inferred from 82 concept(s), 476 co-occurring signal(s)
    "Primarily Female Cast": { emotional: 1, romantic: 0.85, exciting: 0.76, happy: 0.65, funny: 0.51 }, // AUTO: inferred from 81 concept(s), 368 co-occurring signal(s)
    "Rape": { emotional: 1, romantic: 0.99, exciting: 0.67, mysterious: 0.52, tragic: 0.39 }, // AUTO: inferred from 78 concept(s), 299 co-occurring signal(s)
    "Foreign": { emotional: 1, exciting: 0.75, mysterious: 0.72, romantic: 0.68, dark: 0.45 }, // AUTO: inferred from 71 concept(s), 346 co-occurring signal(s)
    "Crime": { mysterious: 1, emotional: 0.89, exciting: 0.77, dark: 0.71, intense: 0.55 }, // AUTO: inferred from 71 concept(s), 367 co-occurring signal(s)
    "Fellatio": { romantic: 1, emotional: 0.78, happy: 0.4, funny: 0.35, exciting: 0.33 }, // AUTO: inferred from 65 concept(s), 202 co-occurring signal(s)
    "Primarily Teen Cast": { romantic: 1, emotional: 0.91, exciting: 0.65, happy: 0.54, funny: 0.49 }, // AUTO: inferred from 61 concept(s), 252 co-occurring signal(s)
    "Politics": { emotional: 1, exciting: 0.74, mysterious: 0.51, tragic: 0.46, romantic: 0.35 }, // AUTO: inferred from 55 concept(s), 229 co-occurring signal(s)
    "Anal Sex": { romantic: 1, emotional: 0.87, happy: 0.54, funny: 0.5, mysterious: 0.41 }, // AUTO: inferred from 54 concept(s), 202 co-occurring signal(s)
    "Military": { exciting: 1, emotional: 0.51, violent: 0.48, mysterious: 0.38, romantic: 0.34 }, // AUTO: inferred from 53 concept(s), 282 co-occurring signal(s)
    "Love Triangle": { emotional: 1, romantic: 0.84, happy: 0.49, funny: 0.41, exciting: 0.4 }, // AUTO: inferred from 53 concept(s), 243 co-occurring signal(s)
    "Animals": { exciting: 1, emotional: 0.84, mysterious: 0.74, romantic: 0.62, happy: 0.61 }, // AUTO: inferred from 52 concept(s), 269 co-occurring signal(s)
    "Incest": { romantic: 1, emotional: 0.9, happy: 0.39, mysterious: 0.38, exciting: 0.36 }, // AUTO: inferred from 51 concept(s), 183 co-occurring signal(s)
    "Martial Arts": { exciting: 1, violent: 0.48, emotional: 0.44, mysterious: 0.38, romantic: 0.28 }, // AUTO: inferred from 49 concept(s), 282 co-occurring signal(s)
    "Food": { emotional: 1, romantic: 0.95, happy: 0.84, exciting: 0.7, funny: 0.64 }, // AUTO: inferred from 48 concept(s), 237 co-occurring signal(s)
    "LGBTQ+ Themes": { emotional: 1, romantic: 0.66, exciting: 0.46, mysterious: 0.43, happy: 0.39 }, // AUTO: inferred from 47 concept(s), 208 co-occurring signal(s)
    "Episodic": { mysterious: 1, emotional: 0.91, exciting: 0.8, dark: 0.64, romantic: 0.64 }, // AUTO: inferred from 47 concept(s), 248 co-occurring signal(s)
    "Flat Chest": { romantic: 1, emotional: 0.68, exciting: 0.51, mysterious: 0.42, happy: 0.38 }, // AUTO: inferred from 46 concept(s), 154 co-occurring signal(s)
    "Urban Fantasy": { exciting: 1, mysterious: 0.84, violent: 0.54, emotional: 0.52, dark: 0.49 }, // AUTO: inferred from 44 concept(s), 281 co-occurring signal(s)
    "College": { emotional: 1, romantic: 0.85, happy: 0.54, exciting: 0.5, mysterious: 0.44 }, // AUTO: inferred from 39 concept(s), 174 co-occurring signal(s)
    "Post-Apocalyptic": { exciting: 1, mysterious: 0.53, emotional: 0.4, violent: 0.39, hopeful: 0.25 }, // AUTO: inferred from 39 concept(s), 245 co-occurring signal(s)
    "Time Manipulation": { exciting: 1, emotional: 0.92, mysterious: 0.85, romantic: 0.64, tragic: 0.39 }, // AUTO: inferred from 37 concept(s), 224 co-occurring signal(s)
    "MILF": { romantic: 1, emotional: 0.79, exciting: 0.48, happy: 0.31, tragic: 0.3 }, // AUTO: inferred from 36 concept(s), 108 co-occurring signal(s)
    "Family Life": { emotional: 1, romantic: 0.77, happy: 0.64, mysterious: 0.55, exciting: 0.49 }, // AUTO: inferred from 36 concept(s), 188 co-occurring signal(s)
    "Anti-Hero": { exciting: 1, mysterious: 0.82, dark: 0.8, emotional: 0.71, violent: 0.65 }, // AUTO: inferred from 35 concept(s), 235 co-occurring signal(s)
    "Police": { exciting: 1, mysterious: 1, emotional: 0.9, violent: 0.51, dark: 0.5 }, // AUTO: inferred from 35 concept(s), 214 co-occurring signal(s)
    "Gender Bending": { exciting: 1, emotional: 0.79, mysterious: 0.77, romantic: 0.69, funny: 0.56 }, // AUTO: inferred from 35 concept(s), 170 co-occurring signal(s)
    "Medicine": { emotional: 1, exciting: 0.69, mysterious: 0.63, romantic: 0.56, tragic: 0.43 }, // AUTO: inferred from 33 concept(s), 158 co-occurring signal(s)
    "School Club": { emotional: 1, romantic: 0.96, exciting: 0.82, happy: 0.82, funny: 0.65 }, // AUTO: inferred from 31 concept(s), 136 co-occurring signal(s)
    "Aliens": { exciting: 1, mysterious: 0.74, emotional: 0.66, romantic: 0.48, happy: 0.38 }, // AUTO: inferred from 31 concept(s), 190 co-occurring signal(s)
    "Coming of Age": { emotional: 1, exciting: 0.66, romantic: 0.66, mysterious: 0.52, happy: 0.48 }, // AUTO: inferred from 30 concept(s), 165 co-occurring signal(s)
    "Teacher": { emotional: 1, romantic: 0.9, happy: 0.58, funny: 0.55, exciting: 0.43 }, // AUTO: inferred from 29 concept(s), 117 co-occurring signal(s)
    "Space": { exciting: 1, mysterious: 0.56, emotional: 0.46, romantic: 0.39, intense: 0.32 }, // AUTO: inferred from 29 concept(s), 147 co-occurring signal(s)
    "Youkai": { exciting: 1, mysterious: 0.79, violent: 0.49, romantic: 0.47, emotional: 0.47 }, // AUTO: inferred from 29 concept(s), 162 co-occurring signal(s)
    "Group Sex": { romantic: 1, emotional: 0.71, exciting: 0.54, happy: 0.32, funny: 0.31 }, // AUTO: inferred from 29 concept(s), 93 co-occurring signal(s)
    "Bondage": { emotional: 1, romantic: 0.97, mysterious: 0.53, dark: 0.45, happy: 0.41 }, // AUTO: inferred from 28 concept(s), 98 co-occurring signal(s)
    "Philosophy": { mysterious: 1, emotional: 0.83, dark: 0.68, exciting: 0.63, romantic: 0.43 }, // AUTO: inferred from 28 concept(s), 147 co-occurring signal(s)
    "Robots": { exciting: 1, mysterious: 0.65, emotional: 0.51, romantic: 0.48, intense: 0.35 }, // AUTO: inferred from 28 concept(s), 167 co-occurring signal(s)
    "Video Games": { exciting: 1, emotional: 0.5, mysterious: 0.47, funny: 0.37, romantic: 0.37 }, // AUTO: inferred from 28 concept(s), 166 co-occurring signal(s)
    "Acting": { emotional: 1, romantic: 0.62, happy: 0.42, tragic: 0.41, mysterious: 0.32 }, // AUTO: inferred from 27 concept(s), 115 co-occurring signal(s)
    "Kemonomimi": { exciting: 1, romantic: 0.93, emotional: 0.82, mysterious: 0.69, happy: 0.56 }, // AUTO: inferred from 26 concept(s), 120 co-occurring signal(s)
    "Netorare": { emotional: 1, romantic: 0.87, tragic: 0.44, happy: 0.27, mysterious: 0.27 }, // AUTO: inferred from 26 concept(s), 87 co-occurring signal(s)
    "4-koma": { happy: 1, funny: 0.92, exciting: 0.91, romantic: 0.9, emotional: 0.87 }, // AUTO: inferred from 26 concept(s), 149 co-occurring signal(s)
    "Defloration": { romantic: 1, emotional: 0.9, exciting: 0.58, mysterious: 0.44, tragic: 0.41 }, // AUTO: inferred from 25 concept(s), 97 co-occurring signal(s)
    "Surreal Comedy": { exciting: 1, romantic: 0.66, funny: 0.65, happy: 0.58, emotional: 0.58 }, // AUTO: inferred from 25 concept(s), 143 co-occurring signal(s)
    "Threesome": { romantic: 1, emotional: 0.8, exciting: 0.46, funny: 0.41, happy: 0.38 }, // AUTO: inferred from 25 concept(s), 98 co-occurring signal(s)
    "Ensemble Cast": { exciting: 1, mysterious: 0.66, emotional: 0.6, romantic: 0.45, violent: 0.42 }, // AUTO: inferred from 24 concept(s), 136 co-occurring signal(s)
    "Rural": { emotional: 1, exciting: 0.74, mysterious: 0.73, romantic: 0.59, dark: 0.48 }, // AUTO: inferred from 24 concept(s), 117 co-occurring signal(s)
    "Urban": { emotional: 1, mysterious: 0.83, exciting: 0.67, romantic: 0.6, dark: 0.51 }, // AUTO: inferred from 24 concept(s), 134 co-occurring signal(s)
    "Tanned Skin": { romantic: 1, emotional: 0.54, happy: 0.36, funny: 0.32, mysterious: 0.31 }, // AUTO: inferred from 24 concept(s), 74 co-occurring signal(s)
    "Royal Affairs": { exciting: 1, emotional: 0.88, romantic: 0.74, mysterious: 0.58, hopeful: 0.44 }, // AUTO: inferred from 23 concept(s), 124 co-occurring signal(s)
    "Guns": { exciting: 1, mysterious: 0.62, emotional: 0.52, violent: 0.48, dark: 0.39 }, // AUTO: inferred from 23 concept(s), 145 co-occurring signal(s)
    "Educational": { emotional: 1, happy: 0.91, exciting: 0.86, funny: 0.81, relaxing: 0.72 }, // AUTO: inferred from 23 concept(s), 89 co-occurring signal(s)
    "Gods": { exciting: 1, mysterious: 0.89, emotional: 0.76, romantic: 0.53, dark: 0.47 }, // AUTO: inferred from 23 concept(s), 132 co-occurring signal(s)
    "Time Skip": { emotional: 1, romantic: 0.75, exciting: 0.71, mysterious: 0.65, dark: 0.48 }, // AUTO: inferred from 23 concept(s), 119 co-occurring signal(s)
    "Monster Girl": { exciting: 1, romantic: 0.86, mysterious: 0.82, emotional: 0.72, happy: 0.5 }, // AUTO: inferred from 23 concept(s), 105 co-occurring signal(s)
    "Mythology": { exciting: 1, mysterious: 0.74, emotional: 0.55, romantic: 0.4, hopeful: 0.38 }, // AUTO: inferred from 23 concept(s), 129 co-occurring signal(s)
    "Cunnilingus": { romantic: 1, emotional: 0.81, exciting: 0.73, mysterious: 0.41, violent: 0.34 }, // AUTO: inferred from 22 concept(s), 87 co-occurring signal(s)
    "Office Lady": { romantic: 1, emotional: 0.94, happy: 0.49, tragic: 0.32, exciting: 0.31 }, // AUTO: inferred from 22 concept(s), 82 co-occurring signal(s)
    "Amnesia": { emotional: 1, mysterious: 0.97, exciting: 0.77, romantic: 0.67, dark: 0.65 }, // AUTO: inferred from 22 concept(s), 136 co-occurring signal(s)
    "Detective": { mysterious: 1, dark: 0.54, emotional: 0.51, exciting: 0.37, intense: 0.33 }, // AUTO: inferred from 22 concept(s), 112 co-occurring signal(s)
    "Elf": { exciting: 1, romantic: 0.53, mysterious: 0.5, emotional: 0.46, hopeful: 0.44 }, // AUTO: inferred from 21 concept(s), 102 co-occurring signal(s)
    "Virginity": { romantic: 1, emotional: 0.94, happy: 0.6, exciting: 0.57, funny: 0.53 }, // AUTO: inferred from 21 concept(s), 87 co-occurring signal(s)
    "Drawing": { emotional: 1, romantic: 0.77, mysterious: 0.68, happy: 0.67, funny: 0.57 }, // AUTO: inferred from 21 concept(s), 98 co-occurring signal(s)
    "Twins": { emotional: 1, exciting: 0.9, mysterious: 0.75, romantic: 0.72, happy: 0.49 }, // AUTO: inferred from 21 concept(s), 126 co-occurring signal(s)
    "Disability": { emotional: 1, romantic: 0.65, dark: 0.5, happy: 0.49, exciting: 0.47 }, // AUTO: inferred from 21 concept(s), 107 co-occurring signal(s)
    "Cultivation": { exciting: 1, mysterious: 0.45, violent: 0.38, emotional: 0.34, hopeful: 0.33 }, // AUTO: inferred from 21 concept(s), 109 co-occurring signal(s)
    "Gyaru": { romantic: 1, emotional: 0.61, happy: 0.49, funny: 0.38, relaxing: 0.23 }, // AUTO: inferred from 21 concept(s), 71 co-occurring signal(s)
    "Prostitution": { romantic: 1, emotional: 0.95, exciting: 0.49, mysterious: 0.46, tragic: 0.36 }, // AUTO: inferred from 21 concept(s), 77 co-occurring signal(s)
    "Boobjob": { romantic: 1, exciting: 0.73, emotional: 0.73, happy: 0.44, mysterious: 0.43 }, // AUTO: inferred from 20 concept(s), 77 co-occurring signal(s)
    "Parody": { exciting: 1, funny: 0.71, mysterious: 0.59, happy: 0.53, emotional: 0.53 }, // AUTO: inferred from 20 concept(s), 110 co-occurring signal(s)
    "Body Horror": { dark: 1, mysterious: 0.95, exciting: 0.83, scary: 0.79, emotional: 0.66 }, // AUTO: inferred from 20 concept(s), 139 co-occurring signal(s)
    "Assassins": { exciting: 1, violent: 0.55, emotional: 0.54, mysterious: 0.51, romantic: 0.39 }, // AUTO: inferred from 19 concept(s), 95 co-occurring signal(s)
    "Witch": { exciting: 1, mysterious: 0.74, emotional: 0.42, romantic: 0.39, hopeful: 0.37 }, // AUTO: inferred from 19 concept(s), 120 co-occurring signal(s)
    "Yakuza": { exciting: 1, emotional: 0.93, mysterious: 0.73, romantic: 0.63, violent: 0.62 }, // AUTO: inferred from 19 concept(s), 103 co-occurring signal(s)
    "Teens' Love": { romantic: 1, emotional: 0.95, happy: 0.44, exciting: 0.36, tragic: 0.29 }, // AUTO: inferred from 19 concept(s), 73 co-occurring signal(s)
    "Futanari": { romantic: 1, emotional: 0.7, exciting: 0.54, mysterious: 0.48, happy: 0.26 }, // AUTO: inferred from 19 concept(s), 75 co-occurring signal(s)
    "Femdom": { romantic: 1, emotional: 0.87, exciting: 0.53, tragic: 0.35, mysterious: 0.35 }, // AUTO: inferred from 19 concept(s), 66 co-occurring signal(s)
    "Dystopian": { exciting: 1, mysterious: 0.6, emotional: 0.45, violent: 0.4, intense: 0.33 }, // AUTO: inferred from 18 concept(s), 114 co-occurring signal(s)
    "Anthropomorphism": { exciting: 1, emotional: 0.97, romantic: 0.85, mysterious: 0.83, happy: 0.62 }, // AUTO: inferred from 18 concept(s), 81 co-occurring signal(s)
    "Suicide": { emotional: 1, exciting: 0.61, mysterious: 0.59, romantic: 0.54, dark: 0.49 }, // AUTO: inferred from 18 concept(s), 97 co-occurring signal(s)
    "Death Game": { exciting: 1, mysterious: 0.89, dark: 0.79, emotional: 0.72, violent: 0.58 }, // AUTO: inferred from 18 concept(s), 125 co-occurring signal(s)
    "Cute Girls Doing Cute Things": { exciting: 1, happy: 0.95, relaxing: 0.8, funny: 0.79, romantic: 0.64 }, // AUTO: inferred from 18 concept(s), 96 co-occurring signal(s)
    "Shapeshifting": { exciting: 1, mysterious: 0.98, emotional: 0.82, romantic: 0.71, dark: 0.46 }, // AUTO: inferred from 18 concept(s), 96 co-occurring signal(s)
    "AdultLife": { emotional: 1, romantic: 0.55, tragic: 0.36, happy: 0.25, funny: 0.24 }, // AUTO: inferred from 18 concept(s), 59 co-occurring signal(s)
    "Dragons": { exciting: 1, emotional: 0.68, mysterious: 0.54, romantic: 0.49, funny: 0.45 }, // AUTO: inferred from 17 concept(s), 98 co-occurring signal(s)
    "Public Sex": { romantic: 1, emotional: 0.92, exciting: 0.62, violent: 0.41, tragic: 0.39 }, // AUTO: inferred from 17 concept(s), 51 co-occurring signal(s)
    "Baseball": { exciting: 1, emotional: 0.98, romantic: 0.63, happy: 0.5, hopeful: 0.5 }, // AUTO: inferred from 16 concept(s), 82 co-occurring signal(s)
    "Ahegao": { romantic: 1, emotional: 0.87, exciting: 0.48, mysterious: 0.44, happy: 0.37 }, // AUTO: inferred from 16 concept(s), 55 co-occurring signal(s)
    "Autobiographical": { emotional: 1, mysterious: 0.7, dark: 0.66, tragic: 0.5, romantic: 0.49 }, // AUTO: inferred from 16 concept(s), 83 co-occurring signal(s)
    "Virtual World": { exciting: 1, mysterious: 0.47, emotional: 0.38, violent: 0.32, hopeful: 0.31 }, // AUTO: inferred from 16 concept(s), 105 co-occurring signal(s)
    "Femboy": { romantic: 1, emotional: 0.72, funny: 0.5, exciting: 0.47, happy: 0.34 }, // AUTO: inferred from 16 concept(s), 66 co-occurring signal(s)
    "Masturbation": { emotional: 1, romantic: 0.99, happy: 0.47, tragic: 0.41, exciting: 0.41 }, // AUTO: inferred from 16 concept(s), 65 co-occurring signal(s)
    "Teamwork": { exciting: 1, hopeful: 0.61, violent: 0.25, emotional: 0.25, intense: 0.24 }, // AUTO: inferred from 16 concept(s), 52 co-occurring signal(s)
    "Travel": { exciting: 1, emotional: 0.64, mysterious: 0.46, romantic: 0.41, hopeful: 0.37 }, // AUTO: inferred from 15 concept(s), 87 co-occurring signal(s)
    "Wuxia": { exciting: 1, mysterious: 0.44, emotional: 0.42, violent: 0.4, romantic: 0.34 }, // AUTO: inferred from 15 concept(s), 91 co-occurring signal(s)
    "Family": { emotional: 1, tragic: 0.49, romantic: 0.4, exciting: 0.27, happy: 0.23 }, // AUTO: inferred from 15 concept(s), 40 co-occurring signal(s)
    "Body Swapping": { emotional: 1, romantic: 0.79, mysterious: 0.57, dark: 0.52, exciting: 0.48 }, // AUTO: inferred from 14 concept(s), 69 co-occurring signal(s)
    "Marriage": { emotional: 1, romantic: 0.75, mysterious: 0.51, happy: 0.4, exciting: 0.37 }, // AUTO: inferred from 14 concept(s), 67 co-occurring signal(s)
    "Omegaverse": { emotional: 1, romantic: 0.87, happy: 0.41, mysterious: 0.38, tragic: 0.34 }, // AUTO: inferred from 14 concept(s), 67 co-occurring signal(s)
    "Classic Literature": { emotional: 1, mysterious: 0.84, exciting: 0.78, dark: 0.72, romantic: 0.41 }, // AUTO: inferred from 14 concept(s), 43 co-occurring signal(s)
    "Tentacles": { mysterious: 1, romantic: 1, exciting: 0.75, emotional: 0.67, dark: 0.51 }, // AUTO: inferred from 14 concept(s), 66 co-occurring signal(s)
    "Slapstick": { emotional: 1, romantic: 0.97, happy: 0.85, funny: 0.82, exciting: 0.66 }, // AUTO: inferred from 14 concept(s), 73 co-occurring signal(s)
    "Handjob": { romantic: 1, emotional: 0.73, exciting: 0.52, happy: 0.42, mysterious: 0.39 }, // AUTO: inferred from 14 concept(s), 44 co-occurring signal(s)
    "Maids": { emotional: 1, romantic: 0.96, exciting: 0.85, happy: 0.49, violent: 0.4 }, // AUTO: inferred from 14 concept(s), 60 co-occurring signal(s)
    "Artificial Intelligence": { exciting: 1, mysterious: 0.55, emotional: 0.41, violent: 0.27, romantic: 0.27 }, // AUTO: inferred from 14 concept(s), 78 co-occurring signal(s)
    "Primarily Child Cast": { exciting: 1, emotional: 0.64, romantic: 0.51, mysterious: 0.5, violent: 0.37 }, // AUTO: inferred from 13 concept(s), 78 co-occurring signal(s)
    "Sadism": { emotional: 1, romantic: 0.71, mysterious: 0.45, exciting: 0.43, dark: 0.42 }, // AUTO: inferred from 13 concept(s), 60 co-occurring signal(s)
    "Drugs": { emotional: 1, exciting: 0.84, mysterious: 0.78, romantic: 0.64, dark: 0.45 }, // AUTO: inferred from 13 concept(s), 61 co-occurring signal(s)
    "Age Regression": { exciting: 1, emotional: 0.59, romantic: 0.53, mysterious: 0.49, violent: 0.43 }, // AUTO: inferred from 13 concept(s), 80 co-occurring signal(s)
    "Unrequited Love": { emotional: 1, romantic: 0.69, happy: 0.46, exciting: 0.4, tragic: 0.37 }, // AUTO: inferred from 13 concept(s), 60 co-occurring signal(s)
    "Rehabilitation": { emotional: 1, happy: 0.6, romantic: 0.6, exciting: 0.54, mysterious: 0.49 }, // AUTO: inferred from 13 concept(s), 63 co-occurring signal(s)
    "Sex Toys": { exciting: 1, romantic: 0.83, emotional: 0.75, mysterious: 0.5, violent: 0.38 }, // AUTO: inferred from 13 concept(s), 58 co-occurring signal(s)
    "Alternate Universe": { exciting: 1, emotional: 0.55, mysterious: 0.49, violent: 0.41, romantic: 0.35 }, // AUTO: inferred from 13 concept(s), 82 co-occurring signal(s)
    "Bisexual": { emotional: 1, romantic: 0.78, exciting: 0.68, mysterious: 0.48, tragic: 0.41 }, // AUTO: inferred from 13 concept(s), 54 co-occurring signal(s)
    "Inseki": { emotional: 1, romantic: 0.88, tragic: 0.42, exciting: 0.26, mysterious: 0.25 }, // AUTO: inferred from 12 concept(s), 41 co-occurring signal(s)
    "Exhibitionism": { romantic: 1, exciting: 0.65, emotional: 0.43, happy: 0.27, hopeful: 0.25 }, // AUTO: inferred from 12 concept(s), 29 co-occurring signal(s)
    "Otaku Culture": { exciting: 1, emotional: 0.68, romantic: 0.64, happy: 0.54, funny: 0.5 }, // AUTO: inferred from 12 concept(s), 71 co-occurring signal(s)
    "Gangs": { exciting: 1, emotional: 0.87, mysterious: 0.67, violent: 0.62, intense: 0.43 }, // AUTO: inferred from 12 concept(s), 67 co-occurring signal(s)
    "Tokusatsu": { exciting: 1, violent: 0.54, mysterious: 0.51, emotional: 0.38, romantic: 0.35 }, // AUTO: inferred from 12 concept(s), 77 co-occurring signal(s)
    "Samurai": { exciting: 1, emotional: 0.54, violent: 0.5, romantic: 0.33, mysterious: 0.28 }, // AUTO: inferred from 12 concept(s), 69 co-occurring signal(s)
    "Henshin": { exciting: 1, mysterious: 0.65, violent: 0.63, emotional: 0.62, romantic: 0.53 }, // AUTO: inferred from 12 concept(s), 64 co-occurring signal(s)
    "Masochism": { emotional: 1, romantic: 0.77, exciting: 0.47, tragic: 0.4, happy: 0.35 }, // AUTO: inferred from 11 concept(s), 50 co-occurring signal(s)
    "Dungeon": { exciting: 1, emotional: 0.45, romantic: 0.41, hopeful: 0.39, violent: 0.38 }, // AUTO: inferred from 11 concept(s), 68 co-occurring signal(s)
    "Cosmic Horror": { mysterious: 1, dark: 0.94, scary: 0.68, exciting: 0.62, emotional: 0.61 }, // AUTO: inferred from 11 concept(s), 74 co-occurring signal(s)
    "Angels": { exciting: 1, emotional: 0.74, mysterious: 0.68, romantic: 0.63, violent: 0.51 }, // AUTO: inferred from 11 concept(s), 62 co-occurring signal(s)
    "Writing": { emotional: 1, exciting: 0.99, romantic: 0.7, mysterious: 0.64, happy: 0.47 }, // AUTO: inferred from 11 concept(s), 55 co-occurring signal(s)
    "Tomboy": { romantic: 1, emotional: 0.71, happy: 0.55, exciting: 0.46, funny: 0.35 }, // AUTO: inferred from 11 concept(s), 36 co-occurring signal(s)
    "Band": { emotional: 1, romantic: 0.61, happy: 0.55, tragic: 0.32, funny: 0.31 }, // AUTO: inferred from 11 concept(s), 56 co-occurring signal(s)
    "Blackmail": { emotional: 1, romantic: 0.93, mysterious: 0.5, exciting: 0.45, dark: 0.37 }, // AUTO: inferred from 11 concept(s), 49 co-occurring signal(s)
    "Regret": { emotional: 1, tragic: 0.41, mysterious: 0.35, dark: 0.34, romantic: 0.25 }, // AUTO: inferred from 11 concept(s), 43 co-occurring signal(s)
    "Art": { emotional: 1, tragic: 0.47, hopeful: 0.23 }, // AUTO: inferred from 11 concept(s), 38 co-occurring signal(s)
    "Werewolf": { exciting: 1, mysterious: 0.89, emotional: 0.89, romantic: 0.7, dark: 0.6 }, // AUTO: inferred from 10 concept(s), 65 co-occurring signal(s)
    "Economics": { exciting: 1, emotional: 0.67, romantic: 0.51, hopeful: 0.46, mysterious: 0.41 }, // AUTO: inferred from 10 concept(s), 51 co-occurring signal(s)
    "Fashion": { emotional: 1, romantic: 0.91, happy: 0.55, exciting: 0.49, funny: 0.37 }, // AUTO: inferred from 10 concept(s), 46 co-occurring signal(s)
    "Office": { emotional: 1, romantic: 0.91, exciting: 0.49, happy: 0.42, tragic: 0.37 }, // AUTO: inferred from 10 concept(s), 39 co-occurring signal(s)
    "Pregnancy": { emotional: 1, romantic: 0.82, tragic: 0.49, exciting: 0.36, mysterious: 0.23 }, // AUTO: inferred from 10 concept(s), 37 co-occurring signal(s)
    "MartialArts": { exciting: 1, violent: 0.52, hopeful: 0.23 }, // AUTO: inferred from 10 concept(s), 32 co-occurring signal(s)
    "MentalIllness": { dark: 1, emotional: 0.77, mysterious: 0.65 }, // AUTO: inferred from 10 concept(s), 37 co-occurring signal(s)
    "Fugitive": { exciting: 1, emotional: 0.86, mysterious: 0.77, romantic: 0.76, dark: 0.6 }, // AUTO: inferred from 9 concept(s), 58 co-occurring signal(s)
    "Netori": { emotional: 1, romantic: 0.99, exciting: 0.64, mysterious: 0.47, happy: 0.41 }, // AUTO: inferred from 9 concept(s), 37 co-occurring signal(s)
    "Conspiracy": { exciting: 1, mysterious: 0.73, emotional: 0.53, dark: 0.45, violent: 0.42 }, // AUTO: inferred from 9 concept(s), 59 co-occurring signal(s)
    "Meta": { exciting: 1, mysterious: 1, emotional: 0.7, funny: 0.45, romantic: 0.44 }, // AUTO: inferred from 9 concept(s), 50 co-occurring signal(s)
    "Facial": { emotional: 1, romantic: 0.9, happy: 0.69, funny: 0.64, mysterious: 0.62 }, // AUTO: inferred from 9 concept(s), 36 co-occurring signal(s)
    "Musical Theater": { emotional: 1, happy: 0.75, relaxing: 0.56, funny: 0.47, exciting: 0.46 }, // AUTO: inferred from 9 concept(s), 51 co-occurring signal(s)
    "Memory Manipulation": { emotional: 1, mysterious: 0.67, dark: 0.62, exciting: 0.59, romantic: 0.58 }, // AUTO: inferred from 9 concept(s), 40 co-occurring signal(s)
    "Fishing": { exciting: 1, emotional: 0.66, romantic: 0.6, mysterious: 0.51, funny: 0.37 }, // AUTO: inferred from 9 concept(s), 59 co-occurring signal(s)
    "Swimming": { exciting: 1, romantic: 0.8, emotional: 0.78, mysterious: 0.72, intense: 0.44 }, // AUTO: inferred from 9 concept(s), 43 co-occurring signal(s)
    "Mermaid": { mysterious: 1, emotional: 0.79, exciting: 0.67, dark: 0.64, romantic: 0.43 }, // AUTO: inferred from 9 concept(s), 48 co-occurring signal(s)
    "Superhero": { exciting: 1, emotional: 0.47, mysterious: 0.46, violent: 0.42, romantic: 0.37 }, // AUTO: inferred from 9 concept(s), 57 co-occurring signal(s)
    "Succubus": { romantic: 1, emotional: 0.65, mysterious: 0.54, happy: 0.49, funny: 0.39 }, // AUTO: inferred from 8 concept(s), 37 co-occurring signal(s)
    "Torture": { emotional: 1, romantic: 0.71, violent: 0.56, tragic: 0.54, exciting: 0.51 }, // AUTO: inferred from 8 concept(s), 35 co-occurring signal(s)
    "Criminal Organization": { exciting: 1, emotional: 0.87, violent: 0.7, mysterious: 0.48, romantic: 0.45 }, // AUTO: inferred from 8 concept(s), 42 co-occurring signal(s)
    "Denpa": { mysterious: 1, emotional: 0.96, dark: 0.93, romantic: 0.78, scary: 0.44 }, // AUTO: inferred from 8 concept(s), 45 co-occurring signal(s)
    "Male Harem": { exciting: 1, romantic: 0.76, emotional: 0.65, hopeful: 0.44, funny: 0.42 }, // AUTO: inferred from 8 concept(s), 52 co-occurring signal(s)
    "Medieval": { exciting: 1, emotional: 0.47, mysterious: 0.4, hopeful: 0.33, romantic: 0.31 }, // AUTO: inferred from 8 concept(s), 41 co-occurring signal(s)
    "Gambling": { emotional: 1, mysterious: 0.73, dark: 0.71, exciting: 0.57, tragic: 0.4 }, // AUTO: inferred from 8 concept(s), 39 co-occurring signal(s)
    "Transgender": { exciting: 1, emotional: 0.82, mysterious: 0.56, happy: 0.39, violent: 0.39 }, // AUTO: inferred from 8 concept(s), 37 co-occurring signal(s)
    "Afterlife": { mysterious: 1, emotional: 0.78, exciting: 0.6, dark: 0.55, happy: 0.43 }, // AUTO: inferred from 8 concept(s), 55 co-occurring signal(s)
    "Space Opera": { exciting: 1, intense: 0.38, mysterious: 0.35, violent: 0.29, emotional: 0.24 }, // AUTO: inferred from 8 concept(s), 39 co-occurring signal(s)
    "Cohabitation": { emotional: 1, romantic: 0.77, happy: 0.42, tragic: 0.35, dark: 0.28 }, // AUTO: inferred from 8 concept(s), 30 co-occurring signal(s)
    "SuperPower": { exciting: 1, violent: 0.56, mysterious: 0.32, hopeful: 0.23 }, // AUTO: inferred from 8 concept(s), 23 co-occurring signal(s)
    "Nobility": { emotional: 1, tragic: 0.42, romantic: 0.32, exciting: 0.29, mysterious: 0.26 }, // AUTO: inferred from 8 concept(s), 34 co-occurring signal(s)
    "Dystopia": { dark: 1, emotional: 0.87, exciting: 0.73, mysterious: 0.61, violent: 0.52 }, // AUTO: inferred from 8 concept(s), 21 co-occurring signal(s)
    "Friendship": { exciting: 1, funny: 0.82, happy: 0.75, romantic: 0.64, hopeful: 0.42 }, // AUTO: inferred from 8 concept(s), 22 co-occurring signal(s)
    "Isolation": { exciting: 1, intense: 0.95, dark: 0.91, emotional: 0.81, hopeful: 0.5 }, // AUTO: inferred from 8 concept(s), 26 co-occurring signal(s)
    "Dancing": { emotional: 1, romantic: 0.67, exciting: 0.64, tragic: 0.45, hopeful: 0.29 }, // AUTO: inferred from 7 concept(s), 32 co-occurring signal(s)
    "Bar": { romantic: 1, emotional: 1, happy: 0.83, exciting: 0.82, relaxing: 0.77 }, // AUTO: inferred from 7 concept(s), 35 co-occurring signal(s)
    "Deepthroat": { emotional: 1, exciting: 0.63, romantic: 0.53, tragic: 0.45, violent: 0.44 }, // AUTO: inferred from 7 concept(s), 24 co-occurring signal(s)
    "Monster Boy": { exciting: 1, mysterious: 0.79, romantic: 0.67, emotional: 0.63, scary: 0.56 }, // AUTO: inferred from 7 concept(s), 39 co-occurring signal(s)
    "Adoption": { emotional: 1, romantic: 0.68, happy: 0.39, tragic: 0.37, funny: 0.27 }, // AUTO: inferred from 7 concept(s), 29 co-occurring signal(s)
    "Fairy Tale": { mysterious: 1, exciting: 0.9, romantic: 0.7, emotional: 0.53, hopeful: 0.44 }, // AUTO: inferred from 7 concept(s), 33 co-occurring signal(s)
    "Orphan": { emotional: 1, mysterious: 0.85, dark: 0.79, exciting: 0.68, violent: 0.52 }, // AUTO: inferred from 7 concept(s), 38 co-occurring signal(s)
    "Volleyball": { exciting: 1, romantic: 0.97, emotional: 0.84, funny: 0.75, happy: 0.66 }, // AUTO: inferred from 7 concept(s), 31 co-occurring signal(s)
    "Ships": { mysterious: 1, exciting: 0.98, romantic: 0.9, emotional: 0.8, dark: 0.52 }, // AUTO: inferred from 7 concept(s), 37 co-occurring signal(s)
    "Kaiju": { exciting: 1, violent: 0.43, mysterious: 0.34, emotional: 0.21, intense: 0.2 }, // AUTO: inferred from 7 concept(s), 38 co-occurring signal(s)
    "Mafia": { exciting: 1, mysterious: 0.86, emotional: 0.61, violent: 0.55, dark: 0.48 }, // AUTO: inferred from 7 concept(s), 45 co-occurring signal(s)
    "Trains": { mysterious: 1, exciting: 0.89, emotional: 0.87, dark: 0.62, relaxing: 0.55 }, // AUTO: inferred from 7 concept(s), 44 co-occurring signal(s)
    "Religion": { exciting: 1, emotional: 0.96, mysterious: 0.86, romantic: 0.6, dark: 0.5 }, // AUTO: inferred from 7 concept(s), 35 co-occurring signal(s)
    "Squirting": { romantic: 1, emotional: 0.78, exciting: 0.6, happy: 0.35, tragic: 0.33 }, // AUTO: inferred from 7 concept(s), 21 co-occurring signal(s)
    "Ballet": { emotional: 1, romantic: 0.66, exciting: 0.52, tragic: 0.38, hopeful: 0.3 }, // AUTO: inferred from 6 concept(s), 31 co-occurring signal(s)
    "POV": { happy: 1, exciting: 1, relaxing: 0.93, romantic: 0.88, emotional: 0.81 }, // AUTO: inferred from 6 concept(s), 30 co-occurring signal(s)
    "Restaurant": { happy: 1, relaxing: 0.85, funny: 0.79, emotional: 0.71, romantic: 0.58 }, // AUTO: inferred from 6 concept(s), 25 co-occurring signal(s)
    "Exorcism": { exciting: 1, mysterious: 0.73, violent: 0.6, dark: 0.35, romantic: 0.3 }, // AUTO: inferred from 6 concept(s), 31 co-occurring signal(s)
    "Non-fiction": { emotional: 1, happy: 0.59, dark: 0.56, mysterious: 0.55, funny: 0.53 }, // AUTO: inferred from 6 concept(s), 20 co-occurring signal(s)
    "Terrorism": { mysterious: 1, exciting: 0.83, emotional: 0.79, dark: 0.63, romantic: 0.36 }, // AUTO: inferred from 6 concept(s), 34 co-occurring signal(s)
    "DILF": { romantic: 1, emotional: 0.98, exciting: 0.48, happy: 0.41, tragic: 0.41 }, // AUTO: inferred from 6 concept(s), 21 co-occurring signal(s)
    "Found Family": { exciting: 1, emotional: 0.94, funny: 0.71, happy: 0.7, romantic: 0.7 }, // AUTO: inferred from 6 concept(s), 34 co-occurring signal(s)
    "Achronological Order": { emotional: 1, mysterious: 0.72, happy: 0.71, funny: 0.56, romantic: 0.56 }, // AUTO: inferred from 6 concept(s), 35 co-occurring signal(s)
    "Cars": { emotional: 1, exciting: 0.78, romantic: 0.63, tragic: 0.45, mysterious: 0.4 }, // AUTO: inferred from 6 concept(s), 32 co-occurring signal(s)
    "Dissociative Identities": { emotional: 1, dark: 0.92, mysterious: 0.91, romantic: 0.73, exciting: 0.6 }, // AUTO: inferred from 6 concept(s), 36 co-occurring signal(s)
    "Environmental": { mysterious: 1, exciting: 0.94, hopeful: 0.44, emotional: 0.32, dark: 0.3 }, // AUTO: inferred from 6 concept(s), 26 co-occurring signal(s)
    "Motorcycles": { exciting: 1, mysterious: 0.4, violent: 0.39, romantic: 0.37, funny: 0.32 }, // AUTO: inferred from 6 concept(s), 30 co-occurring signal(s)
    "Nun": { romantic: 1, emotional: 0.9, exciting: 0.64, mysterious: 0.53, tragic: 0.37 }, // AUTO: inferred from 6 concept(s), 28 co-occurring signal(s)
    "Secrets": { romantic: 1, emotional: 0.78, happy: 0.42, intense: 0.31, dark: 0.3 }, // AUTO: inferred from 6 concept(s), 21 co-occurring signal(s)
    "Human Pet": { exciting: 1, romantic: 0.97, emotional: 0.96, mysterious: 0.51, violent: 0.46 }, // AUTO: inferred from 5 concept(s), 17 co-occurring signal(s)
    "Butler": { emotional: 1, romantic: 0.83, funny: 0.73, happy: 0.61, mysterious: 0.54 }, // AUTO: inferred from 5 concept(s), 31 co-occurring signal(s)
    "Ojou-sama": { emotional: 1, romantic: 0.61, funny: 0.57, happy: 0.51, mysterious: 0.47 }, // AUTO: inferred from 5 concept(s), 27 co-occurring signal(s)
    "Cannibalism": { exciting: 1, emotional: 0.76, violent: 0.67, mysterious: 0.61, dark: 0.48 }, // AUTO: inferred from 5 concept(s), 25 co-occurring signal(s)
    "Goblin": { exciting: 1, emotional: 0.55, romantic: 0.49, hopeful: 0.47, mysterious: 0.39 }, // AUTO: inferred from 5 concept(s), 24 co-occurring signal(s)
    "Makeup": { emotional: 1, romantic: 0.57, tragic: 0.53, dark: 0.45, mysterious: 0.34 }, // AUTO: inferred from 5 concept(s), 19 co-occurring signal(s)
    "Language Barrier": { exciting: 1, mysterious: 0.94, romantic: 0.78, emotional: 0.65, happy: 0.58 }, // AUTO: inferred from 5 concept(s), 27 co-occurring signal(s)
    "Espionage": { emotional: 1, exciting: 0.93, romantic: 0.84, mysterious: 0.79, hopeful: 0.37 }, // AUTO: inferred from 5 concept(s), 32 co-occurring signal(s)
    "Shrine Maiden": { exciting: 1, mysterious: 0.56, romantic: 0.55, emotional: 0.47, hopeful: 0.37 }, // AUTO: inferred from 5 concept(s), 31 co-occurring signal(s)
    "Curses": { exciting: 1, romantic: 0.79, mysterious: 0.57, emotional: 0.44, hopeful: 0.42 }, // AUTO: inferred from 5 concept(s), 27 co-occurring signal(s)
    "Fairy": { romantic: 1, emotional: 0.99, mysterious: 0.91, exciting: 0.8, hopeful: 0.53 }, // AUTO: inferred from 5 concept(s), 26 co-occurring signal(s)
    "Cheating": { romantic: 1, emotional: 0.88, exciting: 0.53, happy: 0.49, funny: 0.34 }, // AUTO: inferred from 5 concept(s), 21 co-occurring signal(s)
    "Hikikomori": { exciting: 1, mysterious: 0.84, romantic: 0.78, dark: 0.74, emotional: 0.67 }, // AUTO: inferred from 5 concept(s), 32 co-occurring signal(s)
    "Netorase": { romantic: 1, exciting: 0.57, emotional: 0.49, violent: 0.3, funny: 0.28 }, // AUTO: inferred from 5 concept(s), 10 co-occurring signal(s)
    "VTuber": { romantic: 1, emotional: 0.9, happy: 0.76, funny: 0.61, mysterious: 0.59 }, // AUTO: inferred from 5 concept(s), 17 co-occurring signal(s)
    "Tennis": { romantic: 1, exciting: 0.88, funny: 0.81, emotional: 0.66, happy: 0.64 }, // AUTO: inferred from 5 concept(s), 20 co-occurring signal(s)
    "No Dialogue": { mysterious: 1, emotional: 0.96, exciting: 0.95, dark: 0.73, romantic: 0.66 }, // AUTO: inferred from 5 concept(s), 31 co-occurring signal(s)
    "Feet": { emotional: 1, romantic: 0.91, exciting: 0.73, scary: 0.56, tragic: 0.48 }, // AUTO: inferred from 5 concept(s), 15 co-occurring signal(s)
    "Football": { emotional: 1, exciting: 0.74, intense: 0.58, romantic: 0.53, hopeful: 0.48 }, // AUTO: inferred from 5 concept(s), 25 co-occurring signal(s)
    "Ghosts": { mysterious: 1, dark: 0.83, scary: 0.79, intense: 0.28, violent: 0.21 }, // AUTO: inferred from 5 concept(s), 17 co-occurring signal(s)
    "Nature": { exciting: 1, mysterious: 0.61, hopeful: 0.61, intense: 0.24, dark: 0.23 }, // AUTO: inferred from 5 concept(s), 18 co-occurring signal(s)
    "Science": { mysterious: 1, exciting: 0.89, dark: 0.78, hopeful: 0.3, emotional: 0.29 }, // AUTO: inferred from 5 concept(s), 15 co-occurring signal(s)
    "Outdoor Activities": { exciting: 1, hopeful: 0.45, mysterious: 0.33, emotional: 0.28, violent: 0.26 }, // AUTO: inferred from 4 concept(s), 18 co-occurring signal(s)
    "Battle Royale": { exciting: 1, violent: 0.89, dark: 0.81, emotional: 0.78, scary: 0.66 }, // AUTO: inferred from 4 concept(s), 34 co-occurring signal(s)
    "Nekomimi": { exciting: 1, mysterious: 0.45, romantic: 0.45, hopeful: 0.41, happy: 0.41 }, // AUTO: inferred from 4 concept(s), 20 co-occurring signal(s)
    "Centaur": { exciting: 1, mysterious: 0.79, romantic: 0.73, emotional: 0.42, hopeful: 0.4 }, // AUTO: inferred from 4 concept(s), 22 co-occurring signal(s)
    "Circus": { exciting: 1, mysterious: 0.84, emotional: 0.8, dark: 0.71, violent: 0.45 }, // AUTO: inferred from 4 concept(s), 21 co-occurring signal(s)
    "Fake Relationship": { mysterious: 1, emotional: 0.95, exciting: 0.88, romantic: 0.71, hopeful: 0.37 }, // AUTO: inferred from 4 concept(s), 21 co-occurring signal(s)
    "Rimjob": { emotional: 1, romantic: 0.74, mysterious: 0.58, happy: 0.44, tragic: 0.34 }, // AUTO: inferred from 4 concept(s), 16 co-occurring signal(s)
    "Golf": { exciting: 1, romantic: 0.79, funny: 0.69, intense: 0.67, happy: 0.61 }, // AUTO: inferred from 4 concept(s), 22 co-occurring signal(s)
    "Fitness": { romantic: 1, emotional: 0.82, happy: 0.71, funny: 0.66, exciting: 0.52 }, // AUTO: inferred from 4 concept(s), 17 co-occurring signal(s)
    "Super Robot": { exciting: 1, violent: 0.33, mysterious: 0.27, intense: 0.24, romantic: 0.23 }, // AUTO: inferred from 4 concept(s), 23 co-occurring signal(s)
    "Clone": { mysterious: 1, dark: 0.78, exciting: 0.64, scary: 0.61, romantic: 0.53 }, // AUTO: inferred from 4 concept(s), 20 co-occurring signal(s)
    "Photography": { romantic: 1, emotional: 0.8, mysterious: 0.43, happy: 0.37, tragic: 0.28 }, // AUTO: inferred from 4 concept(s), 16 co-occurring signal(s)
    "Ice Skating": { romantic: 1, exciting: 0.98, emotional: 0.81, hopeful: 0.75, happy: 0.56 }, // AUTO: inferred from 4 concept(s), 21 co-occurring signal(s)
    "Prison": { exciting: 1, emotional: 0.52, violent: 0.49, mysterious: 0.48, romantic: 0.34 }, // AUTO: inferred from 4 concept(s), 23 co-occurring signal(s)
    "Class Struggle": { exciting: 1, emotional: 0.55, violent: 0.52, tragic: 0.26, romantic: 0.26 }, // AUTO: inferred from 4 concept(s), 16 co-occurring signal(s)
    "Cyborg": { exciting: 1, mysterious: 0.5, funny: 0.5, violent: 0.44, emotional: 0.41 }, // AUTO: inferred from 4 concept(s), 26 co-occurring signal(s)
    "Chibi": { emotional: 1, romantic: 0.82, exciting: 0.76, mysterious: 0.66, tragic: 0.5 }, // AUTO: inferred from 4 concept(s), 21 co-occurring signal(s)
    "Pandemic": { exciting: 1, emotional: 0.79, mysterious: 0.58, romantic: 0.58, tragic: 0.4 }, // AUTO: inferred from 4 concept(s), 26 co-occurring signal(s)
    "Arranged Marriage": { emotional: 1, romantic: 0.83, exciting: 0.73, mysterious: 0.63, dark: 0.46 }, // AUTO: inferred from 4 concept(s), 17 co-occurring signal(s)
    "Boarding School": { emotional: 1, romantic: 0.82, happy: 0.5, mysterious: 0.45, tragic: 0.33 }, // AUTO: inferred from 4 concept(s), 18 co-occurring signal(s)
    "Boxing": { exciting: 1, emotional: 0.7, mysterious: 0.6, romantic: 0.45, intense: 0.44 }, // AUTO: inferred from 4 concept(s), 30 co-occurring signal(s)
    "Ero Guro": { dark: 1, scary: 0.85, violent: 0.77, exciting: 0.43, mysterious: 0.34 }, // AUTO: inferred from 4 concept(s), 20 co-occurring signal(s)
    "Surfing": { emotional: 1, romantic: 0.81, happy: 0.41, exciting: 0.35, tragic: 0.34 }, // AUTO: inferred from 4 concept(s), 17 co-occurring signal(s)
    "Mahjong": { exciting: 1, mysterious: 0.5, violent: 0.4, emotional: 0.38, hopeful: 0.29 }, // AUTO: inferred from 4 concept(s), 24 co-occurring signal(s)
    "Crafting": { exciting: 1, mysterious: 0.57, hopeful: 0.49, violent: 0.2 }, // AUTO: inferred from 4 concept(s), 10 co-occurring signal(s)
    "HardWork": { exciting: 1, hopeful: 0.61, intense: 0.39, emotional: 0.25, violent: 0.24 }, // AUTO: inferred from 4 concept(s), 13 co-occurring signal(s)
    "Technology": { mysterious: 1, intense: 0.73, exciting: 0.69, dark: 0.53, hopeful: 0.45 }, // AUTO: inferred from 4 concept(s), 9 co-occurring signal(s)
    "Conflict": { emotional: 1, romantic: 0.97, happy: 0.41, tragic: 0.27, funny: 0.25 }, // AUTO: inferred from 4 concept(s), 16 co-occurring signal(s)
    "Exploration": { exciting: 1, hopeful: 0.52, mysterious: 0.3 }, // AUTO: inferred from 4 concept(s), 14 co-occurring signal(s)
    "Mountaineering": { exciting: 1, mysterious: 0.8, emotional: 0.68, dark: 0.48, hopeful: 0.44 }, // AUTO: inferred from 3 concept(s), 18 co-occurring signal(s)
    "Psychosexual": { emotional: 1, dark: 0.66, romantic: 0.52, exciting: 0.49, violent: 0.46 }, // AUTO: inferred from 3 concept(s), 17 co-occurring signal(s)
    "Chuunibyou": { exciting: 1, emotional: 0.56, happy: 0.49, relaxing: 0.44, romantic: 0.35 }, // AUTO: inferred from 3 concept(s), 18 co-occurring signal(s)
    "Athletics": { emotional: 1, exciting: 1, romantic: 0.86, hopeful: 0.69, funny: 0.56 }, // AUTO: inferred from 3 concept(s), 17 co-occurring signal(s)
    "Judo": { romantic: 1, emotional: 0.95, exciting: 0.73, tragic: 0.4, happy: 0.34 }, // AUTO: inferred from 3 concept(s), 11 co-occurring signal(s)
    "Konbini": { exciting: 1, emotional: 0.69, happy: 0.64, funny: 0.59, violent: 0.53 }, // AUTO: inferred from 3 concept(s), 18 co-occurring signal(s)
    "Desert": { mysterious: 1, exciting: 0.95, dark: 0.71, emotional: 0.55, scary: 0.38 }, // AUTO: inferred from 3 concept(s), 26 co-occurring signal(s)
    "Steampunk": { exciting: 1, mysterious: 0.45, violent: 0.43, romantic: 0.29, intense: 0.25 }, // AUTO: inferred from 3 concept(s), 20 co-occurring signal(s)
    "Cosplay": { funny: 1, romantic: 0.99, happy: 0.71, mysterious: 0.57, emotional: 0.37 }, // AUTO: inferred from 3 concept(s), 12 co-occurring signal(s)
    "Agriculture": { exciting: 1, romantic: 0.45, hopeful: 0.39, emotional: 0.34, violent: 0.31 }, // AUTO: inferred from 3 concept(s), 17 co-occurring signal(s)
    "Time Loop": { mysterious: 1, emotional: 0.83, romantic: 0.76, exciting: 0.6, tragic: 0.35 }, // AUTO: inferred from 3 concept(s), 21 co-occurring signal(s)
    "E-Sports": { romantic: 1, emotional: 0.89, exciting: 0.62, happy: 0.43, mysterious: 0.39 }, // AUTO: inferred from 3 concept(s), 15 co-occurring signal(s)
    "Elderly Protagonist": { emotional: 1, romantic: 0.8, happy: 0.46, exciting: 0.45, tragic: 0.37 }, // AUTO: inferred from 3 concept(s), 19 co-occurring signal(s)
    "Rock Music": { emotional: 1, exciting: 0.93, happy: 0.9, funny: 0.84, violent: 0.55 }, // AUTO: inferred from 3 concept(s), 17 co-occurring signal(s)
    "Table Tennis": { emotional: 1, exciting: 0.71, funny: 0.56, hopeful: 0.53, intense: 0.51 }, // AUTO: inferred from 3 concept(s), 12 co-occurring signal(s)
    "Basketball": { emotional: 1, romantic: 0.83, tragic: 0.46, exciting: 0.2 }, // AUTO: inferred from 3 concept(s), 12 co-occurring signal(s)
    "Software Development": { exciting: 1, funny: 0.6, emotional: 0.57, mysterious: 0.46, happy: 0.42 }, // AUTO: inferred from 3 concept(s), 16 co-occurring signal(s)
    "Gekiga": { emotional: 1, exciting: 0.93, mysterious: 0.74, dark: 0.63, violent: 0.42 }, // AUTO: inferred from 3 concept(s), 18 co-occurring signal(s)
    "Crossover": { exciting: 1, mysterious: 0.41, violent: 0.34, hopeful: 0.27, intense: 0.26 }, // AUTO: inferred from 3 concept(s), 18 co-occurring signal(s)
    "Cult": { dark: 1, scary: 0.95, mysterious: 0.87, exciting: 0.53, violent: 0.47 }, // AUTO: inferred from 3 concept(s), 15 co-occurring signal(s)
    "Agender": { romantic: 1, emotional: 0.89, exciting: 0.73, funny: 0.72, happy: 0.66 }, // AUTO: inferred from 3 concept(s), 10 co-occurring signal(s)
    "Primarily Animal Cast": { emotional: 1, exciting: 0.85, romantic: 0.76, violent: 0.58, tragic: 0.42 }, // AUTO: inferred from 3 concept(s), 10 co-occurring signal(s)
    "Hypersexuality": { romantic: 1, emotional: 0.95, tragic: 0.4, exciting: 0.38, mysterious: 0.31 }, // AUTO: inferred from 3 concept(s), 9 co-occurring signal(s)
    "Archery": { exciting: 1, happy: 0.39, mysterious: 0.36, violent: 0.36, hopeful: 0.34 }, // AUTO: inferred from 3 concept(s), 14 co-occurring signal(s)
    "Fingering": { emotional: 1, exciting: 0.88, romantic: 0.8, intense: 0.52, tragic: 0.48 }, // AUTO: inferred from 3 concept(s), 15 co-occurring signal(s)
    "Technique": { exciting: 1, violent: 0.42, hopeful: 0.34, mysterious: 0.21 }, // AUTO: inferred from 3 concept(s), 9 co-occurring signal(s)
    "Death": { dark: 1, scary: 0.78, mysterious: 0.4, emotional: 0.34, intense: 0.32 }, // AUTO: inferred from 3 concept(s), 9 co-occurring signal(s)
    "Identity": { mysterious: 1, exciting: 0.7, dark: 0.58, intense: 0.38, violent: 0.28 }, // AUTO: inferred from 3 concept(s), 8 co-occurring signal(s)
    "Responsibility": { emotional: 1, tragic: 0.61, exciting: 0.56, violent: 0.4, funny: 0.32 }, // AUTO: inferred from 3 concept(s), 9 co-occurring signal(s)
    "Healing": { emotional: 1, funny: 0.61, tragic: 0.52, happy: 0.37 }, // AUTO: inferred from 3 concept(s), 8 co-occurring signal(s)
    "Strategy": { exciting: 1, violent: 0.64, dark: 0.39, emotional: 0.34, intense: 0.26 }, // AUTO: inferred from 3 concept(s), 10 co-occurring signal(s)
    "Fencing": { exciting: 1, romantic: 0.65, emotional: 0.59, funny: 0.48, happy: 0.44 }, // AUTO: inferred from 2 concept(s), 12 co-occurring signal(s) — LOW CONFIDENCE, review
    "Pet Play": { emotional: 1, romantic: 0.73, tragic: 0.42, exciting: 0.39, violent: 0.31 }, // AUTO: inferred from 2 concept(s), 6 co-occurring signal(s) — LOW CONFIDENCE, review
    "Body Image": { emotional: 1, tragic: 0.57, dark: 0.48, mysterious: 0.27, relaxing: 0.27 }, // AUTO: inferred from 2 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "Asexual": { emotional: 1, romantic: 0.73, happy: 0.47, tragic: 0.42, funny: 0.37 }, // AUTO: inferred from 2 concept(s), 8 co-occurring signal(s) — LOW CONFIDENCE, review
    "Double Penetration": { romantic: 1, funny: 1, happy: 0.6 }, // AUTO: inferred from 2 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "Kingdom Management": { exciting: 1, violent: 0.39, hopeful: 0.34, emotional: 0.31, intense: 0.28 }, // AUTO: inferred from 2 concept(s), 12 co-occurring signal(s) — LOW CONFIDENCE, review
    "Mating Press": { exciting: 1, violent: 0.8, funny: 0.74, romantic: 0.74, happy: 0.44 }, // AUTO: inferred from 2 concept(s), 4 co-occurring signal(s) — LOW CONFIDENCE, review
    "Card Battle": { emotional: 1, happy: 0.53, romantic: 0.52, mysterious: 0.46, relaxing: 0.44 }, // AUTO: inferred from 2 concept(s), 11 co-occurring signal(s) — LOW CONFIDENCE, review
    "Erotic Piercings": { romantic: 1, funny: 0.76, happy: 0.7, emotional: 0.49, exciting: 0.26 }, // AUTO: inferred from 2 concept(s), 6 co-occurring signal(s) — LOW CONFIDENCE, review
    "Satire": { exciting: 1, mysterious: 0.58, funny: 0.5, romantic: 0.39, happy: 0.38 }, // AUTO: inferred from 2 concept(s), 11 co-occurring signal(s) — LOW CONFIDENCE, review
    "Skeleton": { mysterious: 1, emotional: 0.92, exciting: 0.49, happy: 0.37, dark: 0.36 }, // AUTO: inferred from 2 concept(s), 14 co-occurring signal(s) — LOW CONFIDENCE, review
    "Real Robot": { exciting: 1, intense: 0.5, violent: 0.41, mysterious: 0.23, tragic: 0.22 }, // AUTO: inferred from 2 concept(s), 9 co-occurring signal(s) — LOW CONFIDENCE, review
    "Estranged Family": { emotional: 1, dark: 0.66, mysterious: 0.63, intense: 0.4, tragic: 0.37 }, // AUTO: inferred from 2 concept(s), 10 co-occurring signal(s) — LOW CONFIDENCE, review
    "Indigenous Cultures": { exciting: 1, mysterious: 0.57, hopeful: 0.5, tragic: 0.3, violent: 0.28 }, // AUTO: inferred from 2 concept(s), 12 co-occurring signal(s) — LOW CONFIDENCE, review
    "Dinosaurs": { exciting: 1, mysterious: 0.86, hopeful: 0.44, romantic: 0.23 }, // AUTO: inferred from 2 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "Oiran": { exciting: 1, romantic: 0.92, emotional: 0.89, funny: 0.86, happy: 0.65 }, // AUTO: inferred from 2 concept(s), 10 co-occurring signal(s) — LOW CONFIDENCE, review
    "Amputation": { emotional: 1, exciting: 0.86, dark: 0.63, mysterious: 0.6, romantic: 0.45 }, // AUTO: inferred from 2 concept(s), 12 co-occurring signal(s) — LOW CONFIDENCE, review
    "Advertisement": { emotional: 1, mysterious: 0.98, exciting: 0.92, romantic: 0.9, violent: 0.46 }, // AUTO: inferred from 2 concept(s), 9 co-occurring signal(s) — LOW CONFIDENCE, review
    "Irrumatio": { emotional: 1, romantic: 0.66, exciting: 0.57, dark: 0.49, violent: 0.46 }, // AUTO: inferred from 2 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "Polyamorous": { emotional: 1, romantic: 0.76, mysterious: 0.53, happy: 0.4, dark: 0.38 }, // AUTO: inferred from 2 concept(s), 11 co-occurring signal(s) — LOW CONFIDENCE, review
    "Hip-hop Music": { emotional: 1, exciting: 0.79, intense: 0.77, dark: 0.7, scary: 0.61 }, // AUTO: inferred from 2 concept(s), 18 co-occurring signal(s) — LOW CONFIDENCE, review
    "Anachronism": { exciting: 1, emotional: 0.8, romantic: 0.58, tragic: 0.54, mysterious: 0.33 }, // AUTO: inferred from 2 concept(s), 11 co-occurring signal(s) — LOW CONFIDENCE, review
    "Veterinarian": { exciting: 1, emotional: 0.8, funny: 0.55, happy: 0.53, tragic: 0.4 }, // AUTO: inferred from 2 concept(s), 11 co-occurring signal(s) — LOW CONFIDENCE, review
    "Necromancy": { exciting: 1, hopeful: 0.37, mysterious: 0.36, violent: 0.31, emotional: 0.25 }, // AUTO: inferred from 2 concept(s), 12 co-occurring signal(s) — LOW CONFIDENCE, review
    "Inn": { emotional: 1, relaxing: 0.51, tragic: 0.41, wholesome: 0.34, romantic: 0.34 }, // AUTO: inferred from 2 concept(s), 7 co-occurring signal(s) — LOW CONFIDENCE, review
    "Board Game": { exciting: 1, relaxing: 0.61, happy: 0.47, intense: 0.43, dark: 0.42 }, // AUTO: inferred from 2 concept(s), 9 co-occurring signal(s) — LOW CONFIDENCE, review
    "Coastal": { emotional: 1, romantic: 0.91, tragic: 0.42, happy: 0.3, relaxing: 0.26 }, // AUTO: inferred from 2 concept(s), 7 co-occurring signal(s) — LOW CONFIDENCE, review
    "Aviation": { emotional: 1, mysterious: 0.86, exciting: 0.64, romantic: 0.62, dark: 0.5 }, // AUTO: inferred from 2 concept(s), 15 co-occurring signal(s) — LOW CONFIDENCE, review
    "Cute Boys Doing Cute Things": { romantic: 1, emotional: 0.72, funny: 0.53, happy: 0.5, relaxing: 0.27 }, // AUTO: inferred from 2 concept(s), 9 co-occurring signal(s) — LOW CONFIDENCE, review
    "Homeless": { emotional: 1, exciting: 0.86, happy: 0.76, violent: 0.63, romantic: 0.62 }, // AUTO: inferred from 2 concept(s), 7 co-occurring signal(s) — LOW CONFIDENCE, review
    "Sweat": { romantic: 1 }, // AUTO: inferred from 2 concept(s), 2 co-occurring signal(s) — LOW CONFIDENCE, review
    "VideoGames": { exciting: 1, violent: 0.4, hopeful: 0.35, intense: 0.34 }, // AUTO: inferred from 2 concept(s), 8 co-occurring signal(s) — LOW CONFIDENCE, review
    "Adventure": { exciting: 1, mysterious: 0.83, hopeful: 0.67 }, // AUTO: inferred from 2 concept(s), 4 co-occurring signal(s) — LOW CONFIDENCE, review
    "Mystery": { mysterious: 1, dark: 0.61, exciting: 0.43, hopeful: 0.27, emotional: 0.2 }, // AUTO: inferred from 2 concept(s), 6 co-occurring signal(s) — LOW CONFIDENCE, review
    "Jealousy": { romantic: 1, emotional: 0.93, happy: 0.48, funny: 0.23, tragic: 0.22 }, // AUTO: inferred from 2 concept(s), 8 co-occurring signal(s) — LOW CONFIDENCE, review
    "Badminton": { emotional: 1, exciting: 0.68, tragic: 0.62, romantic: 0.54, hopeful: 0.51 }, // AUTO: inferred from 1 concept(s), 4 co-occurring signal(s) — LOW CONFIDENCE, review
    "Bowling": { emotional: 1, funny: 0.92, exciting: 0.73, tragic: 0.67, happy: 0.55 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "Interspecies": { mysterious: 1, emotional: 0.76, romantic: 0.69, tragic: 0.32, exciting: 0.3 }, // AUTO: inferred from 1 concept(s), 6 co-occurring signal(s) — LOW CONFIDENCE, review
    "Cheerleading": { exciting: 1, hopeful: 0.75, intense: 0.75, romantic: 0.63 }, // AUTO: inferred from 1 concept(s), 2 co-occurring signal(s) — LOW CONFIDENCE, review
    "Reverse Isekai": { exciting: 1, funny: 0.74, violent: 0.63, emotional: 0.63, tragic: 0.42 }, // AUTO: inferred from 1 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "Biographical": { exciting: 1, scary: 0.7, emotional: 0.67, violent: 0.67, dark: 0.6 }, // AUTO: inferred from 1 concept(s), 8 co-occurring signal(s) — LOW CONFIDENCE, review
    "Firefighters": { emotional: 1, exciting: 0.78, happy: 0.76, violent: 0.63, romantic: 0.62 }, // AUTO: inferred from 1 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "Jazz Music": { emotional: 1, happy: 0.82, funny: 0.63, relaxing: 0.57, exciting: 0.5 }, // AUTO: inferred from 1 concept(s), 6 co-occurring signal(s) — LOW CONFIDENCE, review
    "Cumflation": { mysterious: 1, dark: 0.82, scary: 0.53, exciting: 0.22, emotional: 0.2 }, // AUTO: inferred from 1 concept(s), 6 co-occurring signal(s) — LOW CONFIDENCE, review
    "Brainwashing": { emotional: 1, tragic: 0.67, mysterious: 0.64, romantic: 0.46, dark: 0.37 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "Scat": { emotional: 1, romantic: 0.89, relaxing: 0.49, tragic: 0.39, happy: 0.39 }, // AUTO: inferred from 1 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "Camping": { relaxing: 1, exciting: 0.87, wholesome: 0.8, hopeful: 0.66, intense: 0.66 }, // AUTO: inferred from 1 concept(s), 2 co-occurring signal(s) — LOW CONFIDENCE, review
    "Augmented Reality": { exciting: 1, emotional: 0.81, violent: 0.8, relaxing: 0.66, tragic: 0.54 }, // AUTO: inferred from 1 concept(s), 4 co-occurring signal(s) — LOW CONFIDENCE, review
    "Mixed Gender Harem": { exciting: 1, hopeful: 0.83, romantic: 0.63, happy: 0.62, funny: 0.6 }, // AUTO: inferred from 1 concept(s), 8 co-occurring signal(s) — LOW CONFIDENCE, review
    "Cowboys": { exciting: 1, violent: 0.47, hopeful: 0.3, intense: 0.26 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "Poker": { emotional: 1, exciting: 0.86, violent: 0.63, romantic: 0.62, tragic: 0.42 }, // AUTO: inferred from 1 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "Classical Music": { emotional: 1, exciting: 0.91, violent: 0.49, romantic: 0.48, tragic: 0.33 }, // AUTO: inferred from 1 concept(s), 6 co-occurring signal(s) — LOW CONFIDENCE, review
    "Cervix Penetration": { exciting: 1, romantic: 0.8, violent: 0.55, emotional: 0.33, mysterious: 0.31 }, // AUTO: inferred from 1 concept(s), 4 co-occurring signal(s) — LOW CONFIDENCE, review
    "Snowscape": { romantic: 1, relaxing: 0.79, emotional: 0.66, happy: 0.63, wholesome: 0.53 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "Armpits": { romantic: 1 }, // AUTO: inferred from 1 concept(s), 1 co-occurring signal(s) — LOW CONFIDENCE, review
    "Filmmaking": { emotional: 1, romantic: 0.66, dark: 0.49, mysterious: 0.38, relaxing: 0.38 }, // AUTO: inferred from 1 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "Watersports": { exciting: 1, violent: 0.8, funny: 0.74, happy: 0.44, romantic: 0.37 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "Shogi": { dark: 1, mysterious: 0.78, relaxing: 0.72, exciting: 0.64, intense: 0.54 }, // AUTO: inferred from 1 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "Creature Taming": { exciting: 1, mysterious: 0.93, hopeful: 0.92, romantic: 0.87, happy: 0.78 }, // AUTO: inferred from 1 concept(s), 8 co-occurring signal(s) — LOW CONFIDENCE, review
    "Ancient China": { emotional: 1, exciting: 0.83, mysterious: 0.6, romantic: 0.49, dark: 0.47 }, // AUTO: inferred from 1 concept(s), 6 co-occurring signal(s) — LOW CONFIDENCE, review
    "Lactation": { romantic: 1 }, // AUTO: inferred from 1 concept(s), 1 co-occurring signal(s) — LOW CONFIDENCE, review
    "Short-Form Chapter": { emotional: 1, romantic: 0.62, tragic: 0.42 }, // AUTO: inferred from 1 concept(s), 2 co-occurring signal(s) — LOW CONFIDENCE, review
    "Airsoft": { emotional: 1, funny: 0.84, tragic: 0.62, romantic: 0.54, happy: 0.51 }, // AUTO: inferred from 1 concept(s), 4 co-occurring signal(s) — LOW CONFIDENCE, review
    "Tanks": { exciting: 1, emotional: 0.79, happy: 0.6, mysterious: 0.57, tragic: 0.54 }, // AUTO: inferred from 1 concept(s), 9 co-occurring signal(s) — LOW CONFIDENCE, review
    "Hair Pulling": { emotional: 1, romantic: 0.91, happy: 0.76, funny: 0.58, relaxing: 0.52 }, // AUTO: inferred from 1 concept(s), 6 co-occurring signal(s) — LOW CONFIDENCE, review
    "Lost Civilization": { exciting: 1, intense: 0.64, violent: 0.41, mysterious: 0.23, dark: 0.21 }, // AUTO: inferred from 1 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "Ashikoki": { funny: 1, happy: 0.6, romantic: 0.5 }, // AUTO: inferred from 1 concept(s), 2 co-occurring signal(s) — LOW CONFIDENCE, review
    "CGI": { exciting: 1, mysterious: 0.32, violent: 0.29, hopeful: 0.28 }, // AUTO: inferred from 1 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "Natural Disaster": { exciting: 1, mysterious: 0.78, emotional: 0.65, dark: 0.61, intense: 0.45 }, // AUTO: inferred from 1 concept(s), 7 co-occurring signal(s) — LOW CONFIDENCE, review
    "Vocal Synth": { funny: 1, happy: 1, relaxing: 0.9, wholesome: 0.6 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "Voyeur": { emotional: 1, scary: 0.97, romantic: 0.91, dark: 0.82, tragic: 0.42 }, // AUTO: inferred from 1 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "Cycling": { exciting: 1, emotional: 0.48, violent: 0.47, funny: 0.44, tragic: 0.32 }, // AUTO: inferred from 1 concept(s), 6 co-occurring signal(s) — LOW CONFIDENCE, review
    "Horticulture": { exciting: 1, mysterious: 0.8, emotional: 0.75, hopeful: 0.6, tragic: 0.46 }, // AUTO: inferred from 1 concept(s), 6 co-occurring signal(s) — LOW CONFIDENCE, review
    "Wrestling": { romantic: 1, exciting: 0.87, happy: 0.7, funny: 0.66, violent: 0.55 }, // AUTO: inferred from 1 concept(s), 7 co-occurring signal(s) — LOW CONFIDENCE, review
    "Sumo": { exciting: 1, emotional: 0.76, romantic: 0.68, violent: 0.47, tragic: 0.32 }, // AUTO: inferred from 1 concept(s), 7 co-occurring signal(s) — LOW CONFIDENCE, review
    "Rakugo": { funny: 1, happy: 1, relaxing: 0.9, wholesome: 0.6 }, // AUTO: inferred from 1 concept(s), 2 co-occurring signal(s) — LOW CONFIDENCE, review
    "Gag Humor": { emotional: 1, exciting: 0.96, romantic: 0.93, intense: 0.63, tragic: 0.53 }, // AUTO: inferred from 1 concept(s), 8 co-occurring signal(s) — LOW CONFIDENCE, review
    "Anthropomorphic": { dark: 1, violent: 0.79, mysterious: 0.77, scary: 0.57, exciting: 0.51 }, // AUTO: inferred from 1 concept(s), 13 co-occurring signal(s) — LOW CONFIDENCE, review
    "FirstLove": { emotional: 1, romantic: 0.97, happy: 0.33, tragic: 0.23 }, // AUTO: inferred from 1 concept(s), 6 co-occurring signal(s) — LOW CONFIDENCE, review
    "Antihero": { intense: 1, exciting: 0.96, mysterious: 0.9, violent: 0.72, dark: 0.48 }, // AUTO: inferred from 1 concept(s), 5 co-occurring signal(s) — LOW CONFIDENCE, review
    "DeathGame": { dark: 1, intense: 0.54, mysterious: 0.38, scary: 0.36, emotional: 0.32 }, // AUTO: inferred from 1 concept(s), 7 co-occurring signal(s) — LOW CONFIDENCE, review
    "Mecha": { exciting: 1, violent: 0.72, emotional: 0.54, tragic: 0.36 }, // AUTO: inferred from 1 concept(s), 4 co-occurring signal(s) — LOW CONFIDENCE, review
    "Action": { exciting: 1, violent: 0.5, mysterious: 0.25, hopeful: 0.25 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "Scholar": { exciting: 1, mysterious: 0.76, hopeful: 0.64 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "LifeAndDeath": { emotional: 1, tragic: 0.61 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "Darkness": { exciting: 1, mysterious: 0.87, scary: 0.85, dark: 0.75, hopeful: 0.64 }, // AUTO: inferred from 1 concept(s), 4 co-occurring signal(s) — LOW CONFIDENCE, review
    "Honor": { exciting: 1, violent: 0.43, mysterious: 0.33, hopeful: 0.31 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "Destruction": { exciting: 1, violent: 0.8 }, // AUTO: inferred from 1 concept(s), 2 co-occurring signal(s) — LOW CONFIDENCE, review
    "Taboo": { emotional: 1, romantic: 0.82, tragic: 0.31, happy: 0.23 }, // AUTO: inferred from 1 concept(s), 4 co-occurring signal(s) — LOW CONFIDENCE, review
    "Destiny": { romantic: 1, emotional: 0.61, exciting: 0.38, mysterious: 0.32, happy: 0.27 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
    "Training": { exciting: 1, emotional: 0.75, hopeful: 0.56, tragic: 0.5 }, // AUTO: inferred from 1 concept(s), 3 co-occurring signal(s) — LOW CONFIDENCE, review
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
