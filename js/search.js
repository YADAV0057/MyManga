 
// ==========================================
// SEARCH / AGGREGATION ENGINE (js/search.js)
// ==========================================
import { db, doc, getDoc, setDoc, generateCacheKey } from './firebase.js';
import { parseSmartQuery, fetchFromAniListUnified } from './anilist.js';
import { fetchFromJikanFallback } from './jikan.js';
import { fetchFromKitsuFallback } from './kitsu.js';
import { fetchFromMangaDexFallback, resolveReadLinks, suggestTitlesFromMangaDex } from './mangadex.js'; 
import { renderMangaCard, formatStatus, renderDidYouMean } from './renderer.js';  
import { CONFIG } from './config.js'; // Ensure CONFIG is imported for IMAGE_FALLBACK

let isSearching = false;

export async function triggerSearch(rawQuery, page = 1) {
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
    
    // NEW: Instantly inject 15 shimmering skeleton cards while we wait!
    renderSkeletonLoaders(15);
    document.getElementById('results-area').scrollIntoView({ behavior: 'smooth' });

    try {
        const parsedQuery = parseSmartQuery(rawQuery);
        const cacheKey = generateCacheKey(rawQuery, page);
        let finalResults = [];
        let dataSource = "cache"; 

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
            console.log("Not in cache. Beginning API Waterfall...");

            // TIER 1: AniList
            dataSource = "anilist";
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

            // TIER 2: Jikan (MAL) Fallback
            if (!finalResults || finalResults.length === 0) {
                console.log("AniList failed. Trying Jikan...");
                dataSource = "jikan";
                try { finalResults = await fetchFromJikanFallback(parsedQuery, page, 10); } 
                catch (e) { console.warn("Jikan failed:", e); }
            }

            // TIER 3: Kitsu Fallback
            if (!finalResults || finalResults.length === 0) {
                console.log("Jikan failed. Trying Kitsu...");
                dataSource = "kitsu";
                try { finalResults = await fetchFromKitsuFallback(parsedQuery, page, 10); } 
                catch (e) { console.warn("Kitsu failed:", e); }
            }

            // TIER 4: MangaDex Fallback 
            if (!finalResults || finalResults.length === 0) {
                console.log("Kitsu failed. Trying MangaDex...");
                dataSource = "mangadex";
                try { finalResults = await fetchFromMangaDexFallback(parsedQuery, page, 10); } 
                catch (e) { console.warn("MangaDex failed:", e); }
            }

            // CACHE SAVE: Only save Tier 1 (AniList) data to Firebase to keep cache clean
            if (db && finalResults && finalResults.length > 0 && dataSource === "anilist") {
                try {
                    const docRef = doc(db, "searches", cacheKey);
                    await setDoc(docRef, { results: finalResults });
                } catch (e) { console.warn("Firestore write failed:", e); }
            }
        }

        if (!finalResults || finalResults.length === 0) {
            let suggestions = [];
            if (parsedQuery.cleanQuery && parsedQuery.cleanQuery.length > 0) {
                try { suggestions = await suggestTitlesFromMangaDex(parsedQuery.cleanQuery, 5); } 
                catch (e) { console.warn("Did-you-mean lookup failed:", e); }
            }

            grid.innerHTML = '';
            if (suggestions.length > 0) {
                renderDidYouMean(rawQuery, suggestions);
            } else {
                grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">No official API data found for this search. All fallbacks exhausted!</p>';
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
                coverUrl: aniManga.coverImage?.large || CONFIG.IMAGE_FALLBACK,
                synopsis: cleanSynopsis,
                status: formatStatus(aniManga.status),
                chapters: aniManga.chapters ? `${aniManga.chapters} Chp.` : "N/A",
                readLinks: generatedLinks
            };
        }));

        grid.innerHTML = ''; // Clears the skeletons before rendering real cards
        refreshBtn.style.display = 'block';
        factSheets.forEach(renderMangaCard);

    } catch (error) {
        console.error("Aggregation Error:", error);
        grid.innerHTML = '<p style="text-align:center; width:100%; color: #ef4444;">An error occurred connecting to the databases.</p>';
    } finally {
        loadingBar.classList.remove('is-loading');
        isSearching = false;
    }
}

// ==========================================
// SKELETON LOADER UI
// ==========================================
export function renderSkeletonLoaders(count = 15) {
    const grid = document.getElementById('community-grid');
    if (!grid) return;
    
    let skeletonHTML = '';
    for (let i = 0; i < count; i++) {
        skeletonHTML += `
            <div class="skeleton-card">
                <div class="skeleton-cover"></div>
                <div class="skeleton-info">
                    <div class="skeleton-line skeleton-title"></div>
                    <div class="skeleton-line skeleton-meta" style="margin-top: 5px; margin-bottom: 12px;"></div>
                    <div class="skeleton-line skeleton-text"></div>
                    <div class="skeleton-line skeleton-text"></div>
                    <div class="skeleton-line skeleton-text-short"></div>
                </div>
            </div>
        `;
    }
    grid.innerHTML = skeletonHTML;
}
