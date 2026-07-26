/**
 * Affiliate section (Phase 1 + 3) — three partner bands, each coverage-gated:
 *   • Tiqets   — skip-the-line attraction tickets
 *   • Go City  — all-in-one city passes (big US coverage)
 *   • WeGoTrip — self-guided audio tours
 *
 * Every card opens an ON-SITE detail panel (AffiliateDetailModal) so discovery
 * stays on citybucketlist.com; only the panel's "Book" button leaves, in a new
 * tab, preserving the affiliate cookie/commission. Each band leads with a
 * source-briefing strip (partner logo on a white chip + one-liner) so visitors
 * know who fulfills the booking.
 *
 * `activeCity` (when known) floats that city to the front of each band. Bands
 * with no resolvable offers hide entirely; if none resolve, the whole section
 * returns null. `placement` tags sub_ids (attractions_* vs travels_*) for reports.
 *
 * Design tokens mirror Attractions.tsx: black canvas, gold #C99742, Playfair
 * italic, diagonal-corner (24px 0 24px 0) framing, no gold borders on images.
 */
import { useState, type ReactNode } from 'react';
import {
  PARTNER_META, TIQETS_CITIES, GOCITY_CITIES, WEGOTRIP_CITIES,
  tiqetsOffer, goCityOffer, weGoTripOffer,
  tiqetsCityFor, goCityFor, weGoTripFor,
  type AffiliateOffer, type Program,
} from '../lib/affiliates';
import { AffiliateDisclosure } from './AffiliateDisclosure';
import { AffiliateDetailModal } from './AffiliateDetailModal';

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";
const GOLD = '#C99742';
const PHOTO_SCRIM = 'linear-gradient(180deg, rgba(0,0,0,.10) 0%, rgba(0,0,0,.30) 50%, rgba(10,10,10,.90) 100%)';
const CAP = 8; // cards per band

type BandDef = { program: Program; eyebrow: string; heading: ReactNode; sub: string };
const BANDS: BandDef[] = [
  { program: 'tiqets', eyebrow: 'skip-the-line tickets', heading: <>Tickets &amp; <span className="it">attractions</span></>, sub: 'Timed-entry and skip-the-line tickets to the top museums, landmarks and experiences.' },
  { program: 'gocity', eyebrow: 'all-in-one city passes', heading: <>City <span className="it">passes</span></>, sub: 'One pass, dozens of a city’s best attractions — big savings versus buying separately.' },
  { program: 'wegotrip', eyebrow: 'self-guided audio tours', heading: <>Audio <span className="it">tours</span></>, sub: 'Explore at your own pace with self-guided audio tours you follow right on your phone.' },
];

// Build a program's offers, active city first, capped.
function offersFor(program: Program, activeCity: string | undefined, placement: string): AffiliateOffer[] {
  const tag = (key: string) => `${placement}_${program}_${key}`;
  let offers: AffiliateOffer[] = [];
  let localKey: string | null = null;
  if (program === 'tiqets') {
    localKey = tiqetsCityFor(activeCity)?.key ?? null;
    offers = TIQETS_CITIES.map((c) => tiqetsOffer(c, tag(c.key))).filter(Boolean) as AffiliateOffer[];
  } else if (program === 'gocity') {
    localKey = goCityFor(activeCity)?.key ?? null;
    offers = GOCITY_CITIES.map((c) => goCityOffer(c, tag(c.key))).filter(Boolean) as AffiliateOffer[];
  } else if (program === 'wegotrip') {
    localKey = weGoTripFor(activeCity)?.key ?? null;
    offers = WEGOTRIP_CITIES.map((c) => weGoTripOffer(c, tag(c.key))).filter(Boolean) as AffiliateOffer[];
  }
  if (localKey) {
    const i = offers.findIndex((o) => o.cityKey === localKey);
    if (i > 0) offers.unshift(offers.splice(i, 1)[0]);
  }
  return offers.slice(0, CAP);
}

function PartnerIntro({ program }: { program: Program }) {
  const meta = PARTNER_META[program];
  if (!meta) return null;
  return (
    <div className="aff-intro">
      <span className="logo-chip"><img src={meta.logo} alt={meta.partner} /></span>
      <p className="aff-intro-copy">{meta.briefing}</p>
    </div>
  );
}

function OfferCard({ offer, onOpen }: { offer: AffiliateOffer; onOpen: (o: AffiliateOffer) => void }) {
  return (
    <button className="aff-card" onClick={() => onOpen(offer)}>
      <div className="ac-img" style={{ backgroundImage: `${PHOTO_SCRIM}, url('${offer.photo}')` }}>
        {!offer.tracked && <span className="preview-flag">preview</span>}
        <span className="ac-country">{offer.country}</span>
        <span className="ac-name">{offer.name}</span>
      </div>
      <div className="ac-body">
        <span className="ac-meta">{offer.meta}</span>
        <span className="ac-cta">
          <span className="price-chip">{offer.price}</span>
          <span className="cta ghost">{offer.cta} →</span>
        </span>
      </div>
    </button>
  );
}

