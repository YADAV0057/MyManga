import axios from 'axios';
import xml2js from 'xml2js';

// These weights will be applied automatically to any genres found 
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
            
            // 🔥 Quad-Core Fetch: Firing 4 APIs simultaneously
            const [annData, aniListData, jikanData, synonyms] = await Promise.all([
                this.fetchFromANN(cleanTag),
                this.fetchFromAniList(cleanTag),
                this.fetchFromJikan(cleanTag), // New MyAnimeList Search
                this.fetchAliases(cleanTag)
            ]);

            // Merge unique genres from ALL THREE anime/manga databases
            const mergedGenres = new Map();
            [...annData.genres, ...aniListData.genres, ...jikanData.genres].forEach(g => {
                if (!mergedGenres.has(g.name)) {
                    mergedGenres.set(g.name, { name: g.name, weight: WEIGHT_MAP[g.name] || 0.70 });
                }
            });

            // Merge unique themes from ALL THREE anime/manga databases
            const mergedThemes = new Map();
            [...annData.themes, ...aniListData.themes, ...jikanData.themes].forEach(t => {
                if (!mergedThemes.has(t.name)) {
                    mergedThemes.set(t.name, { name: t.name, weight: 0.80 });
                }
            });

            return {
                id: tag,
                aliases: [...new Set([tag, cleanTag, ...synonyms])], 
                genres: Array.from(mergedGenres.values()),
                themes: Array.from(mergedThemes.values())
            };
        } catch (err) {
            console.error(`[Error] Pipeline failed for ${tag}:`, err.message);
            return null;
        }
    }

    // 🌟 NEW: MyAnimeList (Jikan) API
    // Searches descriptions/synopses, not just titles!
    static async fetchFromJikan(tag) {
        try {
            const url = `https://api.jikan.moe/v4/manga?q=${encodeURIComponent(tag)}&limit=3`;
            const response = await axios.get(url);
            
            const extractedGenres = new Set();
            const extractedThemes = new Set();

            if (response.data && response.data.data) {
                response.data.data.forEach(manga => {
                    if (manga.genres) manga.genres.forEach(g => extractedGenres.add(g.name));
                    if (manga.themes) manga.themes.forEach(t => extractedThemes.add(t.name));
                });
            }

            return {
                genres: Array.from(extractedGenres).map(name => ({ name })),
                themes: Array.from(extractedThemes).map(name => ({ name }))
            };
        } catch (e) {
            console.log(`[Jikan] Failed or no data for ${tag}`);
            return { genres: [], themes: [] };
        }
    }

    static async fetchFromAniList(tag) {
        const query = `
            query ($search: String) {
                Page(page: 1, perPage: 3) {
                    media(search: $search, type: MANGA) {
                        genres
                        tags {
                            name
                        }
                    }
                }
            }
        `;
        
        try {
            const response = await axios.post('https://graphql.anilist.co', {
                query: query,
                variables: { search: tag }
            });

            const mediaList = response.data.data.Page.media;
            const extractedGenres = new Set();
            const extractedThemes = new Set();

            mediaList.forEach(media => {
                if (media.genres) media.genres.forEach(g => extractedGenres.add(g));
                if (media.tags) media.tags.forEach(t => extractedThemes.add(t.name));
            });

            return {
                genres: Array.from(extractedGenres).map(name => ({ name })),
                themes: Array.from(extractedThemes).slice(0, 5).map(name => ({ name }))
            };
        } catch (e) {
            return { genres: [], themes: [] };
        }
    }

    static async fetchAliases(tag) {
        try {
            const res = await axios.get(`https://api.datamuse.com/words?ml=${encodeURIComponent(tag)}&max=3`);
            return res.data.map(item => item.word);
        } catch (e) {
            return []; 
        }
    }

    static async fetchFromANN(tag) {
        try {
            const url = `https://cdn.animenewsnetwork.com/encyclopedia/api.xml?title=~${encodeURIComponent(tag)}`;
            const response = await axios.get(url);
            
            const parser = new xml2js.Parser({ explicitArray: false });
            const result = await parser.parseStringPromise(response.data);

            const info = result?.ann?.anime;
            if (!info || !info.info) return { genres: [], themes: [] };

            const infoList = Array.isArray(info.info) ? info.info : [info.info];

            return {
                genres: infoList.filter(i => i.$.type === "Genres").map(g => ({ name: g._.replace(/\s+/g, '') })),
                themes: infoList.filter(i => i.$.type === "Themes").map(t => ({ name: t._.replace(/\s+/g, '') }))
            };
        } catch (e) {
            return { genres: [], themes: [] };
        }
    }
}
