/**
 * On-site city detail panel (Keith's retention-first flow). A city card opens
 * THIS modal — big photo + every way to explore the city (skip-the-line tickets,
 * an all-in-one pass, a self-guided audio tour) as a list of options. The visitor
 * browses and decides on citybucketlist.com; only the "Book" button they choose
 * leaves, in a new tab (rel=sponsored nofollow noopener), preserving the affiliate
 * cookie/commission. Each option keeps its own tracked link + placement sub_id.
 *
 * Partner checkouts can't be embedded (Tiqets/Go City send X-Frame-Options:
 * SAMEORIGIN, and iframed third-party cookies break tracking), so the panel is
 * the on-site discovery step and the hand-off is a clean new-tab open.
 */
import { useEffect } from 'react';
import { AFFILIATE_REL, type AffiliateOffer } from '../lib/affiliates';

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";
const GOLD = '#C99742';
const PHOTO_SCRIM = 'linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.35) 55%, rgba(20,20,20,.94) 100%)';

export type CityDetail = { name: string; country: string; photo: string; offers: AffiliateOffer[] };

export function AffiliateDetailModal({ detail, onClose }: { detail: CityDetail | null; onClose: () => void }) {
  useEffect(() => {
    if (!detail) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey); };
  }, [detail, onClose]);

  if (!detail) return null;

  return (
    <div className="cbl-affmodal" role="dialog" aria-modal="true" aria-label={`Explore ${detail.name}`}>
      <style>{CSS}</style>
      <div className="backdrop" onClick={onClose} />
      <div className="panel">
        <button className="close" onClick={onClose} aria-label="Close">✕</button>

        <div className="shot" style={{ backgroundImage: `${PHOTO_SCRIM}, url('${detail.photo}')` }}>
          <div className="shot-cap">
            <span className="country">{detail.country}</span>
            <span className="city">{detail.name}</span>
          </div>
        </div>

        <div className="body">
          <div className="lead">Choose how to explore <em>{detail.name}</em></div>

          <div className="options">
            {detail.offers.map((o) => (
              <div className="opt" key={o.program}>
                <span className="opt-logo"><img src={o.logo} alt={o.partner} /></span>
                <div className="opt-txt">
                  <div className="opt-label">{o.kicker}</div>
                  <div className="opt-meta">{o.meta} · <span>{o.partner}</span></div>
                </div>
                <span className="opt-price">{o.price}</span>
                <a className="opt-book" href={o.href} target="_blank" rel={AFFILIATE_REL} onClick={onClose}>
                  {o.cta}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
                </a>
              </div>
            ))}
          </div>

          <p className="reassure">
            You’ll finish booking securely on the partner’s site (opens in a new tab).
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
.cbl-affmodal .panel { position:relative; width:min(540px,100%); max-height:calc(100dvh - 32px); overflow-y:auto; background:#141414; border:1px solid rgba(201,151,66,.4); border-radius:22px 0 22px 0; box-shadow:0 20px 50px rgba(0,0,0,.6); animation:cbl-affmodal-in .24s cubic-bezier(.2,.8,.2,1) both; }
@media (prefers-reduced-motion: reduce) { .cbl-affmodal .panel { animation:none; } }
.cbl-affmodal .close { position:absolute; top:12px; right:12px; z-index:3; width:40px; height:40px; border-radius:50%; background:rgba(0,0,0,.82); border:1.5px solid ${GOLD}; color:${GOLD}; cursor:pointer; font-size:16px; line-height:1; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,.5); transition:transform .15s, background .15s, color .15s; }
.cbl-affmodal .close:hover { background:${GOLD}; color:#000; transform:scale(1.08); }
.cbl-affmodal .close:focus-visible { outline:2px solid ${GOLD}; outline-offset:2px; }

.cbl-affmodal .shot { position:relative; height:190px; background-size:cover; background-position:center; display:flex; align-items:flex-end; padding:16px 22px; }
.cbl-affmodal .shot-cap { display:flex; flex-direction:column; }
.cbl-affmodal .shot-cap .country { font-family:${MONO}; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:${GOLD}; }
.cbl-affmodal .shot-cap .city { font-family:${ITALIC}; font-style:italic; font-weight:700; font-size:36px; color:#fff; line-height:1; }

.cbl-affmodal .body { padding:18px 22px 22px; color:#EDEDED; }
.cbl-affmodal .lead { font-size:15px; color:#C9C9C9; margin-bottom:14px; }
.cbl-affmodal .lead em { font-family:${ITALIC}; font-style:italic; color:${GOLD}; font-weight:600; }

.cbl-affmodal .options { display:flex; flex-direction:column; gap:10px; }
.cbl-affmodal .opt { display:flex; align-items:center; gap:12px; background:#0F0F0F; border:1px solid rgba(255,255,255,.08); border-radius:14px 0 14px 0; padding:12px 14px; }
.cbl-affmodal .opt-logo { background:#fff; border-radius:7px 0 7px 0; padding:5px 8px; display:flex; align-items:center; flex-shrink:0; }
.cbl-affmodal .opt-logo img { height:17px; width:auto; display:block; }
.cbl-affmodal .opt-txt { flex:1; min-width:0; }
.cbl-affmodal .opt-label { font-size:14px; font-weight:700; color:#fff; line-height:1.2; }
.cbl-affmodal .opt-meta { font-family:${MONO}; font-size:10.5px; letter-spacing:.02em; text-transform:uppercase; color:#8A8A8A; margin-top:3px; }
.cbl-affmodal .opt-meta span { color:${GOLD}; }
.cbl-affmodal .opt-price { font-family:${MONO}; font-size:12px; color:${GOLD}; white-space:nowrap; flex-shrink:0; }
.cbl-affmodal .opt-book { flex-shrink:0; display:inline-flex; align-items:center; gap:6px; background:${GOLD}; color:#000; font-family:${DISPLAY}; font-weight:800; font-size:11.5px; letter-spacing:.04em; text-transform:uppercase; padding:9px 13px; border-radius:999px; text-decoration:none; transition:background .2s; }
.cbl-affmodal .opt-book:hover { background:#DDB15F; }
.cbl-affmodal .reassure { font-size:11.5px; line-height:1.5; color:#7d7d7d; margin:16px 0 0; }

@media (max-width:520px){
  .cbl-affmodal .shot { height:150px; }
  .cbl-affmodal .shot-cap .city { font-size:28px; }
  .cbl-affmodal .opt { flex-wrap:wrap; }
  .cbl-affmodal .opt-price { order:3; }
  .cbl-affmodal .opt-book { order:4; margin-left:auto; }
}
`;
