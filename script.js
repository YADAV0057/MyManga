// ==========================================
// API AGGREGATOR STACK
// ==========================================

const MANGADEX_TOKEN = "SHgr5UbFSF6HbuRrw4upK3GJeBntQIe0";

// 1. Jikan API Fetch (MyAnimeList)
async function fetchFromJikan(searchQuery) {
    try {
        const response = await fetch(`https://api.jikan.moe/v4/manga?q=${encodeURIComponent(searchQuery)}&limit=1`);
        const data = await response.json();
        // Fallback to null if array is empty
        return data.data && data.data.length > 0 ? data.data[0] : null; 
    } catch (error) {
        console.error("Jikan API Error:", error);
        return null;
    }
}

// 2. AniList API Fetch (GraphQL)
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

// 3. MangaDex API Fetch (Cover Art)
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
// DATA NORMALIZATION PIPELINE
// ==========================================

async function normalizeMangaData(searchQuery) {
    // Fetch from APIs concurrently
    const [jikanData, aniListData, mangadexData] = await Promise.all([
        fetchFromJikan(searchQuery),
        fetchFromAniList(searchQuery),
        fetchFromMangaDex(searchQuery)
    ]);

    // Build Standardized Fact Sheet
    return {
        title: jikanData?.title || aniListData?.title?.english || searchQuery,
        globalScore: aniListData?.averageScore || "N/A",
        rawGenres: aniListData?.genres || jikanData?.genres?.map(g => g.name) || [],
        coverUrl: mangadexData?.coverUrl || "https://via.placeholder.com/220x300?text=No+Cover",
        officialLink: mangadexData?.readLink || "#"
    };
}

// ==========================================
// UI INTERACTION & DUAL-ENGINE SEARCH
// ==========================================

// Toggle More/Less Mood Buttons
function toggleTags() {
    const extra = document.getElementById('extra-tags');
    const btn = document.getElementById('more-btn');
    if (extra.style.display === "flex") {
        extra.style.display = "none";
        btn.innerText = "+ More";
    } else {
        extra.style.display = "flex";
        btn.innerText = "- Less";
    }
}

// Fire Google and API Search simultaneously
async function triggerSearch(query) {
    // 1. Trigger Google Search Engine
    const searchInput = document.querySelector('input.gsc-input');
    if (searchInput) {
        searchInput.value = query;
        const searchBtn = document.querySelector('button.gsc-search-button');
        if (searchBtn) searchBtn.click();
    }

    // Scroll to results
    document.getElementById('results-area').scrollIntoView({ behavior: 'smooth' });

    // 2. Trigger Custom API Aggregator
    const grid = document.getElementById('community-grid');
    grid.innerHTML = '<p style="text-align:center; width:100%; color: var(--text-muted);">Summoning official metadata...</p>';

    try {
        const factSheet = await normalizeMangaData(query);
        
        // Basic check to ensure we didn't just get an empty shell back
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

// Render dynamic HTML onto the Grid
function renderMangaCard(factSheet) {
    const grid = document.getElementById('community-grid');
    grid.innerHTML = ''; 

    const card = document.createElement('div');
    card.className = 'manga-card'; // Uses CSS file for styling

    // Format genres safely
    const genresText = factSheet.rawGenres.length > 0 ? factSheet.rawGenres.slice(0, 3).join(', ') : "Various";

    card.innerHTML = `
        <img src="${factSheet.coverUrl}" alt="${factSheet.title}" class="manga-cover">
        <div class="manga-info">
            <h3 class="manga-title" title="${factSheet.title}">${factSheet.title}</h3>
            <p class="manga-meta">
                <strong>Vibe:</strong> ${genresText}<br>
                <strong>Score:</strong> ${factSheet.globalScore}
            </p>
            <a href="${factSheet.officialLink}" target="_blank" class="read-btn">Read Official</a>
        </div>
    `;

    grid.appendChild(card);
}
