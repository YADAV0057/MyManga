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
// 2. UPGRADED API AGGREGATOR STACK
// ==========================================

// Fetches an array of 10 results instead of 1
async function fetchFromAniList(searchQuery) {
    const query = `
        query ($search: String) {
            Page(page: 1, perPage: 10) {
                media(search: $search, type: MANGA, sort: POPULARITY_DESC) {
                    id
                    title { romaji english }
                    averageScore
                    genres
                    description(asHtml: false)
                    coverImage { large }
                }
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
        return data.data ? data.data.Page.media : [];
    } catch (error) {
        console.error("AniList API Error:", error);
        return [];
    }
}

// Searches MangaDex by title to get the Read Link (Token removed to fix 401 error)
async function fetchMangaDexData(title) {
    try {
        const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(title)}&includes[]=cover_art&limit=1`;
        const response = await fetch(url); // No authorization header needed for public search
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const manga = data.data[0];
            const mangaId = manga.id;
            const coverArt = manga.relationships.find(rel => rel.type === 'cover_art');
            const coverFileName = coverArt?.attributes?.fileName;
            
            const coverUrl = coverFileName ? `https://uploads.mangadex.org/covers/${mangaId}/${coverFileName}` : null;
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
// 3. UI INTERACTION LOGIC
// ==========================================
async function triggerSearch(query) {
    if (!query) return;

    const grid = document.getElementById('community-grid');
    grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Summoning official metadata...</p>';
    document.getElementById('results-area').scrollIntoView({ behavior: 'smooth' });

    try {
        // Fetch up to 10 mangas based on the vibe/query
        const aniListResults = await fetchFromAniList(query);
        
        if (!aniListResults || aniListResults.length === 0) {
            grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">No official API data found for this vibe.</p>';
            return;
        }

        grid.innerHTML = ''; // Clear loading text

        // Loop through all 10 results and render them
        for (const aniManga of aniListResults) {
            const title = aniManga.title.english || aniManga.title.romaji;
            
            // Try to find MangaDex link for this specific title
            const mdData = await fetchMangaDexData(title);
            
            // Strip HTML tags from AniList's description for a clean synopsis
            const cleanSynopsis = aniManga.description 
                ? aniManga.description.replace(/<[^>]*>?/gm, '') 
                : "No synopsis available.";

            const factSheet = {
                title: title,
                globalScore: aniManga.averageScore || "N/A",
                rawGenres: aniManga.genres || [],
                // Fallback to AniList cover if MangaDex fails
                coverUrl: mdData?.coverUrl || aniManga.coverImage?.large || "https://via.placeholder.com/220x300?text=No+Cover",
                // Fallback to AniList page if MangaDex link is missing (fixes the '#' loop bug)
                officialLink: mdData?.readLink || `https://anilist.co/manga/${aniManga.id}`,
                synopsis: cleanSynopsis
            };

            renderMangaCard(factSheet);
        }

    } catch (error) {
        console.error("Aggregation Error:", error);
        grid.innerHTML = '<p style="text-align:center; width:100%; color: #ef4444;">An error occurred fetching API data.</p>';
    }
}

function renderMangaCard(factSheet) {
    const grid = document.getElementById('community-grid');

    const card = document.createElement('a');
    card.className = 'manga-card';
    card.href = factSheet.officialLink;
    card.target = '_blank';

    const genresText = factSheet.rawGenres.length > 0 ? factSheet.rawGenres.slice(0, 3).join(' • ') : "Various";
    
    let formattedScore = "N/A";
    if (factSheet.globalScore !== "N/A") {
        formattedScore = factSheet.globalScore + "%";
    }

    // Added the synopsis field back in with text truncation logic
    card.innerHTML = `
        <div class="manga-cover-container">
            <img src="${factSheet.coverUrl}" alt="${factSheet.title}" class="manga-cover" loading="lazy">
            <div class="score-badge">⭐ ${formattedScore}</div>
        </div>
        <div class="manga-info">
            <h3 class="manga-title" title="${factSheet.title}">${factSheet.title}</h3>
            <p class="manga-meta" style="margin-bottom: 6px;">${genresText}</p>
            <p class="manga-synopsis" style="font-size: 0.8rem; color: var(--text-muted); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">
                ${factSheet.synopsis}
            </p>
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
