// ==========================================
// MangaMood Configuration
// ==========================================

export const CONFIG = {

    APP_NAME: "MangaMood",

    VERSION: "2.0",

    SEARCH_LIMIT: 10, 

    CACHE_EXPIRY: 24 * 60 * 60 * 1000,

    REQUEST_TIMEOUT: 8000,

    RETRY_COUNT: 3,

    VIBE_ROTATION_TIME: 30000,
    SEARCH_ENGINE_URL: 'https://uvperhzhnosjtkwxxnte.supabase.co/functions/v1/search',

    IMAGE_FALLBACK:
        "images/no-cover.png",

    ANILIST_URL:
        "https://graphql.anilist.co",

    JIKAN_URL:
        "https://api.jikan.moe/v4",

    // NEW: Added Kitsu so kitsu.js knows where to connect
    KITSU_URL:
        "https://kitsu.io/api/edge",

    MANGADEX_API:
        "https://api.mangadex.org",

    MANGADEX_COVER:
        "https://uploads.mangadex.org/covers"

};
