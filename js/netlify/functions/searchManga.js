// ==========================================
// BRAVE SEARCH PROXY (netlify/functions/searchManga.js)
// ==========================================
// READLINKS_UPGRADE_PLAN.md Step 9 -- the ONLY backend component this app
// has. Everything else in the read-links flow (Manganato/Bato/MangaDex/
// Comick/Google/official-source buttons) stays 100% client-side in
// getFallbackLinks()/resolveReadLinks() -- this function exists purely
// because Brave's Search API key has to stay off the client; those other
// sources need no secret at all, so they were deliberately NOT moved here.
//
// Deployed at: /.netlify/functions/searchManga?title=<title>&author=<author>
// GET only. `author` is optional. Requires a BRAVE_API_KEY environment
// variable set in the Netlify site's dashboard (never in frontend code).
//
// Runtime note: uses the global `fetch`, available in Netlify's Node 18+
// function runtime by default -- no node-fetch dependency needed.

// Same reasoning/domain list as Step 1's Google fallback blocklist, but
// applied here as a literal array filter on the *returned* results rather
// than baked into the search query string -- per the plan's own guidance,
// this is easier to maintain as the list grows (no query-string length
// creep) and doesn't rely on Brave's query syntax matching Google's.
const EXCLUDED_SEARCH_DOMAINS = [
    'reddit.com', 'fandom.com', 'wikipedia.org', 'youtube.com',
    'twitter.com', 'x.com', 'quora.com', 'pinterest.com',
    'facebook.com', 'instagram.com', 'tiktok.com',
    'myanimelist.net', 'anilist.co', 'mangaupdates.com',
    'animenewsnetwork.com', 'cbr.com', 'screenrant.com'
];

const BRAVE_API = 'https://api.search.brave.com/res/v1/web/search';
const RESULT_LIMIT = 5;

function isExcludedDomain(url) {
    try {
        const hostname = new URL(url).hostname.replace(/^www\./, '');
        return EXCLUDED_SEARCH_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
    } catch (e) {
        return true; // malformed URL -- exclude rather than risk showing junk
    }
}

exports.handler = async function (event) {
    const headers = {
        'Content-Type': 'application/json',
        // Same-origin in production (frontend + function both on Netlify),
        // but kept open for local dev where the frontend may be served
        // from a different port.
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    const title = (event.queryStringParameters?.title || '').trim();
    if (!title) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required `title` query parameter' }) };
    }
    const author = (event.queryStringParameters?.author || '').trim();

    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
        console.error('[searchManga] BRAVE_API_KEY environment variable is not set.');
        // Degrade gracefully -- an empty result list, not a hard error, so
        // the frontend's "Search Results" section just quietly shows
        // nothing instead of surfacing a scary error to the end user over
        // what is, from their perspective, a missing "extra" feature.
        return { statusCode: 200, headers, body: JSON.stringify({ results: [] }) };
    }

    const queryParts = [title];
    if (author) queryParts.push(author);
    queryParts.push('manga read online');
    const q = queryParts.join(' ');

    try {
        const url = `${BRAVE_API}?q=${encodeURIComponent(q)}&count=10`;
        const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'X-Subscription-Token': apiKey
            }
        });

        if (!res.ok) {
            console.error(`[searchManga] Brave API returned HTTP ${res.status}`);
            return { statusCode: 200, headers, body: JSON.stringify({ results: [] }) };
        }

        const data = await res.json();
        const rawResults = data.web?.results || [];

        // Explicitly out of scope (see plan): verifying each result is a
        // real manga-reading page vs. a fan page/dead link. This is a
        // static domain-blocklist filter only -- cheap, low-maintenance,
        // no HTML fetching or per-site heuristics involved.
        const results = rawResults
            .filter(r => r.url && !isExcludedDomain(r.url))
            .slice(0, RESULT_LIMIT)
            .map(r => ({
                title: r.title || 'Untitled result',
                url: r.url,
                snippet: r.description || ''
            }));

        return { statusCode: 200, headers, body: JSON.stringify({ results }) };
    } catch (error) {
        console.error('[searchManga] Brave API request failed:', error.message);
        return { statusCode: 200, headers, body: JSON.stringify({ results: [] }) };
    }
};

