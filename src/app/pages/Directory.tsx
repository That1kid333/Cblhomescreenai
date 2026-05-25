import { useState, type ReactNode } from "react";

/**
 * Directory — ported from the approved "CBL Directory Desktop" design
 * (Claude Design · CBL Website 2026 project, May 2026).
 *
 * Re-skinned to match the other Explore/Blog pages (Our Story / Eats &
 * Drinks / Transportation / Travels / Attractions / Blog): dark canvas, gold
 * (#C99742) accents, Barlow Condensed / Myriad Pro display, Playfair Display
 * italic accents, mono eyebrow labels, CBL diagonal-corner cards.
 *
 * Nav + footer come from the shared Layout (same as Blog/OurStory), so this
 * component renders the page body only. All CSS is scoped under `.cbl-dir`.
 *
 * The hero + section-title CSS is intentionally identical to Blog.tsx so the
 * big page title lines up tab-to-tab with no choppiness.
 *
 * Action CTAs (Post, Go Featured, Respond, Book Pickup, Sign in) link out to
 * Justin's live directory app at directory.citybucketlist.com, which already
 * has working login + posting + pricing.
 */

const DISPLAY = "'Barlow Condensed','Myriad Pro',sans-serif";
const ITALIC = "'Playfair Display',serif";
const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
const MAP_BG = "/eats/imagery/cbl-map-backdrop.jpg";
const DIR_URL = "https://directory.citybucketlist.com/";

type SecDef = { key: string; label: string; Icon: (p: { s?: number }) => JSX.Element };
type Chip = { k: string; l: string; d: string };
type Listing = {
  id: number; name: string; loc: string; desc: string; price: string;
  photos?: number; badges?: { t: string; k?: string }[];
  img?: string; featured?: boolean; placeholder?: boolean;
};
type Driver = {
  id: number; name: string; schedule: string; blurb: string;
  rides: string; rating: string; vehicle: string; tags: string[]; featured?: boolean;
};
type Rider = {
  id: number; name: string; when: string; title: string; blurb: string;
  tags: string[]; urgent?: boolean;
};
type Coupon = {
  disc: string; unit: string; title: string; partner: string;
  terms: string; code: string; featured?: boolean; img?: string;
};
type Tier = {
  name: string; price: string; per: string; bullets: string[];
  muted?: string[]; accent?: boolean; badge?: string; cta: string;
};

