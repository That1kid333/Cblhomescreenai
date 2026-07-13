import { useState, useEffect, createContext, useContext } from 'react';
import { RIDER_BOOK_URL } from '../lib/constants';
import { Link } from 'react-router';
import { useVisitorLocation, type Coords, type VisitorLocationStatus } from '../lib/location';

/**
 * Attractions — location-aware live listings.
 *
 * Mirrors the Eats & Drinks page: `useVisitorLocation()` auto-detects the
 * visitor's city (keyless IP, no prompt) + coords, a LocationBar lets them
 * search another city or upgrade to precise GPS, and `useLiveAttractions()`
 * pulls the top-rated real attractions per category from Google Places
 * (`/api/places` proxy — key stays server-side). The weather band is real too,
 * via Open-Meteo (free, no API key). When the Places API is down / not
 * configured / returns nothing, the page falls back to a curated Pittsburgh
 * seed so the grid is never empty.
 *
 * Font swaps mirror Transportation and Eats & Drinks: Myriad Pro for display
 * headers, Playfair Display for the editorial italic accents. CBLNav and
 * CBLFooter from the source are dropped — `Layout` already provides the
 * global nav.
 */

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";
const GOLD = '#C99742';

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
  { key: 'ALL', label: 'Top Picks', Icon: IconAll },
  { key: 'SPORTS', label: 'Sports', Icon: IconSports },
  { key: 'MUSIC', label: 'Music', Icon: IconMusic },
  { key: 'ARTS', label: 'Arts', Icon: IconArts },
  { key: 'FAMILY', label: 'Family', Icon: IconFamily },
  { key: 'OUTDOORS', label: 'Outdoors', Icon: IconOutdoors },
  { key: 'NIGHT', label: 'Nightlife', Icon: IconNight },
];

// Category → Google Places type + keyword. Passed to the /api/places proxy,
// which forwards `type` to Google's Nearby Search and ranks by rating × reviews.
const CAT_QUERY: Record<Category, { type: string; kw: string }> = {
  ALL: { type: 'tourist_attraction', kw: 'things to do' },
  SPORTS: { type: 'stadium', kw: 'sports' },
  MUSIC: { type: 'night_club', kw: 'live music venue' },
  ARTS: { type: 'museum', kw: 'museum art gallery' },
  FAMILY: { type: 'amusement_park', kw: 'family kids' },
  OUTDOORS: { type: 'park', kw: 'park outdoors' },
  NIGHT: { type: 'night_club', kw: 'nightlife bar' },
};

// Short, uppercase-friendly tag shown on each card / pill for a category.
const CAT_TAG: Record<Category, string> = {
  ALL: 'Attraction',
  SPORTS: 'Sports',
  MUSIC: 'Music',
  ARTS: 'Arts',
  FAMILY: 'Family',
  OUTDOORS: 'Outdoors',
  NIGHT: 'Nightlife',
};

// Category fallback imagery (used when a live result has no Google photo, and
// for the curated seed). Reuses the page's existing Unsplash art.
const CAT_PHOTO: Record<Category, string> = {
  ALL: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=540&fit=crop',
  SPORTS: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800&h=540&fit=crop',
  MUSIC: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=540&fit=crop',
  ARTS: 'https://images.unsplash.com/photo-1531913764164-f85c52e6e654?w=800&h=540&fit=crop',
  FAMILY: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&h=540&fit=crop',
  OUTDOORS: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=540&fit=crop',
  NIGHT: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=540&fit=crop',
};

// ── The live attraction shape ───────────────────────────────────────────────
type Attraction = {
  id: string; // 'g-'+place_id for live Google listings; 'ev-'+n for the seed
  name: string;
  cat: Category;
  address: string; // vicinity / neighborhood
  rating: number | null;
  reviews: number;
  open: boolean | null;
  coord: [number, number]; // [lat, lng]
  photo: string;
  desc: string;
};

// ── Curated Pittsburgh seed (fallback only) ─────────────────────────────────
// Shown when the live Places API is down / not configured / returns nothing,
// so the grid is never empty. Ratings/reviews are plausible placeholders.
type SeedItem = {
  id: number;
  name: string;
  venue: string;
  cat: Exclude<Category, 'ALL'>;
  img: string;
  desc: string;
  featured: boolean;
};

