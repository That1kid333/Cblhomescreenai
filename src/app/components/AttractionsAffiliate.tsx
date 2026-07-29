/**
 * Affiliate section — ONE card per city, every partner's booking option attached.
 * A card opens an on-site detail panel (AffiliateDetailModal) listing every way to
 * explore that city — skip-the-line tickets (Tiqets), an all-in-one pass (Go City),
 * a self-guided audio tour (WeGoTrip) — whichever cover it. Only the "Book" button
 * the visitor chooses leaves, in a new tab, preserving the affiliate cookie.
 *
 * Collapsing the old three-band-per-partner layout into one city grid removes the
 * duplicate cards (New York no longer appears three times) and turns discovery into
 * a single "pick a city → see all your options" flow. Each option keeps its own
 * tracked link + placement sub_id, so per-partner earnings still report.
 *
 * `activeCity` (when known) floats that city first. `placement` tags sub_ids
 * (attractions_* vs travels_*). Cities with no resolvable offers are skipped; if
 * none resolve, the section returns null.
 *
 * Design tokens mirror Attractions.tsx: black canvas, gold #C99742, Playfair italic,
 * diagonal-corner (24px 0 24px 0) framing, no gold borders on images.
 */
import { useEffect, useState } from 'react';
import {
  AFFILIATE_CITIES, PARTNER_META, affiliateCityFor, cityOffers, cityPhoto, minPrice, OPTION_WORD,
  localCityOffers, hasCityPhoto, slugify, nearestMajorCity,
  type AffiliateOffer, type Program,
} from '../lib/affiliates';
import type { Coords } from '../lib/location';
import { AffiliateDisclosure } from './AffiliateDisclosure';
import { AffiliateDetailModal, type CityDetail } from './AffiliateDetailModal';

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";
const GOLD = '#C99742';
const PHOTO_SCRIM = 'linear-gradient(180deg, rgba(0,0,0,.10) 0%, rgba(0,0,0,.30) 50%, rgba(10,10,10,.90) 100%)';
// Fallback for a visitor's-own-city card when we have no photo for it (nationwide
// case): the shared map texture with a gold wash, so it still reads on-brand.
const MAP_FALLBACK = "linear-gradient(150deg, rgba(201,151,66,.5), rgba(10,10,10,.9)), url('/eats/imagery/cbl-map-backdrop.jpg')";
const cardBg = (photo: string) => (photo ? `${PHOTO_SCRIM}, url('${photo}')` : MAP_FALLBACK);
const GROUP_CAP = 12; // cards shown per section (U.S. / International) — enough to show every covered city
const PARTNER_ORDER = ['tiqets', 'gocity', 'turbopass', 'wegotrip', 'usaguidedtours', 'extranomical', 'ticketnetwork', 'viator', 'bikesbooking'] as const;
const typesOf = (offers: AffiliateOffer[]) =>
  PARTNER_ORDER.filter((p) => offers.some((o) => o.program === p)).map((p) => OPTION_WORD[p] as string);

type CityCard = { key: string; name: string; country: string; photo: string; types: string[]; price: string; offers: AffiliateOffer[]; local?: boolean; us: boolean };

function OfferCityCard({ card, onOpen }: { card: CityCard; onOpen: (d: CityDetail) => void }) {
  const anyPreview = card.offers.some((o) => !o.tracked);
  return (
    <button
      className="aff-card"
      onClick={() => onOpen({ name: card.name, country: card.country, photo: card.photo, offers: card.offers })}
    >
      <div className="ac-img" style={{ backgroundImage: cardBg(card.photo) }}>
        {card.local && <span className="near-badge">Near you</span>}
        {anyPreview && <span className="preview-flag">preview</span>}
        <span className="ac-country">{card.country || (card.local ? 'Your city' : '')}</span>
        <span className="ac-name">{card.name}</span>
      </div>
      <div className="ac-body">
        <span className="ac-types">{card.types.join(' · ')}</span>
        <span className="ac-cta">
          {card.price ? <span className="price-chip">{card.price}</span> : <span />}
          <span className="cta ghost">View options →</span>
        </span>
      </div>
    </button>
  );
}

// Live city hero for the "Near you" card when we have no curated photo file:
// probe /api/city-photo and use it ONLY if it actually loads, so a failed/absent
// photo leaves the card on its on-brand map texture. Featured cities never reach
// here — they use their hand-curated self-hosted photo.
function useCityPhoto(city: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    setUrl(null);
    if (!city) return;
    const src = `/api/city-photo?q=${encodeURIComponent(city)}`;
    const img = new Image();
    let alive = true;
    img.onload = () => { if (alive && img.naturalWidth > 1) setUrl(src); };
    img.onerror = () => { if (alive) setUrl(null); };
    img.src = src;
    return () => { alive = false; };
  }, [city]);
  return url;
}

