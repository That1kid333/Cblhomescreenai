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
const PROGRAM_BASE: Record<Program, string> = {
  tiqets: 'https://tp.media/r?campaign_id=89&marker=704468&p=2074&trs=499800&u=https%3A%2F%2Ftiqets.com',
  klook: 'https://tp.media/r?campaign_id=137&marker=704468&p=4110&trs=499800&u=https%3A%2F%2Fwww.klook.com',
  gocity: 'https://tp.media/r?campaign_id=62&marker=704468&p=1942&trs=499800&u=https%3A%2F%2Fgocity.com',
  ticketnetwork: 'https://tp.media/r?campaign_id=72&marker=704468&p=1948&trs=499800&u=https%3A%2F%2Fwww.ticketnetwork.com',
  wegotrip: 'https://tp.media/r?campaign_id=150&marker=704468&p=4487&trs=499800&u=https%3A%2F%2Fwegotrip.com',
  // Viator — the NATIONWIDE local-experiences layer (covers ~any US city, so it's
  // driven by the visitor's detected location). Empty until Keith pastes the base
  // link from the TP dashboard → dark-launched (preview shows the plain link).
  viator: '',
};

export type Program = 'tiqets' | 'klook' | 'gocity' | 'ticketnetwork' | 'wegotrip' | 'viator';

// Preview/localhost detection — mirrors auth.tsx's isPreviewHost so the
// un-monetized design preview only ever appears off production.
function isPreviewHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.netlify.app');
}

/** True once a program's base deep link has been pasted in (i.e. it can earn). */
export function isProgramReady(program: Program): boolean {
  return !!PROGRAM_BASE[program];
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
  const base = PROGRAM_BASE[program];
  if (!base || !target) return null;

  const url = new URL(base);
  url.searchParams.set('u', target); // URL handles the encoding; replaces the base destination
  url.searchParams.set('sub_id', placement);
  return url.toString();
}

export type AffiliateHref = { href: string; tracked: boolean } | null;

/**
 * Resolve the href a component should actually use:
 *   - program wired            → tracked TP link
 *   - not wired, preview host  → plain destination (un-monetized, for design review)
 *   - not wired, production    → null (component hides the block)
 */
export function affiliateHref(program: Program, target: string, placement: string): AffiliateHref {
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
// All programs reuse the same self-hosted city photos, keyed by slug.
export const cityPhoto = (key: string) => `/attractions/cities/${key}.jpg`;
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
  'pittsburgh',
]);
export const slugify = (city: string) => city.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const hasCityPhoto = (city: string) => CITY_PHOTO_KEYS.has(slugify(city));

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

// ── City-centric model: ONE card per city, every partner's booking option
// attached. Union of the three programs' coverage (17 cities). ─────────────────
export type AffiliateCity = { key: string; match: string[]; name: string; country: string };
export const AFFILIATE_CITIES: AffiliateCity[] = [
  // US first (our home market), then international.
  { key: 'new-york', match: ['new york', 'new york city', 'nyc', 'manhattan', 'brooklyn'], name: 'New York', country: 'USA' },
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
  const w = WEGOTRIP_CITIES.find((c) => c.key === cityKey);
  if (w) { const o = weGoTripOffer(w, `${placement}_wegotrip_${cityKey}`); if (o) out.push(o); }
  // Viator covers ~everywhere — add local experiences to every known city too.
  const name = AFFILIATE_CITIES.find((c) => c.key === cityKey)?.name;
  if (name) { const o = viatorOffer(name, `${placement}_viator_${cityKey}`); if (o) out.push(o); }
  return out;
}

// Lowest "from $X" across a city's offers, for the card's headline price.
export function minPrice(offers: AffiliateOffer[]): string {
  const nums = offers.map((o) => Number((o.price.match(/\d+/) || [])[0])).filter((n) => !Number.isNaN(n));
  return nums.length ? `from $${Math.min(...nums)}` : '';
}

// Short option word per program, for the card's "Tickets · Pass · Tours" line.
export const OPTION_WORD: Partial<Record<Program, string>> = {
  tiqets: 'Tickets', gocity: 'Pass', wegotrip: 'Audio tours', viator: 'Experiences',
};
