import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { Link } from 'react-router';
import { useVisitorLocation, type Coords, type VisitorLocationStatus } from '../lib/location';
import { PlatformNotice } from '../components/PlatformNotice';

// Great-circle distance in miles — used to order results closest-first.
function milesBetween(a: Coords, b: [number, number]): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a.lat);
  const dLng = toRad(b[1] - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Order restaurants nearest-first when we know the visitor's coordinates;
// otherwise keep the curated order.
function byDistance<T extends { coord: [number, number] }>(list: T[], coords: Coords | null): T[] {
  if (!coords) return list;
  return [...list].sort((x, y) => milesBetween(coords, x.coord) - milesBetween(coords, y.coord));
}

const GOLD = '#C99742';
const DISPLAY = "'Myriad Pro', sans-serif";
const BODY = "'Myriad Pro', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const ITALIC = "'Playfair Display', serif";

const IMG = '/eats/imagery/';
const ICON = '/eats/food-icons/';

// Pittsburgh is the curated home market (hand-picked list + sponsored Square
// Cafe). Everywhere else runs on live Google Places data — real local spots
// with real photos near the visitor — so the page works in any city.
const MARKET_CITY = 'Pittsburgh';
// Pittsburgh metro center + radius — a visitor anywhere in the metro (any
// suburb) gets the curated home-market treatment.
const PGH_CENTER: [number, number] = [40.4406, -79.9959];
const MARKET_RADIUS_MI = 45;
// Coordinates for the manual city picker so choosing a city actually relocates
// the live search (the auto-detected location is used until the visitor searches).
const LOC_CSS = `
.cbl-eats .locbar {
  display:flex; align-items:center; justify-content:center; gap:12px; flex-wrap:wrap;
  padding:11px 20px; background:#0c0c0c; border-bottom:1px solid rgba(201,151,66,.22);
  font-family:${MONO}; font-size:12px; letter-spacing:.06em; color:#B8B8B8;
}
.cbl-eats .locbar .pin { color:${GOLD}; display:inline-flex; }
.cbl-eats .locbar b { color:${GOLD}; font-weight:700; letter-spacing:.04em; }
.cbl-eats .locbar .search { display:inline-flex; align-items:center; gap:6px; background:#141414; border:1px solid rgba(201,151,66,.4); border-radius:999px; padding:4px 5px 4px 14px; }
.cbl-eats .locbar .search:focus-within { border-color:${GOLD}; }
.cbl-eats .locbar .search input { background:transparent; border:0; outline:none; color:#fff; font-family:${MONO}; font-size:12px; letter-spacing:.04em; width:190px; max-width:46vw; }
.cbl-eats .locbar .search input::placeholder { color:#7a7a7a; }
.cbl-eats .locbar .search .go { background:${GOLD}; color:#000; border:0; border-radius:999px; width:26px; height:26px; display:grid; place-items:center; cursor:pointer; flex-shrink:0; }
.cbl-eats .locbar .search .go:hover { background:#DDB15F; }
.cbl-eats .locbar .nearme { display:inline-flex; align-items:center; gap:6px; background:transparent; border:1px solid rgba(201,151,66,.5); border-radius:999px; padding:6px 14px; color:${GOLD}; font-family:${MONO}; font-size:12px; letter-spacing:.04em; cursor:pointer; }
.cbl-eats .locbar .nearme:hover { background:rgba(201,151,66,.1); }
.cbl-eats .locbar .nearme:disabled { opacity:.6; cursor:default; }
.cbl-eats .locbar .note { color:#9a9a9a; }
.cbl-eats .locbar .note b { color:#fff; }
@media (max-width:640px){ .cbl-eats .locbar { font-size:11px; padding:10px 14px; gap:8px; } .cbl-eats .locbar .search input { width:150px; } }

.cbl-eats .city-soon { max-width:640px; margin:0 auto; text-align:center; padding:72px 24px 88px; }
.cbl-eats .city-soon .eyebrow { display:inline-flex; align-items:center; gap:9px; font-family:${MONO}; font-size:12px; letter-spacing:.16em; text-transform:uppercase; color:${GOLD}; margin-bottom:14px; }
.cbl-eats .city-soon h2 { font-family:${DISPLAY}; font-weight:900; font-size:clamp(30px,4vw,46px); line-height:1; text-transform:uppercase; color:#fff; margin:0 0 14px; }
.cbl-eats .city-soon h2 .it { font-family:${ITALIC}; font-style:italic; color:${GOLD}; font-weight:600; text-transform:none; }
.cbl-eats .city-soon p { color:#B0B0B0; font-size:15px; line-height:1.6; margin:0 0 26px; }
.cbl-eats .city-soon .row { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
.cbl-eats .city-soon .btn { display:inline-flex; align-items:center; gap:8px; border-radius:999px; padding:13px 28px; font-family:${DISPLAY}; font-weight:900; font-size:13px; letter-spacing:.12em; text-transform:uppercase; text-decoration:none; }
.cbl-eats .city-soon .btn.gold { background:${GOLD}; color:#000; }
.cbl-eats .city-soon .btn.gold:hover { background:#DDB15F; }
.cbl-eats .city-soon .btn.ghost { background:transparent; color:#fff; border:1.5px solid rgba(255,255,255,.25); }
.cbl-eats .city-soon .btn.ghost:hover { border-color:${GOLD}; color:${GOLD}; }
`;

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
  // Google-backed location autocomplete (via our server-side proxy), same as the
  // Directory. Best-effort — free-typing + submit still works if the API is off.
  const [sug, setSug] = useState<{ mainText: string; secondaryText: string }[]>([]);
  const [openSug, setOpenSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLFormElement>(null);
  const debTimer = useRef<number | undefined>(undefined);
  const reqSeq = useRef(0);
  const fetchSug = (v: string) => {
    window.clearTimeout(debTimer.current);
    if (v.trim().length < 2) { setSug([]); setOpenSug(false); return; }
    debTimer.current = window.setTimeout(async () => {
      const seq = ++reqSeq.current;
      try {
        const res = await fetch(`/api/place-autocomplete?q=${encodeURIComponent(v.trim())}`);
        const data = await res.json();
        if (seq !== reqSeq.current) return;
        const preds = (data.predictions || []).map((pr: { mainText: string; secondaryText: string }) => ({ mainText: pr.mainText, secondaryText: pr.secondaryText }));
        setSug(preds); setOpenSug(preds.length > 0); setActiveIdx(-1);
      } catch { setSug([]); setOpenSug(false); }
    }, 240);
  };
  const pick = (text: string) => {
    setQ(text); setSug([]); setOpenSug(false); setActiveIdx(-1);
    if (text.trim()) onSearchCity(text.trim());
  };
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenSug(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div className="locbar">
      <span className="pin" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </span>
      <span>
        Local spots near <b>{status === 'locating' ? 'you…' : activeCity}</b>
      </span>
      <form
        ref={wrapRef}
        className="search"
        style={{ position: 'relative' }}
        onSubmit={(e) => {
          e.preventDefault();
          if (openSug && activeIdx >= 0 && sug[activeIdx]) pick(sug[activeIdx].mainText);
          else if (q.trim()) onSearchCity(q.trim());
        }}
      >
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); fetchSug(e.target.value); }}
          onFocus={() => { if (sug.length) setOpenSug(true); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setOpenSug(true); setActiveIdx((i) => Math.min(i + 1, sug.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
            else if (e.key === 'Escape') { setOpenSug(false); }
          }}
          placeholder="Search a city or town…"
          aria-label="Search a city or town"
          role="combobox"
          aria-expanded={openSug}
          aria-autocomplete="list"
          autoComplete="off"
        />
        <button type="submit" className="go" aria-label="Search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
        {openSug && sug.length > 0 && (
          <ul
            role="listbox"
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', left: 0, minWidth: 240, zIndex: 50,
              listStyle: 'none', margin: 0, padding: 6, background: '#141414',
              border: '1px solid rgba(201,151,66,.4)', borderRadius: 14, boxShadow: '0 14px 34px rgba(0,0,0,.5)',
            }}
          >
            {sug.map((s, i) => (
              <li
                key={s.mainText + i}
                role="option"
                aria-selected={i === activeIdx}
                onMouseDown={(e) => { e.preventDefault(); pick(s.mainText); }}
                onMouseEnter={() => setActiveIdx(i)}
                style={{ display: 'flex', flexDirection: 'column', gap: 1, padding: '8px 12px', borderRadius: 9, cursor: 'pointer', background: i === activeIdx ? 'rgba(201,151,66,.14)' : 'transparent' }}
              >
                <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: DISPLAY }}>{s.mainText}</span>
                {s.secondaryText && <span style={{ color: '#8f8f8f', fontSize: 11, fontFamily: DISPLAY }}>{s.secondaryText}</span>}
              </li>
            ))}
          </ul>
        )}
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
  /** Tighter blurb for the mobile sponsored card, where vertical space is scarce. */
  shortDescription?: string;
  /** One-line address for the mobile sponsored card (street + neighborhood). */
  shortAddress?: string;
  image: string;
  coord: [number, number]; // [lat, lng]
  /** Optional real links for a sponsored/curated partner's action buttons. */
  website?: string;
  phone?: string;
  reservable?: boolean; // false → walk-in only (hide Reserve). undefined → reservable unless cuisine is only coffee/bakery/dessert
  reserveUrl?: string; // direct OpenTable/Resy page; else we search OpenTable by name+location
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
    cuisine: ['AMERICAN', 'COFFEE', 'BREAKFAST'],
    description:
      "Square Cafe is a bright, welcoming spot in Pittsburgh's East Liberty neighborhood serving fresh, seasonal dishes made with local ingredients. From creative breakfast plates to flavorful lunches, everything is made with care and a focus on quality.",
    shortDescription:
      'A bright, welcoming East Liberty spot serving fresh, seasonal dishes made with local ingredients.',
    shortAddress: '134 S Highland Ave · East Liberty',
    image: IMG + 'sq-plate.jpg',
    coord: [40.46008, -79.92513],
    website: 'https://square-cafe.com/', // Square Cafe is walk-in only (no online reservations)
    reservable: false,
    phone: '+14122448002',
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
    coord: [40.534, -80.01],
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
    coord: [40.49455, -80.01179],
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
    coord: [40.49455, -80.01179],
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
    coord: [40.45068, -79.98546],
  },
  {
    id: 'tessaros',
    name: "Tessaro's",
    rating: 4.7,
    reviews: 1240,
    price: '$$',
    open: true,
    address: '4601 Liberty Ave, Bloomfield, Pittsburgh',
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['BURGERS', 'AMERICAN'],
    description:
      "Family-run Bloomfield tavern with an in-house butcher — locals swear it's the best hardwood-grilled burger in the city.",
    image: IMG + 'tessaros.jpg',
    coord: [40.46273, -79.95071],
  },
  {
    id: 'chengdu-gourmet',
    name: 'Chengdu Gourmet',
    rating: 4.6,
    reviews: 870,
    price: '$$',
    open: true,
    address: '5840 Forbes Ave, Squirrel Hill, Pittsburgh',
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['CHINESE'],
    description:
      "Chef Wei Zhu's fiery, peppercorn-laced Sichuan cooking — the real-deal benchmark locals send every out-of-towner to.",
    image: IMG + 'chengdu-gourmet.jpg',
    coord: [40.43807, -79.92257],
  },
  {
    id: 'umami',
    name: 'Umami',
    rating: 4.6,
    reviews: 640,
    price: '$$$',
    open: true,
    address: '202 38th St, Lawrenceville, Pittsburgh',
    meal: ['DINNER'],
    cuisine: ['JAPANESE', 'SUSHI'],
    description:
      'A moody Lawrenceville izakaya pairing robata skewers and one of the city’s best sushi menus with serious cocktails.',
    image: IMG + 'umami.jpg',
    coord: [40.46671, -79.96426],
  },
  {
    id: 'senyai-thai',
    name: 'Senyai Thai Kitchen',
    rating: 4.6,
    reviews: 720,
    price: '$$',
    open: true,
    address: '5719 Centre Ave, Shadyside, Pittsburgh',
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['THAI'],
    description:
      "Chef Tu cooks her mother's Bangkok recipes with grace; the boat noodles and curries keep Shadyside coming back.",
    image: IMG + 'senyai-thai.jpg',
    coord: [40.45795, -79.93205],
  },
  {
    id: 'green-pepper',
    name: 'Green Pepper',
    rating: 4.5,
    reviews: 530,
    price: '$$',
    open: true,
    address: '2020 Murray Ave, Squirrel Hill, Pittsburgh',
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['KOREAN'],
    description:
      'A cozy, longtime Squirrel Hill favorite for bibimbap, bulgogi and bubbling stone-bowl comfort food.',
    image: IMG + 'green-pepper.jpg',
    coord: [40.43849, -79.92299],
  },
  {
    id: 'trams-kitchen',
    name: "Tram's Kitchen",
    rating: 4.6,
    reviews: 690,
    price: '$',
    open: true,
    address: '4050 Penn Ave, Bloomfield, Pittsburgh',
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['VIETNAMESE'],
    description:
      'A no-frills Bloomfield staple whose pho and banh mi have quietly earned a fierce local following for years.',
    image: IMG + 'trams-kitchen.jpg',
    coord: [40.46543, -79.95597],
  },
  {
    id: 'all-india',
    name: 'All India',
    rating: 4.5,
    reviews: 610,
    price: '$$',
    open: true,
    address: '315 N Craig St, North Oakland, Pittsburgh',
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['INDIAN'],
    description:
      'A Craig Street favorite blending North and South Indian, with fresh-ground spices and a beloved dosa lineup.',
    image: IMG + 'all-india.jpg',
    coord: [40.4522, -79.95267],
  },
  {
    id: 'luke-wholeys',
    name: "Luke Wholey's Wild Alaskan Grille",
    rating: 4.4,
    reviews: 980,
    price: '$$$',
    open: true,
    address: '2106 Penn Ave, Strip District, Pittsburgh',
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['SEAFOOD'],
    description:
      'The Wholey family’s riverside Strip spot for wild Alaskan salmon and king crab — casual, but seriously fresh.',
    image: IMG + 'luke-wholeys.jpg',
    coord: [40.45173, -79.98289],
  },
  {
    id: 'apteka',
    name: 'Apteka',
    rating: 4.8,
    reviews: 1130,
    price: '$$',
    open: true,
    address: '4606 Penn Ave, Bloomfield, Pittsburgh',
    meal: ['DINNER'],
    cuisine: ['VEGETARIAN', 'VEGAN'],
    description:
      'All-vegan Eastern European cooking so good the national press took notice; the pierogi are essential.',
    image: IMG + 'apteka.jpg',
    coord: [40.46573, -79.94931],
  },
  {
    id: 'carson-street-deli',
    name: 'Carson Street Deli',
    rating: 4.5,
    reviews: 410,
    price: '$',
    open: true,
    address: '1507 E Carson St, South Side, Pittsburgh',
    meal: ['LUNCH'],
    cuisine: ['SANDWICHES'],
    description:
      'A South Side counter beloved for overstuffed sandwiches and a rotating wall of local craft taps.',
    image: IMG + 'carson-street-deli.jpg',
    coord: [40.42903, -79.98303],
  },
  {
    id: 'tazza-doro',
    name: "Tazza D'Oro",
    rating: 4.7,
    reviews: 560,
    price: '$',
    open: true,
    address: '1125 N Highland Ave, Highland Park, Pittsburgh',
    meal: ['BREAKFAST', 'LUNCH'],
    cuisine: ['COFFEE'],
    description:
      "Amy Enrico's warm Highland Park cafe has been the neighborhood's living room since 1999.",
    image: IMG + 'tazza-doro.jpg',
    coord: [40.4747, -79.91885],
  },
  {
    id: 'pamelas-diner',
    name: "Pamela's Diner",
    rating: 4.6,
    reviews: 1890,
    price: '$',
    open: true,
    address: '60 21st St, Strip District, Pittsburgh',
    meal: ['BREAKFAST', 'LUNCH'],
    cuisine: ['AMERICAN', 'BREAKFAST'],
    description:
      'Crepe-thin, crispy-edged hotcakes so iconic that presidents have eaten them — the definitive Pittsburgh breakfast.',
    image: IMG + 'pamelas-diner.jpg',
    coord: [40.45197, -79.98363],
  },
  {
    id: 'prantls',
    name: "Prantl's Bakery",
    rating: 4.8,
    reviews: 1450,
    price: '$',
    open: true,
    address: '5525 Walnut St, Shadyside, Pittsburgh',
    meal: ['DESSERT'],
    cuisine: ['COFFEE', 'BAKERY', 'DESSERT'],
    description:
      'Home of the legendary Burnt Almond Torte, once crowned "best cake in America" — a Pittsburgh celebration staple.',
    image: IMG + 'prantls.jpg',
    coord: [40.45156, -79.9329],
  },
  {
    id: 'pages-dairy-mart',
    name: 'Page Dairy Mart',
    rating: 4.7,
    reviews: 980,
    price: '$',
    open: true,
    address: '4112 E Carson St, South Side, Pittsburgh',
    meal: ['DESSERT'],
    cuisine: ['AMERICAN', 'DESSERT'],
    description:
      'A seasonal walk-up window since 1951 where South Siders line up for soft serve and Yinzer sundaes.',
    image: IMG + 'pages-dairy-mart.jpg',
    coord: [40.41117, -79.95583],
  },

  {
    id: 'everyday-noodles',
    name: "Everyday Noodles",
    rating: 4.6,
    reviews: 1240,
    price: '$$',
    open: true,
    address: "5867-5873 Forbes Avenue, Squirrel Hill North, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['CHINESE'],
    description: "Xiao long bao and hand-pulled noodles made right in the window — a Squirrel Hill must.",
    image: IMG + 'chengdu-gourmet.jpg',
    coord: [40.4382, -79.92011],
  },
  {
    id: 'how-lee',
    name: "How Lee",
    rating: 4.4,
    reviews: 690,
    price: '$$',
    open: true,
    address: "1704 Shady Avenue, Squirrel Hill South, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['CHINESE'],
    description: "Fiery, no-frills Sichuan locals swear by for cumin lamb and dry pots.",
    image: IMG + 'chengdu-gourmet.jpg',
    coord: [40.43792, -79.91948],
  },
  {
    id: 'chinatown-inn',
    name: "Chinatown Inn",
    rating: 4.3,
    reviews: 540,
    price: '$$',
    open: true,
    address: "520 Third Avenue, Chinatown, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['CHINESE'],
    description: "Pittsburgh's classic Chinatown holdout, doing Cantonese comfort for decades.",
    image: IMG + 'chengdu-gourmet.jpg',
    coord: [40.43709, -79.99733],
  },
  {
    id: 'nakama',
    name: "Nakama Japanese Steakhouse",
    rating: 4.5,
    reviews: 3100,
    price: '$$$',
    open: true,
    address: "1611 East Carson Street, South Side Flats, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['JAPANESE', 'SUSHI'],
    description: "Hibachi theatrics and a deep sushi list — a South Side date-night staple.",
    image: IMG + 'umami.jpg',
    coord: [40.42907, -79.98222],
  },
  {
    id: 'sushi-too',
    name: "Sushi Too",
    rating: 4.3,
    reviews: 780,
    price: '$$',
    open: true,
    address: "Walnut Street, Shadyside, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['JAPANESE', 'SUSHI'],
    description: "Shadyside standby with generous rolls and a lively bar.",
    image: IMG + 'umami.jpg',
    coord: [40.4509, -79.93425],
  },
  {
    id: 'smiling-banana-leaf',
    name: "Smiling Banana Leaf",
    rating: 4.6,
    reviews: 1120,
    price: '$$',
    open: true,
    address: "5901 Bryant Street, Highland Park, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['THAI'],
    description: "Highland Park neighborhood favorite; the drunken noodles have a following.",
    image: IMG + 'senyai-thai.jpg',
    coord: [40.47577, -79.91965],
  },
  {
    id: 'tako',
    name: "täkō",
    rating: 4.5,
    reviews: 1600,
    price: '$$$',
    open: true,
    address: "6th Street, Cultural District, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['MEXICAN', 'TACOS'],
    description: "Downtown's upscale taqueria — creative tacos and a serious margarita program.",
    image: IMG + 'mm-patio.jpg',
    coord: [40.4423, -80.00212],
  },
  {
    id: 'reyna-foods',
    name: "Reyna Foods",
    rating: 4.6,
    reviews: 720,
    price: '$',
    open: true,
    address: "Penn Avenue, Strip District, Pittsburgh",
    meal: ['BREAKFAST', 'LUNCH'],
    cuisine: ['MEXICAN', 'TACOS'],
    description: "Strip District mercado with a taqueria counter locals line up for.",
    image: IMG + 'mm-patio.jpg',
    coord: [40.45165, -79.98338],
  },
  {
    id: 'mineos',
    name: "Mineo's Pizza House",
    rating: 4.4,
    reviews: 1900,
    price: '$',
    open: true,
    address: "2130 Murray Avenue, Squirrel Hill South, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['PIZZA', 'ITALIAN'],
    description: "The Murray Ave institution — half of Pittsburgh's 'best slice' argument.",
    image: IMG + 'iv-pies.jpg',
    coord: [40.43295, -79.92321],
  },
  {
    id: 'aiellos',
    name: "Aiello's Pizza",
    rating: 4.3,
    reviews: 1500,
    price: '$',
    open: true,
    address: "Murray Avenue, Squirrel Hill South, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['PIZZA', 'ITALIAN'],
    description: "The other half of that argument, right next door on Murray.",
    image: IMG + 'iv-pies.jpg',
    coord: [40.43327, -79.92316],
  },
  {
    id: 'dianoias',
    name: "DiAnoia's Eatery",
    rating: 4.6,
    reviews: 2400,
    price: '$$$',
    open: true,
    address: "2549 Penn Avenue, Strip District, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['ITALIAN'],
    description: "Strip District trattoria beloved for house pasta and porchetta.",
    image: IMG + 'iv-pies.jpg',
    coord: [40.45487, -79.97877],
  },
  {
    id: 'girasole',
    name: "Girasole",
    rating: 4.5,
    reviews: 560,
    price: '$$$',
    open: true,
    address: "733 Copeland Street, Shadyside, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['ITALIAN'],
    description: "Cozy Shadyside spot for handmade Italian.",
    image: IMG + 'iv-pies.jpg',
    coord: [40.45116, -79.93473],
  },
  {
    id: 'piccolo-forno',
    name: "Piccolo Forno",
    rating: 4.5,
    reviews: 780,
    price: '$$',
    open: true,
    address: "3801 Butler Street, Lower Lawrenceville, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['ITALIAN'],
    description: "Lawrenceville's northern-Italian charmer with a wood oven.",
    image: IMG + 'iv-pies.jpg',
    coord: [40.467, -79.96439],
  },
  {
    id: 'onion-maiden',
    name: "Onion Maiden",
    rating: 4.7,
    reviews: 640,
    price: '$$',
    open: true,
    address: "639 East Warrington Avenue, Allentown, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['VEGETARIAN', 'VEGAN'],
    description: "Metal-themed all-vegan kitchen in Allentown with a cult following.",
    image: IMG + 'apteka.jpg',
    coord: [40.42188, -79.99593],
  },
  {
    id: 'b52-cafe',
    name: "B52 Cafe",
    rating: 4.5,
    reviews: 900,
    price: '$$',
    open: true,
    address: "279 Fisk Street, Central Lawrenceville, Pittsburgh",
    meal: ['BREAKFAST', 'LUNCH'],
    cuisine: ['VEGETARIAN', 'VEGAN'],
    description: "Vegan Middle Eastern in Lawrenceville; the falafel converts skeptics.",
    image: IMG + 'apteka.jpg',
    coord: [40.46759, -79.95908],
  },
  {
    id: 'la-prima',
    name: "La Prima Espresso",
    rating: 4.7,
    reviews: 680,
    price: '$',
    open: true,
    address: "1100 Smallman Street, Strip District, Pittsburgh",
    meal: ['BREAKFAST', 'LUNCH'],
    cuisine: ['COFFEE', 'BREAKFAST'],
    description: "Strip District espresso bar pulling old-world shots for decades.",
    image: IMG + 'tazza-doro.jpg',
    coord: [40.44557, -79.99384],
  },
  {
    id: 'commonplace-sq-hill',
    name: "Commonplace Coffee",
    rating: 4.5,
    reviews: 430,
    price: '$',
    open: true,
    address: "5827 Forbes Avenue, Squirrel Hill North, Pittsburgh",
    meal: ['BREAKFAST', 'LUNCH'],
    cuisine: ['COFFEE', 'BREAKFAST'],
    description: "Local roaster's airy Squirrel Hill cafe.",
    image: IMG + 'tazza-doro.jpg',
    coord: [40.43819, -79.9219],
  },
  {
    id: 'delucas',
    name: "DeLuca's",
    rating: 4.6,
    reviews: 3400,
    price: '$$',
    open: true,
    address: "Mulberry Way, Strip District, Pittsburgh",
    meal: ['BREAKFAST', 'LUNCH'],
    cuisine: ['AMERICAN', 'BREAKFAST'],
    description: "The Strip's line-out-the-door breakfast institution.",
    image: IMG + 'pamelas-diner.jpg',
    coord: [40.45156, -79.98376],
  },
  {
    id: 'little-tokyo',
    name: "Little Tokyo",
    rating: 4.4,
    reviews: 410,
    price: '$$',
    open: true,
    address: "5850 Forbes Avenue, Squirrel Hill South, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['JAPANESE', 'SUSHI'],
    description: "Tucked-away Squirrel Hill spot for tidy nigiri and bento.",
    image: IMG + 'umami.jpg',
    coord: [40.4378, -79.921],
  },
  {
    id: 'pusadees-garden',
    name: "Pusadee's Garden",
    rating: 4.7,
    reviews: 900,
    price: '$$$',
    open: true,
    address: "5321 Butler Street, Upper Lawrenceville, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['THAI'],
    description: "Garden-set Lawrenceville gem plating refined, family-recipe Thai.",
    image: IMG + 'senyai-thai.jpg',
    coord: [40.48239, -79.95221],
  },
  {
    id: 'nickys-thai',
    name: "Nicky's Thai Kitchen",
    rating: 4.4,
    reviews: 1350,
    price: '$$',
    open: true,
    address: "856 Western Avenue, Allegheny West, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['THAI'],
    description: "North Side go-to with a patio and a big, dependable menu.",
    image: IMG + 'senyai-thai.jpg',
    coord: [40.45223, -80.01625],
  },
  {
    id: 'round-corner-cantina',
    name: "Round Corner Cantina",
    rating: 4.4,
    reviews: 860,
    price: '$$',
    open: true,
    address: "3720 Butler Street, Lower Lawrenceville, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['MEXICAN', 'TACOS'],
    description: "Lawrenceville cantina for street tacos and mezcal on the patio.",
    image: IMG + 'mm-patio.jpg',
    coord: [40.46673, -79.96428],
  },
  {
    id: 'caliente',
    name: "Caliente Pizza & Draft House",
    rating: 4.5,
    reviews: 1200,
    price: '$$',
    open: true,
    address: "4623 Liberty Avenue, Bloomfield, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['PIZZA'],
    description: "Award-winning pies and a huge draft list in Bloomfield.",
    image: IMG + 'iv-pies.jpg',
    coord: [40.46233, -79.95013],
  },
  {
    id: 'wholeys',
    name: "Wholey's",
    rating: 4.6,
    reviews: 2100,
    price: '$$',
    open: true,
    address: "1711 Penn Avenue, Strip District, Pittsburgh",
    meal: ['BREAKFAST', 'LUNCH'],
    cuisine: ['SEAFOOD'],
    description: "The Strip's legendary fish market and counter for over a century.",
    image: IMG + 'luke-wholeys.jpg',
    coord: [40.45004, -79.986],
  },
  {
    id: 'wingharts',
    name: "Winghart's Burger & Whiskey Bar",
    rating: 4.4,
    reviews: 1100,
    price: '$$',
    open: true,
    address: "Market Square, Fifth & Forbes, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['BURGERS', 'AMERICAN'],
    description: "Market Square burgers-and-whiskey tucked down an alley.",
    image: IMG + 'tessaros.jpg',
    coord: [40.44073, -80.00256],
  },
  {
    id: 'franktuary',
    name: "Franktuary",
    rating: 4.5,
    reviews: 780,
    price: '$$',
    open: true,
    address: "3810 Butler Street, Lower Lawrenceville, Pittsburgh",
    meal: ['LUNCH', 'DINNER'],
    cuisine: ['BURGERS', 'AMERICAN'],
    description: "Lawrenceville favorite for creative dogs, burgers and local drafts.",
    image: IMG + 'tessaros.jpg',
    coord: [40.46695, -79.96403],
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
  // Breakfast / dessert-appropriate types (shown only on those meal tabs)
  BREAKFAST: 'breakfast.svg',
  BAKERY: 'french-food.svg',
  DESSERT: 'cake.svg',
  // Dietary filters — shown across every meal (they cut across cuisines)
  VEGAN: 'vegan.svg',
  'GLUTEN-FREE': 'gluten-free.svg',
};

