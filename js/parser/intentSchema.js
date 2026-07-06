// js/parser/intentSchema.js

export class MangaIntent {
    constructor() {
        // Raw data
        this.originalQuery = "";
        this.normalizedQuery = "";
        
        // AI Understanding
        this.moods = [];          
        this.moodProfile = [];    
        this.intensity = 0.0;     
        this.tone = "neutral";
                this.confidence = 1.0;
        this.confidenceReasons = []; // 🌟 NEW: Explain the AI's logic
        

        // API Translations
        this.genres = [];         
        this.themes = [];         
        this.demographics = [];   
        
        // Rule Engine Modifiers (Hard Constraints)
        this.status = null;       
        this.sort = "relevance";  
        this.maxChapters = null;  
        
        // 🌟 ENRICHED RECOMMENDATION ENGINE (NEW)
        this.boosts = {
            genres: [],
            themes: [],
            demographics: []
        };
        this.avoids = {
            genres: [],
            themes: []
        };
        this.searchPriority = ["AniList", "MangaDex", "Jikan", "Kitsu"];
        this.confidence = 1.0;
    }
}
