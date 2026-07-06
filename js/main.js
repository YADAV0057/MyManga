// ==========================================
// APP ENTRY POINT (js/main.js) 
// ==========================================
import './firebase.js';
import { CONFIG } from './config.js';
// Added toggleTags to the import list below
import { populateAllVibes, startVibeRotation, toggleTags } from './moods.js';
import { triggerSearch } from './search.js';
import { applyMoodTheme } from './theme.js';

// Attach global functions to the window so HTML 'onclick' can find them
window.triggerSearch = triggerSearch;
window.applyMoodTheme = applyMoodTheme;
window.toggleTags = toggleTags; // <--- THIS WAS MISSING

function setupSearchBar() {
    const input = document.getElementById('manga-search-input');
    const btn = document.getElementById('search-submit-btn');
    if (!input || !btn) return;

    const runSearch = () => {
        applyMoodTheme('default'); 
        triggerSearch(input.value.trim(), 1);
    };

    btn.addEventListener('click', runSearch);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') runSearch();
    });
}

function setupRefreshButton() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (!refreshBtn) return;

    refreshBtn.addEventListener('click', () => {
        const query = window.currentActiveQuery ?? '';
        const nextPage = (window.currentActivePage || 1) + 1;
        triggerSearch(query, nextPage);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    populateAllVibes();
    startVibeRotation(CONFIG.VIBE_ROTATION_TIME);

    setupSearchBar();
    setupRefreshButton();

    // Initial load: show trending/popular manga by default
    triggerSearch('', 1);
});
