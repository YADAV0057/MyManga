
module.exports = {
    SOURCE_MULTIPLIERS: { Genre: 1.0, Theme: 0.8, Demographic: 0.2 },
    GENRE_WEIGHTS: {
        "Action": { exciting: 1.0, violent: 0.8 },
        "Psychological": { dark: 0.9, mysterious: 0.7, emotional: 0.5 },
        "Drama": { emotional: 0.9, tragic: 0.6 }
    }, 
    THEME_WEIGHTS: {
        "Revenge": { dark: 0.8, emotional: 0.5, violent: 0.7 },
        "Betrayal": { dark: 0.9, emotional: 0.8 }
    }
};
