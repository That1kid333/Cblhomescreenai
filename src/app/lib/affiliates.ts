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

import { nearestMetro, type Coords } from './location';

// Our Travelpayouts affiliate marker / account id, and our traffic source.
// Both are baked into every base link below; kept here for reference/config.
import { type ClickNetwork } from './clickLog';

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
  // driven by the visitor's detected location). STAYS DARK: Travelpayouts shows our
  // Viator connection request as DECLINED (checked 2026-08-31), so no base link can
  // be generated. Re-apply or go direct via Viator's own partner program before wiring.
  viator: '',
  // ── Arrival transfers (Keith's spec, 2026-08-18) ──────────────────────────
  // Both are available in the TP account NOW — the October traffic gate applies
  // only to the "Unlock more" tier, not to these.
  //
  // EMPTY = dark. Paste the RAW tp.media/r?... deeplink here, NOT the tpx.li short
  // link: buildAffiliateLink() re-targets `u` and stamps sub_id, and a shortened
  // link can carry neither. Get it from Tools → Links → the row's ⋮ menu →
  // "Full link". Never hand-build campaign_id / p values.
  //
  // ⚠️ GetTransfer is BANNED from CBL (Keith, 2026-07-25 — documented driver
  // non-payment). A driver-first platform does not route travelers there. Do not
  // add it here, and delete its saved link in Travelpayouts.
  // LIVE 2026-08-31 (raw Full link from Tools → Links, sub_id stripped; buildAffiliateLink stamps it per placement).
  welcomepickups: 'https://tp.media/r?campaign_id=627&marker=704468&p=8919&trs=499800&u=https%3A%2F%2Fwelcomepickups.com', // primary — 8-9%, 45-day cookie, TP program 627
  kiwitaxi: 'https://tp.media/r?campaign_id=1&marker=704468&p=647&trs=499800&u=https%3A%2F%2Fkiwitaxi.com',       // backup  — 9-11%, 30-day cookie (LIVE 2026-08-31)
  // BikesBooking — bike/scooter/motorcycle rentals, location-driven (search by city).
  // LIVE (unlocked 2026-07-26). 4% / 30-day cookie / MOBILE WEB ONLY (no app tracking).
  bikesbooking: 'https://tp.media/r?campaign_id=57&marker=704468&p=1767&trs=499800&u=https%3A%2F%2Fwww.bikesbooking.com',
  // ── Pre-flight ────────────────────────────────────────────────────────────
  // EMPTY = dark, same as the arrival transfers above. Paste the RAW tp.media/r?...
  // deeplink here, NOT the tpx.li short link: buildAffiliateLink() re-targets `u`
  // and stamps sub_id, and a shortened link can carry neither. Get it from
  // Tools → Links → the row's ⋮ menu → "Full link". Never hand-build campaign_id
  // or p values.
  airhelp: 'https://tp.media/r?campaign_id=120&marker=704468&p=9139&trs=499800&u=https%3A%2F%2Fwww.airhelp.com',   // 15-16.6%, 45-day cookie — flight delay/cancellation compensation
  // eSIM. Listed by commission, best first, but note the tradeoff: Airalo pays the
  // least and is by far the best-known brand, so it may well out-earn the others on
  // conversion. Whichever ONE you paste is the one that shows (see ESIM_ORDER), so
  // pasting only Airalo is a perfectly good way to choose it.
  gigsky: '',    // 20%
  yesim: '',     // 18%
  saily: '',     // 15%
  airalo: 'https://tp.media/r?campaign_id=541&marker=704468&p=8310&trs=499800&u=https%3A%2F%2Fwww.airalo.com',    // 12% — strongest brand recognition
};

export type Program =
  | 'tiqets' | 'klook' | 'gocity' | 'ticketnetwork' | 'wegotrip' | 'viator' | 'bikesbooking'
  // Airport / arrival transfers — see ARRIVAL_ORDER below.
  | 'welcomepickups' | 'kiwitaxi'
  // Awin network (not Travelpayouts) — see AWIN_AFFID / AWIN_MID below.
  | 'turbopass' | 'usaguidedtours' | 'extranomical'
  // Impact network — see IMPACT_BASE below.
  | 'ticketmaster'
  // ── Pre-flight (Flights tab) ──────────────────────────────────────────────
  // Deliberately NOT flight booking. Expedia pays nothing on the flight itself,
  // but its cookie is 7-day and CROSS-PRODUCT, so a flight click that becomes a
  // room booking that week pays at the 4% hotel rate — worth more than any flight
  // affiliate (a $400 flight at ~1.5% is ~$6; a $600 room at 4% is ~$24). These
  // ride ALONGSIDE the flight on different sites, so they take nothing from it.
  | 'airhelp'
  | 'gigsky' | 'yesim' | 'saily' | 'airalo';

