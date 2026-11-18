import { useEffect, useState } from 'react';
import { ridesClient } from '../lib/supabase/ridesClient';
import { APP_URL } from '../lib/constants';
import blackSuv from '../../assets/black-suv.webp';

/**
 * Black Car & Limo Services on the Transportation page (Keith, Nov 16 2026).
 *
 * Local companies that hold a Black Car & Limo Services membership in the app. Each
 * card opens that company's page on app.citybucketlist.com, where the rider books with and
 * pays the company directly. CityBucketList lists them; it does not dispatch, price or take
 * payment for them, and the section says so on the same screen as the cards.
 *
 * The list comes from the app database's public function
 * public_black_car_limo_listings(), which only returns published listings of companies with
 * a live membership. Until that function exists, or while no company is listed, the section
 * shows only the "list your company" invitation, so riders never see an empty grid.
 *
 * Uses the page's own .band / .section-eyebrow / .section-h2 styles, so it must be rendered
 * inside <main className="cbl-transport">.
 */

type Listing = {
  id: number;
  company_name: string;
  about: string | null;
  service_area: string | null;
  vehicles: string | null;
  logo_url: string | null;
  puc_number: string | null;
};

const LISTING_URL = `${APP_URL}/black-car-limo`;
const COMPANY_SIGNUP_URL = `${APP_URL}/black-car-limo/signup`;
const MAX_CARDS = 6;

const httpsOnly = (url: string | null): string | null => {
  if (!url) return null;
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
};

const CSS = `
.cbl-transport .bcl-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; margin-bottom:20px; }
.cbl-transport .bcl-card {
  display:flex; gap:14px; align-items:flex-start; text-decoration:none; color:inherit;
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; padding:18px;
  transition:transform .25s, border-color .25s;
}
.cbl-transport .bcl-card:hover { transform:translateY(-3px); border-color:rgba(201,151,66,.5); }
.cbl-transport .bcl-logo {
  flex:none; width:56px; height:56px; border-radius:12px; background:#000;
  border:1px solid rgba(255,255,255,.12); display:flex; align-items:center; justify-content:center;
  overflow:hidden; color:#C99742; font-weight:900; font-size:20px;
}
.cbl-transport .bcl-logo img { width:100%; height:100%; object-fit:contain; }
.cbl-transport .bcl-card h3 { font-size:18px; font-weight:800; line-height:1.2; margin:0 0 4px; }
.cbl-transport .bcl-card p { color:#A8A8A8; font-size:14px; line-height:1.5; margin:0; text-wrap:pretty; }
.cbl-transport .bcl-card p.bcl-puc { color:#8A8A8A; font-size:13px; margin-top:4px; }
.cbl-transport .bcl-actions { display:flex; flex-wrap:wrap; gap:12px; align-items:center; }
.cbl-transport .bcl-btn {
  display:inline-flex; align-items:center; justify-content:center; min-height:46px; padding:0 22px;
  border-radius:999px; border:1.5px solid #C99742; color:#C99742; text-decoration:none;
  font-weight:800; font-size:14px; letter-spacing:.12em; text-transform:uppercase;
  transition:background .2s, color .2s;
}
.cbl-transport .bcl-btn:hover { background:#C99742; color:#000; }
.cbl-transport .bcl-btn.solid { background:#C99742; color:#000; }
.cbl-transport #black-car-limo .band-inner { position:relative; }
.cbl-transport .bcl-suv { position:absolute; top:-6px; right:0; width:260px; height:auto; pointer-events:none; }
@media (min-width: 961px) {
  .cbl-transport #black-car-limo .section-h2,
  .cbl-transport #black-car-limo .section-lede { max-width:calc(100% - 300px); }
}
@media (max-width: 960px) { .cbl-transport .bcl-suv { position:static; display:block; width:58%; max-width:260px; margin:0 0 14px; } }
.cbl-transport .bcl-note { color:#8A8A8A; font-size:13px; line-height:1.5; margin-top:16px; max-width:62ch; text-wrap:pretty; }
@media (max-width: 960px) { .cbl-transport .bcl-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width: 640px) {
  .cbl-transport .bcl-grid { grid-template-columns:minmax(0,1fr); }
  .cbl-transport .bcl-actions { flex-direction:column; align-items:stretch; }
}
`;

export function BlackCarLimoSection() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    let alive = true;
    // rpc() resolves with { data, error }; an error (the function is not deployed yet, or the
    // network failed) is treated as "no companies listed" so the page still renders.
    ridesClient.rpc('public_black_car_limo_listings').then(({ data, error }) => {
      if (!alive || error || !Array.isArray(data)) return;
      setListings(data as Listing[]);
    });
    return () => {
      alive = false;
    };
  }, []);

  const hasListings = listings.length > 0;

  return (
    <section className="band" id="black-car-limo" style={{ borderTop: '1px solid rgba(255,255,255,.06)' }}>
      <style>{CSS}</style>
      <div className="band-inner">
        <img className="bcl-suv" src={blackSuv} alt="" aria-hidden="true" width={971} height={500} loading="lazy" />
        <div className="section-eyebrow">local companies</div>
        <h2 className="section-h2">
          <span style={{ whiteSpace: 'nowrap' }}>Black Car</span> <span style={{ whiteSpace: 'nowrap' }}>&amp; Limo</span>{' '}
          <span className="it">book directly with them</span>
        </h2>
        <p className="section-lede">
          {hasListings
            ? 'Airport runs, corporate travel, weddings and nights out. Pick a company, then book with them and pay them directly.'
            : 'Local black car and limo companies are joining now. Check back soon.'}
        </p>

        {hasListings && (
          <div className="bcl-grid">
            {listings.slice(0, MAX_CARDS).map((l) => {
              const logo = httpsOnly(l.logo_url);
              return (
                <a className="bcl-card" key={l.id} href={`${LISTING_URL}/${l.id}?src=listing`}>
                  <span className="bcl-logo" aria-hidden="true">
                    {logo ? <img src={logo} alt="" loading="lazy" /> : l.company_name.trim().charAt(0).toUpperCase()}
                  </span>
                  <span>
                    <h3>{l.company_name}</h3>
                    {l.service_area && <p>{l.service_area}</p>}
                    {l.vehicles && <p>{l.vehicles}</p>}
                    {l.puc_number && <p className="bcl-puc">PA PUC certificate {l.puc_number}</p>}
                  </span>
                </a>
              );
            })}
          </div>
        )}

        <div className="bcl-actions">
          {hasListings && (
            <a className="bcl-btn solid" href={`${LISTING_URL}?src=listing`}>
              See all companies
            </a>
          )}
          <a className="bcl-btn" href={COMPANY_SIGNUP_URL}>
            List your company
          </a>
        </div>

        <p className="bcl-note">
          Listed companies are paying members of CityBucketList.com LLC. You book with the company and pay the company&nbsp;directly.
        </p>
      </div>
    </section>
  );
}
