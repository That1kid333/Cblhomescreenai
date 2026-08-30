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

/** Great-circle miles between two lat/lng pairs. */
const milesBetween = (aLat, aLng, bLat, bLng) => {
  const R = 3958.8;
  const rad = (d) => (d * Math.PI) / 180;
  const h =
    Math.sin(rad(bLat - aLat) / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Google treats `radius` as a BIAS, not a limit, when it ranks by prominence: a
// place famous enough outranks genuinely local ones and gets pulled in from far
// outside the circle. In a dense market you never notice. In a thin one you do —
// Kennywood (18k reviews, Pittsburgh) turned up in "attractions near you" for a
// visitor in Glenville, West Virginia, 150 miles away (Keith, 2026-08-25).
//
// So enforce the radius ourselves. With a floor: if enforcing it would leave
// almost nothing, hand back the unfiltered set instead, because a thin list of
// real neighbours beats an empty page in a rural market. Same trade the Day Trips
// distance floor makes.
const MIN_RESULTS_BEFORE_RELAXING = 3;

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

    const withinRadius = (p) => {
      const plat = p.geometry?.location?.lat;
      const plng = p.geometry?.location?.lng;
      if (typeof plat !== 'number' || typeof plng !== 'number') return true; // can't judge, keep
      // 10% grace: Google's radius and a great-circle line disagree at the edge,
      // and dropping a place 200m over would be its own small wrongness.
      return milesBetween(lat, lng, plat, plng) <= (radius / 1609.34) * 1.1;
    };

    const live = (data.results || []).filter((p) => p.business_status !== 'CLOSED_PERMANENTLY');
    const near = live.filter(withinRadius);
    const chosen = near.length >= MIN_RESULTS_BEFORE_RELAXING ? near : live;

    const results = chosen
      // Prefer well-reviewed, highly-rated spots.
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
