// js/parser/telemetry.js

/**
 * Stores missed searches in the browser's localStorage.
 */
export function logMissedSearch(query) {
    // 1. Get existing logs (or start with an empty array)
    const existingLogs = JSON.parse(localStorage.getItem('missed_searches') || '[]');
    
    // 2. Add new entry
    const entry = {
        timestamp: new Date().toISOString(),
        query: query
    };
    
    existingLogs.push(entry);
    
    // 3. Save back to localStorage
    localStorage.setItem('missed_searches', JSON.stringify(existingLogs));
    
    console.log(`[Telemetry] Logged unknown intent: "${query}"`);
    console.log(`[Telemetry] Total missed: ${existingLogs.length}`);
}
