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
import { fetchLandingFeeds } from './fetch.js';
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

        const feeds = await fetchLandingFeeds();

        renderTrendingRow(trendingEl, feeds.trending);
        renderNewReleasesRow(newReleasesEl, feeds.newReleases);
        renderMostAwaitedRow(mostAwaitedEl, feeds.mostAwaited);
        renderHiddenGemsRow(gemsEl, feeds.hiddenGems);
        renderShortReadsRow(shortReadsEl, feeds.shortReads);

        // Rows start empty (skeletons) at layout time, so wait a tick for
        // real cards to be in the DOM before measuring scrollWidth.
        requestAnimationFrame(() => {
            autoScrollCarousel(trendingEl);
            autoScrollCarousel(newReleasesEl);
            autoScrollCarousel(mostAwaitedEl);
            autoScrollCarousel(gemsEl);
            autoScrollCarousel(shortReadsEl);
        });
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

