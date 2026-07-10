// ==========================================
// MANGADEX ENGINE (js/mangadex.js)
// ==========================================
// CHANGED: fetchFromMangaDexFallback now consumes a SearchPlan
// (js/parser/searchPlanner.js) instead of the simple parser's parsedData.
// suggestTitlesFromMangaDex() is untouched -- it only ever took a raw
// title/query string, not a parsed object.
//
// CHANGED (READLINKS_UPGRADE_PLAN.md Steps 1 & 2): getFallbackLinks() no
// longer builds its 3 hardcoded link objects inline -- it now reads from
// the data-driven registry in js/readLinks/sources.js. resolveReadLinks()
// and getFallbackLinks() both take an optional `meta` object (currently
// just { author }, forwarded from mangaDetail.js) so the Google entry's
// buildUrl() can use it when available; no other behavior changed.
//
// CHANGED (READLINKS_UPGRADE_PLAN.md Step 3): resolveReadLinks() now
// checks a Firestore cache before ever calling MangaDex, using the same
// `cache` collection + read/write-through pattern already used by
// myListPage.js/topPicks.js/mixerPage.js (db, doc, getDoc, setDoc from
// firebase.js -- same export style as everywhere else in the app). Cache
// key is `readlinks_<normalizedTitle>`, TTL is CONFIG.CACHE_EXPIRY (24h).
// Writes are fire-and-forget so a slow/failed write never delays the
// links actually rendering.
import { CONFIG } from './config.js';
import { READ_LINK_SOURCES } from './readLinks/sources.js';
import { db, doc, getDoc, setDoc } from './firebase.js';

// MangaDex requires specific UUIDs for genres
const MD_TAG_MAP = {
    action: '391b0423-d847-456f-aff0-8b8a41bdfeaf',
    adventure: '87cc87cd-a395-47af-bf47-b32d4318e3df',
    comedy: '4d32cc48-9f00-4cca-9b5a-a839f0764984',
    drama: 'b9af3a63-f058-46de-a9a0-e0c13906197a',
    fantasy: 'cdc58593-87dd-415e-bbc0-2ec27bf404cc',
    horror: 'cdad7e68-1419-41dd-bdce-27753074a640',
    mystery: 'ee968100-4191-4968-94d3-f3f62e40044a',
    psychological: '3b60b75c-a2d7-4860-ab56-05f391bb889c',
    romance: '423e2eae-a7a2-4a8b-ac03-a8351462d71d',
    scifi: '256c8bd9-4904-4360-bf4f-508a76d67183',
    sliceoflife: 'e5301a23-ebd9-49dd-a0cb-2add944c0d04',
    sports: '69b626e5-4d74-4b55-a2a0-40a23277beff',
    supernatural: 'eabc5b4c-6aff-42f3-b657-3e90cbd00b75',
    thriller: '07251805-a27e-4d59-b468-232d5f80ef16'
};

const MD_STATUS_MAP = {
    FINISHED: 'completed',
    RELEASING: 'ongoing',
    HIATUS: 'hiatus',
    CANCELLED: 'cancelled'
};

const REVERSE_MD_STATUS = {
    'completed': 'FINISHED',
    'ongoing': 'RELEASING',
    'hiatus': 'HIATUS',
    'cancelled': 'CANCELLED'
};

function toTagKey(name) {
    return name.trim().toLowerCase().replace(/[^a-z]/g, '');
}

// 1. THE FALLBACK ENGINE (Tier 4 Database)
/**
 * @param {import('./parser/searchPlanner.js').SearchPlan} plan
 * @param {number} page
 * @param {number} limit
 */
