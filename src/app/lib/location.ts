import { useEffect, useRef, useState } from 'react';

export type VisitorLocationStatus = 'idle' | 'locating' | 'resolved' | 'denied' | 'unavailable' | 'manual';

const STORAGE_KEY = 'cbl_visitor_city';

type StoredCity = { city: string; state: string };

function readStoredCity(): StoredCity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredCity) : null;
  } catch {
    return null;
  }
}

function storeCity(city: string, state: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ city, state }));
  } catch {
    // localStorage unavailable (private browsing, etc.) — non-fatal, just won't persist.
  }
}

// Reverse-geocoding: use Google's Geocoding API when VITE_GOOGLE_MAPS_API_KEY
// is configured (most precise), otherwise fall back to BigDataCloud's free,
// keyless client endpoint so location still works with no key or billing setup.
async function reverseGeocode(lat: number, lng: number): Promise<StoredCity | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
      const data = await res.json();
      const components = data?.results?.[0]?.address_components ?? [];
      const city = components.find((c: { types: string[] }) => c.types.includes('locality'))?.long_name;
      const state = components.find((c: { types: string[] }) => c.types.includes('administrative_area_level_1'))
        ?.short_name;
      if (city) return { city, state: state ?? '' };
    } catch {
      // fall through to the keyless provider
    }
  }

  // Keyless fallback — no API key or billing required.
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    const data = await res.json();
    const city: string | undefined = data?.city || data?.locality;
    // principalSubdivisionCode looks like "US-PA" — take the state part.
    const state: string = (data?.principalSubdivisionCode || '').split('-')[1] || '';
    if (city) return { city, state };
  } catch {
    return null;
  }
  return null;
}

export type Coords = { lat: number; lng: number };

// ── Forward geocoding (place name → coordinates) ────────────────────────────
// Powers proximity search in the Directory: a listing tagged "Pittsburgh"
// should surface for a visitor searching "North Hills PA" (a suburb ~11mi
// away) but NOT for "Ohio". We resolve both the searched place AND the
// listing's city to coordinates, then match within a metro radius.
//
// Reliability first: a built-in gazetteer resolves the Pittsburgh home market
// (and a few major cities) with NO network at all, so the core experience
// never depends on an external service. Unknown places fall back to a keyless
// provider (Google if a browser key is configured, else OpenStreetMap
// Nominatim), cached in localStorage so we rarely hit the network twice.

