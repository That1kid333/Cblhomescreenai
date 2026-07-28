/**
 * Central Travelpayouts affiliate config — the ONE place that owns our marker,
 * traffic source, per-program city coverage, and base deep links. Components
 * never hardcode an affiliate URL; they call buildAffiliateLink() / affiliateHref()
 * with a placement tag and let this module decide the destination.
 *
 * Base links are the real, live Travelpayouts deeplinks (generated 2026-07-25).
 * They carry our marker (704468), traffic source (trs=499800), the per-brand
 * campaign_id and program-placement id (p), and a url-encoded destination (u).
 * buildAffiliateLink() re-targets `u` to the specific city page and appends a
 * per-placement sub_id; every other param is passed through UNCHANGED per brand.
 *
 * NOTE: these use `marker=` (NOT `shmarker=`) and have no `promo_id` — that's the
 * standard tp.media/r deeplink format. Do not "normalize" the params; shmarker
 * belongs to White Label widgets, which we don't use.
 *
 * Compliance (per the CBL media kit): every affiliate anchor uses
 * target="_blank" rel="sponsored nofollow noopener", and any section containing
 * affiliate links renders <AffiliateDisclosure/>.
 */

import { milesBetween, type Coords } from './location';

// Our Travelpayouts affiliate marker / account id, and our traffic source.
// Both are baked into every base link below; kept here for reference/config.
export const TP_MARKER = '704468';
export const TP_TRS = '499800';

/**
 * Live base Travelpayouts deeplink per program (from the dashboard). Single
 * source of truth — buildAffiliateLink() re-targets `u` and adds a sub_id, and
 * passes campaign_id/marker/p/trs through unchanged. An empty string would gate
 * that program off (buildAffiliateLink → null → UI hides it); all five are wired.
 */
const PROGRAM_BASE: Partial<Record<Program, string>> = {
  tiqets: 'https://tp.media/r?campaign_id=89&marker=704468&p=2074&trs=499800&u=https%3A%2F%2Ftiqets.com',
  klook: 'https://tp.media/r?campaign_id=137&marker=704468&p=4110&trs=499800&u=https%3A%2F%2Fwww.klook.com',
  gocity: 'https://tp.media/r?campaign_id=62&marker=704468&p=1942&trs=499800&u=https%3A%2F%2Fgocity.com',
  ticketnetwork: 'https://tp.media/r?campaign_id=72&marker=704468&p=1948&trs=499800&u=https%3A%2F%2Fwww.ticketnetwork.com',
  wegotrip: 'https://tp.media/r?campaign_id=150&marker=704468&p=4487&trs=499800&u=https%3A%2F%2Fwegotrip.com',
  // Viator — the NATIONWIDE local-experiences layer (covers ~any US city, so it's
  // driven by the visitor's detected location). Empty until Keith pastes the base
  // link from the TP dashboard → dark-launched (preview shows the plain link).
  viator: '',
  // BikesBooking — bike/scooter/motorcycle rentals, location-driven (search by city).
  // LIVE (unlocked 2026-07-26). 4% / 30-day cookie / MOBILE WEB ONLY (no app tracking).
  bikesbooking: 'https://tp.media/r?campaign_id=57&marker=704468&p=1767&trs=499800&u=https%3A%2F%2Fwww.bikesbooking.com',
};

export type Program =
  | 'tiqets' | 'klook' | 'gocity' | 'ticketnetwork' | 'wegotrip' | 'viator' | 'bikesbooking'
  // Awin network (not Travelpayouts) — see AWIN_AFFID / AWIN_MID below.
  | 'turbopass' | 'usaguidedtours';

// ── Awin network ─────────────────────────────────────────────────────────────
// Turbopass (city passes) is our first Awin merchant — a SECOND affiliate network
// with a different link anatomy from Travelpayouts. Awin links are
//   https://www.awin1.com/cread.php?awinmid=<merchant>&awinaffid=<publisher>&ued=<enc dest>&clickref=<placement>
// where `awinaffid` is our fixed publisher id, `awinmid` is the merchant, `ued` is
// the url-encoded destination, and `clickref` is Awin's per-placement attribution
// (their equivalent of Travelpayouts' sub_id). buildAffiliateLink() dispatches to
// the Awin format for any program listed in AWIN_MID, else the tp.media format.
const AWIN_AFFID = '2772460'; // our Awin publisher id — must never change
const AWIN_MID: Partial<Record<Program, string>> = {
  turbopass: '100613', // Turbopass US (approved 2026-07-27) — ≥6% commission, avg cart >€230
  usaguidedtours: '37792', // USA Guided Tours (approved 2026-07-27) — guided sightseeing, DC + NYC only
};

// Preview/localhost detection — mirrors auth.tsx's isPreviewHost so the
// un-monetized design preview only ever appears off production.
function isPreviewHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.netlify.app');
}

/** True once a program can earn — a Travelpayouts base link is pasted, or it's an Awin merchant. */
export function isProgramReady(program: Program): boolean {
  return !!AWIN_MID[program] || !!PROGRAM_BASE[program];
}

/**
 * Wrap a destination in our tracked Travelpayouts link: take the program's base
 * deeplink, point `u` at the specific city page, and tag the placement as a
 * sub_id so TP reports show which surface earned (e.g. attractions_new-york_local).
 * campaign_id / marker / p / trs pass through unchanged. Returns null if the
 * program is unwired or no destination is given — callers treat null as "hide me".
 *
 *   base: https://tp.media/r?campaign_id=89&marker=704468&p=2074&trs=499800&u=https%3A%2F%2Ftiqets.com
 *   out:  https://tp.media/r?campaign_id=89&marker=704468&p=2074&trs=499800&u=<enc city page>&sub_id=<placement>
 */
