// ==========================================
// APP ENTRY POINT (js/main.js) 
// ==========================================

// Create a diagnostic object to track app state
window.AppDiagnostics = {
    status: {},
    log: function(module, success, message) {
        this.status[module] = { success, message, timestamp: new Date().toISOString() };
        const icon = success ? '✅' : '❌';
        console.log(`${icon} [${module}] ${message}`);
    },
    report: function() {
        console.clear();
        console.log('═══════════════════════════════════════════');
        console.log('   🔍 MYMANGA DIAGNOSTIC REPORT');
        console.log('═══════════════════════════════════════════');
        
        const checks = [
            { name: 'Firebase', fn: () => typeof window.db !== 'undefined' },
            { name: 'Config', fn: () => typeof window.CONFIG !== 'undefined' },
            { name: 'triggerSearch', fn: () => typeof window.triggerSearch === 'function' },
            { name: 'applyMoodTheme', fn: () => typeof window.applyMoodTheme === 'function' },
            { name: 'toggleTags', fn: () => typeof window.toggleTags === 'function' },
            { name: 'populateAllVibes', fn: () => typeof window.populateAllVibes === 'function' },
            { name: 'startVibeRotation', fn: () => typeof window.startVibeRotation === 'function' },
            { name: 'attachMoodButtonListeners', fn: () => typeof window.attachMoodButtonListeners === 'function' },
            { name: 'toggleFavorite', fn: () => typeof window.toggleFavorite === 'function' },
            { name: 'DOM Elements', fn: () => document.getElementById('manga-search-input') && document.getElementById('rotating-vibes') && document.getElementById('community-grid') }
        ];
      import { normalize } from "./parser/normalize.js";

document.getElementById("parser-test-btn").addEventListener("click", () => {

    const input = document.getElementById("parser-input").value;

    const result = normalize(input);

    document.getElementById("parser-output").textContent =
        JSON.stringify({
            original: input,
            normalized: result
        }, null, 2);

});  
        let allGood = true; 
        checks.forEach(check => {
            const result = check.fn();
            const icon = result ? '✅' : '❌';
            console.log(`${icon} ${check.name.padEnd(30)} ${result ? 'loaded' : 'MISSING'}`);
            if (!result) allGood = false;
        });
        
        console.log('═══════════════════════════════════════════');
        console.log('\n📊 Initialization Logs:');
        Object.entries(this.status).forEach(([module, info]) => {
            const icon = info.success ? '✅' : '❌';
            console.log(`${icon} ${module}: ${info.message}`);
        });
        
        console.log('\n═══════════════════════════════════════════');
        if (allGood) {
            console.log('✅ ALL SYSTEMS GO! App should be working.');
        } else {
            console.log('❌ ISSUES DETECTED! See above for details.');
        }
        console.log('═══════════════════════════════════════════\n');
    }
};

