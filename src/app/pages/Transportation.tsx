import { useState } from 'react';
import { useNavigate } from 'react-router';
import { JoinModal } from '../components/JoinModal';
import { RIDER_BOOK_URL, DRIVER_SIGNUP_URL } from '../lib/constants';

/**
 * Transportation — ported from the CBL "New Website" handoff bundle
 * (`Transportation Desktop.html`).
 *
 * Sections: Hero · Audiences (Riders / Drivers / Concierge) · Pick Your Ride
 * (booking form + provider stack + drivers row) · Affiliate Program · FAQ.
 *
 * Fonts match the Eats & Drinks header treatment per the user: Myriad Pro
 * for display headers, Playfair Display for the editorial italic accents.
 *
 * The source's CBLNav and CBLFooter are intentionally dropped — the site
 * `Layout` already provides the global nav and there's no footer yet.
 *
 * Asset note: the hero map backdrop reuses `/eats/imagery/cbl-map-backdrop.jpg`
 * already shipped with the Eats page; driver portraits come from Unsplash CDN
 * URLs (placeholder photos in the source — swap to real CBL drivers later).
 */

// ── Constants (font swaps) ──────────────────────────────────────────────────
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

// ── Data (from Transportation Desktop.html) ─────────────────────────────────
type Provider = {
  key: string;
  name: string;
  logo: string;
  cbl?: boolean;
  preferred?: boolean;
  blurb: string;
  eta: string;
  price: string;
  commission?: string;
  badges: { k: string; t: string }[];
};

const PROVIDERS: Provider[] = [
  {
    key: 'cbl',
    name: 'CBL Private',
    logo: 'CBL',
    cbl: true,
    preferred: true,
    blurb:
      "Local, verified Independent Driver. Scheduled rides only — 12hr+ advance booking. You already know who's picking you up.",
    eta: '12hr+',
    price: '$18',
    commission: '5% return discount · No surge · Scheduled only',
    badges: [
      { k: 'preferred', t: 'Preferred' },
      { k: 'av', t: 'Pre-Scheduled' },
    ],
  },
  {
    key: 'uber',
    name: 'Uber X',
    logo: 'U',
    blurb: 'On-demand pickup via Uber — a partner option coming soon for trips CBL Private does not cover.',
    eta: 'Soon',
    price: '—',
    badges: [{ k: 'pending', t: 'Coming Soon' }],
  },
  {
    key: 'lyft',
    name: 'Lyft Standard',
    logo: 'L',
    blurb: 'On-demand pickup via Lyft — a partner option coming soon for trips CBL Private does not cover.',
    eta: 'Soon',
    price: '—',
    badges: [{ k: 'pending', t: 'Coming Soon' }],
  },
  {
    key: 'waymo',
    name: 'Waymo',
    logo: 'W',
    blurb: 'Fully autonomous, no driver — an autonomous partner option coming soon.',
    eta: 'Soon',
    price: '—',
    badges: [
      { k: 'av', t: 'Autonomous' },
      { k: 'pending', t: 'Coming Soon' },
    ],
  },
  {
    key: 'cybercab',
    name: 'Tesla Cybercab',
    logo: 'T',
    blurb: 'Tesla autonomous fleet. Rolling out late 2026.',
    eta: '—',
    price: '—',
    badges: [
      { k: 'av', t: 'Autonomous' },
      { k: 'pending', t: 'Pending Launch' },
    ],
  },
];

type Audience = {
  key: string;
  num: string;
  name: string;
  blurb: string;
  price: string;
  priceLabel: string;
  bullets: string[];
  cta: string;
};

const AUDIENCES: Audience[] = [
  {
    key: 'RIDERS',
    num: '01',
    name: 'Riders',
    blurb:
      'Schedule rides with a trusted local driver you already know. Partner options (Uber, Lyft, autonomous) are coming soon.',
    price: 'FREE',
    priceLabel: 'to join',
    bullets: [
      'Upfront, consistent pricing',
      'No surge or hidden commissions',
      'Live GPS tracking + ETA updates',
      '5% off every return trip',
    ],
    cta: 'Join as a Rider',
  },
  {
    key: 'DRIVERS',
    num: '02',
    name: 'Drivers',
    blurb:
      'Build your own private rider base. Independent-contractor model — keep 100% of every fare and work only when you choose.',
    price: '$19.99',
    priceLabel: '/mo · first month free',
    bullets: [
      'Build a private rider base that is yours to keep',
      'Keep 100% of earnings · no commissions',
      'Stripe Connect instant payouts',
      'Scheduled rides only — no on-demand pressure',
    ],
    cta: 'Become an Independent Driver',
  },
  {
    key: 'CONCIERGE',
    num: '03',
    name: 'Concierge',
    blurb:
      'Hotels, hospitality teams, and local businesses help guests schedule rides AND plan complete itineraries — with commission on every booking.',
    price: '10%',
    priceLabel: 'commission · free to join',
    bullets: [
      '10% on every ride you schedule for guests',
      'Ongoing earnings from every Driver you refer',
      'Itinerary Service — rides, dining, activities',
      'Up to 10 preferred drivers (luxury + standard)',
      'Front-desk plaque + QR code welcome kit',
    ],
    cta: 'Become a Partner',
  },
];

