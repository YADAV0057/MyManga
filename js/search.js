// ==========================================
// SEARCH / AGGREGATION ENGINE (js/search.js)
// ==========================================
import { db, doc, getDoc, setDoc, generateCacheKey } from './firebase.js';
import { buildIntent } from './parser/pipeline.js';
import { MangaIntent } from './parser/intentSchema.js';
import { buildSearchPlan, buildPlanFromGenreList } from './parser/searchPlanner.js';
import { fetchFromAniListUnified } from './anilist.js';
import { fetchFromJikanFallback } from './jikan.js';
import { fetchFromKitsuFallback } from './kitsu.js';
import { fetchFromMangaDexFallback, resolveReadLinks, getFallbackLinks, suggestTitlesFromMangaDex } from './mangadex.js'; 
import { renderMangaCard, renderDidYouMean } from './renderer.js';  
import { normalizeResult } from './resultNormalizer.js';
import { scoreResults } from './parser/recommendationScorer.js';
import { runIntentAnimation, setApiTierStatus, finishAnimation, settlePanel, hideAIPanel } from './aiPanel.js';
import { CONCEPT_PROPERTIES } from './parser/dictionary/properties.js';

let CONCEPT_DICTIONARY = { ...CONCEPT_PROPERTIES };
const dictionaryLoadPromise = (async () => {
    try {
        const mod = await import('./parser/dictionary/harvested_knowledge.js');
        CONCEPT_DICTIONARY = { ...mod.HARVESTED_RULES, ...CONCEPT_PROPERTIES }; 
    } catch (e) {
        console.warn('[search.js] harvested_knowledge.js not available, using base properties.', e.message);
    }
})();

let isSearching = false;

const SOURCE_LABELS = {
    anilist: 'AniList',
    jikan: 'Jikan',
    kitsu: 'Kitsu',
    mangadex: 'MangaDex',
    cache: 'AniList (cached)'
};

function buildPresetIntent(genreQuery, plan) {
    const intent = new MangaIntent();
    intent.originalQuery = genreQuery;
    intent.confidence = 1.0;
    intent.genres = plan.primaryGenres.map(name => ({ name, confidence: 1.0 }));
    return intent;
}

export async function triggerPresetSearch(genreQuery, page = 1) {
    const plan = buildPlanFromGenreList(genreQuery);
    return runSearch(genreQuery, page, buildPresetIntent(genreQuery, plan), plan);
}

export async function triggerSearch(rawQuery, page = 1) {
    if (rawQuery === undefined || rawQuery === null) return;
    const intent = buildIntent(rawQuery);
    return runSearch(rawQuery, page, intent, buildSearchPlan(intent));
}

