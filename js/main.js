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
            { name: 'DOM Elements', fn: () => document.getElementById('manga-search-input') && document.getElementById('rotating-vibes') && document.getElementById('community-grid') }
        ];
        
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
