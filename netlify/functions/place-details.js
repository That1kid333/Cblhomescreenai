/**
 * Google Place Details proxy — enriches the on-site restaurant panel with real
 * hours, phone, website, and a review snippet. The API key stays server-side
 * (matches places.js / place-photo.js). Returns { configured:false } when no key
 * is set, so the panel safely falls back to its basic info.
 *
 * GET /api/place-details?place_id=ChIJ...
 */

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=86400' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return json(200, { configured: false });

  const placeId = String((event.queryStringParameters || {}).place_id || '');
  if (!placeId) return json(400, { error: 'place_id is required' });

  try {
    const fields = 'website,formatted_phone_number,opening_hours,url,reviews,editorial_summary';
    const url =
      `https://maps.googleapis.com/maps/api/place/details/json` +
      `?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK') return json(200, { configured: true, found: false });

    const r = data.result || {};
    const rev = (r.reviews || [])[0];
    return json(200, {
      configured: true,
      found: true,
      website: r.website || null,
      phone: r.formatted_phone_number || null,
      googleUrl: r.url || null,
      hours: r.opening_hours?.weekday_text || null,
      openNow: r.opening_hours?.open_now ?? null,
      summary: r.editorial_summary?.overview || null,
      review: rev
        ? {
            author: rev.author_name,
            rating: rev.rating,
            text: String(rev.text || '').slice(0, 280),
            when: rev.relative_time_description,
          }
        : null,
    });
  } catch (error) {
    console.error('place-details proxy error:', error);
    return json(502, { error: 'Upstream error' });
  }
};
