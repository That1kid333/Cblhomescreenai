import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../lib/auth';
import { RIDER_BOOK_URL } from '../lib/constants';
import { expediaStay, expediaStaySearch, expediaFlightSearch } from '../lib/expedia';
import { useVisitorLocation, displayCity } from '../lib/location';
import { PlatformNotice } from '../components/PlatformNotice';
import { AttractionsAffiliate } from '../components/AttractionsAffiliate';
import { AffiliateDisclosure } from '../components/AffiliateDisclosure';

// Stay booking went LIVE 2026-08-13: the Expedia Group Travel Creator Program was
// approved, so every gate below now opens a TRACKED Expedia link (lib/expedia.ts,
// Partnerize camref 1110lLrVp, 4% on hotels).
//
// Everything this flag gates is STAYS. Flights stay dark on purpose — Expedia pays
// nothing on flights or cruises, and KAYAK is still in case-by-case review, so
// there is no approved partner to send that traffic to yet.
const BOOKING_LIVE: boolean = true;

/**
 * Travels — ported from the CBL "New Website" handoff bundle
 * (`Travels Desktop.html`).
 *
 * Sections: Hero · Search bar + provider strip · Category tabs (Flights ·
 * Hotels & Resorts · B&Bs & Inns · Short-Term · Day Trips · Curated by Buckee ·
 * Travel Deals) · per-tab content (flight rows + airport-ride banner, stay-card
 * grids, day-trip grid, Buckee AI itinerary band, deals strip).
 *
 * Fonts match the rest of the new site (Eats / Transportation): Myriad Pro for
 * display headers, Playfair Display for the editorial italic accents, system
 * mono for the eyebrow/meta labels.
 *
 * The source's CBLNav and CBLFooter are intentionally dropped — the site
 * `Layout` already provides the global nav and there's no footer yet.
 *
 * Asset note: the hero map backdrop reuses `/eats/imagery/cbl-map-backdrop.jpg`
 * already shipped with the Eats page; the Buckee mascot uses the concierge
 * render at `/travels/mascot/buckee-concierge.png`. Lodging/day-trip photos are
 * Unsplash CDN placeholders from the source — swap to real CBL imagery later.
 */

// ── Constants (font swaps) ──────────────────────────────────────────────────
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';
const BUCKEE_MASCOT = '/travels/mascot/buckee-concierge.png';

// ── Tab icons ───────────────────────────────────────────────────────────────
function IconFlight({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5L21 16z" />
    </svg>
  );
}
function IconHotel({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="9" />
      <path d="M3 16h18M5 11V6h14v5" />
      <rect x="7" y="13" width="3" height="3" />
      <rect x="14" y="13" width="3" height="3" />
    </svg>
  );
}
function IconBnB({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <rect x="10" y="14" width="4" height="6" />
    </svg>
  );
}
function IconSTR({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V8l8-5 8 5v13" />
      <path d="M4 21h16" />
      <circle cx="12" cy="14" r="2" />
    </svg>
  );
}
function IconTrip({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l5-10 5 5 8-5" />
      <circle cx="3" cy="17" r="2" />
      <circle cx="21" cy="7" r="2" />
    </svg>
  );
}
function IconScroll({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M9 9h7M9 13h7M9 17h5" />
    </svg>
  );
}
function IconDeal({ s = 22 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l9 4-3 14H6L3 7z" />
      <path d="M9 11l2 2 4-4" />
    </svg>
  );
}

type TabKey = 'FLIGHTS' | 'HOTELS' | 'BNB' | 'STR' | 'TRIPS' | 'BUCKEE' | 'DEALS';

const TABS: { key: TabKey; label: string; Icon: (p: { s?: number }) => JSX.Element }[] = [
  { key: 'FLIGHTS', label: 'Flights', Icon: IconFlight },
  { key: 'HOTELS', label: 'Hotels & Resorts', Icon: IconHotel },
  { key: 'BNB', label: 'B&Bs & Inns', Icon: IconBnB },
  { key: 'STR', label: 'Short-Term', Icon: IconSTR },
  { key: 'TRIPS', label: 'Day Trips', Icon: IconTrip },
  { key: 'BUCKEE', label: 'Curated by Buckee', Icon: IconScroll },
  { key: 'DEALS', label: 'Travel Deals', Icon: IconDeal },
];

// ── Data (from Travels Desktop.html) ────────────────────────────────────────
type Stay = {
  name: string;
  loc: string;
  stars: number;
  rating: number;
  reviews: string;
  /** Google's price BAND ($ to $$$$) when known. Never a nightly rate — we don't
   *  have one, and Expedia shows the real price on the other side of Book Now. */
  price: string;
  tag: string;
  desc: string;
  img: string;
  /** true for the hand-picked seed; live Google results are not "CBL Picks". */
  curated?: boolean;
};

// Fallback only — shown when Places is unavailable. `curated: true` is what
// earns the "CBL Pick" badge; live Google results don't get it.
/** Places keyword per lodging tab — 'lodging' is the Google type for all three. */
const STAY_KEYWORD: Record<'HOTELS' | 'BNB' | 'STR', string> = {
  HOTELS: 'hotel',
  BNB: 'bed and breakfast inn',
  STR: 'vacation rental apartment',
};

