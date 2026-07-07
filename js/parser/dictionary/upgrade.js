const fs = require('fs'); 
const { GENRE_WEIGHTS, THEME_WEIGHTS, SOURCE_MULTIPLIERS } = require('./MoodConfig');
const dictionary = require('./properties.js'); // Assuming your properties.js exports the object

function calculateMood(concept) {
    let scores = {};
    const process = (items = [], map, mult) => {
        items.forEach(item => {
            const moodMap = map[item.name];
            if (moodMap) {
                for (let [m, v] of Object.entries(moodMap)) {
                    scores[m] = (scores[m] || 0) + (v * item.weight * mult);
                }
            }
        });
    };
    process(concept.genres, GENRE_WEIGHTS, SOURCE_MULTIPLIERS.Genre);
    process(concept.themes, THEME_WEIGHTS, SOURCE_MULTIPLIERS.Theme);
    
    // Normalize
    const max = Math.max(...Object.values(scores), 1);
    Object.keys(scores).forEach(m => scores[m] = parseFloat((scores[m]/max).toFixed(2)));
    return scores;
}

// Update the dictionary
for (let key in dictionary) {
    dictionary[key].moodWeights = calculateMood(dictionary[key]);
}
console.log("Calculated mood vectors for all concepts.");