const SEED: SeedItem[] = [
  {
    id: 1,
    name: 'Three Rivers Arts Festival',
    venue: 'Point State Park · Downtown',
    cat: 'ARTS',
    img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=900&fit=crop',
    desc: 'Free outdoor arts festival featuring 70+ visual artists, three concert stages, and food vendors along the rivers.',
    featured: true,
  },
  {
    id: 2,
    name: 'Andy Warhol Museum',
    venue: 'The Warhol · North Shore',
    cat: 'ARTS',
    img: 'https://images.unsplash.com/photo-1531913764164-f85c52e6e654?w=800&h=540&fit=crop',
    desc: 'The largest museum dedicated to a single artist in North America — seven floors of pop, the Silver Clouds room and rare Polaroids.',
    featured: false,
  },
  {
    id: 3,
    name: 'Phipps Conservatory',
    venue: 'Phipps · Oakland',
    cat: 'OUTDOORS',
    img: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=540&fit=crop',
    desc: 'A Victorian glasshouse of tropical orchid rooms, a butterfly garden and indoor courtyards in perpetual bloom.',
    featured: false,
  },
  {
    id: 4,
    name: 'PNC Park',
    venue: 'North Shore',
    cat: 'SPORTS',
    img: 'https://images.unsplash.com/photo-1508344928928-7165b67de128?w=800&h=540&fit=crop',
    desc: 'Widely called the best ballpark in America — riverfront seats with the downtown skyline right over the outfield.',
    featured: false,
  },
  {
    id: 5,
    name: 'Heinz Hall',
    venue: 'Cultural District',
    cat: 'MUSIC',
    img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=800&h=540&fit=crop',
    desc: 'Home of the Pittsburgh Symphony Orchestra — a restored 1927 movie palace with gilded, chandeliered grandeur.',
    featured: false,
  },
  {
    id: 6,
    name: 'Carrie Blast Furnaces',
    venue: 'Rivers of Steel · Rankin',
    cat: 'ARTS',
    img: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&h=540&fit=crop',
    desc: 'Walk through the last hot-metal blast furnaces of the Carnegie Steel era — a National Historic Landmark.',
    featured: false,
  },
  {
    id: 7,
    name: 'Mr. Smalls Theatre',
    venue: 'Millvale',
    cat: 'MUSIC',
    img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=540&fit=crop',
    desc: 'A former Catholic church turned 800-cap music hall — Millvale’s nightlife anchor and a true Pittsburgh rite of passage.',
    featured: false,
  },
  {
    id: 8,
    name: 'Pittsburgh Zoo & Aquarium',
    venue: 'Highland Park',
    cat: 'FAMILY',
    img: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=800&h=540&fit=crop',
    desc: 'A hillside zoo and aquarium under one gate — big cats, a two-story shark tank and a kids’ discovery trail.',
    featured: false,
  },
  {
    id: 9,
    name: 'Highmark Stadium',
    venue: 'Riverhounds · Station Square',
    cat: 'SPORTS',
    img: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&h=540&fit=crop',
    desc: 'A riverfront pitch where the USL Riverhounds play with the Monongahela and the Mon Incline as the backdrop.',
    featured: false,
  },
  {
    id: 10,
    name: 'Mattress Factory',
    venue: 'Mexican War Streets',
    cat: 'ARTS',
    img: 'https://images.unsplash.com/photo-1578321709555-3f7e5c45c5e3?w=800&h=540&fit=crop',
    desc: 'A room-sized-installation museum — Yayoi Kusama’s Infinity Room alongside rotating site-specific commissions.',
    featured: false,
  },
  {
    id: 11,
    name: 'National Aviary',
    venue: 'North Side',
    cat: 'FAMILY',
    img: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&h=540&fit=crop',
    desc: "America's only independent indoor bird zoo — 500+ birds in walk-through habitats you can get nose-to-beak with.",
    featured: false,
  },
  {
    id: 12,
    name: "Children's Museum of Pittsburgh",
    venue: 'North Side',
    cat: 'FAMILY',
    img: 'https://images.unsplash.com/photo-1531913764164-f85c52e6e654?w=800&h=540&fit=crop',
    desc: 'A hands-on museum and MAKESHOP recently ranked among the country’s very best for kids.',
    featured: false,
  },
  {
    id: 13,
    name: 'Frick Park',
    venue: 'Point Breeze',
    cat: 'OUTDOORS',
    img: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=540&fit=crop',
    desc: "Pittsburgh's largest municipal park — 600+ wooded acres of ravine trails, clay courts and an off-leash dog run.",
    featured: false,
  },
  {
    id: 14,
    name: "Gooski's",
    venue: 'Polish Hill',
    cat: 'NIGHT',
    img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=540&fit=crop',
    desc: 'A legendary no-nonsense dive with stiff drinks, live punk, pierogies, and the friendliest sarcasm in town.',
    featured: false,
  },
  {
    id: 15,
    name: 'Squirrel Hill Night Market',
    venue: 'Murray Avenue · Squirrel Hill',
    cat: 'NIGHT',
    img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=540&fit=crop',
    desc: '40+ local food vendors, makers, and live music take over Murray Ave between Forbes and Forward.',
    featured: false,
  },
];

// Reshape a seed item into the live Attraction shape (ignores dated fields;
// gives plausible, deterministic ratings/reviews so cards look real).
function seedToAttraction(s: SeedItem): Attraction {
  return {
    id: 'ev-' + s.id,
    name: s.name,
    cat: s.cat,
    address: s.venue,
    rating: Math.round((4.3 + (s.id % 6) * 0.08) * 10) / 10,
    reviews: 240 + s.id * 137,
    open: null,
    coord: [0, 0],
    photo: s.img,
    desc: s.desc,
  };
}

// ── Google Maps directions helper (mirrors Eats) ────────────────────────────
// Live listings carry a `g-`-prefixed Google place_id (ChI…); the seed uses
// plain slugs. Adds &query_place_id when we have a real place id for an exact hit.
const placeIdOf = (a: Attraction): string | null => {
  const id = a.id.replace(/^g-/, '');
  return /^ChI/.test(id) ? id : null;
};
function gMaps(a: Attraction): string {
  const pid = placeIdOf(a);
  const base = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a.name}, ${a.address}`)}`;
  return pid ? `${base}&query_place_id=${pid}` : base;
}

// ── Weather (Open-Meteo — free, keyless) ────────────────────────────────────
type WeatherDay = { day: string; hi: number; lo: number; code: number };
type Weather = {
  now: { temp: number; code: number; isDay: boolean };
  days: WeatherDay[];
} | null;

// WMO weather_code → a condition label + a simple emoji.
function wmo(code: number): { label: string; icon: string } {
  if (code === 0) return { label: 'Clear', icon: '☀️' };
  if (code >= 1 && code <= 3) return { label: 'Partly Cloudy', icon: '⛅' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: '🌫️' };
  if (code >= 51 && code <= 67) return { label: 'Rain', icon: '🌧️' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: 'Snow', icon: '🌨️' };
  if (code >= 80 && code <= 82) return { label: 'Showers', icon: '🌦️' };
  if (code >= 95 && code <= 99) return { label: 'Thunderstorm', icon: '⛈️' };
  return { label: 'Fair', icon: '⛅' };
}

