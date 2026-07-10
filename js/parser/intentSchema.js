// js/parser/intentSchema.js

export class MangaIntent {
    constructor() {
        // Raw data
        this.originalQuery = "";
        this.normalizedQuery = "";

        // AI Understanding
        this.moods = [];
        this.moodProfile = [];
        this.moodVector = {};
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

        // FIX: these were read by pipeline.js's negation-merge step
        // (`intent.excluded`) but never declared here, so the read always
        // returned `undefined` and the merge silently never ran. Now
        // populated by pipeline.js's handleNegations() and merged into
        // `avoids` above.
        this.excluded = [];
        this.excludedThemes = [];

        this.searchPriority = ["AniList", "MangaDex", "Jikan", "Kitsu"];
        // NOTE: removed a duplicate `this.confidence = 1.0;` that used to
        // sit here as well — harmless (same value set twice) but dead
        // leftover from an earlier edit.
    }
}
