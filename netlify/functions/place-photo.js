/**
 * Google Places photo proxy — streams a restaurant photo by reference while
 * keeping the API key server-side (the browser never sees it). Paired with
 * places.js, which returns `/api/place-photo?ref=...` URLs.
 *
 * GET /api/place-photo?ref=<photo_reference>[&w=800]
 */
export const handler = async (event) => {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  const ref = (event.queryStringParameters || {}).ref;
  if (!key || !ref) return { statusCode: 404, body: 'Not found' };

  const maxwidth = Math.min(Number((event.queryStringParameters || {}).w) || 800, 1600);
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=${maxwidth}&photo_reference=${encodeURIComponent(ref)}&key=${key}`;
    // Google redirects to the actual image; follow it and stream the bytes.
    const res = await fetch(url);
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
    console.error('place-photo proxy error:', error);
    return { statusCode: 502, body: 'Photo error' };
  }
};
