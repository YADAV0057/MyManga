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
            window.AppDiagnostics.log("Search", true, "Loaded");
        } catch (e) {
            console.error("DEBUG - Search Load Failure:", e);
            window.AppDiagnostics.log("Search", false, "Load Failed - Check Console");
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
        try {
            const moods = await import("./moods.js");
            window.populateAllVibes = moods.populateAllVibes;
            window.startVibeRotation = moods.startVibeRotation;
            window.toggleTags = moods.toggleTags;
            window.attachMoodButtonListeners = moods.attachMoodButtonListeners;
            window.AppDiagnostics.log("Moods", true, "Loaded");

            // BUGFIX: these were only ever assigned to window, never invoked,
            // so the 50-mood grid was never populated, the 3-button rotation
            // never started, and mood buttons had no click handler.
            moods.populateAllVibes();          // fills #extra-tags with all 50 mood buttons
            moods.attachMoodButtonListeners(); // delegated click handler for every .vibe-btn
            moods.startVibeRotation(30000);    // starts the 3-button rotation, every 30s
        } catch (e) {
            window.AppDiagnostics.log("Moods", false, e.message);
        }

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

        // Setup UI
        setupSearchBar();
        setupViewToggle();
        setupRefreshButton();
        setupMoodPanel();

        window.AppDiagnostics.log("App", true, "Initialized");

    } // Change your current catch block in js/main.js to this:
} catch (e) {
    console.error("DEBUG - Search Load Failure:", e); // THIS IS THE KEY
    window.AppDiagnostics.log("Search", false, "Load Failed - Check Console");
}



// ===============================
// SEARCH BAR
// ===============================
function setupSearchBar() {
    const input = document.getElementById("manga-search-input");
    const btn = document.getElementById("search-submit-btn");

    if (!input || !btn) return;

    btn.addEventListener("click", () => {
        if (window.triggerSearch) {
            window.triggerSearch(input.value.trim(), 1);
        }
    });

    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            if (window.triggerSearch) {
                window.triggerSearch(input.value.trim(), 1);
            }
        }
    });
}

// ===============================
// VIEW TOGGLE
// ===============================
// Single toggle button flips window.currentView between "discover"/
// "favorites" and swaps its own label, instead of two buttons fighting
// over an active-view class.
function setupViewToggle() {
    const favBtn = document.getElementById("nav-favorites-btn");
    const grid = document.getElementById("community-grid");
    if (!favBtn || !grid) return;

    window.currentView = "discover";
    let discoverSnapshot = null; // last-rendered discover grid HTML, restored on "Back to Discover"

    favBtn.addEventListener("click", () => {
        const goingToFavorites = window.currentView !== "favorites";
        window.currentView = goingToFavorites ? "favorites" : "discover";
        favBtn.classList.toggle("active-view", goingToFavorites);
        favBtn.textContent = goingToFavorites ? "🔍 Back to Discover" : "❤️ My List";

        // BUGFIX: this used to only flip currentView/the label and never
        // touched the grid at all. Clicking "My List" left whatever discover
        // results were already on screen sitting there untouched (looked like
        // nothing happened), and clicking it again just flipped the label
        // back to "❤️ My List" with no visible change — read exactly as "the
        // button does nothing except switch back to Discover."
        if (goingToFavorites) {
            discoverSnapshot = grid.innerHTML;
            renderFavoritesView(grid);
        } else if (discoverSnapshot !== null) {
            grid.innerHTML = discoverSnapshot;
        }
    });
}

// Renders window.getAllFavorites() into the grid, same as a normal search
// result set. Relies on favorites.js storing the full factSheet (renderer.js
// hands toggleFavorite() the complete cached factSheet, not just an id), so
// window.renderMangaCard can consume each entry directly.
function renderFavoritesView(grid) {
    const favorites = window.getAllFavorites ? window.getAllFavorites() : [];
    grid.innerHTML = '';

    if (!favorites || favorites.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Nothing saved yet — tap ♡ on any card to add it here.</p>';
        return;
    }

    if (window.renderMangaCard) {
        favorites.forEach(window.renderMangaCard);
    }
}

// ===============================
// MOOD PANEL ("+ Show All Moods" toggle)
// ===============================
function setupMoodPanel() {
    const moreBtn = document.getElementById("more-btn");
    if (!moreBtn) return;

    moreBtn.addEventListener("click", () => {
        if (window.toggleTags) window.toggleTags();
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
