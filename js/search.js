 
// ==========================================
// SEARCH / AGGREGATION ENGINE (js/search.js)
// ==========================================
// CHANGED: now runs the advanced NLU pipeline (js/parser/pipeline.js ->
// js/parser/searchPlanner.js) instead of the simple parseSmartQuery()
// (js/parser.js). All four fetchers now receive a SearchPlan. The old
// isVibeOrTag branching is replaced by "does the plan have any
// primaryGenres/secondaryThemes" — same concept, new source of truth.
//
// NEW: wired to js/aiPanel.js. The parser's output is no longer just a
// debug readout — it's shown live, tied to the actual query, in three
// stages: (1) runIntentAnimation() plays the "reading your request" reveal
// while intent/plan are already known, (2) setApiTierStatus() is called at
// each tier of the waterfall below as it happens, (3) finishAnimation() +
// settlePanel() collapse the live view into the compact summary/details
// panel once results are scored. All aiPanel calls are skipped for a blank
// query (e.g. the refresh button's triggerSearch("", 1)) — there's no real
// "request" to explain in that case.
import { db, doc, getDoc, setDoc, generateCacheKey } from './firebase.js';
import { buildIntent } from './parser/pipeline.js';
import { buildSearchPlan } from './parser/searchPlanner.js';
import { fetchFromAniListUnified } from './anilist.js';
import { fetchFromJikanFallback } from './jikan.js';
import { fetchFromKitsuFallback } from './kitsu.js';
import { fetchFromMangaDexFallback, resolveReadLinks, suggestTitlesFromMangaDex } from './mangadex.js'; 
import { renderMangaCard, renderDidYouMean } from './renderer.js';  
import { normalizeResult } from './resultNormalizer.js';
import { scoreResults } from './parser/recommendationScorer.js';
import { runIntentAnimation, setApiTierStatus, finishAnimation, settlePanel, hideAIPanel } from './aiPanel.js';
// Phase 3: merged concept dictionary, passed through to scoreResults() so it
// can build/cache a per-manga mood-atom profile on a cache miss (see
// mangaProfiles.js). Curated wins on key conflicts — same convention
// dictionary.js/harvester.js already use elsewhere in this codebase.
import { CONCEPT_PROPERTIES } from './parser/dictionary/properties.js';

// harvested_knowledge.js is written by the out-of-band Node harvester and
// may not exist yet (fresh repo) or could be regenerating between harvest
// runs — a static import would hard-fail this ENTIRE module (and therefore
// every button that calls triggerSearch) if the file is ever missing.
// Dynamic import + fallback to {} mirrors harvester.js's own
// loadHarvestedRules() try/catch for exactly that reason.
let CONCEPT_DICTIONARY = { ...CONCEPT_PROPERTIES };
(async () => {
    try {
        const mod = await import('./parser/dictionary/harvested_knowledge.js');
        CONCEPT_DICTIONARY = { ...mod.HARVESTED_RULES, ...CONCEPT_PROPERTIES }; // curated wins on conflicts
    } catch (e) {
        console.warn('[search.js] harvested_knowledge.js not available yet, scoring with curated properties.js only:', e.message);
    }
})();

let isSearching = false;