const STAYS: Record<'HOTELS' | 'BNB' | 'STR', Stay[]> = {
  HOTELS: [
    { name: 'The Ritz-Carlton, Key Biscayne', loc: 'Miami, FL', stars: 5, rating: 4.8, reviews: '2.4k', price: '$589', tag: 'Resort', desc: 'Oceanfront resort with two-mile private beach, full-service spa and three pools.', img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&h=600&fit=crop' },
    { name: 'Fairmont Banff Springs', loc: 'Banff, AB · Canada', stars: 5, rating: 4.9, reviews: '5.1k', price: '$425', tag: 'Mountain Resort', desc: 'Historic castle in the Canadian Rockies with golf, spa and Bow Valley views.', img: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=900&h=600&fit=crop' },
    { name: 'Ace Hotel Brooklyn', loc: 'Brooklyn, NY', stars: 4, rating: 4.6, reviews: '1.8k', price: '$289', tag: 'Boutique', desc: 'Modernist tower in Downtown Brooklyn with rooftop pool and Stumptown coffee in the lobby.', img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&h=600&fit=crop' },
    { name: 'Hotel Monaco Pittsburgh', loc: 'Pittsburgh, PA', stars: 4, rating: 4.7, reviews: '932', price: '$245', tag: 'Boutique', desc: 'Kimpton-run boutique in the Cultural District. Walk to PNC Park and Heinz Hall.', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&h=600&fit=crop' },
    { name: 'Hôtel Plaza Athénée', loc: 'Paris, France', stars: 5, rating: 4.9, reviews: '3.2k', price: '$1,240', tag: 'Luxury', desc: 'Avenue Montaigne legend with Dior spa, Alain Ducasse dining, and Eiffel Tower views.', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&h=600&fit=crop' },
    { name: 'The NoMad London', loc: 'Covent Garden, UK', stars: 5, rating: 4.7, reviews: '1.1k', price: '$695', tag: 'Boutique', desc: 'Inside the former Bow Street Magistrates Court. Atrium restaurant by Daniel Humm.', img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&h=600&fit=crop' },
    { name: 'The Priory Hotel', loc: 'Deutschtown · Pittsburgh, PA', stars: 4, rating: 4.8, reviews: '610', price: '$190', tag: 'Boutique', desc: 'A romantic boutique stay inside a restored 19th-century Benedictine monastery with a quiet courtyard garden.', img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&h=600&fit=crop' },
    { name: 'Sunnyledge Boutique Hotel', loc: 'Shadyside · Pittsburgh, PA', stars: 4, rating: 4.7, reviews: '243', price: '$205', tag: 'Historic', desc: 'Eight eclectic rooms in an 1886 Shadyside mansion — intimate, historic, on one of the city’s grandest streets.', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&h=600&fit=crop' },
  ],
  BNB: [
    { name: 'The Inn at Negley', loc: 'Shadyside · Pittsburgh, PA', stars: 5, rating: 4.9, reviews: '184', price: '$220', tag: 'B&B', desc: 'Victorian mansion B&B with 8 themed rooms, garden patio, and full breakfast included.', img: 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=900&h=600&fit=crop' },
    { name: 'Mercersburg Inn', loc: 'Mercersburg, PA', stars: 4, rating: 4.7, reviews: '276', price: '$185', tag: 'Country Inn', desc: '1909 Georgian Revival inn near the Tuscarora State Forest. Multi-course dinners on Saturdays.', img: 'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=900&h=600&fit=crop' },
    { name: 'Sunburst Cottages', loc: 'Lake Placid, NY', stars: 4, rating: 4.8, reviews: '412', price: '$295', tag: 'Cottage', desc: 'Adirondack waterfront cottages with private docks, kayaks and fire pits.', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=900&h=600&fit=crop' },
    { name: 'Inn on the Mexican War Streets', loc: 'North Side · Pittsburgh, PA', stars: 4, rating: 4.8, reviews: '156', price: '$170', tag: 'B&B', desc: 'A Victorian-mansion B&B across from Allegheny Commons, full of period charm and quiet.', img: 'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=900&h=600&fit=crop' },
    { name: 'The Parador Inn', loc: 'Allegheny West · Pittsburgh, PA', stars: 4, rating: 4.7, reviews: '198', price: '$165', tag: 'B&B', desc: 'A Caribbean-themed B&B in a restored 1870s mansion, walkable to PNC Park and the river.', img: 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=900&h=600&fit=crop' },
  ],
  STR: [
    { name: 'Strip District Loft', loc: 'Pittsburgh, PA', stars: 4, rating: 4.9, reviews: '218', price: '$165', tag: 'Whole Loft', desc: 'Open-plan brick loft with skyline views, walking distance to PPG Paints Arena.', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&h=600&fit=crop' },
    { name: 'Mountain A-Frame', loc: 'Asheville, NC', stars: 5, rating: 4.9, reviews: '341', price: '$245', tag: 'A-Frame · 2 bed', desc: 'Forest cabin with wood-burning sauna, outdoor shower, and Blue Ridge mountain views.', img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&h=600&fit=crop' },
    { name: 'Hudson Valley Farmhouse', loc: 'Rhinebeck, NY', stars: 5, rating: 4.8, reviews: '527', price: '$385', tag: 'Farmhouse · 4 bed', desc: '1850s farmhouse on 12 acres with pool, sauna and hiking trails on-property.', img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&h=600&fit=crop' },
    { name: 'Kasa at the Maverick', loc: 'East Liberty · Pittsburgh, PA', stars: 4, rating: 4.6, reviews: '302', price: '$150', tag: 'Whole Suite', desc: 'Stylish self-check-in suites inside the historic former East Liberty YMCA, steps from East End shops.', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&h=600&fit=crop' },
  ],
};

type Trip = { name: string; loc: string; dist: string; time: string; img: string; p: string };

const TRIPS: Trip[] = [
  { name: 'Fallingwater', loc: 'Mill Run, PA · 75 min', dist: '70 mi', time: '½ day', img: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop', p: "Frank Lloyd Wright's masterwork over Bear Run waterfall. Combine with Kentuck Knob for a full day." },
  { name: 'Niagara Falls', loc: 'Niagara, NY · 4 hr', dist: '230 mi', time: 'Weekend', img: 'https://images.unsplash.com/photo-1517217566896-6e64a98ce03c?w=600&h=400&fit=crop', p: 'Maid of the Mist, Cave of the Winds, Skylon Tower at sunset. Cross to Canada for the Horseshoe view.' },
  { name: 'Cleveland Rock Hall', loc: 'Cleveland, OH · 2 hr', dist: '135 mi', time: 'Day Trip', img: 'https://images.unsplash.com/photo-1485872299712-c91efd1fcab9?w=600&h=400&fit=crop', p: "Rock & Roll Hall of Fame on Lake Erie + dinner in Tremont. Catch a Guardians game if it's in season." },
  { name: 'Washington, D.C.', loc: 'D.C. · 4 hr', dist: '245 mi', time: 'Weekend', img: 'https://images.unsplash.com/photo-1501466044931-62695aada8e9?w=600&h=400&fit=crop', p: 'Free Smithsonian museums, the National Mall at sunrise, and U Street nightlife. Park at Vienna Metro.' },
  { name: 'Ohiopyle State Park', loc: 'Ohiopyle, PA · 90 min', dist: '80 mi', time: '½ day', img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop', p: 'Whitewater rafting on the Youghiogheny, the Great Allegheny Passage trail, and the iconic natural waterslides.' },
  { name: 'Lake Erie Wine Country', loc: 'Erie, PA · 2 hr', dist: '125 mi', time: 'Day Trip', img: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=600&h=400&fit=crop', p: '22 vineyards across the southern shore. Mazza Vineyards + 6th Street Distillery, Presque Isle for sunset.' },
];

type Deal = { disc: string; partner: string; title: string; body: string };

const DEALS: Deal[] = [
  { disc: '100+', partner: 'KAYAK', title: 'Every site, one search', body: 'KAYAK compares hundreds of travel sites at once to surface the lowest fare and room rate — no promo code needed, every search.' },
  { disc: 'AI', partner: 'Buckee', title: 'Buckee plans it for you', body: 'Tell Buckee your dates and budget; he builds the itinerary and schedules the CBL rides between every stop. Free with membership.' },
  { disc: 'QR', partner: 'CBL Members', title: 'Share your card, earn rewards', body: 'Every member gets a digital business card — refer friends, drivers and local spots, and earn rewards when they join under your code.' },
];

// ── Scoped CSS (from Travels Desktop.html, namespaced under .cbl-travels) ────
const TRAVELS_CSS = `
.cbl-travels { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-travels *,.cbl-travels *::before,.cbl-travels *::after { box-sizing:border-box; }
.cbl-travels button { font-family:inherit; cursor:pointer; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

/* ── Hero band ── */
.cbl-travels .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 16px;
}
.cbl-travels .hero-inner { max-width:1280px; margin:0 auto; position:relative; z-index:2; }
.cbl-travels .hero-streams { position:absolute; inset:0; z-index:1; pointer-events:none; }
.cbl-travels .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em; font-weight:700;
  color:#fff; text-transform:lowercase; margin-bottom:10px;
}
.cbl-travels .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:#C99742; animation:cbl-pulse 2.4s ease-in-out infinite;
}
.cbl-travels h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
  position:relative;
}
/* Desktop/tablet: the icon floats so it doesn't inflate the title row — the
   eyebrow/title/subtitle/lede then line up exactly with the Affiliates & About
   heroes. Below 721px the existing mobile rule positions the icon instead. */
@media (min-width:721px){
  .cbl-travels h1.hero-title .stays-icon {
    position:absolute; right:0; top:50%; transform:translateY(-50%);
  }
}
.cbl-travels h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-travels h1.hero-title .h1-main { color:#fff; white-space:nowrap; }
.cbl-travels .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:#C99742;
}
.cbl-travels .hero-subtitle .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:#C99742; text-transform:none; letter-spacing:0; font-size:.82em;
}
/* Hero icon container dimensions match the Eats & Drinks (.fork-knife) and
   Transportation (.car-icon) pages so all heros end at the same Y position
   and headers/subheaders don't shift when toggling between pages. */
.cbl-travels h1.hero-title .stays-icon {
  flex-shrink:0; width:240px; height:240px;
  display:flex; align-items:center; justify-content:center; opacity:.92;
}
.cbl-travels h1.hero-title .stays-icon svg { width:100%; height:100%; }
@media (max-width:1100px){ .cbl-travels h1.hero-title .stays-icon { width:180px; height:180px; } }
@media (max-width:720px){
  .cbl-travels h1.hero-title { display:flex; flex-wrap:nowrap; position:relative; gap:0; align-items:flex-start; font-size:clamp(34px,11vw,44px); }
  .cbl-travels h1.hero-title .title-stack { min-width:0; flex:1; }
  .cbl-travels h1.hero-title .title-stack > span:first-child { display:block; padding-right:64px; }
  .cbl-travels h1.hero-title .stays-icon { display:flex; position:absolute; top:0; right:0; width:56px; height:56px; }
  .cbl-travels .hero-subtitle { flex-wrap:nowrap; white-space:nowrap; font-size:clamp(20px,5.4vw,27px); }
  .cbl-travels .eyebrow { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
  .cbl-travels .eyebrow::before { display:inline-block; vertical-align:middle; margin-right:10px; }
  /* Section-header italic accents drop to their own line (no orphan first word). */
  .cbl-travels .section-h2 .it,
  .cbl-travels .buckee-text h2 .it { display:block; margin-left:0; }
}
.cbl-travels .hero p.lede { margin-top:14px; max-width:620px; font-size:16px; line-height:1.45; color:#B8B8B8; }

/* ── Search bar ── */
.cbl-travels .search-band {
  background:rgba(255,255,255,.03);
  border-top:1px solid rgba(255,255,255,.06);
  border-bottom:1px solid rgba(255,255,255,.06);
  padding:14px 48px;
}
.cbl-travels .search-inner {
  max-width:1280px; margin:0 auto;
  display:grid; grid-template-columns:2fr 1.4fr 1.4fr 1fr auto;
  gap:12px; align-items:end;
}
.cbl-travels .search-field { display:flex; flex-direction:column; gap:4px; min-width:0; }
.cbl-travels .search-field .lbl {
  font-family:${MONO}; font-size:10px; color:#888;
  letter-spacing:.14em; text-transform:uppercase;
}
.cbl-travels .search-field .ctl {
  background:#141414; border:1px solid rgba(255,255,255,.10);
  border-radius:12px; padding:12px 14px;
  display:flex; align-items:center; gap:10px;
  color:#fff; font-size:14px; min-height:44px;
}
.cbl-travels .search-field input {
  background:transparent; border:0; outline:0; color:#fff;
  font-family:${BODY}; font-size:14px; flex:1; min-width:0;
}
/* Native date inputs on a black field. color-scheme:dark ALREADY renders the
   calendar indicator light — a filter:invert(1) on top flipped it back to black,
   which is exactly the bug Keith spotted. Set the scheme, leave the icon alone.
   The whole field opens the picker (see DateField), not just this 20px glyph. */
/* Autocomplete dropdown */
.cbl-travels .ac-wrap { position:relative; }
.cbl-travels .ac-list {
  position:absolute; z-index:40; top:calc(100% + 6px); left:0; right:0;
  background:#141414; border:1px solid rgba(201,151,66,.30);
  border-radius:12px; overflow:hidden; max-height:264px; overflow-y:auto;
  box-shadow:0 18px 40px rgba(0,0,0,.55); list-style:none; margin:0; padding:4px;
}
.cbl-travels .ac-list li {
  display:flex; align-items:baseline; gap:9px; padding:9px 12px;
  border-radius:8px; cursor:pointer; color:#DcDcDc; font-size:14px;
}
.cbl-travels .ac-list li b { color:#fff; font-weight:700; }
.cbl-travels .ac-list li span { font-family:${MONO}; font-size:10.5px; letter-spacing:.08em; text-transform:uppercase; color:#8A8A8A; }
.cbl-travels .ac-list li.on { background:rgba(201,151,66,.16); }
.cbl-travels .ac-list li.on span { color:#C99742; }
.cbl-travels .search-field input[type="date"] { color-scheme:dark; cursor:pointer; }
.cbl-travels .search-field input[type="date"]::-webkit-calendar-picker-indicator {
  opacity:.65; cursor:pointer;
}
.cbl-travels .search-field input[type="date"]:hover::-webkit-calendar-picker-indicator { opacity:1; }
.cbl-travels .search-field .ctl.is-date { cursor:pointer; }
.cbl-travels .search-btn {
  background:#C99742; color:#000; border:0;
  padding:12px 22px; border-radius:12px; height:44px;
  font-family:${DISPLAY}; font-weight:900;
  font-size:14px; letter-spacing:.14em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:8px;
}
.cbl-travels .search-btn:hover { background:#DDB15F; }

/* ── Provider strip ── */
.cbl-travels .providers {
  max-width:1280px; margin:14px auto 0; padding:0 48px;
  display:flex; gap:8px; align-items:center; flex-wrap:wrap;
}
.cbl-travels .providers .pl {
  font-family:${MONO}; font-size:10px; color:#888;
  letter-spacing:.14em; text-transform:uppercase; margin-right:4px;
}
.cbl-travels .prov-chip {
  padding:6px 12px; border-radius:999px;
  background:transparent; border:1px solid rgba(255,255,255,.12);
  color:#B8B8B8; font-family:${MONO};
  font-size:11px; letter-spacing:.1em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:8px;
}
.cbl-travels .prov-chip::before {
  content:''; width:6px; height:6px; border-radius:50%;
  background:#4DBF66; box-shadow:0 0 6px #4DBF66;
}
.cbl-travels .prov-chip.cbl { background:rgba(201,151,66,.12); border-color:#C99742; color:#fff; }
/* Partner lockup. NO brightness(0) invert(1) here — that filter exists to force
   assorted logos to white-on-black, and running it over Expedia's own artwork
   would flatten the yellow #fddb32 tile to white and destroy the brand mark.
   This is the file the Creator Hub serves for its own banners; it already has a
   white wordmark and reads correctly on our black. Same rule as Ticketmaster. */
.cbl-travels .providers .partner-by {
  display:inline-flex; align-items:center; gap:9px;
  font-family:${MONO}; font-size:10px; color:#888;
  letter-spacing:.14em; text-transform:uppercase;
}
.cbl-travels .providers .partner-by img { height:19px; width:auto; display:block; }
@media (max-width:640px){ .cbl-travels .providers .partner-by img { height:17px; } }
.cbl-travels .prov-chip.cbl::before { background:#C99742; box-shadow:0 0 6px #C99742; }

/* ── Section frame ── */
.cbl-travels section.band { padding:36px 48px 56px; }
.cbl-travels section.band.tight { padding:28px 48px 36px; }
.cbl-travels .band-inner { max-width:1280px; margin:0 auto; }
.cbl-travels .section-eyebrow {
  font-family:${MONO}; font-size:12px; color:#C99742;
  letter-spacing:.18em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
}
.cbl-travels .section-eyebrow::before { content:''; width:28px; height:1px; background:#C99742; }
.cbl-travels .section-h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(40px,4.6vw,64px); line-height:.95;
  letter-spacing:-.01em; text-transform:uppercase; margin-bottom:8px;
}
.cbl-travels .section-h2 .it {
  font-family:${ITALIC}; font-style:italic;
  color:#C99742; font-weight:600; text-transform:none;
  font-size:.6em; margin-left:8px;
}
.cbl-travels .section-lede {
  color:#B0B0B0; font-size:15px; line-height:1.55; max-width:62ch; margin-bottom:24px;
}
.cbl-travels .section-head {
  display:flex; justify-content:space-between; align-items:flex-end;
  margin-bottom:24px; gap:24px; flex-wrap:wrap;
}
.cbl-travels .section-head .count {
  font-family:${MONO}; font-size:11px;
  letter-spacing:.14em; color:#8a8a8a; text-transform:uppercase;
}
.cbl-travels .section-head .count b { color:#C99742; }

/* ── Category tabs ── */
.cbl-travels .cat-tabs {
  padding:14px 48px 0;
  background:rgba(10,10,10,.94); backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid rgba(255,255,255,.06);
  position:sticky; top:0; z-index:20; max-width:100%;
}
.cbl-travels .cat-tabs-track { display:flex; overflow-x:auto; scrollbar-width:none; }
.cbl-travels .cat-tabs-track::-webkit-scrollbar { display:none; }
.cbl-travels .cat-tabs-inner { display:flex; gap:6px; max-width:1280px; margin:0 auto; width:100%; }
/* ── Horizontal-scroll affordance (chevrons + edge fades) ──
   Chevrons tap-to-scroll and fade out at each end; both auto-hide when the tab
   row already fits (desktop), so they only appear where it truly scrolls. */
.cbl-travels .tabs-chev {
  position:absolute; top:calc(50% + 6px); transform:translateY(-50%);
  width:32px; height:32px; border-radius:50%;
  display:flex; align-items:center; justify-content:center;
  background:rgba(18,18,18,.94); color:#C99742;
  border:1px solid rgba(201,151,66,.5);
  font-size:22px; line-height:0; padding-bottom:2px; cursor:pointer; z-index:6;
  transition:opacity .2s; -webkit-backdrop-filter:blur(6px); backdrop-filter:blur(6px);
}
.cbl-travels .tabs-chev.left { left:10px; }
.cbl-travels .tabs-chev.right { right:10px; }
.cbl-travels .cat-tabs[data-at-start="true"] .tabs-chev.left { opacity:0; pointer-events:none; }
.cbl-travels .cat-tabs[data-at-end="true"] .tabs-chev.right { opacity:0; pointer-events:none; }
.cbl-travels .cat-tabs::before, .cbl-travels .cat-tabs::after {
  content:''; position:absolute; top:0; bottom:1px; width:48px; z-index:5;
  pointer-events:none; transition:opacity .2s;
}
.cbl-travels .cat-tabs::before { left:0; background:linear-gradient(90deg, rgba(10,10,10,.97), rgba(10,10,10,0)); }
.cbl-travels .cat-tabs::after { right:0; background:linear-gradient(270deg, rgba(10,10,10,.97), rgba(10,10,10,0)); }
.cbl-travels .cat-tabs[data-at-start="true"]::before { opacity:0; }
.cbl-travels .cat-tabs[data-at-end="true"]::after { opacity:0; }
.cbl-travels .cat-tab {
  flex-shrink:0; background:transparent; border:0; color:#888;
  padding:8px 22px 12px;
  display:flex; flex-direction:column; align-items:center; gap:6px;
  font-family:${DISPLAY}; font-weight:900;
  font-size:15px; letter-spacing:.14em; text-transform:uppercase;
  transition:color .2s; border-bottom:3px solid transparent; margin-bottom:-1px;
  min-width:120px;
}
.cbl-travels .cat-tab .ic {
  opacity:.55; transition:opacity .2s;
  display:flex; align-items:center; justify-content:center; height:40px;
}
.cbl-travels .cat-tab:hover { color:#fff; }
.cbl-travels .cat-tab:hover .ic { opacity:.9; }
.cbl-travels .cat-tab.active { color:#C99742; border-bottom-color:#C99742; }
.cbl-travels .cat-tab.active .ic { opacity:1; }

/* ── Flight rows ── */
/* Flight search panel — replaces the invented flight rows. */
.cbl-travels .flightsearch { max-width:1376px; margin:0 auto; }
.cbl-travels .flightsearch .fs-grid {
  display:grid; grid-template-columns:1fr 1fr 170px 170px 120px auto; gap:12px; align-items:end;
}
.cbl-travels .flightsearch .search-btn { height:44px; white-space:nowrap; }
.cbl-travels .flightsearch .search-btn:disabled { opacity:.45; cursor:default; }
.cbl-travels .flightsearch .fs-oneway {
  display:inline-flex; align-items:center; gap:8px; margin-top:14px;
  font-family:${MONO}; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:#B8B8B8; cursor:pointer;
}
.cbl-travels .flightsearch .fs-oneway input { accent-color:#C99742; width:15px; height:15px; cursor:pointer; }
.cbl-travels .flightsearch .fs-note {
  margin-top:26px; padding:20px 24px; max-width:70ch;
  background:rgba(201,151,66,.06); border:1px solid rgba(201,151,66,.22);
  border-radius:14px 0 14px 0;
}
.cbl-travels .flightsearch .fs-note h4 {
  font-family:${DISPLAY}; font-weight:900; font-size:19px; color:#fff; margin-bottom:8px; letter-spacing:-.005em;
}
.cbl-travels .flightsearch .fs-note p { color:#B0B0B0; font-size:14.5px; line-height:1.65; text-wrap:pretty; }
@media (max-width:1100px){
  .cbl-travels .flightsearch .fs-grid { grid-template-columns:1fr 1fr; }
  .cbl-travels .flightsearch .search-btn { grid-column:1 / -1; }
}
@media (max-width:560px){
  .cbl-travels .flightsearch .fs-grid { grid-template-columns:1fr; }
}
.cbl-travels .flight-row {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:14px 0 14px 0; padding:18px 22px;
  display:grid; grid-template-columns:80px 1fr auto auto auto auto;
  gap:18px; align-items:center; margin-bottom:10px;
  transition:transform .25s, border-color .25s;
  animation:cbl-reveal .5s cubic-bezier(.2,.8,.2,1) both;
}
.cbl-travels .flight-row:hover { border-color:rgba(201,151,66,.45); transform:translateX(3px); }
.cbl-travels .flight-row .airline {
  font-family:${DISPLAY}; font-weight:900;
  font-size:20px; text-transform:uppercase; line-height:1; letter-spacing:-.005em;
}
.cbl-travels .flight-row .flight-no { font-family:${MONO}; font-size:10px; color:#888; letter-spacing:.14em; margin-top:4px; }
.cbl-travels .flight-row .route { display:flex; align-items:center; gap:14px; }
.cbl-travels .flight-row .point .code { font-family:${DISPLAY}; font-weight:900; font-size:26px; line-height:1; letter-spacing:-.01em; }
.cbl-travels .flight-row .point .time { font-family:${MONO}; font-size:11px; color:#C99742; letter-spacing:.08em; margin-top:4px; }
.cbl-travels .flight-row .arrow { flex:1; min-width:60px; position:relative; height:1px; background:rgba(255,255,255,.18); }
.cbl-travels .flight-row .arrow::after {
  content:''; position:absolute; right:0; top:-3px;
  border-left:6px solid rgba(255,255,255,.45);
  border-top:3px solid transparent; border-bottom:3px solid transparent;
}
.cbl-travels .flight-row .arrow .lbl {
  position:absolute; left:50%; top:-16px; transform:translateX(-50%);
  font-family:${MONO}; font-size:9px; color:#888;
  letter-spacing:.14em; text-transform:uppercase; white-space:nowrap;
}
.cbl-travels .flight-row .stops {
  font-family:${MONO}; font-size:10px; color:#B8B8B8;
  letter-spacing:.1em; text-transform:uppercase; text-align:right; line-height:1.4;
}
.cbl-travels .flight-row .stops b { color:#C99742; }
.cbl-travels .flight-row .f-tag {
  font-family:${MONO}; font-size:10px; color:#C99742;
  letter-spacing:.12em; text-transform:uppercase;
  padding:4px 8px; border:1px solid rgba(201,151,66,.35);
  background:rgba(201,151,66,.06); border-radius:4px;
}
.cbl-travels .flight-row .price-block { text-align:right; }
.cbl-travels .flight-row .price-block .price { font-family:${DISPLAY}; font-weight:900; font-size:28px; color:#C99742; line-height:1; letter-spacing:-.01em; }
.cbl-travels .flight-row .actions { display:flex; flex-direction:column; gap:6px; }
.cbl-travels .flight-row .actions button {
  background:#C99742; color:#000; border:0;
  padding:10px 16px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800;
  font-size:11px; letter-spacing:.12em; text-transform:uppercase; white-space:nowrap;
}
.cbl-travels .flight-row .actions button:hover { background:#DDB15F; }
.cbl-travels .flight-row .actions .ride {
  background:transparent; color:#C99742;
  border:1px solid rgba(201,151,66,.5);
  display:inline-flex; align-items:center; justify-content:center; gap:6px;
}
.cbl-travels .flight-row .actions .ride:hover { background:rgba(201,151,66,.12); }

/* ── Airport ride banner ── */
.cbl-travels .airport-banner {
  background:linear-gradient(135deg, rgba(201,151,66,.16), rgba(201,151,66,.04));
  border:1px solid rgba(201,151,66,.4);
  border-radius:18px 0 18px 0; padding:22px 28px;
  display:grid; grid-template-columns:auto 1fr auto; gap:24px;
  align-items:center; margin-bottom:24px;
}
.cbl-travels .airport-banner .ic {
  width:56px; height:56px; border-radius:50%;
  border:1.5px solid #C99742; color:#C99742;
  display:flex; align-items:center; justify-content:center;
}
.cbl-travels .airport-banner h3 { font-family:${DISPLAY}; font-weight:900; font-size:24px; text-transform:uppercase; letter-spacing:-.005em; line-height:1; margin-bottom:6px; }
.cbl-travels .airport-banner p { color:#B8B8B8; font-size:13px; line-height:1.45; max-width:60ch; }
.cbl-travels .airport-banner .cta {
  background:#C99742; color:#000; border:0;
  padding:12px 22px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:900;
  font-size:13px; letter-spacing:.12em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:8px;
}
.cbl-travels .airport-banner .cta:hover { background:#DDB15F; }

/* ── Stay cards ── */
.cbl-travels .stays-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.cbl-travels .stay-card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; overflow:hidden;
  display:flex; flex-direction:column;
  transition:transform .35s, border-color .35s;
  animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both;
}
.cbl-travels .stay-card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.45); }
.cbl-travels .stay-card .img { aspect-ratio:5/3.4; background-size:cover; background-position:center; position:relative; }
.cbl-travels .stay-card .img::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(10,10,10,0) 50%, rgba(10,10,10,.55));
}
.cbl-travels .stay-card .src {
  position:absolute; top:14px; right:14px; z-index:2;
  font-family:${MONO}; font-size:9px;
  letter-spacing:.14em; text-transform:uppercase; color:#C99742;
  background:rgba(0,0,0,.7); padding:5px 9px; border-radius:4px;
  border:1px solid rgba(201,151,66,.4); backdrop-filter:blur(6px);
}
.cbl-travels .stay-card .tag {
  position:absolute; top:14px; left:14px; z-index:2;
  font-family:${MONO}; font-size:9px;
  letter-spacing:.14em; text-transform:uppercase; color:#fff;
  background:rgba(0,0,0,.65); padding:5px 9px; border-radius:4px;
  border:1px solid rgba(255,255,255,.18); backdrop-filter:blur(6px);
}
.cbl-travels .stay-card .body { padding:20px 22px 22px; display:flex; flex-direction:column; gap:8px; flex:1; }
.cbl-travels .stay-card h3 { margin:0; font-family:${DISPLAY}; font-size:26px; font-weight:900; line-height:1; letter-spacing:-.005em; text-transform:uppercase; }
.cbl-travels .stay-card .loc { font-family:${MONO}; font-size:11px; color:#C99742; letter-spacing:.08em; text-transform:uppercase; }
.cbl-travels .stay-card .desc { font-size:13px; line-height:1.5; color:#A8A8A8; }
.cbl-travels .stay-card .stars { display:flex; gap:3px; align-items:center; font-family:${MONO}; font-size:11px; color:#888; }
.cbl-travels .stay-card .stars b { color:#fff; margin-right:4px; font-family:${DISPLAY}; font-size:14px; }
.cbl-travels .stay-card .price-row { display:flex; justify-content:space-between; align-items:baseline; margin-top:auto; padding-top:10px; gap:10px; }
.cbl-travels .stay-card .price { font-family:${DISPLAY}; font-weight:900; font-size:28px; color:#C99742; line-height:1; letter-spacing:-.005em; }
.cbl-travels .stay-card .per { font-family:${MONO}; font-size:10px; color:#888; letter-spacing:.12em; text-transform:uppercase; }
.cbl-travels .stay-card .cta-row { display:flex; gap:8px; margin-top:12px; }
.cbl-travels .stay-card .cta {
  flex:1; background:#C99742; border:0; color:#000;
  padding:12px 0; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800;
  font-size:12px; letter-spacing:.12em; text-transform:uppercase;
}
.cbl-travels .stay-card .cta:hover { background:#DDB15F; }
.cbl-travels .stay-card .cta.ghost { background:transparent; color:#fff; border:1px solid rgba(255,255,255,.18); }
.cbl-travels .stay-card .cta.ghost:hover { border-color:#C99742; color:#C99742; }

/* ── Day trip cards ── */
.cbl-travels .trips-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:18px; }
.cbl-travels .trip-card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; overflow:hidden;
  display:grid; grid-template-columns:220px 1fr;
  transition:transform .25s, border-color .25s;
}
.cbl-travels .trip-card:hover { transform:translateY(-3px); border-color:rgba(201,151,66,.45); }
.cbl-travels .trip-card .img { background-size:cover; background-position:center; min-height:180px; }
.cbl-travels .trip-card .body { padding:18px 22px; display:flex; flex-direction:column; gap:8px; }
.cbl-travels .trip-card h3 { font-family:${DISPLAY}; font-weight:900; font-size:24px; line-height:1; text-transform:uppercase; letter-spacing:-.005em; }
.cbl-travels .trip-card .meta { display:flex; gap:10px; flex-wrap:wrap; font-family:${MONO}; font-size:10px; letter-spacing:.12em; text-transform:uppercase; }
.cbl-travels .trip-card .meta .pill {
  padding:4px 8px; border-radius:4px;
  background:rgba(255,255,255,.04); color:#B8B8B8; border:1px solid rgba(255,255,255,.10);
}
.cbl-travels .trip-card .meta .pill.dist { color:#C99742; border-color:rgba(201,151,66,.35); }
.cbl-travels .trip-card p { color:#A8A8A8; font-size:13px; line-height:1.5; }
.cbl-travels .trip-card .cta {
  align-self:flex-start; margin-top:4px;
  background:transparent; border:1px solid rgba(201,151,66,.5);
  color:#C99742; padding:8px 16px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800;
  font-size:11px; letter-spacing:.14em; text-transform:uppercase;
}
.cbl-travels .trip-card .cta:hover { background:#C99742; color:#000; }

/* ── Buckee itinerary band ── */
@keyframes buckee-float { 0%,100%{transform:translateY(0) rotate(-2deg);} 50%{transform:translateY(-14px) rotate(2deg);} }
@keyframes buckee-glow { 0%,100%{opacity:.4; transform:scale(1);} 50%{opacity:.75; transform:scale(1.08);} }
.cbl-travels .buckee-band {
  background:
    radial-gradient(ellipse at 70% 50%, rgba(201,151,66,.16), transparent 60%),
    linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%);
  border-top:1px solid rgba(201,151,66,.18);
  border-bottom:1px solid rgba(201,151,66,.18);
}
.cbl-travels .buckee-grid { display:grid; grid-template-columns:1.1fr 1fr; gap:56px; align-items:end; }
.cbl-travels .buckee-hero { position:relative; min-height:480px; display:flex; align-items:flex-end; justify-content:center; }
.cbl-travels .buckee-hero .glow {
  position:absolute; width:480px; height:480px; border-radius:50%;
  background:radial-gradient(circle, rgba(201,151,66,.5), rgba(201,151,66,0) 65%);
  animation:buckee-glow 4s ease-in-out infinite; bottom:-40px;
}
.cbl-travels .buckee-hero .mascot {
  position:relative; width:380px; height:auto;
  animation:buckee-float 5s ease-in-out infinite;
  filter:drop-shadow(0 18px 30px rgba(0,0,0,.55));
  z-index:2; display:block;
}
.cbl-travels .buckee-hero .badge {
  position:absolute; top:0; left:-32px;
  background:#fff; color:#1A1410;
  padding:22px 30px; border-radius:26px 26px 26px 6px;
  font-family:${DISPLAY}; font-weight:900;
  font-size:28px; letter-spacing:.02em; line-height:1;
  box-shadow:0 14px 32px rgba(0,0,0,.45);
  z-index:4; animation:buckee-float 5s ease-in-out infinite; white-space:nowrap;
}
.cbl-travels .buckee-hero .badge::after {
  content:''; position:absolute; left:32px; bottom:-16px;
  width:0; height:0;
  border-left:18px solid transparent; border-right:8px solid transparent;
  border-top:18px solid #fff;
}
.cbl-travels .buckee-text h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(40px,4.6vw,64px); line-height:.95;
  letter-spacing:-.01em; text-transform:uppercase; margin-bottom:10px;
}
.cbl-travels .buckee-text h2 .it { font-family:${ITALIC}; font-style:italic; color:#C99742; font-weight:600; text-transform:none; font-size:.6em; margin-left:8px; }
.cbl-travels .buckee-text p { color:#B0B0B0; font-size:16px; line-height:1.6; max-width:52ch; margin-bottom:24px; }
.cbl-travels .buckee-bullets { display:grid; gap:14px; margin-bottom:26px; }
.cbl-travels .buckee-bullet { display:flex; gap:14px; align-items:flex-start; }
.cbl-travels .buckee-bullet .num {
  flex-shrink:0; width:32px; height:32px; border-radius:50%;
  border:1.5px solid #C99742; color:#C99742;
  font-family:${DISPLAY}; font-weight:900;
  font-size:14px; display:flex; align-items:center; justify-content:center;
}
.cbl-travels .buckee-bullet h4 { font-family:${DISPLAY}; font-weight:900; font-size:18px; text-transform:uppercase; letter-spacing:-.005em; line-height:1; margin-bottom:4px; }
.cbl-travels .buckee-bullet p { font-size:13px; color:#A8A8A8; line-height:1.5; margin:0; }
.cbl-travels .buckee-cta {
  display:inline-flex; align-items:center; gap:10px;
  background:#C99742; color:#000; border:0;
  padding:14px 28px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:900;
  font-size:14px; letter-spacing:.14em; text-transform:uppercase;
}
.cbl-travels .buckee-cta:hover { background:#DDB15F; }
.cbl-travels .buckee-cta-row { display:flex; gap:12px; align-items:center; flex-wrap:wrap; }
.cbl-travels .buckee-note { font-family:${MONO}; font-size:10px; color:#888; letter-spacing:.12em; text-transform:uppercase; }

/* ── Deals strip ── */
.cbl-travels .deals-band {
  background:linear-gradient(180deg, #0A0A0A 0%, #0F0F0F 100%);
  border-top:1px solid rgba(255,255,255,.06);
  border-bottom:1px solid rgba(255,255,255,.06);
}
.cbl-travels .deals-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
.cbl-travels .deal {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:14px 0 14px 0; padding:18px 20px;
  display:flex; gap:14px; align-items:flex-start;
}
.cbl-travels .deal .disc {
  flex-shrink:0; background:#C99742; color:#000;
  width:56px; height:56px; border-radius:12px;
  display:flex; align-items:center; justify-content:center;
  font-family:${DISPLAY}; font-weight:900;
  font-size:18px; line-height:1; text-align:center; letter-spacing:-.02em;
}
.cbl-travels .deal h4 { font-family:${DISPLAY}; font-weight:900; font-size:17px; line-height:1.1; text-transform:uppercase; letter-spacing:-.005em; margin-bottom:4px; }
.cbl-travels .deal .partner { font-family:${MONO}; font-size:10px; color:#C99742; letter-spacing:.14em; text-transform:uppercase; margin-bottom:6px; }
.cbl-travels .deal p { font-size:12px; color:#A8A8A8; line-height:1.45; }

/* ── Responsive ── */
@media (max-width:1100px){
  .cbl-travels .hero { padding:22px 24px 16px; }
  .cbl-travels .search-band { padding:14px 24px; }
  .cbl-travels .providers { padding:0 24px; }
  .cbl-travels .cat-tabs { padding:14px 24px 0; }
  .cbl-travels section.band { padding:36px 24px 48px; }
  .cbl-travels .search-inner { grid-template-columns:minmax(0,1fr) minmax(0,1fr); }
  /* Native date inputs on a black field. color-scheme:dark ALREADY renders the
   calendar indicator light — a filter:invert(1) on top flipped it back to black,
   which is exactly the bug Keith spotted. Set the scheme, leave the icon alone.
   The whole field opens the picker (see DateField), not just this 20px glyph. */
.cbl-travels .search-field input[type="date"] { color-scheme:dark; cursor:pointer; }
.cbl-travels .search-field input[type="date"]::-webkit-calendar-picker-indicator {
  opacity:.65; cursor:pointer;
}
.cbl-travels .search-field input[type="date"]:hover::-webkit-calendar-picker-indicator { opacity:1; }
.cbl-travels .search-field .ctl.is-date { cursor:pointer; }
.cbl-travels .search-btn { grid-column:span 2; width:100%; }
  .cbl-travels .stays-grid { grid-template-columns:repeat(2,1fr); }
  .cbl-travels .trips-grid { grid-template-columns:1fr; }
  .cbl-travels .trip-card { grid-template-columns:1fr; }
  .cbl-travels .trip-card .img { aspect-ratio:16/9; min-height:0; }
  .cbl-travels .deals-grid { grid-template-columns:1fr; }
  .cbl-travels .buckee-grid { grid-template-columns:1fr; gap:32px; }
  .cbl-travels .buckee-hero { min-height:360px; }
  .cbl-travels .buckee-hero .mascot { width:280px; }
  .cbl-travels .buckee-hero .glow { width:360px; height:360px; }
}
@media (max-width:720px){
  /* Single-column stay cards on phones — the 2-col grid (from the 1100px block
     above) crams hotel names to 5 lines and clips review counts/badges.
     Must come AFTER the 1100px block so it wins on source order at phone widths. */
  .cbl-travels .stays-grid { grid-template-columns:1fr; }

  /* Flight rows: the desktop 6-column grid (airline | route | stops | tag |
     price | actions) overflows 390px and clips the stops/price/book columns
     off-screen. Reflow into a stacked card with named areas. */
  /* Flight search panel — replaces the invented flight rows. */
.cbl-travels .flightsearch { max-width:1376px; margin:0 auto; }
.cbl-travels .flightsearch .fs-grid {
  display:grid; grid-template-columns:1fr 1fr 170px 170px 120px auto; gap:12px; align-items:end;
}
.cbl-travels .flightsearch .search-btn { height:44px; white-space:nowrap; }
.cbl-travels .flightsearch .search-btn:disabled { opacity:.45; cursor:default; }
.cbl-travels .flightsearch .fs-oneway {
  display:inline-flex; align-items:center; gap:8px; margin-top:14px;
  font-family:${MONO}; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:#B8B8B8; cursor:pointer;
}
.cbl-travels .flightsearch .fs-oneway input { accent-color:#C99742; width:15px; height:15px; cursor:pointer; }
.cbl-travels .flightsearch .fs-note {
  margin-top:26px; padding:20px 24px; max-width:70ch;
  background:rgba(201,151,66,.06); border:1px solid rgba(201,151,66,.22);
  border-radius:14px 0 14px 0;
}
.cbl-travels .flightsearch .fs-note h4 {
  font-family:${DISPLAY}; font-weight:900; font-size:19px; color:#fff; margin-bottom:8px; letter-spacing:-.005em;
}
.cbl-travels .flightsearch .fs-note p { color:#B0B0B0; font-size:14.5px; line-height:1.65; text-wrap:pretty; }
@media (max-width:1100px){
  .cbl-travels .flightsearch .fs-grid { grid-template-columns:1fr 1fr; }
  .cbl-travels .flightsearch .search-btn { grid-column:1 / -1; }
}
@media (max-width:560px){
  .cbl-travels .flightsearch .fs-grid { grid-template-columns:1fr; }
}
.cbl-travels .flight-row {
    grid-template-columns:1fr auto;
    grid-template-areas:
      "airline price"
      "route route"
      "stops tag"
      "actions actions";
    gap:12px 12px; padding:16px 16px;
  }
  .cbl-travels .flight-row > div:first-child { grid-area:airline; }
  .cbl-travels .flight-row .route { grid-area:route; }
  .cbl-travels .flight-row .stops { grid-area:stops; text-align:left; align-self:center; }
  .cbl-travels .flight-row .f-tag { grid-area:tag; justify-self:end; align-self:center; }
  .cbl-travels .flight-row .price-block { grid-area:price; }
  .cbl-travels .flight-row .actions { grid-area:actions; flex-direction:row; }
  .cbl-travels .flight-row .actions button { flex:1; }

  /* Airport-ride banner: 3-column grid (icon | text | button) pushes the CTA
     off the right edge on phones. Stack it, full-width button. */
  .cbl-travels .airport-banner {
    grid-template-columns:1fr; gap:16px; padding:20px 20px;
  }
  .cbl-travels .airport-banner .cta { width:100%; justify-content:center; }
}
`;

// ── Sub-components ──────────────────────────────────────────────────────────
function HeroStaysSvg() {
  return (
    <svg viewBox="0 0 288 227.01" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="47.43" y="115.99" width="193.15" height="74.01" />
      <line x1="47.43" y1="169.51" x2="240.57" y2="169.51" />
      <path d="M58.39,112.96v-45.6c0-17.4,27.37-25.75,85.61-25.75" />
      <path d="M229.61,112.96s0-28.2,0-45.6c0-17.4-27.37-25.75-85.61-25.75" />
      <line x1="58.39" y1="190" x2="58.39" y2="204.05" />
      <line x1="229.61" y1="190" x2="229.61" y2="204.05" />
      <path d="M83.44,115.99v-29.64c0-3.94,3.23-7.17,7.17-7.17h44.11c3.94,0,7.17,3.23,7.17,7.17v29.64" />
      <path d="M142.27,115.99v-29.38c0-4.08,3.34-7.42,7.42-7.42h47.78c4.08,0,7.42,3.34,7.42,7.42v29.38" />
    </svg>
  );
}

function RideGlyph({ size = 12, color = '#C99742', strokeWidth = 14 }: { size?: number; color?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size * 0.79} viewBox="0 0 288 227.01" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      <path d="M65.43,90.76l-13.2,21.57c-2.58,4.17-3.66,8.95-3.11,13.68l5.26,45.23h89.57" />
      <path d="M222.56,90.76l13.2,21.57c2.58,4.17,3.66,8.95,3.11,13.68l-5.26,45.23h-89.57" />
    </svg>
  );
}

function Hero() {
  return (
    <section className="hero cbl-light-streams">
      {/* first child = dedicated streak layer (hosts 2 of the 4 light streams), under the copy */}
      <div className="hero-streams" aria-hidden="true" />
      <div className="hero-inner">
        <div className="eyebrow">cbl curated · booking launching soon</div>
        <h1 className="hero-title">
          <span className="title-stack">
            <span className="h1-main">Travels</span>
            <span className="hero-subtitle">
              <span>Plan it.</span>
              <span className="it">Book it. Live it.</span>
            </span>
          </span>
          <span className="stays-icon" aria-hidden="true">
            <HeroStaysSvg />
          </span>
        </h1>
        <p className="lede">
          Hotels, B&amp;Bs, short-term rentals, weekend day trips, and full
          multi-day itineraries — curated by CBL, with full hotel &amp; flight
          booking launching soon. Buckee plans the rest.
        </p>
      </div>
    </section>
  );
}


/**
 * US destinations for the search autocomplete. Matching runs on city, state code
 * AND full state name, so "florida" surfaces Orlando/Miami/Tampa the way Keith
 * expects — a plain <datalist> only matches the option text, so typing a state
 * name would find nothing.
 *
 * Deliberately a travel list, not a geography list: where CBL members actually
 * go. The lib/location.ts gazetteer is Pittsburgh suburbs and no use here.
 */
type Destination = { city: string; st: string; state: string };
const DESTINATIONS: Destination[] = [
  { city: 'Orlando', st: 'FL', state: 'Florida' },
  { city: 'Miami', st: 'FL', state: 'Florida' },
  { city: 'Tampa', st: 'FL', state: 'Florida' },
  { city: 'Fort Lauderdale', st: 'FL', state: 'Florida' },
  { city: 'Key West', st: 'FL', state: 'Florida' },
  { city: 'Naples', st: 'FL', state: 'Florida' },
  { city: 'St. Petersburg', st: 'FL', state: 'Florida' },
  { city: 'Jacksonville', st: 'FL', state: 'Florida' },
  { city: 'New York', st: 'NY', state: 'New York' },
  { city: 'Las Vegas', st: 'NV', state: 'Nevada' },
  { city: 'Los Angeles', st: 'CA', state: 'California' },
  { city: 'San Diego', st: 'CA', state: 'California' },
  { city: 'San Francisco', st: 'CA', state: 'California' },
  { city: 'Palm Springs', st: 'CA', state: 'California' },
  { city: 'Chicago', st: 'IL', state: 'Illinois' },
  { city: 'New Orleans', st: 'LA', state: 'Louisiana' },
  { city: 'Nashville', st: 'TN', state: 'Tennessee' },
  { city: 'Memphis', st: 'TN', state: 'Tennessee' },
  { city: 'Gatlinburg', st: 'TN', state: 'Tennessee' },
  { city: 'Charleston', st: 'SC', state: 'South Carolina' },
  { city: 'Myrtle Beach', st: 'SC', state: 'South Carolina' },
  { city: 'Savannah', st: 'GA', state: 'Georgia' },
  { city: 'Atlanta', st: 'GA', state: 'Georgia' },
  { city: 'Asheville', st: 'NC', state: 'North Carolina' },
  { city: 'Outer Banks', st: 'NC', state: 'North Carolina' },
  { city: 'Denver', st: 'CO', state: 'Colorado' },
  { city: 'Aspen', st: 'CO', state: 'Colorado' },
  { city: 'Austin', st: 'TX', state: 'Texas' },
  { city: 'Dallas', st: 'TX', state: 'Texas' },
  { city: 'San Antonio', st: 'TX', state: 'Texas' },
  { city: 'Houston', st: 'TX', state: 'Texas' },
  { city: 'Phoenix', st: 'AZ', state: 'Arizona' },
  { city: 'Scottsdale', st: 'AZ', state: 'Arizona' },
  { city: 'Sedona', st: 'AZ', state: 'Arizona' },
  { city: 'Seattle', st: 'WA', state: 'Washington' },
  { city: 'Portland', st: 'OR', state: 'Oregon' },
  { city: 'Boston', st: 'MA', state: 'Massachusetts' },
  { city: 'Cape Cod', st: 'MA', state: 'Massachusetts' },
  { city: 'Washington', st: 'DC', state: 'District of Columbia' },
  { city: 'Philadelphia', st: 'PA', state: 'Pennsylvania' },
  { city: 'Pittsburgh', st: 'PA', state: 'Pennsylvania' },
  { city: 'Baltimore', st: 'MD', state: 'Maryland' },
  { city: 'Virginia Beach', st: 'VA', state: 'Virginia' },
  { city: 'Honolulu', st: 'HI', state: 'Hawaii' },
  { city: 'Maui', st: 'HI', state: 'Hawaii' },
  { city: 'Anchorage', st: 'AK', state: 'Alaska' },
  { city: 'Salt Lake City', st: 'UT', state: 'Utah' },
  { city: 'Moab', st: 'UT', state: 'Utah' },
  { city: 'Cleveland', st: 'OH', state: 'Ohio' },
  { city: 'Columbus', st: 'OH', state: 'Ohio' },
  { city: 'Detroit', st: 'MI', state: 'Michigan' },
  { city: 'Minneapolis', st: 'MN', state: 'Minnesota' },
  { city: 'Kansas City', st: 'MO', state: 'Missouri' },
  { city: 'St. Louis', st: 'MO', state: 'Missouri' },
  { city: 'Louisville', st: 'KY', state: 'Kentucky' },
  { city: 'Indianapolis', st: 'IN', state: 'Indiana' },
  { city: 'Milwaukee', st: 'WI', state: 'Wisconsin' },
];

function matchDestinations(q: string, limit = 7): Destination[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const starts: Destination[] = [];
  const contains: Destination[] = [];
  for (const d of DESTINATIONS) {
    const city = d.city.toLowerCase();
    const state = d.state.toLowerCase();
    const st = d.st.toLowerCase();
    if (city.startsWith(t) || state.startsWith(t) || st === t) starts.push(d);
    else if (city.includes(t) || state.includes(t)) contains.push(d);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

/** Text field with a destination dropdown. Keyboard: arrows, Enter, Escape. */
function DestinationField({
  label, value, onChange, onSubmit, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const matches = open ? matchDestinations(value) : [];

  useEffect(() => {
    const away = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, []);

  const pick = (d: Destination) => {
    onChange(`${d.city}, ${d.st}`);
    setOpen(false);
  };

  return (
    <div className="search-field ac-wrap" ref={wrapRef}>
      <div className="lbl">{label}</div>
      <div className="ctl">
        <svg width="14" height="16" viewBox="0 0 14 16" fill="none" aria-hidden="true">
          <path d="M7 1c3 0 5 2 5 5 0 4-5 9-5 9S2 10 2 6c0-3 2-5 5-5z" stroke="#C99742" strokeWidth="1.6" />
        </svg>
        <input
          value={value}
          placeholder={placeholder}
          aria-label={label}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && matches.length > 0}
          onChange={(e) => { onChange(e.target.value); setOpen(true); setHi(0); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!open || !matches.length) { if (e.key === 'Enter') onSubmit(); return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); setHi((i) => (i + 1) % matches.length); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setHi((i) => (i - 1 + matches.length) % matches.length); }
            else if (e.key === 'Enter') { e.preventDefault(); pick(matches[hi]); }
            else if (e.key === 'Escape') setOpen(false);
          }}
        />
      </div>
      {open && matches.length > 0 && (
        <ul className="ac-list" role="listbox">
          {matches.map((d, i) => (
            <li
              key={`${d.city}-${d.st}`}
              role="option"
              aria-selected={i === hi}
              className={i === hi ? 'on' : undefined}
              onMouseEnter={() => setHi(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(d); }}
            >
              <b>{d.city}</b><span>{d.state}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Date field where the WHOLE control opens the picker, not just the small glyph. */
function DateField({
  label, value, min, onChange, onSubmit,
}: {
  label: string; value: string; min?: string; onChange: (v: string) => void; onSubmit: () => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const openPicker = () => {
    const el = ref.current;
    if (!el) return;
    // showPicker() is the supported way to open the native calendar from a click
    // anywhere in the field. Older browsers just focus, which is the old behaviour.
    if (typeof el.showPicker === 'function') { try { el.showPicker(); return; } catch { /* fall through */ } }
    el.focus();
  };
  return (
    <div className="search-field">
      <div className="lbl">{label}</div>
      <div className="ctl is-date" onClick={openPicker}>
        <input
          ref={ref}
          type="date"
          value={value}
          min={min}
          aria-label={label}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        />
      </div>
    </div>
  );
}

/** YYYY-MM-DD, `days` from today — what <input type="date"> and Expedia both want. */
function isoDaysOut(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function SearchBar() {
  const [dest, setDest] = useState('Pittsburgh, PA');
  const [guests, setGuests] = useState('2 adults');
  // Were hardcoded `defaultValue="Fri May 23"` strings: uncontrolled, never read,
  // and stale on the page. A visitor could set dates and search anyway sent none.
  const [checkIn, setCheckIn] = useState(() => isoDaysOut(7));
  const [checkOut, setCheckOut] = useState(() => isoDaysOut(9));
  const search = () => {
    const n = parseInt(guests, 10);
    window.open(
      expediaStaySearch(
        {
          destination: dest,
          guests: Number.isFinite(n) ? n : undefined,
          // Only send a range that makes sense; Expedia ignores a bad one anyway,
          // but sending checkout-before-checkin would just look broken.
          ...(checkIn && checkOut && checkOut > checkIn ? { checkIn, checkOut } : {}),
        },
        'travels_searchbar',
      ),
      '_blank',
      'noopener,noreferrer',
    );
  };
  return (
    <>
      <div className="search-band">
        <div className="search-inner">
          <DestinationField label="Destination" value={dest} onChange={setDest} onSubmit={search} placeholder="Where to?" />
          <DateField label="Check in" value={checkIn} min={isoDaysOut(0)} onChange={setCheckIn} onSubmit={search} />
          <DateField label="Check out" value={checkOut} min={checkIn || isoDaysOut(0)} onChange={setCheckOut} onSubmit={search} />
          <div className="search-field">
            <div className="lbl">Guests</div>
            <div className="ctl">
              <input value={guests} onChange={(e) => setGuests(e.target.value)} />
            </div>
          </div>
          <button
            className="search-btn"
            onClick={BOOKING_LIVE ? search : undefined}
            disabled={!BOOKING_LIVE}
            title={BOOKING_LIVE ? undefined : 'Hotel & flight booking launching soon'}
            style={BOOKING_LIVE ? undefined : { opacity: 0.5, cursor: 'default' }}
          >
            Search →
          </button>
        </div>
      </div>
      {/* Stays went live 2026-08-13 with the Expedia partnership, so this strip can
          no longer say "Launching Soon" — the Book Now buttons below it work. Flights
          genuinely ARE still coming (Expedia pays nothing on them and KAYAK is in
          review), so the two are called out separately rather than lumped together. */}
      <div className="providers">
        <span className="prov-chip cbl">Stays Live</span>
        <span className="partner-by">
          Powered by
          <img src="/travels/expedia-logo.svg" alt="Expedia" />
        </span>
        <span className="pl">
          Flights are still being finalized — curated by CBL, with Buckee planning the rest.
        </span>
      </div>
    </>
  );
}

function CatTabs({ tab, setTab }: { tab: TabKey; setTab: (t: TabKey) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const update = () => {
      // Sub-pixel tolerance + an explicit scrollable check so the chevrons/fades
      // never appear when the tabs already fit (e.g. desktop).
      const scrollable = el.scrollWidth > el.clientWidth + 4;
      setAtStart(!scrollable || el.scrollLeft <= 4);
      setAtEnd(!scrollable || el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, []);

  const nudge = (dir: number) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: 'smooth' });
  };

  return (
    <div className="cat-tabs" data-at-start={atStart} data-at-end={atEnd}>
      <div className="cat-tabs-track" ref={trackRef}>
        <div className="cat-tabs-inner">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={'cat-tab' + (tab === t.key ? ' active' : '')}
              onClick={() => setTab(t.key)}
            >
              <span className="ic"><t.Icon s={32} /></span>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {/* Scroll affordance: tap-to-scroll chevrons that fade out at each end.
          Auto-hidden when the tabs already fit (desktop), so they only appear
          when the row genuinely scrolls side-to-side. */}
      <button type="button" className="tabs-chev left" aria-label="Scroll categories left" tabIndex={-1} onClick={() => nudge(-1)}>‹</button>
      <button type="button" className="tabs-chev right" aria-label="Scroll categories right" tabIndex={-1} onClick={() => nudge(1)}>›</button>
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="11" height="11" viewBox="0 0 12 12">
          <path
            d="M6 1l1.5 3.2 3.5.5-2.5 2.4.6 3.4L6 9l-3.1 1.5.6-3.4L1 4.7l3.5-.5z"
            fill={i < value ? '#C99742' : 'rgba(255,255,255,.18)'}
          />
        </svg>
      ))}
    </span>
  );
}


/**
 * Real hotels near the visitor, from the same Google Places proxy that powers the
 * Eats grid and Attractions. Mirrors those pages exactly: live data when the API
 * answers, the hand-curated seed when it doesn't.
 *
 * Why this matters here: the seed is 17 hand-written Pittsburgh-area records with
 * invented prices. On a page that now takes real bookings, a visitor in Denver
 * was being shown Pittsburgh inns. Places is location-aware and national, and
 * each result still books through the same tracked Expedia link.
 *
 * Google gives a price BAND ($ to $$$$), never a nightly rate, so that is all we
 * ever display. The real number lives on Expedia's side of the click.
 */
const stayCache = new Map<string, Stay[]>();

function useLiveStays(coords: { lat: number; lng: number } | null | undefined, kw: string) {
  const [live, setLive] = useState<Stay[] | null>(null);
  useEffect(() => {
    if (!coords) { setLive(null); return; }
    const key = `${kw}@${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
    const hit = stayCache.get(key);
    if (hit) { setLive(hit); return; }
    let cancelled = false;
    fetch(`/api/places?lat=${coords.lat}&lng=${coords.lng}&type=lodging&keyword=${encodeURIComponent(kw)}&radius=20000`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        if (!d?.configured || !d.results?.length) { setLive(null); return; }
        const mapped: Stay[] = d.results
          .filter((p: { name?: string; coord?: [number, number] }) => p.name && p.coord)
          .map((p: Record<string, unknown>) => {
            const rating = Number(p.rating) || 0;
            const reviews = Number(p.reviews) || 0;
            return {
              name: String(p.name),
              loc: String(p.address || ''),
              stars: Math.max(1, Math.round(rating)),
              rating: Number(rating.toFixed(1)),
              reviews: reviews ? reviews.toLocaleString() : '—',
              price: String(p.price || ''),
              tag: 'Hotel',
              desc: reviews
                ? `Rated ${rating.toFixed(1)} by ${reviews.toLocaleString()} guests.`
                : 'Recently listed nearby.',
              img: String(p.photo || ''),
            } as Stay;
          })
          .filter((x: Stay) => x.img);
        stayCache.set(key, mapped);
        setLive(mapped.length ? mapped : null);
      })
      .catch(() => { if (!cancelled) setLive(null); });
    return () => { cancelled = true; };
  }, [coords?.lat, coords?.lng, kw]);
  return live;
}

function StayCard({ s }: { s: Stay }) {
  return (
    <article className="stay-card">
      <div className="img" style={{ backgroundImage: `url(${s.img})` }}>
        <span className="tag">{s.tag}</span>
        {s.curated && <span className="src">CBL Pick</span>}
      </div>
      <div className="body">
        <h3>{s.name}</h3>
        <div className="loc">{s.loc}</div>
        <p className="desc">{s.desc}</p>
        <div className="stars">
          <Stars value={s.stars} />
          <b>{s.rating}</b>
          <span>· {s.reviews} reviews</span>
        </div>
        <div className="price-row">
          <div>
            {/* A price BAND, not a rate. We don't have nightly pricing — Expedia
                shows the real number after the click, so claiming one here (the
                old "$295 per night · taxes incl.") was a promise we couldn't keep. */}
            <div className="price">{s.price || '—'}</div>
            <div className="per">typical price · live rates on Expedia</div>
          </div>
        </div>
        <div className="cta-row">
          <button
            className="cta"
            onClick={BOOKING_LIVE ? () => window.open(expediaStay(s.name, s.loc, `travels_stay_${s.name}`), '_blank', 'noopener,noreferrer') : undefined}
            disabled={!BOOKING_LIVE}
            title={BOOKING_LIVE ? undefined : 'Booking launching soon'}
            style={BOOKING_LIVE ? undefined : { opacity: 0.5, cursor: 'default' }}
          >
            {BOOKING_LIVE ? 'Book Now' : 'Coming Soon'}
          </button>
          <button
            className="cta ghost"
            onClick={BOOKING_LIVE ? () => window.open(expediaStay(s.name, s.loc, `travels_stay_${s.name}`), '_blank', 'noopener,noreferrer') : undefined}
            disabled={!BOOKING_LIVE}
            title={BOOKING_LIVE ? undefined : 'Coming soon'}
            style={BOOKING_LIVE ? undefined : { opacity: 0.5, cursor: 'default' }}
          >
            Details
          </button>
        </div>
      </div>
    </article>
  );
}

function TripCard({ t }: { t: Trip }) {
  const { session } = useAuth();
  return (
    <article className="trip-card">
      <div className="img" style={{ backgroundImage: `url(${t.img})` }} />
      <div className="body">
        <h3>{t.name}</h3>
        <div className="meta">
          <span className="pill dist">{t.dist}</span>
          <span className="pill">{t.time}</span>
          <span className="pill">{t.loc.split('·')[0].trim()}</span>
        </div>
        <p>{t.p}</p>
        {session ? (
          <Link className="cta" to="/meet-buckee" style={{ textDecoration: 'none' }}>Plan This Trip with Buckee →</Link>
        ) : (
          <Link className="cta" to="/login" style={{ textDecoration: 'none' }}>Plan This Trip →</Link>
        )}
      </div>
    </article>
  );
}


/**
 * Flight search — a real handoff to Expedia, replacing six invented flight rows
 * ("Delta DL 1245 · PIT→JFK · $189"). Same problem as the invented nightly rates
 * on the stay cards: a fabricated fare beside a real booking button.
 *
 * We earn NOTHING on flights (Expedia's terms, and airlines generally). The tab
 * says so outright. It's here because the affiliate cookie is 7-day and
 * cross-product: whoever books a flight to a city needs a room in it, and that
 * room pays 4% once this click has set the cookie.
 */
function FlightSearchPanel() {
  const [from, setFrom] = useState('PIT');
  const [to, setTo] = useState('');
  const [depart, setDepart] = useState(() => isoDaysOut(14));
  const [ret, setRet] = useState(() => isoDaysOut(18));
  const [oneWay, setOneWay] = useState(false);
  const [adults, setAdults] = useState(1);

  const go = () => {
    if (!from.trim() || !to.trim()) return;
    window.open(
      expediaFlightSearch(
        { from, to, departISO: depart, returnISO: oneWay ? null : ret, adults },
        'travels_flightsearch',
      ),
      '_blank',
      'noopener,noreferrer',
    );
  };
  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') go(); };

  return (
    <div className="flightsearch">
      <div className="fs-grid">
        <DestinationField label="From" value={from} onChange={setFrom} onSubmit={go} placeholder="PIT or city" />
        <DestinationField label="To" value={to} onChange={setTo} onSubmit={go} placeholder="Where to?" />
        <DateField label="Depart" value={depart} min={isoDaysOut(0)} onChange={setDepart} onSubmit={go} />
        {!oneWay && <DateField label="Return" value={ret} min={depart} onChange={setRet} onSubmit={go} />}
        <div className="search-field">
          <div className="lbl">Travelers</div>
          <div className="ctl">
            <input type="number" min={1} max={9} value={adults} onChange={(e) => setAdults(Math.max(1, Math.min(9, Number(e.target.value) || 1)))} onKeyDown={onKey} aria-label="Number of travelers" />
          </div>
        </div>
        <button className="search-btn" onClick={go} disabled={!to.trim()} title={to.trim() ? undefined : 'Add a destination'}>
          Search Flights
        </button>
      </div>
      <label className="fs-oneway">
        <input type="checkbox" checked={oneWay} onChange={(e) => setOneWay(e.target.checked)} />
        One way
      </label>

      <div className="fs-note">
        <h4>We don&rsquo;t earn a cent on these.</h4>
        <p>
          Airlines don&rsquo;t pay commission on flights, and no booking site changes that. We show
          them because you need a flight to get there, not because there&rsquo;s money in it.
          Booking your stay through us is the part that supports the site. Flights are just flights.
        </p>
      </div>
    </div>
  );
}

function AirportRideBanner() {
  return (
    <div className="airport-banner">
      <div className="ic">
        <svg width="30" height="24" viewBox="0 0 288 227.01" fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
          <path d="M65.43,90.76l-13.2,21.57c-2.58,4.17-3.66,8.95-3.11,13.68l5.26,45.23h89.57" />
          <path d="M222.56,90.76l13.2,21.57c2.58,4.17,3.66,8.95,3.11,13.68l-5.26,45.23h-89.57" />
          <path d="M64.93,91.59s3.11,4.94,14.34,4.94h66.01" />
          <path d="M223.07,91.59s-3.11,4.94-14.34,4.94h-66.01" />
        </svg>
      </div>
      <div>
        <h3>Need a ride to the airport?</h3>
        <p>
          CBL Private Drivers handle scheduled airport runs — 12+ hours in advance.
          We track your flight, build in buffer time, and you already know who's
          picking you up.
        </p>
      </div>
      <button className="cta" onClick={() => window.open(RIDER_BOOK_URL, '_blank', 'noopener,noreferrer')}>Schedule Airport Ride →</button>
    </div>
  );
}

function BuckeeBand() {
  const { session } = useAuth();
  return (
    <section className="band buckee-band">
      <div className="band-inner">
        <div className="buckee-grid">
          <div className="buckee-text">
            <div className="section-eyebrow">members only · ai trip planner</div>
            <h2>
              Buckee plans the rest <span className="it">your itinerary, dialed in</span>
            </h2>
            <p>
              Tell Buckee where you're going and what you like — he builds a
              complete itinerary: lodging, restaurant reservations, attractions,
              and CBL rides between every stop. Available to CBL members after sign-up.
            </p>
            <div className="buckee-bullets">
              <div className="buckee-bullet">
                <div className="num">1</div>
                <div>
                  <h4>Round-trip transport included</h4>
                  <p>CBL Private rides booked and scheduled between airport, hotel, and every stop on the trip.</p>
                </div>
              </div>
              <div className="buckee-bullet">
                <div className="num">2</div>
                <div>
                  <h4>Restaurant reservations + tickets</h4>
                  <p>Buckee handles OpenTable bookings, ticketed attractions and event holds in one pass.</p>
                </div>
              </div>
              <div className="buckee-bullet">
                <div className="num">3</div>
                <div>
                  <h4>One bill, one itinerary</h4>
                  <p>Everything consolidated to your CBL account. Forward the trip to anyone in your group.</p>
                </div>
              </div>
            </div>
            <div className="buckee-cta-row">
              {session ? (
                <Link className="buckee-cta" to="/meet-buckee" style={{ textDecoration: 'none' }}>Start Planning with Buckee →</Link>
              ) : (
                <Link className="buckee-cta" to="/login" style={{ textDecoration: 'none' }}>Sign Up — Start Planning →</Link>
              )}
              {session ? (
                <span className="buckee-note">buckee unlocked · ready to plan</span>
              ) : (
                <span className="buckee-note">free to join · buckee unlocked at signup</span>
              )}
            </div>
          </div>

          <div className="buckee-hero">
            <div className="glow" />
            <span className="badge">Hi, I'm Buckee!</span>
            <img className="mascot" src={BUCKEE_MASCOT} alt="Buckee, CBL's AI Concierge" />
          </div>
        </div>
      </div>
    </section>
  );
}

function DealsBand() {
  return (
    <section className="band tight deals-band">
      <div className="band-inner">
        <div className="section-eyebrow">member rates · partner specials</div>
        <h2 className="section-h2" style={{ marginBottom: 24 }}>
          Travel deals <span className="it">this week</span>
        </h2>
        <div className="deals-grid">
          {DEALS.map((d) => (
            <div key={d.title} className="deal">
              <div className="disc">
                {d.disc}
                {d.disc.length < 4 && (
                  <span style={{ fontSize: 10, fontFamily: MONO, marginLeft: 2 }}>OFF</span>
                )}
              </div>
              <div>
                <div className="partner">{d.partner}</div>
                <h4>{d.title}</h4>
                <p>{d.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Travels() {
  const [tab, setTab] = useState<TabKey>('HOTELS');
  // Same keyless IP detection Eats and Attractions use — no permission prompt.
  const { coords, city } = useVisitorLocation();

  const isLodging = tab === 'HOTELS' || tab === 'BNB' || tab === 'STR';
  // Live hotels near the visitor, curated seed as the fallback — the same shape
  // Eats and Attractions use. Was slice(0, 3) of a Pittsburgh-only seed, which
  // made sense while nothing could be booked and stopped making sense the day
  // Expedia went live (2026-08-13).
  const liveStays = useLiveStays(coords, STAY_KEYWORD[tab]);
  // TODO (Keith, 2026-08-16): sponsored CBL partner stays sort to the TOP here,
  // the same way the restaurant tiers work on Eats. When that lands, a partner
  // flag from the partner tables wins over both the live Places order and the
  // curated seed — do NOT hardcode a list. The site already promises this in
  // copy ("sponsored spots appear first"), so the ordering is a commitment.
  const stays = isLodging
    ? (liveStays && liveStays.length ? liveStays : STAYS[tab].map((x) => ({ ...x, curated: true })))
    : null;
  const usingLiveStays = isLodging && !!(liveStays && liveStays.length);

  return (
    <main className="cbl-travels">
      <style>{TRAVELS_CSS}</style>
      <Hero />
      <SearchBar />
      {/* Sits directly under the search bar, ABOVE every bookable control on the
          page — the Expedia terms require the disclosure in the same viewport as
          the links and before the click, never behind a tap. */}
      <AffiliateDisclosure />
      <CatTabs tab={tab} setTab={setTab} />

      {tab === 'FLIGHTS' && (
        <section className="band">
          <div className="band-inner">
            <AirportRideBanner />
            <div className="section-head">
              <div>
                <div className="section-eyebrow">flights · worldwide</div>
                <h2 className="section-h2">
                  Find your flight <span className="it">anywhere</span>
                </h2>
              </div>
            </div>
            <FlightSearchPanel />
          </div>
        </section>
      )}

      {stays && (
        <section className="band">
          <div className="band-inner">
            <div className="section-head">
              <div>
                <div className="section-eyebrow">
                  {tab === 'HOTELS'
                    ? 'hotels · resorts · boutique'
                    : tab === 'BNB'
                      ? 'b&bs · inns · cottages'
                      : 'whole homes · lofts · cabins'}
                </div>
                <h2 className="section-h2">
                  {TABS.find((t) => t.key === tab)!.label}
                  <span className="it">worldwide</span>
                </h2>
              </div>
              <div className="count">
                <b>{stays.length}</b> picks · prices in USD
              </div>
            </div>
            <div className="stays-grid">
              {stays.map((s) => (
                <StayCard key={s.name} s={s} />
              ))}
            </div>
          </div>
        </section>
      )}

      {tab === 'TRIPS' && (
        <section className="band">
          <div className="band-inner">
            <div className="section-head">
              <div>
                <div className="section-eyebrow">within driving distance</div>
                <h2 className="section-h2">
                  Weekend escapes <span className="it">a tank away</span>
                </h2>
              </div>
              <div className="count">
                <b>{TRIPS.length}</b> trips · from Pittsburgh
              </div>
            </div>
            <p className="section-lede">
              Half-day, day, or weekend trips within driving range. Each one
              includes a CBL Private ride option to and from — perfect for groups
              who want to leave the driving to someone else.
            </p>
            <div className="trips-grid">
              {TRIPS.map((t) => (
                <TripCard key={t.name} t={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Money-maker up front: affiliate experiences (tickets, city passes, audio
          tours) render right after the tab content — above the Buckee/Deals promo
          bands — since lodging is still Coming Soon. Complements the KAYAK flights/
          hotels; self-hides until the TP links are wired. placement="travels" tags
          its clicks separately from the Attractions page in reports. */}
      <AttractionsAffiliate placement="travels" />

      {tab === 'BUCKEE' && <BuckeeBand />}
      {tab === 'DEALS' && <DealsBand />}

      {/* Buckee + Deals also anchor the bottom of the lodging tabs */}
      {isLodging && (
        <>
          <BuckeeBand />
          <DealsBand />
        </>
      )}

      <PlatformNotice variant="marketplace" />
    </main>
  );
}
