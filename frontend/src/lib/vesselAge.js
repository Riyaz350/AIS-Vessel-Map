// Buckets a vessel's staleness based on lastUpdated, independent of any
// specific UI component -- used for both marker color and any badge/label.
export const AGE_BUCKETS = {
  FRESH: 'fresh',       // < 1 min
  RECENT: 'recent',     // 1-5 min
  STALE: 'stale',       // 5-15 min
  VERY_STALE: 'very_stale', // > 15 min
};

const MINUTE_MS = 60 * 1000;

export function getVesselAgeBucket(lastUpdated, now = Date.now()) {
  if (!lastUpdated) return AGE_BUCKETS.VERY_STALE;

  const ageMs = now - new Date(lastUpdated).getTime();
  const ageMin = ageMs / MINUTE_MS;

  if (ageMin < 1) return AGE_BUCKETS.FRESH;
  if (ageMin < 5) return AGE_BUCKETS.RECENT;
  if (ageMin < 15) return AGE_BUCKETS.STALE;
  return AGE_BUCKETS.VERY_STALE;
}

// Human-readable label for the drawer/tooltip, e.g. "2 min ago", "just now".
export function formatVesselAge(lastUpdated, now = Date.now()) {
  if (!lastUpdated) return 'unknown';
  const ageMin = Math.floor((now - new Date(lastUpdated).getTime()) / MINUTE_MS);
  if (ageMin < 1) return 'just now';
  if (ageMin === 1) return '1 min ago';
  if (ageMin < 60) return `${ageMin} min ago`;
  const ageHr = Math.floor(ageMin / 60);
  return `${ageHr} hr ago`;
}

export const AGE_BUCKET_COLORS = {
  [AGE_BUCKETS.FRESH]: '#16a34a',      // green
  [AGE_BUCKETS.RECENT]: '#eab308',     // yellow
  [AGE_BUCKETS.STALE]: '#f97316',      // orange
  [AGE_BUCKETS.VERY_STALE]: '#6b7280', // grey
};

export const AGE_BUCKET_LABELS = {
  [AGE_BUCKETS.FRESH]: '< 1 min',
  [AGE_BUCKETS.RECENT]: '< 5 min',
  [AGE_BUCKETS.STALE]: '< 15 min',
  [AGE_BUCKETS.VERY_STALE]: '> 15 min',
};