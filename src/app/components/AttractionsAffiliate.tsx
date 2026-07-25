/**
 * Attractions affiliate bands (Phase 1 — Tiqets). Two honestly-labeled sections:
 *
 *   1. "In {city}" local band — shown ONLY when the visitor's active city is one
 *      Tiqets actually sells (coverage-gated), so we never show an off-city block.
 *   2. "Where to next?" destinations band — shown everywhere, framing the covered
 *      cities as trip ideas so a visitor in an uncovered market (e.g. Pittsburgh)
 *      sees genuine trip-planning content instead of an empty section.
 *
 * Everything routes through affiliateHref(): tracked TP links once wired, the
 * plain destination on preview/localhost for design review, and null on
 * production until go-live — in which case a band with no resolvable links
 * renders nothing. If neither band has content, the whole section (disclosure
 * included) returns null.
 *
 * Design tokens mirror Attractions.tsx exactly: black canvas, gold #C99742,
 * Myriad/Playfair/mono, diagonal-corner image framing (24px 0 24px 0), no gold
 * borders on images.
 */
import { type ReactNode } from 'react';
import { AFFILIATE_REL, TIQETS_CITIES, affiliateHref, tiqetsCityFor, type TiqetsCity } from '../lib/affiliates';
import { AffiliateDisclosure } from './AffiliateDisclosure';

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";
const GOLD = '#C99742';
const MAP_TEXTURE = '/eats/imagery/cbl-map-backdrop.jpg';

// Real self-hosted photo when set (neutral bottom scrim keeps the city name/price
// legible); otherwise the per-city gradient tint over the shared map texture.
const PHOTO_SCRIM = 'linear-gradient(180deg, rgba(0,0,0,.10) 0%, rgba(0,0,0,.30) 50%, rgba(10,10,10,.90) 100%)';
const cityBg = (c: TiqetsCity) =>
  c.photo
    ? `${PHOTO_SCRIM}, url('${c.photo}')`
    : `linear-gradient(150deg, ${c.tint}), url('${MAP_TEXTURE}')`;

function TicketIcon({ s = 14, color = '#000' }: { s?: number; color?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 8V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" />
      <path d="M9 4v16" strokeDasharray="2 3" />
    </svg>
  );
}

// A compact source-briefing strip so visitors know who fulfills the booking —
// the official Tiqets teal wordmark + a one-line description. Builds trust and
// keeps the paid partner clearly distinct from CBL's own brand.
function TiqetsIntro({ placement }: { placement: string }) {
  return (
    <div className="aff-intro" data-placement={placement}>
      <img className="aff-intro-logo" src="/attractions/tiqets-logo.svg" alt="Tiqets" width={92} height={35} />
      <p className="aff-intro-copy">
        <b>Tickets powered by Tiqets</b> — an online booking platform for museums and attractions
        that connects travelers worldwide with more ways to experience culture.
      </p>
    </div>
  );
}