const weatherCache = new Map<string, Weather>();

function useWeather(coords: Coords | null): Weather {
  const [weather, setWeather] = useState<Weather>(null);
  useEffect(() => {
    if (!coords) {
      setWeather(null);
      return;
    }
    const key = `${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
    const cached = weatherCache.get(key);
    if (cached) {
      setWeather(cached);
      return;
    }
    let cancelled = false;
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}` +
      `&current=temperature_2m,weather_code,is_day` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min` +
      `&temperature_unit=fahrenheit&timezone=auto&forecast_days=6`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d?.current || !d?.daily?.time) return;
        const days: WeatherDay[] = d.daily.time.map((t: string, i: number) => ({
          day: new Date(t + 'T00:00:00')
            .toLocaleDateString('en-US', { weekday: 'short' })
            .toUpperCase(),
          hi: Math.round(d.daily.temperature_2m_max[i]),
          lo: Math.round(d.daily.temperature_2m_min[i]),
          code: d.daily.weather_code[i],
        }));
        const w: Weather = {
          now: {
            temp: Math.round(d.current.temperature_2m),
            code: d.current.weather_code,
            isDay: !!d.current.is_day,
          },
          days,
        };
        weatherCache.set(key, w);
        setWeather(w);
      })
      .catch(() => {
        if (!cancelled) setWeather(null);
      });
    return () => {
      cancelled = true;
    };
  }, [coords?.lat, coords?.lng]);
  return weather;
}

// ── Live attractions (Google Places proxy) ──────────────────────────────────
// Keep the family-friendly city-guide vibe: filter adult venues (gentlemen's
// clubs / strip joints) out of live results by name.
const ADULT_RE = /(cabaret|gentlem[ae]n'?s|strip[\s-]?club|topless|exotic danc|adult entertain|adult club|\bxxx\b|showgirl|\bnude\b|men'?s club|go[\s-]?go bar)/i;

const attractionCache = new Map<string, Attraction[]>();

function useLiveAttractions(coords: Coords | null, category: Category): Attraction[] | null {
  const [live, setLive] = useState<Attraction[] | null>(null);
  const { type, kw } = CAT_QUERY[category];
  useEffect(() => {
    if (!coords) {
      setLive(null);
      return;
    }
    const cacheKey = `${category}@${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
    const cached = attractionCache.get(cacheKey);
    if (cached) {
      setLive(cached);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/places?lat=${coords.lat}&lng=${coords.lng}&type=${type}&keyword=${encodeURIComponent(kw)}&radius=20000`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d.configured || !d.results?.length) {
          setLive(null);
          return;
        }
        const mapped: Attraction[] = d.results
          .filter(
            (p: { coord?: [number, number]; name?: string }) =>
              p.coord && p.coord[0] != null && !ADULT_RE.test(p.name || ''),
          )
          .map(
            (p: {
              id: string;
              name: string;
              rating: number | null;
              reviews: number;
              open: boolean | null;
              address: string;
              coord: [number, number];
              photo: string | null;
            }) => ({
              id: 'g-' + p.id,
              name: p.name,
              cat: category,
              address: p.address,
              rating: p.rating ?? null,
              reviews: p.reviews ?? 0,
              open: p.open ?? null,
              coord: p.coord,
              photo: p.photo || CAT_PHOTO[category],
              desc: p.reviews
                ? `${p.reviews.toLocaleString()} local reviews · rated ${p.rating ?? '—'}★ — one of the top-rated ${CAT_TAG[
                    category
                  ].toLowerCase()} spots near you.`
                : `A popular ${CAT_TAG[category].toLowerCase()} spot near you.`,
            }),
          );
        attractionCache.set(cacheKey, mapped);
        setLive(mapped);
      })
      .catch(() => {
        if (!cancelled) setLive(null);
      });
    return () => {
      cancelled = true;
    };
  }, [coords?.lat, coords?.lng, category, type, kw]);
  return live;
}

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
  .cbl-attractions h1.hero-title { display:flex; flex-wrap:nowrap; position:relative; gap:0; align-items:flex-start; font-size:clamp(30px,8vw,44px); }
  .cbl-attractions h1.hero-title .title-stack { min-width:0; flex:1; }
  .cbl-attractions h1.hero-title .title-stack > span:first-child { display:block; padding-right:64px; }
  .cbl-attractions h1.hero-title .attractions-icon { display:flex; position:absolute; top:0; right:0; width:56px; height:56px; }
  .cbl-attractions .hero-subtitle { flex-wrap:nowrap; white-space:nowrap; font-size:clamp(20px,5.4vw,27px); }
  .cbl-attractions .eyebrow { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
  .cbl-attractions .eyebrow::before { display:inline-block; vertical-align:middle; margin-right:10px; }
  /* Bottom tab bar (TripIt-style) — pin the category tabs to the bottom on phones */
  .cbl-attractions { padding-bottom:76px; }
  .cbl-attractions .filters { position:static; padding:12px 16px 0; }
  .cbl-attractions .cat-row {
    position:fixed; left:0; right:0; bottom:0; z-index:60;
    background:rgba(10,10,10,.98); -webkit-backdrop-filter:blur(16px); backdrop-filter:blur(16px);
    border-top:1px solid rgba(255,255,255,.10); border-bottom:0;
    padding:8px 4px calc(8px + env(safe-area-inset-bottom)); gap:0;
    overflow:visible; justify-content:space-around;
  }
  .cbl-attractions .cat-btn { flex:1; padding:2px; gap:4px; font-size:11px; letter-spacing:.04em; border-bottom:0; margin-bottom:0; white-space:nowrap; }
  .cbl-attractions .cat-btn.active { border-bottom:0; }
  .cbl-attractions .cat-btn .ic { width:24px; height:24px; opacity:.7; }
  .cbl-attractions .cat-btn.active .ic { opacity:1; }
}
.cbl-attractions .hero p.lede { margin-top:14px; max-width:640px; font-size:16px; line-height:1.45; color:#B8B8B8; }

/* ── Location bar (mirrors Eats) ── */
.cbl-attractions .locbar {
  display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap;
  padding:11px 20px; background:#0c0c0c; border-bottom:1px solid rgba(201,151,66,.22);
  font-family:${MONO}; font-size:12px; letter-spacing:.06em; color:#B8B8B8;
}
.cbl-attractions .locbar .pin { color:${GOLD}; display:inline-flex; }
.cbl-attractions .locbar b { color:${GOLD}; font-weight:700; letter-spacing:.04em; }
.cbl-attractions .locbar .search { display:inline-flex; align-items:center; gap:6px; background:#141414; border:1px solid rgba(201,151,66,.4); border-radius:999px; padding:4px 5px 4px 14px; }
.cbl-attractions .locbar .search:focus-within { border-color:${GOLD}; }
.cbl-attractions .locbar .search input { background:transparent; border:0; outline:none; color:#fff; font-family:${MONO}; font-size:12px; letter-spacing:.04em; width:190px; max-width:46vw; }
.cbl-attractions .locbar .search input::placeholder { color:#7a7a7a; }
.cbl-attractions .locbar .search .go { background:${GOLD}; color:#000; border:0; border-radius:999px; width:26px; height:26px; display:grid; place-items:center; cursor:pointer; flex-shrink:0; }
.cbl-attractions .locbar .search .go:hover { background:#DDB15F; }
.cbl-attractions .locbar .nearme { display:inline-flex; align-items:center; gap:6px; background:transparent; border:1px solid rgba(201,151,66,.5); border-radius:999px; padding:6px 14px; color:${GOLD}; font-family:${MONO}; font-size:12px; letter-spacing:.04em; cursor:pointer; }
.cbl-attractions .locbar .nearme:hover { background:rgba(201,151,66,.1); }
.cbl-attractions .locbar .nearme:disabled { opacity:.6; cursor:default; }
@media (max-width:640px){ .cbl-attractions .locbar { font-size:11px; padding:10px 14px; gap:8px; } .cbl-attractions .locbar .search input { width:150px; } }

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
.cbl-attractions .week-day .lo { font-family:${MONO}; font-size:10px; color:#888; margin-top:3px; letter-spacing:.06em; }
.cbl-attractions .week-day .ic { font-size:18px; margin:2px 0 4px; }
@media (max-width:640px){
  .cbl-attractions .weather-right { gap:12px; overflow-x:auto; scrollbar-width:none; -webkit-overflow-scrolling:touch; }
  .cbl-attractions .weather-right::-webkit-scrollbar { display:none; }
  .cbl-attractions .week-day { min-width:46px; }
}

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

.cbl-attractions .powered {
  display:flex; align-items:center; gap:8px; padding:10px 0 12px;
  font-family:${MONO}; font-size:10px; color:#6f6f6f;
  letter-spacing:.14em; text-transform:uppercase;
}
.cbl-attractions .powered::before {
  content:''; width:6px; height:6px; border-radius:50%;
  background:#4DBF66; box-shadow:0 0 6px #4DBF66;
}

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

/* ── Top rated band ── */
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

/* ── Attraction cards ── */
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
.cbl-attractions .event-card .open-pill {
  position:absolute; bottom:14px; left:14px; z-index:2;
  font-family:${MONO}; font-size:9px;
  letter-spacing:.14em; text-transform:uppercase; color:#fff;
  background:rgba(0,0,0,.6); padding:4px 8px; border-radius:4px;
  display:flex; align-items:center; gap:5px;
}
.cbl-attractions .event-card .open-pill::before {
  content:''; width:5px; height:5px; border-radius:50%; background:#4DBF66; box-shadow:0 0 6px #4DBF66;
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
.cbl-attractions .event-card .rating-row {
  display:flex; align-items:center; gap:8px;
  padding-top:6px; margin-top:auto; flex-wrap:wrap; font-size:13px;
}
.cbl-attractions .event-card .rating-row b { color:#fff; font-weight:700; }
.cbl-attractions .event-card .rating-row .rev { color:#888; font-size:12px; }
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
.cbl-attractions .spotlight .shot .open-pill {
  position:absolute; top:20px; left:20px; z-index:2;
  font-family:${MONO}; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#fff;
  background:rgba(0,0,0,.7); border:1px solid rgba(77,191,102,.5);
  padding:7px 12px; border-radius:8px; display:flex; align-items:center; gap:6px;
}
.cbl-attractions .spotlight .shot .open-pill::before {
  content:''; width:6px; height:6px; border-radius:50%; background:#4DBF66; box-shadow:0 0 6px #4DBF66;
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
.cbl-attractions .spotlight .row { display:flex; align-items:center; gap:14px; margin-top:4px; flex-wrap:wrap; }
.cbl-attractions .spotlight .row b { color:#fff; font-weight:700; }
.cbl-attractions .spotlight .row .addr { color:#888; font-size:13px; }
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
.cbl-attractions .spotlight .actions .cta.ghost:hover { border-color:#C99742; color:#C99742; }

/* ── Empty / loading state ── */
.cbl-attractions .empty {
  grid-column:span 3; padding:72px 24px; text-align:center;
  border:1px dashed rgba(255,255,255,.14); border-radius:18px 0 18px 0;
}
.cbl-attractions .empty h4 {
  font-family:${DISPLAY}; font-weight:900; font-size:32px; text-transform:uppercase;
  letter-spacing:-.01em; margin-bottom:6px;
}
.cbl-attractions .empty h4 .it { font-family:${ITALIC}; font-style:italic; color:#C99742; font-weight:600; text-transform:none; }
.cbl-attractions .empty p { color:#888; font-size:14px; }

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
  .cbl-attractions .empty { grid-column:span 2; }
}
@media (max-width:720px){
  .cbl-attractions .events-grid { grid-template-columns:1fr; }
  .cbl-attractions .spotlight { grid-column:span 1; }
  .cbl-attractions .empty { grid-column:span 1; }
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

// On-brand bucket-list rating glyph (mirrors Eats' BucketGlyph).
function BucketGlyph({ value = 5, size = 14 }: { value?: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 20 20" style={{ opacity: i < value ? 1 : 0.25 }}>
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

function openBook() {
  window.open(RIDER_BOOK_URL, '_blank', 'noopener,noreferrer');
}
function openDirections(a: Attraction) {
  window.open(gMaps(a), '_blank', 'noopener,noreferrer');
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div>
          <div className="eyebrow">real attractions · near you</div>
          <h1 className="hero-title">
            <span className="title-stack">
              <span className="h1-main">Attractions</span>
              <span className="hero-subtitle">
                <span>Your City.</span>
                <span className="it">Near you.</span>
              </span>
            </span>
            <span className="attractions-icon" aria-hidden="true">
              <HeroAttractionsSvg />
            </span>
          </h1>
          <p className="lede">
            The top-rated things to do near you — museums, parks, live music, sports and more,
            pulled live. Then book a ride to get there.
          </p>
        </div>
      </div>
    </section>
  );
}

function LocationBar({
  status,
  activeCity,
  onSearchCity,
  onNearMe,
  searching,
}: {
  status: VisitorLocationStatus;
  activeCity: string;
  onSearchCity: (q: string) => void;
  onNearMe: () => void;
  searching: boolean;
}) {
  const [q, setQ] = useState('');
  return (
    <div className="locbar">
      <span className="pin" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </span>
      <span>
        Attractions near <b>{status === 'locating' ? 'you…' : activeCity}</b>
      </span>
      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) onSearchCity(q.trim());
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a city or town…"
          aria-label="Search a city or town"
        />
        <button type="submit" className="go" aria-label="Search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </form>
      <button className="nearme" onClick={onNearMe} disabled={searching}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </svg>
        {searching ? 'Locating…' : 'Near me'}
      </button>
    </div>
  );
}

function WeatherStrip({ weather, city }: { weather: Weather; city: string }) {
  if (!weather) {
    return (
      <div className="weather-strip">
        <div className="weather-inner">
          <div className="weather-left">
            <div className="weather-temp">—°</div>
            <div className="weather-meta">
              <div className="weather-city">{city}</div>
              <div className="weather-cond">Fetching local weather…</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const now = wmo(weather.now.code);
  const today = weather.days[0];
  return (
    <div className="weather-strip">
      <div className="weather-inner">
        <div className="weather-left">
          <div className="weather-temp">{weather.now.temp}°</div>
          <div className="weather-meta">
            <div className="weather-city">{city}</div>
            <div className="weather-cond">
              {now.icon} {now.label}
            </div>
            {today && (
              <div className="weather-hi">
                HI<b>{today.hi}°</b>· LO<b>{today.lo}°</b>
              </div>
            )}
          </div>
        </div>
        <div className="weather-right">
          {weather.days.map((w, i) => {
            const c = wmo(w.code);
            return (
              <div key={w.day + i} className="week-day">
                <div className="d">{i === 0 ? 'TODAY' : w.day}</div>
                <div className="ic">{c.icon}</div>
                <div className="t">{w.hi}°</div>
                <div className="lo">{w.lo}°</div>
              </div>
            );
          })}
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
        <div className="powered">Powered by Google · live ratings near you</div>
      </div>
    </div>
  );
}

function RatingLine({ a }: { a: Attraction }) {
  if (a.rating == null && !a.reviews) return null;
  return (
    <div className="rating-row">
      <BucketGlyph value={Math.round(a.rating ?? 0)} />
      {a.rating != null && <b>{a.rating.toFixed(1)}</b>}
      {a.reviews ? <span className="rev">({a.reviews.toLocaleString()})</span> : null}
    </div>
  );
}

function EventCard({ a }: { a: Attraction }) {
  const openModal = useContext(AttractionModalCtx);
  return (
    <article className="event-card">
      <div className="img" style={{ backgroundImage: `url(${a.photo})` }}>
        <div className="tag-row">
          <span className="tag">{CAT_TAG[a.cat]}</span>
        </div>
        {a.open && <span className="open-pill">Open now</span>}
      </div>
      <div className="body">
        <h3>{a.name}</h3>
        <div className="venue">{a.address}</div>
        <p className="desc">{a.desc}</p>
        <RatingLine a={a} />
        <div className="cta-row">
          <button className="cta" onClick={openBook}>
            <CarMini size={14} color="#000" />
            Book a Ride There
          </button>
          <button className="cta ghost" onClick={() => openModal(a)}>
            More Info
          </button>
        </div>
      </div>
    </article>
  );
}

function Spotlight({ a }: { a: Attraction }) {
  const openModal = useContext(AttractionModalCtx);
  return (
    <div className="spotlight">
      <div className="shot">
        <div
          className="ph"
          style={{
            background: `linear-gradient(180deg, rgba(10,10,10,0) 30%, rgba(10,10,10,.7)), url(${a.photo}) center/cover no-repeat`,
          }}
        />
        {a.open && <span className="open-pill">Open now</span>}
      </div>
      <div className="text">
        <div className="kicker">Top rated · {CAT_TAG[a.cat]}</div>
        <h3>
          {a.name}
          <span className="it">near you</span>
        </h3>
        <p>{a.desc}</p>
        <div className="row">
          {(a.rating != null || a.reviews > 0) && (
            <>
              <BucketGlyph value={Math.round(a.rating ?? 0)} size={18} />
              {a.rating != null && <b>{a.rating.toFixed(1)}</b>}
              {a.reviews ? <span className="addr">· {a.reviews.toLocaleString()} reviews</span> : null}
            </>
          )}
          <span
            style={{
              fontFamily: MONO,
              fontSize: 11,
              color: '#888',
              letterSpacing: '.12em',
            }}
          >
            {a.address}
          </span>
        </div>
        <div className="actions">
          <button className="cta" onClick={openBook}>
            <CarMini size={14} color="#000" />
            Book a Ride There
          </button>
          <button className="cta ghost" onClick={() => openModal(a)}>
            More Info
          </button>
        </div>
      </div>
    </div>
  );
}

function TopRated({ items }: { items: Attraction[] }) {
  const top = items.slice(0, 10);
  return (
    <section className="band tight top10-band">
      <div className="band-inner">
        <div className="section-head">
          <div>
            <div className="section-eyebrow">top rated · near you</div>
            <h2 className="section-h2">
              The list <span className="it">worth your bucket list</span>
            </h2>
          </div>
          <div className="count">
            <b>{top.length}</b> picks · top-rated
          </div>
        </div>
        <div className="top10">
          {top.map((a, i) => (
            <div key={a.id} className="top10-item">
              <div className="rank">{(i + 1).toString().padStart(2, '0')}</div>
              <div>
                <div className="name">{a.name}</div>
                <div className="when">
                  {a.rating != null ? `${a.rating.toFixed(1)}★` : 'Top rated'}
                  {a.reviews ? ` · ${a.reviews.toLocaleString()} reviews` : ''}
                </div>
              </div>
              <span className="cat-pill">{CAT_TAG[a.cat]}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── On-site detail panel (More Info) — same treatment as the Eats cards ───────
// Keeps visitors on-site: photo, rating, live hours/reviews (Place Details), an
// embedded Google map, then deliberate outbound actions. Opens from a card's
// "More Info" instead of jumping straight to Google.
const mapEmbed = (a: Attraction) =>
  `https://maps.google.com/maps?q=${encodeURIComponent(`${a.name}, ${a.address}`)}&z=15&output=embed`;

const AttractionModalCtx = createContext<(a: Attraction) => void>(() => {});

type PlaceDetails = {
  website: string | null;
  hours: string[] | null;
  openNow: boolean | null;
  summary: string | null;
  review: { author: string; rating: number; text: string; when: string } | null;
};

const AMODAL_CSS = `
.cbl-amodal { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:16px; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-amodal * { box-sizing:border-box; }
.cbl-amodal .backdrop { position:absolute; inset:0; background:rgba(0,0,0,.72); backdrop-filter:blur(2px); }
@keyframes cbl-amodal-in { from { opacity:0; transform:translateY(10px) scale(.98); } to { opacity:1; transform:none; } }
.cbl-amodal .panel { position:relative; width:min(560px,100%); max-height:calc(100dvh - 32px); overflow-y:auto; background:#141414; border:1px solid rgba(201,151,66,.4); border-radius:22px 0 22px 0; box-shadow:0 20px 50px rgba(0,0,0,.6); animation:cbl-amodal-in .26s cubic-bezier(.2,.8,.2,1) both; }
@media (prefers-reduced-motion: reduce) { .cbl-amodal .panel { animation:none; } }
.cbl-amodal .shot { position:relative; height:200px; background-size:cover; background-position:center; }
.cbl-amodal .shot::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(20,20,20,0) 45%,rgba(20,20,20,.92)); }
.cbl-amodal .mtags { position:absolute; top:14px; left:14px; display:flex; gap:6px; z-index:2; }
.cbl-amodal .mtag { font-family:${MONO}; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:${GOLD}; background:rgba(0,0,0,.7); padding:5px 10px; border-radius:4px; border:1px solid rgba(201,151,66,.4); }
.cbl-amodal .close { position:absolute; top:12px; right:12px; z-index:3; width:40px; height:40px; border-radius:50%; background:rgba(0,0,0,.82); border:1.5px solid ${GOLD}; color:${GOLD}; cursor:pointer; font-size:18px; line-height:1; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,.5); transition:transform .15s ease, background .15s ease, color .15s ease; }
.cbl-amodal .close:hover { background:${GOLD}; color:#000; transform:scale(1.08); }
.cbl-amodal .close:focus-visible { outline:2px solid ${GOLD}; outline-offset:2px; }
.cbl-amodal .mbody { padding:20px 24px 24px; color:#EDEDED; }
.cbl-amodal h2 { font-family:${DISPLAY}; font-weight:900; font-size:26px; line-height:1.05; letter-spacing:-.01em; text-transform:uppercase; color:#fff; margin:0 0 6px; }
.cbl-amodal .maddr { font-family:${MONO}; font-size:12px; letter-spacing:.05em; color:${GOLD}; margin-bottom:12px; }
.cbl-amodal .mmeta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:14px; font-size:13px; color:#B8B8B8; }
.cbl-amodal .mmeta b { color:#fff; } .cbl-amodal .mopen { color:#8CC084; font-weight:700; }
.cbl-amodal .mdesc { font-size:14.5px; line-height:1.6; color:#C7C7C7; margin-bottom:16px; }
.cbl-amodal .mmap { width:100%; height:230px; border:0; border-radius:12px 0 12px 0; margin-bottom:16px; display:block; background:#0A0A0A; }
.cbl-amodal .mhours, .cbl-amodal .mrev { margin-bottom:16px; padding:12px 14px; background:#0f0f0f; border:1px solid rgba(255,255,255,.07); border-radius:10px; }
.cbl-amodal .mh-label { font-family:${MONO}; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:${GOLD}; margin-bottom:8px; }
.cbl-amodal .mh-row { display:flex; justify-content:space-between; gap:16px; font-size:12.5px; color:#B8B8B8; line-height:1.9; }
.cbl-amodal .mh-row .today { color:#fff; font-weight:700; }
.cbl-amodal .mrev p { margin:0 0 6px; font-size:13.5px; line-height:1.55; color:#D4D4D4; font-style:italic; }
.cbl-amodal .mrev-by { font-family:${MONO}; font-size:11px; color:#888; }
.cbl-amodal .macts { display:flex; gap:10px; flex-wrap:wrap; }
.cbl-amodal .macts a { flex:1 1 140px; text-align:center; text-decoration:none; padding:12px 14px; border-radius:999px; font-family:${DISPLAY}; font-weight:800; font-size:12px; letter-spacing:.08em; text-transform:uppercase; }
.cbl-amodal .macts .primary { background:${GOLD}; color:#000; } .cbl-amodal .macts .primary:hover { background:#DDB15F; }
.cbl-amodal .macts .ghost { background:transparent; border:1.5px solid rgba(255,255,255,.2); color:#fff; } .cbl-amodal .macts .ghost:hover { border-color:${GOLD}; color:${GOLD}; }
`;

function AttractionModal({ a, onClose }: { a: Attraction | null; onClose: () => void }) {
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  useEffect(() => {
    if (!a) {
      setDetails(null);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    let cancelled = false;
    setDetails(null);
    const pid = placeIdOf(a);
    if (pid) {
      fetch(`/api/place-details?place_id=${encodeURIComponent(pid)}`)
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d && d.found) setDetails(d);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [a]);
  if (!a) return null;
  const website = details?.website || null;
  const desc = a.desc || details?.summary || null;
  const openNow = details?.openNow ?? a.open;
  const todayIdx = (new Date().getDay() + 6) % 7; // Google weekday_text is Monday-first
  return (
    <div className="cbl-amodal" role="dialog" aria-modal="true" aria-label={a.name}>
      <style>{AMODAL_CSS}</style>
      <div className="backdrop" onClick={onClose} />
      <div className="panel">
        <div className="shot" style={{ backgroundImage: `url(${a.photo})` }}>
          <div className="mtags">
            <span className="mtag">{CAT_TAG[a.cat]}</span>
          </div>
          <button className="close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="mbody">
          <h2>{a.name}</h2>
          <div className="maddr">{a.address}</div>
          <div className="mmeta">
            {a.rating != null && (
              <>
                <BucketGlyph value={Math.round(a.rating)} />
                <b>{a.rating.toFixed(1)}</b>
              </>
            )}
            {a.reviews ? <span>({a.reviews.toLocaleString()} reviews)</span> : null}
            {openNow && (
              <>
                <span>·</span>
                <span className="mopen">Open Now</span>
              </>
            )}
          </div>
          {desc && <p className="mdesc">{desc}</p>}
          <iframe className="mmap" src={mapEmbed(a)} loading="lazy" title={`Map of ${a.name}`} />
          {details?.hours && details.hours.length > 0 && (
            <div className="mhours">
              <div className="mh-label">Hours</div>
              {details.hours.map((h, i) => {
                const [day, ...rest] = h.split(': ');
                return (
                  <div key={i} className="mh-row">
                    <span className={i === todayIdx ? 'today' : ''}>{day}</span>
                    <span className={i === todayIdx ? 'today' : ''}>{rest.join(': ')}</span>
                  </div>
                );
              })}
            </div>
          )}
          {details?.review && (
            <div className="mrev">
              <div className="mh-label">What people say</div>
              <p>&ldquo;{details.review.text}&rdquo;</p>
              <div className="mrev-by">
                — {details.review.author}
                {details.review.when ? `, ${details.review.when}` : ''}
              </div>
            </div>
          )}
          <div className="macts">
            <a className="primary" href={RIDER_BOOK_URL} target="_blank" rel="noreferrer">
              Book a Ride There →
            </a>
            <a className="ghost" href={gMaps(a)} target="_blank" rel="noreferrer">
              Directions
            </a>
            {website && (
              <a className="ghost" href={website} target="_blank" rel="noreferrer">
                Website
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Footer band: community "suggest a spot" + the attraction/venue sponsorship
// pitch (top placement → /partner-attractions, which carries the tiers).
function SuggestBand() {
  return (
    <section className="band tight" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
      <div className="band-inner">
        <div className="section-eyebrow">add to the list</div>
        <h2 className="section-h2">
          Know a spot? <span className="it">Put it on the map.</span>
        </h2>
        <p style={{ color: '#B0B0B0', fontSize: 15, lineHeight: 1.55, maxWidth: '62ch', margin: '10px 0 0' }}>
          Ratings come live from Google — but the best local picks come from people who actually go.
          Missing your favorite attraction or venue? Tell us. Run one? Get featured up top.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 18,
            marginTop: 30,
          }}
        >
          <div
            style={{
              background: '#141414',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: '18px 0 18px 0',
              padding: '26px 28px',
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#8CC084', marginBottom: 10 }}>
              For members
            </div>
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 22, textTransform: 'uppercase', margin: '0 0 8px', color: '#fff' }}>
              Suggest a spot
            </h3>
            <p style={{ color: '#B0B0B0', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 18px' }}>
              Got a favorite attraction, venue, or hidden gem we&rsquo;re missing? Send it our way — the
              best local picks make the list.
            </p>
            <Link
              to="/contact"
              style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 999, border: `1.5px solid ${GOLD}`, color: GOLD, textDecoration: 'none', fontFamily: DISPLAY, fontWeight: 800, fontSize: 12.5, letterSpacing: '.06em', textTransform: 'uppercase' }}
            >
              Suggest a spot →
            </Link>
          </div>

          <div
            style={{
              background: 'linear-gradient(135deg, rgba(201,151,66,.12), rgba(201,151,66,.03))',
              border: `1px solid ${GOLD}`,
              borderRadius: '18px 0 18px 0',
              padding: '26px 28px',
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: GOLD, marginBottom: 10 }}>
              For attractions &amp; venues
            </div>
            <h3 style={{ fontFamily: DISPLAY, fontWeight: 900, fontSize: 22, textTransform: 'uppercase', margin: '0 0 8px', color: '#fff' }}>
              Get featured — sponsored placement
            </h3>
            <p style={{ color: '#C7C7C7', fontSize: 14.5, lineHeight: 1.6, margin: '0 0 18px' }}>
              Run an attraction, venue, or experience? Partner with CBL for{' '}
              <b style={{ color: '#fff' }}>top placement</b> — sponsored spots appear first — plus
              ticketed bookings and a partner badge.
            </p>
            <Link
              to="/partner-attractions"
              style={{ display: 'inline-block', padding: '12px 26px', borderRadius: 999, background: GOLD, color: '#000', textDecoration: 'none', fontFamily: DISPLAY, fontWeight: 800, fontSize: 12.5, letterSpacing: '.06em', textTransform: 'uppercase' }}
            >
              Partner with CBL →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Attractions() {
  const [cat, setCat] = useState<Category>('ALL');
  const [modalA, setModalA] = useState<Attraction | null>(null);

  const loc = useVisitorLocation();
  // A city the visitor typed into the search box (geocoded). When set, it
  // overrides the auto-detected location; "Near me" clears it back to GPS/IP.
  const [searched, setSearched] = useState<{ city: string; coords: Coords } | null>(null);
  const [searching, setSearching] = useState(false);

  const onSearchCity = async (q: string) => {
    setSearching(true);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`).then((res) => res.json());
      if (r.coord) setSearched({ city: r.city || q, coords: { lat: r.coord[0], lng: r.coord[1] } });
    } catch {
      /* ignore — keep current location */
    } finally {
      setSearching(false);
    }
  };
  const onNearMe = () => {
    setSearched(null);
    loc.requestPrecise(); // GPS: pinpoint the visitor for true closest-first
  };

  // Auto-locate on load so results open to the attractions closest to you.
  // Prompts once for GPS; if declined we keep the instant IP city + "Near me".
  useEffect(() => {
    loc.requestPrecise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCity = searched?.city || loc.city || 'your city';
  // Use the visitor's real coordinates (GPS/IP) so THEIR area sorts first; a
  // searched city overrides with that city's coordinates.
  const coords: Coords | null = searched?.coords || loc.coords;

  const live = useLiveAttractions(coords, cat);
  const weather = useWeather(coords);

  // Live Google results when available; otherwise the curated Pittsburgh seed,
  // so the grid is never empty.
  const fallback = (cat === 'ALL' ? SEED : SEED.filter((s) => s.cat === cat)).map(seedToAttraction);
  const usingLive = !!(live && live.length);
  const list = usingLive ? (live as Attraction[]) : fallback;

  const featured = list[0];
  const rest = list.slice(1);
  const activeLabel = CATS.find((c) => c.key === cat)?.label ?? 'Top Picks';

  return (
    <AttractionModalCtx.Provider value={setModalA}>
    <main className="cbl-attractions">
      <style>{ATTRACTIONS_CSS}</style>
      <Hero />
      <LocationBar
        status={loc.status}
        activeCity={activeCity}
        onSearchCity={onSearchCity}
        onNearMe={onNearMe}
        searching={searching}
      />
      <WeatherStrip weather={weather} city={activeCity} />
      <Filters cat={cat} setCat={setCat} />

      <TopRated items={list} />

      <section className="band">
        <div className="band-inner">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">attractions · near {activeCity}</div>
              <h2 className="section-h2">
                {activeLabel}
                <span className="it">near you</span>
              </h2>
            </div>
            <div className="count">
              <b>{list.length}</b> spots · {activeCity.toUpperCase()}
            </div>
          </div>

          <div className="events-grid">
            {featured && <Spotlight a={featured} />}
            {rest.length > 0 ? (
              rest.map((a) => <EventCard key={a.id} a={a} />)
            ) : !featured ? (
              <div className="empty">
                <h4>
                  Finding attractions <span className="it">near {activeCity}</span>
                </h4>
                <p>
                  {coords
                    ? 'Loading the best-rated things to do nearby…'
                    : 'Turn on location or pick a city above to see what’s near you.'}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <SuggestBand />
      <AttractionModal a={modalA} onClose={() => setModalA(null)} />
    </main>
    </AttractionModalCtx.Provider>
  );
}
