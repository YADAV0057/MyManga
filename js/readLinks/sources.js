// ==========================================
// READ-LINK SOURCE REGISTRY (js/readLinks/sources.js)
// ==========================================
// Data-driven registry of fallback "Read Now" link sources (Manganato,
// Bato.to, Google) plus, as of Step 7, official/licensed-source buttons.
// Adding or removing a source later is now a one-line change here instead
// of editing getFallbackLinks()/resolveReadLinks() in mangadex.js directly.
//
// Each entry: { id, name, buildUrl(title, meta = {}), tier: 'verified'|'fallback'|'official' }
// 'fallback' entries are instant, no-network, guessed-URL sources.
// 'official' entries (Step 7) are also instant/no-network, but scope a
// Google search to a single licensed domain instead of guessing that
// site's own search URL -- MangaPlus/Viz/Crunchyroll don't have a simple
// `?search=title` pattern the way Manganato/Bato.to do. 'verified' sources
// (MangaDex, Comick) require a real async API lookup, so they are NOT
// built from this registry -- they stay in mangadex.js's resolveReadLinks().
// getFallbackLinks() in mangadex.js iterates this whole array regardless
// of tier, so official entries render as buttons with no further wiring.
//
// No behavior change vs. the previous hardcoded list, other than the
// richer Google query already approved in Step 1 below. See
// READLINKS_UPGRADE_PLAN.md, Steps 1, 2 & 7.

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

// Factory for Step 7's official-source entries: a Google search scoped to
// exactly one licensed domain (`site:domain "title"`), quoting the title
// for a tighter match since -- unlike the broad Step 1 Google entry --
// precision matters more here than casting a wide net. No blocklist
// needed: a positive site: filter already excludes everything else.
function buildOfficialUrl(id, name, domain) {
    return {
        id,
        name,
        tier: 'official',
        buildUrl: (title) => `https://www.google.com/search?q=${encodeURIComponent(`site:${domain} "${title}"`)}`
    };
}

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
    },
    // ---- Step 7: official/licensed sources ----
    // Only sources with a genuinely free (or near-fully-free) reading tier
    // qualify here -- this is meant to give users a legit *free* option,
    // not just a legit option. Viz and Crunchyroll Manga were removed:
    // Viz only frees the latest ~3-5 chapters and paywalls the rest behind
    // a paid membership; Crunchyroll Manga requires an active Crunchyroll
    // Premium subscription to read anything at all. MangaPlus is
    // predominantly free/ad-supported (many full series free indefinitely)
    // so it stays. No guessable `?search=title` URL exists for it, so a
    // domain-scoped Google search (buildOfficialUrl) is still the right
    // tool -- see the "rejected" section of the plan for why this approach
    // is NOT used for Manganato/Bato/Comick.
    buildOfficialUrl('mangaplus', 'MangaPlus', 'mangaplus.shueisha.co.jp')
];