export function buildAffiliateLink(
  program: Program,
  target: string,
  placement: string,
): string | null {
  if (!target) return null;

  // Awin network (awin1.com/cread) — different anatomy from tp.media. `awinmid` is
  // the merchant, `awinaffid` our fixed publisher, `ued` the destination, `clickref`
  // the per-placement attribution. Handled BEFORE PROGRAM_BASE (Awin has no tp base).
  const awinMid = AWIN_MID[program];
  if (awinMid) {
    const url = new URL('https://www.awin1.com/cread.php');
    url.searchParams.set('awinmid', awinMid);
    url.searchParams.set('awinaffid', AWIN_AFFID);
    url.searchParams.set('ued', target); // URL handles the encoding
    url.searchParams.set('clickref', placement);
    return url.toString();
  }

  // Travelpayouts network (tp.media/r deeplink).
  const base = PROGRAM_BASE[program];
  if (!base) return null;
  const url = new URL(base);
  url.searchParams.set('u', target); // URL handles the encoding; replaces the base destination
  url.searchParams.set('sub_id', placement);
  return url.toString();
}

export type AffiliateHref = { href: string; tracked: boolean } | null;

// Programs that are BUILT but PARKED — hidden EVERYWHERE (preview included) until
// their tier/approval opens, so the preview isn't cluttered by something months
// out. The config/UI stay ready; to launch, remove it here AND paste its base
// link. Viator: gated in TP's locked tier, review deferred to ~Oct.
const PARKED_PROGRAMS = new Set<Program>(['viator']);

/**
 * Resolve the href a component should actually use:
 *   - parked program           → null (hidden everywhere, incl. preview)
 *   - program wired            → tracked TP link
 *   - not wired, preview host  → plain destination (un-monetized, for design review)
 *   - not wired, production    → null (component hides the block)
 */
export function affiliateHref(program: Program, target: string, placement: string): AffiliateHref {
  if (PARKED_PROGRAMS.has(program)) return null;
  const tracked = buildAffiliateLink(program, target, placement);
  if (tracked) return { href: tracked, tracked: true };
  if (isPreviewHost() && target) return { href: target, tracked: false };
  return null;
}

// The rel every affiliate anchor must carry (FTC + SEO compliance).
export const AFFILIATE_REL = 'sponsored nofollow noopener';

// ── Tiqets city coverage ─────────────────────────────────────────────────────
// The only cities Tiqets currently sells (per program terms). `match` holds the
// activeCity strings (lowercased) that resolve to this destination so detection
// variants ("New York City", "NYC") all map correctly. `target` is the Tiqets
// page `u` points at — New York uses its verified city page (c66097); the rest
// use guaranteed-valid Tiqets search URLs (swap in verified city-page IDs later
// for nicer landing pages). `tint`/`fromPrice`/`count` are card copy, tune freely.
export type TiqetsCity = {
  key: string;
  match: string[];
  name: string;
  country: string;
  target: string;
  tint: string;      // per-city gradient tint over the shared map texture (fallback)
  photo?: string;    // self-hosted city photo (e.g. /attractions/cities/paris.jpg); overrides tint
  fromPrice: string;
  count: string;
};

export const TIQETS_CITIES: TiqetsCity[] = [
  { key: 'new-york', match: ['new york', 'new york city', 'nyc', 'manhattan', 'brooklyn'], name: 'New York', country: 'USA', target: 'https://tiqets.com/en/new-york-c66097/', tint: 'rgba(201,151,66,.55), rgba(10,10,10,.86)', photo: '/attractions/cities/new-york.jpg', fromPrice: 'from $22', count: '250+ things to do' },
  { key: 'paris', match: ['paris'], name: 'Paris', country: 'France', target: 'https://www.tiqets.com/en/search?q=Paris', tint: 'rgba(120,90,180,.5), rgba(10,10,10,.86)', photo: '/attractions/cities/paris.jpg', fromPrice: 'from $18', count: '200+ things to do' },
  { key: 'rome', match: ['rome', 'roma'], name: 'Rome', country: 'Italy', target: 'https://www.tiqets.com/en/search?q=Rome', tint: 'rgba(180,110,60,.5), rgba(10,10,10,.86)', photo: '/attractions/cities/rome.jpg', fromPrice: 'from $16', count: '220+ things to do' },
  { key: 'milan', match: ['milan', 'milano'], name: 'Milan', country: 'Italy', target: 'https://www.tiqets.com/en/search?q=Milan', tint: 'rgba(90,120,150,.5), rgba(10,10,10,.86)', photo: '/attractions/cities/milan.jpg', fromPrice: 'from $14', count: '120+ things to do' },
  { key: 'florence', match: ['florence', 'firenze'], name: 'Florence', country: 'Italy', target: 'https://www.tiqets.com/en/search?q=Florence', tint: 'rgba(160,120,70,.5), rgba(10,10,10,.86)', photo: '/attractions/cities/florence.jpg', fromPrice: 'from $17', count: '90+ things to do' },
  { key: 'venice', match: ['venice', 'venezia'], name: 'Venice', country: 'Italy', target: 'https://www.tiqets.com/en/search?q=Venice', tint: 'rgba(70,130,150,.5), rgba(10,10,10,.86)', photo: '/attractions/cities/venice.jpg', fromPrice: 'from $15', count: '80+ things to do' },
  { key: 'lisbon', match: ['lisbon', 'lisboa'], name: 'Lisbon', country: 'Portugal', target: 'https://www.tiqets.com/en/search?q=Lisbon', tint: 'rgba(200,140,80,.5), rgba(10,10,10,.86)', photo: '/attractions/cities/lisbon.jpg', fromPrice: 'from $13', count: '110+ things to do' },
  { key: 'amsterdam', match: ['amsterdam'], name: 'Amsterdam', country: 'Netherlands', target: 'https://www.tiqets.com/en/search?q=Amsterdam', tint: 'rgba(150,90,60,.5), rgba(10,10,10,.86)', photo: '/attractions/cities/amsterdam.jpg', fromPrice: 'from $19', count: '160+ things to do' },
  { key: 'london', match: ['london'], name: 'London', country: 'UK', target: 'https://www.tiqets.com/en/search?q=London', tint: 'rgba(100,110,130,.5), rgba(10,10,10,.86)', photo: '/attractions/cities/london.jpg', fromPrice: 'from $21', count: '240+ things to do' },
];

