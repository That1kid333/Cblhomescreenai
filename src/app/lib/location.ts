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

// Reverse-geocoding requires VITE_GOOGLE_MAPS_API_KEY; without it we skip
// straight to the manual city picker rather than guessing at a free
// alternative endpoint.
async function reverseGeocode(lat: number, lng: number): Promise<StoredCity | null> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
    const data = await res.json();
    const components = data?.results?.[0]?.address_components ?? [];
    const city = components.find((c: { types: string[] }) => c.types.includes('locality'))?.long_name;
    const state = components.find((c: { types: string[] }) => c.types.includes('administrative_area_level_1'))
      ?.short_name;
    if (!city) return null;
    return { city, state: state ?? '' };
  } catch {
    return null;
  }
}

export function useVisitorLocation() {
  const [location, setLocation] = useState<StoredCity | null>(() => readStoredCity());
  const [status, setStatus] = useState<VisitorLocationStatus>(location ? 'resolved' : 'idle');

  useEffect(() => {
    if (location || typeof navigator === 'undefined' || !navigator.geolocation) {
      if (!location) setStatus('unavailable');
      return;
    }

    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const resolved = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        if (resolved) {
          setLocation(resolved);
          storeCity(resolved.city, resolved.state);
          setStatus('resolved');
        } else {
          setStatus('unavailable');
        }
      },
      () => setStatus('denied'),
      { timeout: 8000 }
    );
  }, [location]);

  const setManualCity = (city: string, state = '') => {
    setLocation({ city, state });
    storeCity(city, state);
    setStatus('manual');
  };

  return {
    city: location?.city ?? null,
    state: location?.state ?? null,
    status,
    setManualCity,
  };
}
