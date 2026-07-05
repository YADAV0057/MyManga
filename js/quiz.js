// ==========================================
// MOOD QUIZ ENGINE (js/quiz.js)
// ==========================================

export const quizData = [
    { q: "How are you feeling today?", o: [{t: "😊 Happy", s: {Comedy: 2, SliceOfLife: 2}}, {t: "😢 Sad", s: {Drama: 3, Psychological: 2}}, {t: "😌 Relaxed", s: {SliceOfLife: 3, Fantasy: 1}}, {t: "🔥 Excited", s: {Action: 3, Adventure: 2}}, {t: "🤔 Thoughtful", s: {Mystery: 3, Psychological: 2}}, {t: "😴 Tired", s: {SliceOfLife: 2, Fantasy: 1}}] },
    { q: "What kind of story do you want?", o: [{t: "⚔️ Action", s: {Action: 3}}, {t: "💕 Romance", s: {Romance: 3}}, {t: "😂 Comedy", s: {Comedy: 3}}, {t: "👻 Horror", s: {Horror: 3}}, {t: "✨ Fantasy", s: {Fantasy: 3}}, {t: "🕵 Mystery", s: {Mystery: 3}}] },
    { q: "How much time do you have?", o: [{t: "📖 Short", s: {SliceOfLife: 2}}, {t: "📚 Medium", s: {Adventure: 2}}, {t: "📚📚 Long", s: {Fantasy: 3, Action: 1}}, {t: "🎲 Doesn't matter", s: {}}] },
    { q: "How intense should it be?", o: [{t: "🌿 Relaxing", s: {SliceOfLife: 3}}, {t: "⚡ Balanced", s: {Adventure: 2, Action: 1}}, {t: "🔥 Very Intense", s: {Psychological: 3, Thriller: 3}}] },
    { q: "Pick your ending.", o: [{t: "😊 Happy", s: {Comedy: 2}}, {t: "😭 Emotional", s: {Drama: 3}}, {t: "🤯 Mind-blowing", s: {Psychological: 3}}, {t: "🎲 Surprise", s: {}}] }
];

let currentQ = 0;
let userScores = {};

// Attach all functions to the window object so inline HTML events can reach them
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

