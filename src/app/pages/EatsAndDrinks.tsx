import { useState } from 'react';
import { Link } from 'react-router';

/**
 * Eats & Drinks — ported from the CBL "New Website" design export.
 * Desktop (lg+): hero + sticky filter rail + results grid/spotlight.
 * Mobile (< lg): "The Flow" — title block, meal tabs, cuisine dropdown sheet,
 *                filtered results. Phone-frame / status-bar / bottom-tab chrome
 *                from the design doc is intentionally dropped (the site Layout
 *                already provides the header).
 *
 * Fonts kept consistent with the rest of the site: Myriad Pro for display
 * headers, Playfair Display for the editorial italic accents.
 */

const GOLD = '#C99742';
const DISPLAY = "'Myriad Pro', sans-serif";
const BODY = "'Myriad Pro', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const IMG = '/eats/imagery/';
const ICON = '/eats/food-icons/';

// ── Restaurant data (from design lib/data.jsx) ──────────────────────────────
type Restaurant = {
  id: string;
  name: string;
  sponsored?: boolean;
  rating: number;
  reviews: number;
  price: string;
  open: boolean;
  address: string;
  meal: string[];
  cuisine: string[];
  description: string;
  image: string;
};

const RESTAURANTS: Restaurant[] = [
  {
    id: 'square-cafe',
    name: 'Square Cafe',
    sponsored: true,
    rating: 5,
    reviews: 412,
    price: '$$',
    open: true,
    address: '134 S Highland Ave, Pittsburgh, PA 15206',
    meal: ['BREAKFAST', 'LUNCH'],
    cuisine: ['AMERICAN', 'COFFEE'],
    description:
      "Square Cafe is a bright, welcoming spot in Pittsburgh's East Liberty neighborhood serving fresh, seasonal dishes made with local ingredients. From creative breakfast plates to flavorful lunches, everything is made with care and a focus on quality.",
    image: IMG + 'sq-plate.jpg',
  },
  {
    id: 'italian-village',
    name: 'Italian Village Pizza',
    rating: 4,
    reviews: 308,
    price: '$',
    open: true,
    address: '4885 McKnight Road # 4, Pittsburgh',
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['PIZZA', 'ITALIAN'],
    description:
      'Neighborhood slice shop. Thick crust, generous toppings, no frills — a North Hills staple.',
    image: IMG + 'iv-pies.jpg',
  },
  {
    id: 'mad-mex',
    name: 'Mad Mex',
    rating: 4.4,
    reviews: 1611,
    price: '$$',
    open: true,
    address: '7905 McKnight Road, Pittsburgh',
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['MEXICAN', 'TACOS', 'VEGETARIAN'],
    description:
      'Pittsburgh favorite since 1993. Big burritos, Big Azz margaritas, dependable Tex-Mex energy.',
    image: IMG + 'mm-patio.jpg',
  },
  {
    id: 'subway',
    name: 'Subway',
    rating: 4.4,
    reviews: 135,
    price: '$',
    open: true,
    address: '4525 McKnight Road, Pittsburgh',
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['SANDWICHES', 'AMERICAN'],
    description:
      'Fast, customizable subs. The reliable pick when you need something quick between stops.',
    image: IMG + 'sw-sub.jpg',
  },
  {
    id: 'npl-mccandless',
    name: 'North Park Lounge McCandless',
    rating: 4.4,
    reviews: 1985,
    price: '$$',
    open: true,
    address: '9400 McKnight Road, Pittsburgh',
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['AMERICAN', 'BURGERS', 'SEAFOOD'],
    description:
      'Classic American tavern menu — burgers, seafood, full bar, and sports on every screen.',
    image: IMG + 'npl-ext.jpg',
  },
  {
    id: 'primanti',
    name: 'Primanti Bros',
    rating: 4.3,
    reviews: 3201,
    price: '$',
    open: true,
    address: '46 18th St, Pittsburgh',
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['SANDWICHES', 'AMERICAN'],
    description:
      'Iconic Pittsburgh sandwich shop. Fries and slaw piled inside every sandwich — by design.',
    image: IMG + 'pb-sand.jpg',
  },
];

// ── Icons (from design lib/cuisine-icons.jsx) ───────────────────────────────
const CUISINE_ICON_FILE: Record<string, string> = {
  TACOS: 'taco.svg',
  PIZZA: 'pizza-slice.svg',
  CHINESE: 'chinese.svg',
  VEGETARIAN: 'vegetarian.svg',
  SUSHI: 'sushi-bars.svg',
  THAI: 'thai.svg',
  AMERICAN: 'american.svg',
  SEAFOOD: 'seafood.svg',
  BURGERS: 'burgers.svg',
  ITALIAN: 'italian.svg',
  COFFEE: 'coffee-toast.svg',
  SANDWICHES: 'sandwiches.svg',
  KOREAN: 'korean.svg',
  JAPANESE: 'japanese.svg',
  VIETNAMESE: 'vietnamese.svg',
  INDIAN: 'pretzel.svg',
  MEXICAN: 'mexican.svg',
};

const MEAL_ICON_FILE: Record<string, string> = {
  BREAKFAST: 'coffee-toast.svg',
  LUNCH: 'burger-double.svg',
  DINNER: 'japanese.svg',
  DESSERT: 'cake-final.svg',
};

function FoodIcon({ file, size = 72, alt = '' }: { file: string; size?: number; alt?: string }) {
  return (
    <span
      role="img"
      aria-label={alt}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        flexShrink: 0,
        background: `url("${ICON}${file}") center/contain no-repeat`,
      }}
    />
  );
}

