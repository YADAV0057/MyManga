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

        const raw = input.value.trim();

        if (!raw) {
            output.innerHTML = `
                <div style="color:#ffcc00">
                    ⚠️ Enter some text first
                </div>
            `;
            return;
        }

        try {
            // 1. Let pipeline.js do ALL the heavy lifting
            const pipelineModule = await import("./parser/pipeline.js");
            const intent = pipelineModule.buildIntent(raw);

            // 2. Build Visual Bars for Mood Profile
            let profileHTML = "<div style='opacity: 0.5;'>No specific moods detected. Try different words!</div>";
            
            if (intent && intent.moodProfile && intent.moodProfile.length > 0) {
                profileHTML = intent.moodProfile.map(m => `
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; font-weight: 600;">
                            <span style="text-transform: capitalize;">${m.category}</span>
                            <span style="color: #00ff9d;">${m.score}%</span>
                        </div>
                        <div style="width: 100%; background: rgba(255, 255, 255, 0.1); border-radius: 6px; overflow: hidden; height: 8px;">
                            <div style="width: ${m.score}%; background: #00ff9d; height: 100%; border-radius: 6px; transition: width 0.4s ease-out;"></div>
                        </div>
                    </div>
                `).join('');
            }

            
             // 5. Render Output Dashboard
            output.innerHTML = `
                <div style="line-height:1.7; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px;">

                    <h3 style="margin-top: 0;">📝 Original Input</h3>
                    <div style="opacity: 0.8; font-style: italic;">"${intent.originalQuery}"</div>

                    <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">

                    <h3>🎭 Dynamic Mood Profile</h3>
                    <div style="margin-top: 15px;">
                        ${profileHTML}
                    </div>

                    <div style="margin-top: 15px; font-size: 12px; text-align: right;">
                        <span style="opacity: 0.6;">Global Intensity:</span> 
                        <strong style="color: #00ff9d;">${intent.intensity ? intent.intensity.toFixed(2) : "0.00"}</strong>
                        &nbsp;|&nbsp;
                        <span style="opacity: 0.6;">Calculated Tone:</span> 
                        <strong style="color: #00e5ff; text-transform: capitalize;">${intent.tone}</strong>
                    </div>

                    <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">

                    <h3>🎯 Base Intent Schema</h3>
                    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; margin-top: 10px;">
                        <div style="margin-bottom: 8px;">
                            <strong style="color: #ffcc00;">Genres:</strong> 
                            ${intent.genres && intent.genres.length > 0 ? intent.genres.join(", ") : "<span style='opacity:0.5'>None</span>"}
                        </div>
                        <div style="margin-bottom: 8px;">
                            <strong style="color: #ff9d00;">Themes:</strong> 
                            ${intent.themes && intent.themes.length > 0 ? intent.themes.join(", ") : "<span style='opacity:0.5'>None</span>"}
                        </div>
                        <div>
                            <strong style="color: #ff007b;">Demographics:</strong> 
                            ${intent.demographics && intent.demographics.length > 0 
                                ? intent.demographics.map(d => `${d.name} <span style="opacity:0.6">(${Math.round(d.confidence * 100)}%)</span>`).join(", ") 
                                : "<span style='opacity:0.5'>None</span>"}
                        </div>
                    </div>

                    <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">

                    <h3>🚀 Smart Reasoning (Rule Engine)</h3>
                    <div style="background: rgba(255, 255, 255, 0.05); border-left: 4px solid #00e5ff; padding: 10px; border-radius: 4px; margin-top: 10px;">
                        
                        <div style="margin-bottom: 12px;">
                            <strong style="color: #00ff9d;">🔥 Boosts (Prioritize):</strong> 
                            <div style="padding-left: 10px; font-size: 13px; opacity: 0.9; margin-top: 4px;">
                                <span style="opacity:0.7">Genres:</span> ${intent.boosts?.genres?.length ? intent.boosts.genres.join(", ") : "None"}<br>
                                <span style="opacity:0.7">Themes:</span> ${intent.boosts?.themes?.length ? intent.boosts.themes.join(", ") : "None"}<br>
                                <span style="opacity:0.7">Demos:</span> ${intent.boosts?.demographics?.length ? intent.boosts.demographics.join(", ") : "None"}
                            </div>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <strong style="color: #ff4b4b;">🚫 Avoids (Exclude):</strong> 
                            <div style="padding-left: 10px; font-size: 13px; opacity: 0.9; margin-top: 4px;">
                                <span style="opacity:0.7">Genres:</span> ${intent.avoids?.genres?.length ? intent.avoids.genres.join(", ") : "None"}<br>
                                <span style="opacity:0.7">Themes:</span> ${intent.avoids?.themes?.length ? intent.avoids.themes.join(", ") : "None"}
                            </div>
                        </div>

                        <div style="margin-bottom: 8px;">
                            <strong style="color: #ffcc00;">🔌 API Waterfall Route:</strong> 
                            <span style="font-size: 13px;">${intent.searchPriority ? intent.searchPriority.join(" → ") : "Default"}</span>
                        </div>
                        
                        <div>
                            <strong style="color: #b388ff;">🤖 AI Confidence:</strong> 
                            ${intent.confidence ? (intent.confidence * 100).toFixed(0) + "%" : "100%"}
                        </div>

                    </div>

                </div>
            `;


                
            
        } catch (err) {
            console.error("Parser Error:", err);
            output.innerHTML = `
                <div style="color:red">
                    ❌ Error in parser pipeline:
                    <br><br>
                    ${err.message}
                </div>
            `;
        }
    });

    window.AppDiagnostics.log(
        "Parser",
        true,
        "Tester initialized with pipeline.js"
    );
}



// ===============================
// START APP
// ===============================
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}