async function runSearch(rawQuery, page, intent, plan) {
    if (isSearching) return;
    isSearching = true;

    window.currentActiveQuery = rawQuery;
    window.currentActivePage = page;

    const grid = document.getElementById('community-grid');
    const loadingBar = document.getElementById('loading-bar');
    const refreshBtn = document.getElementById('refresh-btn');

    loadingBar.classList.add('is-loading');
    refreshBtn.style.display = 'none';
    
    renderSkeletonLoaders(15);
    document.getElementById('results-area').scrollIntoView({ behavior: 'smooth' });

    const hasQuery = typeof rawQuery === 'string' && rawQuery.trim().length > 0;
    const isGenreSearch = (plan.primaryGenres.length + plan.secondaryThemes.length) > 0;

    try {
        if (hasQuery) {
            await runIntentAnimation(intent);
        } else {
            hideAIPanel();
        }

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
            if (hasQuery) setApiTierStatus('cache', 'success');
        } else {
            dataSource = "anilist";
            if (hasQuery) setApiTierStatus('anilist', 'pending');
            if (isGenreSearch) {
                const [koreanResults, globalResults] = await Promise.all([
                    fetchFromAniListUnified(plan, page, true, 5),
                    fetchFromAniListUnified(plan, page, false, 5)
                ]);
                finalResults = [...koreanResults, ...globalResults];
                finalResults = Array.from(new Map(finalResults.map(item => [item.id, item])).values());
            } else {
                finalResults = await fetchFromAniListUnified(plan, page, false, 10);
            }
            if (hasQuery) setApiTierStatus('anilist', (finalResults && finalResults.length > 0) ? 'success' : 'fail');

            if (!finalResults || finalResults.length === 0) {
                dataSource = "jikan";
                if (hasQuery) setApiTierStatus('jikan', 'pending');
                try {
                    finalResults = await fetchFromJikanFallback(plan, page, 10);
                    if (hasQuery) setApiTierStatus('jikan', (finalResults && finalResults.length > 0) ? 'success' : 'fail');
                } catch (e) {
                    if (hasQuery) setApiTierStatus('jikan', 'fail');
                }
            } else if (hasQuery) setApiTierStatus('jikan', 'skip');

            if (!finalResults || finalResults.length === 0) {
                dataSource = "kitsu";
                if (hasQuery) setApiTierStatus('kitsu', 'pending');
                try {
                    finalResults = await fetchFromKitsuFallback(plan, page, 10);
                    if (hasQuery) setApiTierStatus('kitsu', (finalResults && finalResults.length > 0) ? 'success' : 'fail');
                } catch (e) {
                    if (hasQuery) setApiTierStatus('kitsu', 'fail');
                }
            } else if (hasQuery) setApiTierStatus('kitsu', 'skip');

            if (!finalResults || finalResults.length === 0) {
                dataSource = "mangadex";
                if (hasQuery) setApiTierStatus('mangadex', 'pending');
                try {
                    finalResults = await fetchFromMangaDexFallback(plan, page, 10);
                    if (hasQuery) setApiTierStatus('mangadex', (finalResults && finalResults.length > 0) ? 'success' : 'fail');
                } catch (e) {
                    if (hasQuery) setApiTierStatus('mangadex', 'fail');
                }
            } else if (hasQuery) setApiTierStatus('mangadex', 'skip');

            if (db && finalResults && finalResults.length > 0 && dataSource !== "cache") {
                try {
                    const docRef = doc(db, "searches", cacheKey);
                    await setDoc(docRef, { results: finalResults });
                } catch (e) { console.warn("Firestore write failed:", e); }
            }
        }

        if (plan.filters?.maxChapters) {
            finalResults = (finalResults || []).filter(m => {
                const ch = typeof m.chapters === 'number' ? m.chapters : parseInt(m.chapters, 10);
                return !ch || isNaN(ch) || ch <= plan.filters.maxChapters;
            });
        }

        if (!finalResults || finalResults.length === 0) {
            if (hasQuery) { await finishAnimation(0); settlePanel(intent); }
            let suggestions = [];
            if (plan.cleanQuery && plan.cleanQuery.length > 0) {
                try { suggestions = await suggestTitlesFromMangaDex(plan.cleanQuery, 5); } 
                catch (e) { console.warn("Did-you-mean lookup failed:", e); }
            }
            grid.innerHTML = '';
            if (suggestions.length > 0) renderDidYouMean(rawQuery, suggestions);
            else grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">No official API data found!</p>';
            return;
        }

        const unifiedResults = finalResults.map(aniManga =>
            normalizeResult(aniManga, SOURCE_LABELS[dataSource] || dataSource)
        );

        await dictionaryLoadPromise;
        const scored = await scoreResults(unifiedResults, intent, plan, CONCEPT_DICTIONARY);

        const factSheets = await Promise.all(scored.map(async (unified) => {
            const generatedLinks = await Promise.race([
                resolveReadLinks(unified.title).catch(() => getFallbackLinks(unified.title)),
                new Promise(resolve => setTimeout(() => resolve(getFallbackLinks(unified.title)), 700))
            ]);
            return { ...unified, readLinks: generatedLinks };
        }));

        if (hasQuery) {
            await finishAnimation(factSheets.length);
            settlePanel(intent);
        }

        grid.innerHTML = '';
        refreshBtn.style.display = 'block';
        factSheets.forEach(renderMangaCard);

    } catch (error) {
        console.error("Aggregation Error:", error);
        grid.innerHTML = '<p style="text-align:center; width:100%; color: #ef4444;">An error occurred.</p>';
    } finally {
        loadingBar.classList.remove('is-loading');
        isSearching = false;
    }
}

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