const DIR_CSS = `
.cbl-dir { background:#0A0A0A; color:#fff; font-family:Inter,system-ui,sans-serif; -webkit-font-smoothing:antialiased; min-height:100vh; }
.cbl-dir *,.cbl-dir *::before,.cbl-dir *::after { box-sizing:border-box; margin:0; padding:0; }
.cbl-dir a { color:inherit; text-decoration:none; }
.cbl-dir button { font-family:inherit; cursor:pointer; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

/* ── Hero (identical structure to Blog hero) ── */
.cbl-dir .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 16px;
}
.cbl-dir .hero-inner { max-width:1280px; margin:0 auto; }
.cbl-dir .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em; color:#8a8a8a;
  text-transform:lowercase; margin-bottom:10px;
}
.cbl-dir .eyebrow::before { content:''; width:8px; height:8px; border-radius:50%; background:#C99742; animation:cbl-pulse 2.4s ease-in-out infinite; }
.cbl-dir h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(64px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-dir h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-dir h1.hero-title .h1-main { color:#fff; white-space:nowrap; position:relative; }
.cbl-dir .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:#C99742;
}
.cbl-dir .hero-subtitle .it { font-family:${ITALIC}; font-style:italic; font-weight:600; color:#C99742; text-transform:none; letter-spacing:0; font-size:.82em; }
.cbl-dir h1.hero-title .dir-icon { flex-shrink:0; width:220px; height:180px; display:flex; align-items:center; justify-content:center; opacity:.92; }
.cbl-dir h1.hero-title .dir-icon svg { width:100%; height:100%; }
.cbl-dir .hero p.lede { margin-top:14px; max-width:620px; font-size:16px; line-height:1.45; color:#B8B8B8; }
.cbl-dir .signup-hint { margin-top:12px; font-family:${MONO}; font-size:11px; color:#C99742; letter-spacing:.14em; text-transform:uppercase; display:inline-flex; align-items:center; gap:8px; }
.cbl-dir .signup-hint::before { content:''; width:6px; height:6px; border-radius:50%; background:#C99742; }
.cbl-dir .signup-hint:hover { color:#DDB15F; }

/* ── Filter rail ── */
.cbl-dir .filters {
  position:sticky; top:0; z-index:20;
  background:rgba(10,10,10,.94); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid rgba(255,255,255,.06); padding:8px 48px 0;
}
.cbl-dir .filters-inner { max-width:1280px; margin:0 auto; }
.cbl-dir .sec-row { display:flex; gap:6px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,.06); overflow-x:auto; scrollbar-width:none; }
.cbl-dir .sec-row::-webkit-scrollbar { display:none; }
.cbl-dir .sec-btn {
  flex-shrink:0; background:transparent; border:0; color:#888; padding:6px 22px 10px;
  display:flex; flex-direction:column; align-items:center; gap:6px;
  font-family:${DISPLAY}; font-weight:900; font-size:17px; letter-spacing:.14em;
  text-transform:uppercase; transition:color .2s; border-bottom:3px solid transparent; margin-bottom:-1px;
}
.cbl-dir .sec-btn .ic { width:38px; height:38px; color:#fff; opacity:.9; transition:opacity .2s; display:flex; align-items:center; justify-content:center; }
.cbl-dir .sec-btn:hover { color:#B8B8B8; }
.cbl-dir .sec-btn.active { color:#B8B8B8; border-bottom-color:#C99742; }
.cbl-dir .sec-btn.active .ic { opacity:1; }

.cbl-dir .chip-row { display:flex; gap:8px; padding:12px 0; overflow-x:auto; scrollbar-width:thin; scrollbar-color:rgba(201,151,66,.4) transparent; }
.cbl-dir .chip-row::-webkit-scrollbar { height:6px; }
.cbl-dir .chip-row::-webkit-scrollbar-thumb { background:rgba(201,151,66,.35); border-radius:3px; }
.cbl-dir .chip {
  flex-shrink:0; display:flex; align-items:center; gap:8px; padding:8px 14px; border-radius:999px;
  background:transparent; border:1px solid rgba(255,255,255,.10); color:#C99742;
  font-family:${DISPLAY}; font-weight:800; font-size:12px; letter-spacing:.12em; text-transform:uppercase; transition:all .2s;
}
.cbl-dir .chip:hover { border-color:rgba(201,151,66,.45); color:#fff; }
.cbl-dir .chip.active { background:rgba(201,151,66,.15); border-color:#C99742; color:#fff; }
.cbl-dir .chip svg { width:14px; height:14px; }

/* ── Section frame (identical to Blog) ── */
.cbl-dir section.band { padding:36px 48px 56px; }
.cbl-dir section.band.tight { padding:28px 48px 36px; }
.cbl-dir .band-inner { max-width:1280px; margin:0 auto; }
.cbl-dir .section-eyebrow { font-family:${MONO}; font-size:12px; color:#C99742; letter-spacing:.18em; text-transform:uppercase; display:inline-flex; align-items:center; gap:10px; margin-bottom:12px; }
.cbl-dir .section-eyebrow::before { content:''; width:28px; height:1px; background:#C99742; }
.cbl-dir .section-h2 { font-family:${DISPLAY}; font-weight:900; font-size:clamp(40px,4.6vw,64px); line-height:.95; letter-spacing:-.01em; text-transform:uppercase; margin-bottom:8px; }
.cbl-dir .section-h2 .it { font-family:${ITALIC}; font-style:italic; color:#C99742; font-weight:600; text-transform:none; font-size:.6em; margin-left:8px; }
.cbl-dir .section-head { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; gap:24px; flex-wrap:wrap; }
.cbl-dir .section-head .count { font-family:${MONO}; font-size:11px; letter-spacing:.14em; color:#8a8a8a; text-transform:uppercase; }
.cbl-dir .post-btn { background:#C99742; color:#000; border:0; padding:12px 22px; border-radius:999px; font-family:${DISPLAY}; font-weight:900; font-size:13px; letter-spacing:.12em; text-transform:uppercase; }
.cbl-dir .post-btn:hover { background:#DDB15F; }

/* ── FREE vs FEATURED comparison band ── */
.cbl-dir .compare-band {
  background:
    radial-gradient(ellipse at 70% 50%, rgba(201,151,66,.10), transparent 60%),
    linear-gradient(180deg, #0A0A0A 0%, #0F0F0F 100%);
  border-top:1px solid rgba(255,255,255,.06); border-bottom:1px solid rgba(255,255,255,.06);
}
.cbl-dir .compare-grid { display:grid; grid-template-columns:1fr 1fr; gap:28px; align-items:stretch; }
.cbl-dir .compare-col { background:#141414; border:1px solid rgba(255,255,255,.08); border-radius:18px 0 18px 0; padding:22px 24px 24px; display:flex; flex-direction:column; position:relative; }
.cbl-dir .compare-col.featured { background:linear-gradient(180deg, rgba(201,151,66,.14), rgba(201,151,66,.02)); border:1.5px solid #C99742; box-shadow:0 14px 40px rgba(201,151,66,.18); }
.cbl-dir .compare-col .hdr { display:flex; justify-content:space-between; align-items:baseline; margin-bottom:14px; }
.cbl-dir .compare-col .lbl { font-family:${DISPLAY}; font-weight:900; font-size:24px; text-transform:uppercase; letter-spacing:-.005em; color:#fff; }
.cbl-dir .compare-col.featured .lbl { color:#C99742; }
.cbl-dir .compare-col .price-tag { font-family:${MONO}; font-size:11px; color:#888; letter-spacing:.14em; text-transform:uppercase; }
.cbl-dir .compare-col .price-tag b { color:#fff; font-family:${DISPLAY}; font-size:18px; letter-spacing:-.01em; }
.cbl-dir .compare-col.featured .price-tag b { color:#C99742; }
.cbl-dir .compare-col .price-tag.free b { color:#4DBF66; }

.cbl-dir .mock { background:#0A0A0A; border:1px solid rgba(255,255,255,.08); border-radius:14px; overflow:hidden; }
.cbl-dir .mock.featured { border:1.5px solid #C99742; box-shadow:0 0 0 1px rgba(201,151,66,.2) inset; }
.cbl-dir .mock .img { aspect-ratio:16/9; background-size:cover; background-position:center; position:relative; }
.cbl-dir .mock .feat-badge { position:absolute; top:10px; left:10px; background:#C99742; color:#000; font-family:${DISPLAY}; font-weight:900; font-size:10px; letter-spacing:.16em; text-transform:uppercase; padding:4px 10px; border-radius:4px; }
.cbl-dir .mock .img-count { position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,.7); color:#fff; font-family:${MONO}; font-size:10px; letter-spacing:.1em; padding:3px 8px; border-radius:4px; backdrop-filter:blur(4px); }
.cbl-dir .mock .body { padding:14px 16px 14px; display:flex; flex-direction:column; gap:5px; }
.cbl-dir .mock h4 { font-family:${DISPLAY}; font-weight:900; font-size:18px; line-height:1.1; text-transform:uppercase; letter-spacing:-.005em; }
.cbl-dir .mock .meta { font-family:${MONO}; font-size:10px; color:#888; letter-spacing:.1em; }
.cbl-dir .mock .meta .gold { color:#C99742; }
.cbl-dir .mock .desc { font-size:12px; line-height:1.4; color:#A8A8A8; }
.cbl-dir .mock .price { font-family:${DISPLAY}; font-weight:900; font-size:22px; color:#C99742; letter-spacing:-.01em; }
.cbl-dir .mock .foot { display:flex; justify-content:space-between; padding-top:8px; margin-top:4px; border-top:1px solid rgba(255,255,255,.06); font-family:${MONO}; font-size:10px; color:#888; letter-spacing:.1em; }

.cbl-dir .compare-col ul { list-style:none; padding:0; margin:14px 0 0; display:flex; flex-direction:column; gap:6px; }
.cbl-dir .compare-col li { display:flex; align-items:flex-start; gap:8px; color:#C8C8C8; font-size:13px; line-height:1.45; }
.cbl-dir .compare-col li svg { flex-shrink:0; margin-top:3px; }
.cbl-dir .compare-col li.muted { color:#666; }
.cbl-dir .compare-col .cta { margin-top:18px; width:100%; background:transparent; color:#C99742; border:1px solid #C99742; border-radius:999px; padding:12px 16px; font-family:${DISPLAY}; font-weight:800; font-size:13px; letter-spacing:.14em; text-transform:uppercase; text-align:center; display:block; }
.cbl-dir .compare-col.featured .cta { background:#C99742; color:#000; border-color:#C99742; }
.cbl-dir .compare-col .cta:hover { background:rgba(201,151,66,.12); }
.cbl-dir .compare-col.featured .cta:hover { background:#DDB15F; }

/* ── Listings grid ── */
.cbl-dir .listings-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
.cbl-dir .listing { background:#141414; border:1px solid rgba(255,255,255,.08); border-radius:16px 0 16px 0; overflow:hidden; display:flex; flex-direction:column; transition:transform .35s, border-color .35s; animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both; }
.cbl-dir .listing.featured { border:1.5px solid #C99742; background:linear-gradient(180deg, rgba(201,151,66,.08), rgba(201,151,66,0)); }
.cbl-dir .listing:hover { transform:translateY(-3px); border-color:rgba(201,151,66,.5); }
.cbl-dir .listing .img { aspect-ratio:5/3.4; background-size:cover; background-position:center; position:relative; }
.cbl-dir .listing.no-photo { background:linear-gradient(180deg, #161616 0%, #0F0F0F 100%); }
.cbl-dir .listing.no-photo .body { padding-top:18px; }
.cbl-dir .listing .badge-row { position:absolute; top:10px; left:10px; display:flex; gap:6px; z-index:2; }
.cbl-dir .listing .badge { font-family:${MONO}; font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:#C99742; background:rgba(0,0,0,.7); padding:4px 8px; border-radius:4px; border:1px solid rgba(201,151,66,.4); backdrop-filter:blur(6px); }
.cbl-dir .listing .badge.feat { color:#000; background:#C99742; border-color:#C99742; }
.cbl-dir .listing .img-count { position:absolute; bottom:10px; right:10px; background:rgba(0,0,0,.7); color:#fff; font-family:${MONO}; font-size:10px; letter-spacing:.1em; padding:3px 8px; border-radius:4px; backdrop-filter:blur(4px); z-index:2; }
.cbl-dir .listing .body { padding:14px 18px 16px; display:flex; flex-direction:column; gap:6px; flex:1; }
.cbl-dir .listing h3 { font-family:${DISPLAY}; font-weight:900; font-size:20px; line-height:1.1; text-transform:uppercase; letter-spacing:-.005em; }
.cbl-dir .listing .loc { font-family:${MONO}; font-size:10px; color:#C99742; letter-spacing:.1em; text-transform:uppercase; }
.cbl-dir .listing .desc { font-size:12.5px; line-height:1.45; color:#A8A8A8; flex:1; }
.cbl-dir .listing .price { font-family:${DISPLAY}; font-weight:900; font-size:24px; color:#C99742; letter-spacing:-.01em; }
.cbl-dir .listing .foot { display:flex; justify-content:space-between; align-items:center; padding-top:10px; margin-top:4px; border-top:1px solid rgba(255,255,255,.06); font-family:${MONO}; font-size:10px; letter-spacing:.1em; color:#888; }
.cbl-dir .listing .arrow { color:#C99742; font-family:${DISPLAY}; font-weight:900; font-size:18px; }

/* Driver-specific card */
.cbl-dir .driver-card { display:grid; grid-template-columns:80px 1fr; background:#141414; border:1px solid rgba(255,255,255,.08); border-radius:16px 0 16px 0; padding:16px; gap:14px; align-items:center; transition:border-color .25s; }
.cbl-dir .driver-card.featured { background:linear-gradient(135deg, rgba(201,151,66,.14), rgba(201,151,66,.02)); border:1.5px solid #C99742; }
.cbl-dir .driver-card:hover { border-color:rgba(201,151,66,.45); }
.cbl-dir .driver-card .qr { width:80px; height:80px; background:#fff; border-radius:8px; display:grid; grid-template-columns:repeat(7,1fr); grid-template-rows:repeat(7,1fr); gap:1.5px; padding:6px; }
.cbl-dir .driver-card .qr .b { background:#000; }
.cbl-dir .driver-card .body { display:flex; flex-direction:column; gap:4px; }
.cbl-dir .driver-card .name { font-family:${DISPLAY}; font-weight:900; font-size:20px; line-height:1; text-transform:uppercase; letter-spacing:-.005em; }
.cbl-dir .driver-card .schedule { font-family:${MONO}; font-size:10px; color:#C99742; letter-spacing:.1em; text-transform:uppercase; }
.cbl-dir .driver-card .blurb { font-size:12.5px; line-height:1.45; color:#A8A8A8; }
.cbl-dir .driver-card .stats { display:flex; gap:14px; margin-top:4px; font-family:${MONO}; font-size:10px; color:#888; letter-spacing:.08em; }
.cbl-dir .driver-card .stats b { color:#fff; font-family:${DISPLAY}; font-size:13px; margin-right:4px; letter-spacing:-.01em; }

/* Rider request card */
.cbl-dir .rider-card { background:#141414; border:1px solid rgba(255,255,255,.08); border-radius:16px 0 16px 0; padding:18px 20px; display:flex; flex-direction:column; gap:8px; }
.cbl-dir .rider-card.urgent { border-color:rgba(201,151,66,.5); }
.cbl-dir .rider-card .tag-row { display:flex; gap:6px; flex-wrap:wrap; }
.cbl-dir .rider-card .tag { font-family:${MONO}; font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:#C99742; padding:3px 8px; border-radius:4px; border:1px solid rgba(201,151,66,.4); background:rgba(201,151,66,.06); }
.cbl-dir .rider-card .tag.urgent { color:#fff; background:#C99742; border-color:#C99742; }
.cbl-dir .rider-card h4 { font-family:${DISPLAY}; font-weight:900; font-size:22px; line-height:1.1; text-transform:uppercase; letter-spacing:-.005em; }
.cbl-dir .rider-card .when { font-family:${MONO}; font-size:10px; color:#C99742; letter-spacing:.1em; text-transform:uppercase; }
.cbl-dir .rider-card .blurb { font-size:13px; line-height:1.5; color:#B8B8B8; }
.cbl-dir .rider-card .foot { display:flex; justify-content:space-between; align-items:center; padding-top:10px; border-top:1px solid rgba(255,255,255,.06); margin-top:4px; }
.cbl-dir .rider-card .author { font-family:${MONO}; font-size:10px; color:#888; letter-spacing:.08em; text-transform:uppercase; }
.cbl-dir .rider-card .author b { color:#fff; font-family:${DISPLAY}; font-size:13px; margin-right:6px; letter-spacing:-.01em; }
.cbl-dir .rider-card .respond { background:transparent; color:#C99742; border:1px solid #C99742; border-radius:999px; padding:8px 14px; font-family:${DISPLAY}; font-weight:800; font-size:11px; letter-spacing:.12em; text-transform:uppercase; }
.cbl-dir .rider-card .respond:hover { background:rgba(201,151,66,.12); }

/* Coupons grid */
.cbl-dir .coupons-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
.cbl-dir .coupon { background:#141414; border:1.5px dashed rgba(201,151,66,.45); border-radius:14px; display:grid; grid-template-columns:120px 1fr; overflow:hidden; transition:border-color .25s; }
.cbl-dir .coupon:hover { border-color:#C99742; }
.cbl-dir .coupon .disc { background:#C99742; color:#000; display:flex; align-items:center; justify-content:center; text-align:center; font-family:${DISPLAY}; font-weight:900; font-size:36px; line-height:1; letter-spacing:-.02em; padding:14px 8px; border-right:2px dashed rgba(0,0,0,.25); flex-direction:column; }
.cbl-dir .coupon .disc small { font-size:11px; letter-spacing:.14em; text-transform:uppercase; margin-top:4px; font-family:${MONO}; font-weight:400; }
.cbl-dir .coupon.featured { border-style:solid; border-width:1.5px; background:linear-gradient(180deg, rgba(201,151,66,.10), rgba(201,151,66,.02)); box-shadow:0 10px 28px rgba(201,151,66,.18); }
.cbl-dir .coupon-img { aspect-ratio:16/9; border-radius:8px; background-size:cover; background-position:center; margin-bottom:8px; position:relative; overflow:hidden; }
.cbl-dir .coupon-img .feat-tag { position:absolute; top:6px; left:6px; background:#C99742; color:#000; font-family:${DISPLAY}; font-weight:900; font-size:9px; letter-spacing:.14em; text-transform:uppercase; padding:3px 7px; border-radius:3px; }
.cbl-dir .coupon .body { padding:14px 16px; display:flex; flex-direction:column; gap:4px; }
.cbl-dir .coupon h4 { font-family:${DISPLAY}; font-weight:900; font-size:18px; line-height:1.1; text-transform:uppercase; }
.cbl-dir .coupon .partner { font-family:${MONO}; font-size:10px; color:#C99742; letter-spacing:.12em; text-transform:uppercase; }
.cbl-dir .coupon .terms { font-size:11px; line-height:1.4; color:#888; }
.cbl-dir .coupon .code { margin-top:6px; font-family:${MONO}; font-size:11px; color:#fff; letter-spacing:.14em; border-top:1px solid rgba(255,255,255,.06); padding-top:6px; }
.cbl-dir .coupon .code b { color:#C99742; }

/* Pricing tiers */
.cbl-dir .tiers { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
.cbl-dir .tier { position:relative; background:#141414; border:1px solid rgba(255,255,255,.08); border-radius:18px 0 18px 0; padding:26px 24px 22px; display:flex; flex-direction:column; }
.cbl-dir .tier.accent { background:linear-gradient(180deg, rgba(201,151,66,.14), rgba(201,151,66,.02)); border:1.5px solid #C99742; box-shadow:0 14px 40px rgba(201,151,66,.18); }
.cbl-dir .tier .badge { position:absolute; top:-12px; left:50%; transform:translateX(-50%); background:#C99742; color:#000; font-family:${DISPLAY}; font-weight:900; font-size:11px; letter-spacing:.16em; text-transform:uppercase; padding:5px 14px; border-radius:999px; white-space:nowrap; }
.cbl-dir .tier .name { font-family:${DISPLAY}; font-weight:900; font-size:24px; text-transform:uppercase; letter-spacing:-.005em; margin-bottom:12px; }
.cbl-dir .tier .price-block { display:flex; align-items:baseline; gap:10px; margin-bottom:18px; }
.cbl-dir .tier .price { font-family:${DISPLAY}; font-weight:900; font-size:44px; line-height:1; letter-spacing:-.02em; color:#fff; }
.cbl-dir .tier.accent .price { color:#C99742; }
.cbl-dir .tier .per { font-family:${MONO}; font-size:11px; color:#888; letter-spacing:.12em; text-transform:uppercase; }
.cbl-dir .tier ul { list-style:none; padding:0; margin:0 0 22px; display:flex; flex-direction:column; gap:8px; flex:1; }
.cbl-dir .tier li { display:flex; align-items:flex-start; gap:8px; color:#C8C8C8; font-size:13px; line-height:1.45; }
.cbl-dir .tier li svg { flex-shrink:0; margin-top:3px; }
.cbl-dir .tier li.muted { color:#666; }
.cbl-dir .tier .cta { background:transparent; color:#C99742; border:1px solid #C99742; border-radius:999px; padding:12px 18px; width:100%; font-family:${DISPLAY}; font-weight:800; font-size:13px; letter-spacing:.14em; text-transform:uppercase; text-align:center; display:block; }
.cbl-dir .tier.accent .cta { background:#C99742; color:#000; border-color:#C99742; }
.cbl-dir .tier .cta:hover { background:rgba(201,151,66,.12); }
.cbl-dir .tier.accent .cta:hover { background:#DDB15F; }

/* Pickup banner */
.cbl-dir .pickup-banner { background:linear-gradient(135deg, rgba(201,151,66,.16), rgba(201,151,66,.04)); border:1px solid rgba(201,151,66,.4); border-radius:18px 0 18px 0; padding:22px 28px; display:grid; grid-template-columns:auto 1fr auto; gap:24px; align-items:center; margin-top:24px; }
.cbl-dir .pickup-banner .ic { width:56px; height:56px; border-radius:50%; border:1.5px solid #C99742; color:#C99742; display:flex; align-items:center; justify-content:center; }
.cbl-dir .pickup-banner h3 { font-family:${DISPLAY}; font-weight:900; font-size:22px; text-transform:uppercase; letter-spacing:-.005em; line-height:1; margin-bottom:6px; }
.cbl-dir .pickup-banner p { color:#B8B8B8; font-size:13px; line-height:1.45; }
.cbl-dir .pickup-banner .cta { background:#C99742; color:#000; border:0; padding:12px 22px; border-radius:999px; font-family:${DISPLAY}; font-weight:900; font-size:13px; letter-spacing:.12em; text-transform:uppercase; white-space:nowrap; }
.cbl-dir .pickup-banner .cta:hover { background:#DDB15F; }

/* Newsletter */
.cbl-dir .news-band { background: radial-gradient(ellipse at top right, rgba(201,151,66,.12), transparent 60%), linear-gradient(180deg, #0A0A0A 0%, #0F0F0F 100%); border-top:1px solid rgba(255,255,255,.06); }
.cbl-dir .news-grid { display:grid; grid-template-columns:1.2fr 1fr; gap:56px; align-items:center; }
.cbl-dir .news-form { display:flex; gap:10px; max-width:460px; }
.cbl-dir .news-form input { flex:1; background:#141414; border:1px solid rgba(255,255,255,.10); border-radius:999px; padding:14px 20px; font-family:Inter,sans-serif; font-size:15px; color:#fff; outline:0; }
.cbl-dir .news-form input::placeholder { color:#555; }
.cbl-dir .news-form input:focus { border-color:#C99742; }
.cbl-dir .news-form button { background:#C99742; color:#000; border:0; padding:14px 28px; border-radius:999px; font-family:${DISPLAY}; font-weight:900; font-size:14px; letter-spacing:.14em; text-transform:uppercase; }
.cbl-dir .news-form button:hover { background:#DDB15F; }

/* Responsive */
@media (max-width:1100px) {
  .cbl-dir .hero { padding:22px 24px 16px; }
  .cbl-dir section.band { padding:36px 24px 48px; }
  .cbl-dir h1.hero-title .dir-icon { width:160px; height:130px; }
  .cbl-dir .listings-grid { grid-template-columns:repeat(2,1fr); }
  .cbl-dir .coupons-grid { grid-template-columns:1fr 1fr; }
  .cbl-dir .tiers { grid-template-columns:1fr 1fr; }
  .cbl-dir .pickup-banner { grid-template-columns:1fr; text-align:left; }
  .cbl-dir .news-grid { grid-template-columns:1fr; gap:24px; }
  .cbl-dir .compare-grid { grid-template-columns:1fr; }
}
@media (max-width:720px) {
  /* Mobile legibility: size hero to fit, hide decorative icon, raise small fonts */
  .cbl-dir h1.hero-title { flex-wrap:wrap; gap:10px 14px; font-size:clamp(30px,8vw,44px); }
  .cbl-dir h1.hero-title .dir-icon { display:flex; width:58px; height:46px; }
  .cbl-dir .hero-subtitle { font-size:clamp(24px,6.5vw,34px); }
  .cbl-dir .hero p.lede { font-size:16px; }
  .cbl-dir .signup-hint { font-size:12px; }
  .cbl-dir .listings-grid { grid-template-columns:1fr; }
  .cbl-dir .coupons-grid { grid-template-columns:1fr; }
  .cbl-dir .tiers { grid-template-columns:1fr; }
  .cbl-dir .eyebrow, .cbl-dir .section-eyebrow, .cbl-dir .section-head .count { font-size:12px; }
  .cbl-dir .listing h3 { font-size:20px; }
  .cbl-dir .listing .loc { font-size:12px; }
  .cbl-dir .listing .desc { font-size:14.5px; }
  .cbl-dir .listing .badge, .cbl-dir .listing .img-count, .cbl-dir .listing .foot { font-size:12px; }
  .cbl-dir .driver-card .schedule, .cbl-dir .driver-card .stats { font-size:12px; }
  .cbl-dir .driver-card .blurb { font-size:14.5px; }
  .cbl-dir .rider-card .tag, .cbl-dir .rider-card .when, .cbl-dir .rider-card .author { font-size:12px; }
  .cbl-dir .rider-card .blurb { font-size:14.5px; }
  .cbl-dir .coupon .partner, .cbl-dir .coupon .terms, .cbl-dir .coupon .code { font-size:12px; }
  .cbl-dir .tier .per { font-size:12px; }
  .cbl-dir .tier li, .cbl-dir .compare-col li { font-size:14px; }
  .cbl-dir .mock .meta, .cbl-dir .mock .desc, .cbl-dir .mock .foot { font-size:12px; }
  .cbl-dir .chip { font-size:12px; }
}
`;

