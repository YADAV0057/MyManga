// ==========================================
// APP ENTRY POINT (js/main.js) 
// ==========================================
import './firebase.js';
import { CONFIG } from './config.js';
import { populateAllVibes, startVibeRotation } from './moods.js';
import { triggerSearch } from './search.js';
import { applyMoodTheme } from './theme.js'; // NEW IMPORT

// Attach global functions to the window for inline onclick handlers
window.triggerSearch = triggerSearch;
window.applyMoodTheme = applyMoodTheme; // NEW: Allows buttons to change colors

function setupSearchBar() {
    const input = document.getElementById('manga-search-input');
    const btn = document.getElementById('search-submit-btn');
    if (!input || !btn) return;

    const runSearch = () => {
        // Reset to default theme when manually typing a search
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