const PARTNERS = [
  { name: 'CBL Private', sub: 'Service Fee · $0.01–$0.99', rev: '100%', revLbl: 'to driver' },
  { name: 'Uber', sub: 'Affiliate · Coming Soon', rev: 'Soon', revLbl: '' },
  { name: 'Lyft', sub: 'Affiliate · Coming Soon', rev: 'Soon', revLbl: '' },
  { name: 'Waymo', sub: 'Affiliate · Coming Soon', rev: 'Soon', revLbl: '' },
  { name: 'Tesla Cybercab', sub: 'Pending · Q4 2026', rev: 'Soon', revLbl: '' },
];

const FAQS = [
  {
    q: 'Is CityBucketList a rideshare company?',
    a: 'No. CityBucketList is a Private Membership Platform (Software as a Service) that connects subscribed members who schedule rides directly with Independent Contractors they already know. Third-party partner options (Uber, Lyft, Waymo) are coming soon for trips an independent driver can not cover.',
  },
  {
    q: 'Why offer Uber, Lyft and autonomous options?',
    a: "To give riders 100% coverage. If a CBL Private Driver isn't available at the time you need, you can still get a ride through a partner provider — without leaving the app. CBL earns a small affiliate fee on every third-party ride, which supports the platform without raising rider fares.",
  },
  {
    q: 'Does CBL take a percentage of rides?',
    a: "For CBL Private rides paid by card, a small service fee (round-up to the nearest dollar, $0.01–$0.99) supports platform operations. 100% of the driver's fare goes to them. For third-party providers, CBL earns an affiliate commission paid by the network — never by the rider.",
  },
  {
    q: 'Do drivers work for CityBucketList?',
    a: 'No. Drivers are Independent Contractors. They use our software tools (calendar, communication, payment processing, member directory) to manage their own scheduled rides.',
  },
  {
    q: 'How do payments work?',
    a: 'Riders pay by card (securely through Stripe) or in-person with their Independent Driver. Drivers receive instant payouts via Stripe Connect. Third-party rides bill through the partner provider directly.',
  },
];