/** Find the Tiqets city that matches the visitor's active city, if any. */
export function tiqetsCityFor(activeCity: string | null | undefined): TiqetsCity | null {
  if (!activeCity) return null;
  const c = activeCity.trim().toLowerCase();
  return TIQETS_CITIES.find((city) => city.match.includes(c)) ?? null;
}

// ── Shared city registry ─────────────────────────────────────────────────────
// All programs reuse the same self-hosted city photos, keyed by slug. PHOTO_V is
// a cache-buster — bump it whenever a city photo is swapped in place (same
// filename) so browsers/CDN fetch the new image instead of the stale cached one.
const PHOTO_V = '2';
export const cityPhoto = (key: string) => `/attractions/cities/${key}.jpg?v=${PHOTO_V}`;
const NEUTRAL_TINT = 'rgba(201,151,66,.35), rgba(10,10,10,.86)';

// ── Partner metadata (drives the source-briefing strip + the on-site detail
// panel). One place per brand for its logo, CTA verb, one-line briefing, and the
// "what you get" highlights shown before the hand-off. ─────────────────────────
export type PartnerMeta = {
  partner: string;
  logo: string;      // self-hosted brand logo (shown on a white chip on dark)
  cta: string;       // button verb, e.g. "Book tickets"
  briefing: string;  // one-liner: who they are
  highlights: string[];
};
export const PARTNER_META: Partial<Record<Program, PartnerMeta>> = {
  tiqets: {
    partner: 'Tiqets',
    logo: '/attractions/tiqets-logo.svg',
    cta: 'Book tickets',
    briefing:
      'Tickets powered by Tiqets — an online booking platform for museums and attractions that connects travelers worldwide with more ways to experience culture.',
    highlights: [
      'Skip-the-line & timed-entry tickets',
      'Instant tickets on your phone',
      'Free cancellation on many options',
      'Museums, landmarks & experiences',
    ],
  },
  gocity: {
    partner: 'Go City',
    logo: '/attractions/gocity-logo.svg',
    cta: 'Get the pass',
    briefing:
      'Passes powered by Go City — one pass gets you into dozens of a city’s top attractions for a single price, with big savings versus buying separately.',
    highlights: [
      'One pass, dozens of top attractions',
      'Save up to 50% vs buying separately',
      'All-Inclusive or build-your-own passes',
      'On your phone — nothing to print',
    ],
  },
  turbopass: {
    partner: 'Turbopass',
    logo: '/attractions/turbopass-logo.svg',
    cta: 'Get the pass',
    briefing:
      'City passes powered by Turbopass — one digital pass covers a city’s top attractions, museums and often public transport, delivered to your phone.',
    highlights: [
      'One digital pass, dozens of top attractions',
      'Public transport included in many cities',
      'Delivered instantly to your phone',
      'Flexible 1–7 day validity',
    ],
  },
  usaguidedtours: {
    partner: 'USA Guided Tours',
    logo: '/attractions/usaguidedtours-logo.svg',
    cta: 'Book a tour',
    briefing:
      'Guided sightseeing powered by USA Guided Tours — award-winning bus, boat and walking tours of Washington DC and New York, led by certified local guides.',
    highlights: [
      'Certified local guides',
      'Day, night & private tours',
      'Transport between the big sights',
      'Small-group and VIP options',
    ],
  },
  wegotrip: {
    partner: 'WeGoTrip',
    logo: '/attractions/wegotrip-logo.svg',
    cta: 'Get the tour',
    briefing:
      'Audio tours powered by WeGoTrip — self-guided tours you follow on your phone, at your own pace, with skip-the-line tickets on select tours.',
    highlights: [
      'Self-guided audio tours on your phone',
      'Start, pause and finish anytime',
      'Download once, use offline',
      'Skip-the-line tickets on select tours',
    ],
  },
  viator: {
    partner: 'Viator',
    logo: '/attractions/viator-logo.svg',
    cta: 'See experiences',
    briefing:
      'Local experiences powered by Viator — tours, food crawls, tickets and things to do in almost any city, wherever you are, with real traveler reviews.',
    highlights: [
      'Tours, food crawls, tickets & experiences',
      'Available in almost any city — near you or away',
      'Real traveler reviews & ratings',
      'Free cancellation on most, book on your phone',
    ],
  },
  ticketnetwork: {
    partner: 'TicketNetwork',
    logo: '/attractions/ticketnetwork-logo.svg',
    cta: 'Find tickets',
    briefing:
      'Event tickets powered by TicketNetwork — concerts, sports and live theater in your city and beyond, on a trusted resale marketplace.',
    highlights: [
      'Concerts, sports & live theater',
      'Events near you and nationwide',
      'Seat-by-seat selection',
      'Instant mobile ticket delivery',
    ],
  },
  bikesbooking: {
    partner: 'BikesBooking',
    logo: '/attractions/bikesbooking-logo.png',
    cta: 'Rent a ride',
    briefing:
      'Rentals powered by BikesBooking — compare bikes, scooters and motorcycles from local rental shops and book your ride online.',
    highlights: [
      'Bikes, scooters & motorcycles',
      'Compare local rental shops',
      'Book online, pick up in the city',
      'Great for exploring on two wheels',
    ],
  },
};

