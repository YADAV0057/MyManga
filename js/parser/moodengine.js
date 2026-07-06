
import { MOOD_DICTIONARY } from "./dictionary.js";

export function analyzeMood(text) {

    const words = text.toLowerCase().split(" ");

    let moods = new Set();
    let intensity = 0;

    words.forEach(word => {

        if (MOOD_DICTIONARY[word]) {

            const entry = MOOD_DICTIONARY[word];

            entry.moods.forEach(m => moods.add(m));

            intensity += entry.intensity;
        }
    });

    return {
        moods: [...moods],
        intensity: Math.min(intensity, 1)
    };
}