// Cuisine-aware corner glyph on restaurant cards (from lib/primitives.jsx)
function CardCornerGlyph({ cuisine }: { cuisine: string[] }) {
  const map: [string, string][] = [
    ['MEXICAN', 'taco.svg'],
    ['TACOS', 'taco.svg'],
    ['PIZZA', 'pizza-slice.svg'],
    ['SUSHI', 'sushi-bars.svg'],
    ['JAPANESE', 'japanese.svg'],
    ['CHINESE', 'chinese.svg'],
    ['THAI', 'thai.svg'],
    ['KOREAN', 'korean.svg'],
    ['VIETNAMESE', 'vietnamese.svg'],
    ['INDIAN', 'pretzel.svg'],
    ['ITALIAN', 'italian.svg'],
    ['BURGERS', 'burgers.svg'],
    ['SANDWICHES', 'sandwiches.svg'],
    ['VEGETARIAN', 'vegetarian.svg'],
    ['SEAFOOD', 'seafood.svg'],
    ['AMERICAN', 'american.svg'],
    ['COFFEE', 'coffee-toast.svg'],
  ];
  const tags = (cuisine || []).map((c) => c.toUpperCase());
  let file: string | null = null;
  for (const [tag, svg] of map) {
    if (tags.includes(tag)) {
      file = svg;
      break;
    }
  }
  if (!file) return null;
  return (
    <div
      style={{
        width: 28,
        height: 28,
        flexShrink: 0,
        opacity: 0.85,
        background: `url(${ICON}${file}) center/contain no-repeat`,
      }}
    />
  );
}

// Bucket rating glyph (desktop variant, from Eats & Drinks Desktop.html)
function BucketGlyph({ value = 5, size = 14 }: { value?: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          style={{ opacity: i < value ? 1 : 0.25 }}
        >
          <path
            d="M4 6h12l-1.5 10a1.5 1.5 0 0 1-1.5 1.3H7a1.5 1.5 0 0 1-1.5-1.3L4 6z"
            fill={GOLD}
            stroke={GOLD}
            strokeWidth="1"
          />
          <path d="M3 5.5h14" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </svg>
      ))}
    </span>
  );
}

// Bucket rating glyph (mobile variant, from lib/primitives.jsx)
function BucketRating({ value = 5, size = 16 }: { value?: number; size?: number }) {
  return (
    <div style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const on = i < value;
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 20 20">
            <g
              fill="none"
              stroke={on ? GOLD : 'rgba(201,151,66,0.28)'}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path
                d="M5 6h10l-1.2 10c-.1.8-.8 1.4-1.6 1.4H7.8c-.8 0-1.5-.6-1.6-1.4z"
                fill={on ? 'rgba(201,151,66,0.22)' : 'none'}
              />
              <path d="M5 6c0-1.5 2.2-2.5 5-2.5S15 4.5 15 6" />
            </g>
          </svg>
        );
      })}
    </div>
  );
}