/* ── Brand icons (viewBox 288×227.01, stroke-based) ── */
function BrandIcon({ paths, s = 32 }: { paths: ReactNode; s?: number }) {
  return (
    <svg
      width={s}
      height={s * (227.01 / 288)}
      viewBox="0 0 288 227.01"
      fill="none"
      stroke="currentColor"
      strokeWidth="11"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths}
    </svg>
  );
}

const IconDirectory = ({ s }: { s?: number }) => (
  <BrandIcon
    s={s}
    paths={
      <>
        <rect x="48.99" y="34.24" width="34.19" height="22.84" />
        <rect x="48.99" y="79.95" width="34.19" height="22.84" />
        <rect x="48.99" y="124.95" width="34.19" height="22.84" />
        <rect x="48.99" y="170.31" width="34.19" height="22.84" />
        <circle cx="171.9" cy="99.72" r="16.11" />
        <path d="M179.81,114.07s21.98,10.88,21.98,28.14c-13.26,0-20.88,0-20.88,0h-12.56s-14.3,0-27.56,0c0-17.26,21.98-28.14,21.98-28.14" />
        <path d="M66.08,195.01v21.86h162.23c10.7,0,10.7-10.7,10.7-10.7V22.43c0-10.7-12.09-11.16-12.09-11.16H66.08v20.47" />
        <line x1="103.18" y1="28.48" x2="103.18" y2="200.13" />
      </>
    }
  />
);

