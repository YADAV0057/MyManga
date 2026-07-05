// ==========================================
// 1. MOOD ROTATION ENGINE (50 Moods)
// ==========================================
const allMoods = [
    { label: "😊 Happy", query: "Slice of Life, Comedy" },
    { label: "😭 Sad", query: "Drama, Tragedy" },
    { label: "🔥 Hype", query: "Action, Shounen" },
    { label: "🍵 Chill", query: "Iyashikei, Slice of Life" },
    { label: "👻 Spooky", query: "Horror, Psychological" },
    { label: "💕 Romantic", query: "Romance, Shoujo" },
    { label: "🧠 Big Brain", query: "Mystery, Psychological" },
    { label: "✨ Escapism", query: "Isekai, Fantasy" },
    { label: "☕ Cozy", query: "Food, Slice of Life" },
    { label: "📼 Nostalgic", query: "Classic, Retro" },
    { label: "⚡ Adrenaline", query: "Sports, Thriller" },
    { label: "😂 Laugh Out Loud", query: "Gag Comedy, Parody" },
    { label: "🧸 Heartwarming", query: "Childcare, Family" },
    { label: "🌀 Mind-Bending", query: "Sci-Fi, Thriller" },
    { label: "⚔️ Epic", query: "High Fantasy, Adventure" },
    { label: "🎀 Cute", query: "CGDCT" },
    { label: "🖤 Edgy", query: "Dark Fantasy, Anti-hero" },
    { label: "🌟 Inspiring", query: "Coming of Age, Music" },
    { label: "🕵️ Mysterious", query: "Detective, Supernatural" },
    { label: "🏚️ Lonely", query: "Post-Apocalyptic, Survival" },
    { label: "🎸 Rebellious", query: "Delinquent, Action" },
    { label: "🪄 Dreamy", query: "Magical Girl, Fantasy" },
    { label: "⏳ Intense", query: "Survival Game, Death" },
    { label: "🌿 Peaceful", query: "Historical, Nature" },
    { label: "🐶 Wholesome", query: "Animal, Pets" },
    { label: "🥋 Sweaty", query: "Martial Arts, Tournament" },
    { label: "📖 Philosophical", query: "Seinen, Mature" },
    { label: "🤪 Chaotic", query: "Absurdist Comedy, Sci-Fi" },
    { label: "🦇 Gloomy", query: "Vampire, Gothic" },
    { label: "🗡️ Revenge", query: "Villainess, Reincarnation" },
    { label: "🔮 Magical", query: "Witch, Fantasy" },
    { label: "💪 Overpowered", query: "OP Protagonist, Action" },
    { label: "♟️ Strategic", query: "Board Game, Mecha" },
    { label: "🌧️ Melancholic", query: "Music, Drama" },
    { label: "🩹 Hopeful", query: "Medical, Slice of Life" },
    { label: "🕴️ Fearless", query: "Yakuza, Mafia" },
    { label: "🦾 Tech-Savvy", query: "Cyberpunk, Sci-Fi" },
    { label: "🎒 Academic", query: "School Life, Club" },
    { label: "🗺️ Wanderlust", query: "Travel, Adventure" },
    { label: "🚬 Gritty", query: "Crime, Noir" },
    { label: "⛩️ Mythological", query: "Yokai, Gods" },
    { label: "📈 Ambitious", query: "Business, Career" },
    { label: "💔 Heartbroken", query: "Romance Drama, Angst" },
    { label: "🦸 Heroic", query: "Superhero, Action" },
    { label: "👑 Royal", query: "Aristocracy, Historical" },
    { label: "🃏 Mischievous", query: "Prankster, Comedy" },
    { label: "🎖️ Tactical", query: "Military, War" },
    { label: "🕯️ Paranormal", query: "Ghost, Exorcist" },
    { label: "🍳 Gourmet", query: "Cooking, Baking" },
    { label: "🦉 Sleepless", query: "Late Night, Thriller" }
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
    allMoods.forEach(mood => {
        html += createVibeButton(mood);
    });
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
// 2. API AGGREGATOR STACK
// ==========================================
const MANGADEX_TOKEN = "SHgr5UbFSF6HbuRrw4upK3GJeBntQIe0";

async function fetchFromJikan(searchQuery) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(searchQuery)}&limit=1`);
        const data = await response.json();
        return data.data && data.data.length > 0 ? data.data[0] : null; 
    } catch (error) {
        console.error("Jikan API Error:", error);
        return null;
    }
}

async function fetchFromAniList(searchQuery) {
    const query = `
        query ($search: String) {
            Media (search: $search, type: MANGA) {
                id
                title { romaji english }
                averageScore
                popularity
                genres
            }
        }
    `;
    const variables = { search: searchQuery };

    try {
        const response = await fetch('https://graphql.anilist.co', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query, variables })
        });
        const data = await response.json();
        return data.data ? data.data.Media : null;
    } catch (error) {
        console.error("AniList API Error:", error);
        return null;
    }
}

async function fetchFromMangaDex(searchQuery) {
    try {
        const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(searchQuery)}&includes[]=cover_art&limit=1`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MANGADEX_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const manga = data.data[0];
            const mangaId = manga.id;
            const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
            const coverFileName = coverArt?.attributes?.fileName;
            
            const coverUrl = coverFileName ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}` : "";
            const readLink = `https://mangadex.org/title/${mangaId}`;
            
            return { coverUrl, readLink };
        }
        return null;
    } catch (error) {
        console.error("MangaDex API Error:", error);
        return null;
    }
}

