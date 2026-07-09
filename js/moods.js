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
    { label: "✨ Inspiring", query: "Music, Drama" },
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

// ===============================
// MOOD MIXING (STEP 1)
// ===============================
// BUGFIX: previously every mood click just fired an instant single-mood
// search with no memory of what was already picked — so clicking a second
// mood chip just replaced the first search instead of blending both, even
// though the header copy promises "Stack up to 2 moods and we'll blend
// your match". This now keeps a rolling list of up to 2 selected mood
// buttons: each click still searches immediately (so a single tap stays
// just as responsive as before), but if a *second, different* mood is
// tapped while the first is still selected, their genre queries are
// merged and re-searched together. Tapping a 3rd mood drops the oldest of
// the two and mixes in the new one; tapping an already-selected mood
// deselects it (and re-searches with whatever's left, if anything).
let selectedMoods = [];   // mood objects, oldest first, max length 2
let selectedEls = [];     // the actual button elements, same order/indices

function mergeMoodQueries(moodA, moodB) {
    const genresA = moodA.query.split(',').map(s => s.trim()).filter(Boolean);
    const genresB = moodB.query.split(',').map(s => s.trim()).filter(Boolean);
    return Array.from(new Set([...genresA, ...genresB])).join(', ');
}

function updateMixerHint() {
    const hint = document.querySelector('.mixer-heading span');
    if (!hint) return;
    if (selectedMoods.length === 0) {
        hint.textContent = 'Tap up to 2';
    } else if (selectedMoods.length === 1) {
        hint.textContent = `Mixing ${selectedMoods[0].label} — tap 1 more to blend`;
    } else {
        hint.textContent = `Mixing ${selectedMoods[0].label} + ${selectedMoods[1].label}`;
    }
}

function runSelectedMoodSearch() {
    if (selectedMoods.length === 0) return;

    const query = selectedMoods.length === 1
        ? selectedMoods[0].query
        : mergeMoodQueries(selectedMoods[0], selectedMoods[1]);

    // theme reflects whichever mood was just added/changed most recently
    const themeLabel = selectedMoods[selectedMoods.length - 1].label;
    if (window.applyMoodTheme) window.applyMoodTheme(themeLabel);

    if (window.triggerPresetSearch) {
        window.triggerPresetSearch(query, 1);
    } else if (window.triggerSearch) {
        window.triggerSearch(query, 1);
    }
}

export function attachMoodButtonListeners() {
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.vibe-btn[data-mood]');
        if (!btn) return;

        try {
            const mood = JSON.parse(btn.getAttribute('data-mood'));
            const existingIndex = selectedEls.indexOf(btn);

            if (existingIndex !== -1) {
                // Already selected — tapping it again deselects it.
                btn.classList.remove('selected');
                selectedEls.splice(existingIndex, 1);
                selectedMoods.splice(existingIndex, 1);
                updateMixerHint();

                if (selectedMoods.length > 0) {
                    runSelectedMoodSearch();
                } else {
                    // nothing selected anymore — resume the normal rotation
                    startVibeRotation(30000);
                }
                return;
            }

            // Selecting a new (3rd) mood while 2 are already active drops
            // the oldest one to keep the "up to 2" promise.
            if (selectedMoods.length >= 2) {
                const droppedEl = selectedEls.shift();
                selectedMoods.shift();
                if (droppedEl) droppedEl.classList.remove('selected');
            }

            btn.classList.add('selected');
            selectedEls.push(btn);
            selectedMoods.push(mood);

            // Pause auto-rotation while a mix is active so the 3 rotating
            // chips don't swap out from under the user's selection.
            clearInterval(rotationInterval);

            updateMixerHint();
            runSelectedMoodSearch();
        } catch (err) {
            console.error("Error parsing mood data:", err);
        }
    });
}

export function toggleTags() {
    const extra = document.getElementById('extra-tags');
    const btn = document.getElementById('more-btn');
    const rotatingContainer = document.getElementById('rotating-vibes');

    if (!extra || !btn || !rotatingContainer) {
        console.error("DOM elements not found for toggleTags");
        return;
    }

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
}

window.toggleOptions = function (id) {
    const overlay = document.getElementById(`overlay-${id}`);
    if (overlay) overlay.classList.toggle('active');
};

window.toggleSynopsis = function (el) {
    el.classList.toggle('expanded');
};