async function initializeApp() {
    try {
        window.AppDiagnostics.log('Initialization', true, 'Starting app initialization...');
        
        // Dynamic import Firebase
        try {
            await import('./firebase.js');
            const dbImport = await import('./firebase.js');
            window.db = dbImport.db;
            window.AppDiagnostics.log('Firebase', window.db !== null, 'Firebase initialized');
        } catch (e) {
            window.AppDiagnostics.log('Firebase', false, `Failed: ${e.message}`);
        }

        // Dynamic import Config
        try {
            const configModule = await import('./config.js');
            window.CONFIG = configModule.CONFIG;
            window.AppDiagnostics.log('Config', window.CONFIG !== undefined, 'Config loaded');
        } catch (e) {
            window.AppDiagnostics.log('Config', false, `Failed: ${e.message}`);
        }

        // Dynamic import Moods
        try {
            const moodsModule = await import('./moods.js');
            window.populateAllVibes = moodsModule.populateAllVibes;
            window.startVibeRotation = moodsModule.startVibeRotation;
            window.toggleTags = moodsModule.toggleTags || (() => {});
            window.attachMoodButtonListeners = moodsModule.attachMoodButtonListeners;
            window.AppDiagnostics.log('Moods', true, 'Moods engine loaded');
        } catch (e) {
            window.AppDiagnostics.log('Moods', false, `Failed: ${e.message}`);
        }

        // Dynamic import Search
        try {
            const searchModule = await import('./search.js');
            window.triggerSearch = searchModule.triggerSearch;
            window.AppDiagnostics.log('Search', typeof window.triggerSearch === 'function', 'Search engine loaded');
        } catch (e) {
            window.AppDiagnostics.log('Search', false, `Failed: ${e.message}`);
        }

        // Dynamic import Theme
        try {
            const themeModule = await import('./theme.js');
            window.applyMoodTheme = themeModule.applyMoodTheme;
            window.AppDiagnostics.log('Theme', typeof window.applyMoodTheme === 'function', 'Theme engine loaded');
        } catch (e) {
            window.AppDiagnostics.log('Theme', false, `Failed: ${e.message}`);
        }

        // Dynamic import Renderer (needed here so favorites can re-render saved cards)
        try {
            const rendererModule = await import('./renderer.js');
            window.renderMangaCard = rendererModule.renderMangaCard;
            window.getCachedFactSheet = rendererModule.getCachedFactSheet;
            window.AppDiagnostics.log('Renderer', true, 'Renderer engine loaded');
        } catch (e) {
            window.AppDiagnostics.log('Renderer', false, `Failed: ${e.message}`);
        }

        // Dynamic import Favorites
        try {
            const favoritesModule = await import('./favorites.js');
            window.toggleFavorite = favoritesModule.toggleFavorite;
            window.isFavorite = favoritesModule.isFavorite;
            window.getAllFavorites = favoritesModule.getAllFavorites;
            window.hydrateFavorites = favoritesModule.hydrateFromRemote;
            window.AppDiagnostics.log('Favorites', true, 'Favorites engine loaded');
        } catch (e) {
            window.AppDiagnostics.log('Favorites', false, `Failed: ${e.message}`);
        }

        // Validate all critical functions exist
        const critical = ['triggerSearch', 'applyMoodTheme', 'populateAllVibes'];
        const missing = critical.filter(fn => typeof window[fn] !== 'function');
        
        if (missing.length > 0) {
            window.AppDiagnostics.log('Validation', false, `Missing: ${missing.join(', ')}`);
            console.error('Critical functions missing:', missing);
            return;
        }

        window.AppDiagnostics.log('Validation', true, 'All critical functions present');

        // Setup UI listeners
        setupSearchBar();
        setupRefreshButton();
        setupViewToggle();

        // Initialize mood buttons and rotation
        if (window.populateAllVibes) {
            window.populateAllVibes();
            window.AppDiagnostics.log('UI', true, 'Mood buttons populated');
        }

        if (window.startVibeRotation && window.CONFIG) {
            window.startVibeRotation(window.CONFIG.VIBE_ROTATION_TIME || 30000);
            window.AppDiagnostics.log('UI', true, 'Vibe rotation started');
        }

        if (window.attachMoodButtonListeners) {
            window.attachMoodButtonListeners();
            window.AppDiagnostics.log('UI', true, 'Mood listeners attached');
        }

        // Trigger initial search
        if (window.triggerSearch) {
            window.triggerSearch('', 1);
            window.AppDiagnostics.log('App', true, 'Initial search triggered');
        }

        // Pull any cloud-saved favorites in the background (non-blocking)
        if (window.hydrateFavorites) {
            window.hydrateFavorites().then(() => {
                window.AppDiagnostics.log('Favorites', true, 'Cloud favorites synced');
                refreshFavoritesViewIfActive();
            });
        }

        // All done!
        window.AppDiagnostics.log('App', true, 'Ready! Run window.AppDiagnostics.report() for full status');

    } catch (error) {
        window.AppDiagnostics.log('FatalError', false, error.message);
        console.error('Fatal initialization error:', error);
    }
}

