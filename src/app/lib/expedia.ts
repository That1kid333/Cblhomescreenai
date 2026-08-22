/**
 * Expedia Group Travel Creator Program — our FOURTH affiliate network.
 *
 * Runs on Partnerize, not Travelpayouts/Awin/Impact, so it gets its own module
 * rather than a `Program` entry in affiliates.ts: the link shape is a path of
 * `key:value` segments rather than a query string, and there's nothing to share.
 *
 * Link shape, confirmed against the live network 2026-08-13 by following the
 * redirect — `prf.hn` bounced to
 * `expedia.com/partnernetwork/p/gp/camref:1110lLrVp/pubref:cbl_test/otuid:1/destination:…`,
 * which proves the camref resolves AND that pubref is carried through:
 *
 *   https://prf.hn/click/camref:<camref>/pubref:<placement>/destination:<encoded url>
 *
 * COMMISSION (from the partnership terms): hotels 4%, activities 4%, vacation
 * rentals 2%, packages 2%, cars 1.5%. Flights and cruises pay NOTHING — those
 * stay with KAYAK/Kiwi/Aviasales, which is why this module only builds stays.
 * 7-day cookie, and it's cross-product: a hotel click that turns into a car
 * booking five days later still pays.
 */

/** From the Creator Hub widget builder (data-camref). One account, all placements. */
export const EXPEDIA_CAMREF = '1110lLrVp';

/** Partnerize click router. */
const PRF_CLICK = 'https://prf.hn/click';

/**
 * Per-placement attribution — Expedia's equivalent of Impact's `subId1`, and it
 * lands in the Partnerize reports so we can tell which card earned what.
 *
 * Must survive being a PATH segment: a raw "/" would silently break the link into
 * the wrong Partnerize keys, so anything outside [a-z0-9_-] is folded away.
 */
function pubref(placement: string): string {
  return placement.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
}

/**
 * Wrap any Expedia/Hotels.com/Vrbo URL in our tracked Partnerize click.
 *
 * Deliberately does NOT log. Building a URL is not a click — several callers
 * build the href during render, so logging here counted a "click" for every card
 * on every page view. Call logAffiliateClick() from the onClick instead.
 */
export function expediaLink(destinationUrl: string, placement: string): string {
  const segs = [`camref:${EXPEDIA_CAMREF}`];
  const ref = pubref(placement);
  if (ref) segs.push(`pubref:${ref}`);
  segs.push(`destination:${encodeURIComponent(destinationUrl)}`);
  return `${PRF_CLICK}/${segs.join('/')}`;
}

export type StaySearch = {
  destination: string;
  checkIn?: string;  // YYYY-MM-DD
  checkOut?: string;
  guests?: number;
  /** Ages of children travelling. Expedia prices by age, so it needs each one. */
  childAges?: number[];
};

/** Raw (untracked) Expedia hotel-search URL. Exported for tests/preview only. */
export function expediaStayUrl({ destination, checkIn, checkOut, guests, childAges }: StaySearch): string {
  const u = new URL('https://www.expedia.com/Hotel-Search');
  if (destination.trim()) u.searchParams.set('destination', destination.trim());
  if (checkIn && checkOut) {
    u.searchParams.set('startDate', checkIn);
    u.searchParams.set('endDate', checkOut);
  }
  if (guests && guests > 0) u.searchParams.set('adults', String(guests));
  // Expedia prices children by age (cot vs extra bed vs adult rate), so it wants
  // each age, not a count: children=1_7,1_10 is "two kids, aged 7 and 10".
  if (childAges && childAges.length) {
    u.searchParams.set('children', childAges.map((a) => `1_${Math.max(0, Math.min(17, a))}`).join(','));
  }
  return u.toString();
}

/** Search bar → tracked Expedia stay results. */
export function expediaStaySearch(search: StaySearch, placement: string): string {
  return expediaLink(expediaStayUrl(search), placement);
}

/**
 * "Book Now" on a stay card → tracked Expedia results for that property.
 *
 * Sends "<name>, <city>" rather than the city alone (which is all the KAYAK
 * builder could do). Expedia's destination search resolves a named property, so
 * this lands much closer to the actual hotel. A true per-property deep link needs
 * Expedia property IDs, which is a later upgrade once we hold real inventory.
 */
export function expediaStay(name: string, city: string, placement: string): string {
  const destination = [name, city].filter(Boolean).join(', ');
  return expediaLink(expediaStayUrl({ destination }), placement);
}