// ── Scoped CSS (from Transportation Desktop.html, namespaced under .cbl-transport) ──
const TRANSPORT_CSS = `
.cbl-transport { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-transport *,.cbl-transport *::before,.cbl-transport *::after { box-sizing:border-box; }
.cbl-transport button { font-family:inherit; cursor:pointer; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

/* ── Hero ── */
.cbl-transport .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 12px;
}
.cbl-transport .hero-inner { display:grid; grid-template-columns:minmax(0,1fr); gap:0; align-items:start; max-width:1280px; margin:0 auto; }
.cbl-transport .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#fff; font-weight:700; text-transform:lowercase; margin-bottom:10px;
}
.cbl-transport .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:#C99742; animation:cbl-pulse 2.4s ease-in-out infinite;
}
.cbl-transport h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-transport h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-transport h1.hero-title .h1-main { color:#fff; white-space:nowrap; }
.cbl-transport .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:#C99742;
}
.cbl-transport .hero-subtitle .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:#C99742; text-transform:none; letter-spacing:0; font-size:.82em;
}
/* Hero icon container dimensions are intentionally matched to the
   Eats & Drinks page (.fork-knife) so the two heros end at the same Y
   position and headers/subheaders don't shift when toggling between pages. */
.cbl-transport h1.hero-title .car-icon {
  flex-shrink:0; width:240px; height:240px;
  display:flex; align-items:center; justify-content:center; opacity:.92;
}
.cbl-transport h1.hero-title .car-icon svg { width:100%; height:100%; }
@media (max-width:1100px){ .cbl-transport h1.hero-title .car-icon { width:180px; height:180px; } }
@media (max-width:720px){
  .cbl-transport h1.hero-title { display:flex; flex-wrap:nowrap; position:relative; gap:0; align-items:flex-start; font-size:clamp(30px,8vw,44px); }
  .cbl-transport h1.hero-title .title-stack { min-width:0; flex:1; }
  .cbl-transport h1.hero-title .title-stack > span:first-child { display:block; padding-right:64px; }
  .cbl-transport h1.hero-title .car-icon { display:flex; position:absolute; top:0; right:0; width:56px; height:56px; }
  .cbl-transport .hero-subtitle { flex-wrap:nowrap; white-space:nowrap; font-size:clamp(20px,5.4vw,27px); }
  .cbl-transport .eyebrow { display:block; white-space:normal; overflow-wrap:break-word; max-width:100%; font-size:11px; letter-spacing:.08em; line-height:1.4; }
  .cbl-transport .eyebrow::before { display:inline-block; vertical-align:middle; margin-right:10px; }
}
.cbl-transport .hero p.lede { margin-top:14px; max-width:620px; font-size:16px; line-height:1.45; color:#B8B8B8; }

/* ── Section frame ── */
.cbl-transport section.band { padding:36px 48px 56px; }
.cbl-transport section.band.tight { padding:28px 48px 36px; }
.cbl-transport .band-inner { max-width:1280px; margin:0 auto; }
.cbl-transport .section-eyebrow {
  font-family:${MONO}; font-size:12px; color:#C99742;
  letter-spacing:.18em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
}
.cbl-transport .section-eyebrow::before {
  content:''; width:28px; height:1px; background:#C99742;
}
.cbl-transport .section-h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(40px,4.6vw,64px); line-height:.95;
  letter-spacing:-.01em; text-transform:uppercase; margin-bottom:14px;
}
.cbl-transport .section-h2 .it {
  font-family:${ITALIC}; font-style:italic;
  color:#C99742; font-weight:600; text-transform:none;
  font-size:.6em; margin-left:8px;
}
.cbl-transport .section-lede {
  color:#B0B0B0; font-size:16px; line-height:1.6; max-width:62ch; margin-bottom:32px;
}

/* ── Drivers row (inside Pick Your Ride) ── */
.cbl-transport .drivers-row { display:grid; grid-template-columns:repeat(5,1fr); gap:16px; margin-bottom:0; }
.cbl-transport .driver-card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; padding:20px 16px 18px;
  text-align:center; transition:transform .25s, border-color .25s;
}
.cbl-transport .driver-card:hover { transform:translateY(-3px); border-color:rgba(201,151,66,.5); }
.cbl-transport .driver-card .avatar {
  width:78px; height:78px; border-radius:50%;
  border:2.5px solid #C99742; overflow:hidden;
  background:#1A1410; margin:0 auto 12px;
}
.cbl-transport .driver-card .avatar img { width:100%; height:100%; object-fit:cover; display:block; }
.cbl-transport .driver-card .d-name {
  font-family:${DISPLAY}; font-weight:900; font-size:19px;
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; margin-bottom:6px;
}
.cbl-transport .driver-card .d-role {
  font-family:${MONO}; font-size:10px; color:#C99742;
  letter-spacing:.14em; text-transform:uppercase; margin-bottom:10px;
}
.cbl-transport .driver-card .d-stats {
  display:flex; justify-content:center; gap:12px;
  font-family:${MONO}; font-size:10px; color:#888; letter-spacing:.08em;
}
.cbl-transport .driver-card .d-stats b {
  color:#fff; font-family:${DISPLAY};
  font-size:14px; font-weight:900; letter-spacing:-.01em; margin-right:4px;
}

/* ── Audience tabs ── */
.cbl-transport .audience-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
.cbl-transport .audience-card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:22px 0 22px 0; padding:26px 26px 22px;
  position:relative; overflow:hidden;
  transition:transform .35s, border-color .35s; cursor:pointer;
}
.cbl-transport .audience-card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.5); }
.cbl-transport .audience-card.active {
  background:linear-gradient(135deg, rgba(201,151,66,.16), rgba(201,151,66,.04));
  border-color:#C99742;
}
.cbl-transport .audience-card .num {
  font-family:${MONO}; font-size:11px; color:#C99742; letter-spacing:.18em;
}
.cbl-transport .audience-card h3 {
  font-family:${DISPLAY}; font-weight:900; font-size:40px;
  line-height:1; text-transform:uppercase; margin:8px 0 10px; letter-spacing:-.01em;
}
.cbl-transport .audience-card .blurb { color:#B0B0B0; font-size:14px; line-height:1.55; margin-bottom:18px; }
.cbl-transport .audience-card .price {
  font-family:${MONO}; font-size:11px; color:#C99742;
  letter-spacing:.14em; text-transform:uppercase; margin-bottom:14px;
}
.cbl-transport .audience-card .price b {
  color:#fff; font-family:${DISPLAY};
  font-size:28px; font-weight:900; letter-spacing:-.01em;
}
.cbl-transport .audience-card ul {
  list-style:none; margin:0; padding:0;
  display:flex; flex-direction:column; gap:8px; margin-bottom:20px;
}
.cbl-transport .audience-card li {
  font-size:13px; color:#C8C8C8; line-height:1.45;
  padding-left:22px; position:relative;
}
.cbl-transport .audience-card li::before {
  content:''; position:absolute; left:0; top:7px;
  width:12px; height:1.5px; background:#C99742;
}
.cbl-transport .audience-cta {
  background:#C99742; border:0; color:#000;
  padding:12px 22px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800;
  font-size:13px; letter-spacing:.12em;
  text-transform:uppercase; transition:background .2s; width:100%;
}
.cbl-transport .audience-cta:hover { background:#DDB15F; }

/* ── Ride aggregator panel ── */
.cbl-transport .agg-band {
  background:
    radial-gradient(ellipse at top right, rgba(201,151,66,.10), transparent 60%),
    #0A0A0A;
  border-top:1px solid rgba(255,255,255,.06);
  border-bottom:1px solid rgba(255,255,255,.06);
}
.cbl-transport .agg-toggle {
  display:inline-flex; padding:4px; gap:4px;
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);
  border-radius:999px; margin-bottom:28px;
}
.cbl-transport .agg-toggle button {
  background:transparent; border:0; color:#888;
  padding:10px 22px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800;
  font-size:14px; letter-spacing:.12em; text-transform:uppercase;
  transition:all .2s;
}
.cbl-transport .agg-toggle button.active { background:#C99742; color:#000; }

.cbl-transport .booking-grid { display:grid; grid-template-columns:380px 1fr; gap:24px; }
.cbl-transport .booking-form {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:22px 0 22px 0; padding:24px;
  display:flex; flex-direction:column; gap:16px; height:fit-content;
}
.cbl-transport .booking-form .label {
  font-family:${MONO}; font-size:10px;
  letter-spacing:.14em; color:#888; text-transform:uppercase; margin-bottom:6px;
}
.cbl-transport .field {
  background:#0A0A0A; border:1px solid rgba(255,255,255,.10);
  border-radius:12px; padding:12px 14px;
  display:flex; align-items:center; gap:12px;
  color:#fff; font-size:15px;
}
.cbl-transport .field svg { flex-shrink:0; opacity:.7; }
.cbl-transport .field input {
  background:transparent; border:0; outline:0; color:#fff;
  font-family:${BODY}; font-size:15px; flex:1;
}
.cbl-transport .field input::placeholder { color:#555; }
.cbl-transport .field-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

.cbl-transport .provider-list { display:flex; flex-direction:column; gap:12px; }
.cbl-transport .provider {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; padding:20px 22px;
  display:grid; grid-template-columns:64px 1fr auto auto;
  gap:22px; align-items:center;
  transition:all .25s;
  animation:cbl-reveal .5s cubic-bezier(.2,.8,.2,1) both;
  position:relative; cursor:pointer;
}
.cbl-transport .provider:hover { border-color:rgba(201,151,66,.45); transform:translateX(4px); }
.cbl-transport .provider.cbl {
  background:linear-gradient(135deg, rgba(201,151,66,.14), rgba(201,151,66,.03));
  border-color:rgba(201,151,66,.5);
}
.cbl-transport .provider .logo {
  width:64px; height:64px; border-radius:16px;
  background:#0A0A0A; border:1px solid rgba(255,255,255,.10);
  display:flex; align-items:center; justify-content:center;
  font-family:${DISPLAY}; font-weight:900;
  font-size:22px; letter-spacing:-.02em;
}
.cbl-transport .provider.cbl .logo { background:#C99742; color:#000; }
.cbl-transport .provider .meta-info { display:flex; flex-direction:column; gap:6px; min-width:0; }
.cbl-transport .provider .name {
  font-family:${DISPLAY}; font-weight:900;
  font-size:26px; line-height:1; text-transform:uppercase;
  letter-spacing:-.005em;
  display:flex; align-items:center; gap:10px; flex-wrap:wrap;
}
.cbl-transport .provider .badges { display:flex; gap:6px; flex-wrap:wrap; }
.cbl-transport .provider .badge {
  font-family:${MONO}; font-size:10px;
  padding:3px 8px; border-radius:4px; letter-spacing:.1em;
  text-transform:uppercase;
}
.cbl-transport .badge.affiliate { color:#C99742; border:1px solid rgba(201,151,66,.4); background:rgba(201,151,66,.08); }
.cbl-transport .badge.preferred { color:#fff; background:#C99742; }
.cbl-transport .badge.av { color:#8CC084; border:1px solid rgba(140,192,132,.4); background:rgba(140,192,132,.08); }
.cbl-transport .badge.pending { color:#888; border:1px solid rgba(255,255,255,.14); }
.cbl-transport .provider .blurb { color:#A8A8A8; font-size:13px; line-height:1.5; }
.cbl-transport .provider .eta-block { text-align:right; font-family:${MONO}; }
.cbl-transport .provider .eta-block .eta {
  font-family:${DISPLAY}; font-weight:900;
  font-size:28px; color:#fff; line-height:1; white-space:nowrap;
}
.cbl-transport .provider .eta-block .eta-lbl {
  font-size:10px; color:#888; letter-spacing:.14em; text-transform:uppercase; margin-top:4px;
}
.cbl-transport .provider .price-block { text-align:right; }
.cbl-transport .provider .price-block .price {
  font-family:${DISPLAY}; font-weight:900;
  font-size:32px; color:#C99742; line-height:1;
}
.cbl-transport .provider .price-block .price-lbl {
  font-family:${MONO}; font-size:10px;
  color:#888; letter-spacing:.14em; text-transform:uppercase; margin-top:4px;
}
.cbl-transport .provider .pick-btn {
  grid-column:1 / -1; margin-top:4px;
  background:transparent; border:1px solid rgba(255,255,255,.18);
  color:#fff; padding:10px 18px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800;
  font-size:12px; letter-spacing:.14em; text-transform:uppercase;
  transition:all .2s; display:none;
  align-items:center; justify-content:center; gap:8px;
}
.cbl-transport .provider.expanded .pick-btn { display:inline-flex; }
.cbl-transport .provider.cbl .pick-btn {
  background:#C99742; color:#000; border-color:#C99742; display:inline-flex;
}
.cbl-transport .provider.cbl .pick-btn:hover { background:#DDB15F; }
.cbl-transport .provider .commission-note {
  grid-column:1 / -1;
  font-family:${MONO}; font-size:10px;
  color:#C99742; letter-spacing:.12em; text-transform:uppercase;
  opacity:.7; margin-top:-2px;
}

/* ── Affiliate section ── */
.cbl-transport .affiliate-grid { display:grid; grid-template-columns:1fr 1fr; gap:32px; align-items:start; }
.cbl-transport .partner-card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; padding:20px 22px;
  display:grid; grid-template-columns:48px 1fr auto;
  gap:16px; align-items:center; margin-bottom:10px;
}
.cbl-transport .partner-card .p-logo {
  width:48px; height:48px; border-radius:12px;
  background:#0A0A0A; border:1px solid rgba(255,255,255,.10);
  display:flex; align-items:center; justify-content:center;
  font-family:${DISPLAY}; font-weight:900; font-size:16px;
}
.cbl-transport .partner-card .p-name {
  font-family:${DISPLAY}; font-weight:900;
  font-size:22px; line-height:1.1; text-transform:uppercase;
}
.cbl-transport .partner-card .p-sub {
  font-family:${MONO}; font-size:10px;
  color:#888; letter-spacing:.14em; text-transform:uppercase; margin-top:4px;
}
.cbl-transport .partner-card .p-rev {
  font-family:${DISPLAY}; font-weight:900;
  font-size:22px; color:#C99742;
}
.cbl-transport .partner-card .p-rev .small {
  font-size:11px; color:#888; font-family:${MONO};
  letter-spacing:.12em; margin-left:6px;
}

.cbl-transport .pillar-list { display:flex; flex-direction:column; gap:20px; }
.cbl-transport .pillar { display:flex; gap:18px; }
.cbl-transport .pillar .num {
  flex-shrink:0; width:44px; height:44px; border-radius:50%;
  border:1.5px solid #C99742; color:#C99742;
  font-family:${DISPLAY}; font-weight:900;
  font-size:18px; display:flex; align-items:center; justify-content:center;
}
.cbl-transport .pillar h4 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:22px; text-transform:uppercase;
  letter-spacing:-.005em; line-height:1.1; margin-bottom:6px;
}
.cbl-transport .pillar p { color:#A8A8A8; font-size:14px; line-height:1.55; }

/* ── FAQ ── */
.cbl-transport .faq-list { border-top:1px solid rgba(255,255,255,.08); }
.cbl-transport .faq { border-bottom:1px solid rgba(255,255,255,.08); padding:18px 0; }
.cbl-transport .faq summary {
  list-style:none; cursor:pointer;
  display:flex; justify-content:space-between; align-items:center; gap:20px;
}
.cbl-transport .faq summary::-webkit-details-marker { display:none; }
.cbl-transport .faq summary h4 {
  font-family:${DISPLAY}; font-weight:800;
  font-size:22px; text-transform:uppercase;
  letter-spacing:-.005em; color:#fff;
}
.cbl-transport .faq summary .ic {
  width:32px; height:32px; border-radius:50%;
  border:1px solid rgba(201,151,66,.4); color:#C99742;
  display:flex; align-items:center; justify-content:center;
  font-size:18px; transition:transform .25s;
}
.cbl-transport .faq[open] summary .ic { transform:rotate(45deg); background:#C99742; color:#000; }
.cbl-transport .faq p {
  color:#B0B0B0; font-size:14px; line-height:1.65;
  margin-top:12px; max-width:80ch;
}

/* ── Drive-with-CBL panel ── */
.cbl-transport .drive-panel {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:22px 0 22px 0; padding:36px 40px;
  display:grid; grid-template-columns:1.4fr 1fr; gap:40px; align-items:start;
}
.cbl-transport .drive-panel .big-num {
  font-family:${DISPLAY}; font-weight:900; font-size:48px; line-height:1;
}
.cbl-transport .drive-panel .big-num.gold { color:#C99742; }
.cbl-transport .drive-panel .big-lbl {
  font-family:${MONO}; font-size:11px; color:#888;
  letter-spacing:.14em; text-transform:uppercase; margin-top:4px;
}

/* ── Responsive ── */
@media (max-width:1100px){
  .cbl-transport section.band { padding:36px 24px 48px; }
  .cbl-transport .hero { padding:22px 24px 12px; }
  .cbl-transport .booking-grid { grid-template-columns:minmax(0,1fr); }
  .cbl-transport .audience-grid { grid-template-columns:1fr; }
  .cbl-transport .affiliate-grid { grid-template-columns:1fr; gap:24px; }
  .cbl-transport .provider { grid-template-columns:56px minmax(0,1fr); }
  .cbl-transport .provider > * { min-width:0; }
  .cbl-transport .field-row { grid-template-columns:1fr; }
  .cbl-transport .field input { min-width:0; }
  .cbl-transport .provider .eta-block,
  .cbl-transport .provider .price-block { grid-column:auto; text-align:left; }
  .cbl-transport .drivers-row { grid-template-columns:repeat(2,1fr); }
  .cbl-transport .drive-panel { grid-template-columns:1fr; padding:28px 24px; }
}
`;

