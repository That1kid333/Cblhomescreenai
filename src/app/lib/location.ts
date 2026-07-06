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

export function useVisitorLocation() {
  const [location, setLocation] = useState<StoredCity | null>(() => readStoredCity());
  const [coords, setCoords] = useState<Coords | null>(null);
  const [status, setStatus] = useState<VisitorLocationStatus>(location ? 'resolved' : 'idle');

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      if (!location) setStatus('unavailable');
      return;
    }

    // Always try for precise coordinates (used to sort results by distance),
    // even when we already know the city. Only reverse-geocode to a city name
    // when we don't have one yet.
    if (!location) setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        if (!location) {
          const resolved = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (resolved) {
            setLocation(resolved);
            storeCity(resolved.city, resolved.state);
            setStatus('resolved');
          } else {
            setStatus('unavailable');
          }
        }
      },
      () => {
        if (!location) setStatus('denied');
      },
      { timeout: 8000 }
    );
    // Run once on mount — a manual city change shouldn't re-prompt for GPS.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setManualCity = (city: string, state = '') => {
    setLocation({ city, state });
    storeCity(city, state);
    setStatus('manual');
  };

  return {
    city: location?.city ?? null,
    state: location?.state ?? null,
    coords,
    status,
    setManualCity,
  };
}