// ── Go City coverage (all-in-one city passes). Slug = the /en/{slug} path on
// gocity.com (verified pattern). Big US coverage — its strength. ───────────────
export type GoCityEntry = { key: string; match: string[]; name: string; country: string; slug: string; fromPrice: string; attractions: string };
export const GOCITY_CITIES: GoCityEntry[] = [
  { key: 'new-york', match: ['new york', 'new york city', 'nyc', 'manhattan', 'brooklyn'], name: 'New York', country: 'USA', slug: 'new-york', fromPrice: 'from $89', attractions: '100+ attractions' },
  { key: 'las-vegas', match: ['las vegas', 'vegas'], name: 'Las Vegas', country: 'USA', slug: 'las-vegas', fromPrice: 'from $59', attractions: '45+ attractions' },
  { key: 'orlando', match: ['orlando'], name: 'Orlando', country: 'USA', slug: 'orlando', fromPrice: 'from $115', attractions: '25+ attractions' },
  { key: 'los-angeles', match: ['los angeles', 'la'], name: 'Los Angeles', country: 'USA', slug: 'los-angeles', fromPrice: 'from $95', attractions: '40+ attractions' },
  { key: 'san-francisco', match: ['san francisco', 'sf'], name: 'San Francisco', country: 'USA', slug: 'san-francisco', fromPrice: 'from $94', attractions: '45+ attractions' },
  { key: 'miami', match: ['miami'], name: 'Miami', country: 'USA', slug: 'miami', fromPrice: 'from $99', attractions: '35+ attractions' },
  { key: 'chicago', match: ['chicago'], name: 'Chicago', country: 'USA', slug: 'chicago', fromPrice: 'from $109', attractions: '30+ attractions' },
  { key: 'boston', match: ['boston'], name: 'Boston', country: 'USA', slug: 'boston', fromPrice: 'from $69', attractions: '45+ attractions' },
  { key: 'new-orleans', match: ['new orleans', 'nola'], name: 'New Orleans', country: 'USA', slug: 'new-orleans', fromPrice: 'from $79', attractions: '25+ attractions' },
  { key: 'london', match: ['london'], name: 'London', country: 'UK', slug: 'london', fromPrice: 'from $99', attractions: '90+ attractions' },
  { key: 'paris', match: ['paris'], name: 'Paris', country: 'France', slug: 'paris', fromPrice: 'from $85', attractions: '45+ attractions' },
  { key: 'rome', match: ['rome', 'roma'], name: 'Rome', country: 'Italy', slug: 'rome', fromPrice: 'from $99', attractions: '40+ attractions' },
  { key: 'amsterdam', match: ['amsterdam'], name: 'Amsterdam', country: 'Netherlands', slug: 'amsterdam', fromPrice: 'from $75', attractions: '40+ attractions' },
];
export function goCityFor(activeCity: string | null | undefined): GoCityEntry | null {
  if (!activeCity) return null;
  const c = activeCity.trim().toLowerCase();
  return GOCITY_CITIES.find((city) => city.match.includes(c)) ?? null;
}

// ── Turbopass coverage (all-in-one city passes, via Awin). Mostly European cities
// + New York (their only US city). `url` is the VERIFIED live city-pass page — the
// European cities use /en/{city}/{city}-city-pass; New York uses its legacy
// /new-york-sightseeing-pass path. Complements Go City rather than replacing it;
// only the cities Turbopass actually covers are listed (no guessed URLs). ────────
export type TurbopassCity = { key: string; match: string[]; name: string; country: string; url: string };
export const TURBOPASS_CITIES: TurbopassCity[] = [
  { key: 'new-york', match: ['new york', 'new york city', 'nyc', 'manhattan', 'brooklyn'], name: 'New York', country: 'USA', url: 'https://www.turbopass.com/new-york-sightseeing-pass' },
  { key: 'paris', match: ['paris'], name: 'Paris', country: 'France', url: 'https://www.turbopass.com/en/paris/paris-city-pass' },
  { key: 'rome', match: ['rome', 'roma'], name: 'Rome', country: 'Italy', url: 'https://www.turbopass.com/en/rome/rome-city-pass' },
  { key: 'london', match: ['london'], name: 'London', country: 'UK', url: 'https://www.turbopass.com/en/london/london-city-pass' },
  { key: 'florence', match: ['florence', 'firenze'], name: 'Florence', country: 'Italy', url: 'https://www.turbopass.com/en/florence/florence-city-pass' },
];
export function turbopassFor(activeCity: string | null | undefined): TurbopassCity | null {
  if (!activeCity) return null;
  const c = activeCity.trim().toLowerCase();
  return TURBOPASS_CITIES.find((city) => city.match.includes(c)) ?? null;
}

