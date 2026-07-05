// ==========================================
// 0. FIREBASE INITIALIZATION & CACHE SETUP
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyCrZAQbMT35SKArRfWnKGt4SS5NlJgN1XM",
    authDomain: "moodmanga-80a58.firebaseapp.com",
    projectId: "moodmanga-80a58",
    storageBucket: "moodmanga-80a58.firebasestorage.app",
    messagingSenderId: "970051387669",
    appId: "1:970051387669:web:f9789bb0b568eb803ca91c",  
    measurementId: "G-JZSZ0TYYEL"
};

let app = null;
let db = null;
let analytics = null;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error("CRITICAL: Firebase initialization failed. Caching will be disabled.", e);
}

try {
    if (app) analytics = getAnalytics(app);
} catch (e) {
    console.warn("Analytics failed (possibly blocked). Continuing without it.", e);
}

/**
 * Generates a consistent cache key for Firestore.
 * Trimmed to prevent duplicate keys from accidental spacing.
 */
function generateCacheKey(query, page) {
    const cleanQuery = query.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `search_${cleanQuery}_page_${page}`;
}

// Export db so other modules can access it if needed
export { db, generateCacheKey };

// ==========================================
// ==========================================
// 1. MOOD ROTATION ENGINE 
// ==========================================
const allMoods = [
    { label: "😊 Happy", query: "Slice of Life, Comedy" },
    { label: "😭 Sad", query: "Drama, Psychological" },
    { label: "🔥 Hype", query: "Action, Fantasy" },
    { label: "🍵 Chill", query: "Slice of Life, Adventure" },
    { label: "👻 Spooky", query: "Horror, Mystery" },
    { label: "💕 Romantic", query: "Romance, Comedy" },
    { label: "🧠 Big Brain", query: "Mystery, Psychological" },
    { label: "✨ Escapism", query: "Fantasy, Adventure" },
    { label: "☕ Cozy", query: "Slice of Life, Romance" },
    { label: "📼 Nostalgic", query: "Mecha, Sci-Fi" },
    { label: "⚡ Adrenaline", query: "Sports, Drama" },
    { label: "😂 Laugh Out Loud", query: "Comedy, Action" },
    { label: "🧸 Heartwarming", query: "Slice of Life, Fantasy" },
    { label: "🌀 Mind-Bending", query: "Sci-Fi, Psychological" },
    { label: "⚔️ Epic", query: "Action, Adventure" },
    { label: "🎀 Cute", query: "Mahou Shoujo, Comedy" },
    { label: "🖤 Edgy", query: "Action, Horror" },
    { label: "🌟 Inspiring", query: "Music, Drama" },
    { label: "🕵️ Mysterious", query: "Mystery, Supernatural" },
    { label: "🏚️ Lonely", query: "Sci-Fi, Drama" },
    { label: "🎸 Rebellious", query: "Action, Music" },
    { label: "🪄 Dreamy", query: "Mahou Shoujo, Fantasy" },
    { label: "⏳ Intense", query: "Thriller, Psychological" },
    { label: "🌿 Peaceful", query: "Slice of Life" },
    { label: "🐶 Wholesome", query: "Comedy, Slice of Life" },
    { label: "🥋 Sweaty", query: "Sports, Action" },
    { label: "📖 Philosophical", query: "Psychological, Drama" },
    { label: "🤪 Chaotic", query: "Comedy, Sci-Fi" },
    { label: "🦇 Gloomy", query: "Supernatural, Horror" },
    { label: "🗡️ Revenge", query: "Drama, Fantasy" },
    { label: "🔮 Magical", query: "Fantasy, Supernatural" },
    { label: "💪 Overpowered", query: "Action, Sci-Fi" },
    { label: "♟️ Strategic", query: "Mecha, Psychological" },
    { label: "🌧️ Melancholic", query: "Music, Romance" },
    { label: "🩹 Hopeful", query: "Drama, Slice of Life" },
    { label: "🕴️ Fearless", query: "Action, Thriller" },
    { label: "🦾 Tech-Savvy", query: "Sci-Fi, Mecha" },
    { label: "🎒 Academic", query: "Comedy, Romance" },
    { label: "🗺️ Wanderlust", query: "Adventure, Fantasy" },
    { label: "🚬 Gritty", query: "Mystery, Thriller" },
    { label: "⛩️ Mythological", query: "Supernatural, Adventure" },
    { label: "📈 Ambitious", query: "Drama, Sports" },
    { label: "💔 Heartbroken", query: "Romance, Drama" },
    { label: "🦸 Heroic", query: "Action, Supernatural" },
    { label: "👑 Royal", query: "Fantasy, Drama" },
    { label: "🃏 Mischievous", query: "Comedy, Adventure" },
    { label: "🎖️ Tactical", query: "Mecha, Action" },
    { label: "🕯️ Paranormal", query: "Horror, Supernatural" },
    { label: "🍳 Gourmet", query: "Slice of Life, Drama" },
    { label: "🦉 Sleepless", query: "Psychological, Thriller" }
];

