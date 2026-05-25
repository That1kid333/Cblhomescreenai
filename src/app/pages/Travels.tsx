import { useState } from 'react';

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
const DISPLAY = "'Myriad Pro', sans-serif";
const BODY = "'Myriad Pro', sans-serif";
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
type Flight = {
  airline: string;
  flight: string;
  from: string;
  to: string;
  dep: string;
  arr: string;
  duration: string;
  stops: string;
  price: string;
  src: string;
  tag: string;
};

const FLIGHTS: Flight[] = [
  { airline: 'Delta', flight: 'DL 1245', from: 'PIT', to: 'JFK', dep: '7:15 AM', arr: '8:48 AM', duration: '1h 33m', stops: 'Nonstop', price: '$189', src: 'Kayak', tag: 'Best Value' },
  { airline: 'United', flight: 'UA 4218', from: 'PIT', to: 'LAX', dep: '6:20 AM', arr: '11:55 AM', duration: '8h 35m', stops: '1 stop · ORD', price: '$312', src: 'Booking.com', tag: 'Cheapest' },
  { airline: 'American', flight: 'AA 887', from: 'PIT', to: 'MIA', dep: '9:40 AM', arr: '12:48 PM', duration: '3h 8m', stops: 'Nonstop', price: '$248', src: 'Kayak', tag: 'Nonstop' },
  { airline: 'JetBlue', flight: 'B6 1132', from: 'PIT', to: 'LAS', dep: '11:10 AM', arr: '2:35 PM', duration: '5h 25m', stops: 'Nonstop', price: '$278', src: 'Kayak', tag: 'Nonstop' },
  { airline: 'Southwest', flight: 'WN 2104', from: 'PIT', to: 'BNA', dep: '5:50 PM', arr: '7:25 PM', duration: '1h 35m', stops: 'Nonstop', price: '$142', src: 'Booking.com', tag: 'Quick' },
  { airline: 'Air France', flight: 'AF 8607', from: 'PIT', to: 'CDG', dep: '6:30 PM', arr: '8:55 AM+1', duration: '8h 25m', stops: 'Nonstop · via DTW', price: '$612', src: 'Kayak', tag: 'International' },
];

type Stay = {
  name: string;
  loc: string;
  stars: number;
  rating: number;
  reviews: string;
  price: string;
  src: string;
  tag: string;
  desc: string;
  img: string;
};

