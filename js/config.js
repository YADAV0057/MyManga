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

    // Movie search engine (Supabase Edge Function `movie-search`, deployed
    // v7 as of 2026-07-29 — see Notion "Backend Update List — search engine"
    // Entry 96-99). Unlike manga's `search` function, `movie-search` has
    // verify_jwt: true, so every call MUST send an Authorization header —
    // see MOVIE_SEARCH_ANON_KEY below. This is the project's public anon
    // key (safe to ship client-side, same as any Supabase anon/publishable
    // key), not a secret.
    MOVIE_SEARCH_ENGINE_URL: 'https://uvperhzhnosjtkwxxnte.supabase.co/functions/v1/movie-search',
    MOVIE_SEARCH_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cGVyaHpobm9zanRrd3h4bnRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NjQ2NzMsImV4cCI6MjA5OTQ0MDY3M30.oq8MY6Z6QrdWAL8djO0TtuUbDQbKLng6AC7kZRAB2zk',

    // TMDB image CDN — poster_path/backdrop_path from movie-search's
    // response are relative paths (e.g. "/abc123.jpg"), not full URLs.
    // w500 is a good card-poster size; w1280 for backdrops/hero use.
    TMDB_POSTER_BASE: 'https://image.tmdb.org/t/p/w500',
    TMDB_BACKDROP_BASE: 'https://image.tmdb.org/t/p/w1280',
    TMDB_POSTER_FALLBACK: 'images/no-poster.png',

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