let currentIndex = 0;
let rotationInterval;
window.currentActiveQuery = "";
window.currentActivePage = 1;

function createVibeButton(moodObj) {
    return `<button class="vibe-btn" onclick="window.triggerSearch('${moodObj.query}', 1)">${moodObj.label}</button>`;
}

function updateRotatingVibes() {
    const rotatingContainer = document.getElementById('rotating-vibes');
    if (!rotatingContainer) return;
    rotatingContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const indexToGrab = (currentIndex + i) % allMoods.length;
        rotatingContainer.innerHTML += createVibeButton(allMoods[indexToGrab]);
    }
    currentIndex = (currentIndex + 3) % allMoods.length;
}

function populateAllVibes() {
    const hiddenContainer = document.getElementById('extra-tags');
    if (!hiddenContainer) return;
    let html = '';
    allMoods.forEach(mood => { html += createVibeButton(mood); });
    hiddenContainer.innerHTML = html;
}

window.toggleTags = function() {
    const extra = document.getElementById('extra-tags');
    const btn = document.getElementById('more-btn');
    const rotatingContainer = document.getElementById('rotating-vibes');

    if (extra.style.display === "flex") {
        extra.style.display = "none";
        rotatingContainer.style.display = "flex";
        btn.innerText = "+ Show All 50 Moods";
        rotationInterval = setInterval(updateRotatingVibes, 30000);
    } else {
        extra.style.display = "flex";
        rotatingContainer.style.display = "none";
        btn.innerText = "- Hide Moods";
        clearInterval(rotationInterval);
    }
};

window.toggleOptions = function(id) {
    const overlay = document.getElementById(`overlay-${id}`);
    if (overlay) overlay.classList.toggle('active');
};

window.toggleSynopsis = function(el) {
    el.classList.toggle('expanded');
};

window.addEventListener('DOMContentLoaded', () => {
    populateAllVibes();
    updateRotatingVibes();
    rotationInterval = setInterval(updateRotatingVibes, 30000);

    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            window.currentActivePage++;
            window.triggerSearch(window.currentActiveQuery, window.currentActivePage);
        });
    }

    const searchBtn = document.getElementById('search-submit-btn');
    const searchInput = document.getElementById('manga-search-input');

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
                                                      
// ==========================================
// 3. SMART PARSER & API STACK
// ==========================================

function parseSmartQuery(rawQuery) {
    let statusFilter = null;
    let cleanQuery = rawQuery;

    const statusMatch = cleanQuery.match(/status:(completed|releasing|hiatus|cancelled)/i);
    if (statusMatch) {
        const s = statusMatch[1].toUpperCase();
        if (s === 'COMPLETED') statusFilter = 'FINISHED';
        else statusFilter = s;
        cleanQuery = cleanQuery.replace(statusMatch[0], '').trim();
    }

    // List of standard standalone genres for direct validation fallback
    const validGenres = ["Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mystery", "Psychological", "Romance", "Slice of Life", "Thriller", "Supernatural", "Sci-Fi", "Mecha", "Sports", "Music"];
    
    // Normalize string comparisons to safely match case differences or whitespace variations
    const normalizedQuery = cleanQuery.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const isVibeOrTag = 
        cleanQuery.includes(',') || 
        allMoods.some(mood => mood.query.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedQuery) ||
        validGenres.some(g => g.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedQuery);

    return { cleanQuery, statusFilter, isVibeOrTag };
}