// ── USA Guided Tours coverage (guided sightseeing, via Awin). DC + NYC ONLY —
// VERIFIED on usaguidedtours.com; the "Boston area" in early notes is NOT a real
// market (their site redirects /boston to DC), so it's deliberately not wired.
// USA Guided Tours is the GENERALIST tour partner in these markets; DC is INTERIM —
// swap this entry for a dedicated DC tour merchant (e.g. "Tour of Washington DC")
// once that program approves, without touching NYC. ─────────────────────────────
export type GuidedToursCity = { key: string; match: string[]; name: string; country: string; url: string; fromPrice: string };
export const USAGUIDEDTOURS_CITIES: GuidedToursCity[] = [
  { key: 'washington', match: ['washington', 'washington dc', 'dc', 'washington, d.c.'], name: 'Washington DC', country: 'USA', url: 'https://usaguidedtours.com/dc/tour/', fromPrice: 'from $59' }, // INTERIM DC partner
  { key: 'new-york', match: ['new york', 'new york city', 'nyc', 'manhattan', 'brooklyn'], name: 'New York', country: 'USA', url: 'https://usaguidedtours.com/nyc/tour/', fromPrice: 'from $39' },
];
export function usaGuidedToursFor(activeCity: string | null | undefined): GuidedToursCity | null {
  if (!activeCity) return null;
  const c = activeCity.trim().toLowerCase();
  return USAGUIDEDTOURS_CITIES.find((city) => city.match.includes(c)) ?? null;
}

// ── WeGoTrip coverage (self-guided audio tours). `url` is the exact city page
// from wegotrip.com's sitemap (they use /{slug}-d{id}/). ───────────────────────
export type WeGoTripEntry = { key: string; match: string[]; name: string; country: string; url: string; fromPrice: string };
export const WEGOTRIP_CITIES: WeGoTripEntry[] = [
  { key: 'new-york', match: ['new york', 'new york city', 'nyc', 'manhattan', 'brooklyn'], name: 'New York', country: 'USA', url: 'https://wegotrip.com/new-york-city-d5128581/', fromPrice: 'from $12' },
  { key: 'new-orleans', match: ['new orleans', 'nola'], name: 'New Orleans', country: 'USA', url: 'https://wegotrip.com/new-orleans-d4335045/', fromPrice: 'from $10' },
  { key: 'san-francisco', match: ['san francisco', 'sf'], name: 'San Francisco', country: 'USA', url: 'https://wegotrip.com/san-francisco-5391959-d5391959/', fromPrice: 'from $10' },
  { key: 'los-angeles', match: ['los angeles', 'la'], name: 'Los Angeles', country: 'USA', url: 'https://wegotrip.com/los-angeles-5368361-d5368361/', fromPrice: 'from $10' },
  { key: 'boston', match: ['boston'], name: 'Boston', country: 'USA', url: 'https://wegotrip.com/boston-4930956-d4930956/', fromPrice: 'from $10' },
  { key: 'chicago', match: ['chicago'], name: 'Chicago', country: 'USA', url: 'https://wegotrip.com/chicago-d4887398/', fromPrice: 'from $10' },
  { key: 'miami', match: ['miami'], name: 'Miami', country: 'USA', url: 'https://wegotrip.com/miami-d4164138/', fromPrice: 'from $10' },
  { key: 'las-vegas', match: ['las vegas', 'vegas'], name: 'Las Vegas', country: 'USA', url: 'https://wegotrip.com/las-vegas-d5475433/', fromPrice: 'from $10' },
  { key: 'london', match: ['london'], name: 'London', country: 'UK', url: 'https://wegotrip.com/london-d2643743/', fromPrice: 'from $12' },
  { key: 'paris', match: ['paris'], name: 'Paris', country: 'France', url: 'https://wegotrip.com/paris-d2988507/', fromPrice: 'from $11' },
  { key: 'rome', match: ['rome', 'roma'], name: 'Rome', country: 'Italy', url: 'https://wegotrip.com/rome-d3169070/', fromPrice: 'from $11' },
  { key: 'venice', match: ['venice', 'venezia'], name: 'Venice', country: 'Italy', url: 'https://wegotrip.com/venice-d3164603/', fromPrice: 'from $11' },
  { key: 'florence', match: ['florence', 'firenze'], name: 'Florence', country: 'Italy', url: 'https://wegotrip.com/florence-d3176959/', fromPrice: 'from $11' },
  { key: 'milan', match: ['milan', 'milano'], name: 'Milan', country: 'Italy', url: 'https://wegotrip.com/milan-d3173435/', fromPrice: 'from $11' },
  { key: 'lisbon', match: ['lisbon', 'lisboa'], name: 'Lisbon', country: 'Portugal', url: 'https://wegotrip.com/lisbon-d2267057/', fromPrice: 'from $10' },
  { key: 'amsterdam', match: ['amsterdam'], name: 'Amsterdam', country: 'Netherlands', url: 'https://wegotrip.com/amsterdam-d2759794/', fromPrice: 'from $12' },
];
export function weGoTripFor(activeCity: string | null | undefined): WeGoTripEntry | null {
  if (!activeCity) return null;
  const c = activeCity.trim().toLowerCase();
  return WEGOTRIP_CITIES.find((city) => city.match.includes(c)) ?? null;
}