function setupSearchBar() {
    const input = document.getElementById('manga-search-input');
    const btn = document.getElementById('search-submit-btn');
    if (!input || !btn) {
        window.AppDiagnostics.log('SearchBar', false, 'DOM elements not found');
        return;
    }

    const runSearch = () => {
        if (window.applyMoodTheme) window.applyMoodTheme('default'); 
        if (window.triggerSearch) window.triggerSearch(input.value.trim(), 1);
    };

    btn.addEventListener('click', runSearch);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runSearch();
    });
    
    window.AppDiagnostics.log('SearchBar', true, 'Search bar initialized');
}

function setupRefreshButton() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (!refreshBtn) return;

    refreshBtn.addEventListener('click', () => {
        if (window.triggerSearch) {
            const query = window.currentActiveQuery ?? '';
            const nextPage = (window.currentActivePage || 1) + 1;
            window.triggerSearch(query, nextPage);
        }
    });
    
    window.AppDiagnostics.log('RefreshBtn', true, 'Refresh button initialized');
}

function setupViewToggle() {
    const discoverBtn = document.getElementById('nav-discover-btn');
    const favoritesBtn = document.getElementById('nav-favorites-btn');
    const vibePanel = document.querySelector('.vibe-panel-container');
    const resultsTitle = document.getElementById('results-title');
    const refreshBtn = document.getElementById('refresh-btn');

    if (!discoverBtn || !favoritesBtn) {
        window.AppDiagnostics.log('ViewToggle', false, 'Nav buttons not found');
        return;
    }

    window.currentView = 'discover';

    discoverBtn.addEventListener('click', () => {
        if (window.currentView === 'discover') return;
        window.currentView = 'discover';
        discoverBtn.classList.add('active-view');
        favoritesBtn.classList.remove('active-view');
        if (vibePanel) vibePanel.style.display = '';
        if (resultsTitle) resultsTitle.textContent = '✨ Your Curated Picks';
        if (refreshBtn) refreshBtn.style.display = window.currentActiveQuery !== undefined ? '' : 'none';
        if (window.triggerSearch) window.triggerSearch(window.currentActiveQuery ?? '', 1);
    });

    favoritesBtn.addEventListener('click', () => {
        if (window.currentView === 'favorites') return;
        window.currentView = 'favorites';
        favoritesBtn.classList.add('active-view');
        discoverBtn.classList.remove('active-view');
        if (vibePanel) vibePanel.style.display = 'none';
        if (refreshBtn) refreshBtn.style.display = 'none';
        if (resultsTitle) resultsTitle.textContent = '❤️ My Saved Manga';
        renderFavoritesView();
    });

    window.AppDiagnostics.log('ViewToggle', true, 'Discover / My List toggle initialized');
}

function renderFavoritesView() {
    const grid = document.getElementById('community-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const favorites = window.getAllFavorites ? window.getAllFavorites() : [];
    if (favorites.length === 0) {
        grid.innerHTML = `
            <div class="empty-favorites">
                <p>No saved manga yet.</p>
                <p style="margin-top:8px; font-size:0.85rem;">Tap the ♡ on any cover to add it here.</p>
            </div>`;
        return;
    }

    favorites.forEach(item => {
        if (window.renderMangaCard) window.renderMangaCard(item);
    });
}

function refreshFavoritesViewIfActive() {
    if (window.currentView === 'favorites') renderFavoritesView();
}

// Exposed so the ♡ button rendered inside each card (renderer.js) can call it
window.handleFavoriteClick = async function (event, id) {
    event.stopPropagation();
    if (!window.getCachedFactSheet || !window.toggleFavorite) return;

    const factSheet = window.getCachedFactSheet(id);
    if (!factSheet) return;

    const nowFavorited = await window.toggleFavorite(factSheet);

    const btn = document.getElementById(`fav-${id}`);
    if (btn) {
        btn.textContent = nowFavorited ? '♥' : '♡';
        btn.title = nowFavorited ? 'Remove from My List' : 'Save to My List';
        btn.classList.toggle('active', nowFavorited);
    }

    // If it was just removed while viewing "My List", drop it from the grid immediately
    if (!nowFavorited) refreshFavoritesViewIfActive();
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