async function fetchFromAniListUnified(parsedData, page = 1, isKorean = false, limit = 10) {
    const countryFilter = isKorean ? ', countryOfOrigin: "KR"' : '';
    let queryArgs = `$page: Int, $perPage: Int`;
    let mediaArgs = `type: MANGA, isAdult: false${countryFilter}`;
    let variables = { page: page, perPage: limit };

    if (parsedData.isVibeOrTag) {
        queryArgs += `, $genres: [String]`;
        mediaArgs += `, genre_in: $genres, sort: POPULARITY_DESC`;
        
        // Ensure keys like 'SliceOfLife' translate perfectly to 'Slice of Life' for AniList syntax
        variables.genres = parsedData.cleanQuery.split(',').map(g => {
            let item = g.trim();
            if (item.toLowerCase() === 'sliceoflife') return 'Slice of Life';
            return item;
        }).filter(g => g.length > 0);
        
    } else if (parsedData.cleanQuery.length > 0) {
        queryArgs += `, $search: String`;
        mediaArgs += `, search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC]`;
        variables.search = parsedData.cleanQuery;
    } else {
        mediaArgs += `, sort: POPULARITY_DESC`;
    }

    if (parsedData.statusFilter) {
        queryArgs += `, $status: MediaStatus`;
        mediaArgs += `, status: $status`;
        variables.status = parsedData.statusFilter;
    }

    const query = `
        query (${queryArgs}) {
            Page(page: $page, perPage: $perPage) {
                media(${mediaArgs}) {
                    id title { romaji english } averageScore genres description(asHtml: false) coverImage { large } chapters status
                }
            }
        }
    `;

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            console.error(`AniList API returned HTTP ${response.status}`);
            return [];
        }

        const data = await response.json();
        return data.data ? data.data.Page.media : [];
    } catch (error) {
        console.error("AniList API Error:", error);
        return [];
    }
}


// ==========================================
// 3. READ LINK RESOLVER (Part 4)
// ==========================================

async function resolveReadLinks(title) {
    const encodedTitle = encodeURIComponent(title);
    let validLinks = [];

    // MangaDex API is generally fast, but we add a 3-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const mdRes = await fetch(`https://api.mangadex.org/manga?title=${encodedTitle}&limit=1`, {
            signal: controller.signal
        });
        
        clearTimeout(timeout);

        if (mdRes.ok) {
            const mdData = await mdRes.json();
            if (mdData.data && mdData.data.length > 0) {
                validLinks.push({
                    name: "📖 MangaDex (Verified)",
                    url: `https://mangadex.org/title/${mdData.data[0].id}`,
                    isValidated: true
                });
            }
        }
    } catch (e) {
        // Silently fail to fallback links if API is down or blocked
        console.warn("MangaDex link resolution skipped for:", title);
    }

    // Mandatory Search Fallback
    validLinks.push({ 
        name: "🌐 Google Search", 
        url: `https://www.google.com/search?q=Read+${encodedTitle}+manga+online`, 
        isValidated: false 
    });

    return validLinks;
}

// ==========================================
// 3b. TYPO-TOLERANCE (MangaDex title suggestions)
// ==========================================

