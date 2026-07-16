/**
 * Google Places Autocomplete proxy — powers the "type a city/neighborhood and
 * pick from suggestions" input on the Directory. The API key stays server-side.
 *
 * Reuses the same key as the Eats places proxy (GOOGLE_PLACES_API_KEY, or the
 * app's GOOGLE_MAPS_API_KEY). Until a key is set this returns
 * { configured:false, predictions:[] } so the input silently falls back to
 * free-typing — always safe to call.
 *
 * GET /api/place-autocomplete?q=north%20hills
 */

const json = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600', ...extraHeaders },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  const key = process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return json(200, { configured: false, predictions: [] });

  const q = event.queryStringParameters || {};
  const input = String(q.q || '').trim().slice(0, 80);
  if (input.length < 2) return json(200, { configured: true, predictions: [] });

  try {
    // types=geocode biases toward places (cities, neighborhoods, regions) over
    // businesses/street addresses; US-only to keep suggestions relevant.
    const url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
      `?input=${encodeURIComponent(input)}&types=geocode&components=country:us&key=${key}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return json(502, { error: `Autocomplete: ${data.status}`, predictions: [] });
    }
    const predictions = (data.predictions || []).slice(0, 6).map((p) => ({
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || '',
      placeId: p.place_id,
    }));
    return json(200, { configured: true, predictions });
  } catch (error) {
    console.error('autocomplete proxy error:', error);
    return json(502, { error: 'Upstream error', predictions: [] });
  }
};
