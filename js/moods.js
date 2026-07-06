
// ==========================================
// MOOD ROTATION ENGINE (js/moods.js)
// ==========================================

export const allMoods = [
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
export let rotationInterval;

export function createVibeButton(moodObj) {
    // Use template literals safely with data attributes
    const label = moodObj.label.replace(/"/g, '&quot;');
    const query = moodObj.query.replace(/"/g, '&quot;');
    return `<button class="vibe-btn" data-mood='${JSON.stringify(moodObj)}'>${moodObj.label}</button>`;
}

export function updateRotatingVibes() {
    const rotatingContainer = document.getElementById('rotating-vibes');
    if (!rotatingContainer) return;
    rotatingContainer.innerHTML = '';
    for (let i = 0; i < 3; i++) {
        const indexToGrab = (currentIndex + i) % allMoods.length;
        rotatingContainer.innerHTML += createVibeButton(allMoods[indexToGrab]);
    }
    currentIndex = (currentIndex + 3) % allMoods.length;
}

// Owns the single rotation timer for the whole app
export function startVibeRotation(intervalMs) {
    clearInterval(rotationInterval);
    updateRotatingVibes();
    rotationInterval = setInterval(updateRotatingVibes, intervalMs);
}

export function populateAllVibes() {
    const hiddenContainer = document.getElementById('extra-tags');
    if (!hiddenContainer) return;
    let html = '';
    allMoods.forEach(mood => { html += createVibeButton(mood); });
    hiddenContainer.innerHTML = html;
}

// Attach mood button listeners - FIXED
export function attachMoodButtonListeners() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('vibe-btn') && e.target.hasAttribute('data-mood')) {
            try {
                const mood = JSON.parse(e.target.getAttribute('data-mood'));
                if (window.applyMoodTheme) window.applyMoodTheme(mood.label);
                if (window.triggerSearch) window.triggerSearch(mood.query, 1);
            } catch (err) {
                console.error("Error parsing mood data:", err);
            }
        }
    });
}

// Toggle display of moods
window.toggleTags = function () {
    const extra = document.getElementById('extra-tags');
    const btn = document.getElementById('more-btn');
    const rotatingContainer = document.getElementById('rotating-vibes');

    if (extra.classList.contains('show')) {
        extra.classList.remove('show');
        rotatingContainer.style.display = "flex";
        btn.innerText = "+ Show All 50 Moods";
        startVibeRotation(30000);
    } else {
        extra.classList.add('show');
        rotatingContainer.style.display = "none";
        btn.innerText = "- Hide Moods";
        clearInterval(rotationInterval);
    }
};

window.toggleOptions = function (id) {
    const overlay = document.getElementById(`overlay-${id}`);
    if (overlay) overlay.classList.toggle('active');
};

window.toggleSynopsis = function (el) {
    el.classList.toggle('expanded');
};
