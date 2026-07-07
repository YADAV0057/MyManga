import axios from 'axios';
import { parseString } from 'xml2js';

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

    static async fetchAliases(tag) {
        try {
            const res = await axios.get(`https://api.datamuse.com/words?ml=${encodeURIComponent(tag)}&max=3`);
            return res.data.map(item => item.word);
        } catch (e) { return []; }
    }

    static async fetchFromJikan(tag) {
        try {
            const res = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(tag)}&limit=3`);
            const genres = new Set();
            const themes = new Set();
            res.data?.data?.forEach(m => {
                m.genres?.forEach(g => genres.add(g.name));
                m.themes?.forEach(t => themes.add(t.name));
            });
            return { genres: Array.from(genres).map(name => ({ name })), themes: Array.from(themes).map(name => ({ name })) };
        } catch (e) { return { genres: [], themes: [] }; }
    }

    static async fetchFromAniList(tag) {
        const query = `query ($search: String) { Page(page: 1, perPage: 3) { media(search: $search, type: MANGA) { genres tags { name } } } }`;
        try {
            const res = await axios.post('https://graphql.anilist.co', { query, variables: { search: tag } });
            const genres = new Set();
            const themes = new Set();
            res.data?.data?.Page.media.forEach(m => {
                m.genres?.forEach(g => genres.add(g));
                m.tags?.forEach(t => themes.add(t.name));
            });
            return { genres: Array.from(genres).map(name => ({ name })), themes: Array.from(themes).slice(0, 5).map(name => ({ name })) };
        } catch (e) { return { genres: [], themes: [] }; }
    }

    static async fetchFromANN(tag) {
        // ANN search logic implemented here
        try {
            const res = await axios.get(`https://www.animenewsnetwork.com/encyclopedia/api.xml?title=~${encodeURIComponent(tag)}`);
            // XML parsing logic would go here, returning a similar structure:
            return { genres: [], themes: [] };
        } catch (e) { return { genres: [], themes: [] }; }
    }
}