// ── Unified offer shape consumed by the cards + the on-site detail panel ───────
export type AffiliateOffer = {
  program: Program;
  partner: string;
  cityKey: string;
  name: string;
  country: string;
  photo: string;
  tint: string;
  kicker: string;   // small label, e.g. "All-in-one pass"
  title: string;    // panel headline
  price: string;
  meta: string;     // e.g. "100+ attractions"
  highlights: string[];
  cta: string;
  logo: string;
  href: string;     // resolved tracked link (or preview fallback)
  tracked: boolean;
};

/** Build a Go City offer for a covered city, or null if unwired/unavailable. */
export function goCityOffer(entry: GoCityEntry, placement: string): AffiliateOffer | null {
  const meta = PARTNER_META.gocity!;
  const link = affiliateHref('gocity', `https://gocity.com/en/${entry.slug}`, placement);
  if (!link) return null;
  return {
    program: 'gocity', partner: meta.partner, cityKey: entry.key, name: entry.name, country: entry.country,
    photo: cityPhoto(entry.key), tint: NEUTRAL_TINT, kicker: 'All-in-one pass',
    title: `The ${entry.name} Pass`, price: entry.fromPrice, meta: entry.attractions,
    highlights: meta.highlights, cta: meta.cta, logo: meta.logo, href: link.href, tracked: link.tracked,
  };
}

/** Build a Turbopass city-pass offer for a covered city, or null if unavailable. */
export function turbopassOffer(entry: TurbopassCity, placement: string): AffiliateOffer | null {
  const meta = PARTNER_META.turbopass!;
  const link = affiliateHref('turbopass', entry.url, placement);
  if (!link) return null;
  return {
    program: 'turbopass', partner: meta.partner, cityKey: entry.key, name: entry.name, country: entry.country,
    photo: cityPhoto(entry.key), tint: NEUTRAL_TINT, kicker: 'City pass',
    title: `${entry.name} City Pass`, price: 'See prices', meta: 'Attractions + transport',
    highlights: meta.highlights, cta: meta.cta, logo: meta.logo, href: link.href, tracked: link.tracked,
  };
}

/** Build a USA Guided Tours (guided sightseeing) offer for a covered city. */
export function usaGuidedToursOffer(entry: GuidedToursCity, placement: string): AffiliateOffer | null {
  const meta = PARTNER_META.usaguidedtours!;
  const link = affiliateHref('usaguidedtours', entry.url, placement);
  if (!link) return null;
  return {
    program: 'usaguidedtours', partner: meta.partner, cityKey: entry.key, name: entry.name, country: entry.country,
    photo: cityPhoto(entry.key), tint: NEUTRAL_TINT, kicker: 'Guided tour',
    title: `${entry.name} guided tours`, price: entry.fromPrice, meta: 'Day · night · private',
    highlights: meta.highlights, cta: meta.cta, logo: meta.logo, href: link.href, tracked: link.tracked,
  };
}

/** Build a WeGoTrip offer for a covered city, or null if unwired/unavailable. */
export function weGoTripOffer(entry: WeGoTripEntry, placement: string): AffiliateOffer | null {
  const meta = PARTNER_META.wegotrip!;
  const link = affiliateHref('wegotrip', entry.url, placement);
  if (!link) return null;
  return {
    program: 'wegotrip', partner: meta.partner, cityKey: entry.key, name: entry.name, country: entry.country,
    photo: cityPhoto(entry.key), tint: NEUTRAL_TINT, kicker: 'Self-guided audio tour',
    title: `${entry.name} audio tours`, price: entry.fromPrice, meta: 'Self-guided · offline',
    highlights: meta.highlights, cta: meta.cta, logo: meta.logo, href: link.href, tracked: link.tracked,
  };
}

/** Build a Tiqets offer from a covered city. */
export function tiqetsOffer(entry: TiqetsCity, placement: string): AffiliateOffer | null {
  const meta = PARTNER_META.tiqets!;
  const link = affiliateHref('tiqets', entry.target, placement);
  if (!link) return null;
  return {
    program: 'tiqets', partner: meta.partner, cityKey: entry.key, name: entry.name, country: entry.country,
    photo: entry.photo ?? cityPhoto(entry.key), tint: entry.tint, kicker: 'Skip-the-line tickets',
    title: `Things to do in ${entry.name}`, price: entry.fromPrice, meta: entry.count,
    highlights: meta.highlights, cta: meta.cta, logo: meta.logo, href: link.href, tracked: link.tracked,
  };
}

// ── Self-hosted city photos (slug → /attractions/cities/{slug}.jpg exists). Used
// so a visitor's-own-city card shows a real photo when we have one, else a gradient.
export const CITY_PHOTO_KEYS = new Set([
  'new-york', 'paris', 'rome', 'milan', 'florence', 'venice', 'lisbon', 'amsterdam', 'london',
  'las-vegas', 'orlando', 'los-angeles', 'san-francisco', 'miami', 'chicago', 'boston', 'new-orleans',
  'pittsburgh', 'washington',
]);
export const slugify = (city: string) => city.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const hasCityPhoto = (city: string) => CITY_PHOTO_KEYS.has(slugify(city));