// Dietary filters appended to every meal's chip list.
const DIETARY = ['VEGAN', 'GLUTEN-FREE'];

// Which cuisines make sense per meal. Breakfast and dessert are curated so we
// don't surface Seafood/Sushi at 8am; lunch & dinner keep the full list.
const FULL_CUISINES = [
  'TACOS', 'PIZZA', 'CHINESE', 'VEGETARIAN', 'SUSHI', 'THAI', 'AMERICAN', 'SEAFOOD',
  'BURGERS', 'ITALIAN', 'COFFEE', 'SANDWICHES', 'KOREAN', 'JAPANESE', 'VIETNAMESE', 'INDIAN', 'MEXICAN',
];
// Don't repeat the meal name as a cuisine ("ALL" already means all breakfast /
// all dessert on those tabs). Vegan/Gluten-Free are appended to every meal.
const BREAKFAST_CUISINES = ['COFFEE', 'BAKERY', 'AMERICAN', 'VEGETARIAN'];
const DESSERT_CUISINES = ['BAKERY', 'COFFEE'];
function cuisineListForMeal(m: string): string[] {
  const base = m === 'BREAKFAST' ? BREAKFAST_CUISINES : m === 'DESSERT' ? DESSERT_CUISINES : FULL_CUISINES;
  return [...base, ...DIETARY];
}

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
.cbl-eats .hero-inner { display:grid; grid-template-columns:1fr; gap:0; align-items:start; max-width:1280px; margin:0 auto; position:relative; z-index:2; }
.cbl-eats .hero-streams { position:absolute; inset:0; z-index:1; pointer-events:none; }
.cbl-eats .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em; font-weight:700;
  color:#fff; text-transform:lowercase; margin-bottom:10px;
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
/* Desktop/tablet: float the icon so it doesn't inflate the title row — the
   eyebrow/title/subtitle/lede line up with the Affiliates & About heroes.
   Anchored to the full-width .hero-title-row (the h1 itself shrinks to its
   text width here), so the icon sits at the hero's right edge, not over the
   text. Below 721px the mobile rule positions the icon instead. */