// ── Impact network ───────────────────────────────────────────────────────────
// Our THIRD network (approved 2026-08-07: Ticketmaster US plus ~24 countries and
// the Quicket/Moshtix sub-brands, all under one publisher account, 7504721).
//
// Impact links look like
//   https://ticketmaster.evyy.net/c/<publisherId>/<adId>/<campaignId>?u=<dest>&subId1=<placement>
// where the numeric path segments identify the publisher, ad and campaign, and
// `subId1` is Impact's per-placement attribution (our sub_id / clickref).
//
// Those ids CANNOT be derived — they come from "Create a link" in the Impact
// dashboard. So, exactly like PROGRAM_BASE above, we store the real base link and
// only re-target `u` + stamp `subId1`. An empty string means "not wired yet":
// buildAffiliateLink returns null, production hides the placement, and preview
// shows the plain un-monetized link for design review. Paste the base link here
// and every Ticketmaster surface goes live at once.
const IMPACT_BASE: Partial<Record<Program, string>> = {
  // LIVE 2026-08-10. Publisher 7504721 / ad 264167 / campaign 4272.
  ticketmaster:
    'https://ticketmaster.evyy.net/c/7504721/264167/4272?u=https%3A%2F%2Fwww.ticketmaster.com%3Firgwc%3D1%26clickid%3D%7Bclickid%7D%26camefrom%3DCFC_BUYAT_%7Birpid%7D%26impradid%3D%7Birpid%7D%26REFERRAL_ID%3Dtmfeedbuyat%7Birpid%7D%26wt.mc_id%3Daff_BUYAT_%7Birpid%7D%26utm_source%3D%7Birpid%7D-%7Birmpname%7D%26impradname%3D%7Birmpname%7D%26utm_medium%3Daffiliate%26ircid%3D%7Bircid%7D',
};

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
  extranomical: '29767', // Extranomical Tours (approved 2026-07-29) — SAN FRANCISCO guided-tours specialist
};

// Guided-tours placement rule (Awin, agreed w/ Keith): ONE tour partner per city.
// A city specialist wins its home city; USA Guided Tours is the generalist used only
// where there's no specialist. Extranomical owns SF, so USA Guided Tours stays out of
// SF (it only covers DC + NYC anyway). Keep coverage lists non-overlapping.

// Preview/localhost detection — mirrors auth.tsx's isPreviewHost so the
// un-monetized design preview only ever appears off production.
function isPreviewHost(): boolean {
  if (typeof window === 'undefined') return false;
  const h = window.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h.endsWith('.netlify.app');
}

/** True once a program can earn — an Awin merchant, or a pasted TP/Impact base link. */
/** Which affiliate network a Program is billed through — used only for the log. */
export function networkOf(program: Program): ClickNetwork {
  if (program === 'ticketmaster') return 'ticketmaster';
  if (program in AWIN_MID) return 'awin';
  return 'travelpayouts';
}