const STAYS: Record<'HOTELS' | 'BNB' | 'STR', Stay[]> = {
  HOTELS: [
    { name: 'The Ritz-Carlton, Key Biscayne', loc: 'Miami, FL', stars: 5, rating: 4.8, reviews: '2.4k', price: '$589', src: 'Booking.com', tag: 'Resort', desc: 'Oceanfront resort with two-mile private beach, full-service spa and three pools.', img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&h=600&fit=crop' },
    { name: 'Fairmont Banff Springs', loc: 'Banff, AB · Canada', stars: 5, rating: 4.9, reviews: '5.1k', price: '$425', src: 'Kayak', tag: 'Mountain Resort', desc: 'Historic castle in the Canadian Rockies with golf, spa and Bow Valley views.', img: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=900&h=600&fit=crop' },
    { name: 'Ace Hotel Brooklyn', loc: 'Brooklyn, NY', stars: 4, rating: 4.6, reviews: '1.8k', price: '$289', src: 'Booking.com', tag: 'Boutique', desc: 'Modernist tower in Downtown Brooklyn with rooftop pool and Stumptown coffee in the lobby.', img: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=900&h=600&fit=crop' },
    { name: 'Hotel Monaco Pittsburgh', loc: 'Pittsburgh, PA', stars: 4, rating: 4.7, reviews: '932', price: '$245', src: 'Kayak', tag: 'Boutique', desc: 'Kimpton-run boutique in the Cultural District. Walk to PNC Park and Heinz Hall.', img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&h=600&fit=crop' },
    { name: 'Hôtel Plaza Athénée', loc: 'Paris, France', stars: 5, rating: 4.9, reviews: '3.2k', price: '$1,240', src: 'Booking.com', tag: 'Luxury', desc: 'Avenue Montaigne legend with Dior spa, Alain Ducasse dining, and Eiffel Tower views.', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=900&h=600&fit=crop' },
    { name: 'The NoMad London', loc: 'Covent Garden, UK', stars: 5, rating: 4.7, reviews: '1.1k', price: '$695', src: 'Kayak', tag: 'Boutique', desc: 'Inside the former Bow Street Magistrates Court. Atrium restaurant by Daniel Humm.', img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=900&h=600&fit=crop' },
  ],
  BNB: [
    { name: 'The Inn at Negley', loc: 'Shadyside · Pittsburgh, PA', stars: 5, rating: 4.9, reviews: '184', price: '$220', src: 'Booking.com', tag: 'B&B', desc: 'Victorian mansion B&B with 8 themed rooms, garden patio, and full breakfast included.', img: 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=900&h=600&fit=crop' },
    { name: 'Mercersburg Inn', loc: 'Mercersburg, PA', stars: 4, rating: 4.7, reviews: '276', price: '$185', src: 'Kayak', tag: 'Country Inn', desc: '1909 Georgian Revival inn near the Tuscarora State Forest. Multi-course dinners on Saturdays.', img: 'https://images.unsplash.com/photo-1444201983204-c43cbd584d93?w=900&h=600&fit=crop' },
    { name: 'Sunburst Cottages', loc: 'Lake Placid, NY', stars: 4, rating: 4.8, reviews: '412', price: '$295', src: 'Booking.com', tag: 'Cottage', desc: 'Adirondack waterfront cottages with private docks, kayaks and fire pits.', img: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=900&h=600&fit=crop' },
  ],
  STR: [
    { name: 'Strip District Loft', loc: 'Pittsburgh, PA', stars: 4, rating: 4.9, reviews: '218', price: '$165', src: 'Airbnb', tag: 'Whole Loft', desc: 'Open-plan brick loft with skyline views, walking distance to PPG Paints Arena.', img: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&h=600&fit=crop' },
    { name: 'Mountain A-Frame', loc: 'Asheville, NC', stars: 5, rating: 4.9, reviews: '341', price: '$245', src: 'VRBO', tag: 'A-Frame · 2 bed', desc: 'Forest cabin with wood-burning sauna, outdoor shower, and Blue Ridge mountain views.', img: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=900&h=600&fit=crop' },
    { name: 'Hudson Valley Farmhouse', loc: 'Rhinebeck, NY', stars: 5, rating: 4.8, reviews: '527', price: '$385', src: 'Airbnb', tag: 'Farmhouse · 4 bed', desc: '1850s farmhouse on 12 acres with pool, sauna and hiking trails on-property.', img: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&h=600&fit=crop' },
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
  { disc: '15%', partner: 'Booking.com', title: 'CBL Member Rate — Hotels', body: 'Save 15% on flexible hotel bookings worldwide. Stacks with loyalty points.' },
  { disc: '$50', partner: 'Kayak', title: '$50 off Flight + Hotel bundles', body: 'Bundle round-trip flight + 3+ nights and save $50 instantly. Members only.' },
  { disc: '2x', partner: 'CBL Concierge', title: '2× points on weekday stays', body: 'Earn double CBL points on any Mon–Thu lodging booking through the platform.' },
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
.cbl-travels .hero-inner { max-width:1280px; margin:0 auto; }
.cbl-travels .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#8a8a8a; text-transform:lowercase; margin-bottom:10px;
}
.cbl-travels .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:#C99742; animation:cbl-pulse 2.4s ease-in-out infinite;
}
.cbl-travels h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
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
  .cbl-travels h1.hero-title { display:flex; flex-wrap:nowrap; position:relative; gap:0; align-items:flex-start; font-size:clamp(30px,8vw,44px); }
  .cbl-travels h1.hero-title .title-stack { min-width:0; flex:1; }
  .cbl-travels h1.hero-title .title-stack > span:first-child { display:block; padding-right:64px; }
  .cbl-travels h1.hero-title .stays-icon { display:flex; position:absolute; top:0; right:0; width:56px; height:56px; }
  .cbl-travels .hero-subtitle { flex-wrap:nowrap; white-space:nowrap; font-size:clamp(20px,5.4vw,27px); }
  .cbl-travels .eyebrow { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
  .cbl-travels .eyebrow::before { display:inline-block; vertical-align:middle; margin-right:10px; }
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
.cbl-travels .search-field { display:flex; flex-direction:column; gap:4px; }
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
  display:flex; gap:6px; padding:14px 48px 0;
  background:rgba(10,10,10,.94); backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid rgba(255,255,255,.06);
  position:sticky; top:0; z-index:20;
  overflow-x:auto; scrollbar-width:none; max-width:100%;
}
.cbl-travels .cat-tabs::-webkit-scrollbar { display:none; }
.cbl-travels .cat-tabs-inner { display:flex; gap:6px; max-width:1280px; margin:0 auto; width:100%; }
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
.cbl-travels .flight-row .price-block .src { font-family:${MONO}; font-size:9px; color:#888; letter-spacing:.12em; text-transform:uppercase; margin-top:4px; }
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
  .cbl-travels .search-inner { grid-template-columns:1fr 1fr; }
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
    <section className="hero">
      <div className="hero-inner">
        <div className="eyebrow">100% coverage · cbl curated + affiliate</div>
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
          multi-day itineraries — booked through CBL or our affiliate partners
          (Booking.com, Kayak). Members get the best rates and Buckee plans the rest.
        </p>
      </div>
    </section>
  );
}

function SearchBar() {
  return (
    <>
      <div className="search-band">
        <div className="search-inner">
          <div className="search-field">
            <div className="lbl">Destination</div>
            <div className="ctl">
              <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                <path d="M7 1c3 0 5 2 5 5 0 4-5 9-5 9S2 10 2 6c0-3 2-5 5-5z" stroke="#C99742" strokeWidth="1.6" />
              </svg>
              <input defaultValue="Pittsburgh, PA" />
            </div>
          </div>
          <div className="search-field">
            <div className="lbl">Check in</div>
            <div className="ctl"><input defaultValue="Fri May 23" /></div>
          </div>
          <div className="search-field">
            <div className="lbl">Check out</div>
            <div className="ctl"><input defaultValue="Sun May 25" /></div>
          </div>
          <div className="search-field">
            <div className="lbl">Guests</div>
            <div className="ctl"><input defaultValue="2 adults" /></div>
          </div>
          <button className="search-btn">Search →</button>
        </div>
      </div>
      <div className="providers">
        <span className="pl">searches across →</span>
        <span className="prov-chip cbl">CBL Curated</span>
        <span className="prov-chip">Booking.com</span>
        <span className="prov-chip">Kayak</span>
        <span className="prov-chip">Airbnb</span>
        <span className="prov-chip">VRBO</span>
      </div>
    </>
  );
}

function CatTabs({ tab, setTab }: { tab: TabKey; setTab: (t: TabKey) => void }) {
  return (
    <div className="cat-tabs">
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

function StayCard({ s }: { s: Stay }) {
  return (
    <article className="stay-card">
      <div className="img" style={{ backgroundImage: `url(${s.img})` }}>
        <span className="tag">{s.tag}</span>
        <span className="src">via {s.src}</span>
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
            <div className="price">{s.price}</div>
            <div className="per">per night · taxes incl.</div>
          </div>
        </div>
        <div className="cta-row">
          <button className="cta">Book Now</button>
          <button className="cta ghost">Details</button>
        </div>
      </div>
    </article>
  );
}

function TripCard({ t }: { t: Trip }) {
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
        <button className="cta">Plan This Trip →</button>
      </div>
    </article>
  );
}

function FlightRow({ f }: { f: Flight }) {
  return (
    <div className="flight-row">
      <div>
        <div className="airline">{f.airline}</div>
        <div className="flight-no">{f.flight}</div>
      </div>
      <div className="route">
        <div className="point">
          <div className="code">{f.from}</div>
          <div className="time">{f.dep}</div>
        </div>
        <div className="arrow">
          <div className="lbl">{f.duration}</div>
        </div>
        <div className="point">
          <div className="code">{f.to}</div>
          <div className="time">{f.arr}</div>
        </div>
      </div>
      <div className="stops">
        <b>{f.stops}</b>
      </div>
      <span className="f-tag">{f.tag}</span>
      <div className="price-block">
        <div className="price">{f.price}</div>
        <div className="src">via {f.src}</div>
      </div>
      <div className="actions">
        <button>Book Flight</button>
        <button className="ride">
          <RideGlyph size={12} color="#C99742" strokeWidth={14} />
          Ride to Airport
        </button>
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
      <button className="cta">Schedule Airport Ride →</button>
    </div>
  );
}

function BuckeeBand() {
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
              <button className="buckee-cta">Sign Up — Start Planning →</button>
              <span className="buckee-note">free to join · buckee unlocked at signup</span>
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

  const stays = tab === 'HOTELS' || tab === 'BNB' || tab === 'STR' ? STAYS[tab] : null;
  const isLodging = tab === 'HOTELS' || tab === 'BNB' || tab === 'STR';

  return (
    <main className="cbl-travels">
      <style>{TRAVELS_CSS}</style>
      <Hero />
      <SearchBar />
      <CatTabs tab={tab} setTab={setTab} />

      {tab === 'FLIGHTS' && (
        <section className="band">
          <div className="band-inner">
            <AirportRideBanner />
            <div className="section-head">
              <div>
                <div className="section-eyebrow">flights · worldwide</div>
                <h2 className="section-h2">
                  Outbound flights <span className="it">from Pittsburgh</span>
                </h2>
              </div>
              <div className="count">
                <b>{FLIGHTS.length}</b> results · prices in USD
              </div>
            </div>
            <div>
              {FLIGHTS.map((f) => (
                <FlightRow key={f.flight} f={f} />
              ))}
            </div>
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

      {tab === 'BUCKEE' && <BuckeeBand />}
      {tab === 'DEALS' && <DealsBand />}

      {/* Buckee + Deals also anchor the bottom of the lodging tabs */}
      {isLodging && (
        <>
          <BuckeeBand />
          <DealsBand />
        </>
      )}
    </main>
  );
}
