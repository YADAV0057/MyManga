// ==========================================
// MANGADEX API RESOLVER (js/mangadex.js)
// ==========================================

export async function resolveReadLinks(title) {
    const encodedTitle = encodeURIComponent(title);
    let validLinks = [];

    // MangaDex API is generally fast, but we add a 3-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const mdRes = await fetch(`https://api.mangadex.org/manga?title=${encodedTitle}&limit=1`, {
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (mdRes.ok) {
            const mdData = await mdRes.json();
            if (mdData.data && mdData.data.length > 0) {
                validLinks.push({
                    name: "📖 MangaDex (Verified)",
                    url: `https://mangadex.org/title/${mdData.data[0].id}`,
                    isValidated: true
                });
            }
        }
    } catch (e) {
        // Silently fail to fallback links if API is down or blocked
        console.warn("MangaDex link resolution skipped for:", title);
    }

    // Mandatory Search Fallback
    validLinks.push({
        name: "🌐 Google Search",
        url: `https://www.google.com/search?q=Read+${encodedTitle}+manga+online`,
        isValidated: false
    });

    return validLinks;
}

export async function suggestTitlesFromMangaDex(query, limit = 5) {
    if (!query || query.length < 2) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const res = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=${limit}`, {
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
