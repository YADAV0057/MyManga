// ==========================================
// landing/carousel.js
// ==========================================
// Makes a .hcarousel row drift slowly side to side on its own, instead of
// sitting still until the user manually swipes it. Ping-pongs between the 
// start and end of the row (scrolls right, then back left, on repeat)
// rather than a one-way loop, so the motion reads as "gently drifting"
// instead of "jumping back to the start."
//
// Pauses immediately on any user interaction (touch, mouse drag/hover,
// wheel) and resumes automatically a few seconds after the user lets go,
// so it never fights a manual swipe.
//
// Isolation note: pure DOM behavior, no imports, no external state. Safe
// to call on any element — a missing/empty row or a user with
// prefers-reduced-motion set just results in a no-op.

const PIXELS_PER_SECOND = 22;   // slow, ambient drift speed
const RESUME_DELAY_MS = 2500;   // how long to wait after user interaction before resuming
const EDGE_PAUSE_MS = 900;      // brief pause at each end before reversing direction

export function autoScrollCarousel(el) {
    if (!el) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let direction = 1;      // 1 = scrolling right, -1 = scrolling left
    let paused = false;
    let edgePause = false;
    let resumeTimer = null;
    let rafId = null;
    let lastTs = null;

    function maxScroll() {
        return Math.max(0, el.scrollWidth - el.clientWidth);
    }

    function tick(ts) {
        rafId = requestAnimationFrame(tick);
        if (paused || edgePause) { lastTs = ts; return; }
        if (lastTs === null) { lastTs = ts; return; }

        const dt = (ts - lastTs) / 1000;
        lastTs = ts;

        const max = maxScroll();
        if (max <= 0) return; // row fits on screen — nothing to scroll

        el.scrollLeft += direction * PIXELS_PER_SECOND * dt;

        if (el.scrollLeft >= max) {
            el.scrollLeft = max;
            direction = -1;
            pauseAtEdge();
        } else if (el.scrollLeft <= 0) {
            el.scrollLeft = 0;
            direction = 1;
            pauseAtEdge();
        }
    }

    function pauseAtEdge() {
        edgePause = true;
        setTimeout(() => { edgePause = false; }, EDGE_PAUSE_MS);
    }

    function pauseForInteraction() {
        paused = true;
        if (resumeTimer) clearTimeout(resumeTimer);
        resumeTimer = setTimeout(() => { paused = false; }, RESUME_DELAY_MS);
    }

    ['touchstart', 'mousedown', 'wheel'].forEach(evt =>
        el.addEventListener(evt, pauseForInteraction, { passive: true })
    );
    el.addEventListener('mouseenter', () => { paused = true; });
    el.addEventListener('mouseleave', pauseForInteraction);

    rafId = requestAnimationFrame(tick);

    // Not currently exposed anywhere, but keeps this function tidy/reusable
    // if a future "unmount" ever needs to stop the loop (e.g. row removed).
    return () => cancelAnimationFrame(rafId);
}
