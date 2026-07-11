import axios from 'axios';
import { parseString } from 'xml2js';
import { analyzeSynopsis } from './synopsisAnalyzer.js';
import { buildEntityVotes, computeOppositeConcepts, computeRelatedConcepts } from './entityRelations.js';
import { fetchShikimoriRelatedTitles } from './shikimoriClient.js';
import { fetchMangaUpdatesRelatedTitles } from './mangaUpdatesClient.js';

// Entity/opposite/related-concept harvesting is title-granularity (4 extra
// API calls per concept vs. the tag-granularity genre/theme harvest above),
// so it's opt-in via env var rather than always-on — run a small batch with
// it enabled first to see real call volume before pointing it at a big
// queue.txt. Set ENTITY_HARVEST=1 in the environment (or the harvest.yml
// workflow's `env:`) to turn it on.
const ENTITY_HARVEST_ENABLED = process.env.ENTITY_HARVEST === '1';

const WEIGHT_MAP = {
    "Action": 0.95, "Psychological": 0.90, "Drama": 0.85,
    "SliceOfLife": 1.0, "Fantasy": 0.80, "Romance": 0.75,
    "Sci-Fi": 0.85, "Comedy": 0.70, "Horror": 0.90
};

export class HarvesterAPI {
    /**
     * @param {string} tag
     * @param {object} [knownConcepts] - merged CONCEPT_PROPERTIES + HARVESTED_RULES,
     *   passed in by harvester.js's already-loaded `knownKeys` — needed for
     *   opposite/related-concept detection (entityRelations.js). Optional:
     *   omitting it just skips those two fields, same as before this change.
     */
    static async getNormalizedConcept(tag, knownConcepts = {}) {
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

            const mergedDemographics = new Map();
            (jikanData.demographics || []).forEach(d => {
                if (!mergedDemographics.has(d.name)) {
                    mergedDemographics.set(d.name, { name: d.name, weight: 0.80 });
                }
            });

            // Tone/intensity/boosts/excludes come from the actual plot text, not
            // the tag lists — AniList/Jikan/ANN can't tell us those. Runs
            // entirely locally (AFINN-165 + manga trope routing), no LLM calls.
            const synopsisText = [jikanData.synopsis, aniListData.description]
                .filter(Boolean)
                .join(' ');
            const textAnalysis = analyzeSynopsis(synopsisText);

            const finalGenres = Array.from(mergedGenres.values());
            const finalThemes = Array.from(mergedThemes.values());

            // Opposite/related-concept detection only needs the genre/theme
            // vectors we already have in memory — no extra API calls, so
            // this always runs regardless of ENTITY_HARVEST_ENABLED.
            const opposite = computeOppositeConcepts(finalGenres, finalThemes, knownConcepts, tag);
            const relatedConcepts = computeRelatedConcepts(finalGenres, finalThemes, knownConcepts, tag);

            // Entity harvesting (specific manga titles) is the expensive,
            // opt-in part — 4 extra network round-trips per concept.
            let entities = [];
            if (ENTITY_HARVEST_ENABLED) {
                entities = await buildEntityVotes(cleanTag, {
                    fetchShikimoriRelatedTitles,
                    fetchMangaUpdatesRelatedTitles
                });
            }

            return {
                // FIX: was `id: tag` (the raw, underscored queue entry, e.g.
                // "noble_academy"). dictionary.js documents concept.id as the
                // field used for display text ("Known {concept.id} pick",
                // etc.), and every other output here (aliases, console log,
                // API queries) already uses cleanTag. Using the raw tag meant
                // any underscored queue entry would display with literal
                // underscores forever, even though matching/search all worked
                // fine off the cleaned form. Now consistent with the rest of
                // this function.
                id: cleanTag,
                metadata: {
                    sources: ["ANN", "AniList", "Jikan", "Datamuse"],
                    generatedAt: new Date().toISOString(),
                    confidence: calculatedConfidenceScore,
                    version: "1.0.0"
                },
                aliases: [...new Set([tag, cleanTag, ...synonyms])],
                genres: finalGenres,
                themes: finalThemes,
                demographics: Array.from(mergedDemographics.values()),
                textAnalysis,
                entities,
                opposite,
                relatedConcepts
            };
        } catch (err) {
            console.error(`[Error] Pipeline failed for ${tag}:`, err.message);
            return null;
        }
    }

    
