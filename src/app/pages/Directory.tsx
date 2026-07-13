import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { RIDER_BOOK_URL } from "../lib/constants";
import { getActivePartners, getDirectoryListings, type Partner } from "../lib/supabase/ridesClient";
import {
  getActiveBusinesses,
  type DirectoryBusiness,
  type DirectoryListing,
} from "../lib/supabase/directoryClient";
import { authClient, postDirectoryListing } from "../lib/supabase/authClient";
import { useVisitorLocation } from "../lib/location";
import { ComingSoonSection } from "../components/ComingSoon";
import { JoinModal } from "../components/JoinModal";
import { subscribeEmail } from "../lib/blog";

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
 * Post CTAs open the in-site PostListingModal (member posts a classified into
 * CBL-Rides `directory_listings` via their OWN authenticated Supabase session,
 * RLS-gated — no bridge, no service-role). The remaining action CTAs (Respond,
 * Book Pickup) still link out to Justin's live directory app.
 */

const DISPLAY = "'myriad-pro','Source Sans 3',sans-serif";
const ITALIC = "'Playfair Display',serif";
const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
const MAP_BG = "/eats/imagery/cbl-map-backdrop.jpg";
const DIR_URL = "https://directory.citybucketlist.com/";

type SecDef = { key: string; label: string; Icon: (p: { s?: number }) => JSX.Element };
type Chip = { k: string; l: string; d: string };
type Listing = {
  id: string | number; name: string; loc: string; desc: string; price: string;
  photos?: number; badges?: { t: string; k?: string }[];
  img?: string; featured?: boolean; placeholder?: boolean;
};
type Tier = {
  name: string; price: string; per: string; bullets: string[];
  muted?: string[]; accent?: boolean; badge?: string; cta: string;
};