// ── Nearest-metro resolver ───────────────────────────────────────────────────
// IP geolocation often returns a tiny/obscure place (e.g. "Glenmoor") that makes
// no sense as a featured city AND has no affiliate inventory. So the "Near you"
// local card snaps the visitor's coordinates to the nearest MAJOR metro — which
// reads sensibly and is where the bookable events/experiences actually are.
const MAJOR_CITIES: { name: string; lat: number; lng: number }[] = [
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
  { name: 'Oklahoma City', lat: 35.47, lng: -97.52 }, { name: 'Phoenix', lat: 33.45, lng: -112.07 },
];

/** Snap coordinates to the nearest major metro within `maxMi`; null if none/no coords. */
export function nearestMajorCity(coords: Coords | null | undefined, maxMi = 80): string | null {
  if (!coords) return null;
  let best: string | null = null;
  let bestD = Infinity;
  for (const c of MAJOR_CITIES) {
    const d = milesBetween(coords, { lat: c.lat, lng: c.lng });
    if (d < bestD) { bestD = d; best = c.name; }
  }
  return best && bestD <= maxMi ? best : null;
}

// ── Viator: the NATIONWIDE local-experiences layer. Viator covers ~any city, so
// it's driven by the visitor's DETECTED city (same geolocation as Eats/Attractions)
// — not a fixed list. Known cities get a curated destination page; every other city
// uses Viator search (valid anywhere), so "things to do in {your city}" works
// nationwide with no per-city IDs to maintain.
const VIATOR_DEST: Record<string, string> = {
  pittsburgh: 'https://www.viator.com/Pittsburgh/d22639',
};
export function viatorUrl(cityName: string): string {
  return VIATOR_DEST[slugify(cityName)] ?? `https://www.viator.com/searchResults/all?text=${encodeURIComponent(cityName)}`;
}

/** Viator "things to do in {city}" offer for ANY city — the local/nationwide layer. */
export function viatorOffer(cityName: string, placement: string): AffiliateOffer | null {
  const meta = PARTNER_META.viator!;
  const link = affiliateHref('viator', viatorUrl(cityName), placement);
  if (!link) return null;
  const key = slugify(cityName);
  return {
    program: 'viator', partner: meta.partner, cityKey: key, name: cityName, country: '',
    photo: hasCityPhoto(cityName) ? cityPhoto(key) : '', tint: NEUTRAL_TINT, kicker: 'Local experiences',
    title: `Things to do in ${cityName}`, price: 'from $15', meta: 'Tours · food · tickets',
    highlights: meta.highlights, cta: meta.cta, logo: meta.logo, href: link.href, tracked: link.tracked,
  };
}

// ── TicketNetwork: LIVE nationwide events layer (unlocked now). Like Viator, it's
// driven by the visitor's DETECTED city — search?q={city} works for any US city.
// Website-only per program terms (no mobile tracking → no app placements).
export function ticketNetworkUrl(cityName: string): string {
  return `https://www.ticketnetwork.com/search?q=${encodeURIComponent(cityName)}`;
}
export function ticketNetworkOffer(cityName: string, placement: string): AffiliateOffer | null {
  const meta = PARTNER_META.ticketnetwork!;
  const link = affiliateHref('ticketnetwork', ticketNetworkUrl(cityName), placement);
  if (!link) return null;
  const key = slugify(cityName);
  return {
    program: 'ticketnetwork', partner: meta.partner, cityKey: key, name: cityName, country: '',
    photo: hasCityPhoto(cityName) ? cityPhoto(key) : '', tint: NEUTRAL_TINT, kicker: 'Events & tickets',
    title: `Events in ${cityName}`, price: 'See prices', meta: 'Concerts · sports · theater',
    highlights: meta.highlights, cta: meta.cta, logo: meta.logo, href: link.href, tracked: link.tracked,
  };
}

// ── BikesBooking: bike/scooter/motorcycle rentals, location-driven (search by
// city). Nationwide via search?location={city}. Dark-launched until unlocked.
export function bikesBookingUrl(cityName: string): string {
  return `https://bikesbooking.com/en/search?location=${encodeURIComponent(cityName)}`;
}
export function bikesBookingOffer(cityName: string, placement: string): AffiliateOffer | null {
  const meta = PARTNER_META.bikesbooking!;
  const link = affiliateHref('bikesbooking', bikesBookingUrl(cityName), placement);
  if (!link) return null;
  const key = slugify(cityName);
  return {
    program: 'bikesbooking', partner: meta.partner, cityKey: key, name: cityName, country: '',
    photo: hasCityPhoto(cityName) ? cityPhoto(key) : '', tint: NEUTRAL_TINT, kicker: 'Rent a ride',
    title: `Rentals in ${cityName}`, price: 'Bikes · scooters', meta: 'Two-wheel rentals',
    highlights: meta.highlights, cta: meta.cta, logo: meta.logo, href: link.href, tracked: link.tracked,
  };
}

/**
 * Location-driven LOCAL offers for the visitor's detected city — the nationwide
 * "near you" layer. TicketNetwork (events, LIVE now) + Viator (experiences, opens
 * in Oct) + BikesBooking (rentals). Each resolves independently, so today the card
 * is powered by TicketNetwork and the rest join automatically when their base links
 * are wired.
 */
export function localCityOffers(cityName: string, placement: string): AffiliateOffer[] {
  const out: AffiliateOffer[] = [];
  const tn = ticketNetworkOffer(cityName, `${placement}_ticketnetwork_local`);
  if (tn) out.push(tn);
  const v = viatorOffer(cityName, `${placement}_viator_local`);
  if (v) out.push(v);
  const bb = bikesBookingOffer(cityName, `${placement}_bikesbooking_local`);
  if (bb) out.push(bb);
  return out;
}

