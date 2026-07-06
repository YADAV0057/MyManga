// ==========================================
// FAVORITES / READING LIST (js/favorites.js)
// ==========================================
// Stores a per-device favorites list. Instant via localStorage,
// mirrored to Firestore (keyed by a random device id) so the
// list survives a cleared cache / reinstall on the same device,
// and can later be upgraded to real auth without changing callers.

import { db, doc, getDoc, setDoc } from './firebase.js';

const DEVICE_KEY = 'mangamood_device_id';
const LOCAL_KEY = 'mangamood_favorites';

function getDeviceId() {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
        id = (crypto.randomUUID ? crypto.randomUUID() : `dev_${Date.now()}_${Math.random().toString(36).slice(2)}`);
        localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
}

function readLocal() {
    try {
        return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {};
    } catch (e) {
        return {};
    }
}

function writeLocal(map) {
    try {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(map));
    } catch (e) {
        console.warn('Could not persist favorites locally.', e);
    }
}

// In-memory map, hydrated from localStorage immediately (no network wait).
let favoritesMap = readLocal();

/**
 * Is this manga id currently saved?
 */
export function isFavorite(id) {
    return !!favoritesMap[String(id)];
}

/**
 * All saved manga, most recently saved first.
 */
export function getAllFavorites() {
    return Object.values(favoritesMap).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
}

/**
 * Add or remove a manga from favorites. Returns the new state (true = now saved).
 */
export async function toggleFavorite(factSheet) {
    const id = String(factSheet.id);
    let nowFavorited;

    if (favoritesMap[id]) {
        delete favoritesMap[id];
        nowFavorited = false;
    } else {
        favoritesMap[id] = { ...factSheet, savedAt: Date.now() };
        nowFavorited = true;
    }

    writeLocal(favoritesMap);
    syncRemote().catch(e => console.warn('Favorites cloud sync failed (saved locally).', e));

    return nowFavorited;
}

async function syncRemote() {
    if (!db) return;
    const ref = doc(db, 'favorites', getDeviceId());
    await setDoc(ref, { items: favoritesMap, updatedAt: Date.now() });
}

/**
 * Pull down the cloud copy on load and merge it with whatever is
 * already in localStorage (newest savedAt per item wins).
 */
export async function hydrateFromRemote() {
    if (!db) return;
    try {
        const ref = doc(db, 'favorites', getDeviceId());
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const remote = snap.data().items || {};
            const merged = { ...remote };
            for (const [id, item] of Object.entries(favoritesMap)) {
                if (!merged[id] || (item.savedAt || 0) > (merged[id].savedAt || 0)) {
                    merged[id] = item;
                }
            }
            favoritesMap = merged;
            writeLocal(favoritesMap);
        }
    } catch (e) {
        console.warn('Could not sync favorites from the cloud, using local cache.', e);
    }
}