export function AttractionsAffiliate({
  activeCity,
  placement = 'attractions',
}: {
  activeCity?: string;
  placement?: string;
}) {
  const [offer, setOffer] = useState<AffiliateOffer | null>(null);

  const bands = BANDS
    .map((b) => ({ ...b, offers: offersFor(b.program, activeCity, placement) }))
    .filter((b) => b.offers.length > 0);
  if (bands.length === 0) return null;

  return (
    <div className="cbl-aff">
      <style>{CSS}</style>
      {bands.map((b) => (
        <section className="band" key={b.program}>
          <div className="band-inner">
            <div className="aff-head">
              <div className="section-eyebrow">{b.eyebrow}</div>
              <h2 className="section-h2">{b.heading}</h2>
              <p className="aff-sub">{b.sub}</p>
            </div>
            <PartnerIntro program={b.program} />
            <div className="aff-grid">
              {b.offers.map((o) => (
                <OfferCard key={o.program + o.cityKey} offer={o} onOpen={setOffer} />
              ))}
            </div>
          </div>
        </section>
      ))}
      <AffiliateDisclosure />
      <AffiliateDetailModal offer={offer} onClose={() => setOffer(null)} />
    </div>
  );
}

const CSS = `
.cbl-aff { font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-aff * { box-sizing:border-box; }
.cbl-aff section.band { padding:34px 48px 12px; }
.cbl-aff section.band:last-of-type { padding-bottom:24px; }
.cbl-aff .band-inner { max-width:1280px; margin:0 auto; }

.cbl-aff .aff-head { margin-bottom:16px; }
.cbl-aff .section-eyebrow { display:inline-flex; align-items:center; gap:8px; font-family:${MONO}; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:${GOLD}; margin-bottom:10px; }
.cbl-aff .section-eyebrow::before { content:''; width:28px; height:1px; background:${GOLD}; }
.cbl-aff .section-h2 { font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3.4vw,40px); line-height:1; letter-spacing:-.02em; text-transform:uppercase; color:#fff; margin:0; }
.cbl-aff .section-h2 .it { font-family:${ITALIC}; font-style:italic; color:${GOLD}; font-weight:600; text-transform:none; }
.cbl-aff .aff-sub { color:#9A9A9A; font-size:14.5px; line-height:1.5; margin:10px 0 0; max-width:600px; }

/* Source-briefing strip — logo on a white chip so any brand reads on dark */
.cbl-aff .aff-intro { display:flex; align-items:center; gap:14px; flex-wrap:wrap; background:#0F0F0F; border:1px solid rgba(255,255,255,.08); border-radius:16px 0 16px 0; padding:12px 16px; margin-bottom:18px; }
.cbl-aff .logo-chip { background:#fff; border-radius:8px 0 8px 0; padding:6px 11px; display:flex; align-items:center; flex-shrink:0; box-shadow:0 2px 8px rgba(0,0,0,.35); }
.cbl-aff .logo-chip img { height:22px; width:auto; display:block; }
.cbl-aff .aff-intro-copy { margin:0; font-size:13px; line-height:1.5; color:#9A9A9A; flex:1; min-width:240px; }

/* Card grid (opens the on-site detail panel) */
.cbl-aff .aff-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.cbl-aff .aff-card { display:flex; flex-direction:column; background:#141414; border:1px solid rgba(255,255,255,.07); border-radius:24px 0 24px 0; overflow:hidden; cursor:pointer; text-align:left; padding:0; font:inherit; color:inherit; transition:transform .2s ease, border-color .2s ease; }
.cbl-aff .aff-card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.45); }
.cbl-aff .aff-card:focus-visible { outline:2px solid ${GOLD}; outline-offset:2px; }
.cbl-aff .ac-img { position:relative; height:150px; background-size:cover; background-position:center; display:flex; flex-direction:column; justify-content:flex-end; padding:14px 16px; }
.cbl-aff .ac-country { font-family:${MONO}; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:${GOLD}; }
.cbl-aff .ac-name { font-family:${ITALIC}; font-style:italic; font-weight:700; font-size:26px; color:#fff; line-height:1; }
.cbl-aff .ac-body { padding:14px 16px 16px; display:flex; flex-direction:column; gap:12px; flex:1; }
.cbl-aff .ac-meta { font-size:12.5px; color:#9A9A9A; }
.cbl-aff .ac-cta { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; }
.cbl-aff .price-chip { font-family:${MONO}; font-size:11px; letter-spacing:.04em; color:${GOLD}; border:1px solid rgba(201,151,66,.5); border-radius:999px; padding:4px 10px; white-space:nowrap; }
.cbl-aff .cta.ghost { font-family:${DISPLAY}; font-weight:800; font-size:11.5px; letter-spacing:.06em; text-transform:uppercase; color:${GOLD}; }
.cbl-aff .preview-flag { position:absolute; top:10px; right:10px; z-index:3; font-family:${MONO}; font-size:9px; letter-spacing:.12em; text-transform:uppercase; color:#eee; background:rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.25); padding:3px 7px; border-radius:3px; }

@media (max-width:1100px){
  .cbl-aff section.band { padding:30px 24px 10px; }
  .cbl-aff .aff-grid { grid-template-columns:repeat(2,1fr); }
}
@media (max-width:560px){
  .cbl-aff .aff-grid { grid-template-columns:1fr; }
}
`;
