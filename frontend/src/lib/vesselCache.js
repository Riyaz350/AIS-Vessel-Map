import { get, set, del } from 'idb-keyval';

const CACHE_KEY = 'ais-vessel-cache-v1';
const MAX_CACHE_AGE_MS = 60 * 60 * 1000; // 1 hour
const WRITE_THROTTLE_MS = 3000;

let lastWriteAt = 0;

// Now async -- IndexedDB reads/writes never block the main thread, unlike
// localStorage's synchronous API.
export async function loadVesselCache() {
  try {
    const cached = await get(CACHE_KEY);
    if (!cached || !cached.savedAt || !cached.vessels) return null;

    if (Date.now() - cached.savedAt > MAX_CACHE_AGE_MS) {
      await del(CACHE_KEY);
      return null;
    }

    return cached.vessels; // stored as a real object -- no JSON.parse needed
  } catch (err) {
    console.warn('[VesselCache] Failed to read cache:', err);
    return null;
  }
}

export function saveVesselCache(vessels, { force = false } = {}) {
  const now = Date.now();
  if (!force && now - lastWriteAt < WRITE_THROTTLE_MS) return;
  lastWriteAt = now;

  // Fire-and-forget -- set() returns a Promise, but the caller (a React
  // state update) doesn't need to wait for the write to finish.
  set(CACHE_KEY, { savedAt: now, vessels }).catch((err) => {
    console.warn('[VesselCache] Failed to write cache:', err);
  });
}