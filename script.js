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

// Keep Firebase init isolated: a blocked Analytics call (ad blockers, privacy
// extensions) should never be able to take the entire app down with it.
let app, db, analytics;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error("CRITICAL: Firebase core init failed. Caching will be disabled.", e);
}

try {
    if (app) analytics = getAnalytics(app);
} catch (e) {
    console.warn("Analytics blocked or failed (likely an ad blocker) — continuing without it.", e);
}

function generateCacheKey(query, page) {
    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return `search_${cleanQuery}_page_${page}`;
}

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
let currentActiveQuery = "";
let currentActivePage = 1;

function createVibeButton(moodObj) {
    return `<button class="vibe-btn" onclick="triggerSearch('${moodObj.query}', 1)">${moodObj.label}</button>`;
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

// Attached to window so inline HTML onclick="" attributes work with ES modules
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

// FIX: These were called from renderMangaCard's inline HTML but never defined,
// so clicking a cover or a synopsis silently did nothing.
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
            currentActivePage++;
            window.triggerSearch(currentActiveQuery, currentActivePage);
        });
    }

    // Event Listeners for Search (moved inside DOMContentLoaded so they don't
    // silently fail to attach if this script ever runs before the DOM is ready)
    const searchBtn = document.getElementById('search-submit-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            window.triggerSearch(document.getElementById('manga-search-input').value, 1);
        });
    }

    const searchInput = document.getElementById('manga-search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.triggerSearch(e.target.value, 1);
            }
        });
    }
});

// ==========================================
// 2. SMART PARSER & API STACK
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

    const isVibeOrTag = cleanQuery.includes(',') || allMoods.some(mood => mood.query === cleanQuery);
    return { cleanQuery, statusFilter, isVibeOrTag };
}

