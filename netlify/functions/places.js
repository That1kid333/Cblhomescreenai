/**
 * Google Places proxy — returns the top real restaurants for a cuisine near a
 * location, so the Eats page can show live, real listings + photos.
 *
 * The API key stays server-side (never shipped to the browser). Set
 * GOOGLE_PLACES_API_KEY (or reuse the app's GOOGLE_MAPS_API_KEY) in the site's
 * Netlify env to activate. Until then this returns { configured:false } and the
 * page falls back to its curated seed list — so it is always safe to call.
 *
 * GET /api/places?lat=40.44&lng=-79.99&keyword=chinese[&radius=8000]
 */

const json = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400', ...extraHeaders },
  body: JSON.stringify(body),
});

const PRICE = ['', '$', '$', '$$', '$$$', '$$$$']; // Google price_level 0-4 → our label

export const handler = async (event) => {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return json(200, { configured: false, results: [] });

  const q = event.queryStringParameters || {};
  const lat = Number(q.lat);
  const lng = Number(q.lng);
  const keyword = String(q.keyword || 'restaurants').slice(0, 40);
  const radius = Math.min(Number(q.radius) || 8000, 50000);
  // Place type: 'restaurant' for Eats; 'tourist_attraction' / 'museum' / 'park' /
  // 'stadium' / 'art_gallery' / 'night_club' etc. for Attractions. Sanitized to
  // Google's a-z_ type tokens; defaults to restaurant so Eats is unchanged.
  const type = String(q.type || 'restaurant').replace(/[^a-z_]/g, '').slice(0, 40) || 'restaurant';
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return json(400, { error: 'lat and lng are required' });
  }

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=${radius}&type=${type}` +
      `&keyword=${encodeURIComponent(keyword)}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return json(502, { error: `Places API: ${data.status}`, results: [] });
    }

    const results = (data.results || [])
      // Prefer well-reviewed, highly-rated spots.
      .filter((p) => p.business_status !== 'CLOSED_PERMANENTLY')
      .sort((a, b) => (b.rating || 0) * Math.log10((b.user_ratings_total || 0) + 10) - (a.rating || 0) * Math.log10((a.user_ratings_total || 0) + 10))
      .slice(0, 6)
      .map((p) => ({
        id: p.place_id,
        name: p.name,
        rating: p.rating || null,
        reviews: p.user_ratings_total || 0,
        price: PRICE[p.price_level] || '$$',
        open: p.opening_hours?.open_now ?? null,
        address: p.vicinity || '',
        coord: [p.geometry?.location?.lat, p.geometry?.location?.lng],
        // Proxy the photo through our own endpoint so the key stays server-side.
        photo: p.photos?.[0]?.photo_reference
          ? `/api/place-photo?ref=${encodeURIComponent(p.photos[0].photo_reference)}`
          : null,
      }));

    return json(200, { configured: true, results });
  } catch (error) {
    console.error('places proxy error:', error);
    return json(502, { error: 'Upstream error', results: [] });
  }
};