export function isProgramReady(program: Program): boolean {
  return !!AWIN_MID[program] || !!PROGRAM_BASE[program] || !!IMPACT_BASE[program];
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

  // Impact network (per-advertiser click host, e.g. ticketmaster.evyy.net).
  // Checked with `in` rather than truthiness so a program that is DECLARED but
  // not yet wired (empty base) resolves to null instead of falling through to
  // the Travelpayouts branch and building a link on the wrong network.
  if (program in IMPACT_BASE) {
    const impactBase = IMPACT_BASE[program];
    if (!impactBase) return null;
    const url = new URL(impactBase);
    // The base link's `u` is NOT a bare destination — it carries the
    // advertiser's own landing-page macros ({clickid}, {irpid}, {irmpname},
    // {ircid}) that Impact substitutes at click time, plus Ticketmaster's
    // REFERRAL_ID/camefrom/utm tagging. Overwriting `u` with a bare event URL
    // would throw all of that away: the Impact redirect would still set the
    // cookie, but the advertiser would lose its own referral tagging, which is
    // exactly what gets a commission questioned. So MERGE the base query onto
    // the specific destination instead of replacing it.
    const baseDest = url.searchParams.get('u') || '';
    const qi = baseDest.indexOf('?');
    const macros = qi >= 0 ? baseDest.slice(qi + 1) : '';
    const dest = macros ? `${target}${target.includes('?') ? '&' : '?'}${macros}` : target;
    url.searchParams.set('u', dest);
    url.searchParams.set('subId1', placement); // Impact's sub_id / clickref
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
  // Pre-flight / arrival cards only: the mark is placed AS SUPPLIED (no recolour,
  // no white filter), scaled by height. Default 20px for a horizontal wordmark;
  // a stacked lockup (Kiwitaxi) sets 30px so the two read at equal optical weight.
  // Keith's usage sheet, sent to Travelpayouts 2026-08-25.
  logoHeight?: number;
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
  extranomical: {
    partner: 'Extranomical Tours',
    logo: '/attractions/extranomical-logo.svg',
    cta: 'Book a tour',
    briefing:
      'San Francisco tours and Bay Area day trips powered by Extranomical — 20+ years running Muir Woods, wine country, Yosemite and Alcatraz trips with small groups.',
    highlights: [
      'San Francisco city tours',
      'Muir Woods, wine country & Yosemite day trips',
      'Alcatraz packages',
      '20+ years, small groups',
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
  ticketmaster: {
    partner: 'Ticketmaster',
    // Ticketmaster's OFFICIAL white asset, from the partner pack Keith received
    // 2026-08-10. Served untouched — do NOT run it through the
    // brightness(0) invert(1) filter the other partner logos use. That filter
    // exists to force assorted logos to white-on-black; applying it to a brand's
    // own correct artwork is the kind of thing their brand team objects to.
    // The colour (blue-background) version is for light surfaces only; every
    // placement we have is black or near-black.
    logo: '/attractions/ticketmaster-logo.png',
    cta: 'Get tickets',
    briefing:
      'Tickets powered by Ticketmaster — the official box office for concerts, sports and live theater, with verified tickets straight from the venue.',
    highlights: [
      'Official tickets, straight from the box office',
      'Concerts, sports & live theater',
      'Big arenas and small local venues',
      'Verified seats with mobile entry',
    ],
  },
  welcomepickups: {
    partner: 'Welcome Pickups',
    // Their own white header wordmark (welcomepickups.com, 2026-08-31), placed as
    // supplied. Swap for the affiliate pack if ticket #246226 ever delivers one.
    logo: '/travels/partners/welcomepickups-logo.svg',
    logoHeight: 20,
    cta: 'Book your transfer',
    briefing:
      'Airport transfers with a vetted local driver who meets you at arrivals, tracks your flight, and takes you straight to your door for a price agreed up front.',
    highlights: [
      'Meets you inside arrivals',
      'Tracks your flight for delays',
      'Fixed price agreed up front',
      // Source: the Travelpayouts program page for Welcome Pickups (program 627, checked
      // 2026-08-31) lists "Free waiting time: up to 1 hour of free waiting time at the
      // airport." Keith's call: show it; pull it if the brand ever says otherwise. This
      // claim is Welcome Pickups only, never Kiwitaxi (their window is a strict 15 min).
      'Up to 1 hour of free waiting time',
      'Vetted local drivers',
    ],
  },
  kiwitaxi: {
    partner: 'Kiwitaxi',
    // public/travels/partners/kiwitaxi-logo.svg once the brand approves the mockup
    // (ticket #246232). Stacked lockup → 30px (24px minimum anywhere).
    logo: '',
    logoHeight: 30,
    cta: 'Book your transfer',
    briefing:
      'Pre-booked airport and intercity transfers in 100+ countries, with the fare fixed when you book and a driver waiting on arrival.',
    highlights: [
      'Pre-booked, fixed fare',
      'Airport and intercity routes',
      'Driver waiting on arrival',
      'Wide international coverage',
    ],
  },
  airhelp: {
    partner: 'AirHelp',
    // AirHelp's own header mark in ITS dark-background variant (white wordmark, sky-blue
    // and coral icon), taken from airhelp.com 2026-08-31. The viewBox carries the icon
    // above the wordmark, so 24px here reads the same size as a 20px wordmark.
    logo: '/travels/partners/airhelp-logo.svg',
    logoHeight: 24,
    cta: 'Check your flight',
    briefing:
      'If your flight was delayed, cancelled or overbooked, you may be owed compensation by law. AirHelp checks the claim and handles the airline for you, and only takes a cut if it pays out.',
    highlights: [
      'Covers delays, cancellations and overbooking',
      'Claims can reach back several years',
      'No win, no fee',
      'They deal with the airline, not you',
    ],
  },
  gigsky: {
    // GigSky's white no-tagline mark (Keith, 2026-08-31), parked here in case the eSIM
    // slot ever switches from Airalo. Renders only if gigsky is wired (or on preview).
    partner: 'GigSky', logo: '/travels/partners/gigsky-logo.webp', logoHeight: 20, cta: 'Get a data plan',
    briefing: 'A data plan for your phone abroad, activated before you fly, so you land with maps and messages already working and no roaming bill.',
    highlights: ['Works in 190+ countries', 'Set up before you fly', 'Keep your normal number', 'No roaming charges'],
  },
  yesim: {
    partner: 'Yesim', logo: '', cta: 'Get a data plan',
    briefing: 'A data plan for your phone abroad, activated before you fly, so you land with maps and messages already working and no roaming bill.',
    highlights: ['Works in 150+ countries', 'Set up before you fly', 'Keep your normal number', 'No roaming charges'],
  },
  saily: {
    partner: 'Saily', logo: '', cta: 'Get a data plan',
    briefing: 'A data plan for your phone abroad, activated before you fly, so you land with maps and messages already working and no roaming bill.',
    highlights: ['Works in 150+ countries', 'Set up before you fly', 'Keep your normal number', 'No roaming charges'],
  },
  airalo: {
    // Official primary logo (SVG zip) is on airalo.com/about-us/media-center; drop the
    // SVG at public/travels/partners/airalo-logo.svg and set the path.
    partner: 'Airalo', logo: '', logoHeight: 20, cta: 'Get a data plan',
    briefing: 'A data plan for your phone abroad, activated before you fly, so you land with maps and messages already working and no roaming bill.',
    highlights: ['Works in 200+ countries', 'Set up before you fly', 'Keep your normal number', 'No roaming charges'],
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

// ── Extranomical Tours coverage (guided tours, via Awin). The SAN FRANCISCO
// specialist — SF city tours + Bay Area day trips (Muir Woods, wine country,
// Yosemite, Alcatraz). Owns SF outright; USA Guided Tours (generalist) is kept out
// of SF. Whole site is SF/Bay Area, so ued = the homepage. ────────────────────────
export const EXTRANOMICAL_CITIES: GuidedToursCity[] = [
  { key: 'san-francisco', match: ['san francisco', 'sf'], name: 'San Francisco', country: 'USA', url: 'https://www.extranomical.com', fromPrice: 'from $59' },
];

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

/** Build an Extranomical (SF guided tours + Bay Area day trips) offer. */
export function extranomicalOffer(entry: GuidedToursCity, placement: string): AffiliateOffer | null {
  const meta = PARTNER_META.extranomical!;
  const link = affiliateHref('extranomical', entry.url, placement);
  if (!link) return null;
  return {
    program: 'extranomical', partner: meta.partner, cityKey: entry.key, name: entry.name, country: entry.country,
    photo: cityPhoto(entry.key), tint: NEUTRAL_TINT, kicker: 'Guided tour',
    title: `${entry.name} tours & day trips`, price: entry.fromPrice, meta: 'City tours · day trips',
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
  'pittsburgh', 'washington', 'cleveland',
]);
export const slugify = (city: string) => city.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const hasCityPhoto = (city: string) => CITY_PHOTO_KEYS.has(slugify(city));

// ── Nearest-metro resolver ───────────────────────────────────────────────────
// IP geolocation often returns a tiny/obscure place (e.g. "Glenmoor") that makes
// no sense as a featured city AND has no affiliate inventory. So the "Near you"
// local card snaps the visitor's coordinates to the nearest MAJOR metro — which
// reads sensibly and is where the bookable events/experiences actually are.
//
// The metro table now lives in location.ts (one source of truth, shared with the
// display-label snapping every page uses). This keeps the wider 80mi radius on
// purpose: affiliate INVENTORY travels further than a location LABEL does, so
// someone an hour out still gets offered the metro's tickets and passes even
// though the page won't claim they live there.
export function nearestMajorCity(coords: Coords | null | undefined, maxMi = 80): string | null {
  return nearestMetro(coords, maxMi);
}

// ── Viator: the NATIONWIDE local-experiences layer. Viator covers ~any city, so
// it's driven by the visitor's DETECTED city (same geolocation as Eats/Attractions)
// — not a fixed list. Known cities get a curated destination page; every other city
// uses Viator search (valid anywhere), so "things to do in {your city}" works
// nationwide with no per-city IDs to maintain.
/**
 * Viator destination pages, keyed by city slug. A /City/d<id> page converts better
 * than a search results page, so it's worth filling in — but ONLY with IDs
 * verified in a real browser.
 *
 * ⚠️ DO NOT GUESS THESE. Viator 403s every automated request (verified 2026-08-18,
 * including the Pittsburgh URL below), so an ID cannot be checked from a script. A
 * wrong id silently lands the visitor in the wrong city, which is strictly worse
 * than the search fallback — the fallback is never wrong, just less targeted.
 *
 * To add one: open viator.com in a browser, search the city, copy the /City/dNNNN
 * from the destination page URL, and confirm the page header names that city.
 *
 * Cities worth adding, matched to where our other partners already have coverage:
 * new-york, las-vegas, orlando, los-angeles, san-francisco, miami, chicago,
 * boston, new-orleans, washington, nashville, denver, austin, seattle, san-diego.
 */
const VIATOR_DEST: Record<string, string> = {
  pittsburgh: 'https://www.viator.com/Pittsburgh/d22639',
};

/**
 * Destination page when we have a verified id, else Viator's own search.
 * The fallback is correct for every city on earth — it just ranks by Viator's
 * relevance rather than dropping onto a curated destination page.
 */
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

// ── Ticketmaster: the PRIMARY-SELLER events layer, driven by the visitor's
// detected city. A box office rather than a resale marketplace, so it outranks
// ticketnetwork wherever it operates — see the one-events-partner-per-city rule
// in cityOffers(). One approval also covers TicketWeb, Universe and Front Gate,
// which is where the smaller local venues live.
export function ticketmasterUrl(cityName: string): string {
  return `https://www.ticketmaster.com/search?q=${encodeURIComponent(cityName)}`;
}
// Impact click hosts (mirrors the rel matcher in components/Markdown.tsx).
const IMPACT_HOST = /(^|\.)(evyy\.net|pxf\.io|sjv\.io|7eer\.net|ojrq\.net)$/i;
const IMPACT_NUMERIC_HOST = /^imp\.i\d+\.net$/i;

/**
 * Href for a SPECIFIC Ticketmaster event (as opposed to a city search page).
 *
 * The Discovery API hands back event URLs ALREADY wrapped in our Impact link —
 * same publisher/ad/campaign ids — because the API key is tied to the affiliate
 * account. Running those through buildAffiliateLink() nests one Impact redirect
 * inside another, which is a second hop that can only cost us attribution.
 *
 * So: if the URL is already an Impact click, leave it alone and just stamp the
 * per-event subId1 on it. Only a bare ticketmaster.com URL gets wrapped. Written
 * to handle both, so nothing breaks if Ticketmaster stops pre-wrapping.
 */
export function ticketmasterEventHref(eventUrl: string, placement: string): AffiliateHref {
  if (!eventUrl) return null;
  try {
    const u = new URL(eventUrl);
    // Already an Impact click (Discovery pre-wraps US events) → just tag it.
    if (IMPACT_HOST.test(u.hostname) || IMPACT_NUMERIC_HOST.test(u.hostname)) {
      u.searchParams.set('subId1', placement);
      return { href: u.toString(), tracked: true };
    }
    // Bare US Ticketmaster → wrap in our US campaign.
    if (/(^|\.)ticketmaster\.com$/i.test(u.hostname)) {
      return affiliateHref('ticketmaster', eventUrl, placement);
    }
    // ANY other host — ticketmaster.it, ticketweb.uk, ticketmaster.co.uk and the
    // rest — is a DIFFERENT market. Verified 2026-08-10: Discovery only
    // auto-wraps US events, and each international Ticketmaster program is a
    // separate Impact brand with its own campaign id. Pushing these through the
    // US link would route a click for an Italian venue into the US campaign:
    // it won't convert, and it misattributes. So link out plain and untracked
    // until that market's own deeplink is wired into IMPACT_BASE. The listing is
    // still useful to the visitor; it just doesn't earn yet.
    return { href: eventUrl, tracked: false };
  } catch {
    return null; // unparseable → caller hides the card rather than linking somewhere odd
  }
}

export function ticketmasterOffer(cityName: string, placement: string): AffiliateOffer | null {
  const meta = PARTNER_META.ticketmaster!;
  const link = affiliateHref('ticketmaster', ticketmasterUrl(cityName), placement);
  if (!link) return null;
  const key = slugify(cityName);
  return {
    program: 'ticketmaster', partner: meta.partner, cityKey: key, name: cityName, country: '',
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
  // ONE events partner per city: Ticketmaster (primary seller) wins wherever
  // it's wired, and TicketNetwork (resale) is the fallback. Showing both would
  // put two near-identical "events" cards side by side.
  const tm = ticketmasterOffer(cityName, `${placement}_ticketmaster_local`);
  const tn = tm ? null : ticketNetworkOffer(cityName, `${placement}_ticketnetwork_local`);
  if (tm) out.push(tm);
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
  const ex = EXTRANOMICAL_CITIES.find((c) => c.key === cityKey);
  if (ex) { const o = extranomicalOffer(ex, `${placement}_extranomical_${cityKey}`); if (o) out.push(o); }
  // ONE events partner per city. Ticketmaster is a primary seller and covers our
  // international cities too, so it wins wherever it's wired; TicketNetwork
  // (US-only resale) stays as the fallback for cities Ticketmaster can't serve.
  const cityMeta = AFFILIATE_CITIES.find((c) => c.key === cityKey);
  if (cityMeta) {
    const tm = ticketmasterOffer(cityMeta.name, `${placement}_ticketmaster_${cityKey}`);
    if (tm) out.push(tm);
    else if (cityMeta.country === 'USA') {
      const o = ticketNetworkOffer(cityMeta.name, `${placement}_ticketnetwork_${cityKey}`);
      if (o) out.push(o);
    }
  }
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
  tiqets: 'Tickets', gocity: 'Pass', turbopass: 'City pass', wegotrip: 'Audio tours', usaguidedtours: 'Guided tours', extranomical: 'Guided tours', ticketnetwork: 'Events', ticketmaster: 'Event tickets', viator: 'Experiences', bikesbooking: 'Rentals',
};

// ── Arrival transfers ────────────────────────────────────────────────────────
// Order is deliberate (Keith, 2026-08-18): Welcome Pickups first, Kiwitaxi as the
// backup, and if neither is bookable the block does not render — no empty state,
// no "no transfers found".
//
// This NEVER competes with a CBL driver. Per the same spec: "a CBL driver, when
// one is available, is always first and never shown next to alternatives." The
// caller is responsible for not rendering this when a CBL option exists.
const ARRIVAL_ORDER: Program[] = ['welcomepickups', 'kiwitaxi'];
/** First eSIM brand with a pasted base link wins. Ordered by commission. */
const ESIM_ORDER: Program[] = ['gigsky', 'yesim', 'saily', 'airalo'];

// ── Welcome Pickups US coverage ──────────────────────────────────────────────
// Welcome Pickups has no search URL (welcomepickups.com/search/ is a 404, checked
// 2026-08-31); it has one hub page per served city at welcomepickups.com/<slug>/.
// So coverage IS the list of city pages: a destination we can map to a slug is
// bookable, anything else is not, and per Keith's rule ("listing a partner we
// cannot fulfil is worse than not listing them") the block hides for it.
//
// Canonical name → slug, US cities from the Welcome Pickups homepage (2026-08-31).
// Verified live: chicago, new-york, las-vegas, washington, new-orleans, san-jose-ca,
// los-angeles, san-francisco, philadelphia, miami, orlando, boston. Others follow the
// same pattern. Note the two odd ones: DC is /washington/, San Jose CA is /san-jose-ca/.
const WELCOME_PICKUPS_US: { name: string; slug: string; aliases: string[] }[] = [
  { name: 'New York', slug: 'new-york', aliases: ['nyc', 'new york city', 'manhattan', 'brooklyn', 'jfk', 'lga', 'ewr', 'newark'] },
  { name: 'Las Vegas', slug: 'las-vegas', aliases: ['vegas', 'las'] },
  { name: 'Los Angeles', slug: 'los-angeles', aliases: ['la', 'lax'] },
  { name: 'Miami', slug: 'miami', aliases: ['mia', 'miami beach', 'south beach', 'fort lauderdale', 'fll'] },
  { name: 'Orlando', slug: 'orlando', aliases: ['mco', 'disney', 'disney world', 'walt disney world', 'kissimmee'] },
  { name: 'Boston', slug: 'boston', aliases: ['bos'] },
  { name: 'San Jose', slug: 'san-jose-ca', aliases: ['san jose ca', 'san jose california', 'sjc'] },
  { name: 'Denver', slug: 'denver', aliases: ['den'] },
  { name: 'Washington, DC', slug: 'washington', aliases: ['washington dc', 'washington d c', 'dc', 'dca', 'iad'] },
  { name: 'Chicago', slug: 'chicago', aliases: ['ord', 'mdw'] },
  { name: 'San Diego', slug: 'san-diego', aliases: ['san'] },
  { name: 'Austin', slug: 'austin', aliases: ['aus'] },
  { name: 'Seattle', slug: 'seattle', aliases: ['sea'] },
  { name: 'Tampa', slug: 'tampa', aliases: ['tpa'] },
  { name: 'Atlanta', slug: 'atlanta', aliases: ['atl'] },
  { name: 'Detroit', slug: 'detroit', aliases: ['dtw'] },
  { name: 'Phoenix', slug: 'phoenix', aliases: ['phx', 'scottsdale'] },
  { name: 'Philadelphia', slug: 'philadelphia', aliases: ['philly', 'phl'] },
  { name: 'Houston', slug: 'houston', aliases: ['iah', 'hou'] },
  { name: 'New Orleans', slug: 'new-orleans', aliases: ['nola', 'msy'] },
  { name: 'Minneapolis', slug: 'minneapolis', aliases: ['msp', 'st paul', 'saint paul'] },
  { name: 'San Antonio', slug: 'san-antonio', aliases: ['sat'] },
  { name: 'Baltimore', slug: 'baltimore', aliases: ['bwi'] },
  { name: 'Buffalo', slug: 'buffalo', aliases: ['buf'] },
  { name: 'Nashville', slug: 'nashville', aliases: ['bna'] },
  { name: 'Savannah', slug: 'savannah', aliases: ['sav'] },
  { name: 'Portland', slug: 'portland', aliases: ['pdx', 'portland or', 'portland oregon'] },
  { name: 'Dallas', slug: 'dallas', aliases: ['dfw', 'dal', 'fort worth'] },
  { name: 'San Francisco', slug: 'san-francisco', aliases: ['sf', 'sfo', 'oakland', 'oak'] },
  { name: 'Honolulu', slug: 'honolulu', aliases: ['hnl', 'oahu', 'waikiki'] },
];

/** Loose text normalizer for a typed destination: "Chicago, IL" → "chicago il". */
const normDest = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();

// Trailing tokens that may follow a city without changing it. Only these get
// dropped for a second match attempt, so a half-typed "san fr" never matches
// "san" (San Diego) while the traveler is still typing "san francisco".
const DEST_SUFFIX_TOKENS = new Set([
  'al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','vt','va','wa','wv','wi','wy','dc',
  'usa','us','airport','international','intl','area','downtown',
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','ohio','oklahoma','oregon','pennsylvania','tennessee','texas','utah','vermont','virginia','washington','wisconsin','wyoming',
]);

/**
 * The strings to try, in order: as typed; the part before a comma ("Buffalo, New
 * York" → "buffalo"); then with a recognised trailing token dropped.
 */
function destCandidates(input: string): string[] {
  const full = normDest(input);
  if (!full) return [];
  const out = [full];
  const head = normDest(input.split(',')[0]);
  if (head && head !== full) out.push(head);
  const tokens = full.split(' ');
  if (tokens.length > 1 && DEST_SUFFIX_TOKENS.has(tokens[tokens.length - 1])) out.push(tokens.slice(0, -1).join(' '));
  return out;
}

/**
 * Map whatever the traveler typed (city, "City, ST", nickname, or airport code) to
 * a Welcome Pickups city, or null when they don't serve it. Exported for the app.
 */
export function welcomePickupsCity(input: string): { name: string; slug: string } | null {
  for (const c of destCandidates(input)) {
    for (const city of WELCOME_PICKUPS_US) {
      if (normDest(city.name) === c || city.aliases.includes(c)) return { name: city.name, slug: city.slug };
    }
  }
  return null;
}

// Kiwitaxi: no bookable-destinations feed exists (Travelpayouts ticket #246232, Aug
// 2026), and its PIT route page quoted "no transfer found". Until we have a list of
// US cities they actually fulfil, Kiwitaxi stays out of the arrival block rather
// than risk a dead end. Add entries here (name + kiwitaxi.com destination URL) as
// they are verified; the resolver below picks it up automatically as the backup.
const KIWITAXI_US: { name: string; url: string; aliases: string[] }[] = [];

function kiwitaxiCity(input: string): { name: string; url: string } | null {
  for (const c of destCandidates(input)) {
    for (const city of KIWITAXI_US) {
      if (normDest(city.name) === c || city.aliases.includes(c)) return { name: city.name, url: city.url };
    }
  }
  return null;
}

/**
 * The one arrival-transfer offer to show for a city, or null to render nothing.
 * Falls Welcome Pickups → Kiwitaxi → null, skipping any program that isn't wired
 * (empty base link) or is parked.
 */
/**
 * What we show ALONGSIDE a flight, on the Flights tab.
 *
 * Returns whichever of these are actually wired, in order, and an empty array if
 * none are — so the block self-hides rather than shipping placeholders. Same
 * dark-launch discipline as the arrival transfers.
 */
export type PreflightOffer = {
  program: Program;
  partner: string;
  kicker: string;
  title: string;
  briefing: string;
  highlights: string[];
  cta: string;
  href: string;
  tracked: boolean;
};

export function preflightOffers(placement: string): PreflightOffer[] {
  const out: PreflightOffer[] = [];

  const airhelp = affiliateHref('airhelp', 'https://www.airhelp.com', `${placement}_airhelp`);
  const airhelpMeta = PARTNER_META.airhelp;
  if (airhelp && airhelpMeta) {
    out.push({
      program: 'airhelp',
      partner: airhelpMeta.partner,
      kicker: 'Delayed or cancelled',
      title: 'You may be owed money for a bad flight',
      briefing: airhelpMeta.briefing,
      highlights: airhelpMeta.highlights,
      cta: airhelpMeta.cta,
      href: airhelp.href,
      tracked: airhelp.tracked,
    });
  }

  for (const program of ESIM_ORDER) {
    // Brand in the sub_id, not just "esim": if the brand is ever swapped, old
    // reports still say which one earned the click.
    const link = affiliateHref(program, ESIM_SITE[program] || '', `${placement}_esim_${program}`);
    const meta = PARTNER_META[program];
    if (!link || !meta) continue; // not wired → try the next brand
    out.push({
      program,
      partner: meta.partner,
      kicker: 'Flying abroad',
      title: 'Land with your phone already working',
      briefing: meta.briefing,
      highlights: meta.highlights,
      cta: meta.cta,
      href: link.href,
      tracked: link.tracked,
    });
    break; // one eSIM brand only
  }

  return out;
}

/** Destination sites for the eSIM brands, re-targeted into the tp.media `u` param. */
const ESIM_SITE: Partial<Record<Program, string>> = {
  gigsky: 'https://www.gigsky.com',
  yesim: 'https://yesim.app',
  saily: 'https://saily.com',
  airalo: 'https://www.airalo.com',
};

export function arrivalTransferOffer(cityName: string, placement: string): AffiliateOffer | null {
  if (!cityName?.trim()) return null;
  for (const program of ARRIVAL_ORDER) {
    // Coverage first: a partner only appears for a destination it actually serves.
    // Falls Welcome Pickups → Kiwitaxi → null, so an unserved city renders nothing.
    let name: string; let dest: string;
    if (program === 'welcomepickups') {
      const wp = welcomePickupsCity(cityName);
      if (!wp) continue;
      name = wp.name; dest = `https://www.welcomepickups.com/${wp.slug}/`;
    } else {
      const kt = kiwitaxiCity(cityName);
      if (!kt) continue;
      name = kt.name; dest = kt.url;
    }
    const link = affiliateHref(program, dest, placement);
    if (!link) continue; // not wired, or parked → try the backup
    const meta = PARTNER_META[program];
    if (!meta) continue;
    const key = slugify(name);
    return {
      program, partner: meta.partner, cityKey: key, name, country: '',
      photo: hasCityPhoto(name) ? cityPhoto(key) : '', tint: NEUTRAL_TINT,
      kicker: 'Airport transfer', title: `Arrive in ${name}, sorted`,
      price: 'Fixed fare', meta: 'Door to door · booked ahead',
      highlights: meta.highlights, cta: meta.cta, logo: meta.logo,
      href: link.href, tracked: link.tracked,
    };
  }
  return null;
}