// ==========================================
// 3. DATA NORMALIZATION PIPELINE
// ==========================================
async function normalizeMangaData(searchQuery) {
    const [jikanData, aniListData, mangadexData] = await Promise.all([
        fetchFromJikan(searchQuery),
        fetchFromAniList(searchQuery),
        fetchFromMangaDex(searchQuery)
    ]);

    return {
        title: jikanData?.title || aniListData?.title?.english || searchQuery,
        globalScore: aniListData?.averageScore || "N/A",
        rawGenres: aniListData?.genres || jikanData?.genres?.map(g => g.name) || [],
        coverUrl: mangadexData?.coverUrl || "https://via.placeholder.com/220x300?text=No+Cover",
        officialLink: mangadexData?.readLink || "#"
    };
}

// ==========================================
// 4. UI INTERACTION LOGIC
// ==========================================
async function triggerSearch(query) {
    if (!query) return;

    const grid = document.getElementById('community-grid');
    grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Summoning official metadata...</p>';

    document.getElementById('results-area').scrollIntoView({ behavior: 'smooth' });

    try {
        const factSheet = await normalizeMangaData(query);
        
        if (factSheet && factSheet.title !== query) {
            renderMangaCard(factSheet);
        } else {
            grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">No official API data found for this vibe.</p>';
        }
    } catch (error) {
        console.error("Aggregation Error:", error);
        grid.innerHTML = '<p style="text-align:center; width:100%; color: #ef4444;">An error occurred fetching API data.</p>';
    }
}

function renderMangaCard(factSheet) {
    const grid = document.getElementById('community-grid');
    grid.innerHTML = ''; 

    const card = document.createElement('a');
    card.className = 'manga-card';
    card.href = factSheet.officialLink;
    card.target = '_blank';

    const genresText = factSheet.rawGenres.length > 0 ? factSheet.rawGenres.slice(0, 3).join(' • ') : "Various";
    
    let formattedScore = "N/A";
    if (factSheet.globalScore !== "N/A") {
        formattedScore = factSheet.globalScore + "%";
    }

    card.innerHTML = `
        <div class="manga-cover-container">
            <img src="${factSheet.coverUrl}" alt="${factSheet.title}" class="manga-cover" loading="lazy">
            <div class="score-badge">⭐ ${formattedScore}</div>
        </div>
        <div class="manga-info">
            <h3 class="manga-title" title="${factSheet.title}">${factSheet.title}</h3>
            <p class="manga-meta">${genresText}</p>
        </div>
    `;

    grid.appendChild(card);
}

// Event Listeners for Custom Search Input Box
const searchBtn = document.getElementById('search-submit-btn');
if(searchBtn) {
    searchBtn.addEventListener('click', () => {
        const query = document.getElementById('manga-search-input').value;
        triggerSearch(query);
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
