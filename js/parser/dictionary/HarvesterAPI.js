const axios = require('axios');
const xml2js = require('xml2js');

// Define your weight preferences here
const WEIGHT_MAP = {
    "Action": 0.95, "Psychological": 0.90, "Drama": 0.85, 
    "SliceOfLife": 1.0, "Fantasy": 0.80, "Romance": 0.75
};

class HarvesterAPI {
    static async getNormalizedConcept(tag) {
        try {
            console.log(`[Harvester] Fetching data for: ${tag}`);
            
            // 1. Get foundation from ANN
            const annData = await this.fetchFromANN(tag);
            
            // 2. Get aliases from Datamuse API
            const aliases = await this.fetchAliases(tag);

            return {
                id: tag,
                aliases: aliases,
                genres: annData.genres.map(g => ({
                    name: g.name,
                    weight: WEIGHT_MAP[g.name] || 0.70 // Fallback to 0.70
                })),
                themes: annData.themes.map(t => ({
                    name: t.name,
                    weight: 0.80
                }))
            };
        } catch (err) {
            console.error(`[Harvester Error] Failed for ${tag}:`, err.message);
            return null;
        }
    }

    static async fetchAliases(tag) {
        try {
            const res = await axios.get(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(tag)}&max=5`);
            const synonyms = res.data.map(item => item.word);
            return [tag, ...synonyms]; // Always include the original tag first
        } catch (e) {
            return [tag]; // Fallback to just the tag
        }
    }

    static async fetchFromANN(tag) {
        const url = `https://cdn.animenewsnetwork.com/encyclopedia/api.xml?title=~${encodeURIComponent(tag)}`;
        const response = await axios.get(url);
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);

        const info = result.ann.anime;
        const infoList = Array.isArray(info.info) ? info.info : [info.info];

        return {
            genres: infoList
                .filter(i => i.$.type === "Genres")
                .map(g => ({ name: g._.replace(/\s+/g, '') })),
            themes: infoList
                .filter(i => i.$.type === "Themes")
                .map(t => ({ name: t._.replace(/\s+/g, '') }))
        };
    }
}

module.exports = HarvesterAPI;
