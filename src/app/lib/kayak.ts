/**
 * KAYAK affiliate deep-link builder — PORTABLE across the CBL marketing site and
 * Justin's app. Copy this file verbatim into the app (only change SURFACE to 'app').
 *
 * Every Travels booking link attributes to KAYAK_AFFILIATE_ID. The KAYAK portal
 * approval is still under review (2026-07-12), so that's a PLACEHOLDER — when the
 * approval email lands and Keith pulls the real deeplink from the Deeplinks tool,
 * swap that ONE value and the whole page goes live.
 *
 * If KAYAK's generated link turns out to use a different shape (e.g. an
 * `/in?a=...&url=<encoded>` redirect), change `withAffiliate()` + the path builders
 * here — ONE place, and every button on the site (and app) updates with it.
 */

// ── The single config value ──────────────────────────────────────────────────
// PLACEHOLDER — replace with the real KAYAK affiliate id once the portal approves.
// (Documented pattern: https://www.kayak.com/hotels?a=AFFILIATE_ID)
export const KAYAK_AFFILIATE_ID = 'AFFILIATE_ID';

// Which surface these links come from, so KAYAK's reports can split site vs app.
// The app's copy of this file sets this to 'app'. (Confirm the exact sub param
// against the real deeplink — KAYAK commonly uses `sub`/`sub_id`; adjust below.)
const SURFACE = 'site';

const BASE = 'https://www.kayak.com';

// The ONE place the affiliate link shape lives.
function withAffiliate(path: string): string {
  const sep = path.includes('?') ? '&' : '?';
  return `${BASE}${path}${sep}a=${encodeURIComponent(KAYAK_AFFILIATE_ID)}&sub=${SURFACE}`;
}

// KAYAK location slug: "Pittsburgh, PA" → "Pittsburgh,PA"; "New York, NY" → "New-York,NY".
const loc = (s: string) => s.trim().replace(/\s*,\s*/g, ',').replace(/\s+/g, '-');

export type HotelSearch = {
  destination: string; // "Miami, FL"
  checkIn?: string; // "2026-05-23"
  checkOut?: string; // "2026-05-25"
  guests?: number;
};

// Search bar → KAYAK hotel results for a destination (+ optional dates/guests).
export function kayakHotelSearch({ destination, checkIn, checkOut, guests }: HotelSearch): string {
  if (!destination.trim()) return withAffiliate('/hotels');
  let path = `/hotels/${loc(destination)}`;
  if (checkIn && checkOut) path += `/${checkIn}/${checkOut}`;
  if (guests && guests > 0) path += `/${guests}adults`;
  return withAffiliate(path);
}

// "Book Now" on a stay card → KAYAK hotels in that city. (Precise per-hotel deep
// links need KAYAK hotel IDs from the API — a Phase-2 upgrade; city search is the
// honest deep link until then.)
export function kayakHotel(_name: string, city: string): string {
  return kayakHotelSearch({ destination: city });
}

// Flights tab (wired in the next section) → KAYAK flight results for a route.
export function kayakFlight(from: string, to: string, date?: string): string {
  let path = `/flights/${from}-${to}`;
  if (date) path += `/${date}`;
  return withAffiliate(path);
}
