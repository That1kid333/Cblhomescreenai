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
};

export type Program = 'tiqets' | 'klook' | 'gocity' | 'ticketnetwork' | 'wegotrip';

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
  tint: string;      // per-city gradient tint over the shared map texture
  fromPrice: string;
  count: string;
};

export const TIQETS_CITIES: TiqetsCity[] = [
  { key: 'new-york', match: ['new york', 'new york city', 'nyc', 'manhattan', 'brooklyn'], name: 'New York', country: 'USA', target: 'https://tiqets.com/en/new-york-c66097/', tint: 'rgba(201,151,66,.55), rgba(10,10,10,.86)', fromPrice: 'from $22', count: '250+ things to do' },
  { key: 'paris', match: ['paris'], name: 'Paris', country: 'France', target: 'https://www.tiqets.com/en/search?q=Paris', tint: 'rgba(120,90,180,.5), rgba(10,10,10,.86)', fromPrice: 'from $18', count: '200+ things to do' },
  { key: 'rome', match: ['rome', 'roma'], name: 'Rome', country: 'Italy', target: 'https://www.tiqets.com/en/search?q=Rome', tint: 'rgba(180,110,60,.5), rgba(10,10,10,.86)', fromPrice: 'from $16', count: '220+ things to do' },
  { key: 'milan', match: ['milan', 'milano'], name: 'Milan', country: 'Italy', target: 'https://www.tiqets.com/en/search?q=Milan', tint: 'rgba(90,120,150,.5), rgba(10,10,10,.86)', fromPrice: 'from $14', count: '120+ things to do' },
  { key: 'florence', match: ['florence', 'firenze'], name: 'Florence', country: 'Italy', target: 'https://www.tiqets.com/en/search?q=Florence', tint: 'rgba(160,120,70,.5), rgba(10,10,10,.86)', fromPrice: 'from $17', count: '90+ things to do' },
  { key: 'venice', match: ['venice', 'venezia'], name: 'Venice', country: 'Italy', target: 'https://www.tiqets.com/en/search?q=Venice', tint: 'rgba(70,130,150,.5), rgba(10,10,10,.86)', fromPrice: 'from $15', count: '80+ things to do' },
  { key: 'lisbon', match: ['lisbon', 'lisboa'], name: 'Lisbon', country: 'Portugal', target: 'https://www.tiqets.com/en/search?q=Lisbon', tint: 'rgba(200,140,80,.5), rgba(10,10,10,.86)', fromPrice: 'from $13', count: '110+ things to do' },
  { key: 'amsterdam', match: ['amsterdam'], name: 'Amsterdam', country: 'Netherlands', target: 'https://www.tiqets.com/en/search?q=Amsterdam', tint: 'rgba(150,90,60,.5), rgba(10,10,10,.86)', fromPrice: 'from $19', count: '160+ things to do' },
  { key: 'london', match: ['london'], name: 'London', country: 'UK', target: 'https://www.tiqets.com/en/search?q=London', tint: 'rgba(100,110,130,.5), rgba(10,10,10,.86)', fromPrice: 'from $21', count: '240+ things to do' },
];

/** Find the Tiqets city that matches the visitor's active city, if any. */
export function tiqetsCityFor(activeCity: string | null | undefined): TiqetsCity | null {
  if (!activeCity) return null;
  const c = activeCity.trim().toLowerCase();
  return TIQETS_CITIES.find((city) => city.match.includes(c)) ?? null;
}
