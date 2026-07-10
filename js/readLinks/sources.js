// ==========================================
// READ-LINK SOURCE REGISTRY (js/readLinks/sources.js)
// ==========================================
// REVERTED: this used to also hold Manganato, Bato.to, and MangaPlus/Viz/
// Crunchyroll official-tier entries (Steps 2 & 7). Rolled back to just
// Google per a scope decision: MangaDex is the only source with a real
// search API to genuinely verify a title exists (stays in mangadex.js's
// resolveReadLinks(), NOT built from this registry); every guessed-URL
// source (Manganato/Bato.to) or scoped-search source with no real
// verification (MangaPlus) was cut rather than ship buttons that might be
// dead links. Comick.io and the Brave Search "unverified results" section
// were also removed in the same pass (no working Brave API key available).
//
// Read Now is now just: MangaDex (Verified, real existence check) + this
// file's single Google Search entry (always shown, no check needed since
// it's a search page, not a claimed direct link).
//
// Kept as a registry (rather than inlining Google directly into
// mangadex.js) since a data-driven single-entry list costs nothing and
// keeps the door open if a future source with a decent free tier and a
// guessable/checkable URL shows up again.

// Curated blocklist for the Google fallback query -- excludes domains that
// reliably do NOT host actual manga-reading pages (trackers/wikis/social/
// news), without narrowing the search to a fixed allowlist of sites.
const GOOGLE_EXCLUDED_DOMAINS = [
    'myanimelist.net', 'anilist.co', 'mangaupdates.com',
    'fandom.com', 'wikipedia.org',
    'reddit.com', 'twitter.com', 'x.com', 'facebook.com',
    'tiktok.com', 'quora.com',
    'animenewsnetwork.com', 'cbr.com', 'screenrant.com'
];

export const READ_LINK_SOURCES = [
    {
        id: 'google',
        name: 'Google Search',
        tier: 'fallback',
        // Broad, unrestricted search (title + author-if-known + "manga read
        // online"), minus the known-junk domains above. meta.author comes
        // from AniList staff data (Step 8) when available.
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
