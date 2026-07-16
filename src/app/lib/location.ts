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
// keyless network provider. Best-effort; returns null if nothing resolves.
export async function forwardGeocode(place: string): Promise<Coords | null> {
  const seed = seedCoords(place);
  if (seed) return seed;
  const key = normalizePlace(place);
  if (!key) return null;
  const cache = readGeoCache();
  if (cache[key]) return cache[key];

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
  const [status, setStatus] = useState<VisitorLocationStatus>(location ? 'resolved' : 'idle');

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

  return {
    city: location?.city ?? null,
    state: location?.state ?? null,
    coords,
    precise,
    status,
    setManualCity,
    requestPrecise,
    // Exposed for callers that want to reverse-geocode raw coordinates.
    reverseGeocode,
  };
}
