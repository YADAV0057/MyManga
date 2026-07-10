// ==========================================
// BRAVE SEARCH FRONTEND CLIENT (js/braveSearch.js)
// ==========================================
// READLINKS_UPGRADE_PLAN.md Step 9. Talks to the Netlify function at
// netlify/functions/searchManga.js (the app's only backend component) and
// caches results in Firestore using the exact same `cache` collection +
// read/write-through pattern Step 3 established in mangadex.js for
// MangaDex/Comick links -- same reasoning: Brave's free tier is
// quota-limited (~2,000 queries/month), so repeat lookups of the same
// title must never re-call Brave.
import { CONFIG } from './config.js';
import { db, doc, getDoc, setDoc } from './firebase.js';

const SEARCH_FUNCTION_URL = '/.netlify/functions/searchManga';
const TIMEOUT_MS = 5000;

function searchCacheKey(title) {
    const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `bravesearch_${cleanTitle}`;
}

async function readSearchCache(key) {
    if (!db) return null; // matches the rest of the app's `if (!db)` guard -- init failure degrades to no cache, not a crash
    try {
        const snap = await getDoc(doc(db, 'cache', key));
        if (!snap.exists()) return null;
        const data = snap.data();
        if (Date.now() - data.cachedAt > CONFIG.CACHE_EXPIRY) return null;
        return data.results;
    } catch (e) {
        console.warn('[braveSearch.js] search cache read failed:', e.message);
        return null;
    }
}

// Deliberately NOT awaited by callers -- a slow or failed write must never
// delay results that are about to render (same reasoning as mangadex.js's
// writeLinksCache()).
function writeSearchCache(key, results) {
    if (!db) return;
    setDoc(doc(db, 'cache', key), { results, cachedAt: Date.now() }).catch(e =>
        console.warn('[braveSearch.js] search cache write failed:', e.message)
    );
}

/**
 * Fetches Brave web-search results for `title` (optionally scoped with an
 * author name), via the Netlify function proxy. Cached in Firestore for
 * CONFIG.CACHE_EXPIRY (same 24h TTL as read-links). Never throws -- always
 * resolves to an array (possibly empty) so the "Search Results" UI section
 * can just render nothing on failure instead of an error state cascading
 * from a network hiccup or a missing/misconfigured Brave API key.
 * @param {string} title
 * @param {{author?: string}} [meta]
 * @returns {Promise<{title: string, url: string, snippet: string}[]>}
 */
export async function fetchBraveResults(title, meta = {}) {
    const cacheKey = searchCacheKey(title);
    const cached = await readSearchCache(cacheKey);
    if (cached) return cached;

    const params = new URLSearchParams({ title });
    if (meta.author) params.set('author', meta.author);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(`${SEARCH_FUNCTION_URL}?${params.toString()}`, {
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) return [];

        const data = await res.json();
        const results = Array.isArray(data.results) ? data.results : [];

        writeSearchCache(cacheKey, results);
        return results;
    } catch (e) {
        clearTimeout(timeout);
        console.warn('[braveSearch.js] search request failed:', e.message);
        return [];
    }
}

