/**
 * Live city hero photo — text-searches Google Places for a city's skyline and
 * streams the top photo, so a location-aware "Near you" card can show a real
 * photo of ANY city (no pre-loaded file needed). Key stays server-side.
 *
 * Featured cities keep their hand-curated self-hosted photos; this only backs the
 * long tail. Returns 404 when the key is unset or Google has no photo, and the
 * client then falls back to the on-brand map texture — so it's always safe to call.
 *
 * GET /api/city-photo?q=Cleveland[&w=1200]
 */
const photoRefFor = async (query, key) => {
  const url =
    `https://maps.googleapis.com/maps/api/place/textsearch/json` +
    `?query=${encodeURIComponent(query)}&key=${key}`;
  const data = await (await fetch(url)).json();
  for (const p of data.results || []) {
    const ref = p.photos?.[0]?.photo_reference;
    if (ref) return ref;
  }
  return null;
};

export const handler = async (event) => {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  const q = (event.queryStringParameters || {}).q;
  if (!key || !q) return { statusCode: 404, body: 'Not found' };

  const city = String(q).slice(0, 60).trim();
  const maxwidth = Math.min(Number((event.queryStringParameters || {}).w) || 1200, 1600);
  try {
    // Bias toward a cityscape; fall back to the plain city (locality) photo.
    const ref = (await photoRefFor(`${city} skyline`, key)) || (await photoRefFor(city, key));
    if (!ref) return { statusCode: 404, body: 'No photo' };

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/photo` +
        `?maxwidth=${maxwidth}&photo_reference=${encodeURIComponent(ref)}&key=${key}`,
    );
    if (!res.ok) return { statusCode: 502, body: 'Photo unavailable' };
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      statusCode: 200,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=604800', // 1 week
      },
      body: buf.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('city-photo proxy error:', error);
    return { statusCode: 502, body: 'Photo error' };
  }
};
