/**
 * Ticketmaster Discovery API proxy — returns real, upcoming events near a
 * location so the site can show what is ACTUALLY happening in a visitor's city
 * (Pirates and Steelers games, shows at Stage AE / PPG Paints / the Benedum)
 * rather than a generic "buy tickets" link.
 *
 * Two separate Ticketmaster credentials do two different jobs, and this file
 * only handles the first:
 *   1. TICKETMASTER_API_KEY (this file) — free Discovery API consumer key from
 *      developer.ticketmaster.com. Provides the event DATA. No payment
 *      relationship, no banking, nothing to approve.
 *   2. The Impact affiliate deeplink (src/app/lib/affiliates.ts, IMPACT_BASE) —
 *      wraps each event URL so the click EARNS. Set separately.
 * Events render either way; without the Impact link they simply are not
 * monetized, so this can ship ahead of the affiliate side.
 *
 * The key stays server-side, exactly like GOOGLE_PLACES_API_KEY. Until it is
 * set this returns { configured:false, events:[] } so the caller can hide the
 * band — it is always safe to call.
 *
 * GET /api/events?lat=40.44&lng=-79.99[&segment=Sports|Music][&radius=40][&size=8][&keyword=Pirates]
 */

const json = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    // Event listings change through the day but not minute to minute; an hour
    // keeps us well inside Discovery's rate limits.
    'Cache-Control': 'public, max-age=3600',
    ...extraHeaders,
  },
  body: JSON.stringify(body),
});

// Discovery segments we surface. Anything else is rejected rather than passed
// through, so a crafted query can't turn this into an open proxy.
const SEGMENTS = new Set(['Sports', 'Music', 'Arts & Theatre', 'Family']);

// Pick the closest image at or above 640px wide — Discovery returns a dozen
// crops per event and the first one is often a tiny thumbnail.
function bestImage(images) {
  if (!Array.isArray(images) || !images.length) return null;
  const usable = images.filter((i) => i.url && (i.width || 0) >= 640);
  const pool = usable.length ? usable : images;
  return pool.sort((a, b) => (a.width || 0) - (b.width || 0))[0]?.url || null;
}

export const handler = async (event) => {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) return json(200, { configured: false, events: [] });

  const q = event.queryStringParameters || {};
  const lat = Number(q.lat);
  const lng = Number(q.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return json(400, { error: 'lat and lng are required', events: [] });
  }

  const radius = Math.min(Math.max(Number(q.radius) || 40, 1), 150); // miles
  const size = Math.min(Math.max(Number(q.size) || 8, 1), 20);
  const keyword = String(q.keyword || '').slice(0, 60);
  const segment = SEGMENTS.has(q.segment) ? q.segment : '';

  try {
    const url = new URL('https://app.ticketmaster.com/discovery/v2/events.json');
    url.searchParams.set('apikey', key);
    url.searchParams.set('latlong', `${lat},${lng}`);
    url.searchParams.set('radius', String(Math.round(radius)));
    url.searchParams.set('unit', 'miles');
    url.searchParams.set('size', String(size));
    url.searchParams.set('sort', 'date,asc'); // soonest first — "what's on this week"
    url.searchParams.set('startDateTime', new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));
    if (segment) url.searchParams.set('segmentName', segment);
    if (keyword) url.searchParams.set('keyword', keyword);

    const res = await fetch(url);
    if (!res.ok) {
      console.error('discovery proxy status:', res.status);
      return json(502, { error: `Discovery API: ${res.status}`, events: [] });
    }
    const data = await res.json();

    const events = (data?._embedded?.events || []).map((e) => {
      const venue = e._embedded?.venues?.[0];
      const cls = e.classifications?.[0];
      return {
        id: e.id,
        name: e.name,
        // Local date/time as Ticketmaster reports it for the venue, so we never
        // shift a 7:05 first pitch into another timezone.
        date: e.dates?.start?.localDate || null,
        time: e.dates?.start?.localTime || null,
        onSale: e.dates?.status?.code || null,
        segment: cls?.segment?.name || null,
        genre: cls?.genre?.name || null,
        venue: venue?.name || null,
        city: venue?.city?.name || null,
        state: venue?.state?.stateCode || null,
        coord: venue?.location ? [Number(venue.location.latitude), Number(venue.location.longitude)] : null,
        priceFrom: e.priceRanges?.[0]?.min ?? null,
        currency: e.priceRanges?.[0]?.currency || 'USD',
        image: bestImage(e.images),
        // RAW Ticketmaster URL. The client wraps this in the Impact affiliate
        // link (affiliateHref('ticketmaster', …)) so attribution and the
        // sponsored/nofollow rel live in one place. Never link this directly.
        url: e.url || null,
      };
    });

    return json(200, { configured: true, events });
  } catch (error) {
    console.error('discovery proxy error:', error);
    return json(502, { error: 'Upstream error', events: [] });
  }
};