function normalizePlace(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,]/g, ' ')
    .replace(/\b(township|twp|borough|boro|city|county|neighborhood)\b/g, ' ')
    // Handles the INVERTED form too. Mapbox reverse-geocoding (which the CBL app
    // uses) returns "Township of North Fayette, PA" rather than "North Fayette
    // Township", and stripping the keyword alone would leave a dangling "of
    // north fayette" that matches nothing. Drop the orphaned leading "of".
    .replace(/^\s*of\b/, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// US state names/abbreviations we may see trailing a typed search ("North
// Hills PA", "North Hills, Pennsylvania") — stripped so the place still
// matches the gazetteer.
const STATE_TOKENS = new Set([
  'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la','me','md',
  'ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok','or','pa','ri','sc',
  'sd','tn','tx','ut','vt','va','wa','wv','wi','wy','pennsylvania','ohio','maryland','virginia',
  'newyork','westvirginia',
]);

function stripTrailingState(norm: string): string {
  const parts = norm.split(' ');
  while (parts.length > 1 && STATE_TOKENS.has(parts[parts.length - 1])) parts.pop();
  return parts.join(' ');
}

// Pittsburgh metro gazetteer (city + neighborhoods/suburbs) plus a few major
// markets. Coordinates are approximate town centers — precise enough for a
// 45-mile proximity test. Keyless, offline, instant.
const SEED_PLACES: Record<string, Coords> = {
  pittsburgh: { lat: 40.4406, lng: -79.9959 },
  'north hills': { lat: 40.58, lng: -80.02 },
  'west view': { lat: 40.523, lng: -80.038 },
  ross: { lat: 40.53, lng: -80.01 },
  mccandless: { lat: 40.58, lng: -80.03 },
  wexford: { lat: 40.62, lng: -80.06 },
  cranberry: { lat: 40.68, lng: -80.1 },
  shadyside: { lat: 40.454, lng: -79.933 },
  'squirrel hill': { lat: 40.438, lng: -79.922 },
  'mount washington': { lat: 40.43, lng: -80.01 },
  'mt washington': { lat: 40.43, lng: -80.01 },
  'bethel park': { lat: 40.33, lng: -80.04 },
  monroeville: { lat: 40.42, lng: -79.79 },
  robinson: { lat: 40.45, lng: -80.12 },
  'south side': { lat: 40.428, lng: -79.975 },
  oakland: { lat: 40.442, lng: -79.958 },
  bloomfield: { lat: 40.46, lng: -79.95 },
  lawrenceville: { lat: 40.47, lng: -79.96 },
  'fox chapel': { lat: 40.51, lng: -79.88 },
  sewickley: { lat: 40.54, lng: -80.18 },
  moon: { lat: 40.51, lng: -80.22 },
  coraopolis: { lat: 40.52, lng: -80.17 },
  'green tree': { lat: 40.41, lng: -80.05 },
  greentree: { lat: 40.41, lng: -80.05 },
  dormont: { lat: 40.395, lng: -80.03 },
  'mount lebanon': { lat: 40.38, lng: -80.05 },
  'mt lebanon': { lat: 40.38, lng: -80.05 },
  'penn hills': { lat: 40.47, lng: -79.83 },
  wilkinsburg: { lat: 40.44, lng: -79.88 },
  'south hills': { lat: 40.36, lng: -80.02 },
  'east liberty': { lat: 40.46, lng: -79.925 },
  // Alle-Kiski Valley (Allegheny/Kiskiminetas rivers, NE of the city — Brian's
  // market). The regional nickname + its towns, so the area is recognized for
  // proximity search and driver ads instead of falling back to a bare state
  // match. All within the 45-mile metro radius of downtown. Note: IP geolocation
  // often tags this area "Indiana" (Indiana Township, below) — a real place, not
  // the state — which is why it's mapped near Pittsburgh, not to Indiana, PA.
  'alle-kiski valley': { lat: 40.5695, lng: -79.7648 },
  'alle-kiski': { lat: 40.5695, lng: -79.7648 },
  'alle kiski valley': { lat: 40.5695, lng: -79.7648 },
  'alle kiski': { lat: 40.5695, lng: -79.7648 },
  allekiski: { lat: 40.5695, lng: -79.7648 },
  'new kensington': { lat: 40.5695, lng: -79.7648 },
  arnold: { lat: 40.5795, lng: -79.7659 },
  'lower burrell': { lat: 40.5834, lng: -79.7548 },
  'upper burrell': { lat: 40.585, lng: -79.71 },
  tarentum: { lat: 40.6023, lng: -79.7589 },
  brackenridge: { lat: 40.6087, lng: -79.7434 },
  'natrona heights': { lat: 40.6318, lng: -79.7192 },
  natrona: { lat: 40.617, lng: -79.72 },
  'harrison township': { lat: 40.63, lng: -79.72 },
  harrison: { lat: 40.63, lng: -79.72 },
  vandergrift: { lat: 40.6012, lng: -79.5659 },
  apollo: { lat: 40.5834, lng: -79.567 },
  leechburg: { lat: 40.629, lng: -79.6053 },
  springdale: { lat: 40.5395, lng: -79.7834 },
  cheswick: { lat: 40.5423, lng: -79.7987 },
  freeport: { lat: 40.6739, lng: -79.6842 },
  creighton: { lat: 40.5761, lng: -79.7803 },
  oakmont: { lat: 40.5223, lng: -79.837 },
  plum: { lat: 40.5015, lng: -79.748 },
  'indiana township': { lat: 40.5527, lng: -79.8617 },
  // Harmar/O'Hara river towns — the stretch IP geolocation keeps reporting for
  // North Hills visitors (Keith reads as "Harmar", ~10mi off). Seeded so the
  // names at least resolve instantly when typed, even though we no longer LABEL
  // anyone with them (see displayCity).
  harmar: { lat: 40.5245, lng: -79.842 },
  harmarville: { lat: 40.5262, lng: -79.8395 },
  blawnox: { lat: 40.4934, lng: -79.8595 },
  aspinwall: { lat: 40.4917, lng: -79.9048 },
  sharpsburg: { lat: 40.4923, lng: -79.9256 },
  "o'hara": { lat: 40.505, lng: -79.89 },
  ohara: { lat: 40.505, lng: -79.89 },
  verona: { lat: 40.5062, lng: -79.8467 },
  // North Hills constellation (Keith's own area) — the suburbs riders and
  // drivers actually name when they post or search.
  etna: { lat: 40.5023, lng: -79.9484 },
  millvale: { lat: 40.4812, lng: -79.9784 },
  shaler: { lat: 40.517, lng: -79.972 },
  glenshaw: { lat: 40.5384, lng: -79.9631 },
  hampton: { lat: 40.5865, lng: -79.947 },
  'allison park': { lat: 40.572, lng: -79.952 },
  gibsonia: { lat: 40.63, lng: -79.97 },
  bellevue: { lat: 40.4939, lng: -80.0517 },
  avalon: { lat: 40.5006, lng: -80.0662 },
  'franklin park': { lat: 40.5773, lng: -80.0839 },
  pine: { lat: 40.64, lng: -80.03 },
  marshall: { lat: 40.63, lng: -80.09 },
  // A few major markets so proximity works outside the home metro too.
  'new orleans': { lat: 29.95, lng: -90.07 },
  atlanta: { lat: 33.749, lng: -84.388 },
  philadelphia: { lat: 39.95, lng: -75.16 },
  cleveland: { lat: 41.4993, lng: -81.6944 },
  columbus: { lat: 39.9612, lng: -82.9988 },
};

// Synchronous, offline gazetteer lookup. Tries the full normalized place, then
// the same with a trailing state token removed. Returns null for unknown places.
export function seedCoords(place: string | null | undefined): Coords | null {
  if (!place) return null;
  const norm = normalizePlace(place);
  if (SEED_PLACES[norm]) return SEED_PLACES[norm];
  const stripped = stripTrailingState(norm);
  return SEED_PLACES[stripped] ?? null;
}

// Great-circle miles between two points.
export function milesBetween(a: Coords, b: Coords): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ── Metro snapping (display labels) ──────────────────────────────────────────
// IP geolocation resolves to ISP routing, not to the visitor, so the town it
// reports is unreliable at suburb level: Keith in the North Hills reads as
// "Harmar" (~10mi off, a township), Brian reads as "Indiana" (Indiana Township,
// which also collides with the state name). Labeling a page "near Harmar" is
// therefore both odd-sounding AND frequently wrong.
//
// So every USER-FACING label snaps the detected point to its metro, while the
// raw coordinates are kept for distance sorting and proximity search. The
// visitor's real position still drives WHAT they see; the metro only drives
// what we CALL it. Anyone wanting street-level accuracy uses the "Near me"
// GPS upgrade (requestPrecise), which is exact.
const MAJOR_METROS: { name: string; lat: number; lng: number }[] = [
  { name: 'New York', lat: 40.71, lng: -74.01 }, { name: 'Los Angeles', lat: 34.05, lng: -118.24 },
  { name: 'Chicago', lat: 41.88, lng: -87.63 }, { name: 'Houston', lat: 29.76, lng: -95.37 },
  { name: 'Phoenix', lat: 33.45, lng: -112.07 }, { name: 'Philadelphia', lat: 39.95, lng: -75.16 },
  { name: 'San Antonio', lat: 29.42, lng: -98.49 }, { name: 'San Diego', lat: 32.72, lng: -117.16 },
  { name: 'Dallas', lat: 32.78, lng: -96.80 }, { name: 'Austin', lat: 30.27, lng: -97.74 },
  { name: 'San Jose', lat: 37.34, lng: -121.89 }, { name: 'San Francisco', lat: 37.77, lng: -122.42 },
  { name: 'Seattle', lat: 47.61, lng: -122.33 }, { name: 'Denver', lat: 39.74, lng: -104.99 },
  { name: 'Washington', lat: 38.91, lng: -77.04 }, { name: 'Boston', lat: 42.36, lng: -71.06 },
  { name: 'Nashville', lat: 36.16, lng: -86.78 }, { name: 'Las Vegas', lat: 36.17, lng: -115.14 },
  { name: 'Portland', lat: 45.51, lng: -122.68 }, { name: 'Detroit', lat: 42.33, lng: -83.05 },
  { name: 'Memphis', lat: 35.15, lng: -90.05 }, { name: 'Louisville', lat: 38.25, lng: -85.76 },
  { name: 'Milwaukee', lat: 43.04, lng: -87.91 }, { name: 'Baltimore', lat: 39.29, lng: -76.61 },
  { name: 'Atlanta', lat: 33.75, lng: -84.39 }, { name: 'Miami', lat: 25.76, lng: -80.19 },
  { name: 'Orlando', lat: 28.54, lng: -81.38 }, { name: 'Tampa', lat: 27.95, lng: -82.46 },
  { name: 'New Orleans', lat: 29.95, lng: -90.07 }, { name: 'Minneapolis', lat: 44.98, lng: -93.27 },
  { name: 'Cleveland', lat: 41.50, lng: -81.69 }, { name: 'Columbus', lat: 39.96, lng: -82.99 },
  { name: 'Cincinnati', lat: 39.10, lng: -84.51 }, { name: 'Kansas City', lat: 39.10, lng: -94.58 },
  { name: 'Indianapolis', lat: 39.77, lng: -86.16 }, { name: 'Pittsburgh', lat: 40.44, lng: -79.996 },
  { name: 'St. Louis', lat: 38.63, lng: -90.20 }, { name: 'Charlotte', lat: 35.23, lng: -80.84 },
  { name: 'Raleigh', lat: 35.78, lng: -78.64 }, { name: 'Salt Lake City', lat: 40.76, lng: -111.89 },
  { name: 'Sacramento', lat: 38.58, lng: -121.49 }, { name: 'Buffalo', lat: 42.89, lng: -78.88 },
  { name: 'Richmond', lat: 37.54, lng: -77.44 }, { name: 'Jacksonville', lat: 30.33, lng: -81.66 },
  { name: 'Oklahoma City', lat: 35.47, lng: -97.52 },
];

/** Snap coordinates to the nearest major metro within `maxMi`; null if none/no coords. */
export function nearestMetro(coords: Coords | null | undefined, maxMi = 80): string | null {
  if (!coords) return null;
  let best: string | null = null;
  let bestD = Infinity;
  for (const m of MAJOR_METROS) {
    const d = milesBetween(coords, { lat: m.lat, lng: m.lng });
    if (d < bestD) { bestD = d; best = m.name; }
  }
  return best && bestD <= maxMi ? best : null;
}

// How close the visitor must be for us to CALL their location by the metro's
// name. Deliberately tighter than the 80mi affiliate-inventory radius: at 30mi
// you're genuinely "in Pittsburgh" (Harmar is 11mi, the North Hills 10mi), but
// a real city an hour out keeps its own name instead of being swallowed — we
// don't want to tell someone in Ann Arbor they're in Detroit.
export const METRO_LABEL_RADIUS_MI = 30;

// ── Local areas (precise-location labels) ────────────────────────────────────
// The neighborhood-level names our members actually use for themselves: Keith
// says "the North Hills", Brian says "New Kensington" (and the Alle-Kiski
// Valley more broadly). We only ever apply these when we have PRECISE
// coordinates from GPS. IP geolocation is ~10mi off around here, which is wider
// than the suburbs themselves, so naming a suburb from an IP would just be a
// different wrong answer stated more confidently.
//
// `key` indexes SEED_PLACES so the coordinates stay in one place, `label` is the
// display name, and `region` adds the local nickname a resident would recognize.
const LOCAL_AREA_RADIUS_MI = 6;
const LOCAL_AREAS: { key: string; label: string; region?: string }[] = [
  // North Hills (Keith's area) — the townships read as one place locally.
  { key: 'north hills', label: 'North Hills' },
  { key: 'mccandless', label: 'North Hills' },
  { key: 'ross', label: 'North Hills' },
  { key: 'west view', label: 'North Hills' },
  { key: 'hampton', label: 'North Hills' },
  { key: 'allison park', label: 'North Hills' },
  { key: 'glenshaw', label: 'North Hills' },
  { key: 'shaler', label: 'North Hills' },
  { key: 'franklin park', label: 'North Hills' },
  { key: 'wexford', label: 'Wexford' },
  { key: 'cranberry', label: 'Cranberry' },
  { key: 'gibsonia', label: 'Gibsonia' },
  // Alle-Kiski Valley (Brian's market) — town name plus the regional nickname.
  { key: 'new kensington', label: 'New Kensington', region: 'Alle-Kiski' },
  { key: 'lower burrell', label: 'Lower Burrell', region: 'Alle-Kiski' },
  { key: 'upper burrell', label: 'Upper Burrell', region: 'Alle-Kiski' },
  { key: 'arnold', label: 'Arnold', region: 'Alle-Kiski' },
  { key: 'tarentum', label: 'Tarentum', region: 'Alle-Kiski' },
  { key: 'brackenridge', label: 'Brackenridge', region: 'Alle-Kiski' },
  { key: 'natrona heights', label: 'Natrona Heights', region: 'Alle-Kiski' },
  { key: 'vandergrift', label: 'Vandergrift', region: 'Alle-Kiski' },
  { key: 'leechburg', label: 'Leechburg', region: 'Alle-Kiski' },
  { key: 'apollo', label: 'Apollo', region: 'Alle-Kiski' },
  { key: 'springdale', label: 'Springdale', region: 'Alle-Kiski' },
  { key: 'cheswick', label: 'Cheswick', region: 'Alle-Kiski' },
  { key: 'freeport', label: 'Freeport', region: 'Alle-Kiski' },
  { key: 'creighton', label: 'Creighton', region: 'Alle-Kiski' },
  { key: 'harmarville', label: 'Harmarville' },
  { key: 'oakmont', label: 'Oakmont' },
  { key: 'plum', label: 'Plum' },
  { key: 'verona', label: 'Verona' },
  { key: 'fox chapel', label: 'Fox Chapel' },
  { key: 'aspinwall', label: 'Aspinwall' },
  { key: 'sharpsburg', label: 'Sharpsburg' },
  { key: 'etna', label: 'Etna' },
  { key: 'millvale', label: 'Millvale' },
  { key: 'bellevue', label: 'Bellevue' },
  { key: 'avalon', label: 'Avalon' },
  { key: 'sewickley', label: 'Sewickley' },
  { key: 'moon', label: 'Moon' },
  { key: 'coraopolis', label: 'Coraopolis' },
  { key: 'robinson', label: 'Robinson' },
  { key: 'monroeville', label: 'Monroeville' },
  { key: 'penn hills', label: 'Penn Hills' },
  { key: 'wilkinsburg', label: 'Wilkinsburg' },
  { key: 'south hills', label: 'South Hills' },
  { key: 'mount lebanon', label: 'Mt. Lebanon' },
  { key: 'bethel park', label: 'Bethel Park' },
  { key: 'dormont', label: 'Dormont' },
  { key: 'green tree', label: 'Green Tree' },
  // City neighborhoods — a resident says these, not "Pittsburgh".
  { key: 'shadyside', label: 'Shadyside' },
  { key: 'squirrel hill', label: 'Squirrel Hill' },
  { key: 'lawrenceville', label: 'Lawrenceville' },
  { key: 'bloomfield', label: 'Bloomfield' },
  { key: 'east liberty', label: 'East Liberty' },
  { key: 'oakland', label: 'Oakland' },
  { key: 'south side', label: 'South Side' },
  { key: 'mount washington', label: 'Mount Washington' },
];

/**
 * The neighborhood-level name for a PRECISE position, e.g. "North Hills" or
 * "New Kensington (Alle-Kiski)". Null when nothing is close enough — the caller
 * then falls back to the metro. Never call this with IP-derived coordinates.
 */
export function localAreaLabel(
  coords: Coords | null | undefined,
  maxMi = LOCAL_AREA_RADIUS_MI,
): string | null {
  if (!coords) return null;
  let best: { label: string; region?: string } | null = null;
  let bestD = Infinity;
  for (const area of LOCAL_AREAS) {
    const c = SEED_PLACES[area.key];
    if (!c) continue;
    const d = milesBetween(coords, c);
    if (d < bestD) { bestD = d; best = area; }
  }
  if (!best || bestD > maxMi) return null;
  return best.region ? `${best.label} (${best.region})` : best.label;
}

/**
 * The city name to SHOW for an auto-detected location.
 *
 *   precise (GPS) → the local area they'd actually name for themselves
 *   IP only       → the metro, because the reported suburb is unreliable
 *   neither       → whatever was detected, unchanged
 *
 * A city the visitor typed themselves never comes through here — an explicit
 * choice is never second-guessed.
 */
export function displayCity(
  detected: string | null | undefined,
  coords: Coords | null | undefined,
  precise = false,
): string | null {
  if (precise) {
    const area = localAreaLabel(coords);
    if (area) return area;
  }
  return nearestMetro(coords, METRO_LABEL_RADIUS_MI) ?? detected ?? null;
}

const GEO_CACHE_KEY = 'cbl_geocode_v1';
function readGeoCache(): Record<string, Coords> {
  try {
    return JSON.parse(localStorage.getItem(GEO_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}
function writeGeoCache(cache: Record<string, Coords>) {
  try {
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* non-fatal */
  }
}

// Resolve a place name to coordinates: gazetteer → localStorage cache →
// first-party proxy → direct keyless provider. Best-effort; returns null if
// nothing resolves.
export async function forwardGeocode(place: string): Promise<Coords | null> {
  const seed = seedCoords(place);
  if (seed) return seed;
  const key = normalizePlace(place);
  if (!key) return null;
  const cache = readGeoCache();
  if (cache[key]) return cache[key];

  // Primary path: our own /api/geocode function (netlify/functions/geocode.js
  // — the same one EatsAndDrinks.tsx already uses for its city search). It's
  // same-origin, so it's never blocked by CSP connect-src, and it holds the
  // Google key server-side (falling back to keyless OpenStreetMap itself if
  // unset) — so this works with NO client-exposed API key at all.
  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(place)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.coord) && typeof data.coord[0] === 'number') {
        const coords = { lat: data.coord[0], lng: data.coord[1] };
        cache[key] = coords;
        writeGeoCache(cache);
        return coords;
      }
    }
  } catch {
    /* fall through to direct providers below */
  }

  // Fallbacks below call Google/OpenStreetMap directly from the browser —
  // kept as a last resort for the (unlikely) case the function itself is
  // unreachable. Note the OpenStreetMap call requires nominatim.openstreetmap.org
  // to be allowed in the site's CSP connect-src, which isn't guaranteed.
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(place)}&key=${apiKey}`
      );
      const data = await res.json();
      const loc = data?.results?.[0]?.geometry?.location;
      if (loc && typeof loc.lat === 'number') {
        const coords = { lat: loc.lat, lng: loc.lng };
        cache[key] = coords;
        writeGeoCache(cache);
        return coords;
      }
    } catch {
      /* fall through to keyless provider */
    }
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(place)}`
    );
    const data = await res.json();
    const hit = Array.isArray(data) ? data[0] : null;
    if (hit && hit.lat && hit.lon) {
      const coords = { lat: parseFloat(hit.lat), lng: parseFloat(hit.lon) };
      cache[key] = coords;
      writeGeoCache(cache);
      return coords;
    }
  } catch {
    /* give up — caller falls back to name matching */
  }
  return null;
}

