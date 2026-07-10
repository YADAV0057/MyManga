// ==========================================
// READ-LINK SOURCE REGISTRY (js/readLinks/sources.js)
// ==========================================
// Data-driven registry of fallback "Read Now" link sources (Manganato,
// Bato.to, Google). Adding or removing a source later is now a one-line
// change here instead of editing getFallbackLinks()/resolveReadLinks() in
// mangadex.js directly.
//
// Each entry: { id, name, buildUrl(title, meta = {}), tier: 'verified'|'fallback' }
// 'fallback' entries here are always instant, no-network, guessed-URL
// sources. 'verified' sources (MangaDex today, Comick in a later step)
// require a real async API lookup, so they are NOT built from this
// registry -- they stay in mangadex.js's resolveReadLinks().
//
// No behavior change vs. the previous hardcoded list, other than the
// richer Google query already approved in Step 1 below. See
// READLINKS_UPGRADE_PLAN.md, Steps 1 & 2.

// Curated blocklist for the Google fallback query -- excludes domains that
// reliably do NOT host actual manga-reading pages (trackers/wikis/social/
// news), without narrowing the search to a fixed allowlist of sites.
// Kept short (~14 domains) per Google's own guidance not to pad queries
// with dozens of -site: terms. Crunchyroll is deliberately NOT excluded
// (legit licensed reader, candidate for Step 7's official-source buttons).
const GOOGLE_EXCLUDED_DOMAINS = [
    'myanimelist.net', 'anilist.co', 'mangaupdates.com',
    'fandom.com', 'wikipedia.org',
    'reddit.com', 'twitter.com', 'x.com', 'facebook.com',
    'tiktok.com', 'quora.com',
    'animenewsnetwork.com', 'cbr.com', 'screenrant.com'
];

export const READ_LINK_SOURCES = [
    {
        id: 'manganato',
        name: 'Manganato',
        tier: 'fallback',
        buildUrl: (title) => `https://manganato.com/search/story/${encodeURIComponent(title)}`
    },
    {
        id: 'batoto',
        name: 'Bato.to',
        tier: 'fallback',
        buildUrl: (title) => `https://bato.to/search?word=${encodeURIComponent(title)}`
    },
    {
        id: 'google',
        name: 'Google Search',
        tier: 'fallback',
        // Broad, unrestricted search (title + author-if-known + "manga read
        // online"), minus the known-junk domains above. Never limits results
        // to a fixed allowlist of sites -- see Step 1 in the upgrade plan.
        // meta.author is currently always undefined until Step 8 adds author
        // data to the item model; omitted gracefully until then.
        buildUrl: (title, meta = {}) => {
            const parts = [title];
            if (meta.author) parts.push(meta.author);
            parts.push('manga read online');
            const blocklist = GOOGLE_EXCLUDED_DOMAINS.map(d => `-site:${d}`).join(' ');
            const query = `${parts.join(' ')} ${blocklist}`;
            return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        }
    }
];
