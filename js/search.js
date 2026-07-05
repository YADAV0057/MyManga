// ==========================================
// SEARCH / AGGREGATION ENGINE (js/search.js)
// ==========================================
import { db, doc, getDoc, setDoc, generateCacheKey } from './firebase.js';
import { parseSmartQuery, fetchFromAniListUnified } from './anilist.js';
import { fetchFromJikanFallback } from './jikan.js';
import { resolveReadLinks, suggestTitlesFromMangaDex } from './mangadex.js';
import { renderMangaCard, formatStatus, renderDidYouMean } from './renderer.js'; 

let isSearching = false;

export async function triggerSearch(rawQuery, page = 1) {
    // Allow an empty string through (used for the default "browse popular" load)
    if (rawQuery === undefined || rawQuery === null) return;
    if (isSearching) return;
    isSearching = true;

    window.currentActiveQuery = rawQuery;
    window.currentActivePage = page;

    const grid = document.getElementById('community-grid');
    const loadingBar = document.getElementById('loading-bar');
    const refreshBtn = document.getElementById('refresh-btn');

    loadingBar.classList.add('is-loading');
    refreshBtn.style.display = 'none';
    grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Checking database...</p>';
    document.getElementById('results-area').scrollIntoView({ behavior: 'smooth' });

    try {
        const parsedQuery = parseSmartQuery(rawQuery);
        const cacheKey = generateCacheKey(rawQuery, page);
        let finalResults = [];

        let docSnap = null;
        if (db) {
            try {
                const docRef = doc(db, "searches", cacheKey);
                docSnap = await getDoc(docRef);
            } catch (e) {
                console.warn("Firestore read failed, falling back to live API:", e);
            }
        }

        if (docSnap && docSnap.exists()) {
            console.log("Loaded from Firebase cache.");
            finalResults = docSnap.data().results;
        } else {
            console.log("Not in cache (or cache unavailable). Fetching from APIs...");
            grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Curating fresh metadata...</p>';

            if (parsedQuery.isVibeOrTag) {
                const [koreanResults, globalResults] = await Promise.all([
                    fetchFromAniListUnified(parsedQuery, page, true, 5),
                    fetchFromAniListUnified(parsedQuery, page, false, 5)
                ]);
                finalResults = [...koreanResults, ...globalResults];
                finalResults = Array.from(new Map(finalResults.map(item => [item.id, item])).values());
            } else {
                finalResults = await fetchFromAniListUnified(parsedQuery, page, false, 10);
            }

            // AniList came back empty — could be a real "no matches," but it's also
            // exactly what happens when AniList is down, rate-limited, or blocking
            // this IP. Try Jikan (MyAnimeList) as a second source before giving up.
            let usedFallback = false;
            if (!finalResults || finalResults.length === 0) {
                console.log("AniList returned nothing, trying Jikan fallback...");
                try {
                    finalResults = await fetchFromJikanFallback(parsedQuery, page, 10);
                    usedFallback = finalResults.length > 0;
                } catch (e) {
                    console.warn("Jikan fallback failed:", e);
                }
            }

            if (db && finalResults && finalResults.length > 0 && !usedFallback) {
                try {
                    const docRef = doc(db, "searches", cacheKey);
                    await setDoc(docRef, { results: finalResults });
                } catch (e) {
                    console.warn("Firestore write failed (results still shown to user):", e);
                }
            }
        }

        if (!finalResults || finalResults.length === 0) {
            // Try to recover with "Did you mean" suggestions from MangaDex before giving up.
            let suggestions = [];
            if (parsedQuery.cleanQuery && parsedQuery.cleanQuery.length > 0) {
                try {
                    suggestions = await suggestTitlesFromMangaDex(parsedQuery.cleanQuery, 5);
                } catch (e) {
                    console.warn("Did-you-mean suggestion lookup failed:", e);
                }
            }

            grid.innerHTML = '';
            if (suggestions.length > 0) {
                renderDidYouMean(rawQuery, suggestions);
            } else {
                grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">No official API data found for this search. Try a different page or filter!</p>';
            }
            return;
        }

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

        grid.innerHTML = '';
        refreshBtn.style.display = 'block';
        factSheets.forEach(renderMangaCard);

    } catch (error) {
        console.error("Aggregation Error:", error);
        grid.innerHTML = '<p style="text-align:center; width:100%; color: #ef4444;">An error occurred connecting to the database.</p>';
    } finally {
        loadingBar.classList.remove('is-loading');
        isSearching = false;
    }
}
