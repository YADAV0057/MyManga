// ========================================== 
// landing/index.js
// ========================================== 
// SINGLE ENTRY POINT for the whole landing-page feature.
//
// Everything the "Trending Today" + "Hidden Gems" rows need — fetching,
// caching, rendering, styling, and DOM wiring — lives inside this
// landing/ folder. search.js only ever needs ONE line to enable this
// whole feature:
//
//     import './landing/index.js';
//
// That's it. No other file outside landing/ needs to know this exists.
// If these rows break, misbehave, or need to be temporarily disabled,
// the fix (or the `// import` comment-out) happens entirely in this
// folder — nothing else in the codebase is touched or affected.
//
// HTML requirement (the one thing outside this folder you DO need):
// add a single empty mount point anywhere on the landing page:
//     <div data-landing-mount></div>
// This file builds its own two rows and inserts them there. If that
// mount point isn't found, it logs a clear warning and does nothing
// else — it will never throw and break the rest of the page.
//
// ROTATION (this pass): fetch.js now returns a POOL per row (up to 25
// items) instead of just the 10 that get displayed, and exports
// rotatingWindow() + ROTATION_INTERVAL_MS to pick a time-based slice of
// that pool. This file owns the setInterval that re-slices + re-renders
// on that cadence — no new network calls, the pools are already sitting
// in memory (and in the 6h client cache) from the initial fetch. If the
// user leaves the tab open, the rows will visibly change every
// ROTATION_INTERVAL_MS instead of staying frozen on the same cards for
// the whole 6-hour cache window.
import { fetchLandingFeeds, rotatingWindow, ROTATION_INTERVAL_MS } from './fetch.js';
import { 
    showSkeletons, 
    renderTrendingRow, 
    renderHiddenGemsRow, 
    renderNewReleasesRow, 
    renderMostAwaitedRow, 
    renderShortReadsRow 
} from './render.js';
import { autoScrollCarousel } from './carousel.js';

const STYLE_ID = 'landing-styles';
const STYLE_HREF = new URL('./styles.css', import.meta.url).href;

function injectStylesheetOnce() {
    if (document.getElementById(STYLE_ID)) return;
    const link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = STYLE_HREF;
    document.head.appendChild(link);
}

function buildMountMarkup() {
    return `
        <section class="landing-row">
            <h2>🔺 Trending Today</h2>
            <div id="trending-today-row" class="hcarousel"></div>
        </section>
        <section class="landing-row">
            <h2>🌟 New Releases</h2>
            <div id="new-releases-row" class="hcarousel"></div>
        </section>
        <section class="landing-row">
            <h2>⏳ Most Awaited</h2>
            <div id="most-awaited-row" class="hcarousel"></div>
        </section>
        <section class="landing-row">
            <h2>💎 Hidden Gems</h2>
            <div id="hidden-gems-row" class="hcarousel"></div>
        </section>
        <section class="landing-row">
            <h2>⏱️ Short Reads</h2>
            <div id="short-reads-row" class="hcarousel"></div>
        </section>
    `;
}

async function init() {
    const mount = document.querySelector('[data-landing-mount]');
    if (!mount) {
        console.warn(
            '[landing/index.js] No mount point found. Add <div data-landing-mount></div> ' +
            'anywhere on the landing page to enable the discovery feed rows.'
        );
        return;
    }

    try {
        injectStylesheetOnce();
        mount.innerHTML = buildMountMarkup();

        const trendingEl = document.getElementById('trending-today-row');
        const newReleasesEl = document.getElementById('new-releases-row');
        const mostAwaitedEl = document.getElementById('most-awaited-row');
        const gemsEl = document.getElementById('hidden-gems-row');
        const shortReadsEl = document.getElementById('short-reads-row');

        // Show skeletons for all rows while loading
        showSkeletons(trendingEl, newReleasesEl, mostAwaitedEl, gemsEl, shortReadsEl);

        // These are POOLS now (up to 25 items each), not the final
        // displayed list — see fetch.js.
        const pools = await fetchLandingFeeds();

        function renderCurrentWindow() {
            renderTrendingRow(trendingEl, rotatingWindow(pools.trending));
            renderNewReleasesRow(newReleasesEl, rotatingWindow(pools.newReleases));
            renderMostAwaitedRow(mostAwaitedEl, rotatingWindow(pools.mostAwaited));
            renderHiddenGemsRow(gemsEl, rotatingWindow(pools.hiddenGems));
            renderShortReadsRow(shortReadsEl, rotatingWindow(pools.shortReads));

            // Rows start empty (skeletons) at layout time, so wait a tick
            // for real cards to be in the DOM before measuring
            // scrollWidth.
            requestAnimationFrame(() => {
                autoScrollCarousel(trendingEl);
                autoScrollCarousel(newReleasesEl);
                autoScrollCarousel(mostAwaitedEl);
                autoScrollCarousel(gemsEl);
                autoScrollCarousel(shortReadsEl);
            });
        }

        renderCurrentWindow();

        // Rotate which slice of each pool is shown every
        // ROTATION_INTERVAL_MS. No network calls — just re-slicing +
        // re-rendering from the pools already fetched above. If a pool
        // only had 1-3 survivors to begin with (a thin filtered row),
        // rotatingWindow() has nothing new to show and the row will look
        // unchanged — that's a pool-size limitation, not a rotation bug.
        setInterval(renderCurrentWindow, ROTATION_INTERVAL_MS);
    } catch (e) {
        console.error('[landing/index.js] Landing feature failed to initialize:', e);
        if (mount) mount.innerHTML = '';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