// ── Scoped desktop CSS (from Eats & Drinks Desktop.html, namespaced) ────────
const DESKTOP_CSS = `
.cbl-eats { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-eats *,.cbl-eats *::before,.cbl-eats *::after { box-sizing:border-box; }
.cbl-eats button { font-family:inherit; cursor:pointer; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
@keyframes cblSlideDown { from{transform:translateY(-12px);opacity:0;} to{transform:translateY(0);opacity:1;} }

.cbl-eats .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${IMG}cbl-map-backdrop.jpg') center top / cover no-repeat;
  padding:22px 48px 12px;
}
.cbl-eats .hero-inner { display:grid; grid-template-columns:1fr; gap:0; align-items:start; max-width:1280px; margin:0 auto; }
.cbl-eats .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#8a8a8a; text-transform:lowercase; margin-bottom:10px;
}
.cbl-eats .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:#C99742; animation:cbl-pulse 2.4s ease-in-out infinite;
}
.cbl-eats h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-eats h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-eats h1.hero-title .eats { color:#fff; white-space:nowrap; }
.cbl-eats .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:#C99742;
}
.cbl-eats .hero-subtitle .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:#C99742; text-transform:none; letter-spacing:0; font-size:.82em;
}
.cbl-eats .hero-title-row { position:relative; display:flex; flex-direction:column; align-items:flex-start; }
/* Hero icon container dimensions are intentionally matched to the
   Transportation page (.car-icon) so the two heros end at the same Y
   position and headers/subheaders don't shift when toggling between pages. */
.cbl-eats h1.hero-title .fork-knife {
  flex-shrink:0; width:240px; height:240px;
  background:url('${ICON}eats-drinks-knife-fork.svg') center/contain no-repeat; opacity:.92;
}
@media (max-width:1100px){ .cbl-eats h1.hero-title .fork-knife { width:180px; height:180px; } }
@media (max-width:720px){ .cbl-eats h1.hero-title .fork-knife { width:120px; height:120px; } }
.cbl-eats .hero p.lede { margin-top:14px; max-width:520px; font-size:16px; line-height:1.45; color:#B8B8B8; }

.cbl-eats .filters {
  position:sticky; top:0; z-index:20;
  background:rgba(10,10,10,.93); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid rgba(255,255,255,.06); padding:8px 48px 0;
}
.cbl-eats .filters-inner { max-width:1280px; margin:0 auto; }
.cbl-eats .meal-row { display:flex; gap:6px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,.06); }
.cbl-eats .meal-btn {
  background:transparent; border:0; color:#888; padding:6px 22px 10px;
  display:flex; flex-direction:column; align-items:center; gap:6px;
  font-family:${DISPLAY}; font-weight:900; font-size:17px; letter-spacing:.14em;
  text-transform:uppercase; transition:color .2s;
  border-bottom:3px solid transparent; margin-bottom:-1px;
}
.cbl-eats .meal-btn svg { opacity:.55; transition:opacity .2s; }
.cbl-eats .meal-btn:hover { color:#fff; }
.cbl-eats .meal-btn:hover svg { opacity:.9; }
.cbl-eats .meal-btn.active { color:#C99742; border-bottom-color:#C99742; }
.cbl-eats .meal-btn.active svg { opacity:1; }
.cbl-eats .cuisine-row {
  display:flex; gap:8px; padding:12px 0; overflow-x:auto;
  scrollbar-width:thin; scrollbar-color:rgba(201,151,66,.4) transparent;
}
.cbl-eats .cuisine-row::-webkit-scrollbar { height:6px; }
.cbl-eats .cuisine-row::-webkit-scrollbar-thumb { background:rgba(201,151,66,.35); border-radius:3px; }
.cbl-eats .cuisine-chip {
  flex-shrink:0; display:flex; align-items:center; gap:10px; padding:10px 16px;
  border-radius:999px; background:transparent; border:1px solid rgba(255,255,255,.10);
  color:#C99742; font-family:${DISPLAY}; font-weight:800; font-size:13px;
  letter-spacing:.12em; text-transform:uppercase; transition:all .2s;
}
.cbl-eats .cuisine-chip:hover { border-color:rgba(201,151,66,.45); color:#fff; transform:translateY(-1px); }
.cbl-eats .cuisine-chip.active { background:rgba(201,151,66,.15); border-color:#C99742; color:#fff; }
.cbl-eats .cuisine-chip.all { padding:10px 20px; }

.cbl-eats .results { max-width:1280px; margin:0 auto; padding:28px 48px 64px; }
.cbl-eats .results-head { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:18px; gap:24px; }
.cbl-eats .results-head h2 {
  font-family:${DISPLAY}; font-weight:900; font-size:52px; line-height:1;
  letter-spacing:-.01em; text-transform:uppercase;
}
.cbl-eats .results-head h2 .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600; color:#C99742;
  text-transform:none; font-size:.7em; margin-left:8px;
}
.cbl-eats .results-head .count {
  font-family:${MONO}; font-size:12px; letter-spacing:.14em; color:#8a8a8a; text-transform:uppercase;
}
.cbl-eats .results-head .count b { color:#C99742; }

.cbl-eats .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.cbl-eats .grid .sponsored-card { grid-column:span 3; }
.cbl-eats .card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; overflow:hidden; display:flex; flex-direction:column;
  transition:transform .35s, border-color .35s; animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both;
}
.cbl-eats .card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.4); }
.cbl-eats .card .img { aspect-ratio:5/3.4; background-size:cover; background-position:center; background-repeat:no-repeat; position:relative; }
.cbl-eats .card .img::after {
  content:''; position:absolute; inset:0;
  background:linear-gradient(180deg, rgba(10,10,10,0) 40%, rgba(10,10,10,.55));
}
.cbl-eats .card .tags { position:absolute; top:14px; left:14px; display:flex; gap:6px; z-index:1; }
.cbl-eats .card .tag {
  font-family:${MONO}; font-size:10px; letter-spacing:.14em; text-transform:uppercase;
  color:#C99742; background:rgba(0,0,0,.6); padding:5px 10px;
  border:1px solid rgba(201,151,66,.4); backdrop-filter:blur(6px);
}
.cbl-eats .card .body { padding:22px 22px 20px; display:flex; flex-direction:column; gap:10px; flex:1; }
.cbl-eats .card h3 {
  margin:0; font-family:${DISPLAY}; font-size:28px; font-weight:800; line-height:1;
  letter-spacing:-.005em; text-transform:uppercase;
}
.cbl-eats .card .address { font-family:${MONO}; font-size:11px; color:#C99742; letter-spacing:.08em; text-transform:uppercase; }
.cbl-eats .card .desc { font-size:14px; line-height:1.55; color:#B0B0B0; }
.cbl-eats .card .meta { display:flex; align-items:center; gap:12px; padding-top:4px; margin-top:auto; }
.cbl-eats .card .rating { display:flex; align-items:center; gap:6px; font-size:13px; }
.cbl-eats .card .rating b { color:#fff; font-weight:700; }
.cbl-eats .card .rating span.r { color:#888; font-size:12px; }
.cbl-eats .card .dot { width:3px; height:3px; border-radius:50%; background:#444; }
.cbl-eats .card .price { color:#C99742; font-weight:700; font-size:13px; }
.cbl-eats .card .open {
  font-family:${MONO}; font-size:10px; color:#8CC084;
  border:1px solid rgba(140,192,132,.35); padding:3px 8px; letter-spacing:.1em; text-transform:uppercase;
}
.cbl-eats .card .cta-row { display:flex; gap:10px; margin-top:14px; }
.cbl-eats .card .cta {
  flex:1; background:#C99742; border:0; color:#fff; padding:12px 0; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800; font-size:13px; letter-spacing:.12em;
  text-transform:uppercase; transition:background .2s;
}
.cbl-eats .card .cta:hover { background:#B0831A; }
.cbl-eats .card .cta.ghost { background:transparent; color:#fff; border:1px solid rgba(255,255,255,.18); }
.cbl-eats .card .cta.ghost:hover { border-color:#C99742; color:#C99742; background:transparent; }

.cbl-eats .spotlight {
  display:grid; grid-template-columns:1.1fr 1fr;
  background:linear-gradient(135deg,#141414,#0c0c0c);
  border:1px solid rgba(201,151,66,.25); border-radius:24px 0 24px 0; overflow:hidden;
}
.cbl-eats .spotlight .shot { min-height:280px; background-size:cover; background-position:center; background-repeat:no-repeat; }
.cbl-eats .spotlight .text { padding:28px 36px; display:flex; flex-direction:column; gap:14px; }
.cbl-eats .spotlight .kicker {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:11px; color:#C99742; letter-spacing:.18em; text-transform:uppercase;
}
.cbl-eats .spotlight .kicker::before { content:''; width:22px; height:1px; background:#C99742; }
.cbl-eats .spotlight h3 {
  font-family:${DISPLAY}; font-weight:900; font-size:56px; line-height:.95;
  letter-spacing:-.01em; text-transform:uppercase;
}
.cbl-eats .spotlight h3 .it {
  font-family:${ITALIC}; font-style:italic; color:#C99742; font-weight:600;
  text-transform:none; font-size:.55em; display:block; margin-top:4px;
}
.cbl-eats .spotlight p { color:#B8B8B8; font-size:15px; line-height:1.65; max-width:52ch; }
.cbl-eats .spotlight .row { display:flex; align-items:center; gap:18px; margin-top:4px; flex-wrap:wrap; }
.cbl-eats .spotlight .row .addr { color:#888; font-size:13px; }
.cbl-eats .spotlight .actions { display:flex; gap:12px; margin-top:8px; flex-wrap:wrap; }

.cbl-eats .empty {
  grid-column:span 3; padding:72px 24px; text-align:center;
  border:1px dashed rgba(255,255,255,.14); border-radius:18px 0 18px 0;
}
.cbl-eats .empty h4 {
  font-family:${DISPLAY}; font-weight:900; font-size:32px; text-transform:uppercase;
  letter-spacing:-.01em; margin-bottom:6px;
}
.cbl-eats .empty h4 .it { font-family:${ITALIC}; font-style:italic; color:#C99742; font-weight:600; text-transform:none; }
.cbl-eats .empty p { color:#888; font-size:14px; }

@media (max-width:1100px){
  .cbl-eats .grid { grid-template-columns:repeat(2,1fr); }
  .cbl-eats .grid .sponsored-card { grid-column:span 2; }
  .cbl-eats .spotlight { grid-template-columns:1fr; }
  .cbl-eats .spotlight .shot { aspect-ratio:16/9; min-height:0; }
  .cbl-eats .empty { grid-column:span 2; }
  .cbl-eats .results-head h2 { font-size:40px; }
}

/* Desktop layout shows at lg+, mobile flow below */
.cbl-eats-desktop { display:none; }
.cbl-eats-mobile { display:block; }
@media (min-width:1024px){
  .cbl-eats-desktop { display:block; }
  .cbl-eats-mobile { display:none; }
}
`;

