import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import QRCode from 'qrcode';
import { authClient } from '../lib/supabase/authClient';
import { APP_URL } from '../lib/constants';
import {
  getMyListings, updateListing, deleteListing, setListingStatus, getMyDriver,
  type MyListing, type MyDriver,
} from '../lib/studio';
import { startListingBoost, type BoostTier } from '../lib/boost';
import { uploadListingPhoto, saveListingPhotos, maxPhotosForTier } from '../lib/listingPhotos';

const DISPLAY = "'Myriad Pro', sans-serif";
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const ITALIC = "'Playfair Display', serif";

const CATS: { v: string; l: string }[] = [
  { v: 'general', l: 'General' }, { v: 'ride_request', l: 'Ride Request (need a ride)' },
  { v: 'driver_post', l: 'Driver Available (offering rides)' }, { v: 'vehicles', l: 'Vehicles' },
  { v: 'electronics', l: 'Electronics' }, { v: 'furniture', l: 'Furniture' }, { v: 'services', l: 'Services' },
  { v: 'jobs', l: 'Jobs' }, { v: 'housing', l: 'Housing' }, { v: 'tickets', l: 'Tickets' }, { v: 'free', l: 'Free stuff' },
];

const MEMBER_CSS = `
.cbl-studio .tabs { display:flex; gap:6px; margin-bottom:24px; border-bottom:1px solid rgba(255,255,255,.08); }
.cbl-studio .tab { background:none; border:0; border-bottom:2px solid transparent; color:#9a9a9a; font-family:${DISPLAY}; font-weight:800; font-size:13px; letter-spacing:.06em; text-transform:uppercase; padding:10px 6px; cursor:pointer; }
.cbl-studio .tab.on { color:#fff; border-bottom-color:#C99742; }
.cbl-studio .sechead { font-family:${MONO}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#C99742; margin:0 0 14px; }
.cbl-studio .mine { display:flex; flex-direction:column; gap:12px; }
.cbl-studio .mrow { display:flex; gap:14px; align-items:center; background:#111; border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:12px 14px; }
.cbl-studio .mrow.feat { border-color:rgba(201,151,66,.5); background:linear-gradient(180deg,rgba(201,151,66,.07),rgba(201,151,66,0)); }
.cbl-studio .mthumb { width:60px; height:60px; border-radius:10px; background:#1a1a1a; background-size:cover; background-position:center; flex-shrink:0; display:grid; place-items:center; color:#555; font-size:22px; }
.cbl-studio .minfo { flex:1; min-width:0; }
.cbl-studio .mtitle { font-family:${DISPLAY}; font-weight:800; font-size:15px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cbl-studio .mmeta { font-size:12px; color:#8a8a8a; margin-top:4px; display:flex; align-items:center; flex-wrap:wrap; gap:5px; }
.cbl-studio .mbadge { display:inline-block; font-family:${MONO}; font-size:9px; letter-spacing:.07em; text-transform:uppercase; padding:2px 7px; border-radius:999px; }
.cbl-studio .mbadge.active { background:rgba(77,191,102,.15); color:#8FE0A2; }
.cbl-studio .mbadge.paused { background:rgba(255,255,255,.08); color:#aaa; }
.cbl-studio .mbadge.tier { background:rgba(201,151,66,.16); color:#E6C588; }
.cbl-studio .mbadge.driver { background:rgba(201,151,66,.2); color:#DDB15F; border:1px solid rgba(201,151,66,.4); }
.cbl-studio .macts { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
.cbl-studio .card { background:linear-gradient(180deg,#141414,#0d0d0d); border:1px solid rgba(201,151,66,.3); border-radius:20px 0 20px 0; padding:22px; display:flex; gap:20px; align-items:center; margin-bottom:26px; flex-wrap:wrap; }
.cbl-studio .card .qr { width:118px; height:118px; border-radius:12px; background:#fff; padding:8px; flex-shrink:0; }
.cbl-studio .card .qr img { width:100%; height:100%; display:block; }
.cbl-studio .card .cbody { flex:1; min-width:200px; }
.cbl-studio .card .ceyebrow { font-family:${MONO}; font-size:10.5px; letter-spacing:.16em; text-transform:uppercase; color:#C99742; margin-bottom:6px; }
.cbl-studio .card h3 { font-family:${DISPLAY}; font-weight:900; font-size:20px; color:#fff; margin:0 0 4px; }
.cbl-studio .card h3 .it { font-family:${ITALIC}; font-style:italic; font-weight:600; color:#C99742; text-transform:none; }
.cbl-studio .card .clink { font-family:${MONO}; font-size:12px; color:#C99742; word-break:break-all; margin:8px 0 12px; }
.cbl-studio .card .verified { display:inline-flex; align-items:center; gap:6px; font-family:${MONO}; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:#8FE0A2; background:rgba(77,191,102,.12); border:1px solid rgba(77,191,102,.3); border-radius:999px; padding:3px 10px; margin-bottom:8px; }
.cbl-studio .empty2 { text-align:center; color:#8a8a8a; font-size:14px; padding:30px 10px; background:#101010; border:1px dashed rgba(255,255,255,.1); border-radius:14px; }
.cbl-studio .empty2 .g { color:#C99742; font-weight:700; }
/* editor */
.cbl-studio .edrop { position:fixed; inset:0; z-index:1200; display:flex; align-items:center; justify-content:center; padding:20px; }
.cbl-studio .edrop .bg { position:absolute; inset:0; background:rgba(0,0,0,.74); }
.cbl-studio .epanel { position:relative; width:100%; max-width:560px; max-height:92vh; overflow:auto; background:#0F0F0F; border:1px solid rgba(201,151,66,.3); border-radius:20px 0 20px 0; padding:26px; }
.cbl-studio .epanel .x { position:absolute; top:12px; right:14px; background:none; border:0; color:#888; font-size:20px; cursor:pointer; }
.cbl-studio .fld { margin-bottom:14px; }
.cbl-studio .fld label { display:block; font-family:${MONO}; font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:#999; margin-bottom:6px; }
.cbl-studio .fld input, .cbl-studio .fld textarea, .cbl-studio .fld select { width:100%; background:#151515; border:1px solid rgba(255,255,255,.14); border-radius:10px; padding:11px 13px; color:#fff; font-family:${DISPLAY}; font-size:14px; }
.cbl-studio .fld textarea { min-height:90px; resize:vertical; }
.cbl-studio .pgrid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; }
.cbl-studio .pthumb { position:relative; aspect-ratio:1; border-radius:10px; overflow:hidden; background:#1a1a1a; border:1px solid rgba(255,255,255,.1); }
.cbl-studio .pthumb img { width:100%; height:100%; object-fit:cover; }
.cbl-studio .pthumb .prm { position:absolute; top:4px; right:4px; width:20px; height:20px; border-radius:50%; border:0; background:rgba(0,0,0,.7); color:#fff; font-size:11px; cursor:pointer; }
.cbl-studio .padd { aspect-ratio:1; border:1.5px dashed rgba(201,151,66,.5); border-radius:10px; background:rgba(201,151,66,.05); color:#C99742; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; cursor:pointer; text-align:center; }
.cbl-studio .padd input { display:none; }
.cbl-studio .frow { display:flex; align-items:center; gap:8px; margin-bottom:14px; }
@media (max-width:620px){ .cbl-studio .macts { width:100%; justify-content:flex-start; margin-top:8px; } .cbl-studio .mrow { flex-wrap:wrap; } }
`;