export type FlightSearch = {
  /** Origin — IATA code or city name. Expedia resolves both. */
  from: string;
  to: string;
  departISO?: string | null; // YYYY-MM-DD
  returnISO?: string | null; // omit for one way
  adults?: number;
};

/**
 * Raw (untracked) Expedia flight-search URL.
 *
 * Expedia's flight search takes a colon-delimited `leg` per direction:
 *   leg1=from:PIT,to:BNA,departure:2026-08-23TANYT
 * `trip=oneway|roundtrip` and `passengers=adults:2` complete it.
 */
export function expediaFlightUrl({ from, to, departISO, returnISO, adults }: FlightSearch): string {
  const u = new URL('https://www.expedia.com/Flights-Search');
  const leg = (a: string, b: string, d?: string | null) =>
    `from:${a.trim()},to:${b.trim()}${d ? `,departure:${d}TANYT` : ''}`;
  u.searchParams.set('trip', returnISO ? 'roundtrip' : 'oneway');
  u.searchParams.set('leg1', leg(from, to, departISO));
  if (returnISO) u.searchParams.set('leg2', leg(to, from, returnISO));
  u.searchParams.set('passengers', `adults:${adults && adults > 0 ? adults : 1}`);
  u.searchParams.set('mode', 'search');
  return u.toString();
}

/**
 * Tracked Expedia flight search.
 *
 * ⚠️ EXPEDIA PAYS NOTHING ON FLIGHTS — that is stated in the commission terms and
 * has not changed. This exists anyway for one reason: the affiliate cookie is
 * 7-day and CROSS-PRODUCT. A visitor who clicks a flight is exactly the visitor
 * who needs a room in the same city, and once this link has set the cookie their
 * hotel booking within the week is attributed to us at 4%.
 *
 * So the flight link earns indirectly, and the page says plainly on the flights
 * tab that we make nothing on the flight itself.
 */
export function expediaFlightSearch(search: FlightSearch, placement: string): string {
  return expediaLink(expediaFlightUrl(search), placement);
}

// ── Vrbo (whole homes, cabins, lofts) ───────────────────────────────────────
// Vrbo is an Expedia Group brand, so it rides on the SAME Partnerize camref we
// already use — no second program, no second approval. It pays the vacation
// rental rate (2%), half the hotel rate, which is worth remembering before
// giving it more real estate than hotels.
//
// ⚠️ We cannot render individual Vrbo listings. Google Places has no vacation
// rental inventory (`type=lodging&keyword=vacation rental` returns zero, every
// city, every time), and real listing data needs Expedia's Rapid API, which is
// a separate commercial agreement. So these are honest SEARCHES by place and
// property type, never invented properties with invented ratings.

/** Property kinds we surface. The value is what Vrbo's search reads as a filter phrase. */
export type VrboKind = 'whole homes' | 'cabins' | 'lofts' | 'houses with a pool';

/**
 * Untracked Vrbo search URL for a destination, optionally narrowed by kind.
 *
 * FAILS SAFE BY DESIGN. `destination` carries the place and nothing else, because
 * that is the one parameter whose job is to resolve a location. The property kind
 * rides in a separate `keywords` param, so if Vrbo ignores it the search still
 * returns every rental in the right city rather than breaking.
 *
 * The first draft folded the kind into the destination string ("cabins in
 * Asheville"). That was unverifiable — Vrbo returns 429 to any server-side
 * request, so it cannot be checked from here — and if their geocoder had failed
 * on the phrase, all four cards would have landed on an empty search. Unfiltered
 * but correct beats filtered but broken.
 *
 * ⚠️ `keywords` is NOT a documented Vrbo parameter. It needs one real browser
 * click to confirm whether it narrows the results or is simply ignored. Either
 * outcome ships safely; only the filtering is in question.
 */
export function vrboSearchUrl(destination: string, kind?: VrboKind): string {
  const u = new URL('https://www.vrbo.com/search');
  u.searchParams.set('destination', destination);
  if (kind) u.searchParams.set('keywords', kind);
  return u.toString();
}

/** Tracked Vrbo search, wrapped in our Partnerize click. */
export function vrboSearch(destination: string, kind: VrboKind | undefined, placement: string): string {
  return expediaLink(vrboSearchUrl(destination, kind), placement);
}
