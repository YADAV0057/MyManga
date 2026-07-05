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
// Track seen manga during the current session to prevent mood overlap
const seenMangaSession = new Set(); 

function createVibeButton(moodObj) {
    return `<button class="vibe-btn" onclick="triggerSearch('${moodObj.query}')">${moodObj.label}</button>`;
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

function toggleTags() {
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
}

window.addEventListener('DOMContentLoaded', () => {
    populateAllVibes();
    updateRotatingVibes();
    rotationInterval = setInterval(updateRotatingVibes, 30000);
});

// ==========================================
// 2. UNLIMITED API AGGREGATOR STACK
// ==========================================

async function fetchTypoFallbackFromJikan(searchQuery) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(searchQuery)}&limit=1`);
        const data = await response.json();
        return data.data && data.data.length > 0 ? data.data[0].title : null;
    } catch (e) {
        return null;
    }
}

async function fetchFromAniList(searchQuery, isKorean = false, limit = 10, isVibe = false) {
    const countryFilter = isKorean ? ', countryOfOrigin: "KR"' : '';
    let query, variables;

    // isAdult: false added to strictly remove hentai/explicit content
    if (isVibe) {
        const genres = searchQuery.split(',').map(g => g.trim());
        query = `
            query ($genres: [String]) {
                Page(page: 1, perPage: ${limit}) {
                    media(genre_in: $genres, type: MANGA, sort: POPULARITY_DESC, isAdult: false${countryFilter}) {
                        id title { romaji english } averageScore genres description(asHtml: false) coverImage { large } chapters status
                    }
                }
            }
        `;
        variables = { genres: genres };
    } else {
        query = `
            query ($search: String) {
                Page(page: 1, perPage: ${limit}) {
                    media(search: $search, type: MANGA, sort: [SEARCH_MATCH, POPULARITY_DESC], isAdult: false${countryFilter}) {
                        id title { romaji english } averageScore genres description(asHtml: false) coverImage { large } chapters status
                    }
                }
            }
        `;
        variables = { search: searchQuery };
    }

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
// 3. UI INTERACTION LOGIC
// ==========================================

function formatStatus(status) {
    if (status === "FINISHED") return "Completed";
    if (status === "RELEASING") return "Ongoing";
    if (status === "CANCELLED") return "Dropped";
    if (status === "HIATUS") return "Hiatus";
    return "Unknown";
}

window.toggleOptions = function(id) {
    const overlay = document.getElementById(`overlay-${id}`);
    if(overlay) overlay.classList.toggle('active');
}

window.toggleSynopsis = function(element) {
    element.classList.toggle('expanded');
}

async function triggerSearch(query) {
    if (!query) return;

    const grid = document.getElementById('community-grid');
    const loadingBar = document.getElementById('loading-bar');
    
    loadingBar.classList.add('is-loading');
    grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Curating metadata...</p>';
    document.getElementById('results-area').scrollIntoView({ behavior: 'smooth' });

    try {
        const isVibe = allMoods.some(mood => mood.query === query);
        let finalResults = [];

        if (isVibe) {
            // Fetch a larger pool (25 results each) so we can randomize and filter
            const [koreanResults, globalResults] = await Promise.all([
                fetchFromAniList(query, true, 25, true),
                fetchFromAniList(query, false, 25, true)
            ]);
            
            // Combine and filter out manga we've already seen in this session
            let combinedPool = [...koreanResults, ...globalResults]
                .filter(item => !seenMangaSession.has(item.id));
            
            // Deduplicate the combined pool
            combinedPool = Array.from(new Map(combinedPool.map(item => [item.id, item])).values());

            // If we ran out of unseen manga, reset the cache for this session
            if (combinedPool.length < 10) {
                seenMangaSession.clear();
                combinedPool = Array.from(new Map([...koreanResults, ...globalResults].map(item => [item.id, item])).values());
            }

            // The 7/3 Split Logic: Keep top 7 absolute most famous, randomize the remaining 3 slots
            const top7 = combinedPool.slice(0, 7);
            const remainingPool = combinedPool.slice(7);
            
            // Shuffle the remaining pool
            for (let i = remainingPool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [remainingPool[i], remainingPool[j]] = [remainingPool[j], remainingPool[i]];
            }
            
            const random3 = remainingPool.slice(0, 3);
            finalResults = [...top7, ...random3];
            
            // Log these as seen
            finalResults.forEach(item => seenMangaSession.add(item.id));

        } else {
            // Title searches just fetch the exact 10 best matches
            finalResults = await fetchFromAniList(query, false, 10, false);
            
            if (!finalResults || finalResults.length === 0) {
                const correctedTitle = await fetchTypoFallbackFromJikan(query);
                if (correctedTitle) {
                    finalResults = await fetchFromAniList(correctedTitle, false, 10, false);
                }
            }
        }
        
        if (!finalResults || finalResults.length === 0) {
            grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">No official API data found for this search.</p>';
            loadingBar.classList.remove('is-loading');
            return;
        }

        grid.innerHTML = ''; 

        finalResults.forEach((aniManga) => {
            const title = aniManga.title.english || aniManga.title.romaji;
            const cleanSynopsis = aniManga.description ? aniManga.description.replace(/<[^>]*>?/gm, '') : "No synopsis available.";

            const factSheet = {
                id: aniManga.id,
                title: title,
                globalScore: aniManga.averageScore || "N/A",
                rawGenres: aniManga.genres || [],
                coverUrl: aniManga.coverImage?.large || "https://via.placeholder.com/220x300?text=No+Cover",
                synopsis: cleanSynopsis,
                status: formatStatus(aniManga.status),
                chapters: aniManga.chapters ? `${aniManga.chapters} Chp.` : "N/A"
            };

            renderMangaCard(factSheet);
        });

    } catch (error) {
        console.error("Aggregation Error:", error);
        grid.innerHTML = '<p style="text-align:center; width:100%; color: #ef4444;">An error occurred fetching API data.</p>';
    } finally {
        loadingBar.classList.remove('is-loading');
    }
}

function renderMangaCard(factSheet) {
    const grid = document.getElementById('community-grid');
    const card = document.createElement('div');
    card.className = 'manga-card';

    const genresText = factSheet.rawGenres.length > 0 ? factSheet.rawGenres.slice(0, 3).join(' • ') : "Various";
    const formattedScore = factSheet.globalScore !== "N/A" ? factSheet.globalScore + "%" : "N/A";
    
    const encodedTitle = encodeURIComponent(factSheet.title);
    
    // Stripping special characters for Manganato's specific search routing
    const cleanTitleForNato = factSheet.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_');

    card.innerHTML = `
        <div class="manga-cover-container" onclick="toggleOptions('${factSheet.id}')">
            <img src="${factSheet.coverUrl}" alt="${factSheet.title}" class="manga-cover" loading="lazy">
            <div class="score-badge">⭐ ${formattedScore}</div>
            
            <div class="read-options" id="overlay-${factSheet.id}">
                <span style="color: white; margin-bottom: 5px; font-weight: 600;">Read on:</span>
                <a href="https://comick.io/search?q=${encodedTitle}" target="_blank" class="read-link-btn" onclick="event.stopPropagation()">Comick</a>
                <a href="https://bato.to/search?word=${encodedTitle}" target="_blank" class="read-link-btn" onclick="event.stopPropagation()">Bato.to</a>
                <a href="https://mangadex.org/search?q=${encodedTitle}" target="_blank" class="read-link-btn" onclick="event.stopPropagation()">MangaDex</a>
                <a href="https://manganato.com/search/story/${cleanTitleForNato}" target="_blank" class="read-link-btn" onclick="event.stopPropagation()">Manganato</a>
                <a href="https://www.google.com/search?q=Read+${encodedTitle}+manga+online+free" target="_blank" class="read-link-btn" style="background: #4cca51;" onclick="event.stopPropagation()">Web Search</a>
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

// Event Listeners
const searchBtn = document.getElementById('search-submit-btn');
if(searchBtn) {
    searchBtn.addEventListener('click', () => {
        triggerSearch(document.getElementById('manga-search-input').value);
    });
}

const searchInput = document.getElementById('manga-search-input');
if(searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            triggerSearch(e.target.value);
        }
    });
}