// ── City-centric model: ONE card per city, every partner's booking option
// attached. Union of the three programs' coverage (17 cities). ─────────────────
export type AffiliateCity = { key: string; match: string[]; name: string; country: string };
export const AFFILIATE_CITIES: AffiliateCity[] = [
  // US first (our home market), then international.
  { key: 'new-york', match: ['new york', 'new york city', 'nyc', 'manhattan', 'brooklyn'], name: 'New York', country: 'USA' },
  { key: 'washington', match: ['washington', 'washington dc', 'dc', 'washington, d.c.'], name: 'Washington DC', country: 'USA' },
  { key: 'las-vegas', match: ['las vegas', 'vegas'], name: 'Las Vegas', country: 'USA' },
  { key: 'los-angeles', match: ['los angeles', 'la'], name: 'Los Angeles', country: 'USA' },
  { key: 'san-francisco', match: ['san francisco', 'sf'], name: 'San Francisco', country: 'USA' },
  { key: 'new-orleans', match: ['new orleans', 'nola'], name: 'New Orleans', country: 'USA' },
  { key: 'miami', match: ['miami'], name: 'Miami', country: 'USA' },
  { key: 'chicago', match: ['chicago'], name: 'Chicago', country: 'USA' },
  { key: 'boston', match: ['boston'], name: 'Boston', country: 'USA' },
  { key: 'orlando', match: ['orlando'], name: 'Orlando', country: 'USA' },
  { key: 'london', match: ['london'], name: 'London', country: 'UK' },
  { key: 'paris', match: ['paris'], name: 'Paris', country: 'France' },
  { key: 'rome', match: ['rome', 'roma'], name: 'Rome', country: 'Italy' },
  { key: 'amsterdam', match: ['amsterdam'], name: 'Amsterdam', country: 'Netherlands' },
  { key: 'venice', match: ['venice', 'venezia'], name: 'Venice', country: 'Italy' },
  { key: 'florence', match: ['florence', 'firenze'], name: 'Florence', country: 'Italy' },
  { key: 'milan', match: ['milan', 'milano'], name: 'Milan', country: 'Italy' },
  { key: 'lisbon', match: ['lisbon', 'lisboa'], name: 'Lisbon', country: 'Portugal' },
];

export function affiliateCityFor(activeCity: string | null | undefined): AffiliateCity | null {
  if (!activeCity) return null;
  const c = activeCity.trim().toLowerCase();
  return AFFILIATE_CITIES.find((city) => city.match.includes(c)) ?? null;
}

/**
 * Every available booking option for a city, across all wired programs, in a
 * sensible order (tickets → pass → audio tour). Each offer keeps its own tracked
 * link + placement sub_id, so a single card still reports per-partner earnings.
 */
export function cityOffers(cityKey: string, placement: string): AffiliateOffer[] {
  const out: AffiliateOffer[] = [];
  const t = TIQETS_CITIES.find((c) => c.key === cityKey);
  if (t) { const o = tiqetsOffer(t, `${placement}_tiqets_${cityKey}`); if (o) out.push(o); }
  const g = GOCITY_CITIES.find((c) => c.key === cityKey);
  if (g) { const o = goCityOffer(g, `${placement}_gocity_${cityKey}`); if (o) out.push(o); }
  const tp = TURBOPASS_CITIES.find((c) => c.key === cityKey);
  if (tp) { const o = turbopassOffer(tp, `${placement}_turbopass_${cityKey}`); if (o) out.push(o); }
  const w = WEGOTRIP_CITIES.find((c) => c.key === cityKey);
  if (w) { const o = weGoTripOffer(w, `${placement}_wegotrip_${cityKey}`); if (o) out.push(o); }
  const ug = USAGUIDEDTOURS_CITIES.find((c) => c.key === cityKey);
  if (ug) { const o = usaGuidedToursOffer(ug, `${placement}_usaguidedtours_${cityKey}`); if (o) out.push(o); }
  // US cities also get TicketNetwork events (it's US-focused).
  const cityMeta = AFFILIATE_CITIES.find((c) => c.key === cityKey);
  if (cityMeta?.country === 'USA') { const o = ticketNetworkOffer(cityMeta.name, `${placement}_ticketnetwork_${cityKey}`); if (o) out.push(o); }
  // Viator covers ~everywhere — add local experiences to every known city too.
  if (cityMeta?.name) { const o = viatorOffer(cityMeta.name, `${placement}_viator_${cityKey}`); if (o) out.push(o); }
  // BikesBooking rentals (dark-launched) — offered per city where wired.
  if (cityMeta?.name) { const o = bikesBookingOffer(cityMeta.name, `${placement}_bikesbooking_${cityKey}`); if (o) out.push(o); }
  return out;
}

// Lowest "from $X" across a city's offers, for the card's headline price.
export function minPrice(offers: AffiliateOffer[]): string {
  const nums = offers.map((o) => Number((o.price.match(/\d+/) || [])[0])).filter((n) => !Number.isNaN(n));
  return nums.length ? `from $${Math.min(...nums)}` : '';
}

// Short option word per program, for the card's "Tickets · Pass · Tours" line.
export const OPTION_WORD: Partial<Record<Program, string>> = {
  tiqets: 'Tickets', gocity: 'Pass', turbopass: 'City pass', wegotrip: 'Audio tours', usaguidedtours: 'Guided tours', ticketnetwork: 'Events', viator: 'Experiences', bikesbooking: 'Rentals',
};