const DIR_CSS = `
.cbl-dir { background:#0A0A0A; color:#fff; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; min-height:100vh; overflow-x:clip; }
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
  font-family:${MONO}; font-size:12px; letter-spacing:.14em; color:#fff; font-weight:700;
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
.cbl-dir button.signup-hint { background:transparent; border:0; padding:0; text-align:left; }
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
  .cbl-dir h1.hero-title { display:flex; flex-wrap:nowrap; position:relative; gap:0; align-items:flex-start; font-size:clamp(30px,8vw,44px); }
  .cbl-dir h1.hero-title .title-stack { min-width:0; flex:1; }
  .cbl-dir h1.hero-title .title-stack > span:first-child { display:block; padding-right:64px; }
  .cbl-dir h1.hero-title .dir-icon { display:flex; position:absolute; top:0; right:0; width:56px; height:44px; }
  .cbl-dir .hero-subtitle { flex-wrap:nowrap; white-space:nowrap; font-size:clamp(20px,5.4vw,27px); }
  .cbl-dir .eyebrow { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
  .cbl-dir .eyebrow::before { display:inline-block; vertical-align:middle; margin-right:10px; }
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

// Live data only past this point — Driver Posts, Rider Requests, and Coupons
// have no real backing source yet (see ComingSoonSection usage below), so
// there are no mock arrays for them.

function listingToCard(l: DirectoryListing): Listing {
  return {
    id: l.id,
    name: l.title,
    loc: [l.city, l.subcategory || l.category].filter(Boolean).join(" · "),
    desc: l.description || "",
    price: l.price_type === "free" ? "FREE" : l.price != null ? `$${l.price}` : "Contact for price",
    photos: l.photos?.length,
    img: l.photos?.[0],
    badges: l.featured ? [{ t: "★ Featured", k: "feat" }] : l.urgent ? [{ t: "Urgent" }] : [],
    featured: !!l.featured,
    placeholder: !l.photos?.length,
  };
}

function businessToCard(b: DirectoryBusiness): Listing {
  return {
    id: b.id,
    name: b.business_name,
    loc: [b.city, b.directory_category || b.business_type].filter(Boolean).join(" · "),
    desc: b.description || "",
    price: b.rating ? `★ ${b.rating.toFixed(1)} (${b.review_count ?? 0})` : "New listing",
    photos: b.photos?.length,
    img: b.photos?.[0] || b.logo_url || undefined,
    badges: b.featured ? [{ t: "★ Featured", k: "feat" }] : [],
    featured: !!b.featured,
    placeholder: !b.photos?.length && !b.logo_url,
  };
}

function partnerToCard(p: Partner): Listing {
  return {
    id: `partner-${p.id}`,
    name: p.business_name,
    loc: [p.city, p.business_type].filter(Boolean).join(" · "),
    desc: p.description || "",
    price: "CBL Partner",
    img: p.logo_url || undefined,
    badges: [{ t: "★ CBL Partner", k: "feat" }],
    featured: true,
    placeholder: !p.logo_url,
  };
}

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

function Hero({ onPost }: { onPost: () => void }) {
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
        <button type="button" className="signup-hint" onClick={onPost}>
          Sign in required to post · Free to join
        </button>
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

function SectionHead({ section, onPost }: { section: string; onPost: () => void }) {
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
      <button type="button" className="post-btn" onClick={onPost}>{d.cta}</button>
    </div>
  );
}

function FreeListingMock() {
  return (
    <div className="mock" style={{ background: "linear-gradient(180deg,#161616 0%,#0F0F0F 100%)" }}>
      <div className="body" style={{ paddingTop: 18 }}>
        <div style={{ height: 14, background: "rgba(255,255,255,.08)", borderRadius: 4, marginBottom: 8, width: "70%" }} />
        <div className="meta">Your category · Standard placement</div>
        <div style={{ height: 10, background: "rgba(255,255,255,.06)", borderRadius: 4, marginBottom: 6, width: "90%" }} />
        <div style={{ height: 10, background: "rgba(255,255,255,.06)", borderRadius: 4, marginBottom: 14, width: "60%" }} />
        <div className="price" style={{ color: "rgba(201,151,66,.5)" }}>Your price</div>
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
      <div className="img" style={{ background: "linear-gradient(135deg,rgba(201,151,66,.18),rgba(201,151,66,.06))", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="feat-badge">★ Featured</span>
        <span className="img-count">📷 Up to 10 photos</span>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(201,151,66,.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute" }}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
      <div className="body">
        <div style={{ height: 14, background: "rgba(201,151,66,.2)", borderRadius: 4, marginBottom: 8, width: "70%" }} />
        <div className="meta">Your category · <span className="gold">Top of search · 60 days</span></div>
        <div style={{ height: 10, background: "rgba(255,255,255,.08)", borderRadius: 4, marginBottom: 6, width: "90%" }} />
        <div style={{ height: 10, background: "rgba(255,255,255,.08)", borderRadius: 4, marginBottom: 14, width: "75%" }} />
        <div className="price">Your price</div>
        <div className="foot">
          <span style={{ color: "#C99742" }}>★ View counter active</span>
          <span>📞 Contact verified</span>
        </div>
      </div>
    </div>
  );
}

function CompareBand({ onPost }: { onPost: () => void }) {
  return (
    <section className="band compare-band">
      <div className="band-inner">
        <div className="section-eyebrow">free vs. featured · same listing, different reach</div>
        <h2 className="section-h2">
          Free ad vs. featured <span className="it">see the difference</span>
        </h2>
        <p style={{ color: "#B0B0B0", fontSize: 15, lineHeight: 1.55, maxWidth: "62ch", marginBottom: 28 }}>
          Same listing, posted two ways. Free gets you live in 30 days.
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
            <button type="button" className="cta" onClick={onPost}>Post Free Ad</button>
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
            <button type="button" className="cta" onClick={onPost}>Go Featured</button>
          </div>
        </div>
      </div>
    </section>
  );
}

// On-site listing detail — click a card to view the full listing here instead of
// leaving the site (same retention pattern as the Eats / Attractions panels).
const DirModalCtx = createContext<(l: Listing) => void>(() => {});

const LMODAL_CSS = `
.cbl-lmodal { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:16px; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-lmodal * { box-sizing:border-box; }
.cbl-lmodal .backdrop { position:absolute; inset:0; background:rgba(0,0,0,.72); backdrop-filter:blur(2px); }
@keyframes cbl-lmodal-in { from { opacity:0; transform:translateY(10px) scale(.98); } to { opacity:1; transform:none; } }
.cbl-lmodal .panel { position:relative; width:min(540px,100%); max-height:calc(100dvh - 32px); overflow-y:auto; background:#141414; border:1px solid rgba(201,151,66,.4); border-radius:18px 0 18px 0; box-shadow:0 20px 50px rgba(0,0,0,.6); animation:cbl-lmodal-in .24s cubic-bezier(.2,.8,.2,1) both; }
@media (prefers-reduced-motion: reduce) { .cbl-lmodal .panel { animation:none; } }
.cbl-lmodal .shot { position:relative; height:240px; background-size:cover; background-position:center; background-color:#0f0f0f; }
.cbl-lmodal .shot.ph { display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#1a1a1a,#0f0f0f); }
.cbl-lmodal .shot.ph .ph-ic { font-size:44px; opacity:.45; }
.cbl-lmodal .pcount { position:absolute; bottom:12px; right:12px; font-family:${MONO}; font-size:11px; color:#fff; background:rgba(0,0,0,.7); padding:4px 8px; border-radius:4px; }
.cbl-lmodal .close { position:absolute; top:12px; right:12px; z-index:3; width:38px; height:38px; border-radius:50%; background:rgba(0,0,0,.82); border:1.5px solid #C99742; color:#C99742; cursor:pointer; font-size:17px; line-height:1; display:flex; align-items:center; justify-content:center; transition:background .15s,color .15s; }
.cbl-lmodal .close:hover { background:#C99742; color:#000; }
.cbl-lmodal .mbody { padding:20px 24px 24px; color:#EDEDED; }
.cbl-lmodal .badges { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px; }
.cbl-lmodal .badge { font-family:${MONO}; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#B8B8B8; background:#0f0f0f; border:1px solid rgba(255,255,255,.12); padding:4px 9px; border-radius:4px; }
.cbl-lmodal .badge.feat { color:#C99742; border-color:rgba(201,151,66,.5); }
.cbl-lmodal h2 { font-family:${DISPLAY}; font-weight:900; font-size:26px; line-height:1.08; text-transform:uppercase; color:#fff; margin:0 0 6px; }
.cbl-lmodal .loc { font-family:${MONO}; font-size:12px; letter-spacing:.05em; color:#C99742; margin-bottom:14px; }
.cbl-lmodal .price { font-family:${DISPLAY}; font-weight:900; font-size:30px; color:#C99742; margin-bottom:14px; }
.cbl-lmodal .desc { font-size:15px; line-height:1.65; color:#C7C7C7; margin:0 0 18px; white-space:pre-wrap; }
.cbl-lmodal .acts { display:flex; gap:10px; flex-wrap:wrap; }
.cbl-lmodal .acts a { flex:1 1 auto; text-align:center; text-decoration:none; padding:13px 18px; border-radius:999px; font-family:${DISPLAY}; font-weight:800; font-size:12.5px; letter-spacing:.06em; text-transform:uppercase; background:#C99742; color:#000; }
.cbl-lmodal .acts a:hover { background:#DDB15F; }
.cbl-lmodal .note { margin:14px 0 0; font-size:12.5px; line-height:1.5; color:#888; }
`;

function DirListingModal({ l, onClose }: { l: Listing | null; onClose: () => void }) {
  useEffect(() => {
    if (!l) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [l, onClose]);
  if (!l) return null;
  return (
    <div className="cbl-lmodal" role="dialog" aria-modal="true" aria-label={l.name}>
      <style>{LMODAL_CSS}</style>
      <div className="backdrop" onClick={onClose} />
      <div className="panel">
        {l.placeholder || !l.img ? (
          <div className="shot ph">
            <span className="ph-ic">🏷️</span>
          </div>
        ) : (
          <div className="shot" style={{ backgroundImage: `url(${l.img})` }}>
            {l.photos ? <span className="pcount">📷 {l.photos}</span> : null}
          </div>
        )}
        <button className="close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        <div className="mbody">
          {l.badges && l.badges.length > 0 && (
            <div className="badges">
              {l.badges.map((b) => (
                <span key={b.t} className={"badge" + (b.k === "feat" ? " feat" : "")}>
                  {b.t}
                </span>
              ))}
            </div>
          )}
          <h2>{l.name}</h2>
          <div className="loc">{l.loc}</div>
          <div className="price">{l.price}</div>
          {l.desc && <p className="desc">{l.desc}</p>}
          <div className="acts">
            <a href={RIDER_BOOK_URL} target="_blank" rel="noreferrer">
              Book a Pickup Ride →
            </a>
          </div>
          <p className="note">
            Meeting a seller? CBL Private Drivers handle safe, tracked pickups — scheduled 12+ hours ahead.
          </p>
        </div>
      </div>
    </div>
  );
}

function ClassifiedCard({ l }: { l: Listing }) {
  const openModal = useContext(DirModalCtx);
  return (
    <article
      className={"listing" + (l.featured ? " featured" : "") + (l.placeholder ? " no-photo" : "")}
      onClick={() => openModal(l)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openModal(l);
        }
      }}
      style={{ cursor: "pointer" }}
    >
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

function Pricing({ onPost }: { onPost: () => void }) {
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
              {/* All tiers post as tier:'basic' for now — paid Featured / Pro
                  upgrades (photos, top placement, analytics) are a later phase. */}
              <button type="button" className="cta" onClick={onPost}>{t.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    const { error, already } = await subscribeEmail(email, "directory");
    if (error) {
      setStatus("error");
      setMsg(error);
    } else {
      setStatus("done");
      setMsg(
        already
          ? "You're already on the list — we'll keep you posted."
          : "You're in — we'll email you when local listings & deals go live.",
      );
    }
  };
  return (
    <section className="band tight news-band">
      <div className="band-inner">
        <div className="news-grid">
          <div>
            <div className="section-eyebrow">directory dispatch</div>
            <h2 className="section-h2">
              New listings &amp; deals <span className="it">in your inbox</span>
            </h2>
            <p style={{ color: "#B0B0B0", fontSize: 15, lineHeight: 1.55, maxWidth: "52ch", marginBottom: 20 }}>
              Be first to know when local classifieds, driver schedules, and member-only coupons go
              live near you.
            </p>
          </div>
          {status === "done" ? (
            <p style={{ color: "#8CC084", fontSize: 15, fontWeight: 600, alignSelf: "center" }}>{msg}</p>
          ) : (
            <form className="news-form" onSubmit={submit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourcity.com"
                required
              />
              <button type="submit" disabled={status === "loading"}>
                {status === "loading" ? "…" : "Subscribe →"}
              </button>
            </form>
          )}
          {status === "error" && (
            <p style={{ color: "#E5877A", fontSize: 13, marginTop: 8 }}>{msg}</p>
          )}
        </div>
      </div>
    </section>
  );
}

const CLASSIFIEDS_CHIP_TO_SLUG: Record<string, string> = {
  VEH: "vehicles", ELEC: "electronics", FURN: "furniture", SERV: "services",
  JOBS: "jobs", HOUSE: "housing", TIX: "tickets", FREE: "free",
};

function cityMatches(itemCity: string | null | undefined, visitorCity: string | null) {
  return !!itemCity && !!visitorCity && itemCity.toLowerCase() === visitorCity.toLowerCase();
}

function LocationBar({
  city, onChangeCity,
}: { city: string | null; onChangeCity: (c: string) => void }) {
  // Auto-detected city prefills; type ANY city or town to look there (works
  // everywhere — listings are city-tagged, so they show for that city as they post).
  const [q, setQ] = useState(city ?? "");
  useEffect(() => {
    setQ(city ?? "");
  }, [city]);
  const commit = () => {
    const v = q.trim();
    if (v && v.toLowerCase() !== (city ?? "").toLowerCase()) onChangeCity(v);
  };
  return (
    <div className="band tight" style={{ paddingBottom: 0 }}>
      <div className="band-inner" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: "#999", fontSize: 13 }}>
          {city ? <>Showing local partners &amp; listings near <b style={{ color: "#C99742" }}>{city}</b></> : "Search a city to see local partners & listings"}
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(); } }}
          onBlur={commit}
          placeholder="Search a city or town…"
          aria-label="Search a city"
          style={{ background: "#141414", color: "#fff", border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "6px 16px", fontSize: 12, minWidth: 190 }}
        />
      </div>
    </div>
  );
}

function EmptyState({ city, onPost }: { city: string | null; onPost: () => void }) {
  return (
    <div className="cbl-dir-empty" style={{ textAlign: "center", padding: "48px 24px", color: "#999" }}>
      <p style={{ marginBottom: 16 }}>
        {city ? `No listings near ${city} yet — be the first.` : "No listings yet — be the first."}
      </p>
      <button type="button" className="post-btn" onClick={onPost}>Post the First Listing →</button>
    </div>
  );
}

/* ── Post a Listing modal ────────────────────────────────────────────────────
 * Members post a classified into CBL-Rides `directory_listings` via their OWN
 * authenticated Supabase session (RLS: auth.uid() = user_id). The REAL session
 * is read from authClient.auth.getSession() — which is NULL in the site's
 * always-on preview DEMO mode (useAuth() there returns a fake demo session with
 * no real auth.uid()). So: real session → show the post form; no real session
 * (demo or signed out) → show a "sign in to post" gate that opens JoinModal.
 */
const CATEGORY_OPTIONS: { v: string; l: string }[] = [
  { v: "general", l: "General" },
  { v: "vehicles", l: "Vehicles" },
  { v: "electronics", l: "Electronics" },
  { v: "furniture", l: "Furniture" },
  { v: "services", l: "Services" },
  { v: "jobs", l: "Jobs" },
  { v: "housing", l: "Housing" },
  { v: "tickets", l: "Tickets" },
  { v: "free", l: "Free" },
];

const POST_CSS = `
.cbl-post { position:fixed; inset:0; z-index:990; display:grid; place-items:center; padding:16px; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-post *,.cbl-post *::before,.cbl-post *::after { box-sizing:border-box; margin:0; padding:0; }
.cbl-post .backdrop { position:absolute; inset:0; background:rgba(0,0,0,.72); backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px); }
.cbl-post .panel {
  position:relative; width:min(480px,100%); max-height:calc(100dvh - 32px); overflow-y:auto;
  background:#141414; border:1px solid rgba(201,151,66,.45); border-radius:18px 0 18px 0;
  box-shadow:0 18px 44px rgba(0,0,0,.55); padding:28px;
  animation:cbl-post-pop .26s cubic-bezier(.2,.9,.3,1.25) both;
}
@keyframes cbl-post-pop { 0%{opacity:0;transform:translateY(8px) scale(.96);} 100%{opacity:1;transform:translateY(0) scale(1);} }
@media (prefers-reduced-motion: reduce) { .cbl-post .panel { animation:none; } }
.cbl-post .close { position:absolute; top:12px; right:12px; background:transparent; border:0; color:#888; cursor:pointer; font-size:15px; line-height:1; padding:6px 8px; }
.cbl-post .close:hover { color:#fff; }
.cbl-post .eyebrow { font-family:${MONO}; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:#C99742; margin-bottom:8px; }
.cbl-post h2 { font-family:${DISPLAY}; font-weight:900; font-size:30px; line-height:.96; letter-spacing:-.01em; text-transform:uppercase; color:#fff; margin:0 0 8px; }
.cbl-post h2 .it { font-family:${ITALIC}; font-style:italic; font-weight:600; color:#C99742; text-transform:none; }
.cbl-post .sub { font-size:14px; line-height:1.5; color:#B8B8B8; margin:0 0 20px; }
.cbl-post label { display:block; font-family:${MONO}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#8f8f8f; margin:0 0 7px 2px; }
.cbl-post label .req { color:#C99742; }
.cbl-post .field { margin-bottom:14px; }
.cbl-post .field input, .cbl-post .field select, .cbl-post .field textarea {
  width:100%; background:#0A0A0A; color:#fff; font-size:15px; font-family:inherit;
  border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:12px 14px;
  transition:border-color .2s, box-shadow .2s, background .2s;
}
.cbl-post .field textarea { resize:vertical; min-height:84px; line-height:1.45; }
.cbl-post .field input::placeholder, .cbl-post .field textarea::placeholder { color:#6a6a6a; }
.cbl-post .field input:focus, .cbl-post .field select:focus, .cbl-post .field textarea:focus { outline:none; border-color:#C99742; background:rgba(201,151,66,.05); box-shadow:0 0 0 4px rgba(201,151,66,.16); }
.cbl-post .free-row { display:flex; align-items:center; gap:10px; margin:2px 2px 16px; }
.cbl-post .free-row input { accent-color:#C99742; width:17px; height:17px; flex-shrink:0; cursor:pointer; }
.cbl-post .free-row label { font-family:inherit; font-size:13px; line-height:1.4; color:#cfcfcf; text-transform:none; letter-spacing:0; margin:0; cursor:pointer; }
.cbl-post .submit { width:100%; border:0; cursor:pointer; border-radius:999px; padding:14px 36px; background:#C99742; color:#000; font-family:${DISPLAY}; font-weight:900; font-size:14px; letter-spacing:.14em; text-transform:uppercase; transition:background .2s; }
.cbl-post .submit:hover { background:#DDB15F; }
.cbl-post .submit:disabled { background:#555; cursor:not-allowed; }
.cbl-post .alert { border-radius:12px; padding:11px 14px; font-size:13.5px; line-height:1.45; margin-bottom:14px; background:rgba(220,60,60,.12); border:1px solid rgba(220,60,60,.4); color:#f0b3b3; }
.cbl-post .tier-note { font-family:${MONO}; font-size:11px; line-height:1.5; letter-spacing:.04em; color:#7a7a7a; margin:14px 2px 0; text-align:center; }
.cbl-post .success, .cbl-post .gate { text-align:center; padding:6px 0 2px; }
.cbl-post .success .mark, .cbl-post .gate .mark { width:52px; height:52px; margin:0 auto 14px; border-radius:50%; border:2px solid #C99742; display:grid; place-items:center; color:#C99742; font-size:24px; }
.cbl-post .success h3 { font-family:${DISPLAY}; font-weight:900; font-size:28px; text-transform:uppercase; color:#fff; margin:0 0 8px; }
.cbl-post .success h3 .g { color:#C99742; }
.cbl-post .success p { font-size:14px; line-height:1.55; color:#B8B8B8; margin:0 0 18px; }
.cbl-post .gate-btn { display:inline-block; border:0; cursor:pointer; border-radius:999px; padding:14px 32px; background:#C99742; color:#000; font-family:${DISPLAY}; font-weight:900; font-size:13.5px; letter-spacing:.14em; text-transform:uppercase; transition:background .2s; }
.cbl-post .gate-btn:hover { background:#DDB15F; }
@media (max-width:480px) { .cbl-post .panel { padding:24px 20px; } .cbl-post h2 { font-size:26px; } }
`;

function PostListingModal({
  open, onClose, defaultCity, onPosted,
}: {
  open: boolean;
  onClose: () => void;
  defaultCity?: string | null;
  onPosted: () => void;
}) {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [free, setFree] = useState(false);
  const [price, setPrice] = useState("");
  const [cityField, setCityField] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Hold onClose in a ref so the open-effect (session check + form reset) never
  // re-runs when the parent re-renders and recreates the callback.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    // Fresh form each open.
    setTitle("");
    setCategory("general");
    setFree(false);
    setPrice("");
    setDescription("");
    setStatus("idle");
    setErrorMsg("");
    setCityField(defaultCity ?? "");
    setJoinOpen(false);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // The REAL session (null in demo mode) decides form vs. sign-in gate.
    let cancelled = false;
    setChecking(true);
    authClient.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      setHasSession(!!data.session?.user);
      setChecking(false);
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, defaultCity]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "pending") return;
    if (!title.trim()) {
      setStatus("error");
      setErrorMsg("Please add a title.");
      return;
    }
    setStatus("pending");
    setErrorMsg("");
    const { error } = await postDirectoryListing({
      title: title.trim(),
      category,
      description: description.trim() || undefined,
      priceType: free ? "free" : "fixed",
      price: free ? null : price.trim() ? Number(price) : null,
      city: cityField.trim() || undefined,
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error);
    } else {
      setStatus("success");
      onPosted(); // re-run the page's getDirectoryListings().then(setListings)
    }
  };

  return (
    <>
      <div className="cbl-post" role="dialog" aria-modal="true" aria-labelledby="cbl-post-title">
        <style>{POST_CSS}</style>
        <div className="backdrop" onClick={onClose} />
        <div className="panel">
          <button className="close" aria-label="Close" onClick={onClose}>✕</button>

          {checking ? (
            <p className="sub" style={{ margin: "8px 0" }}>Checking your sign-in…</p>
          ) : !hasSession ? (
            <div className="gate">
              <div className="mark" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </div>
              <div className="eyebrow">post a listing</div>
              <h2 id="cbl-post-title">Sign in <span className="it">to post.</span></h2>
              <p className="sub">
                Posting is free — you just need to sign in first. It's the same City
                Bucket List account you use across the site and app.
              </p>
              <button type="button" className="gate-btn" onClick={() => setJoinOpen(true)}>
                Sign in / Join Free →
              </button>
            </div>
          ) : status === "success" ? (
            <div className="success">
              <div className="mark" aria-hidden="true">✓</div>
              <h3>Your listing is <span className="g">live.</span></h3>
              <p>It's posted to your local directory. Thanks for adding to your city.</p>
              <button type="button" className="submit" onClick={onClose}>Done</button>
            </div>
          ) : (
            <>
              <div className="eyebrow">post a listing · free</div>
              <h2 id="cbl-post-title">Post it. <span className="it">Sell it.</span></h2>
              <p className="sub">List it to your local classifieds in a few seconds.</p>

              {status === "error" && <div className="alert" role="alert">{errorMsg}</div>}

              <form onSubmit={handleSubmit}>
                <div className="field">
                  <label htmlFor="cbl-post-title-in">Title <span className="req">*</span></label>
                  <input
                    id="cbl-post-title-in"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What are you posting?"
                    maxLength={140}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="cbl-post-cat">Category</label>
                  <select id="cbl-post-cat" value={category} onChange={(e) => setCategory(e.target.value)}>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.v} value={c.v}>{c.l}</option>
                    ))}
                  </select>
                </div>
                <div className="free-row">
                  <input
                    id="cbl-post-free"
                    type="checkbox"
                    checked={free}
                    onChange={(e) => setFree(e.target.checked)}
                  />
                  <label htmlFor="cbl-post-free">This is free — no price</label>
                </div>
                {!free && (
                  <div className="field">
                    <label htmlFor="cbl-post-price">Price (USD)</label>
                    <input
                      id="cbl-post-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                )}
                <div className="field">
                  <label htmlFor="cbl-post-city">City</label>
                  <input
                    id="cbl-post-city"
                    type="text"
                    value={cityField}
                    onChange={(e) => setCityField(e.target.value)}
                    placeholder="Your city"
                    maxLength={80}
                  />
                </div>
                <div className="field">
                  <label htmlFor="cbl-post-desc">Description</label>
                  <textarea
                    id="cbl-post-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add the details buyers want to know…"
                    maxLength={2000}
                  />
                </div>
                <button type="submit" className="submit" disabled={status === "pending"}>
                  {status === "pending" ? "Posting…" : "Post Listing — Free"}
                </button>
                {/* Every site-posted listing publishes as tier:'basic' for now —
                    paid Featured / Business Pro upgrades are a later phase. */}
                <p className="tier-note">
                  Publishes as a free basic listing. Featured &amp; Pro upgrades coming soon.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
      {/* Rendered OUTSIDE .cbl-post (which animates a transform) so JoinModal's
          own position:fixed overlay isn't trapped by a transformed ancestor. */}
      <JoinModal open={joinOpen} onClose={() => setJoinOpen(false)} source="directory-post" />
    </>
  );
}

export function Directory() {
  const [searchParams] = useSearchParams();
  const paramSection = searchParams.get("section");
  const [section, setSection] = useState(
    paramSection && SECTIONS.some((s) => s.key === paramSection) ? paramSection : "CLASSIFIEDS",
  );
  // Follow the ?section= deep-link (from the header Directory dropdown).
  useEffect(() => {
    const p = searchParams.get("section");
    if (p && SECTIONS.some((s) => s.key === p)) setSection(p);
  }, [searchParams]);

  // Per-page SEO title + meta description (Google renders JS; prerender covers bots).
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Local Directory — Classifieds, Shopping & Deals | City Bucket List";
    const desc =
      "Browse local classifieds, driver posts, rider requests, shopping, and member coupons near you — free to browse, sign in to post. City Bucket List's community directory.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    const created = !meta;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    const prevDesc = meta.getAttribute("content");
    meta.setAttribute("content", desc);
    return () => {
      document.title = prevTitle;
      if (created) meta?.remove();
      else if (prevDesc !== null) meta?.setAttribute("content", prevDesc);
    };
  }, []);
  const [cat, setCat] = useState("ALL");
  const { city, setManualCity } = useVisitorLocation();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [businesses, setBusinesses] = useState<DirectoryBusiness[]>([]);
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [postOpen, setPostOpen] = useState(false);
  const openPost = () => setPostOpen(true);
  const [modalL, setModalL] = useState<Listing | null>(null);
  // Re-pull member classifieds after a successful post so the new one appears.
  const refetchListings = () => getDirectoryListings().then(setListings);

  useEffect(() => {
    getActivePartners().then(setPartners);
    getActiveBusinesses().then(setBusinesses);
    getDirectoryListings().then(setListings);
  }, []);


  const sortByCityMatch = <T extends { city?: string | null }>(items: T[]) =>
    [...items].sort((a, b) => Number(cityMatches(b.city, city)) - Number(cityMatches(a.city, city)));

  const classifiedsLive = useMemo(() => {
    const slug = CLASSIFIEDS_CHIP_TO_SLUG[cat];
    const filtered = slug ? listings.filter((l) => l.category === slug) : listings;
    return sortByCityMatch(filtered).map(listingToCard);
  }, [listings, cat, city]);

  const shopLive = useMemo(() => {
    const pinnedPartners = sortByCityMatch(partners).map(partnerToCard);
    const sortedBusinesses = sortByCityMatch(businesses).map(businessToCard);
    return [...pinnedPartners, ...sortedBusinesses];
  }, [partners, businesses, city]);

  return (
    <DirModalCtx.Provider value={setModalL}>
    <main className="cbl-dir">
      <style>{DIR_CSS}</style>

      <Hero onPost={openPost} />
      <LocationBar city={city} onChangeCity={setManualCity} />
      <Filters section={section} setSection={setSection} cat={cat} setCat={setCat} />

      {section === "CLASSIFIEDS" && (
        <>
          <section className="band">
            <div className="band-inner">
              <SectionHead section="CLASSIFIEDS" onPost={openPost} />
              {classifiedsLive.length === 0 ? (
                <EmptyState city={city} onPost={openPost} />
              ) : (
                <div className="listings-grid">
                  {classifiedsLive.map((l) => <ClassifiedCard key={l.id} l={l} />)}
                </div>
              )}
              <PickupBanner />
            </div>
          </section>
          <CompareBand onPost={openPost} />
          <Pricing onPost={openPost} />
        </>
      )}

      {section === "DRIVERS" && (
        <section className="band">
          <div className="band-inner">
            <SectionHead section="DRIVERS" onPost={openPost} />
            <ComingSoonSection
              title="Driver Posts — Coming Soon"
              blurb="Independent drivers will be able to post weekly schedules and self-promote with a personal CBL QR code. This is launching on the directory app soon."
            />
          </div>
        </section>
      )}

      {section === "RIDERS" && (
        <section className="band">
          <div className="band-inner">
            <SectionHead section="RIDERS" onPost={openPost} />
            <ComingSoonSection
              title="Rider Requests — Coming Soon"
              blurb="Posting a ride request (events, recurring schedules, airport runs) for independent drivers to respond to is launching on the directory app soon."
            />
          </div>
        </section>
      )}

      {section === "SHOP" && (
        <section className="band">
          <div className="band-inner">
            <SectionHead section="SHOPPING" onPost={openPost} />
            {shopLive.length === 0 ? (
              <EmptyState city={city} onPost={openPost} />
            ) : (
              <div className="listings-grid">
                {shopLive.map((l) => <ClassifiedCard key={l.id} l={l} />)}
              </div>
            )}
          </div>
        </section>
      )}

      {section === "COUPONS" && (
        <section className="band">
          <div className="band-inner">
            <SectionHead section="COUPONS" onPost={openPost} />
            <ComingSoonSection
              title="Member Coupons — Coming Soon"
              blurb="Member-only offers from local partners are on the way. Check back soon."
            />
            <CompareBand onPost={openPost} />
          </div>
        </section>
      )}

      <Newsletter />

      <PostListingModal
        open={postOpen}
        onClose={() => setPostOpen(false)}
        defaultCity={city}
        onPosted={refetchListings}
      />
      <DirListingModal l={modalL} onClose={() => setModalL(null)} />
    </main>
    </DirModalCtx.Provider>
  );
}
