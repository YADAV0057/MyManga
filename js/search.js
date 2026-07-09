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

// STEP 3: powers the "Finish tonight / Long binge / Completed" quick filter
// chips, which previously had no click handler at all. These aren't genre
// searches — they're a plain popularity browse (buildPlanFromGenreList with
// no genres) with either a chapter-count bound or an AniList status filter
// layered on top. rawQuery is left blank so this reuses the exact same
// runSearch pipeline (grid render, loading bar, refresh button) without
// triggering the AI Search Intelligence panel, which is reserved for real
// typed/mood queries.
const QUICK_FILTER_LABELS = {
    'finish-tonight': '🔁 Finish Tonight',
    'long-binge': '📚 Long Binge',
    'completed': '✅ Completed Series'
};

export async function triggerQuickFilter(type) {
    const plan = buildPlanFromGenreList([]);

    if (type === 'finish-tonight') {
        plan.filters.maxChapters = 40;
    } else if (type === 'long-binge') {
        plan.filters.minChapters = 200;
    } else if (type === 'completed') {
        plan.filters.statusFilter = 'FINISHED';
    }

    const title = document.getElementById('results-title');
    if (title) title.textContent = `✨ ${QUICK_FILTER_LABELS[type] || 'Results'}`;

    const intent = buildPresetIntent('', plan);
    return runSearch('', 1, intent, plan);
}

// STEP 7a: appendMode powers the results page's "Next Page" button (added in
// 7c) — false (default) keeps every existing call site's behavior (homepage
// grid, quick filters, mixer) exactly as it was: clear the grid, show
// skeletons, replace with the new page of results. true is the new path:
// don't touch anything already in the grid, don't show skeletons, just fetch
// and append the next page on top of what's already rendered.
export async function triggerSearch(rawQuery, page = 1, appendMode = false) {
    if (rawQuery === undefined || rawQuery === null) return;
    const intent = buildIntent(rawQuery);
    return runSearch(rawQuery, page, intent, buildSearchPlan(intent), appendMode);
}

// STEP 7a: PAGE_SIZE was 5 (x2 for genre searches' korean+global split) / 10
// (non-genre and every fallback tier) — fine for a homepage teaser grid, too
// thin for a real paginated results page where "Next Page" needs a
// meaningfully bigger batch each time. Bumped so every fetch tier requests a
// full page's worth up front.
const PAGE_SIZE = 24;
const GENRE_SPLIT_SIZE = 12; // per bucket (korean + global), sums to PAGE_SIZE

