/**
 * The standard definition of user intent.
 * Every parser module contributes to this, and every API adapter reads from it.
 */
export class MangaIntent {
    constructor() {
        // Raw data
        this.originalQuery = "";
        this.normalizedQuery = "";
        
                // AI Understanding
        this.moods = [];          
        this.moodProfile = [];    // <-- ADD THIS LINE
        this.intensity = 0.0;     
        this.tone = "neutral";
        
        // API Translations
        this.genres = [];         // e.g., ["Psychological", "Drama"]
        this.themes = [];         // e.g., ["School Life", "Monsters"]
        this.demographics = [];   // e.g., ["Seinen", "Shounen"]
        
        // Rule Engine Modifiers
        this.status = null;       // "completed", "ongoing"
        this.year = null;         // e.g., 2023
        this.sort = "relevance";  // "rating", "popularity", "newest"
    }

    /**
     * Helper to verify if the intent is empty
     */
    isEmpty() {
        return this.moods.length === 0 && this.genres.length === 0 && !this.originalQuery;
    }
}
