// ==========================================
// CORE SEARCH ENGINE (js/search.js)
// ==========================================
import { db, doc, getDoc, setDoc, generateCacheKey } from './firebase.js';
import { parseSmartQuery } from './parser.js';
import { fetchFromAniListUnified } from './anilist.js';
import { suggestTitlesFromMangaDex, resolveReadLinks } from './mangadex.js';
import { renderMangaCard, renderDidYouMean, renderFallbackBanner, formatStatus } from './renderer.js';

let isSearching = false; 

export async function triggerSearch(rawQuery, page = 1) {
    if (!rawQuery || isSearching) return;
    
    isSearching = true;
    window.currentActiveQuery = rawQuery;
    window.currentActivePage = page;

    const grid = document.getElementById('community-grid');
    const loadingBar = document.getElementById('loading-bar');
    const refreshBtn = document.getElementById('refresh-btn');

    if (loadingBar) loadingBar.classList.add('is-loading');
    if (refreshBtn) refreshBtn.style.display = 'none';
    if (grid) grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Checking database...</p>';
    
    document.getElementById('results-area')?.scrollIntoView({ behavior: 'smooth' });

    try {
        const parsedQuery = parseSmartQuery(rawQuery);
        const cacheKey = generateCacheKey(rawQuery, page);
        let finalResults = [];
        let usedFallbackQuery = null;
        let suggestions = [];

        // 1. FIREBASE CACHE CHECK
        if (db) {
            try {
                const docSnap = await getDoc(doc(db, "searches", cacheKey));
                if (docSnap.exists()) finalResults = docSnap.data().results;
            } catch (e) { console.warn("Cache read skipped:", e); }
        }

        // 2. API FETCH IF NO CACHE
        if (finalResults.length === 0) {
            if (parsedQuery.isVibeOrTag) {
                // FIXED: Sequential fetching prevents AniList burst-rate limiting
                const korean = await fetchFromAniListUnified(parsedQuery, page, true, 5);
                const global = await fetchFromAniListUnified(parsedQuery, page, false, 5);
                
                finalResults = [...new Map([...korean, ...global].map(i => [i.id, i])).values()];
            } else {
                finalResults = await fetchFromAniListUnified(parsedQuery, page, false, 10);
            }

            // TYPO TOLERANCE FALLBACK
            if ((!finalResults || finalResults.length === 0) && !parsedQuery.isVibeOrTag && parsedQuery.cleanQuery.trim().length > 1) {
                suggestions = await suggestTitlesFromMangaDex(parsedQuery.cleanQuery);
                if (suggestions.length > 0) {
                    usedFallbackQuery = suggestions[0];
                    finalResults = await fetchFromAniListUnified(
                        { cleanQuery: usedFallbackQuery, statusFilter: parsedQuery.statusFilter, isVibeOrTag: false },
                        page, false, 10
                    );
                }
            }

            // CACHE SAVE
            if (db && finalResults.length > 0) {
                setDoc(doc(db, "searches", cacheKey), { results: finalResults }).catch(console.warn);
            }
        }

        // 3. RENDER RESULTS & RESOLVE LINKS
        grid.innerHTML = '';
        
        if (finalResults.length > 0) {
            const factSheets = await Promise.all(finalResults.map(async (aniManga) => {
                const title = aniManga.title.english || aniManga.title.romaji;
                const cleanSynopsis = aniManga.description ? aniManga.description.replace(/<[^>]*>?/gm, '') : "No synopsis available.";
                const generatedLinks = await resolveReadLinks(title);

                return {
                    id: aniManga.id,
                    title: title,
                    globalScore: aniManga.averageScore || "N/A",
                    rawGenres: aniManga.genres || [],
                    coverUrl: aniManga.coverImage?.large || "https://via.placeholder.com/220x300?text=No+Cover",
                    synopsis: cleanSynopsis,
                    status: formatStatus(aniManga.status),
                    chapters: aniManga.chapters ? `${aniManga.chapters} Chp.` : "N/A",
                    readLinks: generatedLinks
                };
            }));

            if (refreshBtn) refreshBtn.style.display = 'block';
            if (usedFallbackQuery) {
                renderFallbackBanner(rawQuery, usedFallbackQuery, suggestions.slice(1));
            }
            factSheets.forEach(renderMangaCard);

        } else if (suggestions.length > 0) {
            renderDidYouMean(rawQuery, suggestions);
        } else {
            grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">No official API data found. Try a different page or filter!</p>';
        }

    } catch (err) {
        console.error("Search failed:", err);
        if (grid) grid.innerHTML = '<p style="text-align:center; width:100%; color: #ef4444;">An error occurred connecting to the database.</p>';
    } finally {
        isSearching = false;
        if (loadingBar) loadingBar.classList.remove('is-loading');
    }
}
