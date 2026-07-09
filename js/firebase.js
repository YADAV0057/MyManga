// ==========================================
// FIREBASE INITIALIZATION & CACHE SETUP 
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
// NOTE: firebase-analytics.js is loaded dynamically below instead of as a
// static top-level import. Ad blockers / privacy browsers (Brave Shields,
// uBlock, Safari content blockers, etc.) commonly block this URL since it's
// literally Google Analytics. A blocked STATIC import throws before any
// try/catch can run, which used to fail this whole module — and since
// search.js imports firebase.js at its top, that cascaded into search.js
// failing to load too, silently breaking the search button while every
// other button (which doesn't touch firebase.js) kept working.

const firebaseConfig = {
    apiKey: "AIzaSyCrZAQbMT35SKArRfWnKGt4SS5NlJgN1XM",
    authDomain: "moodmanga-80a58.firebaseapp.com",
    projectId: "moodmanga-80a58",
    storageBucket: "moodmanga-80a58.firebasestorage.app",
    messagingSenderId: "970051387669",
    appId: "1:970051387669:web:f9789bb0b568eb803ca91c",
    measurementId: "G-JZSZ0TYYEL" 
};

let app = null;
let db = null;
let analytics = null;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error("CRITICAL: Firebase initialization failed.", e);
}

if (app) {
    // Dynamic import: if this request is blocked or fails, it just rejects
    // this one promise instead of taking down the entire firebase.js module
    // (and everything that imports it, like search.js).
    import("https://www.gstatic.com/firebasejs/10.8.1/firebase-analytics.js")
        .then(({ getAnalytics }) => {
            analytics = getAnalytics(app);
        })
        .catch((e) => {
            console.warn("Analytics disabled (likely blocked by an ad blocker/privacy browser).", e);
        });
}

function generateCacheKey(query, page) {
    const cleanQuery = query.trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
    return `search_${cleanQuery}_page_${page}`;
}

export {
    app,
    db,
    analytics,
    doc,
    getDoc,
    setDoc,
    generateCacheKey
};


