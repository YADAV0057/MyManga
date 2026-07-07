// ==========================================
// APP ENTRY POINT (js/main.js)
// ==========================================

import { setupParserTester } from './setupParserTester.js';

// ===============================
// DIAGNOSTICS SYSTEM
// ===============================
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
            { name: "Parser UI", fn: () => document.getElementById("parser-test-btn") }
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
            const search = await import("./search.js");
            window.triggerSearch = search.triggerSearch;
            window.AppDiagnostics.log("Search", true, "Loaded");
        } catch (e) {
            window.AppDiagnostics.log("Search", false, e.message);
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
        } catch (e) {
            window.AppDiagnostics.log("Moods", false, e.message);
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

        // Setup Parser Tester (Imported from external file)
        setupParserTester();

        window.AppDiagnostics.log("App", true, "Initialized");

    } catch (err) {
        window.AppDiagnostics.log("Fatal", false, err.message);
    }
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
// CHANGED: the redundant "Discover" button was removed from index.html —
// Discover is just the default state. This is now a single toggle button
// that flips window.currentView between "discover"/"favorites" and swaps
// its own label, instead of two buttons fighting over an active-view class.
function setupViewToggle() {
    const favBtn = document.getElementById("nav-favorites-btn");
    if (!favBtn) return;

    window.currentView = "discover";

    favBtn.addEventListener("click", () => {
        const goingToFavorites = window.currentView !== "favorites";
        window.currentView = goingToFavorites ? "favorites" : "discover";
        favBtn.classList.toggle("active-view", goingToFavorites);
        favBtn.textContent = goingToFavorites ? "🔍 Back to Discover" : "❤️ My List";
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
            window.triggerSearch("", 1);
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
