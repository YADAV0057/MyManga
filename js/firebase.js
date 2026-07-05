// ==========================================
// FIREBASE INITIALIZATION & CACHE SETUP 
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

let app = null;
let db = null;
let analytics = null;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error("CRITICAL: Firebase initialization failed.", e);
}

try {
    if (app) analytics = getAnalytics(app);
} catch (e) {
    console.warn("Analytics disabled.", e);
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