async function runSearch(rawQuery, page, intent, plan, appendMode = false) {
    if (isSearching) return;
    isSearching = true;

    window.currentActiveQuery = rawQuery;
    window.currentActivePage = page;

    const grid = document.getElementById('community-grid');
    const loadingBar = document.getElementById('loading-bar');
    const refreshBtn = document.getElementById('refresh-btn');

    loadingBar.classList.add('is-loading');

    // STEP 7a: in append mode the grid already holds the previous page's
    // cards — leave them alone. Only a fresh (non-append) search resets the
    // view: hides the refresh button, wipes the grid for skeletons, and
    // scrolls the results area into view.
    if (!appendMode) {
        refreshBtn.style.display = 'none';
        renderSkeletonLoaders(15);
        document.getElementById('results-area').scrollIntoView({ behavior: 'smooth' });
    }

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
                    fetchFromAniListUnified(plan, page, true, GENRE_SPLIT_SIZE),
                    fetchFromAniListUnified(plan, page, false, GENRE_SPLIT_SIZE)
                ]);
                finalResults = [...koreanResults, ...globalResults];
                finalResults = Array.from(new Map(finalResults.map(item => [item.id, item])).values());
            } else {
                finalResults = await fetchFromAniListUnified(plan, page, false, PAGE_SIZE);
            }
            if (hasQuery) setApiTierStatus('anilist', (finalResults && finalResults.length > 0) ? 'success' : 'fail');

            if (!finalResults || finalResults.length === 0) {
                dataSource = "jikan";
                if (hasQuery) setApiTierStatus('jikan', 'pending');
                try {
                    finalResults = await fetchFromJikanFallback(plan, page, PAGE_SIZE);
                    if (hasQuery) setApiTierStatus('jikan', (finalResults && finalResults.length > 0) ? 'success' : 'fail');
                } catch (e) {
                    if (hasQuery) setApiTierStatus('jikan', 'fail');
                }
            } else if (hasQuery) setApiTierStatus('jikan', 'skip');

            if (!finalResults || finalResults.length === 0) {
                dataSource = "kitsu";
                if (hasQuery) setApiTierStatus('kitsu', 'pending');
                try {
                    finalResults = await fetchFromKitsuFallback(plan, page, PAGE_SIZE);
                    if (hasQuery) setApiTierStatus('kitsu', (finalResults && finalResults.length > 0) ? 'success' : 'fail');
                } catch (e) {
                    if (hasQuery) setApiTierStatus('kitsu', 'fail');
                }
            } else if (hasQuery) setApiTierStatus('kitsu', 'skip');

            if (!finalResults || finalResults.length === 0) {
                dataSource = "mangadex";
                if (hasQuery) setApiTierStatus('mangadex', 'pending');
                try {
                    finalResults = await fetchFromMangaDexFallback(plan, page, PAGE_SIZE);
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

        // STEP 3: was maxChapters-only (used by the NLU parser's "short"
        // detection). Quick filter chips need a minChapters side too (for
        // "Long binge"), so this now checks both bounds in one pass.
        if (plan.filters?.maxChapters || plan.filters?.minChapters) {
            finalResults = (finalResults || []).filter(m => {
                const ch = typeof m.chapters === 'number' ? m.chapters : parseInt(m.chapters, 10);
                if (ch === undefined || ch === null || isNaN(ch)) return true; // unknown count — don't hide it
                if (plan.filters.maxChapters && ch > plan.filters.maxChapters) return false;
                if (plan.filters.minChapters && ch < plan.filters.minChapters) return false;
                return true;
            });
        }

        if (!finalResults || finalResults.length === 0) {
            // STEP 7a: in append mode this just means "no more pages" — the
            // grid already has real results from earlier pages, so don't
            // wipe it or show the did-you-mean/empty-state UI meant for a
            // brand-new, zero-result search. Just report back that there's
            // nothing further to append (7c's Next Page button uses this).
            if (appendMode) {
                return { appended: 0, hasMore: false };
            }

            if (hasQuery) { await finishAnimation(0); settlePanel(intent); }
            let suggestions = [];
            if (plan.cleanQuery && plan.cleanQuery.length > 0) {
                try { suggestions = await suggestTitlesFromMangaDex(plan.cleanQuery, 5); } 
                catch (e) { console.warn("Did-you-mean lookup failed:", e); }
            }
            grid.innerHTML = '';
            if (suggestions.length > 0) renderDidYouMean(rawQuery, suggestions);
            else grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">No official API data found!</p>';
            return { appended: 0, hasMore: false };
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

        // STEP 7a: append mode leaves whatever's already in the grid and
        // just renders the new page's cards after it. Non-append keeps the
        // original replace behavior (clear grid, show the shuffle/refresh
        // button, render fresh).
        if (!appendMode) {
            grid.innerHTML = '';
            refreshBtn.style.display = 'block';
        }
        factSheets.forEach(renderMangaCard);

        // STEP 7a: hasMore is a heuristic, not a real API total — we treat a
        // full-size page as "there's probably another page" and a
        // short/partial page as "that was the last one". Good enough for a
        // Next Page button to know whether to keep itself enabled (7c).
        return { appended: factSheets.length, hasMore: factSheets.length >= PAGE_SIZE };

    } catch (error) {
        console.error("Aggregation Error:", error);
        if (!appendMode) {
            grid.innerHTML = '<p style="text-align:center; width:100%; color: #ef4444;">An error occurred.</p>';
        }
        return { appended: 0, hasMore: false, error: true };
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

// ==========================================
// LANDING PAGE (Trending Today + Hidden Gems)
// ==========================================
// Fully isolated in ./landing/ — fetching, caching, rendering, styling,
// and DOM wiring all live there. See landing/README.md for how to
// diagnose or disable this feature without touching anything else here.
import './landing/index.js';