export function AttractionsAffiliate({
  activeCity,
  coords,
  placement = 'attractions',
}: {
  activeCity?: string;
  coords?: Coords | null;
  placement?: string;
}) {
  const [detail, setDetail] = useState<CityDetail | null>(null);

  // Resolve the "near you" city: snap the visitor's coords to the nearest major
  // metro (so an obscure IP place like "Glenmoor" becomes "Pittsburgh"), falling
  // back to the detected name only if it's itself a recognized city.
  const detected = activeCity && activeCity.trim().toLowerCase() !== 'your city' ? activeCity.trim() : null;
  const localName = nearestMajorCity(coords) ?? (detected && affiliateCityFor(detected) ? detected : null);
  const localKey = localName ? affiliateCityFor(localName)?.key ?? null : null;
  // Only fetch a live photo for a non-curated "near you" city with no photo file.
  const liveLocalPhoto = useCityPhoto(localName && !localKey && !hasCityPhoto(localName) ? localName : null);

  const cards: CityCard[] = AFFILIATE_CITIES
    .map((c) => {
      const offers = cityOffers(c.key, placement);
      return { key: c.key, name: c.name, country: c.country, photo: cityPhoto(c.key), types: typesOf(offers), price: minPrice(offers), offers, us: c.country === 'USA' };
    })
    .filter((c) => c.offers.length > 0);

  if (localKey) {
    // Resolved metro IS one of our curated cities → float it first.
    const i = cards.findIndex((c) => c.key === localKey);
    if (i > 0) cards.unshift(cards.splice(i, 1)[0]);
  } else if (localName) {
    // Resolved metro is NOT curated (e.g. Pittsburgh) → add it as a location-aware
    // LOCAL card, nationwide: TicketNetwork events (live) + others as they open.
    const localOffers = localCityOffers(localName, placement);
    if (localOffers.length) {
      cards.unshift({
        key: 'local-' + slugify(localName),
        name: localName,
        country: '',
        photo: hasCityPhoto(localName) ? cityPhoto(slugify(localName)) : (liveLocalPhoto || ''),
        types: typesOf(localOffers),
        price: minPrice(localOffers),
        offers: localOffers,
        local: true,
        us: true, // nearestMajorCity only resolves US metros → always the U.S. section
      });
    }
  }

  // Split into U.S. and International sections (Keith's request). Order within each
  // preserves AFFILIATE_CITIES order, with any "near you" card floated to the front
  // of its section. Each section is capped independently for a tidy two-row grid.
  const usCards = cards.filter((c) => c.us).slice(0, GROUP_CAP);
  const intlCards = cards.filter((c) => !c.us).slice(0, GROUP_CAP);
  const shown = [...usCards, ...intlCards];
  if (shown.length === 0) return null;

  // Partner strip shows only brands with a resolvable offer among the shown cards
  // (so a gated program like Viator doesn't advertise itself before it's live).
  const livePrograms = new Set<Program>(shown.flatMap((c) => c.offers.map((o) => o.program)));

  const renderGroup = (label: string, sub: string, list: CityCard[]) =>
    list.length > 0 ? (
      <div className="aff-group">
        <div className="aff-group-h">
          <span className="agh-k">{label}</span>
          <span className="agh-sub">{sub}</span>
          <span className="agh-line" />
        </div>
        <div className="aff-grid">
          {list.map((c) => (
            <OfferCityCard key={c.key} card={c} onOpen={setDetail} />
          ))}
        </div>
      </div>
    ) : null;

  return (
    <div className="cbl-aff">
      <style>{CSS}</style>
      <section className="band">
        <div className="band-inner">
          <div className="aff-head">
            <div className="section-eyebrow">things to do · at your destination</div>
            <h2 className="section-h2">Book the <span className="it">experiences</span></h2>
            <p className="aff-sub">
              Skip-the-line tickets, all-in-one city passes and self-guided audio tours — pick a city
              to see every way to explore it.
            </p>
          </div>

          {/* Trusted-partners strip: official logos on white chips — only the brands
              that actually have a bookable offer among the shown cards. */}
          <div className="partners">
            <span className="p-label">Book with</span>
            {PARTNER_ORDER.filter((p) => livePrograms.has(p)).map((p) => {
              const meta = PARTNER_META[p];
              return meta ? (
                <span className="logo-chip" key={p}><img src={meta.logo} alt={meta.partner} /></span>
              ) : null;
            })}
          </div>

          {renderGroup('U.S. Travel', 'Tickets · passes · tours · events', usCards)}
          {renderGroup('International Travel', 'Explore the world', intlCards)}
        </div>
      </section>
      <AffiliateDisclosure />
      <AffiliateDetailModal detail={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

const CSS = `
.cbl-aff { font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-aff * { box-sizing:border-box; }
.cbl-aff section.band { padding:34px 48px 24px; }
.cbl-aff .band-inner { max-width:1280px; margin:0 auto; }

.cbl-aff .aff-head { margin-bottom:16px; }
.cbl-aff .section-eyebrow { display:inline-flex; align-items:center; gap:8px; font-family:${MONO}; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:${GOLD}; margin-bottom:10px; }
.cbl-aff .section-eyebrow::before { content:''; width:28px; height:1px; background:${GOLD}; }
.cbl-aff .section-h2 { font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3.4vw,40px); line-height:1; letter-spacing:-.02em; text-transform:uppercase; color:#fff; margin:0; }
.cbl-aff .section-h2 .it { font-family:${ITALIC}; font-style:italic; color:${GOLD}; font-weight:600; text-transform:none; }
.cbl-aff .aff-sub { color:#9A9A9A; font-size:14.5px; line-height:1.5; margin:10px 0 0; max-width:600px; }

/* Trusted-partners strip — official logos on white chips */
.cbl-aff .partners { display:flex; align-items:center; gap:6px 8px; flex-wrap:wrap; margin-bottom:20px; }
.cbl-aff .partners .p-label { flex:0 0 auto; margin-right:6px; font-family:${MONO}; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#8A8A8A; }
.cbl-aff .logo-chip { flex:0 0 auto; width:124px; display:flex; align-items:center; justify-content:center; height:26px; }
.cbl-aff .logo-chip img { max-height:22px; max-width:108px; width:auto; height:auto; display:block; filter:brightness(0) invert(1); opacity:.82; }

/* U.S. / International section groups */
.cbl-aff .aff-group + .aff-group { margin-top:30px; }
.cbl-aff .aff-group-h { display:flex; align-items:center; gap:14px; margin:6px 0 16px; }
.cbl-aff .aff-group-h .agh-k { font-family:${DISPLAY}; font-weight:800; font-size:18px; letter-spacing:.1em; text-transform:uppercase; color:#fff; white-space:nowrap; }
.cbl-aff .aff-group-h .agh-sub { font-family:${MONO}; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:#8A8A8A; white-space:nowrap; }
.cbl-aff .aff-group-h .agh-line { flex:1; height:1px; background:rgba(201,151,66,.20); }

/* City card grid (opens the on-site detail panel) */
.cbl-aff .aff-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.cbl-aff .aff-card { display:flex; flex-direction:column; background:#141414; border:1px solid rgba(255,255,255,.07); border-radius:24px 0 24px 0; overflow:hidden; cursor:pointer; text-align:left; padding:0; font:inherit; color:inherit; transition:transform .2s ease, border-color .2s ease; }
.cbl-aff .aff-card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.45); }
.cbl-aff .aff-card:focus-visible { outline:2px solid ${GOLD}; outline-offset:2px; }
.cbl-aff .ac-img { position:relative; height:150px; background-size:cover; background-position:center; display:flex; flex-direction:column; justify-content:flex-end; padding:14px 16px; }
.cbl-aff .ac-country { font-family:${MONO}; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:${GOLD}; }
.cbl-aff .ac-name { font-family:${ITALIC}; font-style:italic; font-weight:700; font-size:26px; color:#fff; line-height:1; }
.cbl-aff .ac-body { padding:14px 16px 16px; display:flex; flex-direction:column; gap:12px; flex:1; }
.cbl-aff .ac-types { font-family:${MONO}; font-size:11px; letter-spacing:.03em; color:#9A9A9A; }
.cbl-aff .ac-cta { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; }
.cbl-aff .price-chip { font-family:${MONO}; font-size:11px; letter-spacing:.04em; color:${GOLD}; border:1px solid rgba(201,151,66,.5); border-radius:999px; padding:4px 10px; white-space:nowrap; }
.cbl-aff .cta.ghost { font-family:${DISPLAY}; font-weight:800; font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; color:${GOLD}; }
.cbl-aff .preview-flag { position:absolute; top:10px; right:10px; z-index:3; font-family:${MONO}; font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:#eee; background:rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.25); padding:3px 7px; border-radius:3px; }
.cbl-aff .near-badge { position:absolute; top:10px; left:10px; z-index:3; font-family:${MONO}; font-size:9.5px; letter-spacing:.1em; text-transform:uppercase; font-weight:700; color:#062615; background:#4DBF66; padding:4px 9px; border-radius:2px; }

@media (max-width:1100px){
  .cbl-aff section.band { padding:30px 24px 20px; }
  .cbl-aff .aff-grid { grid-template-columns:repeat(2,1fr); }
}
@media (max-width:560px){
  .cbl-aff .aff-grid { grid-template-columns:1fr; }
  .cbl-aff .aff-group-h .agh-sub { display:none; }
}
`;