async function fetchFromAniListUnified(parsedData, page = 1, isKorean = false, limit = 10) {
    const countryFilter = isKorean ? ', countryOfOrigin: "KR"' : '';
    let queryArgs = `$page: Int, $perPage: Int`;
    // NOTE: 'sort' is intentionally left out here — it's added exactly once below,
    // based on which branch runs. Setting it here AND in the search branch caused
    // a duplicate 'sort' key in the GraphQL args, which AniList rejects outright,
    // silently breaking every typed (non-mood) search.
    let mediaArgs = `type: MANGA, isAdult: false${countryFilter}`;
    let variables = { page: page, perPage: limit };

    if (parsedData.isVibeOrTag) {
        queryArgs += `, $genres: [String]`;
        mediaArgs += `, genre_in: $genres, sort: POPULARITY_DESC`;
        variables.genres = parsedData.cleanQuery.split(',').map(g => g.trim()).filter(g => g.length > 0);
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
// 3. READ LINK RESOLVER
// ==========================================

async function resolveReadLinks(title) {
    const encodedTitle = encodeURIComponent(title);
    let validLinks = [];

    // Live-check MangaDex API (free, high-confidence source of truth)
    try {
        const mdRes = await fetch(`https://api.mangadex.org/manga?title=${encodedTitle}&limit=1`);
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
        console.log("MangaDex check failed for:", title, e);
    }

    // Search-routing fallbacks (no live validation, but always resolve to something)
    // Original Links
validLinks.push({ name: "🌐 Google Search", url: `https://www.google.com/search?q=Read+${encodedTitle}+manga+online`, isValidated: false });

  return validLinks;
}
// ==========================================
// 3b. TYPO-TOLERANCE (MangaDex title suggestions)
// ==========================================

// MangaDex's title search tolerates misspellings much better than AniList's,
// so on a zero-result AniList search we borrow it purely for suggestions.
async function suggestTitlesFromMangaDex(query, limit = 5) {
    try {
        const res = await fetch(`https://api.mangadex.org/manga?title=${encodeURIComponent(query)}&limit=${limit}`);
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.data) return [];

        return data.data
            .map(m => {
                const titles = m.attributes?.title || {};
                return titles.en || Object.values(titles)[0] || null;
            })
            .filter(Boolean);
    } catch (e) {
        console.warn("MangaDex suggestion lookup failed:", e);
        return [];
    }
}

// ==========================================
// 4. CORE ENGINE
// ==========================================

let isSearching = false; // Prevents overlapping searches from racing each other

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
    if (!rawQuery) return;
    if (isSearching) return; // Ignore rapid double-clicks / double Enter presses
    isSearching = true;

    currentActiveQuery = rawQuery;
    currentActivePage = page;

    const grid = document.getElementById('community-grid');
    const loadingBar = document.getElementById('loading-bar');
    const refreshBtn = document.getElementById('refresh-btn');

    loadingBar.classList.add('is-loading');
    refreshBtn.style.display = 'none';
    grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Checking database...</p>';
    document.getElementById('results-area').scrollIntoView({ behavior: 'smooth' });

    try {
        const parsedQuery = parseSmartQuery(rawQuery);
        const cacheKey = generateCacheKey(rawQuery, page);
        let finalResults = [];

        // FIREBASE LOGIC: Check cache first (skipped gracefully if db failed to init)
        let docSnap = null;
        if (db) {
            try {
                const docRef = doc(db, "searches", cacheKey);
                docSnap = await getDoc(docRef);
            } catch (e) {
                console.warn("Firestore read failed, falling back to live API:", e);
            }
        }

        if (docSnap && docSnap.exists()) {
            console.log("Loaded from Firebase cache.");
            finalResults = docSnap.data().results;
        } else {
            console.log("Not in cache (or cache unavailable). Fetching from APIs...");
            grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Curating fresh metadata...</p>';

            if (parsedQuery.isVibeOrTag) {
                const [koreanResults, globalResults] = await Promise.all([
                    fetchFromAniListUnified(parsedQuery, page, true, 5),
                    fetchFromAniListUnified(parsedQuery, page, false, 5)
                ]);
                finalResults = [...koreanResults, ...globalResults];
                finalResults = Array.from(new Map(finalResults.map(item => [item.id, item])).values());
            } else {
                finalResults = await fetchFromAniListUnified(parsedQuery, page, false, 10);
            }

            // FIREBASE LOGIC: Save to cache (best-effort, non-blocking failure)
            if (db && finalResults && finalResults.length > 0) {
                try {
                    const docRef = doc(db, "searches", cacheKey);
                    await setDoc(docRef, { results: finalResults });
                } catch (e) {
                    console.warn("Firestore write failed (results still shown to user):", e);
                }
            }
        }

        // TYPO TOLERANCE: if the exact query drew a blank (and it's a plain
        // text search, not a mood/tag), ask MangaDex for close title matches.
        // If it has a strong guess, silently retry AniList with that guess;
        // either way, keep the alternatives so the user can pick one.
        let suggestions = [];
        let usedFallbackQuery = null;

        if ((!finalResults || finalResults.length === 0) && !parsedQuery.isVibeOrTag && parsedQuery.cleanQuery.trim().length > 1) {
            suggestions = await suggestTitlesFromMangaDex(parsedQuery.cleanQuery);

            if (suggestions.length > 0) {
                const topGuess = suggestions[0];
                const retryResults = await fetchFromAniListUnified(
                    { cleanQuery: topGuess, statusFilter: parsedQuery.statusFilter, isVibeOrTag: false },
                    page, false, 10
                );
                if (retryResults.length > 0) {
                    finalResults = retryResults;
                    usedFallbackQuery = topGuess;
                }
            }
        }

        if (!finalResults || finalResults.length === 0) {
            grid.innerHTML = '';
            if (suggestions.length > 0) {
                renderDidYouMean(rawQuery, suggestions);
            } else {
                grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">No official API data found for this search. Try a different page or filter!</p>';
            }
            return;
        }

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

// Shown when the exact query returned nothing, but MangaDex has close
// title matches — lets the user pick the right one themselves.
function renderDidYouMean(originalQuery, suggestions) {
    const grid = document.getElementById('community-grid');
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 20px;';

    let chipsHtml = suggestions.map(s =>
        `<button class="vibe-btn" onclick="triggerSearch('${s.replace(/'/g, "\\'")}', 1)">${s}</button>`
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

// Shown when we auto-corrected the query and found results under a
// different spelling — keeps the swap transparent instead of silent.
function renderFallbackBanner(originalQuery, usedQuery, otherSuggestions) {
    const grid = document.getElementById('community-grid');
    const banner = document.createElement('div');
    banner.style.cssText = 'grid-column: 1 / -1; text-align: center; padding: 10px 0 20px 0;';

    let altHtml = otherSuggestions.length > 0
        ? `<div style="margin-top:8px; display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
             ${otherSuggestions.map(s => `<button class="vibe-btn" style="padding:6px 14px; font-size:0.85rem;" onclick="triggerSearch('${s.replace(/'/g, "\\'")}', 1)">${s}</button>`).join(' ')}
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
    const card = document.createElement('div');
    card.className = 'manga-card';

    const genresText = factSheet.rawGenres.length > 0 ? factSheet.rawGenres.slice(0, 3).join(' • ') : "Various";
    const formattedScore = factSheet.globalScore !== "N/A" ? factSheet.globalScore + "%" : "N/A";

    let linksHtml = '';
    factSheet.readLinks.forEach((link) => {
        const linkBg = link.isValidated
            ? '#22c55e'
            : (link.name === "🌐 Google Search" ? '#ef4444' : '#64748b');

        linksHtml += `
            <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="read-link-btn" style="background: ${linkBg}; color: #ffffff;" onclick="event.stopPropagation()">
               ${link.name}
            </a>`;
    });

    card.innerHTML = `
        <div class="manga-cover-container" onclick="toggleOptions('${factSheet.id}')">
            <img src="${factSheet.coverUrl}" alt="${factSheet.title}" class="manga-cover" loading="lazy">
            <div class="score-badge">⭐ ${formattedScore}</div>
            <div class="read-options" id="overlay-${factSheet.id}">
                <span style="color: white; margin-bottom: 5px; font-weight: 600;">Available Sources:</span>
                ${linksHtml}
            </div>
        </div>
        <div class="manga-info">
            <h3 class="manga-title" title="${factSheet.title}">${factSheet.title}</h3>
            <p class="manga-meta">${genresText}</p>
            <div class="manga-facts">
                <span>📚 ${factSheet.chapters}</span>
                <span>📌 ${factSheet.status}</span>
            </div>
            <p class="manga-synopsis" onclick="toggleSynopsis(this)" title="Click to read full description">
                ${factSheet.synopsis}
            </p>
        </div>
    `;
    grid.appendChild(card);
  
}

// --- Mood Quiz Engine ---
const quizData = [
    { q: "How are you feeling today?", o: [{t: "😊 Happy", s: {Comedy: 2, SliceOfLife: 2}}, {t: "😢 Sad", s: {Drama: 3, Psychological: 2}}, {t: "😌 Relaxed", s: {SliceOfLife: 3, Fantasy: 1}}, {t: "🔥 Excited", s: {Action: 3, Adventure: 2}}, {t: "🤔 Thoughtful", s: {Mystery: 3, Psychological: 2}}, {t: "😴 Tired", s: {SliceOfLife: 2, Fantasy: 1}}] },
    { q: "What kind of story do you want?", o: [{t: "⚔️ Action", s: {Action: 3}}, {t: "💕 Romance", s: {Romance: 3}}, {t: "😂 Comedy", s: {Comedy: 3}}, {t: "👻 Horror", s: {Horror: 3}}, {t: "✨ Fantasy", s: {Fantasy: 3}}, {t: "🕵 Mystery", s: {Mystery: 3}}] },
    { q: "How much time do you have?", o: [{t: "📖 Short", s: {SliceOfLife: 2}}, {t: "📚 Medium", s: {Adventure: 2}}, {t: "📚📚 Long", s: {Fantasy: 3, Action: 1}}, {t: "🎲 Doesn't matter", s: {}}] },
    { q: "How intense should it be?", o: [{t: "🌿 Relaxing", s: {SliceOfLife: 3}}, {t: "⚡ Balanced", s: {Adventure: 2, Action: 1}}, {t: "🔥 Very Intense", s: {Psychological: 3, Thriller: 3}}] },
    { q: "Pick your ending.", o: [{t: "😊 Happy", s: {Comedy: 2}}, {t: "😭 Emotional", s: {Drama: 3}}, {t: "🤯 Mind-blowing", s: {Psychological: 3}}, {t: "🎲 Surprise", s: {}}] }
];

let currentQ = 0; let userScores = {};

window.openQuiz = () => { document.getElementById('quiz-modal').style.display = 'flex'; renderQ(); };
window.closeQuiz = () => { document.getElementById('quiz-modal').style.display = 'none'; };

function renderQ() {
    const data = quizData[currentQ];
    const container = document.getElementById('quiz-content');
    container.innerHTML = `<h3>${data.q}</h3>` + data.o.map(opt => `<button class="quiz-option" onclick="selectOpt(this, ${JSON.stringify(opt.s)})">${opt.t}</button>`).join('');
    document.getElementById('progress-fill').style.width = `${(currentQ / quizData.length) * 100}%`;
}

window.selectOpt = (btn, score) => {
    document.querySelectorAll('.quiz-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    userScores[currentQ] = score;
};

window.nextQuestion = () => {
    if (currentQ < quizData.length - 1) { currentQ++; renderQ(); }
    else { finalizeQuiz(); }
};

function finalizeQuiz() {
    let finalScores = {};
    Object.values(userScores).forEach(s => {
        for(let key in s) finalScores[key] = (finalScores[key] || 0) + s[key];
    });
    const topGenres = Object.keys(finalScores).sort((a,b) => finalScores[b] - finalScores[a]).slice(0, 2).join(', ');
    closeQuiz();
    triggerSearch(topGenres, 1);
}

// Hook up the button in DOMContentLoaded
document.getElementById('mood-quiz-btn').addEventListener('click', openQuiz);
