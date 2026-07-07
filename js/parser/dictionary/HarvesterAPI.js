import axios from 'axios';
import xml2js from 'xml2js';

const WEIGHT_MAP = {
    "Action": 0.95, "Psychological": 0.90, "Drama": 0.85, 
    "SliceOfLife": 1.0, "Fantasy": 0.80, "Romance": 0.75,
    "Sci-Fi": 0.85, "Comedy": 0.70, "Horror": 0.90
};

export class HarvesterAPI {
    static async getNormalizedConcept(tag) {
        try {
            const cleanTag = tag.replace(/_/g, ' '); 
            console.log(`[Automated] Harvesting: ${cleanTag} (ID: ${tag})`);
            
            const [annData, aniListData, jikanData, synonyms] = await Promise.all([
                this.fetchFromANN(cleanTag),
                this.fetchFromAniList(cleanTag),
                this.fetchFromJikan(cleanTag),
                this.fetchAliases(cleanTag)
            ]);

            // Calculate confidence: 0.25 per successful API source
            let successCount = 0;
            if (annData.genres.length > 0 || annData.themes.length > 0) successCount++;
            if (aniListData.genres.length > 0 || aniListData.themes.length > 0) successCount++;
            if (jikanData.genres.length > 0 || jikanData.themes.length > 0) successCount++;
            if (synonyms.length > 0) successCount++;
            const calculatedConfidenceScore = successCount * 0.25;

            const mergedGenres = new Map();
            [...annData.genres, ...aniListData.genres, ...jikanData.genres].forEach(g => {
                if (!mergedGenres.has(g.name)) {
                    mergedGenres.set(g.name, { name: g.name, weight: WEIGHT_MAP[g.name] || 0.70 });
                }
            });

            const mergedThemes = new Map();
            [...annData.themes, ...aniListData.themes, ...jikanData.themes].forEach(t => {
                if (!mergedThemes.has(t.name)) {
                    mergedThemes.set(t.name, { name: t.name, weight: 0.80 });
                }
            });

            return {
                id: tag,
                metadata: {
                    sources: ["ANN", "AniList", "Jikan", "Datamuse"],
                    generatedAt: new Date().toISOString(),
                    confidence: calculatedConfidenceScore,
                    version: "1.0.0"
                },
                aliases: [...new Set([tag, cleanTag, ...synonyms])], 
                genres: Array.from(mergedGenres.values()),
                themes: Array.from(mergedThemes.values())
            };
        } catch (err) {
            console.error(`[Error] Pipeline failed for ${tag}:`, err.message);
            return null;
        }
    }

    // ... (All fetch methods remain the same as your provided code) ...
    
    static async fetchFromJikan(tag) { /* ... existing code ... */ }
    static async fetchFromAniList(tag) { /* ... existing code ... */ }
    static async fetchAliases(tag) { /* ... existing code ... */ }
    static async fetchFromANN(tag) { /* ... existing code ... */ }
}
