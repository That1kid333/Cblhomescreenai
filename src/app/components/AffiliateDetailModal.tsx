/**
 * On-site affiliate detail panel (Keith's retention-first flow). A card click
 * opens THIS modal — big photo, partner logo, what's-included, "from $X" — so the
 * visitor browses and decides on citybucketlist.com. Only the final "Book" button
 * leaves, in a new tab (rel=sponsored nofollow noopener), so our tab stays open
 * behind it and the affiliate cookie/commission is preserved.
 *
 * Partner checkouts can't be embedded (Tiqets/Go City send X-Frame-Options:
 * SAMEORIGIN, and iframed third-party cookies break tracking) — so the panel is
 * the on-site discovery step and the hand-off is a clean new-tab open.
 *
 * Design mirrors the Attractions "More Info" modal: diagonal-corner panel, gold
 * accents, prominent close.
 */
import { useEffect } from 'react';
import { AFFILIATE_REL, type AffiliateOffer } from '../lib/affiliates';

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";
const GOLD = '#C99742';

const PHOTO_SCRIM = 'linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.35) 55%, rgba(20,20,20,.92) 100%)';

export function AffiliateDetailModal({ offer, onClose }: { offer: AffiliateOffer | null; onClose: () => void }) {
  useEffect(() => {
    if (!offer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [offer, onClose]);

  if (!offer) return null;

  return (
    <div className="cbl-affmodal" role="dialog" aria-modal="true" aria-label={offer.title}>
      <style>{CSS}</style>
      <div className="backdrop" onClick={onClose} />
      <div className="panel">
        <button className="close" onClick={onClose} aria-label="Close">✕</button>

        <div className="shot" style={{ backgroundImage: `${PHOTO_SCRIM}, url('${offer.photo}')` }}>
          <span className="logo-chip"><img src={offer.logo} alt={offer.partner} /></span>
          <div className="shot-cap">
            <span className="country">{offer.country}</span>
            <span className="city">{offer.name}</span>
          </div>
        </div>

        <div className="body">
          <div className="kicker">{offer.kicker} · <span>{offer.meta}</span></div>
          <h2>{offer.title}</h2>
          <ul className="highlights">
            {offer.highlights.map((h) => (
              <li key={h}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 13 4 4L19 7" /></svg>
                {h}
              </li>
            ))}
          </ul>

          <div className="actbar">
            <span className="price">{offer.price}</span>
            <a className="book" href={offer.href} target="_blank" rel={AFFILIATE_REL} onClick={onClose}>
              {offer.cta} on {offer.partner}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
            </a>
          </div>
          <p className="reassure">
            You’ll finish booking securely on {offer.partner} (opens in a new tab).
            CityBucketList may earn a commission, at no extra cost to you.
          </p>
        </div>
      </div>
    </div>
  );
}

const CSS = `
.cbl-affmodal { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:16px; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-affmodal * { box-sizing:border-box; }
.cbl-affmodal .backdrop { position:absolute; inset:0; background:rgba(0,0,0,.74); backdrop-filter:blur(2px); }
@keyframes cbl-affmodal-in { from { opacity:0; transform:translateY(10px) scale(.98); } to { opacity:1; transform:none; } }
.cbl-affmodal .panel { position:relative; width:min(520px,100%); max-height:calc(100dvh - 32px); overflow-y:auto; background:#141414; border:1px solid rgba(201,151,66,.4); border-radius:22px 0 22px 0; box-shadow:0 20px 50px rgba(0,0,0,.6); animation:cbl-affmodal-in .24s cubic-bezier(.2,.8,.2,1) both; }
@media (prefers-reduced-motion: reduce) { .cbl-affmodal .panel { animation:none; } }
.cbl-affmodal .close { position:absolute; top:12px; right:12px; z-index:3; width:40px; height:40px; border-radius:50%; background:rgba(0,0,0,.82); border:1.5px solid ${GOLD}; color:${GOLD}; cursor:pointer; font-size:16px; line-height:1; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,.5); transition:transform .15s, background .15s, color .15s; }
.cbl-affmodal .close:hover { background:${GOLD}; color:#000; transform:scale(1.08); }
.cbl-affmodal .close:focus-visible { outline:2px solid ${GOLD}; outline-offset:2px; }

.cbl-affmodal .shot { position:relative; height:210px; background-size:cover; background-position:center; display:flex; align-items:flex-end; padding:16px 20px; }
.cbl-affmodal .logo-chip { position:absolute; top:14px; left:14px; background:#fff; border-radius:8px 0 8px 0; padding:6px 10px; display:flex; align-items:center; box-shadow:0 4px 12px rgba(0,0,0,.4); }
.cbl-affmodal .logo-chip img { height:20px; width:auto; display:block; }
.cbl-affmodal .shot-cap { display:flex; flex-direction:column; }
.cbl-affmodal .shot-cap .country { font-family:${MONO}; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:${GOLD}; }
.cbl-affmodal .shot-cap .city { font-family:${ITALIC}; font-style:italic; font-weight:700; font-size:34px; color:#fff; line-height:1; }

.cbl-affmodal .body { padding:20px 24px 24px; color:#EDEDED; }
.cbl-affmodal .kicker { font-family:${MONO}; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:${GOLD}; margin-bottom:8px; }
.cbl-affmodal .kicker span { color:#8A8A8A; }
.cbl-affmodal h2 { font-family:${DISPLAY}; font-weight:900; font-size:24px; line-height:1.1; letter-spacing:-.01em; color:#fff; margin:0 0 16px; }
.cbl-affmodal .highlights { list-style:none; margin:0 0 20px; padding:0; display:grid; gap:9px; }
.cbl-affmodal .highlights li { display:flex; align-items:flex-start; gap:9px; font-size:14px; line-height:1.4; color:#C9C9C9; }
.cbl-affmodal .highlights svg { flex-shrink:0; margin-top:2px; }

.cbl-affmodal .actbar { display:flex; align-items:center; gap:14px; flex-wrap:wrap; }
.cbl-affmodal .price { font-family:${MONO}; font-size:13px; letter-spacing:.04em; color:${GOLD}; border:1px solid rgba(201,151,66,.5); border-radius:999px; padding:8px 14px; white-space:nowrap; }
.cbl-affmodal .book { flex:1; min-width:180px; display:inline-flex; align-items:center; justify-content:center; gap:8px; background:${GOLD}; color:#000; font-family:${DISPLAY}; font-weight:800; font-size:14px; letter-spacing:.04em; text-transform:uppercase; padding:14px 18px; border-radius:999px; text-decoration:none; transition:background .2s; }
.cbl-affmodal .book:hover { background:#DDB15F; }
.cbl-affmodal .reassure { font-size:11.5px; line-height:1.5; color:#7d7d7d; margin:14px 0 0; }

@media (max-width:520px){
  .cbl-affmodal .shot { height:170px; }
  .cbl-affmodal .shot-cap .city { font-size:28px; }
}
`;
