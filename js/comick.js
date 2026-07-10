// ==========================================
// COMICK.IO ENGINE (js/comick.js)
// ==========================================
// READLINKS_UPGRADE_PLAN.md Step 5: adds Comick.io as a second "verified"
// tier read-link source alongside MangaDex. Comick has a real public
// search API (unlike Manganato/Bato.to, which are just guessed
// search-pattern URLs), so a hit here is trustworthy enough to badge
// "Verified" the same way MangaDex results are.
//
// Deliberately mirrors mangadex.js's resolveReadLinks() shape: its own
// 1.5s abort timeout and its own session-level circuit breaker (2
// consecutive failures -> skip Comick for the rest of the tab's life,
// same threshold as MangaDex). Kept as an independent flag pair rather
// than sharing MangaDex's breaker -- the two APIs fail independently, and
// coupling them would take Comick down over a pure MangaDex outage (or
// vice versa).
//
// NOT registered in js/readLinks/sources.js -- that registry is only for
// instant, no-network, guessed-URL fallback sources. Comick needs a real
// async lookup, same reason MangaDex isn't in there either (see the
// comment at the top of sources.js).
// CHANGED (READLINKS_UPGRADE_PLAN.md Step 6): originally a permanent
// per-session boolean breaker (2 failures -> never retried again until
// reload), matching mangadex.js's Step 6 fix so the two verified sources
// behave consistently: a timed cooldown timestamp instead of a permanent
// trip, plus one retry with a short backoff before a call counts as a
// real failure at all.
const COMICK_API = 'https://api.comick.fun/v1.0/search';
const COMICK_COOLDOWN_MS = 60000; // 60s skip window once tripped
const RETRY_BACKOFF_MS = 300; // short pause before the one retry

let comickUnreachableUntil = 0; // timestamp (ms); 0 = not currently in cooldown
let consecutiveFailures = 0;

// Single attempt, no retry logic -- called twice by resolveComickLink()
// below so the retry loop doesn't duplicate the fetch/timeout/parse code.
async function attemptComickLookup(title) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500); // same 1.5s budget as MangaDex's lookup

    const res = await fetch(`${COMICK_API}?q=${encodeURIComponent(title)}&limit=1`, {
        signal: controller.signal
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    // Comick's search endpoint returns a bare array, not a {data:[...]}
    // envelope like MangaDex -- do not assume data.data here.
    const first = Array.isArray(data) ? data[0] : null;
    if (!first || !first.slug) return null;

    return {
        name: "Comick (Verified)",
        url: `https://comick.io/comic/${first.slug}`,
        isValidated: true
    };
}

/**
 * Looks up `title` on Comick and returns a verified link object, or null if
 * Comick has no match, is unreachable, or the circuit breaker is cooling
 * down. Never throws -- callers can await this directly alongside other
 * lookups.
 * @param {string} title
 * @returns {Promise<{name: string, url: string, isValidated: true} | null>}
 */
export async function resolveComickLink(title) {
    if (Date.now() < comickUnreachableUntil) return null;

    try {
        const result = await attemptComickLookup(title);
        consecutiveFailures = 0; // any successful round-trip (match or not) clears the strike count
        return result;
    } catch (e) {
        // One retry with a short backoff before this counts as a real
        // failure -- a single transient blip shouldn't cost a strike.
        await new Promise(resolve => setTimeout(resolve, RETRY_BACKOFF_MS));
        try {
            const result = await attemptComickLookup(title);
            consecutiveFailures = 0;
            return result;
        } catch (e2) {
            if (++consecutiveFailures >= 2) {
                comickUnreachableUntil = Date.now() + COMICK_COOLDOWN_MS;
                consecutiveFailures = 0; // fresh count for the next cooldown window
                console.warn(`[comick.js] Comick unreachable -- skipping for ${COMICK_COOLDOWN_MS / 1000}s.`);
            }
            // Silently fail -- caller just gets null and falls through to
            // whatever other links are available, same as a MangaDex miss.
            console.warn("Comick link resolution skipped for:", title);
            return null;
        }
    }
}

