// ========================================== 
// APP ENTRY POINT (js/main.js)
// ==========================================
// CHANGED: setupParserTester() / #parser-input / #parser-output are gone — 
// the standalone "Mood Intelligence Preview" box has been replaced by the
// AI Search Intelligence panel (js/aiPanel.js), which is now driven by the
// real search bar instead of a separate manual tester. setupParserTester.js
// is no longer imported anywhere and can be deleted from the repo.

// ===============================
// DIAGNOSTICS SYSTEM
// ===============================
window.addEventListener('error', (e) => {
    alert('JS ERROR: ' + e.message + '\nFile: ' + e.filename + '\nLine: ' + e.lineno);
});
window.addEventListener('unhandledrejection', (e) => {
    alert('PROMISE ERROR: ' + (e.reason?.message || e.reason));
});

console.log("🚀 main.js is executing!");




window.AppDiagnostics = {
    status: {},
    log: function (module, success, message) {
        this.status[module] = {
            success,
            message,
            timestamp: new Date().toISOString()
        };
        const icon = success ? "✅" : "❌";
        console.log(`${icon} [${module}] ${message}`);
    },
    report: function () {
        console.clear();
        console.log("═══════════════════════════════════════════");
        console.log("   🔍 MANGAMOOD DIAGNOSTIC REPORT");
        console.log("═══════════════════════════════════════════");

        const checks = [
            { name: "Firebase", fn: () => typeof window.db !== "undefined" },
            { name: "Config", fn: () => typeof window.CONFIG !== "undefined" },
            { name: "Search", fn: () => typeof window.triggerSearch === "function" },
            { name: "Theme", fn: () => typeof window.applyMoodTheme === "function" },
            { name: "Moods", fn: () => typeof window.populateAllVibes === "function" },
            { name: "AI Panel", fn: () => document.getElementById("ai-panel") }
        ];

        let allGood = true;

        checks.forEach(check => {
            const result = check.fn();
            const icon = result ? "✅" : "❌";
            console.log(`${icon} ${check.name.padEnd(20)} ${result ? "OK" : "MISSING"}`);
            if (!result) allGood = false;
        });

        console.log("═══════════════════════════════════════════");
        console.log(allGood ? "✅ SYSTEM READY" : "❌ ISSUES FOUND");
        console.log("═══════════════════════════════════════════");
    }
};