function money(l: MyListing) {
  if (l.price_type === 'free') return 'FREE';
  return l.price != null ? `$${l.price}` : 'Contact for price';
}

// Which public Directory section a listing lives in, so "View" jumps to the right place.
function sectionForCategory(cat: string): string {
  if (cat === 'driver_post') return 'DRIVERS';
  if (cat === 'ride_request') return 'RIDERS';
  return 'CLASSIFIEDS';
}

// ── Business card (referral QR) + optional Verified CBL Driver card ──
function BusinessCard({ referralCode, driver }: { referralCode: string | null; driver: MyDriver | null }) {
  const link = referralCode ? `${APP_URL}/r/${referralCode}` : APP_URL;
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    QRCode.toDataURL(link, { margin: 0, width: 400, color: { dark: '#000000', light: '#FFFFFF' } })
      .then(setQr).catch(() => setQr(''));
  }, [link]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };
  const isDriver = !!driver?.active;
  return (
    <div className="card">
      <div className="qr">{qr ? <img src={qr} alt="Your referral QR code" /> : null}</div>
      <div className="cbody">
        {isDriver && <div className="verified">★ Verified CBL Driver</div>}
        <div className="ceyebrow">your digital business card</div>
        <h3>Share it. <span className="it">Earn it.</span></h3>
        <p style={{ color: '#B0B0B0', fontSize: 13.5, lineHeight: 1.5, margin: '0 0 4px' }}>
          {isDriver
            ? 'This is the card that rides along on your driver posts — riders scan to connect with you in the app.'
            : 'Anyone who joins by scanning this — riders, drivers, restaurants — is credited to you.'}
        </p>
        <div className="clink">{link.replace('https://', '')}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-gold mini" onClick={copy}>{copied ? 'Copied ✓' : 'Copy link'}</button>
          <a className="btn btn-ghost mini" href={APP_URL} target="_blank" rel="noopener noreferrer">Open dashboard →</a>
        </div>
      </div>
    </div>
  );
}