// Maps the internal dataSource tag search.js already tracked into the
// human-readable UnifiedResult.source label (see resultNormalizer.js).
const SOURCE_LABELS = {
    anilist: 'AniList',
    jikan: 'Jikan',
    kitsu: 'Kitsu',
    mangadex: 'MangaDex',
    // Cache only ever stores Tier-1 (AniList) results — see the CACHE SAVE
    // block below — so a cache hit is always AniList data underneath.
    cache: 'AniList (cached)'
};

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

    // Whether there's an actual user request to explain in the AI panel.
    // A blank query (the reroll button calls triggerSearch("", 1)) has no
    // intent worth animating, so the panel just stays hidden for that run.
    const hasQuery = typeof rawQuery === 'string' && rawQuery.trim().length > 0;

    try {
        // CHANGED: run the full NLU pipeline instead of the simple parser.
        const intent = buildIntent(rawQuery);
        const plan = buildSearchPlan(intent);
        const isGenreSearch = (plan.primaryGenres.length + plan.secondaryThemes.length) > 0;

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
            console.log("Not in cache. Beginning API Waterfall...");

            // TIER 1: AniList
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

            // TIER 2: Jikan (MAL) Fallback
            if (!finalResults || finalResults.length === 0) {
                console.log("AniList failed. Trying Jikan...");
                dataSource = "jikan";
                if (hasQuery) setApiTierStatus('jikan', 'pending');
                try {
                    finalResults = await fetchFromJikanFallback(plan, page, 10);
                    if (hasQuery) setApiTierStatus('jikan', (finalResults && finalResults.length > 0) ? 'success' : 'fail');
                } catch (e) {
                    console.warn("Jikan failed:", e);
                    if (hasQuery) setApiTierStatus('jikan', 'fail');
                }
            } else if (hasQuery) {
                setApiTierStatus('jikan', 'skip');
            }

            // TIER 3: Kitsu Fallback
            if (!finalResults || finalResults.length === 0) {
                console.log("Jikan failed. Trying Kitsu...");
                dataSource = "kitsu";
                if (hasQuery) setApiTierStatus('kitsu', 'pending');
                try {
                    finalResults = await fetchFromKitsuFallback(plan, page, 10);
                    if (hasQuery) setApiTierStatus('kitsu', (finalResults && finalResults.length > 0) ? 'success' : 'fail');
                } catch (e) {
                    console.warn("Kitsu failed:", e);
                    if (hasQuery) setApiTierStatus('kitsu', 'fail');
                }
            } else if (hasQuery) {
                setApiTierStatus('kitsu', 'skip');
            }

            // TIER 4: MangaDex Fallback 
            if (!finalResults || finalResults.length === 0) {
                console.log("Kitsu failed. Trying MangaDex...");
                dataSource = "mangadex";
                if (hasQuery) setApiTierStatus('mangadex', 'pending');
                try {
                    finalResults = await fetchFromMangaDexFallback(plan, page, 10);
                    if (hasQuery) setApiTierStatus('mangadex', (finalResults && finalResults.length > 0) ? 'success' : 'fail');
                } catch (e) {
                    console.warn("MangaDex failed:", e);
                    if (hasQuery) setApiTierStatus('mangadex', 'fail');
                }
            } else if (hasQuery) {
                setApiTierStatus('mangadex', 'skip');
            }

            // CACHE SAVE: Only save Tier 1 (AniList) data to Firebase to keep cache clean
            if (db && finalResults && finalResults.length > 0 && dataSource === "anilist") {
                try {
                    const docRef = doc(db, "searches", cacheKey);
                    await setDoc(docRef, { results: finalResults });
                } catch (e) { console.warn("Firestore write failed:", e); }
            }
        }

        // NEW: hard chapter-count constraint from the plan (e.g. "under 50
        // chapters"), applied once across whichever tier produced results —
        // including the cache-hit path. Unknown chapter counts are kept
        // rather than dropped, since we can't confirm they violate the cap.
        if (plan.filters?.maxChapters) {
            finalResults = (finalResults || []).filter(m => {
                const ch = typeof m.chapters === 'number' ? m.chapters : parseInt(m.chapters, 10);
                return !ch || isNaN(ch) || ch <= plan.filters.maxChapters;
            });
        }

        if (!finalResults || finalResults.length === 0) {
            if (hasQuery) {
                await finishAnimation(0);
                settlePanel(intent);
            }

            let suggestions = [];
            if (plan.cleanQuery && plan.cleanQuery.length > 0) {
                try { suggestions = await suggestTitlesFromMangaDex(plan.cleanQuery, 5); } 
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

        const unifiedResults = finalResults.map(aniManga =>
            normalizeResult(aniManga, SOURCE_LABELS[dataSource] || dataSource)
        );

        // NEW: score every result against the original intent/plan and re-sort
        // by matchScore instead of whatever order the API tier returned them
        // in. Falls back to unscored/API order only for a cache hit, since a
        // cached result set has no intent/plan attached to this query run —
        // actually a cache hit DOES have the current query's intent/plan
        // (built above from rawQuery), so it's scored too.
        // CHANGED: now awaited — Phase 3's mood-atom scoring warms/reads each
        // item's manga profile from Firestore (mangaProfiles.js) in parallel
        // before scoring, so this is no longer a synchronous call.
        const scored = await scoreResults(unifiedResults, intent, plan, CONCEPT_DICTIONARY);

        const factSheets = await Promise.all(scored.map(async (unified) => {
            const generatedLinks = await resolveReadLinks(unified.title);
            return { ...unified, readLinks: generatedLinks };
        }));

        if (hasQuery) {
            await finishAnimation(factSheets.length);
            settlePanel(intent);
        }

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