const IconTransport = ({ s }: { s?: number }) => (
  <BrandIcon
    s={s}
    paths={
      <>
        <path d="M65.43,90.76l-13.2,21.57c-2.58,4.17-3.66,8.95-3.11,13.68l5.26,45.23h89.57" />
        <path d="M222.56,90.76l13.2,21.57c2.58,4.17,3.66,8.95,3.11,13.68l-5.26,45.23h-89.57" />
        <path d="M64.93,91.59s3.11,4.94,14.34,4.94h66.01" />
        <path d="M223.07,91.59s-3.11,4.94-14.34,4.94h-66.01" />
        <path d="M145.89,57.11s-49.54-.65-59.55,4.11c-8.76,4.17-18.6,24.53-20.91,29.54" />
        <path d="M142.11,57.11s49.54-.65,59.55,4.11c8.76,4.17,18.6,24.53,20.91,29.54" />
        <path d="M110.99,152.62h69.8" />
      </>
    }
  />
);

const IconAttract = ({ s }: { s?: number }) => (
  <BrandIcon
    s={s}
    paths={
      <>
        <circle cx="175.91" cy="51.34" r="16.21" />
        <circle cx="110.58" cy="82.5" r="16.21" />
        <path d="M175.91,17.05s-36.14,2.29-36.14,37.66,36.14,59.27,36.14,59.27c0,0,35.1-22.04,35.1-61.58,0-35.48-35.1-35.35-35.1-35.35Z" />
        <path d="M55.97,135.76c-1.34-6.16-1.51-9.88-1.51-16.44,0-44.47,32.42-81.37,74.91-88.35" />
        <path d="M221.73,74.85c7.51,13.1,11.81,28.29,11.81,44.48,0,8.08-1.07,15.91-3.08,23.36" />
        <path d="M153.24,153.53s23.41-25.05,29.69-24.84c8.98.3,41.25,30.53,41.25,30.53-14.05,31.07-43.87,49.64-80.18,49.64-38.46,0-71.25-24.25-83.93-58.29,0,0,33.97-36.62,42.62-36.59,5.39.02,7.83.64,24.11,16.8,16.28,16.16,63.57,61.36,63.57,61.36" />
      </>
    }
  />
);

