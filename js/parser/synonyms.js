// js/parser/synonyms.js
import { SYNONYM_MAP } from './dictionary.js';

/**
 * Replaces synonyms in the normalized text with their core dictionary equivalents.
 */
export function applySynonyms(normalizedText) {
    const words = normalizedText.split(" ");
    
    const translatedWords = words.map(word => {
        // Look up the word, fallback to the original word if not found
        return SYNONYM_MAP[word] || word;
    });

    return translatedWords.join(" ");
}