export async function fetchFromMangaDexFallback(plan, page = 1, limit = 10) {
    const params = new URLSearchParams();
    params.set('limit', limit);
    params.set('offset', (page - 1) * limit);
    params.append('includes[]', 'cover_art');
    params.set('availableTranslatedLanguage[]', 'en'); 

    const genreList = [...(plan.primaryGenres || []), ...(plan.secondaryThemes || [])];
    const isGenreSearch = genreList.length > 0;
    const freeText = (plan.cleanQuery || '').trim();

    if (isGenreSearch) {
        const tagIds = genreList
            .map(toTagKey)
            .map(g => MD_TAG_MAP[g])
            .filter(Boolean);

        tagIds.forEach(id => params.append('includedTags[]', id));

        if (plan.filters?.sort === 'rating') {
            params.set('order[rating]', 'desc');
        } else {
            params.set('order[followedCount]', 'desc'); // Sort by most popular
        }
    } else if (freeText.length > 0) {
        params.set('title', freeText);
        params.set('order[relevance]', 'desc');
    }

    // NEW: exclude genres the planner flagged as avoids, where MangaDex has a tag UUID for them
    if (plan.excludedGenres && plan.excludedGenres.length > 0) {
        const excludeIds = plan.excludedGenres
            .map(toTagKey)
            .map(g => MD_TAG_MAP[g])
            .filter(Boolean);
        excludeIds.forEach(id => params.append('excludedTags[]', id));
    }

    if (plan.filters?.statusFilter && MD_STATUS_MAP[plan.filters.statusFilter]) {
        params.append('status[]', MD_STATUS_MAP[plan.filters.statusFilter]);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout for heavy DB searches

    try {
        const response = await fetch(`${CONFIG.MANGADEX_API}/manga?${params.toString()}`, { signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) return [];

        const data = await response.json();
        if (!data.data || !Array.isArray(data.data)) return [];

        return data.data.map(m => {
            // Bomb-proofed: defaults to empty objects/arrays if MangaDex is missing data
            const attr = m.attributes || {};
            const rels = m.relationships || [];
            
            // Extract cover art safely
            const coverRel = rels.find(rel => rel?.type === 'cover_art');
            const coverFile = coverRel?.attributes?.fileName;
            const coverUrl = coverFile ? `${CONFIG.MANGADEX_COVER}/${m.id}/${coverFile}` : null;

            // Extract genres and themes separately -- MangaDex already tags each
            // one by `group`, we were just merging them into one array before.
            const tags = attr.tags || [];
            const genres = tags
                .filter(t => t?.attributes?.group === 'genre')
                .map(t => t?.attributes?.name?.en)
                .filter(Boolean);
            const themes = tags
                .filter(t => t?.attributes?.group === 'theme')
                .map(t => t?.attributes?.name?.en)
                .filter(Boolean);

            const titleObj = attr.title || {};
            const altTitles = attr.altTitles || [];
            const engAltTitle = altTitles.find(t => t?.en)?.en;

            const descObj = attr.description || {};

            return {
                id: `mangadex-${m.id}`,
                title: { 
                    english: titleObj.en || engAltTitle || Object.values(titleObj)[0] || 'Unknown Title',
                    romaji: titleObj['ja-ro'] || null
                },
                averageScore: null, // Skipped for speed (requires secondary API call)
                // popularity: intentionally omitted -- MangaDex has no cheap
                // popularity field on this endpoint (follower count requires
                // a separate /statistics call per title). normalizeResult()
                // defaults this to null, which is accurate here, not a bug.
                genres: genres,
                themes: themes,
                // NEW: publicationDemographic is a single value (e.g. "shounen"),
                // wrapped in an array to match the other adapters' shape.
                demographics: attr.publicationDemographic ? [attr.publicationDemographic] : [],
                description: descObj.en || "No synopsis available.",
                coverImage: { large: coverUrl },
                chapters: attr.lastChapter || null,
                status: REVERSE_MD_STATUS[attr.status] || attr.status || "Unknown"
            };
        });
    } catch (error) {
        clearTimeout(timeout);
        console.error("MangaDex Fallback Error:", error);
        return [];
    }
}

// 2. THE READ LINK RESOLVER 
// Session-level circuit breaker added here
let mangaDexUnreachable = false;
let consecutiveFailures = 0;

// Instant, no-network fallback links (Manganato, Bato.to, Google), built
// from the READ_LINK_SOURCES registry (js/readLinks/sources.js) instead of
// hardcoded inline. `meta` is optional and currently only used by the
// Google entry (author, if the item model ever provides one -- see Step 8).
export function getFallbackLinks(title, meta = {}) {
    return READ_LINK_SOURCES.map(source => ({
        name: source.name,
        url: source.buildUrl(title, meta),
        isValidated: false
    }));
}

// ---- Step 3: Firestore cache for resolved read-links ----
// Same `cache` collection + shape (key, { ..., cachedAt }) already used by
// myListPage.js/topPicks.js/mixerPage.js, so this doesn't introduce a new
// caching pattern into the app, just reuses the existing one.
function readLinksCacheKey(title) {
    const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `readlinks_${cleanTitle}`;
}

async function readLinksCache(key) {
    if (!db) return null; // matches the rest of the app's `if (!db)` guard -- init failure degrades to no cache, not a crash
    try {
        const snap = await getDoc(doc(db, 'cache', key));
        if (!snap.exists()) return null;
        const data = snap.data();
        if (Date.now() - data.cachedAt > CONFIG.CACHE_EXPIRY) return null;
        return data.links;
    } catch (e) {
        console.warn('[mangadex.js] read-links cache read failed:', e.message);
        return null;
    }
}

// Deliberately NOT awaited by callers -- a slow or failed write must never
// delay the links that are about to render.
function writeLinksCache(key, links) {
    if (!db) return;
    setDoc(doc(db, 'cache', key), { links, cachedAt: Date.now() }).catch(e =>
        console.warn('[mangadex.js] read-links cache write failed:', e.message)
    );
}

export async function resolveReadLinks(title, meta = {}) {
    const cacheKey = readLinksCacheKey(title);
    const cached = await readLinksCache(cacheKey);
    if (cached) return cached;

    let validLinks = [];

    if (!mangaDexUnreachable) {
        // MangaDex API is generally fast, but we add a 1.5-second timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 1500);
        const encodedTitle = encodeURIComponent(title);

        try {
            const mdRes = await fetch(`${CONFIG.MANGADEX_API}/manga?title=${encodedTitle}&limit=1`, {
                signal: controller.signal
            });

            clearTimeout(timeout);
            consecutiveFailures = 0; // Reset consecutive failures on success

            if (mdRes.ok) {
                const mdData = await mdRes.json();
                if (mdData.data && mdData.data.length > 0) {
                    validLinks.push({
                        name: "MangaDex (Verified)",
                        url: `https://mangadex.org/title/${mdData.data[0].id}`,
                        isValidated: true
                    });
                }
            }
        } catch (e) {
            clearTimeout(timeout);
            if (++consecutiveFailures >= 2) {
                mangaDexUnreachable = true;
                console.warn("[mangadex.js] MangaDex unreachable this session -- skipping further link resolution until reload.");
            }
            // Silently fail to fallback links if API is down or blocked
            console.warn("MangaDex link resolution skipped for:", title);
        }
    }

    // Manganato, Bato.to, and Google fallbacks
    validLinks.push(...getFallbackLinks(title, meta));

    writeLinksCache(cacheKey, validLinks);
    return validLinks;
}

// 3. THE SUGGESTION ENGINE (unchanged -- takes a plain query string)
export async function suggestTitlesFromMangaDex(query, limit = 5) {
    if (!query || query.length < 2) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const res = await fetch(`${CONFIG.MANGADEX_API}/manga?title=${encodeURIComponent(query)}&limit=${limit}&order[relevance]=desc`, {
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) return [];
        const data = await res.json();

        if (!data.data || !Array.isArray(data.data)) return [];

        return data.data
            .map(m => {
                const titles = m.attributes?.title || {};
                // Prefer English title, fall back to first available locale
                return titles.en || Object.values(titles)[0] || null;
            })
            .filter(Boolean); // Removes nulls or undefined

    } catch (e) {
        clearTimeout(timeout);
        console.warn("MangaDex suggestion lookup failed:", e);
        return [];
    }
}
