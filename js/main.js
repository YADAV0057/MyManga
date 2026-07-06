// ==========================================
// APP ENTRY POINT (js/main.js)
// ==========================================



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

        // Setup Parser Tester (NEW)
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
function setupViewToggle() {
    const discoverBtn = document.getElementById("nav-discover-btn");
    const favBtn = document.getElementById("nav-favorites-btn");

    if (!discoverBtn || !favBtn) return;

    window.currentView = "discover";

    discoverBtn.addEventListener("click", () => {
        window.currentView = "discover";
        discoverBtn.classList.add("active-view");
        favBtn.classList.remove("active-view");
    });

    favBtn.addEventListener("click", () => {
        window.currentView = "favorites";
        favBtn.classList.add("active-view");
        discoverBtn.classList.remove("active-view");
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
// 🧠 PARSER TESTER (PREVIEW BOARD)
// ===============================

function setupParserTester() {

    const btn = document.getElementById("parser-test-btn");
    const input = document.getElementById("parser-input");
    const output = document.getElementById("parser-output");

    if (!btn || !input || !output) {
        console.warn("Parser UI missing");
        return;
    }

    btn.addEventListener("click", async () => {

        const raw = input.value || "";

        try {

            // ✅ FIXED PATH
            const normalizeModule = await import("./js/parser/normalize.js");
            const normalize = normalizeModule.normalize;

            const normalized = normalize(raw);

            let moodData = null;

            try {
                const engine = await import("./js/parser/moodEngine.js");
                moodData = engine.analyzeMood(normalized);
            } catch (e) {
                console.warn("Mood engine not loaded:", e.message);
                moodData = null;
            }

            output.innerHTML = `
                <div style="line-height:1.7">

                    <h3>📝 Original</h3>
                    <div>${raw}</div>

                    <hr>

                    <h3>🧹 Normalized</h3>
                    <div style="color:#00ff9d">${normalized}</div>

                    <hr>

                    <h3>🎭 Mood Analysis</h3>
                    <div>
                        ${
                            moodData
                            ? `${moodData.moods.join(", ")} (intensity: ${moodData.intensity.toFixed(2)})`
                            : "Mood engine not loaded yet"
                        }
                    </div>

                </div>
            `;

        } catch (err) {

            console.error("Parser Error:", err);

            output.innerHTML = `
                <div style="color:red">
                    ❌ Error in parser:<br><br>
                    ${err.message}
                </div>
            `;
        }
    });

    window.AppDiagnostics.log("Parser", true, "Tester initialized");
}

// ===============================
// START APP
// ===============================
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}
