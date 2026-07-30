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
const search = async (query, key) => {
  const url =
    `https://maps.googleapis.com/maps/api/place/textsearch/json` +
    `?query=${encodeURIComponent(query)}&key=${key}`;
  return (await (await fetch(url)).json()).results || [];
};
const refOf = (p) => p.photos?.[0]?.photo_reference || null;

// Resolve a real cityscape photo, not a business named "<City> Skyline". Prefer the
// LOCALITY result (the city itself — its photo is a curated city image), then any
// photo from the plain search, then a downtown fallback.
const cityPhotoRef = async (city, key) => {
  const results = await search(city, key);
  const locality = results.find((p) => (p.types || []).includes('locality') && refOf(p));
  if (locality) return refOf(locality);
  const any = results.find((p) => refOf(p));
  if (any) return refOf(any);
  const dt = (await search(`downtown ${city}`, key)).find((p) => refOf(p));
  return dt ? refOf(dt) : null;
};

export const handler = async (event) => {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  const q = (event.queryStringParameters || {}).q;
  if (!key || !q) return { statusCode: 404, body: 'Not found' };

  const city = String(q).slice(0, 60).trim();
  const maxwidth = Math.min(Number((event.queryStringParameters || {}).w) || 1200, 1600);
  try {
    const ref = await cityPhotoRef(city, key);
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