static async fetchAliases(tag) {
    try {
        // Pull more candidates than we need (max=10, not 3) so filtering by
        // relevance below still leaves real ones to keep, instead of just
        // shrinking an already-tiny unfiltered list.
        const res = await axios.get(`https://api.datamuse.com/words?ml=${encodeURIComponent(tag)}&max=10`);
        const results = res.data || [];
        if (results.length === 0) return [];

        // FIX: this used to keep Datamuse's top 3 words no matter how weak
        // the match was. For real single words ("horror") that's fine — for
        // invented multi-word trope names ("Noble Academy", "Cursed
        // Bloodline") Datamuse has nothing good to associate, so it just
        // returned the least-bad garbage it had, which then got injected
        // straight into SYNONYM_MAP as if it were a real synonym (e.g.
        // "flame" silently routing searches to "Noble Academy").
        //
        // Datamuse's `score` isn't on a fixed scale — it depends on how
        // well-connected the query word is overall — so a single hardcoded
        // cutoff would be too strict for some tags and too loose for
        // others. Instead, keep only words scoring at least RELATIVE_FLOOR
        // of *this query's own* top score, so it adapts per tag. If even
        // the best result has no real score, Datamuse effectively found
        // nothing meaningful — return no aliases rather than guessing.
        const RELATIVE_FLOOR = 0.3;
        const topScore = results[0].score || 0;
        if (topScore <= 0) return [];

        return results
            .filter(item => (item.score || 0) >= topScore * RELATIVE_FLOOR)
            .slice(0, 3)
            .map(item => item.word);
    } catch (e) { return []; }
}
    static async fetchFromJikan(tag) {
        try {
            const res = await axios.get(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(tag)}&limit=3`);
            const genres = new Set();
            const themes = new Set();
            const demographics = new Set();
            let synopsis = '';
            res.data?.data?.forEach(m => {
                m.genres?.forEach(g => genres.add(g.name));
                m.themes?.forEach(t => themes.add(t.name));
                // Jikan exposes demographics (Shounen/Shoujo/Seinen/Josei/Kids) as its
                // own field, so we don't have to guess which "theme" is really a
                // demographic later on.
                m.demographics?.forEach(d => demographics.add(d.name));
                // Use the first non-empty synopsis we find (results are sorted by
                // relevance, so the top hit's synopsis is the most representative).
                if (!synopsis && m.synopsis) synopsis = m.synopsis;
            });
            return {
                genres: Array.from(genres).map(name => ({ name })),
                themes: Array.from(themes).map(name => ({ name })),
                demographics: Array.from(demographics).map(name => ({ name })),
                synopsis
            };
        } catch (e) { return { genres: [], themes: [], demographics: [], synopsis: '' }; }
    }

    static async fetchFromAniList(tag) {
        // description(asHtml: false) gets us plain text directly, no HTML stripping needed.
        const query = `query ($search: String) { Page(page: 1, perPage: 3) { media(search: $search, type: MANGA) { genres tags { name } description(asHtml: false) } } }`;
        try {
            const res = await axios.post('https://graphql.anilist.co', { query, variables: { search: tag } });
            const genres = new Set();
            const themes = new Set();
            let description = '';
            res.data?.data?.Page.media.forEach(m => {
                m.genres?.forEach(g => genres.add(g));
                m.tags?.forEach(t => themes.add(t.name));
                if (!description && m.description) description = m.description;
            });
            return {
                genres: Array.from(genres).map(name => ({ name })),
                themes: Array.from(themes).slice(0, 5).map(name => ({ name })),
                description
            };
        } catch (e) { return { genres: [], themes: [], description: '' }; }
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
