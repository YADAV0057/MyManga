const axios = require('axios');
const xml2js = require('xml2js');

class HarvesterAPI {
    static async getNormalizedConcept(tag) {
        try {
            console.log(`[ANN] Harvesting: ${tag}`);
            return await this.fetchFromANN(tag);
        } catch (err) {
            console.error(`[ANN Error] Failed: ${tag}.`);
            return null; 
        }
    }

    static async fetchFromANN(tag) {
        const url = `https://cdn.animenewsnetwork.com/encyclopedia/api.xml?title=~${encodeURIComponent(tag)}`;
        const response = await axios.get(url);
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);

        const info = result.ann.anime;
        const genres = Array.isArray(info.info) ? info.info.filter(i => i.$.type === "Genres") : [];

        return {
            id: tag,
            aliases: [tag],
            genres: genres.map(g => ({
                name: (g._ || "").replace(/\s+/g, ''),
                weight: 0.85
            })),
            themes: [] 
        };
    }
}

module.exports = HarvesterAPI;
