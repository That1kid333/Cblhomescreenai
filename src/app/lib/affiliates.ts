/**
 * Central Travelpayouts affiliate config — the ONE place that owns our marker,
 * traffic source, per-program city coverage, and base deep links. Components
 * never hardcode an affiliate URL; they call buildAffiliateLink() / affiliateHref()
 * with a placement tag and let this module decide the destination.
 *
 * ── DARK LAUNCH ──────────────────────────────────────────────────────────────
 * Each program's base deep link (PROGRAM_BASE) is empty until the real link
 * arrives from the Travelpayouts dashboard's "Create link" tool. While a program
 * isn't wired, buildAffiliateLink() returns null and every UI block whose links
 * are null hides itself — so production never ships an untracked or off-city
 * affiliate link. On preview/localhost, affiliateHref() falls back to the plain
 * (un-monetized) destination purely so the design can be reviewed before go-live.
 *
 * Compliance (per the CBL media kit): every affiliate anchor uses
 * target="_blank" rel="sponsored nofollow noopener", and any section containing
 * affiliate links renders <AffiliateDisclosure/>.
 */

// Our Travelpayouts affiliate marker / account id.
export const TP_MARKER = '704468';

/**
 * Base Travelpayouts deep link per program, copied from the "Create link" tool.
 * These already carry the marker, campaign/promo ids, AND our traffic-source
 * (trs) — so the base link is the single source of truth. buildAffiliateLink()
 * injects a per-placement sub_id into the marker and appends the visitor-facing
 * destination. Empty string = NOT YET WIRED → links gate off (see module note).
 *
 * TO GO LIVE: paste each program's base link here. That's the only change needed.
 */
const PROGRAM_BASE: Record<Program, string> = {
  tiqets: '',
  klook: '',
  gocity: '',
  ticketnetwork: '',
  wegotrip: '',
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
 * Wrap a destination in our tracked Travelpayouts link, tagging the placement
 * as a sub_id so TP reports show which surface earned (e.g. attractions_nyc_local).
 * Returns null while the program is unwired — callers treat null as "hide me".
 *
 *   base:  https://tp.media/click?shmarker=704468&campaign_id=..&trs=..
 *   out:   https://tp.media/click?shmarker=704468.attractions_nyc_local&campaign_id=..&trs=..&sub_id=attractions_nyc_local&u=<target>
 */
export function buildAffiliateLink(
  program: Program,
  target: string,
  placement: string,
): string | null {
  const base = PROGRAM_BASE[program];
  if (!base || !target) return null;

  // Inject the placement as a sub_id on the marker: 704468 -> 704468.placement.
  let url = base.includes('shmarker=')
    ? base.replace(/(shmarker=)([^&]+)/, (_m, p1, val) => `${p1}${String(val).split('.')[0]}.${placement}`)
    : `${base}${base.includes('?') ? '&' : '?'}shmarker=${TP_MARKER}.${placement}`;

  // Redundant standalone sub_id (some TP reports key on this) + the destination.
  url += `&sub_id=${encodeURIComponent(placement)}`;
  url += `&u=${encodeURIComponent(target)}`;
  return url;
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
// variants ("New York City", "NYC") all map correctly. `target` is a placeholder
// Tiqets destination that is REPLACED by the exact "Create link" URL at go-live;
// `photo`/`fromPrice`/`count` are card copy and can be tuned freely.
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
  { key: 'new-york', match: ['new york', 'new york city', 'nyc', 'manhattan', 'brooklyn'], name: 'New York', country: 'USA', target: 'https://www.tiqets.com/en/search?q=New%20York', tint: 'rgba(201,151,66,.55), rgba(10,10,10,.86)', fromPrice: 'from $22', count: '250+ things to do' },
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