const DESKTOP_MEALS = ['ALL', 'BREAKFAST', 'LUNCH', 'DINNER', 'DESSERT'];
const DESKTOP_CUISINES = [
  'ALL', 'TACOS', 'PIZZA', 'CHINESE', 'VEGETARIAN',
  'SUSHI', 'THAI', 'AMERICAN', 'SEAFOOD',
  'BURGERS', 'ITALIAN', 'COFFEE', 'SANDWICHES',
  'KOREAN', 'JAPANESE', 'VIETNAMESE', 'INDIAN', 'MEXICAN',
];
const MOBILE_MEALS = ['BREAKFAST', 'LUNCH', 'DINNER', 'DESSERT'];
const MOBILE_CUISINES = [
  'TACOS', 'PIZZA', 'CHINESE', 'VEGETARIAN',
  'SUSHI', 'THAI', 'AMERICAN', 'SEAFOOD',
  'BURGERS', 'ITALIAN', 'COFFEE', 'SANDWICHES',
  'KOREAN', 'JAPANESE', 'VIETNAMESE', 'INDIAN', 'MEXICAN',
];

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

// ── Desktop pieces ──────────────────────────────────────────────────────────
function RestaurantCard({ r }: { r: Restaurant }) {
  return (
    <article className="card">
      <div className="img" style={{ backgroundImage: `url(${r.image})` }}>
        <div className="tags">
          {r.cuisine.slice(0, 2).map((c) => (
            <span key={c} className="tag">
              {c}
            </span>
          ))}
        </div>
      </div>
      <div className="body">
        <h3>{r.name}</h3>
        <div className="address">{r.address}</div>
        <p className="desc">{r.description}</p>
        <div className="meta">
          <div className="rating">
            <BucketGlyph value={Math.round(r.rating)} />
            <b>{r.rating.toFixed(1)}</b>
            <span className="r">({r.reviews.toLocaleString()})</span>
          </div>
          <span className="dot" />
          <span className="price">{r.price}</span>
          <span className="dot" />
          <span className="open">Open Now</span>
        </div>
        <div className="cta-row">
          <button className="cta">More Info</button>
          <button className="cta ghost">View on Map</button>
        </div>
      </div>
    </article>
  );
}