async function suggestTitlesFromMangaDex(query, limit = 5) {
    if (!query || query.length < 2) return [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
        const res = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=${limit}`, {
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) return [];
        const data = await res.json();
        
        if (!data.data || !Array.isArray(data.data)) return [];

        return data.data
            .map(m => {
                const titles = m.attributes?.title || {};
                // Prefer English title, fall back to first available locale
                return titles.en || Object.values(titles)[0] || null;
            })
            .filter(Boolean); // Removes nulls or undefined
            
    } catch (e) {
        clearTimeout(timeout);
        console.warn("MangaDex suggestion lookup failed:", e);
        return [];
    }
}


// ==========================================
// 4. CORE ENGINE
// ==========================================

let isSearching = false; 

function formatStatus(status) {
    if (!status) return "Unknown";
    const map = {
        FINISHED: "Completed",
        RELEASING: "Releasing",
        NOT_YET_RELEASED: "Upcoming",
        CANCELLED: "Cancelled",
        HIATUS: "Hiatus"
    };
    return map[status] || status;
}

window.triggerSearch = async function(rawQuery, page = 1) {
    if (!rawQuery || isSearching) return;
    
    isSearching = true;
    window.currentActiveQuery = rawQuery;
    window.currentActivePage = page;

    const grid = document.getElementById('community-grid');
    const loadingBar = document.getElementById('loading-bar');
    const refreshBtn = document.getElementById('refresh-btn');

    if (loadingBar) loadingBar.classList.add('is-loading');
    if (refreshBtn) refreshBtn.style.display = 'none';
    if (grid) grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Checking database...</p>';
    
    document.getElementById('results-area')?.scrollIntoView({ behavior: 'smooth' });

    try {
        const parsedQuery = parseSmartQuery(rawQuery);
        const cacheKey = generateCacheKey(rawQuery, page);
        let finalResults = [];

        // FIREBASE CACHE CHECK
        if (db) {
            try {
                const docSnap = await getDoc(doc(db, "searches", cacheKey));
                if (docSnap.exists()) finalResults = docSnap.data().results;
            } catch (e) { console.warn("Cache read skipped:", e); }
        }

        // API FETCH IF NO CACHE
        if (finalResults.length === 0) {
            if (parsedQuery.isVibeOrTag) {
                const [korean, global] = await Promise.all([
                    fetchFromAniListUnified(parsedQuery, page, true, 5),
                    fetchFromAniListUnified(parsedQuery, page, false, 5)
                ]);
                finalResults = [...new Map([...korean, ...global].map(i => [i.id, i])).values()];
            } else {
                finalResults = await fetchFromAniListUnified(parsedQuery, page, false, 10);
            }

            // CACHE SAVE
            if (db && finalResults.length > 0) {
                setDoc(doc(db, "searches", cacheKey), { results: finalResults }).catch(console.warn);
            }
        }

        // TYPO TOLERANCE FALLBACK
        let suggestions = [];
        if ((!finalResults || finalResults.length === 0) && !parsedQuery.isVibeOrTag && parsedQuery.cleanQuery.trim().length > 1) {
            suggestions = await suggestTitlesFromMangaDex(parsedQuery.cleanQuery);
            if (suggestions.length > 0) {
                finalResults = await fetchFromAniListUnified(
                    { cleanQuery: suggestions[0], statusFilter: parsedQuery.statusFilter, isVibeOrTag: false },
                    page, false, 10
                );
            }
        }

        // RENDER RESULTS
        grid.innerHTML = '';
        if (finalResults.length > 0) {
            // Transform AniList raw data to your factSheet structure here
            finalResults.forEach(manga => {
                const factSheet = {
                    id: manga.id,
                    title: manga.title.english || manga.title.romaji,
                    coverUrl: manga.coverImage.large,
                    globalScore: manga.averageScore || "N/A",
                    rawGenres: manga.genres,
                    synopsis: manga.description,
                    chapters: manga.chapters || "??",
                    status: formatStatus(manga.status),
                    readLinks: [] // Resolve this via resolveReadLinks later
                };
                renderMangaCard(factSheet);
            });
            if (refreshBtn) refreshBtn.style.display = 'block';
        } else if (suggestions.length > 0) {
            window.renderSuggestionBanner(rawQuery, suggestions);
        } else {
            grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">No official API data found. Try a different page or filter!</p>';
        }

    } catch (err) {
        console.error("Search failed:", err);
        if (grid) grid.innerHTML = '<p>Error loading results. Please try again.</p>';
    } finally {
        isSearching = false;
        if (loadingBar) loadingBar.classList.remove('is-loading');
    }
};
              
        // Resolve read links for every result in parallel instead of one-by-one,
        // so a slow/hanging MangaDex lookup for one title doesn't stall the rest.
        const factSheets = await Promise.all(finalResults.map(async (aniManga) => {
            const title = aniManga.title.english || aniManga.title.romaji;
            const cleanSynopsis = aniManga.description ? aniManga.description.replace(/<[^>]*>?/gm, '') : "No synopsis available.";
            const generatedLinks = await resolveReadLinks(title);

            return {
                id: aniManga.id,
                title: title,
                globalScore: aniManga.averageScore || "N/A",
                rawGenres: aniManga.genres || [],
                coverUrl: aniManga.coverImage?.large || "https://via.placeholder.com/220x300?text=No+Cover",
                synopsis: cleanSynopsis,
                status: formatStatus(aniManga.status),
                chapters: aniManga.chapters ? `${aniManga.chapters} Chp.` : "N/A",
                readLinks: generatedLinks
            };
        }));

        grid.innerHTML = '';
        refreshBtn.style.display = 'block';
        if (usedFallbackQuery) {
            renderFallbackBanner(rawQuery, usedFallbackQuery, suggestions.slice(1));
        }
        factSheets.forEach(renderMangaCard);

    } catch (error) {
        console.error("Aggregation Error:", error);
        grid.innerHTML = '<p style="text-align:center; width:100%; color: #ef4444;">An error occurred connecting to the database.</p>';
    } finally {
        loadingBar.classList.remove('is-loading');
        isSearching = false;
    }
};
// ==========================================
// 5. RENDERING ENGINE
// ==========================================

function renderDidYouMean(originalQuery, suggestions) {
    const grid = document.getElementById('community-grid');
    if (!grid) return;
    
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 20px;';

    let chipsHtml = suggestions.map(s =>
        `<button class="vibe-btn" onclick="window.triggerSearch('${s.replace(/'/g, "\\'")}', 1)">${s}</button>`
    ).join(' ');

    wrapper.innerHTML = `
        <p style="color: var(--text-muted); margin-bottom: 12px;">
            No results for "<b>${originalQuery}</b>". Did you mean:
        </p>
        <div style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
            ${chipsHtml}
        </div>
    `;
    grid.appendChild(wrapper);
}

