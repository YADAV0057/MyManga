
// js/parser/synonyms.js

export const SYNONYM_MAP = {
    // Maps to "cry"
    "crying": "cry",
    "tearjerker": "cry",
    "tears": "cry",
    "sob": "cry",
    "heartbreaking": "cry",
    
    // Maps to "funny"
    "lmao": "funny",
    "lol": "funny",
    "comedy": "funny",
    "laugh": "funny",
    
    // Maps to "fluff"
    "cute": "fluff",
    "adorable": "fluff",
    "sweet": "fluff",
    
    // Maps to "hype"
    "epic": "hype",
    "awesome": "hype",
    "cool": "hype",
    "fights": "hype",

    // Maps to "gory"
    "blood": "gory",
    "violent": "gory",
    "gore": "gory",
    "splatter": "gory",

    // Maps to "mindfuck"
    "confusing": "mindfuck",
    "brain": "mindfuck",
    "complex": "mindfuck",
    "trippy": "mindfuck"
"educational": "academic",
"learning": "academic",
"nostalgic": "sentimental",
"memories": "sentimental",
"intense": "serious",
"gritty": "dark",
"brutal": "gory",
"heartwarming": "wholesome",
"comfort": "healing",
"chill": "healing"

};

/**
 * Replaces synonyms in the normalized text with their core dictionary equivalents.
 */
export function applySynonyms(normalizedText) {
    const words = normalizedText.split(" ");
    
    const translatedWords = words.map(word => {
        // If the word exists in our synonym map, return the core word. 
        // Otherwise, keep the original word.
        return SYNONYM_MAP[word] || word;
    });

    return translatedWords.join(" ");
}
