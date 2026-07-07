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
            const cleanTag = tag.replace(/_/g, ' '); // Convert "time_loop" to "time loop"
            console.log(`[Automated] Harvesting: ${cleanTag} (ID: ${tag})`);
            
            // Fire all 3 APIs at the same time for maximum speed
            const [annData, aniListData, synonyms] = await Promise.all([
                this.fetchFromANN(cleanTag),
                this.fetchFromAniList(cleanTag),
                this.fetchAliases(cleanTag)
            ]);

            // Merge unique genres from ANN and AniList
            const mergedGenres = new Map();
            [...annData.genres, ...aniListData.genres].forEach(g => {
                if (!mergedGenres.has(g.name)) {
                    mergedGenres.set(g.name, { name: g.name, weight: WEIGHT_MAP[g.name] || 0.70 });
                }
            });

            // Merge unique themes from ANN and AniList
            const mergedThemes = new Map();
            [...annData.themes, ...aniListData.themes].forEach(t => {
                if (!mergedThemes.has(t.name)) {
                    mergedThemes.set(t.name, { name: t.name, weight: 0.80 });
                }
            });

            return {
                id: tag,
                aliases: [...new Set([tag, cleanTag, ...synonyms])], // Remove duplicates
                genres: Array.from(mergedGenres.values()),
                themes: Array.from(mergedThemes.values())
            };
        } catch (err) {
            console.error(`[Error] Pipeline failed for ${tag}:`, err.message);
            return null;
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

            // Loop through the top manga results and steal their genres/tags
            mediaList.forEach(media => {
                if (media.genres) {
                    media.genres.forEach(g => extractedGenres.add(g));
                }
                if (media.tags) {
                    media.tags.forEach(t => extractedThemes.add(t.name));
                }
            });

            return {
                genres: Array.from(extractedGenres).map(name => ({ name })),
                // We limit to the first 5 themes so the object doesn't get ridiculously huge
                themes: Array.from(extractedThemes).slice(0, 5).map(name => ({ name }))
            };
        } catch (e) {
            console.log(`[AniList] Failed or no data for ${tag}`);
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