// Automatic, keyless IP-based geolocation — like the live site, this "just
// picks up" the visitor's city instantly with NO permission prompt. Returns a
// city-level location + approximate coordinates. Falls back across providers.
async function ipLocate(): Promise<{ city: string; state: string; coords: Coords } | null> {
  try {
    const res = await fetch('https://ipwho.is/');
    const d = await res.json();
    if (d && d.success !== false && d.city && typeof d.latitude === 'number') {
      return { city: d.city, state: d.region_code || '', coords: { lat: d.latitude, lng: d.longitude } };
    }
  } catch {
    // try the next provider
  }
  try {
    const res = await fetch('https://ipapi.co/json/');
    const d = await res.json();
    if (d && d.city && typeof d.latitude === 'number') {
      return { city: d.city, state: d.region_code || d.region || '', coords: { lat: d.latitude, lng: d.longitude } };
    }
  } catch {
    // give up — caller keeps its default market
  }
  return null;
}

export function useVisitorLocation() {
  const [location, setLocation] = useState<StoredCity | null>(() => readStoredCity());
  const [coords, setCoords] = useState<Coords | null>(null);
  const [precise, setPrecise] = useState(false);
  // Ref mirror of `precise` so the (mount-time) IP callback checks the CURRENT
  // value — otherwise its stale closure would overwrite precise GPS coords.
  const preciseRef = useRef(false);
  // A STORED city can only have come from setManualCity (IP results are
  // deliberately never persisted), so restoring one means the visitor picked it
  // themselves — report that as 'manual' so callers know not to re-snap it to a
  // metro on the next visit.
  const [status, setStatus] = useState<VisitorLocationStatus>(location ? 'manual' : 'idle');

  useEffect(() => {
    let cancelled = false;
    const hadManualCity = !!location; // a stored city means the visitor chose it
    if (!hadManualCity) setStatus('locating');

    // Automatic IP lookup: no prompt, resolves instantly. Always sets coords
    // (used to order results by distance); only sets the city name when the
    // visitor hasn't already picked one.
    ipLocate().then((r) => {
      if (cancelled) return;
      if (!r) {
        if (!hadManualCity) setStatus('unavailable');
        return;
      }
      setCoords((prev) => (preciseRef.current ? prev : r.coords));
      if (!hadManualCity) {
        setLocation({ city: r.city, state: r.state });
        setStatus('resolved');
      }
    });
    return () => {
      cancelled = true;
    };
    // Run once on mount. IP city is intentionally not persisted so coords stay
    // fresh each visit; only manual picks persist (see setManualCity).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Optional precision upgrade — GPS (prompts once) for exact nearest-first.
  const requestPrecise = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        preciseRef.current = true;
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPrecise(true);
      },
      () => {
        /* denied — the IP-based coords remain in effect */
      },
      { timeout: 8000 }
    );
  };

  const setManualCity = (city: string, state = '') => {
    setLocation({ city, state });
    storeCity(city, state);
    setStatus('manual');
  };

  /** Forget a manually picked city and go back to where the visitor actually is.
   *
   *  A manual pick persists across visits by design, which is right until there is
   *  no way to undo it: search one other city and you are left there for good,
   *  with the only way home being to know and retype your own area's name (Keith,
   *  2026-08-24, stuck on New Kensington after checking Brian's ads). Clears the
   *  stored city, re-runs the keyless IP lookup, and asks for GPS so the result is
   *  the visitor's real area rather than the metro guess. */
  const useMyLocation = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private browsing — nothing stored to clear */
    }
    setLocation(null);
    setStatus('locating');
    ipLocate().then((r) => {
      if (!r) { setStatus('unavailable'); return; }
      setCoords((prev) => (preciseRef.current ? prev : r.coords));
      setLocation({ city: r.city, state: r.state });
      setStatus('resolved');
    });
    requestPrecise();
  };

  return {
    city: location?.city ?? null,
    state: location?.state ?? null,
    coords,
    precise,
    status,
    setManualCity,
    useMyLocation,
    requestPrecise,
    // Exposed for callers that want to reverse-geocode raw coordinates.
    reverseGeocode,
  };
}
