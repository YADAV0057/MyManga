
// ==========================================
// MANGA MOOD MAIN HUB (js/main.js)
// ==========================================
// ==========================================
// RADICAL DEBUGGER: DO NOT REMOVE UNTIL FIXED
// ==========================================
window.onerror = function(message, source, lineno, colno, error) {
    alert(`💥 FATAL CRASH:\n${message}\nLine: ${lineno}`);
    return true;
};

window.onunhandledrejection = function(event) {
    alert(`🚨 API/PROMISE FAILED:\n${event.reason}`);
};
// ==========================================



import { CONFIG } from './config.js';
import { populateAllVibes, updateRotatingVibes } from './moods.js';
import { triggerSearch } from './search.js';

// Import the quiz module to immediately load its window functions
import './quiz.js'; 

// Attach triggerSearch to the window immediately so inline HTML onClick events can see it!
window.triggerSearch = triggerSearch;

// Wait for the HTML to fully load before running the app
window.addEventListener('DOMContentLoaded', () => {
    console.log(`${CONFIG.APP_NAME} v${CONFIG.VERSION} is ready!`);

    // 1. Initialize Moods UI
    populateAllVibes();
    updateRotatingVibes();
    
    // Set up the interval for rotating vibes
    window.rotationInterval = setInterval(updateRotatingVibes, CONFIG.VIBE_ROTATION_TIME || 30000);

    // 2. Bind DOM Elements to Search Logic
    const refreshBtn = document.getElementById('refresh-btn');
    const searchBtn = document.getElementById('search-submit-btn');
    const searchInput = document.getElementById('manga-search-input');

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            window.currentActivePage = (window.currentActivePage || 1) + 1;
            window.triggerSearch(window.currentActiveQuery, window.currentActivePage);
        });
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (searchInput) window.triggerSearch(searchInput.value, 1);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.triggerSearch(e.target.value, 1);
            }
        });
    }
});
