/**
 * Forward geocoder — turns a typed city/town into coordinates so the Eats page
 * can relocate its live search anywhere. Uses Google Geocoding when the key is
 * set (same key as places.js), with a keyless OpenStreetMap fallback so the
 * city search still works with no key.
 *
 * GET /api/geocode?q=Cleveland
 */
const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const q = String((event.queryStringParameters || {}).q || '').trim().slice(0, 80);
  if (!q) return json(400, { error: 'q is required' });

  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;

  // 1) Google Geocoding (most reliable) when a key is configured.
  if (key) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(q)}&key=${key}`,
      );
      const data = await res.json();
      const r = data.results?.[0];
      if (r?.geometry?.location) {
        const comp = (type) => r.address_components?.find((c) => c.types.includes(type))?.long_name;
        // Prefer a real place name; townships/CDPs (e.g. Mount Lebanon) lack a
        // "locality", so fall back through sublocality/township, then to what
        // the visitor typed — never the bare state name.
        const locality =
          comp('locality') ||
          comp('postal_town') ||
          comp('administrative_area_level_3') ||
          comp('sublocality') ||
          comp('neighborhood') ||
          q;
        return json(200, {
          city: locality,
          coord: [r.geometry.location.lat, r.geometry.location.lng],
        });
      }
    } catch {
      // fall through to keyless provider
    }
  }

  // 2) Keyless OpenStreetMap fallback.
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { 'User-Agent': 'CityBucketList/1.0 (info@citybucketlist.com)' } },
    );
    const data = await res.json();
    const r = data?.[0];
    if (r) {
      const city = (r.display_name || q).split(',')[0];
      return json(200, { city, coord: [Number(r.lat), Number(r.lon)] });
    }
  } catch {
    /* give up */
  }
  return json(404, { error: `Couldn't find "${q}"` });
};
