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

/** Wrap any Expedia/Hotels.com/Vrbo URL in our tracked Partnerize click. */
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
};

/** Raw (untracked) Expedia hotel-search URL. Exported for tests/preview only. */
export function expediaStayUrl({ destination, checkIn, checkOut, guests }: StaySearch): string {
  const u = new URL('https://www.expedia.com/Hotel-Search');
  if (destination.trim()) u.searchParams.set('destination', destination.trim());
  if (checkIn && checkOut) {
    u.searchParams.set('startDate', checkIn);
    u.searchParams.set('endDate', checkOut);
  }
  if (guests && guests > 0) u.searchParams.set('adults', String(guests));
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
