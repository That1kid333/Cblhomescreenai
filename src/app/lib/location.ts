import { useEffect, useState } from 'react';

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
      setCoords((prev) => (precise ? prev : r.coords));
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
