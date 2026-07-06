// ==========================================
// KITSU FALLBACK ENGINE (js/kitsu.js) 
// ==========================================
import { CONFIG } from './config.js';

const KITSU_STATUS_MAP = {
    'current': 'RELEASING', 
    'finished': 'FINISHED',
    'tba': 'NOT_YET_RELEASED',
    'unreleased': 'NOT_YET_RELEASED', 
    'upcoming': 'NOT_YET_RELEASED'
};

const STATUS_TO_KITSU = {
    FINISHED: 'finished',
    RELEASING: 'current',
    NOT_YET_RELEASED: 'upcoming'
};

export async function fetchFromKitsuFallback(parsedData, page = 1, limit = 10) {
    const params = new URLSearchParams();
    
    const offset = (page - 1) * limit;
    params.set('page[limit]', limit);
    params.set('page[offset]', offset);
    params.set('sort', '-userCount');

    if (parsedData.isVibeOrTag) {
        const categories = parsedData.cleanQuery
            .split(',')
            .map(g => g.trim().toLowerCase())
            .filter(Boolean);
        if (categories.length > 0) {
            params.set('filter[categories]', categories.join(','));
        }
    } else if (parsedData.cleanQuery && parsedData.cleanQuery.length > 0) {
        params.set('filter[text]', parsedData.cleanQuery);
    }

    if (parsedData.statusFilter && STATUS_TO_KITSU[parsedData.statusFilter]) {
        params.set('filter[status]', STATUS_TO_KITSU[parsedData.statusFilter]);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
        const response = await fetch(`${CONFIG.KITSU_URL}/manga?${params.toString()}`, {
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            },
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) {
            console.error(`Kitsu API returned HTTP ${response.status}`);
            return [];
        }

        const data = await response.json();
        if (!data.data || !Array.isArray(data.data)) return [];

        return data.data.map(m => {
            const attr = m.attributes;
            return {
                id: `kitsu-${m.id}`,
                title: { 
                    romaji: attr.titles.en_jp || attr.canonicalTitle, 
                    english: attr.titles.en || attr.titles.en_us || attr.canonicalTitle 
                },
                averageScore: attr.averageRating ? Math.round(parseFloat(attr.averageRating)) : null,
                genres: ["Check MangaDex"], 
                description: attr.synopsis || null,
                coverImage: { large: attr.posterImage?.large || attr.posterImage?.original || null },
                chapters: attr.chapterCount || null,
                status: KITSU_STATUS_MAP[attr.status] || attr.status
            };
        });
    } catch (error) {
        clearTimeout(timeout);
        console.error("Kitsu API Error:", error);
        return [];
    }
}