export function AttractionsAffiliate({
  activeCity,
  destinationsOnly = false,
  heading,
  eyebrow,
  sub,
}: {
  activeCity?: string;
  destinationsOnly?: boolean;
  heading?: ReactNode;
  eyebrow?: string;
  sub?: string;
}) {
  const local = destinationsOnly ? null : tiqetsCityFor(activeCity);
  const localLink = local ? affiliateHref('tiqets', local.target, `attractions_${local.key}_local`) : null;

  // Destination cards: every covered city except the one already shown locally.
  const placementBase = destinationsOnly ? 'travels' : 'attractions';
  const destinations = TIQETS_CITIES.filter((c) => c.key !== local?.key)
    .map((c) => ({ city: c, link: affiliateHref('tiqets', c.target, `${placementBase}_${c.key}_dest`) }))
    .filter((d): d is { city: TiqetsCity; link: NonNullable<ReturnType<typeof affiliateHref>> } => !!d.link);

  const showLocal = !!(local && localLink);
  const showDestinations = destinations.length > 0;
  if (!showLocal && !showDestinations) return null; // nothing resolvable → hide entirely

  return (
    <div className="cbl-aff">
      <style>{CSS}</style>

      {showLocal && local && localLink && (
        <section className="band">
          <div className="band-inner">
            <div className="aff-head">
              <div className="section-eyebrow">tickets &amp; passes · {local.name}</div>
              <h2 className="section-h2">
                Skip the line <span className="it">in {local.name}</span>
              </h2>
            </div>
            <TiqetsIntro placement={placementBase} />
            <a
              className="local-feature"
              href={localLink.href}
              target="_blank"
              rel={AFFILIATE_REL}
              style={{ backgroundImage: cityBg(local) }}
            >
              {!localLink.tracked && <span className="preview-flag">preview link</span>}
              <div className="lf-body">
                <div className="lf-kicker">Powered by Tiqets</div>
                <h3>
                  {local.count} in <span className="it">{local.name}</span>
                </h3>
                <p>Museums, landmarks and experiences — booked in seconds, straight to your phone.</p>
                <div className="lf-actions">
                  <span className="price-chip">{local.fromPrice}</span>
                  <span className="cta">
                    <TicketIcon /> Book tickets
                  </span>
                </div>
              </div>
            </a>
          </div>
        </section>
      )}

      {showDestinations && (
        <section className="band tight">
          <div className="band-inner">
            <div className="aff-head">
              <div className="section-eyebrow">{eyebrow ?? 'plan your next trip'}</div>
              <h2 className="section-h2">
                {heading ?? (<>Where to <span className="it">next?</span></>)}
              </h2>
              <p className="aff-sub">{sub ?? "Skip-the-line tickets and timed entry in the world's most-visited cities."}</p>
            </div>
            {!showLocal && <TiqetsIntro placement={placementBase} />}
            <div className="dest-grid">
              {destinations.map(({ city, link }) => (
                <a
                  key={city.key}
                  className="dest-card"
                  href={link.href}
                  target="_blank"
                  rel={AFFILIATE_REL}
                >
                  <div className="dc-img" style={{ backgroundImage: cityBg(city) }}>
                    {!link.tracked && <span className="preview-flag">preview link</span>}
                    <span className="dc-country">{city.country}</span>
                    <span className="dc-name">{city.name}</span>
                  </div>
                  <div className="dc-body">
                    <span className="dc-count">{city.count}</span>
                    <span className="dc-cta">
                      <span className="price-chip sm">{city.fromPrice}</span>
                      <span className="cta ghost">
                        <TicketIcon color={GOLD} /> Book tickets
                      </span>
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      <AffiliateDisclosure />
    </div>
  );
}

const CSS = `
.cbl-aff { font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-aff * { box-sizing:border-box; }
.cbl-aff section.band { padding:36px 48px 20px; }
.cbl-aff section.band.tight { padding:20px 48px 28px; }
.cbl-aff .band-inner { max-width:1280px; margin:0 auto; }

/* Source-briefing strip (Tiqets logo + one-liner) — sits directly above the cards */
.cbl-aff .aff-intro {
  display:flex; align-items:center; gap:16px; flex-wrap:wrap;
  background:#0F0F0F; border:1px solid rgba(255,255,255,.08);
  border-radius:16px 0 16px 0; padding:14px 18px; margin-bottom:18px;
}
.cbl-aff .aff-intro-logo { height:30px; width:auto; flex-shrink:0; display:block; }
.cbl-aff .aff-intro-copy { margin:0; font-size:13px; line-height:1.5; color:#9A9A9A; flex:1; min-width:220px; }
.cbl-aff .aff-intro-copy b { color:#D4D4D4; font-weight:700; }

.cbl-aff .aff-head { margin-bottom:20px; }
.cbl-aff .section-eyebrow {
  display:inline-flex; align-items:center; gap:8px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em; text-transform:uppercase;
  color:${GOLD}; margin-bottom:10px;
}
.cbl-aff .section-eyebrow::before { content:''; width:28px; height:1px; background:${GOLD}; }
.cbl-aff .section-h2 {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3.4vw,40px);
  line-height:1; letter-spacing:-.02em; text-transform:uppercase; color:#fff; margin:0;
}
.cbl-aff .section-h2 .it { font-family:${ITALIC}; font-style:italic; color:${GOLD}; font-weight:600; text-transform:none; }
.cbl-aff .aff-sub { color:#9A9A9A; font-size:14.5px; line-height:1.5; margin:10px 0 0; max-width:560px; }

/* Shared bits */
.cbl-aff .price-chip {
  font-family:${MONO}; font-size:12px; letter-spacing:.04em; color:${GOLD};
  border:1px solid rgba(201,151,66,.5); border-radius:999px; padding:5px 12px; white-space:nowrap;
}
.cbl-aff .price-chip.sm { font-size:11px; padding:4px 10px; }
.cbl-aff .cta {
  display:inline-flex; align-items:center; gap:7px;
  background:${GOLD}; color:#000; font-family:${DISPLAY}; font-weight:800; font-size:12px;
  letter-spacing:.08em; text-transform:uppercase; padding:11px 18px; border-radius:999px;
}
.cbl-aff .cta.ghost { background:transparent; border:1.5px solid rgba(201,151,66,.5); color:${GOLD}; padding:9px 14px; }
.cbl-aff a { text-decoration:none; }
.cbl-aff .preview-flag {
  position:absolute; top:10px; right:10px; z-index:3;
  font-family:${MONO}; font-size:9px; letter-spacing:.12em; text-transform:uppercase;
  color:#eee; background:rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.25);
  padding:3px 7px; border-radius:3px;
}

/* Local feature card */
.cbl-aff .local-feature {
  position:relative; display:block; overflow:hidden;
  border-radius:24px 0 24px 0; background-size:cover; background-position:center;
  min-height:220px; display:flex; align-items:flex-end;
  transition:transform .2s ease;
}
.cbl-aff .local-feature:hover { transform:translateY(-3px); }
.cbl-aff .lf-body { padding:26px 30px; max-width:560px; }
.cbl-aff .lf-kicker { font-family:${MONO}; font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:${GOLD}; margin-bottom:8px; }
.cbl-aff .local-feature h3 {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(24px,3vw,34px); line-height:1;
  text-transform:uppercase; color:#fff; margin:0 0 8px; letter-spacing:-.01em;
}
.cbl-aff .local-feature h3 .it { font-family:${ITALIC}; font-style:italic; color:${GOLD}; font-weight:600; text-transform:none; }
.cbl-aff .local-feature p { color:#D4D4D4; font-size:14px; line-height:1.5; margin:0 0 16px; }
.cbl-aff .lf-actions { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }

/* Destinations grid */
.cbl-aff .dest-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }
.cbl-aff .dest-card {
  display:flex; flex-direction:column; background:#141414;
  border:1px solid rgba(255,255,255,.07); border-radius:24px 0 24px 0; overflow:hidden;
  transition:transform .2s ease, border-color .2s ease;
}
.cbl-aff .dest-card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.45); }
.cbl-aff .dc-img {
  position:relative; height:150px; background-size:cover; background-position:center;
  display:flex; flex-direction:column; justify-content:flex-end; padding:14px 16px;
}
.cbl-aff .dc-country { font-family:${MONO}; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:${GOLD}; }
.cbl-aff .dc-name { font-family:${ITALIC}; font-style:italic; font-weight:700; font-size:26px; color:#fff; line-height:1; }
.cbl-aff .dc-body { padding:14px 16px 16px; display:flex; flex-direction:column; gap:12px; flex:1; }
.cbl-aff .dc-count { font-size:12.5px; color:#9A9A9A; }
.cbl-aff .dc-cta { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto; }

@media (max-width:1100px){
  .cbl-aff section.band { padding:32px 24px 18px; }
  .cbl-aff section.band.tight { padding:18px 24px 26px; }
  .cbl-aff .dest-grid { grid-template-columns:repeat(2,1fr); }
}
@media (max-width:560px){
  .cbl-aff .dest-grid { grid-template-columns:1fr; }
  .cbl-aff .lf-body { padding:22px 20px; }
}
`;