function renderFallbackBanner(originalQuery, usedQuery, otherSuggestions) {
    const grid = document.getElementById('community-grid');
    if (!grid) return;

    const banner = document.createElement('div');
    banner.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 10px 0 20px 0;';

    let altHtml = otherSuggestions.length > 0
        ? `<div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
             ${otherSuggestions.map(s => `<button class="vibe-btn" style="padding:6px 14px; font-size:0.85rem;" onclick="window.triggerSearch('${s.replace(/'/g, "\\'")}', 1)">${s}</button>`).join(' ')}
           </div>`
        : '';

    banner.innerHTML = `
        <p style="color: var(--text-muted);">
            No exact match for "<b>${originalQuery}</b>" — showing results for "<b>${usedQuery}</b>" instead.
        </p>
        ${altHtml}
    `;
    grid.appendChild(banner);
}

function renderMangaCard(factSheet) {
    const grid = document.getElementById('community-grid');
    if (!grid) return;

    const card = document.createElement('div');
    card.className = 'manga-card';

    const genresText = (factSheet.rawGenres && factSheet.rawGenres.length > 0) ? factSheet.rawGenres.slice(0, 3).join(' • ') : "Various";
    const formattedScore = (factSheet.globalScore && factSheet.globalScore !== "N/A") ? factSheet.globalScore + "%" : "N/A";

    let linksHtml = '';
    (factSheet.readLinks || []).forEach((link) => {
        const linkBg = link.isValidated
            ? '#22c55e'
            : (link.name === "🌐 Google Search" ? '#ef4444' : '#64748b');

        linksHtml += `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="read-link-btn" 
               style="background: ${linkBg}; color: #ffffff;" onclick="event.stopPropagation()">
               ${link.name}
            </a>`;
    });

    card.innerHTML = `
        <div class="manga-cover-container" onclick="window.toggleOptions('${factSheet.id}')">
            <img src="${factSheet.coverUrl}" alt="${factSheet.title.replace(/"/g, '&quot;')}" class="manga-cover" loading="lazy">
            <div class="score-badge">⭐ ${formattedScore}</div>
            <div class="read-options" id="overlay-${factSheet.id}">
                <span style="color: white; margin-bottom: 5px; font-weight: 600;">Available Sources:</span>
                ${linksHtml}
            </div>
        </div>
        <div class="manga-info">
            <h3 class="manga-title" title="${factSheet.title.replace(/"/g, '&quot;')}">${factSheet.title}</h3>
            <p class="manga-meta">${genresText}</p>
            <div class="manga-facts">
                <span>📚 ${factSheet.chapters || 'N/A'}</span>
                <span>📌 ${factSheet.status || 'Unknown'}</span>
            </div>
            <p class="manga-synopsis" onclick="window.toggleSynopsis(this)" title="Click to read full description">
                ${factSheet.synopsis || 'No description available.'}
            </p>
        </div>
    `;
    grid.appendChild(card);
}


  // ==========================================
// 5. MOOD QUIZ ENGINE
// ==========================================
const quizData = [
    { q: "How are you feeling today?", o: [{t: "😊 Happy", s: {Comedy: 2, SliceOfLife: 2}}, {t: "😢 Sad", s: {Drama: 3, Psychological: 2}}, {t: "😌 Relaxed", s: {SliceOfLife: 3, Fantasy: 1}}, {t: "🔥 Excited", s: {Action: 3, Adventure: 2}}, {t: "🤔 Thoughtful", s: {Mystery: 3, Psychological: 2}}, {t: "😴 Tired", s: {SliceOfLife: 2, Fantasy: 1}}] },
    { q: "What kind of story do you want?", o: [{t: "⚔️ Action", s: {Action: 3}}, {t: "💕 Romance", s: {Romance: 3}}, {t: "😂 Comedy", s: {Comedy: 3}}, {t: "👻 Horror", s: {Horror: 3}}, {t: "✨ Fantasy", s: {Fantasy: 3}}, {t: "🕵 Mystery", s: {Mystery: 3}}] },
    { q: "How much time do you have?", o: [{t: "📖 Short", s: {SliceOfLife: 2}}, {t: "📚 Medium", s: {Adventure: 2}}, {t: "📚📚 Long", s: {Fantasy: 3, Action: 1}}, {t: "🎲 Doesn't matter", s: {}}] },
    { q: "How intense should it be?", o: [{t: "🌿 Relaxing", s: {SliceOfLife: 3}}, {t: "⚡ Balanced", s: {Adventure: 2, Action: 1}}, {t: "🔥 Very Intense", s: {Psychological: 3, Thriller: 3}}] },
    { q: "Pick your ending.", o: [{t: "😊 Happy", s: {Comedy: 2}}, {t: "😭 Emotional", s: {Drama: 3}}, {t: "🤯 Mind-blowing", s: {Psychological: 3}}, {t: "🎲 Surprise", s: {}}] }
];

let currentQ = 0;
let userScores = {};

window.openQuiz = function() {
    currentQ = 0;
    userScores = {};
    const modal = document.getElementById('quiz-modal');
    if (modal) {
        modal.style.display = 'flex';
        window.renderQ();
    }
};

window.closeQuiz = function() {
    const modal = document.getElementById('quiz-modal');
    if (modal) modal.style.display = 'none';
};

window.selectOpt = function(score) {
    userScores[currentQ] = score;
    if (currentQ < quizData.length - 1) {
        currentQ++;
        window.renderQ();
    } else {
        window.finalizeQuiz();
    }
};

window.renderQ = function() {
    const data = quizData[currentQ];
    const container = document.getElementById('quiz-content');
    if (!container) return;

    container.innerHTML = `<h3 style="margin-bottom:20px; color:var(--text-title);">${data.q}</h3>` + 
        data.o.map(opt => 
            `<button class="quiz-option" onclick="window.selectOpt(${JSON.stringify(opt.s).replace(/"/g, '&quot;')})">${opt.t}</button>`
        ).join('');
    
    const progress = document.getElementById('progress-fill');
    if (progress) progress.style.width = `${((currentQ + 1) / quizData.length) * 100}%`;
};

window.finalizeQuiz = function() {
    let finalScores = {};
    Object.values(userScores).forEach(s => {
        for(let key in s) finalScores[key] = (finalScores[key] || 0) + s[key];
    });
    
    const sorted = Object.keys(finalScores).sort((a,b) => finalScores[b] - finalScores[a]);
    
    const genreMap = {
        'SliceOfLife': 'Slice of Life',
        'Psychological': 'Psychological',
        'Action': 'Action',
        'Adventure': 'Adventure',
        'Comedy': 'Comedy',
        'Drama': 'Drama',
        'Fantasy': 'Fantasy',
        'Horror': 'Horror',
        'Mystery': 'Mystery',
        'Romance': 'Romance',
        'Thriller': 'Thriller'
    };

    const topGenre = genreMap[sorted[0]] || sorted[0] || "Fantasy";
    
    window.closeQuiz();
    
    // The comma ensures the smart parser treats this as a tag search
    if (typeof window.triggerSearch === 'function') {
        window.triggerSearch(topGenre + ",", 1); 
    }
};
  