// ===============================
// APP INIT
// ===============================
async function initializeApp() {
    try {
        window.AppDiagnostics.log("App", true, "Initializing...");

        // Load Firebase
        try {
            const fb = await import("./firebase.js");
            window.db = fb.db;
            window.AppDiagnostics.log("Firebase", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("Firebase", false, e.message);
        }

        // Load Config
        try {
            const cfg = await import("./config.js");
            window.CONFIG = cfg.CONFIG;
            window.AppDiagnostics.log("Config", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("Config", false, e.message);
        }

        
        // Load Search
        try {
            const search = await import("./search.js"); // <--- Corrected Path
            window.triggerSearch = search.triggerSearch;
            window.triggerPresetSearch = search.triggerPresetSearch;
            window.triggerQuickFilter = search.triggerQuickFilter;
            window.AppDiagnostics.log("Search", true, "Loaded");
        } catch (e) {
            console.error("DEBUG - Search Load Failure:", e);
            window.AppDiagnostics.log("Search", false, "Load Failed - Check Console");
        }


        //Load Slide-out Menu Drawer
        try {
            const menuDrawer = await import("./menuDrawer.js");
            window.openMenu = menuDrawer.openMenu;
            window.closeMenu = menuDrawer.closeMenu;
            window.cycleTheme = menuDrawer.cycleTheme;
            window.AppDiagnostics.log("MenuDrawer", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("MenuDrawer", false, e.message);
        }

        




        // Load Theme
        try {
            const theme = await import("./theme.js");
            window.applyMoodTheme = theme.applyMoodTheme;
            window.AppDiagnostics.log("Theme", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("Theme", false, e.message);
        }

        // Load Moods
        

        // Load AI Panel (replaces the old standalone parser tester)
        try {
            const aiPanel = await import("./aiPanel.js");
            aiPanel.initAIPanel();
            window.AppDiagnostics.log("AIPanel", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("AIPanel", false, e.message);
        }

        // Load Renderer
        try {
            const renderer = await import("./renderer.js");
            window.renderMangaCard = renderer.renderMangaCard;
            window.getCachedFactSheet = renderer.getCachedFactSheet;
            // BUGFIX: handleFavoriteClick was called via onclick in renderer.js's
            // card markup but never attached to window anywhere — the ♥ button
            // threw a silent ReferenceError. renderer.js now exports it.
            window.handleFavoriteClick = renderer.handleFavoriteClick;
            // NEW: same pattern for the "Why?" match-breakdown toggle.
            window.toggleWhyPanel = renderer.toggleWhyPanel;
            window.AppDiagnostics.log("Renderer", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("Renderer", false, e.message);
        }

        // Load Favorites
        try {
            const fav = await import("./favorites.js");
            window.toggleFavorite = fav.toggleFavorite;
            window.getAllFavorites = fav.getAllFavorites;
            window.hydrateFavorites = fav.hydrateFromRemote;
            window.AppDiagnostics.log("Favorites", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("Favorites", false, e.message);
        }

        // Load Manga Detail Page (full-page cover/synopsis/read-links view,
        // opened when any card — search grid, Trending Today, Hidden Gems —
        // is tapped).
        try {
            const detail = await import("./mangaDetail.js");
            window.openMangaDetail = detail.openMangaDetail;
            window.closeMangaDetail = detail.closeMangaDetail;
            window.AppDiagnostics.log("MangaDetail", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("MangaDetail", false, e.message);
        }

        // Load Today's Top Picks (Step 4 — auto-fills the homepage grid on
        // load with a small rotating set of well-rated manga, instead of
        // leaving #community-grid empty until the user searches. Loaded
        // after MangaDetail/Renderer/Favorites above so the cards it
        // renders are immediately clickable/favoritable.)
        try {
            const topPicks = await import("./topPicks.js");
            await topPicks.loadTodaysTopPicks();
            window.AppDiagnostics.log("TopPicks", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("TopPicks", false, e.message);
        }

        // Load Mood Mixer Page (Step 2 — dedicated 2-mood + genre + filter
        // page, opened from the homepage Mood Mixer panel's "Open Full
        // Mixer" button instead of mixing being limited to instant-search
        // chip taps).
        try {
            const mixer = await import("./mixerPage.js");
            window.openMixerPage = mixer.openMixerPage;
            window.closeMixerPage = mixer.closeMixerPage;
            window.AppDiagnostics.log("MixerPage", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("MixerPage", false, e.message);
        }. 

        try {
    const advFilter = await import("./advancedFilter/index.js");
    window.openAdvancedFilter = advFilter.openAdvancedFilter;
    window.closeAdvancedFilter = advFilter.closeAdvancedFilter;
    window.AppDiagnostics.log("AdvancedFilter", true, "Loaded");
} catch (e) {
    window.AppDiagnostics.log("AdvancedFilter", false, e.message);
        }

        // Load My List Page (Step 5 — dedicated saved-favorites + hourly
        // rotating recommendations page, replacing the old in-place grid
        // toggle entirely; see setupMyListButton below).
        try {
            const myList = await import("./myListPage.js");
            window.openMyListPage = myList.openMyListPage;
            window.closeMyListPage = myList.closeMyListPage;
            window.AppDiagnostics.log("MyListPage", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("MyListPage", false, e.message);
        }

        // Load Search Results Page (Step 7 — dedicated paginated results
        // page for typed searches, replacing the old behavior of rendering
        // straight into the homepage's #community-grid; see setupSearchBar
        // below. Uses window.triggerSearch internally, so it must load
        // after Search above, though import order here doesn't actually
        // matter since it's only called on a later user action.)
        try {
            const resultsPage = await import("./searchResultsPage.js");
            window.openSearchResultsPage = resultsPage.openSearchResultsPage;
            window.closeSearchResultsPage = resultsPage.closeSearchResultsPage;
            window.AppDiagnostics.log("SearchResultsPage", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("SearchResultsPage", false, e.message);
        }

        // Setup UI
        setupSearchBar();
        setupMyListButton();
        setupRefreshButton();
        setupQuickFilters();

        window.AppDiagnostics.log("App", true, "Initialized");

    } catch (e) {
        console.error("DEBUG - App Init Failure:", e);
        window.AppDiagnostics.log("App", false, "Load Failed - Check Console");
    }
}



// ===============================
// SEARCH BAR
// ===============================
// STEP 7d: was calling window.triggerSearch() directly, which rendered
// straight into the homepage's #community-grid. Now opens the dedicated
// Search Results page (js/searchResultsPage.js) instead — that module
// calls triggerSearch() itself (page 1) once it's open, so the homepage
// grid is never touched by a typed search anymore.
function setupSearchBar() {
    const input = document.getElementById("manga-search-input");
    const btn = document.getElementById("search-submit-btn");

    if (!input || !btn) return;

    const submit = () => {
        if (window.openSearchResultsPage) {
            window.openSearchResultsPage(input.value.trim());
        }
    };

    btn.addEventListener("click", submit);

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") submit();
    });
}

// ===============================
// MY LIST PAGE (♡ button)
// ===============================
// STEP 5/6: this used to swap #community-grid's contents in place and
// relabel the button "🔍 Back to Discover" while toggled — that whole
// in-place-toggle behavior has been removed entirely (Step 6). The ♡
// button now just opens js/myListPage.js's overlay directly, same as the
// detail page and Mood Mixer page do, with its own back button for
// returning — there's no "discover" state to toggle back to anymore.
function setupMyListButton() {
    const favBtn = document.getElementById("nav-favorites-btn");
    if (!favBtn) return;

    favBtn.addEventListener("click", () => {
        if (window.openMyListPage) window.openMyListPage();
    });
}

// ===============================
// MOOD PANEL ("+ Show All Moods" toggle)
// ===============================


// ===============================
// MOOD MIXER PAGE ("Open Full Mixer" button)
// ===============================


// ===============================
// QUICK FILTER CHIPS (Finish tonight / Long binge / Completed)
// ===============================
// BUGFIX: these three chips had no click handler at all — tapping them did
// nothing. Each now runs a real filtered browse via search.js's
// triggerQuickFilter (chapter-count bounds or an AniList status filter).
function setupQuickFilters() {
    const chips = document.querySelectorAll('[data-quick-filter]');
    if (!chips.length) return;

    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const type = chip.dataset.quickFilter;
            if (window.triggerQuickFilter) window.triggerQuickFilter(type);
        });
    });
}

// ===============================
// REFRESH
// ===============================
function setupRefreshButton() {
    const btn = document.getElementById("refresh-btn");
    if (!btn) return;

    btn.addEventListener("click", () => {
        if (window.triggerSearch) {
            // CHANGED: was always triggerSearch("", 1) — a blank query on a
            // fixed page 1 produces the exact same cache key (generateCacheKey
            // hashes query+page) AND the exact same AniList POPULARITY_DESC
            // page every time, so "Reroll" just reloaded the same cached
            // manga forever. Picking a random page each click both busts the
            // cache key and pulls a genuinely different slice of results.
            const randomPage = Math.floor(Math.random() * 10) + 1;
            window.triggerSearch("", randomPage);
        }
    });
}

// ===============================
// START APP
// ===============================
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}








