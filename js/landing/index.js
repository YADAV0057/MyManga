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
import { showSkeletons, renderTrendingRow, renderHiddenGemsRow } from './render.js';
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
            <h2>💎 Hidden Gems</h2>
            <div id="hidden-gems-row" class="hcarousel"></div>
        </section>
    `;
}

async function init() {
    const mount = document.querySelector('[data-landing-mount]');
    if (!mount) {
        console.warn(
            '[landing/index.js] No mount point found. Add <div data-landing-mount></div> ' +
            'anywhere on the landing page to enable the Trending Today / Hidden Gems rows.'
        );
        return;
    }

    try {
        injectStylesheetOnce();
        mount.innerHTML = buildMountMarkup();

        const trendingEl = document.getElementById('trending-today-row');
        const gemsEl = document.getElementById('hidden-gems-row');

        showSkeletons(trendingEl, gemsEl);

        const { trending, hiddenGems } = await fetchLandingFeeds();

        renderTrendingRow(trendingEl, trending);
        renderHiddenGemsRow(gemsEl, hiddenGems);

        // Rows start empty (skeletons) at layout time, so wait a tick for
        // real cards to be in the DOM before measuring scrollWidth.
        requestAnimationFrame(() => {
            autoScrollCarousel(trendingEl);
            autoScrollCarousel(gemsEl);
        });
    } catch (e) {
        // Contained failure: the rest of the page (search, mood mixer, etc.)
        // must never break because this feature had a bad day.
        console.error('[landing/index.js] Landing feature failed to initialize:', e);
        if (mount) mount.innerHTML = '';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}