const IconPerson = ({ s }: { s?: number }) => (
  <BrandIcon
    s={s}
    paths={
      <>
        <circle cx="144" cy="68" r="36" />
        <path d="M68,210 c0,-48 34,-78 76,-78 s76,30 76,78" />
      </>
    }
  />
);

const IconBag = ({ s }: { s?: number }) => (
  <BrandIcon
    s={s}
    paths={
      <>
        <path d="M68,86 h152 l-12,124 c-.6,6 -5.6,10 -11.6,10 H91.6 c-6,0 -11-4 -11.6-10 z" />
        <path d="M104,86 v-18 c0,-22 18,-40 40,-40 s40,18 40,40 v18" />
      </>
    }
  />
);

function IconCoupon({ s = 32 }: { s?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l4-4h10l4 4v6l-4 4H7l-4-4z" />
      <path d="M9 12h6" />
    </svg>
  );
}

function CatIcon({ p }: { p: string }) {
  return <svg viewBox="0 0 24 24" fill="currentColor"><path d={p} /></svg>;
}

const SECTIONS: SecDef[] = [
  { key: "CLASSIFIEDS", label: "Classifieds", Icon: IconDirectory },
  { key: "DRIVERS", label: "Driver Posts", Icon: IconTransport },
  { key: "RIDERS", label: "Rider Requests", Icon: IconPerson },
  { key: "SHOP", label: "Shopping", Icon: IconBag },
  { key: "COUPONS", label: "Coupons & Offers", Icon: IconCoupon },
];

const CHIPS: Record<string, Chip[]> = {
  CLASSIFIEDS: [
    { k: "ALL", l: "All", d: "M4 6h16M4 12h16M4 18h16" },
    { k: "VEH", l: "Vehicles", d: "M3 13l2-5h14l2 5v5h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-5z" },
    { k: "ELEC", l: "Electronics", d: "M3 5h18v12H3z M9 19h6v2H9z" },
    { k: "FURN", l: "Furniture", d: "M4 9h16v6H4z M5 15v4 M19 15v4" },
    { k: "FOOD", l: "Food", d: "M4 8h16v3a8 8 0 0 1-16 0V8z M3 21h18" },
    { k: "SERV", l: "Services", d: "M14 7l3 3-9 9H5v-3l9-9z M16 5l3 3" },
    { k: "JOBS", l: "Jobs", d: "M3 7h18v12H3z M9 7V5h6v2" },
    { k: "HOUSE", l: "Housing", d: "M3 12l9-8 9 8v8H3z" },
    { k: "TIX", l: "Tickets", d: "M3 8h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V8z" },
    { k: "FREE", l: "Free", d: "M12 4v16 M4 12h16" },
  ],
  DRIVERS: [
    { k: "ALL", l: "All Drivers", d: "M4 6h16M4 12h16M4 18h16" },
    { k: "WEEKLY", l: "Weekly Schedule", d: "M3 5h18v16H3z M3 9h18 M8 3v4 M16 3v4" },
    { k: "AIRPORT", l: "Airport Runs", d: "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5L21 16z" },
    { k: "EVENT", l: "Event Drivers", d: "M12 2l3 7 7 .8-5.4 4.8L18 22l-6-3.6L6 22l1.4-7.4L2 9.8 9 9z" },
    { k: "LUX", l: "Luxury / Black", d: "M3 13l2-5h14l2 5v5h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-5z" },
  ],
  RIDERS: [
    { k: "ALL", l: "All Requests", d: "M4 6h16M4 12h16M4 18h16" },
    { k: "EVENT", l: "Event Ride", d: "M12 2l3 7 7 .8-5.4 4.8L18 22l-6-3.6L6 22l1.4-7.4L2 9.8 9 9z" },
    { k: "AIRPORT", l: "Airport", d: "M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5L21 16z" },
    { k: "REC", l: "Recurring", d: "M3 5h18v16H3z M3 9h18" },
    { k: "GROUP", l: "Group / Party", d: "M9 8a3 3 0 1 1 6 0 3 3 0 0 1-6 0z M3 21c0-4 4-6 9-6s9 2 9 6" },
  ],
  SHOP: [
    { k: "ALL", l: "All", d: "M4 6h16M4 12h16M4 18h16" },
    { k: "LOCAL", l: "Local Shops", d: "M3 7h18l-1 14H4z M8 7V5a4 4 0 0 1 8 0v2" },
    { k: "ONLINE", l: "Online", d: "M4 5h16v12H4z M2 21h20" },
  ],
  COUPONS: [
    { k: "ALL", l: "All Coupons", d: "M4 6h16M4 12h16M4 18h16" },
    { k: "FOOD", l: "Food & Bev", d: "M7 2v8M11 2v8M9 10v12" },
    { k: "RETAIL", l: "Retail", d: "M3 7h18l-1 14H4z" },
    { k: "SERV", l: "Services", d: "M14 7l3 3-9 9H5v-3l9-9z" },
  ],
};