// ── Sub-components ──────────────────────────────────────────────────────────
function CarIconInline({ size = 14, color = '#000' }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size * 0.79}
      viewBox="0 0 288 227.01"
      fill="none"
      stroke={color}
      strokeWidth="14"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M65.43,90.76l-13.2,21.57c-2.58,4.17-3.66,8.95-3.11,13.68l5.26,45.23h89.57" />
      <path d="M222.56,90.76l13.2,21.57c2.58,4.17,3.66,8.95,3.11,13.68l-5.26,45.23h-89.57" />
      <path d="M64.93,91.59s3.11,4.94,14.34,4.94h66.01" />
      <path d="M223.07,91.59s-3.11,4.94-14.34,4.94h-66.01" />
    </svg>
  );
}

function HeroCarSvg() {
  return (
    <svg
      viewBox="0 0 288 227.01"
      fill="none"
      stroke="#fff"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M65.43,90.76l-13.2,21.57c-2.58,4.17-3.66,8.95-3.11,13.68l5.26,45.23h89.57" />
      <path d="M65.43,90.76s-5.61-4.85-14.17-6.07c-8.56-1.23-14.41-.33-15.46,2.94-1.27,3.97-6.98,12.74,7.38,13.23" />
      <path d="M145.89,57.11s-49.54-.65-59.55,4.11c-8.76,4.17-18.6,24.53-20.91,29.54" />
      <path d="M110.99,134.64s-12.2-.65-28.8-1.3c-16.6-.65-13.42-11.26-13.42-11.26" />
      <path d="M110.99,152.62h69.8" />
      <path d="M64.93,91.59s3.11,4.94,14.34,4.94h66.01" />
      <path
        d="M77.35,171.24h5.29c7.19,0,13.02,5.83,13.02,13.02v4.3h-31.33v-4.3c0-7.19,5.83-13.02,13.02-13.02Z"
        transform="translate(160 359.81) rotate(180)"
      />
      <path d="M222.56,90.76l13.2,21.57c2.58,4.17,3.66,8.95,3.11,13.68l-5.26,45.23h-89.57" />
      <path d="M222.56,90.76s5.61-4.85,14.17-6.07c8.56-1.23,14.41-.33,15.46,2.94,1.27,3.97,6.98,12.74-7.38,13.23" />
      <path d="M142.11,57.11s49.54-.65,59.55,4.11c8.76,4.17,18.6,24.53,20.91,29.54" />
      <path d="M177,134.64s12.2-.65,28.8-1.3c16.6-.65,13.42-11.26,13.42-11.26" />
      <path d="M177,152.62h-69.8" />
      <path d="M223.07,91.59s-3.11,4.94-14.34,4.94h-66.01" />
      <path d="M192.33,171.24h31.33v4.3c0,7.19-5.83,13.02-13.02,13.02h-5.29c-7.19,0-13.02-5.83-13.02-13.02v-4.3h0Z" />
    </svg>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div>
          <div className="eyebrow">cbl private · scheduled rides · partners soon</div>
          <div className="hero-title-row">
            <h1 className="hero-title">
              <span className="title-stack">
                <span className="h1-main">Transportation</span>
                <span className="hero-subtitle">
                  <span>Your City.</span>
                  <span className="it">Your way.</span>
                </span>
              </span>
              <span className="car-icon" aria-hidden="true">
                <HeroCarSvg />
              </span>
            </h1>
          </div>
          <p className="lede">
            Schedule a trusted local driver you already know — booked ahead, never on-demand, never a
            stranger. Uber, Lyft and autonomous partner options are coming soon for the trips CBL does
            not cover. One membership, one place to plan every ride.
          </p>
          <div style={{ display: 'flex', gap: 14, marginTop: 28, flexWrap: 'wrap' }}>
            <button
              onClick={() => window.open(RIDER_BOOK_URL, '_blank', 'noopener,noreferrer')}
              style={{
                background: '#C99742',
                color: '#000',
                border: 0,
                borderRadius: 999,
                padding: '14px 30px',
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: '.04em',
                textTransform: 'uppercase',
                cursor: 'pointer',
              }}
            >
              Book a Private Ride →
            </button>
            <a
              href="#pick"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '14px 26px',
                borderRadius: 999,
                border: '1.5px solid rgba(255,255,255,.25)',
                color: '#fff',
                textDecoration: 'none',
                fontFamily: DISPLAY,
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: '.04em',
                textTransform: 'uppercase',
              }}
            >
              See how it works
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function AudienceCard({
  a,
  active,
  onClick,
  onCta,
}: {
  a: Audience;
  active: boolean;
  onClick: () => void;
  onCta: () => void;
}) {
  return (
    <div className={'audience-card' + (active ? ' active' : '')} onClick={onClick}>
      <div className="num">
        {a.num} · {a.name.toUpperCase()}
      </div>
      <h3>{a.name}</h3>
      <div className="blurb">{a.blurb}</div>
      <div className="price">
        <b>{a.price}</b> {a.priceLabel}
      </div>
      <ul>
        {a.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <button
        className="audience-cta"
        onClick={(e) => {
          e.stopPropagation();
          onCta();
        }}
      >
        {a.cta} →
      </button>
    </div>
  );
}

function Audiences() {
  const [active, setActive] = useState('RIDERS');
  const [joinOpen, setJoinOpen] = useState(false);
  const navigate = useNavigate();
  const ctaFor = (key: string) => {
    if (key === 'RIDERS') return () => setJoinOpen(true);
    if (key === 'DRIVERS') return () => window.open(DRIVER_SIGNUP_URL, '_blank', 'noopener,noreferrer');
    return () => navigate('/concierge#apply');
  };
  return (
    <section className="band">
      <div className="band-inner">
        <div className="section-eyebrow">three ways to join</div>
        <h2 className="section-h2">
          Riders · Drivers <span className="it">· concierge partners</span>
        </h2>
        <p className="section-lede">
          CBL is a Private Membership Platform connecting three groups: people who need rides, the
          local Independent Drivers who provide them, and the hotels, hospitality teams and
          businesses who refer guests in.
        </p>
        <div className="audience-grid">
          {AUDIENCES.map((a) => (
            <AudienceCard
              key={a.key}
              a={a}
              active={active === a.key}
              onClick={() => setActive(a.key)}
              onCta={ctaFor(a.key)}
            />
          ))}
        </div>
      </div>
      <JoinModal open={joinOpen} onClose={() => setJoinOpen(false)} source="transportation-rider" />
    </section>
  );
}

function ProviderCard({
  p,
  expanded,
  onClick,
}: {
  p: Provider;
  expanded: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={'provider' + (p.cbl ? ' cbl' : '') + (expanded ? ' expanded' : '')}
      onClick={onClick}
    >
      <div className="logo">{p.logo}</div>
      <div className="meta-info">
        <div className="name">
          {p.name}
          <div className="badges">
            {p.badges.map((b) => (
              <span key={b.t} className={'badge ' + b.k}>
                {b.t}
              </span>
            ))}
          </div>
        </div>
        <div className="blurb">{p.blurb}</div>
      </div>
      <div className="eta-block">
        <div className="eta">{p.eta}</div>
        <div className="eta-lbl">ETA</div>
      </div>
      <div className="price-block">
        <div className="price">{p.price}</div>
        <div className="price-lbl">est. fare</div>
      </div>
      {p.commission && <div className="commission-note">{p.commission}</div>}
      {p.cbl ? (
        <button
          className="pick-btn"
          onClick={(e) => {
            e.stopPropagation();
            window.open(RIDER_BOOK_URL, '_blank', 'noopener,noreferrer');
          }}
        >
          Book This Ride <CarIconInline size={14} color="#000" />
        </button>
      ) : (
        <button className="pick-btn" disabled style={{ opacity: 0.45, cursor: 'default' }}>
          Coming Soon
        </button>
      )}
    </div>
  );
}

function RideAggregator() {
  const [mode, setMode] = useState<'BOOK' | 'DRIVE'>('BOOK');
  const [selected, setSelected] = useState('cbl');

  return (
    <section className="band agg-band" id="pick">
      <div className="band-inner">
        <div className="section-eyebrow">cbl private · partners coming soon</div>
        <h2 className="section-h2">
          Pick your ride <span className="it">private or partner</span>
        </h2>
        <p className="section-lede">
          CBL Private is scheduled, by-invitation, your-own-driver — every ride is booked at least 12
          hours ahead, so you always know who is picking you up. Partner options for the trips CBL
          does not cover yet (Uber, Lyft, autonomous) are coming soon.
        </p>

        <div className="agg-toggle">
          <button className={mode === 'BOOK' ? 'active' : ''} onClick={() => setMode('BOOK')}>
            Book a Ride
          </button>
          <button className={mode === 'DRIVE' ? 'active' : ''} onClick={() => setMode('DRIVE')}>
            Drive with CBL
          </button>
        </div>

        {mode === 'BOOK' ? (
          <>
            <div className="booking-grid">
              <div className="booking-form">
                <div>
                  <div className="label">Pickup</div>
                  <div className="field">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="3" stroke="#C99742" strokeWidth="1.6" />
                    </svg>
                    <input defaultValue="The Westin · Pittsburgh" />
                  </div>
                </div>
                <div>
                  <div className="label">Drop-off</div>
                  <div className="field">
                    <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
                      <path
                        d="M7 1c3 0 5 2 5 5 0 4-5 9-5 9S2 10 2 6c0-3 2-5 5-5z"
                        stroke="#C99742"
                        strokeWidth="1.6"
                      />
                    </svg>
                    <input defaultValue="PNC Park" />
                  </div>
                </div>
                <div className="field-row">
                  <div>
                    <div className="label">Date</div>
                    <div className="field">
                      <input defaultValue="Tonight" />
                    </div>
                  </div>
                  <div>
                    <div className="label">Time</div>
                    <div className="field">
                      <input defaultValue="6:45 PM" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="label">Passengers</div>
                  <div className="field">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="5" r="3" stroke="#C99742" strokeWidth="1.6" />
                      <path d="M2 14c0-3 3-5 6-5s6 2 6 5" stroke="#C99742" strokeWidth="1.6" />
                    </svg>
                    <input defaultValue="2 passengers" />
                  </div>
                </div>
              </div>

              <div className="provider-list">
                {PROVIDERS.map((p) => (
                  <ProviderCard
                    key={p.key}
                    p={p}
                    expanded={selected === p.key}
                    onClick={() => setSelected(p.key)}
                  />
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: 40,
                paddingTop: 32,
                borderTop: '1px solid rgba(255,255,255,.08)',
              }}
            >
              <div className="section-eyebrow">cbl private · scheduled rides</div>
              <h3
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 900,
                  fontSize: 'clamp(32px, 3.4vw, 44px)',
                  lineHeight: 0.95,
                  letterSpacing: '-.01em',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                You already know{' '}
                <span
                  style={{
                    fontFamily: ITALIC,
                    fontStyle: 'italic',
                    color: '#C99742',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '.6em',
                    marginLeft: 8,
                  }}
                >
                  who's picking you up
                </span>
              </h3>
              <p
                style={{
                  color: '#B0B0B0',
                  fontSize: 15,
                  lineHeight: 1.55,
                  maxWidth: '62ch',
                  marginBottom: 24,
                }}
              >
                Every CBL Private ride is scheduled at least 12 hours in advance, so you and your
                driver have time to plan, message, and confirm the trip before pickup. No anonymous
                strangers. Sign in to the app to browse available drivers in your city.
              </p>
            </div>
          </>
        ) : (
          <div className="drive-panel">
            <div>
              <div className="section-eyebrow" style={{ marginBottom: 8 }}>
                independent contractor model
              </div>
              <h3
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 900,
                  fontSize: 44,
                  lineHeight: 0.95,
                  textTransform: 'uppercase',
                  marginBottom: 14,
                }}
              >
                Keep 100%{' '}
                <span
                  style={{
                    fontFamily: ITALIC,
                    fontStyle: 'italic',
                    color: '#C99742',
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: 28,
                  }}
                >
                  of every fare
                </span>
              </h3>
              <p
                style={{
                  color: '#B0B0B0',
                  fontSize: 15,
                  lineHeight: 1.6,
                  marginBottom: 24,
                  maxWidth: '52ch',
                }}
              >
                No commission, no surge cuts, no platform percentage. CBL is a Private Membership
                Platform — Independent Drivers use our software to build their own private rider base,
                manage their own scheduled rides, and keep every dollar earned.
              </p>
              <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
                <div>
                  <div className="big-num gold">$19.99</div>
                  <div className="big-lbl">/month · first month free</div>
                </div>
                <div>
                  <div className="big-num">100%</div>
                  <div className="big-lbl">of every fare</div>
                </div>
                <div>
                  <div className="big-num">0%</div>
                  <div className="big-lbl">commission cut</div>
                </div>
              </div>
              <button
                className="audience-cta"
                style={{ width: 'auto', padding: '14px 32px' }}
                onClick={() => window.open(DRIVER_SIGNUP_URL, '_blank', 'noopener,noreferrer')}
              >
                Start 30-Day Free Trial →
              </button>
            </div>
            <div>
              <div className="pillar-list">
                {[
                  {
                    t: 'Build your own rider base',
                    d: 'Bring your riders onto CBL and grow a private client list that stays yours — CBL is the software, the relationship is yours.',
                  },
                  {
                    t: 'Scheduled rides only',
                    d: 'No on-demand pressure. Riders book ahead — you choose what to accept.',
                  },
                  {
                    t: 'Stripe Connect payouts',
                    d: 'Instant deposit after each completed ride. No weekly waiting.',
                  },
                  {
                    t: 'Share rides, share earnings',
                    d: "Pass a ride you can't take to another verified Driver and keep a portion.",
                  },
                  {
                    t: 'Tools included',
                    d: 'Digital driver packet, QR codes, badges, communication and booking.',
                  },
                ].map((x, i) => (
                  <div className="pillar" key={x.t}>
                    <div className="num">{String(i + 1).padStart(2, '0')}</div>
                    <div>
                      <h4>{x.t}</h4>
                      <p>{x.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function AffiliateBand() {
  return (
    <section className="band" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
      <div className="band-inner">
        <div className="section-eyebrow">platform economics</div>
        <h2 className="section-h2">
          Affiliate program <span className="it">coming soon</span>
        </h2>
        <p className="section-lede">
          Here is the roadmap. CBL Private scheduled rides are live today; the partner affiliate
          options below are coming soon. Riders will never pay extra for partner routing — CBL earns
          from the network on the back end, not from you.
        </p>

        <div className="affiliate-grid">
          <div>
            {PARTNERS.map((p) => (
              <div key={p.name} className="partner-card">
                <div className="p-logo">{p.name.split(' ')[0][0]}</div>
                <div>
                  <div className="p-name">{p.name}</div>
                  <div className="p-sub">{p.sub}</div>
                </div>
                <div className="p-rev">
                  {p.rev}
                  <span className="small">{p.revLbl}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pillar-list">
            <div className="pillar">
              <div className="num">A</div>
              <div>
                <h4>CBL Private comes first</h4>
                <p>
                  Every ride request searches local Independent Drivers first. If an independent driver
                  accepts, the rider gets transparent pricing and the driver keeps 100% of the fare.
                </p>
              </div>
            </div>
            <div className="pillar">
              <div className="num">B</div>
              <div>
                <h4>Partner fallback for 100% coverage</h4>
                <p>
                  Coming soon: for trips no independent driver can cover — or when a rider prefers
                  Uber, Lyft or autonomous — the booking will hand off to that partner. CBL is not
                  signed up with the affiliate networks yet; this is on the roadmap.
                </p>
              </div>
            </div>
            <div className="pillar">
              <div className="num">C</div>
              <div>
                <h4>Free for riders, sustainable for CBL</h4>
                <p>
                  Affiliate revenue, once live, is paid by the network — not the rider. The flat
                  membership model plus a small service fee on private rides keeps the platform
                  running today.
                </p>
              </div>
            </div>
            <div className="pillar">
              <div className="num">D</div>
              <div>
                <h4>Autonomous-ready</h4>
                <p>
                  The same routing layer plugs into Waymo today and Tesla Cybercab when it launches.
                  As fleets expand, CBL participates in the upside without owning vehicles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQs() {
  return (
    <section className="band tight">
      <div className="band-inner">
        <div className="section-eyebrow">questions</div>
        <h2 className="section-h2">
          FAQ <span className="it">how the platform works</span>
        </h2>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <details className="faq" key={f.q} open={i === 0}>
              <summary>
                <h4>{f.q}</h4>
                <span className="ic">+</span>
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Transportation() {
  return (
    <main className="cbl-transport">
      <style>{TRANSPORT_CSS}</style>
      <Hero />
      <Audiences />
      <RideAggregator />
      <AffiliateBand />
      <FAQs />
    </main>
  );
}
