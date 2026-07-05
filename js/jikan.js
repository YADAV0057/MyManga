
// ==========================================
// JIKAN (MyAnimeList) FALLBACK ENGINE (js/jikan.js) 
// ==========================================
// Used only when AniList returns nothing (blocked, rate-limited, or down).
// Normalizes results into the same shape as AniList media objects so
// search.js / renderer.js don't need to know which source they came from.

// Verified directly against https://api.jikan.moe/v4/genres/manga
// Keys are pre-normalized (lowercase, spaces/hyphens stripped) to match how
// fetchFromJikanFallback() normalizes incoming genre names below. 
const GENRE_ID_MAP = {
    action: 1,
    adventure: 2,
    comedy: 4,
    drama: 8,
    fantasy: 10,
    horror: 14,
    mystery: 7,
    psychological: 40,
    romance: 22,
    scifi: 24,
    sliceoflife: 36,
    sports: 30,
    supernatural: 37,
    // MAL's manga genre list has no "Thriller" — "Suspense" is the closest equivalent
    thriller: 45,
    mecha: 18,
    music: 19,
    mahoushoujo: 66
};

const STATUS_TO_JIKAN = {
    FINISHED: 'complete',
    RELEASING: 'publishing',
    HIATUS: 'hiatus',
    CANCELLED: 'discontinued'
};

const JIKAN_STATUS_TO_INTERNAL = {
    'Publishing': 'RELEASING',
    'Finished': 'FINISHED',
    'On Hiatus': 'HIATUS',
    'Discontinued': 'CANCELLED',
    'Not yet published': 'NOT_YET_RELEASED'
};

export async function fetchFromJikanFallback(parsedData, page = 1, limit = 10) {
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', Math.min(limit, 25));
    params.set('order_by', 'popularity');
    params.set('sort', 'asc'); // lower popularity rank = more popular on Jikan

    if (parsedData.isVibeOrTag) {
        const ids = parsedData.cleanQuery
            .split(',')
            .map(g => g.trim().toLowerCase().replace(/[^a-z]/g, ''))
            .map(g => GENRE_ID_MAP[g])
            .filter(Boolean);
        if (ids.length > 0) params.set('genres', ids.join(','));
    } else if (parsedData.cleanQuery && parsedData.cleanQuery.length > 0) {
        params.set('q', parsedData.cleanQuery);
    }

    if (parsedData.statusFilter && STATUS_TO_JIKAN[parsedData.statusFilter]) {
        params.set('status', STATUS_TO_JIKAN[parsedData.statusFilter]);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
        const response = await fetch(`https://api.jikan.moe/v4/manga?${params.toString()}`, {
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            console.error(`Jikan API returned HTTP ${response.status}`);
            return [];
        }

        const data = await response.json();
        if (!data.data || !Array.isArray(data.data)) return [];

        return data.data.map(m => ({
            id: `jikan-${m.mal_id}`,
            title: { romaji: m.title, english: m.title_english || m.title },
            averageScore: m.score ? Math.round(m.score * 10) : null,
            genres: (m.genres || []).map(g => g.name),
            description: m.synopsis || null,
            coverImage: { large: m.images?.jpg?.large_image_url || m.images?.jpg?.image_url || null },
            chapters: m.chapters || null,
            status: JIKAN_STATUS_TO_INTERNAL[m.status] || m.status
        }));
    } catch (error) {
        clearTimeout(timeout);
        console.error("Jikan API Error:", error);
        return [];
    }
}