function Spotlight({ r }: { r: Restaurant }) {
  return (
    <div className="card sponsored-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="spotlight" style={{ border: 0, borderRadius: 0 }}>
        <div className="shot" style={{ backgroundImage: `url(${r.image})` }} />
        <div className="text">
          <div className="kicker">CBL Sponsored · East Liberty pick</div>
          <h3>
            {r.name}
            <span className="it">a local morning room</span>
          </h3>
          <p>{r.description}</p>
          <div className="row">
            <BucketGlyph value={5} size={18} />
            <span style={{ color: '#fff', fontWeight: 700 }}>{r.rating.toFixed(1)}</span>
            <span className="addr">· {r.reviews.toLocaleString()} reviews</span>
            <span className="dot" />
            <span className="addr">{r.address}</span>
          </div>
          <div className="actions">
            <button className="cta" style={{ padding: '14px 28px', flex: '0 0 auto' }}>
              Reserve a Table
            </button>
            <button className="cta ghost" style={{ padding: '14px 28px', flex: '0 0 auto' }}>
              View Menu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopEats({
  meal,
  setMeal,
  cuisine,
  setCuisine,
}: {
  meal: string;
  setMeal: (m: string) => void;
  cuisine: string;
  setCuisine: (c: string) => void;
}) {
  const filtered = RESTAURANTS.filter(
    (r) =>
      (meal === 'ALL' || r.meal.includes(meal)) &&
      (cuisine === 'ALL' || r.cuisine.includes(cuisine)),
  );
  const featured = filtered.find((r) => r.sponsored) || RESTAURANTS.find((r) => r.sponsored);
  const featuredShown = !!featured && filtered.some((r) => r.id === featured.id);
  const rest = filtered.filter((r) => !r.sponsored);

  return (
    <div className="cbl-eats-desktop">
      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div>
            <div className="eyebrow">what&rsquo;s on your list tonight?</div>
            <div className="hero-title-row">
              <h1 className="hero-title">
                <span className="title-stack">
                  <span className="eats">Eats &amp; Drinks</span>
                  <span className="hero-subtitle">
                    <span>Restaurants</span>
                    <span className="it">picked by Pittsburgh</span>
                  </span>
                </span>
                <span className="fork-knife" aria-hidden="true" />
              </h1>
            </div>
            <p className="lede">
              Real picks from the drivers, bartenders and regulars who live here. No sponsored
              lists, no recycled top-tens — just the rooms, plates and bar stools our team keeps
              coming back to.
            </p>
          </div>
        </div>
      </section>

      {/* FILTERS */}
      <div className="filters">
        <div className="filters-inner">
          <div className="meal-row">
            {DESKTOP_MEALS.map((m) => (
              <button
                key={m}
                className={'meal-btn' + (meal === m ? ' active' : '')}
                onClick={() => setMeal(m)}
              >
                <span
                  style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {m === 'ALL' ? (
                    <span
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        border: '1.6px solid currentColor',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      ◷
                    </span>
                  ) : (
                    <FoodIcon file={MEAL_ICON_FILE[m]} size={56} alt={m} />
                  )}
                </span>
                {m === 'ALL' ? 'All Day' : m}
              </button>
            ))}
          </div>
          <div className="cuisine-row">
            {DESKTOP_CUISINES.map((c) => {
              const active = cuisine === c;
              return (
                <button
                  key={c}
                  className={
                    'cuisine-chip' + (active ? ' active' : '') + (c === 'ALL' ? ' all' : '')
                  }
                  onClick={() => setCuisine(c)}
                >
                  {c !== 'ALL' && CUISINE_ICON_FILE[c] && (
                    <span
                      style={{
                        transform: 'scale(.6)',
                        margin: '-6px -8px -6px -4px',
                        display: 'inline-flex',
                      }}
                    >
                      <FoodIcon file={CUISINE_ICON_FILE[c]} size={26} alt={c} />
                    </span>
                  )}
                  {c === 'VIETNAMESE' ? 'Vietnam' : titleCase(c)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RESULTS */}
      <section className="results">
        <div className="results-head">
          <h2>
            {cuisine === 'ALL' ? 'All restaurants' : titleCase(cuisine)}
            <span className="it">for {meal === 'ALL' ? 'any time' : meal.toLowerCase()}</span>
          </h2>
          <div className="count">
            <b>{filtered.length}</b> places · Pittsburgh
          </div>
        </div>

        <div className="grid">
          {featuredShown && featured && <Spotlight r={featured} />}
          {rest.length > 0 ? (
            rest.map((r) => <RestaurantCard key={r.id} r={r} />)
          ) : !featuredShown ? (
            <div className="empty">
              <h4>
                No {cuisine === 'ALL' ? '' : cuisine.toLowerCase() + ' '}spots{' '}
                <span className="it">for {meal === 'ALL' ? 'any time' : meal.toLowerCase()}</span>
              </h4>
              <p>Our Pittsburgh team is curating picks. Try another cuisine or meal time.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

// ── Mobile "The Flow" pieces (from lib/cards.jsx + lib/screens.jsx) ─────────
function EatsTitleBlock() {
  return (
    <div
      style={{
        position: 'relative',
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: `url(${IMG}cbl-map-backdrop.jpg) center/cover no-repeat`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,.4), rgba(0,0,0,.85))',
        }}
      />
      <img
        src="/eats/mascot/buckee-with-burger.png"
        alt="Buckee"
        style={{
          position: 'relative',
          width: 'clamp(96px,30vw,150px)',
          height: 'auto',
          objectFit: 'contain',
          flexShrink: 0,
          display: 'block',
        }}
      />
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 900,
            fontSize: 'clamp(34px,11vw,50px)',
            lineHeight: 0.85,
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '-.02em',
          }}
        >
          EATS &amp;
          <br />
          DRINKS
        </div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 900,
            fontSize: 'clamp(22px,7vw,32px)',
            lineHeight: 1,
            color: GOLD,
            textTransform: 'uppercase',
            letterSpacing: '-.01em',
          }}
        >
          RESTAURANTS
        </div>
      </div>
      <img
        src={`${ICON}eats-drinks-knife-fork.svg`}
        alt="Fork and knife"
        style={{
          position: 'relative',
          width: 'clamp(56px,18vw,100px)',
          height: 'auto',
          objectFit: 'contain',
          flexShrink: 0,
          display: 'block',
          marginLeft: 4,
        }}
      />
    </div>
  );
}

function MealTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 0,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '6px 4px 0',
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: active
            ? 'radial-gradient(circle, rgba(201,151,66,.28) 0%, rgba(201,151,66,0) 70%)'
            : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background .2s',
        }}
      >
        <div style={{ filter: active ? 'brightness(1.1)' : 'none' }}>
          <FoodIcon file={MEAL_ICON_FILE[label]} size={50} alt={label} />
        </div>
      </div>
      <span
        style={{
          fontFamily: BODY,
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          color: active ? '#fff' : '#B8B8B8',
        }}
      >
        {label}
      </span>
      <div
        style={{
          width: 34,
          height: 3,
          borderRadius: 2,
          background: active ? GOLD : 'transparent',
        }}
      />
    </button>
  );
}

