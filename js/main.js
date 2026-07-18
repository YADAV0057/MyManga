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
// MODULE LOADER
// ===============================
// Collapses the old copy-pasted "try { import } catch { log }" blocks into
// one call per module. This is the fix for the class of bug where a hand-
// written block gets duplicated/edited and ends up with a stray or
// mismatched try/catch: there's now only ONE place that does the
// import + diagnostics-logging dance, so a broken copy-paste of an
// individual block is no longer possible.
//
// `assign` receives the imported module and does whatever wiring that
// module needs (attaching things to window, calling an init function,
// awaiting a load call, etc). It can be sync or async — both are awaited.
async function loadModule(name, path, assign) {
    try {
        const mod = await import(path);
        if (assign) await assign(mod);
        window.AppDiagnostics.log(name, true, "Loaded");
    } catch (e) {
        console.error(`DEBUG - ${name} Load Failure:`, e);
        window.AppDiagnostics.log(name, false, e.message || "Load Failed - Check Console");
    }
}

// ===============================
// APP INIT
// ===============================
async function initializeApp() {
    try {
        window.AppDiagnostics.log("App", true, "Initializing...");

        // Load Firebase
        await loadModule("Firebase", "./firebase.js", (fb) => {
            window.db = fb.db;
        });

        // Load Config
        await loadModule("Config", "./config.js", (cfg) => {
            window.CONFIG = cfg.CONFIG;
        });

        // Load Search
        await loadModule("Search", "./search.js", (search) => {
            window.triggerSearch = search.triggerSearch;
            window.triggerPresetSearch = search.triggerPresetSearch;
            window.triggerQuickFilter = search.triggerQuickFilter;
        });

        // Load Slide-out Menu Drawer
        await loadModule("MenuDrawer", "./menuDrawer.js", (menuDrawer) => {
            window.openMenu = menuDrawer.openMenu;
            window.closeMenu = menuDrawer.closeMenu;
            window.cycleTheme = menuDrawer.cycleTheme;
        });

        // Load Theme
        await loadModule("Theme", "./theme.js", (theme) => {
            window.applyMoodTheme = theme.applyMoodTheme;
        });

        // Load AI Panel (replaces the old standalone parser tester)
        await loadModule("AIPanel", "./aiPanel.js", (aiPanel) => {
            aiPanel.initAIPanel();
        });

        // Load Landing Page Discovery Rows (Trending Today / New Releases /
        // Most Awaited / Hidden Gems / Short Reads). Self-mounting — it
        // finds <div data-landing-mount></div> in the HTML and injects its
        // own markup/styles/rows, so nothing needs to be attached to
        // window here. This was the missing piece: landing/index.js was
        // never imported anywhere, so its rows never initialized even
        // though fetch.js/render.js/carousel.js/index.js were all fully
        // rewired and ready.
        await loadModule("Landing", "./landing/index.js");

        // Load Renderer
        await loadModule("Renderer", "./renderer.js", (renderer) => {
            window.renderMangaCard = renderer.renderMangaCard;
            window.getCachedFactSheet = renderer.getCachedFactSheet;
            // BUGFIX: handleFavoriteClick was called via onclick in renderer.js's
            // card markup but never attached to window anywhere — the ♥ button
            // threw a silent ReferenceError. renderer.js now exports it.
            window.handleFavoriteClick = renderer.handleFavoriteClick;
            // NEW: same pattern for the "Why?" match-breakdown toggle.
            window.toggleWhyPanel = renderer.toggleWhyPanel;
        });

        // Load Favorites
        await loadModule("Favorites", "./favorites.js", (fav) => {
            window.toggleFavorite = fav.toggleFavorite;
            window.getAllFavorites = fav.getAllFavorites;
            window.hydrateFavorites = fav.hydrateFromRemote;
        });

        // Load Manga Detail Page (full-page cover/synopsis/read-links view,
        // opened when any card — search grid, Trending Today, Hidden Gems —
        // is tapped).
        await loadModule("MangaDetail", "./mangaDetail.js", (detail) => {
            window.openMangaDetail = detail.openMangaDetail;
            window.closeMangaDetail = detail.closeMangaDetail;
        });

        // Load Today's Top Picks (Step 4 — auto-fills the homepage grid on
        // load with a small rotating set of well-rated manga, instead of
        // leaving #community-grid empty until the user searches. Loaded
        // after MangaDetail/Renderer/Favorites above so the cards it
        // renders are immediately clickable/favoritable.)
        await loadModule("TopPicks", "./topPicks.js", async (topPicks) => {
            await topPicks.loadTodaysTopPicks();
        });

        // Load Mood Mixer Page (Step 2 — dedicated 2-mood + genre + filter
        // page, opened from the homepage Mood Mixer panel's "Open Full
        // Mixer" button instead of mixing being limited to instant-search
        // chip taps).
        await loadModule("MixerPage", "./mixerPage.js", (mixer) => {
            window.openMixerPage = mixer.openMixerPage;
            window.closeMixerPage = mixer.closeMixerPage;
        });

        await loadModule("AdvancedFilter", "./advancedFilter/index.js", (advFilter) => {
            window.openAdvancedFilter = advFilter.openAdvancedFilter;
            window.closeAdvancedFilter = advFilter.closeAdvancedFilter;
        });

        // Load My List Page (Step 5 — dedicated saved-favorites + hourly
        // rotating recommendations page, replacing the old in-place grid
        // toggle entirely; see setupMyListButton below).
        await loadModule("MyListPage", "./myListPage.js", (myList) => {
            window.openMyListPage = myList.openMyListPage;
            window.closeMyListPage = myList.closeMyListPage;
        });

        // Load Search Results Page (Step 7 — dedicated paginated results
        // page for typed searches, replacing the old behavior of rendering
        // straight into the homepage's #community-grid; see setupSearchBar
        // below. Uses window.triggerSearch internally, so it must load
        // after Search above, though import order here doesn't actually
        // matter since it's only called on a later user action.)
        await loadModule("SearchResultsPage", "./searchResultsPage.js", (resultsPage) => {
            window.openSearchResultsPage = resultsPage.openSearchResultsPage;
            window.closeSearchResultsPage = resultsPage.closeSearchResultsPage;
        });

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











