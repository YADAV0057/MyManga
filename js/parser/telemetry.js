// js/parser/telemetry.js
import fs from 'fs';
import path from 'path';

/**
 * Logs search terms that the parser failed to categorize.
 * @param {string} query - The raw input from the user that resulted in 0 mood matches.
 */
export function logMissedSearch(query) {
    const logPath = path.join(process.cwd(), 'missed_searches.txt');
    const timestamp = new Date().toISOString();
    
    // Create a clean entry
    const logEntry = `${timestamp} | SEARCH: ${query}\n`;
    
    try {
        // Append the missed search to the file
        fs.appendFileSync(logPath, logEntry, 'utf8');
        console.log(`[Telemetry] Logged unknown intent: "${query}"`);
    } catch (err) {
        console.error(`[Telemetry] Failed to log search: ${err.message}`);
    }
}