const CLASSIFIEDS: Listing[] = [
  { id: 1, name: "2018 Honda Civic - Low Miles", loc: "Squirrel Hill · Vehicles", desc: "Clean title, 62k miles, manual. New tires, fresh inspection, garage-kept. Service records included.", price: "$11,500", photos: 8, badges: [{ t: "★ Featured", k: "feat" }], img: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=540&fit=crop", featured: true },
  { id: 2, name: "IKEA Sectional Couch", loc: "Lawrenceville · Furniture", desc: "Grey 3-piece sectional with ottoman. 2 years old, smoke-free home. Pickup only.", price: "$425", photos: 5, badges: [{ t: "★ Featured", k: "feat" }], img: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=540&fit=crop", featured: true },
  { id: 3, name: 'MacBook Pro 16" M2', loc: "Downtown · Electronics", desc: "2023 model, 32GB RAM, 1TB SSD. AppleCare+ until 2027.", price: "$1,850", photos: 4, badges: [{ t: "★ Featured", k: "feat" }], img: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=540&fit=crop", featured: true },
  { id: 4, name: "Mountain Bike - Trek", loc: "Bloomfield · Vehicles", desc: "Trek X-Caliber 9, size L. Hydraulic disc brakes.", price: "$680", badges: [], placeholder: true },
  { id: 5, name: "Concert Tickets - 5/30", loc: "Strip District · Tickets", desc: "2 tickets, section 124. Below face value.", price: "$140", badges: [], placeholder: true },
  { id: 6, name: "Free Moving Boxes", loc: "Shadyside · Free", desc: "30+ boxes, various sizes. Curbside pickup this weekend.", price: "FREE", badges: [{ t: "Free" }], placeholder: true },
];

const DRIVER_POSTS: Driver[] = [
  { id: 1, name: "Marcus T.", schedule: "Mon-Fri · 6 AM – 9 AM · Airport Runs", blurb: "Specializing in PIT airport runs and downtown business commutes. Black car available. 1,200+ CBL rides, 5.0★. Scan my QR code to book directly.", rides: "1.2k", rating: "5.0", vehicle: "Lincoln Continental", tags: ["Airport", "Black Car"], featured: true },
  { id: 2, name: "Sarah J.", schedule: "Weekends · Concert & Event Drivers", blurb: "Weekend warrior! Available for concerts, sporting events, and night-out group runs. Up to 6 passengers. Book me through the CBL app.", rides: "487", rating: "4.9", vehicle: "Chevy Suburban", tags: ["Events", "Group"] },
  { id: 3, name: "David L.", schedule: "Tue/Thu/Sat · Recurring Riders Welcome", blurb: "Set up a weekly recurring schedule with me. I drive my regulars to dialysis, work, and the gym. Same-day messaging.", rides: "2.1k", rating: "4.9", vehicle: "Honda Odyssey", tags: ["Recurring"] },
  { id: 4, name: "Lena R.", schedule: "Evenings · 5 PM – 11 PM · Dinner & Drinks", blurb: "After-work driver. Open for dinner runs, date nights, and bar hops. No surge pricing — book ahead via my QR code.", rides: "612", rating: "4.8", vehicle: "Audi Q5", tags: ["Evening", "Lux"] },
];

const RIDER_POSTS: Rider[] = [
  { id: 1, name: "Jamie K.", when: "SAT MAY 31 · 7:00 PM", title: "Need a driver this weekend for the Jay-Z concert", blurb: "Looking for a CBL Private Driver to take 4 of us from Squirrel Hill to PPG Paints Arena and back. Will tip generously. Black car preferred.", tags: ["Event Ride", "4 Passengers", "Round-Trip"], urgent: true },
  { id: 2, name: "Tom & Linda", when: "WED · Weekly · 8 AM", title: "Weekly grocery run — Recurring Wed mornings", blurb: "Senior couple looking for a reliable driver every Wednesday morning. Highland Park → Whole Foods Wexford → home. About 90 minutes total.", tags: ["Recurring", "Senior"] },
  { id: 3, name: "Marcus P.", when: "THU JUN 5 · 4:00 AM", title: "Early-morning airport run to PIT", blurb: "Flight at 6:15 AM out of PIT. Need pickup in Mt. Lebanon at 4 AM sharp. Open to scheduling now.", tags: ["Airport", "Solo"] },
  { id: 4, name: "Bachelorette Party", when: "FRI JUN 13 · 9 PM", title: "Bachelorette party — 6 of us, downtown bar crawl", blurb: "Friday night, downtown to South Side bar crawl, then home. Need a Suburban or van for 6. We tip well!", tags: ["Group", "Night Out", "6+ Passengers"] },
];

const SHOPPING: Listing[] = [
  { id: 1, name: "Wigle Whiskey Distillery", loc: "Strip District · Liquor", desc: "Pittsburgh's first craft distillery. Tastings, tours, exclusive bottles for CBL members.", price: "CBL Member", badges: [{ t: "★ Featured", k: "feat" }, { t: "Local" }], img: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=800&h=540&fit=crop", featured: true },
  { id: 2, name: "Penzeys Spices", loc: "Strip District · Pantry", desc: "Fresh-ground spices and blends. Sample bins, knowledgeable staff.", price: "15% OFF", badges: [{ t: "★ Featured", k: "feat" }], img: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&h=540&fit=crop", featured: true },
  { id: 3, name: "Three Rivers Outpost", loc: "Lawrenceville · Outdoor Gear", desc: "Locally owned outdoor gear shop. Patagonia, Arc'teryx, custom fittings.", price: "10% OFF", badges: [], img: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=540&fit=crop" },
];

const COUPONS: Coupon[] = [
  { disc: "20", unit: "%", title: "Market Street Patio", partner: "East Liberty · Brunch", terms: "Valid Sat/Sun all day. Dine-in only. Not combinable with other offers.", code: "CBLBRUNCH20", featured: true, img: "/eats/imagery/mm-patio.jpg" },
  { disc: "$10", unit: "", title: "Iron Valley Pies", partner: "Strip District · Pizza", terms: "Off any large square. Pickup or delivery via CBL.", code: "CBLPIE10", featured: true, img: "/eats/imagery/iv-pies.jpg" },
  { disc: "BOGO", unit: "", title: "Wigle Whiskey Tastings", partner: "Strip District · Distillery", terms: "Buy 1 tasting flight, get 1 free. Sun-Thu, must show member ID.", code: "CBLWIGLE" },
  { disc: "FREE", unit: "", title: "Phipps Conservatory Coat Check", partner: "Oakland · Attraction", terms: "Free coat check for CBL members + one guest. Valid year-round.", code: "PHIPPSCBL" },
  { disc: "15", unit: "%", title: "Industry Public House", partner: "Lawrenceville · Bar", terms: "15% off entire bill Sun-Thu. Show member badge to server.", code: "IPHCBL15" },
  { disc: "$25", unit: "", title: "Hotel Monaco Weekend", partner: "Cultural District · Hotel", terms: "Off any 2-night weekend stay. Subject to availability.", code: "MONACO25" },
];

const PRICING: Tier[] = [
  { name: "Basic", price: "Free", per: "forever", bullets: ["Text-only listing", "30 days active", "Category placement", "Contact via in-app message"], muted: ["No photos", "No featured badge", "Standard placement", "No view stats"], cta: "Post Free Ad" },
  { name: "Photo Boost", price: "$2.99", per: "per listing", bullets: ["Up to 5 photos", "30 days active", "Photo gallery", "Category placement"], muted: ["No featured badge", "Standard placement"], cta: "Add Photos" },
  { name: "Featured", price: "$4.99", per: "per week", accent: true, badge: "Most Popular", bullets: ["Up to 10 photos", "60 days active", "Featured badge", "Top of search results", "Gold border highlight", "View counter"], cta: "Go Featured" },
  { name: "Business Pro", price: "$29.99", per: "per month", bullets: ["Unlimited photos", "Unlimited listings", "CBL Partner badge", "Auto-featured", "Analytics dashboard", "Priority support"], cta: "Go Pro" },
];

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7l3 3 6-7" fill="none" stroke="#C99742" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Cross = () => (
  <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3l8 8M11 3l-8 8" stroke="#666" strokeWidth="2" strokeLinecap="round" /></svg>
);

function Hero() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="eyebrow">classifieds · drivers · riders · shopping · coupons</div>
        <h1 className="hero-title">
          <span className="title-stack">
            <span className="h1-main">Directory</span>
            <span className="hero-subtitle">
              <span>Post it.</span>
              <span className="it">Find it. Book it.</span>
            </span>
          </span>
          <span className="dir-icon" aria-hidden="true">
            <svg viewBox="0 0 288 227.01" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
              <rect x="48.99" y="34.24" width="34.19" height="22.84" />
              <rect x="48.99" y="79.95" width="34.19" height="22.84" />
              <rect x="48.99" y="124.95" width="34.19" height="22.84" />
              <rect x="48.99" y="170.31" width="34.19" height="22.84" />
              <circle cx="171.9" cy="99.72" r="16.11" />
              <path d="M179.81,114.07s21.98,10.88,21.98,28.14c-13.26,0-20.88,0-20.88,0h-12.56s-14.3,0-27.56,0c0-17.26,21.98-28.14,21.98-28.14" />
              <path d="M66.08,195.01v21.86h162.23c10.7,0,10.7-10.7,10.7-10.7V22.43c0-10.7-12.09-11.16-12.09-11.16H66.08v20.47" />
              <line x1="103.18" y1="28.48" x2="103.18" y2="200.13" />
            </svg>
          </span>
        </h1>
        <p className="lede">
          Local classifieds, driver schedules, rider requests, member-only coupons,
          and curated shopping — all in one place. Browse freely. Sign in to post.
        </p>
        <a className="signup-hint" href={DIR_URL} target="_blank" rel="noopener noreferrer">
          Sign in required to post · Free to join
        </a>
      </div>
    </section>
  );
}

function Filters({
  section, setSection, cat, setCat,
}: {
  section: string; setSection: (v: string) => void; cat: string; setCat: (v: string) => void;
}) {
  const chips = CHIPS[section] || CHIPS.CLASSIFIEDS;
  return (
    <div className="filters">
      <div className="filters-inner">
        <div className="sec-row">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              className={"sec-btn" + (section === s.key ? " active" : "")}
              onClick={() => { setSection(s.key); setCat("ALL"); }}
            >
              <span className="ic"><s.Icon s={32} /></span>
              {s.label}
            </button>
          ))}
        </div>
        <div className="chip-row">
          {chips.map((c) => (
            <button
              key={c.k}
              className={"chip" + (cat === c.k ? " active" : "")}
              onClick={() => setCat(c.k)}
            >
              <CatIcon p={c.d} />
              {c.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionHead({ section }: { section: string }) {
  const h: Record<string, { eb: string; h: string; sub: string; cta: string }> = {
    CLASSIFIEDS: { eb: "classifieds · buy · sell · trade", h: "Local Classifieds", sub: "powered by CBL", cta: "+ Post Listing" },
    DRIVERS: { eb: "driver schedules · qr codes · self-promo", h: "Driver Posts", sub: "meet your driver", cta: "+ Post Your Schedule" },
    RIDERS: { eb: "rider requests · events · airport · recurring", h: "Rider Requests", sub: "need a ride?", cta: "+ Post a Request" },
    SHOPPING: { eb: "shopping · local + online", h: "Shopping", sub: "shops we love", cta: "+ List Your Shop" },
    COUPONS: { eb: "coupons · member-only offers", h: "Coupons", sub: "member savings", cta: "+ Submit Coupon" },
  };
  const d = h[section] || h.CLASSIFIEDS;
  return (
    <div className="section-head">
      <div>
        <div className="section-eyebrow">{d.eb}</div>
        <h2 className="section-h2">
          {d.h}
          <span className="it">{d.sub}</span>
        </h2>
      </div>
      <a className="post-btn" href={DIR_URL} target="_blank" rel="noopener noreferrer">{d.cta}</a>
    </div>
  );
}

function FreeListingMock() {
  return (
    <div className="mock" style={{ background: "linear-gradient(180deg,#161616 0%,#0F0F0F 100%)" }}>
      <div className="body" style={{ paddingTop: 18 }}>
        <h4>2018 Honda Civic - Low Miles</h4>
        <div className="meta">Vehicles · Posted 2 days ago</div>
        <div className="desc">Clean title, 62k miles, manual. New tires. Text for details.</div>
        <div className="price">$11,500</div>
        <div className="foot">
          <span>Basic Listing</span>
          <span>30 days</span>
        </div>
      </div>
    </div>
  );
}

function FeaturedListingMock() {
  return (
    <div className="mock featured">
      <div className="img" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&h=450&fit=crop')" }}>
        <span className="feat-badge">★ Featured</span>
        <span className="img-count">📷 8 photos</span>
      </div>
      <div className="body">
        <h4>2018 Honda Civic - Low Miles</h4>
        <div className="meta">Vehicles · <span className="gold">Top of search · 60 days</span></div>
        <div className="desc">Clean title, 62k miles, manual. New tires, fresh inspection, garage-kept. Service records included. Negotiable.</div>
        <div className="price">$11,500</div>
        <div className="foot">
          <span style={{ color: "#C99742" }}>★ 247 views this week</span>
          <span>📞 Contact verified</span>
        </div>
      </div>
    </div>
  );
}

function CompareBand() {
  return (
    <section className="band compare-band">
      <div className="band-inner">
        <div className="section-eyebrow">free vs. featured · same listing, different reach</div>
        <h2 className="section-h2">
          Free ad vs. featured <span className="it">see the difference</span>
        </h2>
        <p style={{ color: "#B0B0B0", fontSize: 15, lineHeight: 1.55, maxWidth: "62ch", marginBottom: 28 }}>
          Same 2018 Honda Civic, posted two ways. Free gets you live in 30 days.
          Featured gets you photos, top placement, and the gold border that pulls
          eyes in a busy feed.
        </p>
        <div className="compare-grid">
          <div className="compare-col">
            <div className="hdr">
              <div className="lbl">Free Listing</div>
              <div className="price-tag free"><b>$0</b> · 30 days</div>
            </div>
            <FreeListingMock />
            <ul>
              <li><Check /> Text-only — buyers see no photos</li>
              <li><Check /> Standard category placement</li>
              <li className="muted"><Cross /> No featured badge or border</li>
              <li className="muted"><Cross /> Buried below featured listings</li>
            </ul>
            <a className="cta" href={DIR_URL} target="_blank" rel="noopener noreferrer">Post Free Ad</a>
          </div>

          <div className="compare-col featured">
            <div className="hdr">
              <div className="lbl">Featured Listing</div>
              <div className="price-tag"><b>$4.99</b> · per week</div>
            </div>
            <FeaturedListingMock />
            <ul>
              <li><Check /> Up to 10 photos — gallery view</li>
              <li><Check /> Gold border + featured badge</li>
              <li><Check /> Top of search results</li>
              <li><Check /> Live view counter + contact-verified</li>
              <li><Check /> 60 days active</li>
            </ul>
            <a className="cta" href={DIR_URL} target="_blank" rel="noopener noreferrer">Go Featured</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClassifiedCard({ l }: { l: Listing }) {
  return (
    <article className={"listing" + (l.featured ? " featured" : "") + (l.placeholder ? " no-photo" : "")}>
      {l.placeholder ? null : (
        <div className="img" style={{ backgroundImage: `url(${l.img})` }}>
          <div className="badge-row">
            {l.badges?.map((b) => (
              <span key={b.t} className={"badge" + (b.k === "feat" ? " feat" : "")}>{b.t}</span>
            ))}
          </div>
          {l.photos && <span className="img-count">📷 {l.photos}</span>}
        </div>
      )}
      <div className="body">
        <h3>{l.name}</h3>
        <div className="loc">{l.loc}</div>
        <p className="desc">{l.desc}</p>
        <div className="price">{l.price}</div>
        <div className="foot">
          <span>{l.featured ? <span style={{ color: "#C99742" }}>★ Featured · 247 views</span> : "Basic listing"}</span>
          <span className="arrow">›</span>
        </div>
      </div>
    </article>
  );
}

function MockQR() {
  const pattern = [
    [1, 1, 1, 0, 1, 1, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1],
    [0, 1, 0, 1, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 0],
    [1, 1, 1, 0, 0, 1, 1],
    [1, 0, 1, 1, 1, 1, 1],
  ];
  return (
    <div className="qr">
      {pattern.flatMap((row, ri) =>
        row.map((bit, ci) => <div key={ri + "-" + ci} className={bit ? "b" : ""} />)
      )}
    </div>
  );
}

function DriverCard({ d }: { d: Driver }) {
  return (
    <article className={"driver-card" + (d.featured ? " featured" : "")}>
      <MockQR />
      <div className="body">
        <div className="name">{d.name}</div>
        <div className="schedule">{d.schedule}</div>
        <p className="blurb">{d.blurb}</p>
        <div className="stats">
          <span><b>{d.rides}</b>rides</span>
          <span><b>★ {d.rating}</b></span>
          <span style={{ color: "#C99742" }}>{d.vehicle}</span>
        </div>
      </div>
    </article>
  );
}

function RiderCard({ r }: { r: Rider }) {
  return (
    <article className={"rider-card" + (r.urgent ? " urgent" : "")}>
      <div className="tag-row">
        {r.tags.map((t, i) => (
          <span key={t} className={"tag" + (r.urgent && i === 0 ? " urgent" : "")}>{t}</span>
        ))}
      </div>
      <h4>{r.title}</h4>
      <div className="when">{r.when}</div>
      <p className="blurb">{r.blurb}</p>
      <div className="foot">
        <span className="author"><b>{r.name}</b>· Member · 12 rides</span>
        <a className="respond" href={DIR_URL} target="_blank" rel="noopener noreferrer">Respond →</a>
      </div>
    </article>
  );
}

function PickupBanner() {
  return (
    <div className="pickup-banner">
      <div className="ic">
        <svg width="30" height="24" viewBox="0 0 288 227.01" fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
          <path d="M65.43,90.76l-13.2,21.57c-2.58,4.17-3.66,8.95-3.11,13.68l5.26,45.23h89.57" />
          <path d="M222.56,90.76l13.2,21.57c2.58,4.17,3.66,8.95,3.11,13.68l-5.26,45.23h-89.57" />
          <path d="M64.93,91.59s3.11,4.94,14.34,4.94h66.01" />
          <path d="M223.07,91.59s-3.11,4.94-14.34,4.94h-66.01" />
        </svg>
      </div>
      <div>
        <h3>Need a ride to pick up your purchase?</h3>
        <p>CBL Private Drivers handle classified-transaction pickups — safe, tracked meetups with verified locals. 12+ hours in advance.</p>
      </div>
      <a className="cta" href={DIR_URL} target="_blank" rel="noopener noreferrer">Book a Pickup Ride →</a>
    </div>
  );
}

function Pricing() {
  return (
    <section className="band compare-band" style={{ borderTop: 0 }}>
      <div className="band-inner">
        <div className="section-eyebrow">classifieds · all pricing tiers</div>
        <h2 className="section-h2">
          Boost your listing <span className="it">sell faster</span>
        </h2>
        <p style={{ color: "#B0B0B0", fontSize: 15, lineHeight: 1.55, maxWidth: "62ch", marginBottom: 32 }}>
          Free works — but upgraded listings move faster. Add photos, go featured,
          or run a Business Pro presence with analytics.
        </p>
        <div className="tiers">
          {PRICING.map((t) => (
            <div key={t.name} className={"tier" + (t.accent ? " accent" : "")}>
              {t.badge && <div className="badge">{t.badge}</div>}
              <div className="name">{t.name}</div>
              <div className="price-block">
                <div className="price">{t.price}</div>
                <div className="per">{t.per}</div>
              </div>
              <ul>
                {t.bullets.map((b) => (
                  <li key={b}><Check /> {b}</li>
                ))}
                {t.muted?.map((b) => (
                  <li key={b} className="muted"><Cross /> {b}</li>
                ))}
              </ul>
              <a className="cta" href={DIR_URL} target="_blank" rel="noopener noreferrer">{t.cta}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  return (
    <section className="band tight news-band">
      <div className="band-inner">
        <div className="news-grid">
          <div>
            <div className="section-eyebrow">weekly · directory dispatch</div>
            <h2 className="section-h2">
              New listings &amp; deals <span className="it">in your inbox</span>
            </h2>
            <p style={{ color: "#B0B0B0", fontSize: 15, lineHeight: 1.55, maxWidth: "52ch", marginBottom: 20 }}>
              Top new classifieds, featured driver schedules, member-only coupons —
              sent Friday mornings.
            </p>
          </div>
          <form className="news-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="you@yourcity.com" />
            <button type="submit">Subscribe →</button>
          </form>
        </div>
      </div>
    </section>
  );
}

export function Directory() {
  const [section, setSection] = useState("CLASSIFIEDS");
  const [cat, setCat] = useState("ALL");

  return (
    <main className="cbl-dir">
      <style>{DIR_CSS}</style>

      <Hero />
      <Filters section={section} setSection={setSection} cat={cat} setCat={setCat} />

      {section === "CLASSIFIEDS" && (
        <>
          <section className="band">
            <div className="band-inner">
              <SectionHead section="CLASSIFIEDS" />
              <div className="listings-grid">
                {CLASSIFIEDS.map((l) => <ClassifiedCard key={l.id} l={l} />)}
              </div>
              <PickupBanner />
            </div>
          </section>
          <CompareBand />
          <Pricing />
        </>
      )}

      {section === "DRIVERS" && (
        <section className="band">
          <div className="band-inner">
            <SectionHead section="DRIVERS" />
            <p style={{ color: "#B0B0B0", fontSize: 14, lineHeight: 1.55, maxWidth: "62ch", marginBottom: 24, marginTop: -16 }}>
              Independent Drivers post weekly schedules and self-promote with their
              personal CBL QR code. Riders scan, book directly, and skip the search.
            </p>
            <div className="listings-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {DRIVER_POSTS.map((d) => <DriverCard key={d.id} d={d} />)}
            </div>
          </div>
        </section>
      )}

      {section === "RIDERS" && (
        <section className="band">
          <div className="band-inner">
            <SectionHead section="RIDERS" />
            <p style={{ color: "#B0B0B0", fontSize: 14, lineHeight: 1.55, maxWidth: "62ch", marginBottom: 24, marginTop: -16 }}>
              Members post ride requests — events, recurring schedules, airport runs,
              group nights out. CBL Drivers respond directly and book through the app.
            </p>
            <div className="listings-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
              {RIDER_POSTS.map((r) => <RiderCard key={r.id} r={r} />)}
            </div>
          </div>
        </section>
      )}

      {section === "SHOP" && (
        <section className="band">
          <div className="band-inner">
            <SectionHead section="SHOPPING" />
            <div className="listings-grid">
              {SHOPPING.map((l) => <ClassifiedCard key={l.id} l={l} />)}
            </div>
          </div>
        </section>
      )}

      {section === "COUPONS" && (
        <section className="band">
          <div className="band-inner">
            <SectionHead section="COUPONS" />
            <div className="coupons-grid">
              {COUPONS.map((c, i) => (
                <div key={i} className={"coupon" + (c.featured ? " featured" : "")}>
                  <div className="disc">
                    {c.disc}{c.unit && <small>{c.unit}</small>}
                    {!c.unit && c.disc !== "BOGO" && c.disc !== "FREE" && <small>off</small>}
                  </div>
                  <div className="body">
                    {c.featured && c.img && (
                      <div className="coupon-img" style={{ backgroundImage: `url(${c.img})` }}>
                        <span className="feat-tag">★ Featured</span>
                      </div>
                    )}
                    <h4>{c.title}</h4>
                    <div className="partner">{c.partner}</div>
                    <div className="terms">{c.terms}</div>
                    <div className="code">CODE: <b>{c.code}</b></div>
                  </div>
                </div>
              ))}
            </div>
            <CompareBand />
          </div>
        </section>
      )}

      <Newsletter />
    </main>
  );
}