@media (min-width:721px){
  .cbl-eats .hero-title-row .fork-knife {
    position:absolute; right:0; top:50%; transform:translateY(-50%); margin:0;
  }
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
@media (max-width:720px){
  .cbl-eats h1.hero-title { display:flex; flex-wrap:nowrap; position:relative; gap:0; align-items:flex-start; font-size:clamp(30px,8vw,44px); }
  .cbl-eats h1.hero-title .title-stack { min-width:0; flex:1; }
  .cbl-eats h1.hero-title .title-stack > span:first-child { display:block; padding-right:64px; }
  .cbl-eats h1.hero-title .fork-knife { display:flex; position:absolute; top:0; right:0; width:56px; height:56px; }
  .cbl-eats .hero-subtitle { flex-wrap:nowrap; white-space:nowrap; font-size:clamp(20px,5.4vw,27px); }
  .cbl-eats .eyebrow { display:block; white-space:normal; overflow-wrap:break-word; max-width:100%; font-size:11px; letter-spacing:.08em; line-height:1.4; }
  .cbl-eats .eyebrow::before { display:inline-block; vertical-align:middle; margin-right:10px; }
}
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

.cbl-eats .results { max-width:1376px; margin:0 auto; padding:36px 48px 64px; }
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
.cbl-eats .card .cta-row { display:flex; gap:10px; margin-top:14px; flex-wrap:wrap; }
.cbl-eats .card .cta {
  flex:1 1 130px; background:#C99742; border:0; color:#fff; padding:12px 6px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800; font-size:12px; letter-spacing:.06em; white-space:nowrap;
  text-transform:uppercase; transition:background .2s; cursor:pointer;
}
.cbl-eats .card a.cta { display:flex; align-items:center; justify-content:center; text-decoration:none; }
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
const MOBILE_MEALS = ['BREAKFAST', 'LUNCH', 'DINNER', 'DESSERT'];

const titleCase = (s: string) =>
  s.split('-').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join('-');

// Cuisines that actually have a restaurant for a given meal. Used to limit the
// cuisine chips so we never offer e.g. "Tacos" under Breakfast. ('ALL' meal =
// every populated cuisine.)
function cuisinesForMeal(m: string): Set<string> {
  return new Set(cuisineListForMeal(m));
}

// External actions for the cards. "More Info" and "View on Map" work for every
// card straight from name+address+coords (no backend). "Reserve a Table" routes
// to OpenTable (searching the spot by name near its coords); a per-partner
// `reserveUrl` (direct OpenTable/Resy page) overrides. "View Menu" → the
// partner's site, else a Google menu search. (Rich per-card website/reservable
// for the LIVE Google listings would need a Google Place Details call — a small
// backend add; see SAAS/EATS handoff notes.)
// Live Google listings carry a `g-`-prefixed place_id (see useLivePlaces); the
// curated seed uses plain slugs. Returns the real place_id or null.
const placeIdOf = (r: Restaurant) => {
  const id = r.id.replace(/^g-/, '');
  return /^ChI/.test(id) ? id : null;
};
const reserveUrlFor = (r: Restaurant) =>
  r.reserveUrl || `https://www.opentable.com/s?term=${encodeURIComponent(r.name)}&latitude=${r.coord[0]}&longitude=${r.coord[1]}`;

// Show "Reserve a Table" (→ OpenTable) on sit-down spots. Hidden for explicit
// walk-ins (reservable:false) and counter-service-only cuisines (coffee/bakery/
// dessert). A direct reserveUrl always wins. Live Google listings default in.
const NON_RESERVABLE = new Set(['COFFEE', 'BAKERY', 'DESSERT']);
const canReserve = (r: Restaurant) =>
  !!r.reserveUrl || (r.reservable !== false && !r.cuisine.every((c) => NON_RESERVABLE.has(c)));
// Keyless interactive Google map embed (no API key needed / exposed).
const mapEmbed = (r: Restaurant) => `https://maps.google.com/maps?q=${encodeURIComponent(`${r.name}, ${r.address}`)}&z=15&output=embed`;
// Lets any card open the on-site detail panel instead of leaving for Google.
const EatsModalCtx = createContext<(r: Restaurant) => void>(() => {});

// ── Desktop pieces ──────────────────────────────────────────────────────────
function RestaurantCard({ r }: { r: Restaurant }) {
  const openModal = useContext(EatsModalCtx);
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
          {canReserve(r) && (
            <a className="cta" href={reserveUrlFor(r)} target="_blank" rel="noopener noreferrer">
              Book on OpenTable
            </a>
          )}
          <button className={'cta' + (canReserve(r) ? ' ghost' : '')} onClick={() => openModal(r)}>
            More Info
          </button>
        </div>
      </div>
    </article>
  );
}

