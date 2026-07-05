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

// Initialize Firebase
const app = initializeApp(firebaseConfig); 
const db = getFirestore(app); 
const analytics = getAnalytics(app);

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

// FIX: Attached to window so HTML onClick works with Modules
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

window.addEventListener('DOMContentLoaded', () => {
    populateAllVibes();
    updateRotatingVibes();
    rotationInterval = setInterval(updateRotatingVibes, 30000);
    
    const refreshBtn = document.getElementById('refresh-btn');
    if(refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            currentActivePage++;
            window.triggerSearch(currentActiveQuery, currentActivePage);
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
    let mediaArgs = `type: MANGA, sort: POPULARITY_DESC, isAdult: false${countryFilter}`;
    let variables = { page: page, perPage: limit };

    if (parsedData.isVibeOrTag) {
        queryArgs += `, $genres: [String]`;
        mediaArgs += `, genre_in: $genres`;
        variables.genres = parsedData.cleanQuery.split(',').map(g => g.trim()).filter(g => g.length > 0);
    } else if (parsedData.cleanQuery.length > 0) {
        queryArgs += `, $search: String`;
        mediaArgs += `, search: $search, sort: [SEARCH_MATCH, POPULARITY_DESC]`; 
        variables.search = parsedData.cleanQuery;
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
        const data = await response.json();
        return data.data ? data.data.Page.media : [];
    } catch (error) {
        console.error("AniList API Error:", error);
        return [];
    }
}

// ==========================================
// 3. PROFESSIONAL-GRADE AGGREGATOR READ LINK RESOLVER
// ==========================================

async function resolveReadLinks(title) {
    const encodedTitle = encodeURIComponent(title);
    let validLinks = [];

    // 1. Live Check MangaDex API (Free, high-confidence source of truth)
    try {
        const mdRes = await fetch(`https://api.mangadex.org/manga?title=${encodedTitle}&limit=1`);
        const mdData = await mdRes.json();
        if(mdData.data && mdData.data.length > 0) {
            validLinks.push({ 
                name: "📖 MangaDex (Verified)", 
                url: `https://mangadex.org/title/${mdData.data[0].id}`,
                isValidated: true 
            });
        }
    } catch(e) {
        console.log("MangaDex check failed.");
    }

    // 2. High-Confidence Search Routing (Zero dead list guesses, deep query mapping)
    validLinks.push({ name: "🔍 Manganato", url: `https://manganato.com/search/story/${encodedTitle}`, isValidated: false });
    validLinks.push({ name: "🔍 Bato.to", url: `https://bato.to/search?word=${encodedTitle}`, isValidated: false });
    
    // 3. Absolute Web Search Fallback (Guarantees infinite discovery)
    validLinks.push({ name: "🌐 Google Search", url: `https://www.google.com/search?q=Read+${encodedTitle}+manga+online`, isValidated: false });

    return validLinks;
}

// ==========================================
// 4. CORE ENGINE CORE ENGINE
// ==========================================

window.triggerSearch = async function(rawQuery, page = 1) {
    if (!rawQuery) return;

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

        // FIREBASE LOGIC: Check Cache First
        const docRef = doc(db, "searches", cacheKey);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log("Loaded from Firebase Cache!");
            finalResults = docSnap.data().results;
        } else {
            console.log("Not in Cache. Fetching from APIs...");
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

            // FIREBASE LOGIC: Save to Cache
            if (finalResults && finalResults.length > 0) {
                await setDoc(docRef, { results: finalResults });
            }
        }
        
        if (!finalResults || finalResults.length === 0) {
            grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">No official API data found for this search. Try a different page or filter!</p>';
            loadingBar.classList.remove('is-loading');
            return;
        }

        grid.innerHTML = ''; 
        refreshBtn.style.display = 'block'; 

        // Use sequential execution to preserve accurate link checks per card safely
        for (const aniManga of finalResults) {
            const title = aniManga.title.english || aniManga.title.romaji;
            const cleanSynopsis = aniManga.description ? aniManga.description.replace(/<[^>]*>?/gm, '') : "No synopsis available.";
            
            const generatedLinks = await resolveReadLinks(title);

            const factSheet = {
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

            renderMangaCard(factSheet);
        }

    } catch (error) {
        console.error("Aggregation Error:", error);
        grid.innerHTML = '<p style="text-align:center; width:100%; color: #ef4444;">An error occurred connecting to the database.</p>';
    } finally {
        loadingBar.classList.remove('is-loading');
    }
};

function renderMangaCard(factSheet) {
    const grid = document.getElementById('community-grid');
    const card = document.createElement('div');
    card.className = 'manga-card';

    const genresText = factSheet.rawGenres.length > 0 ? factSheet.rawGenres.slice(0, 3).join(' • ') : "Various";
    const formattedScore = factSheet.globalScore !== "N/A" ? factSheet.globalScore + "%" : "N/A";
    
    let linksHtml = '';
    factSheet.readLinks.forEach((link) => {
        // Distinct emerald green color theme for live-validated links, high-confidence grey for searches, flat red for catch-all Google
        const linkBg = link.isValidated 
            ? '#22c55e' 
            : (link.name === "🌐 Google Search" ? '#ef4444' : '#64748b');
            
        linksHtml += `
            <a href="${link.url}" target="_blank" class="read-link-btn" style="background: ${linkBg}; color: #ffffff;" onclick="event.stopPropagation()">
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

// Event Listeners for Search
const searchBtn = document.getElementById('search-submit-btn');
if(searchBtn) {
    searchBtn.addEventListener('click', () => {
        window.triggerSearch(document.getElementById('manga-search-input').value, 1);
    });
}

const searchInput = document.getElementById('manga-search-input');
if(searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            window.triggerSearch(e.target.value, 1);
        }
    });
}
