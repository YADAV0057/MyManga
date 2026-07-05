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
// 2. SMART DUAL-API AGGREGATOR STACK
// ==========================================

// Added isVibe flag to change how the API searches
async function fetchFromAniList(searchQuery, isKorean = false, limit = 10, isVibe = false) {
    const countryFilter = isKorean ? ', countryOfOrigin: "KR"' : '';
    let query, variables;

    if (isVibe) {
        // VIBE SEARCH: Search by genre, sort by popularity
        const genres = searchQuery.split(',').map(g => g.trim());
        query = `
            query ($genres: [String]) {
                Page(page: 1, perPage: ${limit}) {
                    media(genre_in: $genres, type: MANGA, sort: POPULARITY_DESC${countryFilter}) {
                        id title { romaji english } averageScore genres description(asHtml: false) coverImage { large } chapters status
                    }
                }
            }
        `;
        variables = { genres: genres };
    } else {
        // TITLE SEARCH: Search exact text, sort by best match (removes country barriers)
        query = `
            query ($search: String) {
                Page(page: 1, perPage: ${limit}) {
                    media(search: $search, type: MANGA, sort: SEARCH_MATCH) {
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

async function fetchMangaDexData(title) {
    try {
        // Removed the strict English filter to ensure we still get cover art even for raw/untranslated works
        const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&includes[]=cover_art&limit=1`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const manga = data.data[0];
            const mangaId = manga.id;
            const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
            const coverFileName = coverArt?.attributes?.fileName;
            
            const coverUrl = coverFileName ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}` : null;
            return { coverUrl };
        }
        return null;
    } catch (error) {
        return null;
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

async function triggerSearch(query) {
    if (!query) return;

    const grid = document.getElementById('community-grid');
    const loadingBar = document.getElementById('loading-bar');
    
    loadingBar.classList.add('is-loading');
    grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Curating metadata...</p>';
    document.getElementById('results-area').scrollIntoView({ behavior: 'smooth' });

    try {
        // Detect if the query matches our predefined vibes
        const isVibe = allMoods.some(mood => mood.query === query);
        let uniqueResults = [];

        if (isVibe) {
            // Vibe Search: Combine 5 Korean and 5 Global
            const [koreanResults, globalResults] = await Promise.all([
                fetchFromAniList(query, true, 5, true),
                fetchFromAniList(query, false, 5, true)
            ]);
            const combinedResults = [...koreanResults, ...globalResults];
            uniqueResults = Array.from(new Map(combinedResults.map(item => [item.id, item])).values()).slice(0, 10);
        } else {
            // Title Search: Search for the exact phrase without country restrictions
            uniqueResults = await fetchFromAniList(query, false, 10, false);
        }
        
        if (!uniqueResults || uniqueResults.length === 0) {
            grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">No official API data found for this search.</p>';
            loadingBar.classList.remove('is-loading');
            return;
        }

        const mdPromises = uniqueResults.map(aniManga => {
            const title = aniManga.title.english || aniManga.title.romaji;
            return fetchMangaDexData(title);
        });
        const mdResults = await Promise.all(mdPromises);

        grid.innerHTML = ''; 

        uniqueResults.forEach((aniManga, index) => {
            const title = aniManga.title.english || aniManga.title.romaji;
            const mdData = mdResults[index];
            
            const cleanSynopsis = aniManga.description 
                ? aniManga.description.replace(/<[^>]*>?/gm, '') 
                : "No synopsis available.";

            // Dynamic Reading Link: Pointing to a high-volume reading aggregator
            const readUrl = `https://comick.io/search?q=${encodeURIComponent(title)}`;

            const factSheet = {
                title: title,
                globalScore: aniManga.averageScore || "N/A",
                rawGenres: aniManga.genres || [],
                coverUrl: mdData?.coverUrl || aniManga.coverImage?.large || "https://via.placeholder.com/220x300?text=No+Cover",
                officialLink: readUrl,
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
    const card = document.createElement('a');
    card.className = 'manga-card';
    card.href = factSheet.officialLink;
    card.target = '_blank';

    const genresText = factSheet.rawGenres.length > 0 ? factSheet.rawGenres.slice(0, 3).join(' • ') : "Various";
    const formattedScore = factSheet.globalScore !== "N/A" ? factSheet.globalScore + "%" : "N/A";

    card.innerHTML = `
        <div class="manga-cover-container">
            <img src="${factSheet.coverUrl}" alt="${factSheet.title}" class="manga-cover" loading="lazy">
            <div class="score-badge">⭐ ${formattedScore}</div>
        </div>
        <div class="manga-info">
            <h3 class="manga-title" title="${factSheet.title}">${factSheet.title}</h3>
            <p class="manga-meta">${genresText}</p>
            
            <div class="manga-facts">
                <span>📚 ${factSheet.chapters}</span>
                <span>📌 ${factSheet.status}</span>
            </div>

            <p class="manga-synopsis" title="${factSheet.synopsis}">
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