function CuisineTile({
  label,
  cuisineKey,
  active,
  onClick,
}: {
  label: string;
  cuisineKey: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? 'rgba(201,151,66,.08)' : 'transparent',
        border: active ? '1px solid rgba(201,151,66,.35)' : '1px solid transparent',
        borderRadius: 14,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '12px 4px 10px',
        minWidth: 0,
        transition: 'all .15s',
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FoodIcon file={CUISINE_ICON_FILE[cuisineKey]} size={56} alt={label} />
      </div>
      <span
        style={{
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: active ? '#fff' : GOLD,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function SponsoredCard({ r }: { r: Restaurant }) {
  return (
    <div style={{ padding: '0 18px' }}>
      <div
        style={{
          fontFamily: DISPLAY,
          fontWeight: 900,
          fontSize: 26,
          color: GOLD,
          textTransform: 'uppercase',
          letterSpacing: '.01em',
          marginBottom: 12,
        }}
      >
        CBL Sponsored
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        <div
          style={{
            width: 120,
            height: 150,
            borderRadius: 10,
            flexShrink: 0,
            background: `url(${r.image}) center/cover no-repeat`,
            border: '1px solid rgba(255,255,255,.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 8,
          }}
        >
          <button
            style={{
              background: GOLD,
              color: '#fff',
              border: 0,
              borderRadius: 999,
              padding: '6px 12px',
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              alignSelf: 'flex-start',
              boxShadow: '0 2px 4px rgba(0,0,0,.4)',
            }}
          >
            More Info
          </button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: 22,
                color: '#fff',
                letterSpacing: '-.01em',
              }}
            >
              {r.name}
            </div>
            <CardCornerGlyph cuisine={r.cuisine} />
            <BucketRating value={5} size={14} />
          </div>
          <div
            style={{
              color: GOLD,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {r.address}
          </div>
          <p style={{ margin: 0, color: '#D4D4D4', fontSize: 12, lineHeight: 1.55 }}>
            {r.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function GridCard({ r }: { r: Restaurant }) {
  return (
    <div
      style={{
        background: '#141414',
        borderRadius: 10,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,.06)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      <div style={{ height: 110, background: `url(${r.image}) center/cover no-repeat` }} />
      <div
        style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
          }}
        >
          <div
            style={{
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 15,
              color: '#fff',
              letterSpacing: '-.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {r.name}
          </div>
          <CardCornerGlyph cuisine={r.cuisine} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
          <BucketRating value={Math.round(r.rating)} size={10} />
          <span style={{ color: '#fff', fontWeight: 600 }}>{r.rating.toFixed(1)}</span>
          <span style={{ color: '#888' }}>({r.reviews.toLocaleString()})</span>
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#888',
            letterSpacing: '.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {r.address}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#8CC084',
              border: '1px solid rgba(140,192,132,.35)',
              padding: '2px 6px',
              borderRadius: 4,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
            }}
          >
            Open Now
          </span>
          <span style={{ color: '#888', fontSize: 11, fontWeight: 700 }}>{r.price}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <button
            style={{
              flex: 1,
              background: GOLD,
              color: '#fff',
              border: 0,
              borderRadius: 999,
              padding: '6px 0',
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,.4)',
            }}
          >
            More Info
          </button>
          <button
            style={{
              flex: 1,
              background: '#2A2A2A',
              color: '#fff',
              border: 0,
              borderRadius: 999,
              padding: '6px 0',
              fontFamily: BODY,
              fontWeight: 600,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            View on Map
          </button>
        </div>
      </div>
    </div>
  );
}

function MobileFlow({
  meal,
  setMeal,
  cuisine,
  setCuisine,
}: {
  meal: string;
  setMeal: (m: string) => void;
  cuisine: string | null;
  setCuisine: (c: string | null) => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeMeal = MOBILE_MEALS.includes(meal) ? meal : 'LUNCH';
  const inResults = !!cuisine;

  const featured = RESTAURANTS.find((r) => r.sponsored);
  const matches = RESTAURANTS.filter(
    (r) =>
      !r.sponsored &&
      r.meal.includes(activeMeal) &&
      (!cuisine || r.cuisine.includes(cuisine)),
  );

  return (
    <div className="cbl-eats-mobile" style={{ background: '#000' }}>
      <EatsTitleBlock />

      {/* Meal tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: '4px 8px 10px',
          borderBottom: inResults
            ? `2px solid ${GOLD}`
            : '1px solid rgba(255,255,255,.05)',
          background: '#000',
        }}
      >
        {MOBILE_MEALS.map((m) => (
          <MealTab
            key={m}
            label={m}
            active={activeMeal === m}
            onClick={() => {
              setMeal(m);
              setCuisine(null);
            }}
          />
        ))}
      </div>

      {/* Cuisine trigger / active-cuisine bar */}
      {!inResults ? (
        <div style={{ padding: '12px 18px 4px' }}>
          <button
            onClick={() => setSheetOpen((v) => !v)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: '12px 16px',
              background: 'rgba(201,151,66,.08)',
              border: `1px solid ${GOLD}`,
              borderRadius: 999,
              cursor: 'pointer',
            }}
          >
            <span
              style={{
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 14,
                letterSpacing: '.08em',
                textTransform: 'uppercase',
                color: '#fff',
              }}
            >
              Pick a cuisine
              <span
                style={{
                  fontFamily: ITALIC,
                  fontStyle: 'italic',
                  fontWeight: 600,
                  color: GOLD,
                  marginLeft: 6,
                  textTransform: 'none',
                }}
              >
                for {activeMeal.toLowerCase()}
              </span>
            </span>
            <span style={{ color: GOLD, fontSize: 18, transform: sheetOpen ? 'rotate(180deg)' : 'none' }}>
              ⌄
            </span>
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 18px 12px',
            borderBottom: '1px solid rgba(255,255,255,.06)',
            background: 'linear-gradient(180deg, rgba(201,151,66,.06), transparent)',
          }}
        >
          <div style={{ transform: 'scale(.5)', margin: -14 }}>
            <FoodIcon file={CUISINE_ICON_FILE[cuisine!]} size={56} alt={cuisine!} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                color: '#888',
                letterSpacing: '.12em',
                textTransform: 'uppercase',
              }}
            >
              Showing
            </div>
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: 22,
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '.01em',
              }}
            >
              {cuisine}{' '}
              <span
                style={{
                  fontFamily: ITALIC,
                  fontStyle: 'italic',
                  fontWeight: 600,
                  color: GOLD,
                  textTransform: 'none',
                  fontSize: 18,
                }}
              >
                for {activeMeal.toLowerCase()}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              setCuisine(null);
              setSheetOpen(false);
            }}
            style={{
              background: 'transparent',
              border: `1px solid ${GOLD}`,
              color: GOLD,
              borderRadius: 999,
              padding: '5px 12px',
              fontFamily: DISPLAY,
              fontWeight: 800,
              fontSize: 11,
              letterSpacing: '.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Change
          </button>
        </div>
      )}

      {/* Cuisine dropdown sheet */}
      {sheetOpen && !inResults && (
        <div
          style={{
            background: '#0A0A0A',
            boxShadow: 'inset 0 8px 12px -8px rgba(0,0,0,.9)',
            padding: '14px 12px 18px',
            borderBottom: '1px solid rgba(255,255,255,.06)',
            animation: 'cblSlideDown .35s cubic-bezier(.2,.8,.2,1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 6px 10px',
            }}
          >
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: 20,
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '.02em',
              }}
            >
              Pick a cuisine
              <span
                style={{
                  fontFamily: ITALIC,
                  fontStyle: 'italic',
                  fontWeight: 600,
                  color: GOLD,
                  marginLeft: 6,
                  textTransform: 'none',
                  fontSize: 18,
                }}
              >
                for {activeMeal.toLowerCase()}
              </span>
            </div>
            <button
              onClick={() => setSheetOpen(false)}
              style={{
                background: 'transparent',
                border: 0,
                color: '#888',
                fontSize: 22,
                cursor: 'pointer',
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2 }}>
            {MOBILE_CUISINES.map((c) => (
              <CuisineTile
                key={c}
                label={c === 'VIETNAMESE' ? 'VIETNAM' : c}
                cuisineKey={c}
                active={cuisine === c}
                onClick={() => {
                  setCuisine(c);
                  setSheetOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div style={{ padding: '18px 0 64px', background: '#000' }}>
        {featured && <SponsoredCard r={featured} />}
        {matches.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              padding: '18px 18px 0',
            }}
          >
            {matches.map((r) => (
              <GridCard key={r.id} r={r} />
            ))}
          </div>
        ) : (
          <div
            style={{
              padding: '30px 24px',
              textAlign: 'center',
              color: '#888',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: 20,
                color: '#fff',
                marginBottom: 6,
              }}
            >
              No {cuisine ? cuisine.toLowerCase() + ' ' : ''}spots for {activeMeal.toLowerCase()} yet.
            </div>
            Our Pittsburgh team is curating picks.
            <br />
            {cuisine ? (
              <>
                Tap <span style={{ color: GOLD, fontWeight: 700 }}>Change</span> to browse other
                cuisines.
              </>
            ) : (
              'Try another meal time.'
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Partner / referral CTA (shared across desktop + mobile) ─────────────────
const PARTNER_CSS = `
.cbl-eats .partner-band { max-width:1280px; margin:0 auto; padding:12px 48px 72px; }
.cbl-eats .partner-band .ph { margin-bottom:24px; }
.cbl-eats .partner-band .eyebrow {
  font-family:${MONO}; font-size:12px; color:${GOLD}; letter-spacing:.18em;
  text-transform:uppercase; display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
}
.cbl-eats .partner-band .eyebrow::before { content:''; width:28px; height:1px; background:${GOLD}; }
.cbl-eats .partner-band h2 {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(32px,3.6vw,52px);
  line-height:.98; letter-spacing:-.01em; text-transform:uppercase; margin-bottom:8px;
}
.cbl-eats .partner-band h2 .it {
  font-family:${ITALIC}; font-style:italic; color:${GOLD};
  font-weight:600; text-transform:none; font-size:.6em; margin-left:8px;
}
.cbl-eats .partner-band .sub { color:#B0B0B0; font-size:15px; line-height:1.55; max-width:64ch; }
.cbl-eats .partner-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.cbl-eats .partner-card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; padding:30px 32px;
  display:flex; flex-direction:column; gap:14px;
  transition:transform .3s, border-color .3s;
}
.cbl-eats .partner-card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.45); }
.cbl-eats .partner-card.feature {
  background:linear-gradient(135deg, rgba(201,151,66,.16), rgba(201,151,66,.03));
  border-color:rgba(201,151,66,.5);
}
.cbl-eats .partner-card .tag { font-family:${MONO}; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:${GOLD}; }
.cbl-eats .partner-card h3 {
  font-family:${DISPLAY}; font-weight:900; font-size:28px;
  line-height:1; text-transform:uppercase; letter-spacing:-.005em;
}
.cbl-eats .partner-card > p { color:#B0B0B0; font-size:14px; line-height:1.55; }
.cbl-eats .partner-card ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.cbl-eats .partner-card li { position:relative; padding-left:22px; color:#C8C8C8; font-size:13px; line-height:1.45; }
.cbl-eats .partner-card li::before { content:''; position:absolute; left:0; top:7px; width:12px; height:1.5px; background:${GOLD}; }
.cbl-eats .partner-card .cta {
  align-self:flex-start; margin-top:auto;
  display:inline-flex; align-items:center; gap:8px;
  background:${GOLD}; color:#000; border:0;
  padding:13px 28px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800;
  font-size:13px; letter-spacing:.12em; text-transform:uppercase; transition:background .2s;
}
.cbl-eats .partner-card .cta:hover { background:#DDB15F; }
.cbl-eats .partner-card .cta.ghost { background:transparent; color:${GOLD}; border:1px solid rgba(201,151,66,.5); }
.cbl-eats .partner-card .cta.ghost:hover { background:rgba(201,151,66,.12); }
@media (max-width:900px){
  .cbl-eats .partner-band { padding:12px 20px 56px; }
  .cbl-eats .partner-grid { grid-template-columns:1fr; }
}
`;

function PartnerBand() {
  return (
    <section className="partner-band">
      <div className="ph">
        <div className="eyebrow">partners · local referrals</div>
        <h2>
          Get your spot <span className="it">in front of locals</span>
        </h2>
        <p className="sub">
          CBL members and local drivers use this page to decide where to eat and drink. Claim a
          featured spot for your restaurant — or tip us off to a favorite that belongs here.
        </p>
      </div>
      <div className="partner-grid">
        <div className="partner-card feature">
          <div className="tag">For restaurants</div>
          <h3>Become a CBL Partner</h3>
          <p>
            Sponsored placement at the top of results, a partner badge, and direct exposure to
            members and drivers exploring your neighborhood.
          </p>
          <ul>
            <li>Spotlight placement above standard listings</li>
            <li>Sponsored badge + full restaurant profile</li>
            <li>Reach CBL members and local drivers</li>
          </ul>
          <Link to="/affiliates" className="cta">
            Become a Partner →
          </Link>
        </div>
        <div className="partner-card">
          <div className="tag">For locals</div>
          <h3>Refer a local favorite</h3>
          <p>
            Know a spot we're missing? Send it our way. If it joins, you earn CBL rewards — and your
            neighborhood gets a little better.
          </p>
          <ul>
            <li>Suggest any local restaurant or bar</li>
            <li>Earn rewards when they come on board</li>
            <li>Help shape the Pittsburgh picks</li>
          </ul>
          <Link to="/contact" className="cta ghost">
            Refer a Spot →
          </Link>
        </div>
      </div>
    </section>
  );
}

export function EatsAndDrinks() {
  // Shared filter state. Desktop uses 'ALL' default for both; mobile flow
  // starts with no cuisine (null) so the landing/meal step shows first.
  const [meal, setMeal] = useState('LUNCH');
  const [desktopCuisine, setDesktopCuisine] = useState('ALL');
  const [mobileCuisine, setMobileCuisine] = useState<string | null>(null);

  return (
    <main className="cbl-eats">
      <style>{DESKTOP_CSS}</style>
      <style>{PARTNER_CSS}</style>
      <DesktopEats
        meal={meal}
        setMeal={setMeal}
        cuisine={desktopCuisine}
        setCuisine={setDesktopCuisine}
      />
      <MobileFlow
        meal={meal}
        setMeal={setMeal}
        cuisine={mobileCuisine}
        setCuisine={setMobileCuisine}
      />
      <PartnerBand />
    </main>
  );
}
