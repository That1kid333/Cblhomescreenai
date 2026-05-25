import { useState } from 'react';

/**
 * Attractions — ported from the CBL "New Website" handoff bundle
 * (`Attractions Desktop.html`).
 *
 * Sections: Hero · Weather strip · Sticky filter rail (categories + live
 * source chips) · Top 10 this week · Events grid (with featured spotlight)
 * · Live news strip.
 *
 * Font swaps mirror Transportation and Eats & Drinks: Myriad Pro for display
 * headers, Playfair Display for the editorial italic accents. CBLNav and
 * CBLFooter from the source are dropped — `Layout` already provides the
 * global nav.
 *
 * Backdrop assets reuse the Eats imagery (cbl-map-backdrop.jpg, hero-map-bg.jpg)
 * already in /public/eats/imagery/.
 */

const DISPLAY = "'Myriad Pro', sans-serif";
const BODY = "'Myriad Pro', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

type Category = 'ALL' | 'SPORTS' | 'MUSIC' | 'ARTS' | 'FAMILY' | 'OUTDOORS' | 'NIGHT';

type CategoryDef = {
  key: Category;
  label: string;
  Icon: (props: { s?: number }) => JSX.Element;
};

function IconAll({ s = 28 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}
function IconSports({ s = 28 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
function IconMusic({ s = 28 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 17V5l11-2v12" />
      <circle cx="6" cy="17" r="3" />
      <circle cx="17" cy="15" r="3" />
    </svg>
  );
}
function IconArts({ s = 28 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l9 6-9 6-9-6 9-6z" />
      <path d="M3 17l9 6 9-6" />
    </svg>
  );
}
function IconFamily({ s = 28 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 21c0-4 3-6 6-6s6 2 6 6" />
      <path d="M14 21c0-3 2-4 3-4s3 1 3 4" />
    </svg>
  );
}
function IconOutdoors({ s = 28 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 20l9-15 9 15" />
      <path d="M8 13l4-7 4 7" />
    </svg>
  );
}
function IconNight({ s = 28 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z" />
    </svg>
  );
}

const CATS: CategoryDef[] = [
  { key: 'ALL', label: 'This Week', Icon: IconAll },
  { key: 'SPORTS', label: 'Sports', Icon: IconSports },
  { key: 'MUSIC', label: 'Music', Icon: IconMusic },
  { key: 'ARTS', label: 'Arts', Icon: IconArts },
  { key: 'FAMILY', label: 'Family', Icon: IconFamily },
  { key: 'OUTDOORS', label: 'Outdoors', Icon: IconOutdoors },
  { key: 'NIGHT', label: 'Nightlife', Icon: IconNight },
];

const SOURCES = [
  'Post-Gazette',
  'Trib-Review',
  'WPXI',
  'KDKA',
  'Pittsburgh City Paper',
  'Visit Pittsburgh',
  'Eventbrite',
  'Ticketmaster',
];

type EventItem = {
  id: number;
  name: string;
  venue: string;
  cat: Exclude<Category, 'ALL'>;
  tag: string;
  month: string;
  day: number;
  when: string;
  price: string;
  src: string;
  img: string;
  desc: string;
  featured: boolean;
};

const EVENTS: EventItem[] = [
  {
    id: 1,
    name: 'Pirates vs. Cardinals',
    venue: 'PNC Park · North Shore',
    cat: 'SPORTS',
    tag: 'MLB · Home Game',
    month: 'MAY',
    day: 23,
    when: 'Fri 7:05 PM',
    price: 'From $18',
    src: 'MLB.com',
    img: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800&h=540&fit=crop',
    desc: 'NL Central rivalry under the lights. Fireworks after the 7th inning courtesy of the Strip District Fireworks Co.',
    featured: false,
  },
  {
    id: 2,
    name: 'Phipps Summer Flower Show',
    venue: 'Phipps Conservatory · Oakland',
    cat: 'OUTDOORS',
    tag: 'Family-Friendly',
    month: 'MAY',
    day: 22,
    when: 'Sat 9:30 AM',
    price: '$22 adult',
    src: 'Phipps.org',
    img: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=540&fit=crop',
    desc: 'The 2026 flower show opens this weekend. Tropical orchid room, butterfly garden, and three indoor courtyards in full bloom.',
    featured: false,
  },
  {
    id: 3,
    name: 'Three Rivers Arts Festival',
    venue: 'Point State Park · Downtown',
    cat: 'ARTS',
    tag: '10-Day Festival',
    month: 'MAY',
    day: 24,
    when: 'Sun – Jun 2',
    price: 'FREE',
    src: 'TrustArts.org',
    img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=900&fit=crop',
    desc: 'Free outdoor arts festival featuring 70+ visual artists, three concert stages, and food vendors along the rivers.',
    featured: true,
  },
  {
    id: 4,
    name: 'Symphony at the Strip',
    venue: 'Heinz Hall · Cultural District',
    cat: 'MUSIC',
    tag: 'Classical',
    month: 'MAY',
    day: 25,
    when: 'Mon 8:00 PM',
    price: 'From $35',
    src: 'Trib-Review',
    img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=540&fit=crop',
    desc: "Manfred Honeck conducts Mahler's Fifth. Pre-concert talk in the Mozart Room at 7 PM.",
    featured: false,
  },
  {
    id: 5,
    name: 'Carrie Furnaces Tour',
    venue: 'Rivers of Steel · Rankin',
    cat: 'ARTS',
    tag: 'Historic Site',
    month: 'MAY',
    day: 23,
    when: 'Fri 1:00 PM',
    price: '$28',
    src: 'Visit Pittsburgh',
    img: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&h=540&fit=crop',
    desc: 'Walk through the last remaining hot-metal blast furnaces of the Carnegie Steel era. National Historic Landmark.',
    featured: false,
  },
  {
    id: 6,
    name: 'Mac Miller Memorial Concert',
    venue: 'Stage AE · North Shore',
    cat: 'MUSIC',
    tag: 'Tribute Night',
    month: 'MAY',
    day: 27,
    when: 'Wed 7:30 PM',
    price: 'From $42',
    src: 'Post-Gazette',
    img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=540&fit=crop',
    desc: 'Local artists honor the late Pittsburgh native. Proceeds benefit The Mac Miller Fund for youth music programs.',
    featured: false,
  },
  {
    id: 7,
    name: 'Squirrel Hill Night Market',
    venue: 'Murray Avenue · Squirrel Hill',
    cat: 'NIGHT',
    tag: 'Pop-Up',
    month: 'MAY',
    day: 24,
    when: 'Sun 6–10 PM',
    price: 'FREE entry',
    src: 'City Paper',
    img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=540&fit=crop',
    desc: '40+ local food vendors, makers, and live music takeover. Murray Ave shuts down between Forbes and Forward.',
    featured: false,
  },
  {
    id: 8,
    name: 'Pittsburgh Zoo Family Day',
    venue: 'Pittsburgh Zoo · Highland Park',
    cat: 'FAMILY',
    tag: 'All Ages',
    month: 'MAY',
    day: 26,
    when: 'Tue 10 AM – 4 PM',
    price: '$20 adult · Kids free',
    src: 'KDKA',
    img: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&h=540&fit=crop',
    desc: 'Free kids admission with adult ticket. New rhino exhibit opens this week.',
    featured: false,
  },
  {
    id: 9,
    name: 'Riverhounds vs. Charleston',
    venue: 'Highmark Stadium · Station Square',
    cat: 'SPORTS',
    tag: 'USL Championship',
    month: 'MAY',
    day: 28,
    when: 'Thu 7:30 PM',
    price: 'From $20',
    src: 'Riverhounds.com',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=540&fit=crop',
    desc: 'USL Championship match. $5 hometown hot dogs and a fireworks show after the final whistle.',
    featured: false,
  },
  {
    id: 10,
    name: 'Zynka Gallery — Opening Reception',
    venue: 'Zynka Gallery · Bloomfield',
    cat: 'ARTS',
    tag: 'Gallery Opening',
    month: 'MAY',
    day: 23,
    when: 'Fri 6–9 PM',
    price: 'FREE',
    src: 'Zynka.gallery',
    img: 'https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=800&h=540&fit=crop',
    desc: 'New contemporary works from Ukrainian and Pittsburgh-based artists. Wine reception and artist talk at 7 PM.',
    featured: false,
  },
  {
    id: 11,
    name: 'James Gallery — Spring Salon',
    venue: 'James Gallery · West End',
    cat: 'ARTS',
    tag: 'Group Show',
    month: 'MAY',
    day: 24,
    when: 'Sat 11 AM – 5 PM',
    price: 'FREE',
    src: 'JamesGallery.net',
    img: 'https://images.unsplash.com/photo-1545987796-200677ee1011?w=800&h=540&fit=crop',
    desc: 'Annual spring salon featuring 30+ regional painters, printmakers and sculptors. Closing weekend.',
    featured: false,
  },
  {
    id: 12,
    name: 'Andy Warhol Museum — Pop Forever',
    venue: 'The Warhol · North Shore',
    cat: 'ARTS',
    tag: 'Featured Exhibit',
    month: 'MAY',
    day: 22,
    when: 'Fri 10 AM – 10 PM',
    price: '$20 adult · $10 student',
    src: 'Warhol.org',
    img: 'https://images.unsplash.com/photo-1531913764164-f85c52e6e654?w=800&h=540&fit=crop',
    desc: 'The extended Pop Forever retrospective with the Silver Clouds room, screen tests, and rare Polaroids. First-Friday DJ set tonight.',
    featured: false,
  },
  {
    id: 13,
    name: 'Mattress Factory — Site-Specific Installations',
    venue: 'Mattress Factory · Mexican War Streets',
    cat: 'ARTS',
    tag: 'Immersive',
    month: 'MAY',
    day: 25,
    when: 'Mon 11 AM – 5 PM',
    price: '$20 adult',
    src: 'MattressFactory.org',
    img: 'https://images.unsplash.com/photo-1578321709555-3f7e5c45c5e3?w=800&h=540&fit=crop',
    desc: 'Yayoi Kusama Infinity Room remains on view alongside new commissions from three international artists this season.',
    featured: false,
  },
];

type Top10Item = { rank: number; name: string; when: string; cat: Exclude<Category, 'ALL'> };

const TOP10: Top10Item[] = [
  { rank: 1, name: 'Three Rivers Arts Festival', when: 'Sat May 24 – Sun Jun 2', cat: 'ARTS' },
  { rank: 2, name: 'Pirates vs. Cardinals', when: 'Fri May 23 · 7:05 PM', cat: 'SPORTS' },
  { rank: 3, name: 'Mac Miller Memorial Concert', when: 'Wed May 27 · 7:30 PM', cat: 'MUSIC' },
  { rank: 4, name: 'Phipps Summer Flower Show', when: 'Sat May 22 · Opening', cat: 'OUTDOORS' },
  { rank: 5, name: 'Symphony at the Strip', when: 'Mon May 25 · 8:00 PM', cat: 'MUSIC' },
  { rank: 6, name: 'Squirrel Hill Night Market', when: 'Sun May 24 · 6 PM', cat: 'NIGHT' },
  { rank: 7, name: 'Riverhounds vs. Charleston', when: 'Thu May 28 · 7:30 PM', cat: 'SPORTS' },
  { rank: 8, name: 'Carrie Furnaces Tour', when: 'Fri May 23 · 1:00 PM', cat: 'ARTS' },
  { rank: 9, name: 'Pittsburgh Zoo Family Day', when: 'Tue May 26 · All Day', cat: 'FAMILY' },
  { rank: 10, name: 'Frick Park Trail Run', when: 'Sat May 22 · 8:00 AM', cat: 'OUTDOORS' },
];

const LIVE_NEWS = [
  {
    src: 'Post-Gazette',
    ts: '2 hrs ago',
    title: "Andy Warhol Museum extends 'Pop Forever' through summer",
    body: 'Free first-Friday after-hours through August. Live DJ in the Silver Clouds room.',
  },
  {
    src: 'WPXI',
    ts: '4 hrs ago',
    title: 'Bridge closure changes Riverhounds parking this weekend',
    body: 'Stadium-area routes adjust Friday–Sunday. Use the Smithfield St. Bridge for game-day access.',
  },
  {
    src: 'Visit Pittsburgh',
    ts: '6 hrs ago',
    title: 'Strip District opens new Saturday morning market',
    body: 'Penn Ave between 17th and 21st transforms into an open-air maker market every Saturday through fall.',
  },
];

const WEEK = [
  { d: 'FRI', t: 78, ic: '☀️' },
  { d: 'SAT', t: 81, ic: '⛅' },
  { d: 'SUN', t: 76, ic: '🌦' },
  { d: 'MON', t: 70, ic: '🌧' },
  { d: 'TUE', t: 74, ic: '⛅' },
  { d: 'WED', t: 79, ic: '☀️' },
];

const ATTRACTIONS_CSS = `
.cbl-attractions { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-attractions *,.cbl-attractions *::before,.cbl-attractions *::after { box-sizing:border-box; }
.cbl-attractions button { font-family:inherit; cursor:pointer; }
.cbl-attractions a { color:inherit; text-decoration:none; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

/* ── Hero ── */
.cbl-attractions .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 16px;
}
.cbl-attractions .hero-inner { display:grid; grid-template-columns:1fr; gap:0; align-items:start; max-width:1280px; margin:0 auto; }
.cbl-attractions .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#8a8a8a; text-transform:lowercase; margin-bottom:10px;
}
.cbl-attractions .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:#C99742; animation:cbl-pulse 2.4s ease-in-out infinite;
}
.cbl-attractions h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-attractions h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-attractions h1.hero-title .h1-main { color:#fff; white-space:nowrap; }
.cbl-attractions .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:#C99742;
}
.cbl-attractions .hero-subtitle .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:#C99742; text-transform:none; letter-spacing:0; font-size:.82em;
}
/* Hero icon container intentionally sized to match the Eats & Drinks /
   Transportation heros so the headers line up vertically across pages. */
.cbl-attractions h1.hero-title .attractions-icon {
  flex-shrink:0; width:240px; height:240px;
  display:flex; align-items:center; justify-content:center; opacity:.92;
}
.cbl-attractions h1.hero-title .attractions-icon svg { width:100%; height:100%; }
@media (max-width:1100px){ .cbl-attractions h1.hero-title .attractions-icon { width:180px; height:180px; } }
@media (max-width:720px){
  .cbl-attractions h1.hero-title { gap:0; font-size:clamp(38px,11vw,56px); }
  .cbl-attractions h1.hero-title .attractions-icon { display:none; }
  .cbl-attractions .hero-subtitle { font-size:clamp(24px,6.5vw,34px); }
}
.cbl-attractions .hero p.lede { margin-top:14px; max-width:620px; font-size:16px; line-height:1.45; color:#B8B8B8; }

/* ── Weather strip ── */
.cbl-attractions .weather-strip {
  background:rgba(255,255,255,.03);
  border-top:1px solid rgba(255,255,255,.06);
  border-bottom:1px solid rgba(255,255,255,.06);
}
.cbl-attractions .weather-inner {
  max-width:1280px; margin:0 auto; padding:16px 48px;
  display:flex; align-items:center; justify-content:space-between;
  gap:24px; flex-wrap:wrap;
}
.cbl-attractions .weather-left { display:flex; align-items:center; gap:16px; }
.cbl-attractions .weather-temp {
  font-family:${DISPLAY}; font-weight:900;
  font-size:48px; color:#C99742; line-height:1; letter-spacing:-.02em;
}
.cbl-attractions .weather-meta { display:flex; flex-direction:column; gap:2px; }
.cbl-attractions .weather-city {
  font-family:${DISPLAY}; font-weight:900;
  font-size:22px; text-transform:uppercase; letter-spacing:-.005em; line-height:1;
}
.cbl-attractions .weather-cond {
  font-family:${MONO}; font-size:11px; color:#888;
  letter-spacing:.12em; text-transform:uppercase;
}
.cbl-attractions .weather-hi {
  font-family:${MONO}; font-size:11px; color:#C99742;
  letter-spacing:.14em; text-transform:uppercase; margin-top:6px;
}
.cbl-attractions .weather-hi b { color:#fff; font-family:${DISPLAY};
  font-size:14px; font-weight:900; margin:0 4px; }
.cbl-attractions .weather-right { display:flex; align-items:center; gap:22px; }
.cbl-attractions .week-day { text-align:center; min-width:56px; }
.cbl-attractions .week-day .d {
  font-family:${MONO}; font-size:10px; color:#888;
  letter-spacing:.14em; text-transform:uppercase; margin-bottom:4px;
}
.cbl-attractions .week-day .t {
  font-family:${DISPLAY}; font-weight:900;
  font-size:18px; color:#fff; line-height:1;
}
.cbl-attractions .week-day .ic { font-size:18px; margin:2px 0 4px; }

/* ── Filter rail ── */
.cbl-attractions .filters {
  position:sticky; top:0; z-index:20;
  background:rgba(10,10,10,.94); backdrop-filter:blur(14px);
  -webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid rgba(255,255,255,.06);
  padding:12px 48px 0;
}
.cbl-attractions .filters-inner { max-width:1280px; margin:0 auto; }
.cbl-attractions .cat-row {
  display:flex; gap:6px; padding-bottom:12px;
  border-bottom:1px solid rgba(255,255,255,.06);
  overflow-x:auto; scrollbar-width:none;
}
.cbl-attractions .cat-row::-webkit-scrollbar { display:none; }
.cbl-attractions .cat-btn {
  flex-shrink:0;
  background:transparent; border:0; color:#888;
  padding:8px 22px 12px;
  display:flex; flex-direction:column; align-items:center; gap:8px;
  font-family:${DISPLAY}; font-weight:900;
  font-size:16px; letter-spacing:.14em; text-transform:uppercase;
  transition:color .2s;
  border-bottom:3px solid transparent; margin-bottom:-1px;
}
.cbl-attractions .cat-btn .ic {
  width:36px; height:36px; opacity:.55; transition:opacity .2s;
  display:flex; align-items:center; justify-content:center;
}
.cbl-attractions .cat-btn:hover { color:#fff; }
.cbl-attractions .cat-btn:hover .ic { opacity:.9; }
.cbl-attractions .cat-btn.active { color:#C99742; border-bottom-color:#C99742; }
.cbl-attractions .cat-btn.active .ic { opacity:1; }

.cbl-attractions .source-row {
  display:flex; gap:10px; align-items:center; padding:12px 0;
  overflow-x:auto; scrollbar-width:thin;
  scrollbar-color:rgba(201,151,66,.4) transparent;
}
.cbl-attractions .source-row::-webkit-scrollbar { height:6px; }
.cbl-attractions .source-row::-webkit-scrollbar-thumb { background:rgba(201,151,66,.35); border-radius:3px; }
.cbl-attractions .source-label {
  flex-shrink:0;
  font-family:${MONO}; font-size:10px; color:#888;
  letter-spacing:.16em; text-transform:uppercase; padding-right:4px;
}
.cbl-attractions .source-chip {
  flex-shrink:0;
  padding:6px 12px; border-radius:999px;
  background:transparent; border:1px solid rgba(255,255,255,.10);
  color:#B8B8B8; font-family:${MONO};
  font-size:11px; letter-spacing:.1em;
  text-transform:uppercase; transition:all .2s;
  display:flex; align-items:center; gap:6px;
}
.cbl-attractions .source-chip::before {
  content:''; width:6px; height:6px; border-radius:50%;
  background:#4DBF66; box-shadow:0 0 6px #4DBF66;
}
.cbl-attractions .source-chip:hover { border-color:rgba(201,151,66,.45); color:#fff; }

/* ── Section frame ── */
.cbl-attractions section.band { padding:36px 48px 56px; }
.cbl-attractions section.band.tight { padding:28px 48px 36px; }
.cbl-attractions .band-inner { max-width:1280px; margin:0 auto; }
.cbl-attractions .section-eyebrow {
  font-family:${MONO}; font-size:12px; color:#C99742;
  letter-spacing:.18em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
}
.cbl-attractions .section-eyebrow::before {
  content:''; width:28px; height:1px; background:#C99742;
}
.cbl-attractions .section-h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(40px,4.6vw,64px); line-height:.95;
  letter-spacing:-.01em; text-transform:uppercase; margin-bottom:8px;
}
.cbl-attractions .section-h2 .it {
  font-family:${ITALIC}; font-style:italic; color:#C99742;
  font-weight:600; text-transform:none; font-size:.6em; margin-left:8px;
}
.cbl-attractions .section-lede {
  color:#B0B0B0; font-size:15px; line-height:1.55; max-width:62ch; margin-bottom:24px;
}
.cbl-attractions .section-head {
  display:flex; justify-content:space-between; align-items:flex-end;
  margin-bottom:24px; gap:24px; flex-wrap:wrap;
}
.cbl-attractions .section-head .count {
  font-family:${MONO}; font-size:11px;
  letter-spacing:.14em; color:#8a8a8a; text-transform:uppercase;
}
.cbl-attractions .section-head .count b { color:#C99742; }

/* ── Top 10 band ── */
.cbl-attractions .top10-band {
  background:
    radial-gradient(ellipse at top right, rgba(201,151,66,.10), transparent 60%),
    #0A0A0A;
  border-bottom:1px solid rgba(255,255,255,.06);
}
.cbl-attractions .top10 { display:grid; grid-template-columns:repeat(2,1fr); gap:14px; }
.cbl-attractions .top10-item {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:14px 0 14px 0; padding:16px 18px;
  display:grid; grid-template-columns:44px 1fr auto;
  gap:16px; align-items:center;
  transition:transform .25s, border-color .25s;
  animation:cbl-reveal .5s cubic-bezier(.2,.8,.2,1) both;
}
.cbl-attractions .top10-item:hover { border-color:rgba(201,151,66,.45); transform:translateX(3px); }
.cbl-attractions .top10-item .rank {
  font-family:${DISPLAY}; font-weight:900;
  font-size:36px; color:#C99742; line-height:1; text-align:center; letter-spacing:-.03em;
}
.cbl-attractions .top10-item .name {
  font-family:${DISPLAY}; font-weight:900;
  font-size:18px; line-height:1.1; text-transform:uppercase;
  letter-spacing:-.005em; margin-bottom:2px;
}
.cbl-attractions .top10-item .when {
  font-family:${MONO}; font-size:10px; color:#888;
  letter-spacing:.12em; text-transform:uppercase;
}
.cbl-attractions .top10-item .cat-pill {
  font-family:${MONO}; font-size:9px;
  color:#C99742; letter-spacing:.12em; text-transform:uppercase;
  padding:4px 8px; border:1px solid rgba(201,151,66,.4);
  background:rgba(201,151,66,.08); border-radius:4px;
}

/* ── Event cards ── */
.cbl-attractions .events-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.cbl-attractions .event-card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; overflow:hidden;
  display:flex; flex-direction:column;
  transition:transform .35s, border-color .35s;
  animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both;
}
.cbl-attractions .event-card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.45); }
.cbl-attractions .event-card .img {
  aspect-ratio:5/3.4;
  background-size:cover; background-position:center;
  background-repeat:no-repeat; position:relative;
}
.cbl-attractions .event-card .img::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(10,10,10,0) 30%, rgba(10,10,10,.85));
}
.cbl-attractions .event-card .date-badge {
  position:absolute; top:14px; left:14px;
  background:rgba(0,0,0,.78); border:1px solid rgba(201,151,66,.45);
  backdrop-filter:blur(8px); border-radius:10px;
  padding:8px 12px; text-align:center; min-width:56px; z-index:2;
}
.cbl-attractions .event-card .date-badge .m {
  font-family:${MONO}; font-size:9px;
  color:#C99742; letter-spacing:.18em; text-transform:uppercase;
  line-height:1; margin-bottom:2px;
}
.cbl-attractions .event-card .date-badge .d {
  font-family:${DISPLAY}; font-weight:900;
  font-size:28px; color:#fff; line-height:1; letter-spacing:-.02em;
}
.cbl-attractions .event-card .tag-row {
  position:absolute; top:14px; right:14px;
  display:flex; gap:6px; z-index:2;
}
.cbl-attractions .event-card .tag {
  font-family:${MONO}; font-size:9px;
  letter-spacing:.14em; text-transform:uppercase; color:#C99742;
  background:rgba(0,0,0,.65); padding:5px 9px; border-radius:4px;
  border:1px solid rgba(201,151,66,.4); backdrop-filter:blur(6px);
}
.cbl-attractions .event-card .src {
  position:absolute; bottom:14px; left:14px; z-index:2;
  font-family:${MONO}; font-size:9px;
  letter-spacing:.14em; text-transform:uppercase; color:#fff;
  background:rgba(0,0,0,.6); padding:4px 8px; border-radius:4px;
  display:flex; align-items:center; gap:5px;
}
.cbl-attractions .event-card .src::before {
  content:''; width:5px; height:5px; border-radius:50%; background:#4DBF66;
}
.cbl-attractions .event-card .body { padding:18px 20px 18px; display:flex; flex-direction:column; gap:8px; flex:1; }
.cbl-attractions .event-card h3 {
  margin:0; font-family:${DISPLAY};
  font-size:26px; font-weight:900; line-height:1; letter-spacing:-.005em;
  text-transform:uppercase;
}
.cbl-attractions .event-card .venue {
  font-family:${MONO}; font-size:11px;
  color:#C99742; letter-spacing:.08em; text-transform:uppercase;
}
.cbl-attractions .event-card .desc { font-size:13px; line-height:1.5; color:#B0B0B0; }
.cbl-attractions .event-card .meta-row {
  display:flex; align-items:center; gap:10px;
  padding-top:6px; margin-top:auto; flex-wrap:wrap;
}
.cbl-attractions .event-card .when-pill {
  font-family:${MONO}; font-size:11px;
  color:#fff; letter-spacing:.06em;
  background:rgba(255,255,255,.05); padding:5px 10px; border-radius:4px;
  border:1px solid rgba(255,255,255,.10);
}
.cbl-attractions .event-card .price-pill {
  font-family:${MONO}; font-size:11px;
  color:#4DBF66; letter-spacing:.06em;
  padding:5px 10px; border-radius:4px;
  border:1px solid rgba(77,191,102,.35);
}
.cbl-attractions .event-card .cta-row { display:flex; gap:8px; margin-top:12px; }
.cbl-attractions .event-card .cta {
  flex:1; background:#C99742; border:0; color:#000;
  padding:12px 0; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800;
  font-size:12px; letter-spacing:.12em; text-transform:uppercase;
  transition:background .2s; display:flex; align-items:center;
  justify-content:center; gap:6px;
}
.cbl-attractions .event-card .cta:hover { background:#DDB15F; }
.cbl-attractions .event-card .cta.ghost {
  background:transparent; color:#fff;
  border:1px solid rgba(255,255,255,.18);
}
.cbl-attractions .event-card .cta.ghost:hover { border-color:#C99742; color:#C99742; }

/* ── Featured spotlight ── */
.cbl-attractions .spotlight {
  display:grid; grid-template-columns:1.1fr 1fr;
  background:linear-gradient(135deg, #141414, #0c0c0c);
  border:1px solid rgba(201,151,66,.25);
  border-radius:24px 0 24px 0; overflow:hidden;
  grid-column:span 3; margin-bottom:4px;
}
.cbl-attractions .spotlight .shot { min-height:320px; position:relative; }
.cbl-attractions .spotlight .shot .ph { position:absolute; inset:0; }
.cbl-attractions .spotlight .shot .date-badge {
  position:absolute; top:20px; left:20px;
  background:rgba(0,0,0,.78); border:1px solid rgba(201,151,66,.55);
  backdrop-filter:blur(8px); border-radius:12px;
  padding:10px 14px; text-align:center; min-width:64px;
}
.cbl-attractions .spotlight .shot .date-badge .m {
  font-family:${MONO}; font-size:10px;
  color:#C99742; letter-spacing:.18em; text-transform:uppercase; margin-bottom:4px;
}
.cbl-attractions .spotlight .shot .date-badge .d {
  font-family:${DISPLAY}; font-weight:900;
  font-size:36px; color:#fff; line-height:1; letter-spacing:-.02em;
}
.cbl-attractions .spotlight .text { padding:32px 38px; display:flex; flex-direction:column; gap:14px; }
.cbl-attractions .spotlight .kicker {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:11px;
  color:#C99742; letter-spacing:.18em; text-transform:uppercase;
}
.cbl-attractions .spotlight .kicker::before {
  content:''; width:22px; height:1px; background:#C99742;
}
.cbl-attractions .spotlight h3 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:48px; line-height:.95; letter-spacing:-.01em; text-transform:uppercase;
}
.cbl-attractions .spotlight h3 .it {
  font-family:${ITALIC}; font-style:italic;
  color:#C99742; font-weight:600; text-transform:none;
  font-size:.55em; display:block; margin-top:4px;
}
.cbl-attractions .spotlight p { color:#B8B8B8; font-size:15px; line-height:1.6; max-width:52ch; }
.cbl-attractions .spotlight .actions { display:flex; gap:12px; margin-top:8px; flex-wrap:wrap; }
.cbl-attractions .spotlight .actions .cta {
  background:#C99742; border:0; color:#000;
  padding:14px 24px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800;
  font-size:13px; letter-spacing:.12em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:8px;
}
.cbl-attractions .spotlight .actions .cta:hover { background:#DDB15F; }
.cbl-attractions .spotlight .actions .cta.ghost {
  background:transparent; color:#fff;
  border:1px solid rgba(255,255,255,.18);
}
.cbl-attractions .spotlight .when-pill {
  font-family:${MONO}; font-size:11px;
  color:#fff; letter-spacing:.06em;
  background:rgba(255,255,255,.05); padding:5px 10px; border-radius:4px;
  border:1px solid rgba(255,255,255,.10);
}
.cbl-attractions .spotlight .price-pill {
  font-family:${MONO}; font-size:11px;
  color:#4DBF66; letter-spacing:.06em;
  padding:5px 10px; border-radius:4px;
  border:1px solid rgba(77,191,102,.35);
}

/* ── Live news strip ── */
.cbl-attractions .live-band {
  background:linear-gradient(180deg, #0A0A0A 0%, #0F0F0F 100%);
  border-top:1px solid rgba(255,255,255,.06);
  border-bottom:1px solid rgba(255,255,255,.06);
}
.cbl-attractions .live-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }
.cbl-attractions .live-item {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:12px 0 12px 0; padding:16px 18px;
  display:flex; flex-direction:column; gap:6px;
}
.cbl-attractions .live-item .head {
  display:flex; justify-content:space-between; align-items:center;
}
.cbl-attractions .live-item .src {
  font-family:${MONO}; font-size:10px;
  color:#C99742; letter-spacing:.14em; text-transform:uppercase;
  display:flex; align-items:center; gap:6px;
}
.cbl-attractions .live-item .src::before {
  content:''; width:6px; height:6px; border-radius:50%;
  background:#4DBF66; box-shadow:0 0 6px #4DBF66;
}
.cbl-attractions .live-item .ts {
  font-family:${MONO}; font-size:10px; color:#666; letter-spacing:.12em;
}
.cbl-attractions .live-item h4 {
  font-family:${DISPLAY}; font-weight:800;
  font-size:17px; line-height:1.15; text-transform:uppercase;
  letter-spacing:-.005em; color:#fff;
}
.cbl-attractions .live-item p { font-size:12px; line-height:1.5; color:#888; }

/* ── Responsive ── */
@media (max-width:1100px){
  .cbl-attractions .hero { padding:22px 24px 12px; }
  .cbl-attractions .weather-inner { padding:16px 24px; }
  .cbl-attractions .filters { padding:12px 24px 0; }
  .cbl-attractions section.band { padding:36px 24px 44px; }
  .cbl-attractions section.band.tight { padding:24px 24px 32px; }
  .cbl-attractions .events-grid { grid-template-columns:repeat(2,1fr); }
  .cbl-attractions .spotlight { grid-template-columns:1fr; grid-column:span 2; }
  .cbl-attractions .spotlight .shot { aspect-ratio:16/9; min-height:0; }
  .cbl-attractions .top10 { grid-template-columns:1fr; }
  .cbl-attractions .live-grid { grid-template-columns:1fr; }
}
@media (max-width:720px){
  .cbl-attractions .events-grid { grid-template-columns:1fr; }
  .cbl-attractions .spotlight { grid-column:span 1; }
}
`;

function HeroAttractionsSvg() {
  return (
    <svg
      viewBox="0 0 288 227.01"
      fill="none"
      stroke="#fff"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="175.91" cy="51.34" r="16.21" />
      <circle cx="110.58" cy="82.5" r="16.21" />
      <path d="M175.91,17.05s-36.14,2.29-36.14,37.66,36.14,59.27,36.14,59.27c0,0,35.1-22.04,35.1-61.58,0-35.48-35.1-35.35-35.1-35.35Z" />
      <path d="M55.97,135.76c-1.34-6.16-1.51-9.88-1.51-16.44,0-44.47,32.42-81.37,74.91-88.35" />
      <path d="M221.73,74.85c7.51,13.1,11.81,28.29,11.81,44.48,0,8.08-1.07,15.91-3.08,23.36" />
      <path d="M153.24,153.53s23.41-25.05,29.69-24.84c8.98.3,41.25,30.53,41.25,30.53-14.05,31.07-43.87,49.64-80.18,49.64-38.46,0-71.25-24.25-83.93-58.29,0,0,33.97-36.62,42.62-36.59,5.39.02,7.83.64,24.11,16.8,16.28,16.16,63.57,61.36,63.57,61.36" />
    </svg>
  );
}

function CarMini({ size = 14, color = '#000' }: { size?: number; color?: string }) {
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

function Hero() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div>
          <div className="eyebrow">live · curated · pittsburgh, this week</div>
          <h1 className="hero-title">
            <span className="title-stack">
              <span className="h1-main">Attractions</span>
              <span className="hero-subtitle">
                <span>Your City.</span>
                <span className="it">This week.</span>
              </span>
            </span>
            <span className="attractions-icon" aria-hidden="true">
              <HeroAttractionsSvg />
            </span>
          </h1>
          <p className="lede">
            Sports, music, arts, family days, night markets — pulled live from local news outlets,
            ticketing platforms and city sources. See what's happening, then book a ride to get
            there.
          </p>
        </div>
      </div>
    </section>
  );
}

function WeatherStrip() {
  return (
    <div className="weather-strip">
      <div className="weather-inner">
        <div className="weather-left">
          <div className="weather-temp">72°</div>
          <div className="weather-meta">
            <div className="weather-city">Pittsburgh, PA</div>
            <div className="weather-cond">Sunny · Light Breeze</div>
            <div className="weather-hi">
              HI<b>78°</b>· LO<b>61°</b>
            </div>
          </div>
        </div>
        <div className="weather-right">
          {WEEK.map((w) => (
            <div key={w.d} className="week-day">
              <div className="d">{w.d}</div>
              <div className="ic">{w.ic}</div>
              <div className="t">{w.t}°</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Filters({ cat, setCat }: { cat: Category; setCat: (c: Category) => void }) {
  return (
    <div className="filters">
      <div className="filters-inner">
        <div className="cat-row">
          {CATS.map((c) => (
            <button
              key={c.key}
              className={'cat-btn' + (cat === c.key ? ' active' : '')}
              onClick={() => setCat(c.key)}
            >
              <span className="ic">
                <c.Icon s={32} />
              </span>
              {c.label}
            </button>
          ))}
        </div>
        <div className="source-row">
          <span className="source-label">live sources →</span>
          {SOURCES.map((s) => (
            <span key={s} className="source-chip">
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function Top10({ cat }: { cat: Category }) {
  const items = cat === 'ALL' ? TOP10 : TOP10.filter((t) => t.cat === cat);
  return (
    <section className="band tight top10-band">
      <div className="band-inner">
        <div className="section-head">
          <div>
            <div className="section-eyebrow">top 10 · this week</div>
            <h2 className="section-h2">
              The list <span className="it">everyone's chasing</span>
            </h2>
          </div>
          <div className="count">
            <b>{items.length}</b> picks · auto-curated
          </div>
        </div>
        <div className="top10">
          {items.map((t) => (
            <div key={t.rank} className="top10-item">
              <div className="rank">{t.rank.toString().padStart(2, '0')}</div>
              <div>
                <div className="name">{t.name}</div>
                <div className="when">{t.when}</div>
              </div>
              <span className="cat-pill">{t.cat}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function EventCard({ e }: { e: EventItem }) {
  return (
    <article className="event-card">
      <div className="img" style={{ backgroundImage: `url(${e.img})` }}>
        <div className="date-badge">
          <div className="m">{e.month}</div>
          <div className="d">{e.day}</div>
        </div>
        <div className="tag-row">
          <span className="tag">{e.tag}</span>
        </div>
        <span className="src">{e.src}</span>
      </div>
      <div className="body">
        <h3>{e.name}</h3>
        <div className="venue">{e.venue}</div>
        <p className="desc">{e.desc}</p>
        <div className="meta-row">
          <span className="when-pill">{e.when}</span>
          <span className="price-pill">{e.price}</span>
        </div>
        <div className="cta-row">
          <button className="cta">
            <CarMini size={14} color="#000" />
            Book a Ride
          </button>
          <button className="cta ghost">Tickets</button>
        </div>
      </div>
    </article>
  );
}

function Spotlight({ e }: { e: EventItem }) {
  return (
    <div className="spotlight">
      <div className="shot">
        <div
          className="ph"
          style={{
            background: `linear-gradient(180deg, rgba(10,10,10,0) 30%, rgba(10,10,10,.7)), url(${e.img}) center/cover no-repeat`,
          }}
        />
        <div className="date-badge">
          <div className="m">{e.month}</div>
          <div className="d">{e.day}</div>
        </div>
      </div>
      <div className="text">
        <div className="kicker">CBL Featured · {e.cat}</div>
        <h3>
          {e.name}
          <span className="it">{e.tag}</span>
        </h3>
        <p>{e.desc}</p>
        <div
          style={{
            display: 'flex',
            gap: 14,
            alignItems: 'center',
            marginTop: 4,
            flexWrap: 'wrap',
          }}
        >
          <span className="when-pill">{e.when}</span>
          <span className="price-pill">{e.price}</span>
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: '#888',
              letterSpacing: '.12em',
            }}
          >
            VENUE · {e.venue}
          </span>
        </div>
        <div className="actions">
          <button className="cta">
            <CarMini size={14} color="#000" />
            Book a Ride to This Event
          </button>
          <button className="cta ghost">Get Tickets</button>
        </div>
      </div>
    </div>
  );
}

function LiveNews() {
  return (
    <section className="band tight live-band">
      <div className="band-inner">
        <div className="section-eyebrow">live wire · local news</div>
        <h2 className="section-h2" style={{ marginBottom: 24 }}>
          What's happening <span className="it">right now</span>
        </h2>
        <div className="live-grid">
          {LIVE_NEWS.map((n) => (
            <div key={n.title} className="live-item">
              <div className="head">
                <span className="src">{n.src}</span>
                <span className="ts">{n.ts}</span>
              </div>
              <h4>{n.title}</h4>
              <p>{n.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Attractions() {
  const [cat, setCat] = useState<Category>('ALL');
  const filtered = cat === 'ALL' ? EVENTS : EVENTS.filter((e) => e.cat === cat);
  const featured = filtered.find((e) => e.featured) || EVENTS.find((e) => e.featured);
  const rest = filtered.filter((e) => !e.featured);
  const showFeatured = featured && filtered.includes(featured);
  const activeLabel = cat === 'ALL' ? 'Everything in motion' : CATS.find((c) => c.key === cat)?.label;

  return (
    <main className="cbl-attractions">
      <style>{ATTRACTIONS_CSS}</style>
      <Hero />
      <WeatherStrip />
      <Filters cat={cat} setCat={setCat} />

      <Top10 cat={cat} />

      <section className="band">
        <div className="band-inner">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">events · pittsburgh this week</div>
              <h2 className="section-h2">
                {activeLabel}
                <span className="it">for the week of May 22</span>
              </h2>
            </div>
            <div className="count">
              <b>{filtered.length}</b> events · auto-refreshed hourly
            </div>
          </div>

          <div className="events-grid">
            {showFeatured && featured && <Spotlight e={featured} />}
            {rest.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
        </div>
      </section>

      <LiveNews />
    </main>
  );
}