function Spotlight({ r }: { r: Restaurant }) {
  const openModal = useContext(EatsModalCtx);
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
            {canReserve(r) && (
              <a
                className="cta"
                style={{ padding: '14px 28px', flex: '0 0 auto' }}
                href={reserveUrlFor(r)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Book on OpenTable
              </a>
            )}
            <button
              className={'cta' + (canReserve(r) ? ' ghost' : '')}
              style={{ padding: '14px 28px', flex: '0 0 auto' }}
              onClick={() => openModal(r)}
            >
              More Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Live Google Places layer (real listings + real photos near the visitor) ──
// Falls back to the curated seed whenever the API isn't configured or returns
// nothing, so the page is always populated.
const LIVE_KEYWORD: Record<string, string> = {
  ALL: 'restaurants', TACOS: 'tacos', PIZZA: 'pizza', CHINESE: 'chinese', VEGETARIAN: 'vegetarian vegan',
  SUSHI: 'sushi', THAI: 'thai', AMERICAN: 'american restaurant', SEAFOOD: 'seafood', BURGERS: 'burgers',
  ITALIAN: 'italian', COFFEE: 'coffee', SANDWICHES: 'sandwiches deli', KOREAN: 'korean', JAPANESE: 'japanese',
  VIETNAMESE: 'vietnamese', INDIAN: 'indian', MEXICAN: 'mexican',
  BREAKFAST: 'breakfast', BAKERY: 'bakery pastries', DESSERT: 'dessert',
  VEGAN: 'vegan', 'GLUTEN-FREE': 'gluten free',
};
const LIVE_MEAL_KEYWORD: Record<string, string> = { BREAKFAST: 'breakfast', DESSERT: 'dessert bakery' };
const LIVE_FALLBACK_IMG: Record<string, string> = {
  CHINESE: 'chengdu-gourmet.jpg', SUSHI: 'umami.jpg', JAPANESE: 'umami.jpg', THAI: 'senyai-thai.jpg',
  PIZZA: 'iv-pies.jpg', ITALIAN: 'iv-pies.jpg', TACOS: 'mm-patio.jpg', MEXICAN: 'mm-patio.jpg',
  COFFEE: 'tazza-doro.jpg', SEAFOOD: 'luke-wholeys.jpg', BURGERS: 'tessaros.jpg', VEGETARIAN: 'apteka.jpg',
  KOREAN: 'green-pepper.jpg', VIETNAMESE: 'trams-kitchen.jpg', INDIAN: 'all-india.jpg', SANDWICHES: 'carson-street-deli.jpg',
};

function liveKeyword(meal: string, cuisine: string | null): string {
  if (cuisine && cuisine !== 'ALL') return LIVE_KEYWORD[cuisine] || cuisine.toLowerCase();
  if (meal && meal !== 'ALL' && LIVE_MEAL_KEYWORD[meal]) return LIVE_MEAL_KEYWORD[meal];
  return 'restaurants';
}

const liveCache = new Map<string, Restaurant[]>();

function useLivePlaces(coords: Coords | null, enabled: boolean, meal: string, cuisine: string | null): Restaurant[] | null {
  const [live, setLive] = useState<Restaurant[] | null>(null);
  const kw = liveKeyword(meal, cuisine);
  const tag = cuisine && cuisine !== 'ALL' ? cuisine : 'AMERICAN';
  useEffect(() => {
    if (!enabled || !coords) {
      setLive(null);
      return;
    }
    const cacheKey = `${kw}@${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
    const cached = liveCache.get(cacheKey);
    if (cached) {
      setLive(cached);
      return;
    }
    let cancelled = false;
    fetch(`/api/places?lat=${coords.lat}&lng=${coords.lng}&keyword=${encodeURIComponent(kw)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d.configured || !d.results?.length) {
          setLive(null);
          return;
        }
        const mapped: Restaurant[] = d.results
          .filter((p: { coord?: [number, number] }) => p.coord && p.coord[0] != null)
          .map((p: { id: string; name: string; rating: number | null; reviews: number; price: string; open: boolean | null; address: string; coord: [number, number]; photo: string | null }) => ({
            id: 'g-' + p.id,
            name: p.name,
            rating: p.rating ?? 4.5,
            reviews: p.reviews ?? 0,
            price: p.price || '$$',
            open: p.open ?? true,
            address: p.address,
            meal: ['BREAKFAST', 'LUNCH', 'DINNER', 'DESSERT'],
            cuisine: [tag],
            description: p.reviews
              ? `${p.reviews.toLocaleString()} local reviews · rated ${p.rating ?? '—'}★ nearby.`
              : 'Popular local spot near you.',
            image: p.photo || IMG + (LIVE_FALLBACK_IMG[tag] || 'sq-plate.jpg'),
            coord: p.coord,
          }));
        liveCache.set(cacheKey, mapped);
        setLive(mapped);
      })
      .catch(() => {
        if (!cancelled) setLive(null);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, coords?.lat, coords?.lng, kw, tag]);
  return live;
}

function DesktopEats({
  meal,
  setMeal,
  cuisine,
  setCuisine,
  inPittsburgh,
  city,
  coords,
}: {
  meal: string;
  setMeal: (m: string) => void;
  cuisine: string;
  setCuisine: (c: string) => void;
  inPittsburgh: boolean;
  city: string;
  coords: Coords | null;
}) {
  const live = useLivePlaces(coords, !!coords, meal, cuisine);
  // Curated seed + sponsored Square Cafe are the Pittsburgh home-market feature;
  // everywhere else runs on the live Google results only.
  const filtered = inPittsburgh
    ? RESTAURANTS.filter(
        (r) => (meal === 'ALL' || r.meal.includes(meal)) && (cuisine === 'ALL' || r.cuisine.includes(cuisine)),
      )
    : [];
  const featured = inPittsburgh ? filtered.find((r) => r.sponsored) || RESTAURANTS.find((r) => r.sponsored) : undefined;
  const featuredShown = !!featured && filtered.some((r) => r.id === featured.id);
  // Live Google results (real photos/ratings) when available; else curated seed
  // — either way, ordered closest-to-you first.
  const rest = byDistance(live ?? filtered.filter((r) => !r.sponsored), coords);

  return (
    <div className="cbl-eats-desktop">
      {/* HERO */}
      <section className="hero cbl-light-streams">
        {/* first child = dedicated streak layer (hosts 2 of the 4 light streams), under the copy */}
        <div className="hero-streams" aria-hidden="true" />
        <div className="hero-inner">
          <div>
            <div className="eyebrow">what&rsquo;s on your list tonight?</div>
            <div className="hero-title-row">
              <h1 className="hero-title">
                <span className="title-stack">
                  <span className="eats">Eats &amp; Drinks</span>
                  <span className="hero-subtitle">
                    <span>Restaurants</span>
                    <span className="it">{inPittsburgh ? 'picked by Pittsburgh' : `top spots near ${city}`}</span>
                  </span>
                </span>
                <span className="fork-knife" aria-hidden="true" />
              </h1>
            </div>
            <p className="lede">
              {inPittsburgh
                ? 'Real picks from the drivers, bartenders and regulars who live here. No sponsored lists, no recycled top-tens — just the rooms, plates and bar stools our team keeps coming back to.'
                : `The best-reviewed restaurants, cafes and bars right around ${city} — pulled live and sorted by what's closest to you.`}
            </p>
          </div>
        </div>
      </section>

      {(
        <>
      {/* FILTERS */}
      <div className="filters">
        <div className="filters-inner">
          <div className="meal-row">
            {DESKTOP_MEALS.map((m) => (
              <button
                key={m}
                className={'meal-btn' + (meal === m ? ' active' : '')}
                onClick={() => {
                  if (cuisine !== 'ALL' && !cuisinesForMeal(m).has(cuisine)) setCuisine('ALL');
                  setMeal(m);
                }}
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
            {['ALL', ...cuisineListForMeal(meal)].map((c) => {
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
            <b>{(featuredShown ? 1 : 0) + rest.length}</b> places · {city.toUpperCase()}
          </div>
        </div>

        <div className="grid">
          {featuredShown && featured && <Spotlight r={featured} />}
          {rest.length > 0 ? (
            rest.map((r) => <RestaurantCard key={r.id} r={r} />)
          ) : !featuredShown ? (
            <div className="empty">
              <h4>
                Finding {cuisine === 'ALL' ? '' : cuisine.toLowerCase() + ' '}spots{' '}
                <span className="it">near {city}</span>
              </h4>
              <p>{coords ? 'Loading the best-rated local places…' : 'Turn on location or pick a city above to see what’s local.'}</p>
            </div>
          ) : null}
        </div>
      </section>
        </>
      )}
    </div>
  );
}

// ── Mobile "The Flow" pieces (from lib/cards.jsx + lib/screens.jsx) ─────────
function EatsTitleBlock() {
  return (
    <div
      className="cbl-light-streams"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: `url(${IMG}cbl-map-backdrop.jpg) center/cover no-repeat`,
      }}
    >
      {/* first child = darkening overlay; it also hosts 2 of the 4 light streams */}
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
          zIndex: 2,
          width: 'clamp(84px,25vw,132px)',
          height: 'auto',
          objectFit: 'contain',
          flexShrink: 0,
          display: 'block',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: 0,
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 900,
            fontSize: 'clamp(34px,11vw,50px)',
            lineHeight: 0.82,
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
          width: 'clamp(50px,15vw,88px)',
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
          textAlign: 'center',
          lineHeight: 1.15,
          color: active ? '#fff' : GOLD,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function SponsoredCard({ r }: { r: Restaurant }) {
  const openModal = useContext(EatsModalCtx);
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
            onClick={() => openModal(r)}
          >
            More Info
          </button>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* The name owns its row so it never wraps to a second line on narrow
              phones; the cuisine glyph rides beside it and the rating sits below. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 900,
                fontSize: 22,
                color: '#fff',
                letterSpacing: '-.01em',
                textTransform: 'uppercase',
                flex: 1,
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {r.name}
            </div>
            <div style={{ flexShrink: 0, display: 'flex' }}>
              <CardCornerGlyph cuisine={r.cuisine} />
            </div>
          </div>
          <div style={{ margin: '3px 0 5px' }}>
            <BucketRating value={5} size={13} />
          </div>
          <div
            style={{
              color: GOLD,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
              marginBottom: 6,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {r.shortAddress ?? r.address}
          </div>
          <p style={{ margin: 0, color: '#D4D4D4', fontSize: 12, lineHeight: 1.5 }}>
            {r.shortDescription ?? r.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function GridCard({ r }: { r: Restaurant }) {
  const openModal = useContext(EatsModalCtx);
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
      <div style={{ height: 170, background: `url(${r.image}) center/cover no-repeat` }} />
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
              textTransform: 'uppercase',
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
            onClick={() => openModal(r)}
          >
            More Info
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
  inPittsburgh,
  coords,
}: {
  meal: string;
  setMeal: (m: string) => void;
  cuisine: string | null;
  setCuisine: (c: string | null) => void;
  inPittsburgh: boolean;
  coords: Coords | null;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const activeMeal = MOBILE_MEALS.includes(meal) ? meal : 'LUNCH';
  const inResults = !!cuisine;
  const live = useLivePlaces(coords, !!coords, activeMeal, cuisine);

  // Square Cafe spotlight is Pittsburgh-only; live results power every city.
  const featured = inPittsburgh ? RESTAURANTS.find((r) => r.sponsored) : undefined;
  const matches = byDistance(
    live ??
      (inPittsburgh
        ? RESTAURANTS.filter(
            (r) => !r.sponsored && r.meal.includes(activeMeal) && (!cuisine || r.cuisine.includes(cuisine)),
          )
        : []),
    coords,
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
            padding: '8px 12px 12px',
            borderBottom: '1px solid rgba(255,255,255,.06)',
            animation: 'cblSlideDown .35s cubic-bezier(.2,.8,.2,1)',
          }}
        >
          {/* No header here — the pill above already labels it and its arrow toggles the sheet. */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2 }}>
            {cuisineListForMeal(activeMeal).map((c) => (
              <CuisineTile
                key={c}
                label={c === 'VIETNAMESE' ? 'VIETNAM' : c === 'GLUTEN-FREE' ? 'GLUTEN FREE' : c}
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
              gridTemplateColumns: '1fr',
              gap: 12,
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
              Finding {cuisine ? cuisine.toLowerCase() + ' ' : ''}spots near you…
            </div>
            {coords ? 'Loading the best-rated local places…' : 'Turn on location to see what’s local.'}
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
.cbl-eats .partner-band { max-width:1376px; margin:0 auto; padding:12px 48px 72px; }
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
            Move to the top of the page, get full access to the website and app, and even build
            your own delivery driver network — with direct exposure to members and drivers
            exploring your neighborhood.
          </p>
          <ul>
            <li>Spotlight placement above standard listings</li>
            <li>Full website &amp; app access + sponsored profile</li>
            <li>Build your own delivery driver network</li>
            <li>Reach CBL members and local drivers</li>
          </ul>
          <Link to="/partner-restaurants" className="cta">
            Become a Partner →
          </Link>
        </div>
        <div className="partner-card">
          <div className="tag">For members</div>
          <h3>Share it, earn on it</h3>
          <p>
            Every member gets a digital business card with a personal QR code. Love a spot? Share
            your card with the owner — when they join under your code, you earn. Same code works
            for riders and drivers, too.
          </p>
          <ul>
            <li>Your own QR code to share with any spot you love</li>
            <li>Earn when owners, riders &amp; drivers join under it</li>
            <li>Help shape the Pittsburgh picks</li>
          </ul>
          <Link to="/login" className="cta ghost">
            Get your member card →
          </Link>
        </div>
      </div>
    </section>
  );
}

// On-site restaurant detail panel — opens over the page (no jump to Google).
// "More Info" / "View on Map" open this; the map is a keyless Google embed, and
// the outbound actions (Directions / Reserve / Website) are deliberate buttons.
const MODAL_CSS = `
.cbl-rmodal { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:16px; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-rmodal * { box-sizing:border-box; }
.cbl-rmodal .backdrop { position:absolute; inset:0; background:rgba(0,0,0,.72); backdrop-filter:blur(2px); }
@keyframes cbl-rmodal-in { from { opacity:0; transform:translateY(10px) scale(.98); } to { opacity:1; transform:none; } }
.cbl-rmodal .panel { position:relative; width:min(560px,100%); max-height:calc(100dvh - 32px); overflow-y:auto; background:#141414; border:1px solid rgba(201,151,66,.4); border-radius:22px 0 22px 0; box-shadow:0 20px 50px rgba(0,0,0,.6); animation:cbl-rmodal-in .26s cubic-bezier(.2,.8,.2,1) both; }
@media (prefers-reduced-motion: reduce) { .cbl-rmodal .panel { animation:none; } }
.cbl-rmodal .shot { position:relative; height:196px; background-size:cover; background-position:center; }
.cbl-rmodal .shot::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(20,20,20,0) 45%,rgba(20,20,20,.92)); }
.cbl-rmodal .mtags { position:absolute; top:14px; left:14px; display:flex; gap:6px; z-index:2; }
.cbl-rmodal .mtag { font-family:${MONO}; font-size:10px; letter-spacing:.12em; text-transform:uppercase; color:${GOLD}; background:rgba(0,0,0,.7); padding:5px 10px; border-radius:4px; border:1px solid rgba(201,151,66,.4); }
.cbl-rmodal .close { position:absolute; top:12px; right:12px; z-index:3; width:40px; height:40px; border-radius:50%; background:rgba(0,0,0,.82); border:1.5px solid ${GOLD}; color:${GOLD}; cursor:pointer; font-size:18px; line-height:1; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,.5); transition:transform .15s ease, background .15s ease, color .15s ease; }
.cbl-rmodal .close:hover { background:${GOLD}; color:#000; transform:scale(1.08); }
.cbl-rmodal .close:focus-visible { outline:2px solid ${GOLD}; outline-offset:2px; }
.cbl-rmodal .mbody { padding:20px 24px 24px; color:#EDEDED; }
.cbl-rmodal h2 { font-family:${DISPLAY}; font-weight:900; font-size:26px; line-height:1.05; letter-spacing:-.01em; text-transform:uppercase; color:#fff; margin:0 0 6px; }
.cbl-rmodal .maddr { font-family:${MONO}; font-size:12px; letter-spacing:.05em; color:${GOLD}; margin-bottom:12px; }
.cbl-rmodal .mmeta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:14px; font-size:13px; color:#B8B8B8; }
.cbl-rmodal .mmeta b { color:#fff; } .cbl-rmodal .mopen { color:#8CC084; font-weight:700; }
.cbl-rmodal .mdesc { font-size:14.5px; line-height:1.6; color:#C7C7C7; margin-bottom:16px; }
.cbl-rmodal .mmap { width:100%; height:230px; border:0; border-radius:12px 0 12px 0; margin-bottom:16px; display:block; background:#0A0A0A; }
.cbl-rmodal .mhours, .cbl-rmodal .mrev { margin-bottom:16px; padding:12px 14px; background:#0f0f0f; border:1px solid rgba(255,255,255,.07); border-radius:10px; }
.cbl-rmodal .mh-label { font-family:${MONO}; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:${GOLD}; margin-bottom:8px; }
.cbl-rmodal .mh-row { display:flex; justify-content:space-between; gap:16px; font-size:12.5px; color:#B8B8B8; line-height:1.9; }
.cbl-rmodal .mh-row .today { color:#fff; font-weight:700; }
.cbl-rmodal .mrev p { margin:0 0 6px; font-size:13.5px; line-height:1.55; color:#D4D4D4; font-style:italic; }
.cbl-rmodal .mrev-by { font-family:${MONO}; font-size:11px; color:#888; }
.cbl-rmodal .macts { display:flex; gap:10px; flex-wrap:wrap; }
.cbl-rmodal .macts a { flex:1 1 140px; text-align:center; text-decoration:none; padding:12px 14px; border-radius:999px; font-family:${DISPLAY}; font-weight:800; font-size:12px; letter-spacing:.08em; text-transform:uppercase; }
.cbl-rmodal .macts .primary { background:${GOLD}; color:#000; } .cbl-rmodal .macts .primary:hover { background:#DDB15F; }
.cbl-rmodal .macts .ghost { background:transparent; border:1.5px solid rgba(255,255,255,.2); color:#fff; } .cbl-rmodal .macts .ghost:hover { border-color:${GOLD}; color:${GOLD}; }
`;

type PlaceDetails = {
  website: string | null;
  phone: string | null;
  googleUrl: string | null;
  hours: string[] | null;
  openNow: boolean | null;
  summary: string | null;
  review: { author: string; rating: number; text: string; when: string } | null;
};

function RestaurantModal({ r, onClose }: { r: Restaurant | null; onClose: () => void }) {
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  useEffect(() => {
    if (!r) {
      setDetails(null);
      return;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Live Google listings (place_id ids) get real hours/website/reviews.
    let cancelled = false;
    setDetails(null);
    const pid = placeIdOf(r);
    if (pid) {
      fetch(`/api/place-details?place_id=${encodeURIComponent(pid)}`)
        .then((res) => res.json())
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
    // Depend on r only — onClose is recreated each parent render, and including it
    // would tear this down and cancel the Place Details fetch mid-flight.
  }, [r]);
  if (!r) return null;
  const website = details?.website || r.website || null;
  const phone = details?.phone || r.phone || null;
  const desc = r.description || details?.summary || null;
  const openNow = details?.openNow ?? r.open;
  const reservable = canReserve(r);
  const todayIdx = (new Date().getDay() + 6) % 7; // Google weekday_text is Monday-first
  return (
    <div className="cbl-rmodal" role="dialog" aria-modal="true" aria-label={r.name}>
      <style>{MODAL_CSS}</style>
      <div className="backdrop" onClick={onClose} />
      <div className="panel">
        <div className="shot" style={{ backgroundImage: `url(${r.image})` }}>
          <div className="mtags">
            {r.cuisine.slice(0, 2).map((c) => (
              <span key={c} className="mtag">
                {c}
              </span>
            ))}
          </div>
          <button className="close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="mbody">
          <h2>{r.name}</h2>
          <div className="maddr">{r.address}</div>
          <div className="mmeta">
            <BucketGlyph value={Math.round(r.rating)} />
            <b>{r.rating.toFixed(1)}</b>
            <span>({r.reviews.toLocaleString()} reviews)</span>
            <span>·</span>
            <span>{r.price}</span>
            {openNow && (
              <>
                <span>·</span>
                <span className="mopen">Open Now</span>
              </>
            )}
          </div>
          {desc && <p className="mdesc">{desc}</p>}
          <iframe className="mmap" src={mapEmbed(r)} loading="lazy" title={`Map of ${r.name}`} />
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
          {(website || reservable || phone) && (
            <div className="macts">
              {website && (
                <a className="primary" href={website} target="_blank" rel="noreferrer">
                  Visit Website →
                </a>
              )}
              {reservable && (
                <a className="ghost" href={reserveUrlFor(r)} target="_blank" rel="noopener noreferrer">
                  Book on OpenTable
                </a>
              )}
              {phone && (
                <a className="ghost" href={`tel:${phone.replace(/[^+\d]/g, '')}`}>
                  Call
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EatsAndDrinks() {
  // Shared filter state. Desktop uses 'ALL' default for both; mobile flow
  // starts with no cuisine (null) so the landing/meal step shows first.
  // Open to the whole city (All Day), ordered closest-first once we have coords.
  const [meal, setMeal] = useState('ALL');
  const [desktopCuisine, setDesktopCuisine] = useState('ALL');
  const [mobileCuisine, setMobileCuisine] = useState<string | null>(null);

  const loc = useVisitorLocation();
  // A city the visitor typed into the search box (geocoded). When set, it
  // overrides the auto-detected location; "Near me" clears it back to GPS/IP.
  const [searched, setSearched] = useState<{ city: string; coords: Coords } | null>(null);
  const [searching, setSearching] = useState(false);
  const [modalR, setModalR] = useState<Restaurant | null>(null);

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

  // Auto-locate on load so the list opens to the restaurants closest to you.
  // Prompts once for GPS; if declined we keep the instant IP city + "Near me".
  useEffect(() => {
    loc.requestPrecise();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCity = searched?.city || loc.city || MARKET_CITY;
  // Use the visitor's real coordinates (GPS/IP) so THEIR neighborhood sorts
  // first; a searched city overrides with that city's coordinates.
  const searchCoords: Coords | null = searched?.coords || loc.coords;
  // Pittsburgh metro gets the curated home-market treatment (Square Cafe +
  // hand-picked list); every other city runs on live Google results.
  const inPittsburgh = searchCoords
    ? milesBetween(searchCoords, PGH_CENTER) <= MARKET_RADIUS_MI
    : activeCity.toLowerCase().includes('pittsburgh');

  return (
    <EatsModalCtx.Provider value={setModalR}>
    <main className="cbl-eats">
      <style>{DESKTOP_CSS}</style>
      <style>{PARTNER_CSS}</style>
      <style>{LOC_CSS}</style>
      <LocationBar
        status={loc.status}
        activeCity={activeCity}
        onSearchCity={onSearchCity}
        onNearMe={onNearMe}
        searching={searching}
      />
      <DesktopEats
        meal={meal}
        setMeal={setMeal}
        cuisine={desktopCuisine}
        setCuisine={setDesktopCuisine}
        inPittsburgh={inPittsburgh}
        city={activeCity}
        coords={searchCoords}
      />
      <MobileFlow
        meal={meal}
        setMeal={setMeal}
        cuisine={mobileCuisine}
        setCuisine={setMobileCuisine}
        inPittsburgh={inPittsburgh}
        coords={searchCoords}
      />
      <PartnerBand />
      <PlatformNotice variant="marketplace" />
      <RestaurantModal r={modalR} onClose={() => setModalR(null)} />
    </main>
    </EatsModalCtx.Provider>
  );
}
