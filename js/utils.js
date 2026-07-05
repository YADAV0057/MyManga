// ==========================================
// Utility Functions
// ==========================================

import { CONFIG } from "./config.js";
 
/**
 * Delay
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce
 */
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Escape HTML
 */
export function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Timeout Fetch
 */
export async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, CONFIG.REQUEST_TIMEOUT);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        return response;
    } finally {
        clearTimeout(timeout);
    }
}

/**
 * Retry Wrapper
 */
export async function retry(fn, retries = CONFIG.RETRY_COUNT) {
    let error;
    while (retries--) {
        try {
            return await fn();
        } catch (e) {
            error = e;
        }
    }
    throw error;
}

/**
 * Format Score
 */
export function formatScore(score) {
    if (!score) return "N/A";
    return Number(score).toFixed(1);
}

/**
 * Format Chapters
 */
export function formatChapters(chapters) {
    if (!chapters) return "?";
    return chapters;
}

/**
 * Random Element
 */
export function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