// ── Full listing editor (text + price + photos), owner-only via RLS ──
function ListingEditor({ listing, onClose, onSaved }: { listing: MyListing; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(listing.title);
  const [category, setCategory] = useState(listing.category);
  const [free, setFree] = useState(listing.price_type === 'free');
  const [price, setPrice] = useState(listing.price != null ? String(listing.price) : '');
  const [description, setDescription] = useState(listing.description ?? '');
  const [photos, setPhotos] = useState<string[]>(listing.photos ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const max = maxPhotosForTier(listing.tier);

  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr(''); setUploading(true);
    const room = Math.max(0, max - photos.length);
    const added: string[] = [];
    for (const f of Array.from(files).slice(0, room)) {
      const { url, error } = await uploadListingPhoto(f, listing.id);
      if (error) { setErr(error); break; }
      if (url) added.push(url);
    }
    if (added.length) setPhotos((p) => [...p, ...added]);
    setUploading(false);
  };

  const save = async () => {
    if (!title.trim()) { setErr('Please add a title.'); return; }
    setSaving(true); setErr('');
    const upd = await updateListing(listing.id, {
      title: title.trim(), description: description.trim() || null, category,
      price_type: free ? 'free' : 'fixed', price: free ? null : (price.trim() ? Number(price) : null),
    });
    const ph = await saveListingPhotos(listing.id, photos);
    setSaving(false);
    if (upd.error || ph.error) { setErr(upd.error || ph.error || 'Could not save.'); return; }
    onSaved(); onClose();
  };

  return (
    <div className="edrop" role="dialog" aria-modal="true" aria-label="Edit listing">
      <div className="bg" onClick={onClose} />
      <div className="epanel">
        <button className="x" aria-label="Close" onClick={onClose}>✕</button>
        <div className="sechead">edit your listing</div>
        {err && <div className="alert">{err}</div>}
        <div className="fld"><label>Title</label>
          <input value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="fld"><label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
          </select></div>
        <div className="frow">
          <input id="ed-free" type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} />
          <label htmlFor="ed-free" style={{ margin: 0, color: '#ccc', fontSize: 13 }}>This is free — no price</label>
        </div>
        {!free && <div className="fld"><label>Price (USD)</label>
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} /></div>}
        <div className="fld"><label>Description</label>
          <textarea value={description} maxLength={2000} onChange={(e) => setDescription(e.target.value)} /></div>
        <div className="fld">
          <label>Photos {max > 0 ? `(up to ${max})` : '(upgrade to add photos)'}</label>
          {max > 0 ? (
            <div className="pgrid">
              {photos.map((url, i) => (
                <div className="pthumb" key={url + i}>
                  <img src={url} alt={`Photo ${i + 1}`} />
                  <button type="button" className="prm" aria-label="Remove" onClick={() => setPhotos((p) => p.filter((_, x) => x !== i))}>✕</button>
                </div>
              ))}
              {photos.length < max && (
                <label className="padd">{uploading ? '…' : '＋ Add'}
                  <input type="file" accept="image/*" multiple disabled={uploading} onChange={(e) => onFiles(e.target.files)} />
                </label>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: '#8a8a8a', margin: 0 }}>Boost this listing (Photo, Featured, or Pro) to add photos.</p>
          )}
        </div>
        <button type="button" className="btn btn-gold" style={{ width: '100%' }} disabled={saving || uploading} onClick={save}>
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

// ── The member hub: My Listings + business card (+ Blog tab for admins) ──
export function MemberStudio({ email, blog, onSignOut }: { email: string; blog?: ReactNode; onSignOut: () => void }) {
  const [tab, setTab] = useState<'listings' | 'blog'>('listings');
  const [listings, setListings] = useState<MyListing[] | null>(null);
  const [driver, setDriver] = useState<MyDriver | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [editing, setEditing] = useState<MyListing | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const boostingRef = useRef(false);

  const load = useCallback(async () => {
    const { listings: ls, error } = await getMyListings();
    if (error) setErr(error);
    setListings(ls);
    const d = await getMyDriver();
    setDriver(d);
    // Referral code for the card: the member's own rider/driver code.
    const { data: { session } } = await authClient.auth.getSession();
    if (session?.user) {
      const rider = await authClient.from('riders').select('referral_code').eq('id', session.user.id).maybeSingle();
      setReferralCode((rider.data?.referral_code as string | null) ?? d?.referralCode ?? null);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const boost = async (l: MyListing, tier: BoostTier) => {
    if (boostingRef.current) return;
    boostingRef.current = true; setBusyId(l.id); setErr('');
    const { error } = await startListingBoost(l.id, tier); // redirects on success
    if (error) { boostingRef.current = false; setBusyId(null); setErr(error); }
  };
  const togglePause = async (l: MyListing) => {
    setBusyId(l.id);
    await setListingStatus(l.id, l.status === 'active' ? 'paused' : 'active');
    setBusyId(null); load();
  };
  const remove = async (l: MyListing) => {
    if (!window.confirm(`Delete "${l.title}"? This can't be undone.`)) return;
    setBusyId(l.id);
    const { error } = await deleteListing(l.id);
    setBusyId(null);
    if (error) setErr(error); else load();
  };

  const activeCount = useMemo(() => (listings ?? []).filter((l) => l.status === 'active').length, [listings]);

  return (
    <>
      <style>{MEMBER_CSS}</style>
      <div className="top">
        <div>
          <div className="brandmark">CBL Studio</div>
          <h1 className="st-title">Your studio.</h1>
        </div>
        <div className="whoami">
          <span>{email}</span>
          <button type="button" className="btn btn-ghost mini" onClick={onSignOut}>Sign out</button>
        </div>
      </div>

      {blog && (
        <div className="tabs">
          <button type="button" className={'tab' + (tab === 'listings' ? ' on' : '')} onClick={() => setTab('listings')}>My Listings</button>
          <button type="button" className={'tab' + (tab === 'blog' ? ' on' : '')} onClick={() => setTab('blog')}>✍️ Blog</button>
        </div>
      )}

      {tab === 'blog' && blog ? (
        blog
      ) : (
        <>
          <BusinessCard referralCode={referralCode} driver={driver} />

          <div className="sechead">My Listings{listings ? ` · ${activeCount} active` : ''}</div>
          {err && <div className="alert">{err}</div>}
          {listings === null ? (
            <div className="empty2">Loading your listings…</div>
          ) : listings.length === 0 ? (
            <div className="empty2">
              You haven&rsquo;t posted anything yet. Head to the <a href="/directory">Directory</a> and{' '}
              <span className="g">post your first listing</span> — it&rsquo;ll show up here to manage.
            </div>
          ) : (
            <div className="mine">
              {listings.map((l) => {
                // Driver posts carry a "Need a Ride?" business card (driver_ad) —
                // reflect it here: use the card photo as the thumb, badge it, and
                // send "Edit" to the card builder instead of the text editor.
                const dAd = l.driver_ad as { photo?: string } | null;
                const isDriverAd = !!l.driver_ad;
                const thumb = dAd?.photo || l.photos[0];
                return (
                <div key={l.id} className={'mrow' + (l.featured ? ' feat' : '')}>
                  <div className="mthumb" style={thumb ? { backgroundImage: `url(${thumb})`, borderRadius: isDriverAd ? '50%' : undefined } : undefined}>
                    {thumb ? '' : '🏷️'}
                  </div>
                  <div className="minfo">
                    <div className="mtitle">{l.title}</div>
                    <div className="mmeta">
                      <span className={'mbadge ' + (l.status === 'active' ? 'active' : 'paused')}>{l.status === 'active' ? 'Live' : l.status}</span>
                      {isDriverAd && <span className="mbadge driver">★ Driver Card</span>}
                      {l.tier && l.tier !== 'basic' && <span className="mbadge tier">{l.tier}</span>}
                      {!isDriverAd && <span>{money(l)}</span>}
                      {l.city && <span>· {l.city}{l.state ? `, ${l.state}` : ''}</span>}
                      {l.photos.length > 0 && <span>· 📷 {l.photos.length}</span>}
                    </div>
                  </div>
                  <div className="macts">
                    {l.status === 'active' && (
                      <a
                        className="btn btn-ghost mini"
                        href={`/directory?section=${sectionForCategory(l.category)}&listing=${l.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="See your live listing where it's posted"
                      >
                        View
                      </a>
                    )}
                    {isDriverAd ? (
                      <a className="btn btn-gold mini" href={`/directory?editDriverAd=${l.id}`} title="Edit your driver card">Edit card</a>
                    ) : (
                      <button type="button" className="btn btn-ghost mini" disabled={busyId === l.id} onClick={() => setEditing(l)}>Edit</button>
                    )}
                    {!isDriverAd && (l.tier === 'basic' || !l.tier ? (
                      <button type="button" className="btn btn-gold mini" disabled={busyId === l.id} onClick={() => boost(l, 'featured')}>{busyId === l.id ? '…' : 'Boost'}</button>
                    ) : (
                      <button type="button" className="btn btn-ghost mini" disabled={busyId === l.id} onClick={() => boost(l, 'featured')}>Re-boost</button>
                    ))}
                    <button type="button" className="btn btn-ghost mini" disabled={busyId === l.id} onClick={() => togglePause(l)}>{l.status === 'active' ? 'Pause' : 'Activate'}</button>
                    <button type="button" className="btn btn-danger mini" disabled={busyId === l.id} onClick={() => remove(l)}>Delete</button>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {editing && <ListingEditor listing={editing} onClose={() => setEditing(null)} onSaved={load} />}
    </>
  );
}
