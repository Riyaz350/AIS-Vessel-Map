const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// Nominatim (OpenStreetMap's free geocoder) turns a place name into
// coordinates AND a bounding box. The bounding box is what lets us
// "zoom to fit the whole location" instead of guessing a zoom level —
// Bangladesh and a single port need very different zoom levels, and
// fitBounds/flyToBounds handles that automatically either way.
export async function geocodeLocation(query) {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(query)}`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Geocoding request failed: ${res.status}`);

  const results = await res.json();
  if (!results.length) return null;

  const place = results[0];
  const [south, north, west, east] = place.boundingbox.map(Number);

  return {
    displayName: place.display_name,
    lat: Number(place.lat),
    lon: Number(place.lon),
    bounds: [
      [south, west],
      [north, east],
    ], // Leaflet's LatLngBoundsExpression format: [[south, west], [north, east]]
  };
}