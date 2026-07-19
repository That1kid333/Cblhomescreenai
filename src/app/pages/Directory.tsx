import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import QRCode from "qrcode";
import wordmark from "../../assets/4e362ee0a6833a98e4906d2c5dffb87be8775f8e.png";
import { APP_URL, RIDER_BOOK_URL } from "../lib/constants";
import { getActivePartners, getDirectoryListings, type Partner } from "../lib/supabase/ridesClient";
import { type DirectoryListing } from "../lib/supabase/directoryClient";
import { authClient, postDirectoryListing, getMyDriverProfile, type MyDriverProfile } from "../lib/supabase/authClient";
import { updateDriverAd } from "../lib/studio";
import { startListingBoost, applyListingBoost, type BoostTier } from "../lib/boost";
import {
  getOwnListing, uploadListingPhoto, uploadDriverAdPhoto, saveListingPhotos, maxPhotosForTier, type OwnListing,
} from "../lib/listingPhotos";
import { useVisitorLocation, seedCoords, forwardGeocode, milesBetween, type Coords } from "../lib/location";
import { ComingSoonSection } from "../components/ComingSoon";
import { JoinModal } from "../components/JoinModal";
import { PlatformNotice, CollapsibleLegal } from "../components/PlatformNotice";
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

// Pretty-print a stored 10-digit phone ("4129772408" → "(412) 977-2408").
// Leaves anything that isn't a clean 10/11-digit US number untouched.
function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const d = raw.replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return ten.length === 10 ? `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}` : raw;
}

type SecDef = { key: string; label: string; Icon: (p: { s?: number }) => JSX.Element };
type Chip = { k: string; l: string; d: string };
type Listing = {
  id: string | number; name: string; loc: string; desc: string; price: string;
  photos?: number; badges?: { t: string; k?: string }[];
  img?: string; featured?: boolean; placeholder?: boolean;
  ownerId?: string | null; tier?: string | null; // for the owner's "edit photos" affordance
  driverCode?: string | null; // active-driver posts → "Verified CBL Driver" QR
  driverAd?: DriverAd | null; // driver business-card fields (driver_post only)
  foot?: string; // overrides the card's default footer text (e.g. live Google results)
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
.cbl-dir .hero-inner { max-width:1280px; margin:0 auto; position:relative; z-index:2; }
.cbl-dir .hero-streams { position:absolute; inset:0; z-index:1; pointer-events:none; }
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
  position:relative;
}
/* Desktop/tablet: float the icon so it doesn't inflate the title row — the
   eyebrow/title/subtitle/lede line up with the Affiliates & About heroes. */
@media (min-width:721px){
  .cbl-dir h1.hero-title .dir-icon {
    position:absolute; right:0; top:50%; transform:translateY(-50%);
  }
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
.cbl-dir .manage-link { display:flex; margin-top:7px; }

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

/* Horizontal scrollers show an edge fade + a tappable chevron so it's clear
   there's more to swipe — only when actually scrollable in that direction. */
.cbl-dir .scroller { position:relative; }
.cbl-dir .scroller::before, .cbl-dir .scroller::after { content:""; position:absolute; top:0; bottom:8px; width:38px; pointer-events:none; z-index:2; opacity:0; transition:opacity .2s; }
.cbl-dir .scroller::before { left:0; background:linear-gradient(90deg,#0A0A0A 18%, transparent); }
.cbl-dir .scroller::after { right:0; background:linear-gradient(270deg,#0A0A0A 18%, transparent); }
.cbl-dir .scroller.sl::before { opacity:1; }
.cbl-dir .scroller.sr::after { opacity:1; }
.cbl-dir .sc-arrow { position:absolute; top:calc(50% - 4px); transform:translateY(-50%); z-index:3; width:26px; height:26px; border-radius:50%; border:1px solid rgba(201,151,66,.55); background:rgba(10,10,10,.94); color:#C99742; display:none; align-items:center; justify-content:center; cursor:pointer; font-size:17px; line-height:1; padding:0; }
.cbl-dir .sc-arrow:hover { background:#C99742; color:#000; }
.cbl-dir .scroller.sl .sc-arrow.left { display:flex; left:-6px; }
.cbl-dir .scroller.sr .sc-arrow.right { display:flex; right:-6px; }
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
.cbl-dir .section-h2 { font-family:${DISPLAY}; font-weight:900; font-size:clamp(40px,4.6vw,64px); line-height:.95; letter-spacing:-.01em; text-transform:uppercase; margin-bottom:8px; text-wrap:balance; }
.cbl-dir .section-h2 .it { font-family:${ITALIC}; font-style:italic; color:#C99742; font-weight:600; text-transform:none; font-size:.6em; margin-left:8px; }
.cbl-dir .section-head { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; gap:24px; flex-wrap:wrap; }
.cbl-dir .section-head .count { font-family:${MONO}; font-size:11px; letter-spacing:.14em; color:#8a8a8a; text-transform:uppercase; }
.cbl-dir .post-btn { background:#C99742; color:#000; border:0; padding:12px 22px; border-radius:999px; font-family:${DISPLAY}; font-weight:900; font-size:13px; letter-spacing:.12em; text-transform:uppercase; white-space:nowrap; }
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

/* Driver grid PREVIEW card — a compact echo of the full "Need a Ride?" card so
   the grid teaser matches the detail modal riders open. */
.cbl-dir .listing.dpc { overflow:hidden; }
.cbl-dir .dpc-hero { position:relative; padding:20px 16px 16px; text-align:center; background:linear-gradient(180deg, rgba(10,10,10,.35), rgba(10,10,10,.82)), url(${MAP_BG}); background-size:cover; background-position:center; }
.cbl-dir .dpc-av { width:66px; height:66px; margin:0 auto 10px; border-radius:50%; overflow:hidden; border:2.5px solid #C99742; background:#1A1A1A; display:grid; place-items:center; color:#C99742; font-weight:800; font-size:22px; box-shadow:0 4px 14px rgba(0,0,0,.5); }
.cbl-dir .dpc-av img { width:100%; height:100%; object-fit:cover; }
.cbl-dir .dpc-eb { font-family:${MONO}; font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:#C99742; margin-bottom:5px; }
.cbl-dir .dpc-h { font-family:${DISPLAY}; font-weight:900; font-size:26px; line-height:.95; text-transform:uppercase; color:#fff; }
.cbl-dir .dpc-ride { font-size:13px; color:#CFCFCF; margin-top:4px; }
.cbl-dir .dpc-ride b { font-family:${ITALIC}; font-style:italic; font-weight:600; color:#C99742; }
.cbl-dir .dpc-body { padding:13px 16px 15px; display:flex; flex-direction:column; gap:7px; flex:1; }
.cbl-dir .dpc-avail { font-family:${MONO}; font-size:10.5px; letter-spacing:.04em; color:#DDB15F; }
.cbl-dir .dpc-carrow { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.cbl-dir .dpc-car { font-size:12.5px; color:#C0C0C0; font-weight:600; }
.cbl-dir .dpc-plate { font-family:${MONO}; font-size:11px; font-weight:700; color:#111; background:#fff; border-radius:4px; padding:2px 7px; white-space:nowrap; }
.cbl-dir .dpc-plate .st { font-size:8px; color:#888; margin-right:3px; vertical-align:middle; }
.cbl-dir .dpc-cta { display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:10px; border-top:1px solid rgba(255,255,255,.06); font-family:${MONO}; font-size:10px; letter-spacing:.08em; text-transform:uppercase; color:#C99742; }

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
.cbl-dir .news-form button { background:#C99742; color:#000; border:0; padding:14px 28px; border-radius:999px; font-family:${DISPLAY}; font-weight:900; font-size:14px; letter-spacing:.14em; text-transform:uppercase; white-space:nowrap; }
.cbl-dir .news-form button:hover { background:#DDB15F; }

/* Responsive */
@media (max-width:1100px) {
  .cbl-dir .hero { padding:22px 24px 16px; }
  .cbl-dir section.band { padding:36px 24px 48px; }
  /* Align the location bar + filter rows to the SAME 24px left margin as the
     hero so the left edge is consistent (was 0px and 48px respectively). */
  .cbl-dir .band.tight, .cbl-dir .filters { padding-left:24px; padding-right:24px; }
  .cbl-dir h1.hero-title .dir-icon { width:160px; height:130px; }
  .cbl-dir .listings-grid { grid-template-columns:repeat(2,1fr); }
  .cbl-dir .coupons-grid { grid-template-columns:1fr 1fr; }
  .cbl-dir .tiers { grid-template-columns:1fr 1fr; }
  .cbl-dir .pickup-banner { grid-template-columns:1fr; text-align:left; }
  .cbl-dir .news-grid { grid-template-columns:1fr; gap:24px; }
  .cbl-dir .compare-grid { grid-template-columns:1fr; }
}
@media (max-width:720px) {
  /* Mobile legibility: hero is the biggest thing on the page — drop the
     decorative icon so "CBL DIRECTORY" gets the full width at a size that
     reads bigger than the section headers below it. */
  .cbl-dir h1.hero-title { display:flex; flex-wrap:nowrap; position:relative; gap:0; align-items:flex-start; font-size:clamp(36px,9.6vw,50px); }
  .cbl-dir h1.hero-title .title-stack { min-width:0; flex:1; }
  .cbl-dir h1.hero-title .title-stack > span:first-child { display:block; padding-right:0; }
  .cbl-dir h1.hero-title .dir-icon { display:none; }
  .cbl-dir .hero-subtitle { flex-wrap:nowrap; white-space:nowrap; font-size:clamp(20px,5.4vw,27px); }
  .cbl-dir .eyebrow { display:block; white-space:nowrap; max-width:100%; font-size:11px; letter-spacing:.06em; }
  .cbl-dir .eb-sm { display:none; }
  .cbl-dir .eyebrow::before { display:inline-block; vertical-align:middle; margin-right:10px; }
  .cbl-dir .hero p.lede { font-size:16px; }
  /* Keep the whole line (incl. the · separator) together; no orphan words. */
  .cbl-dir .signup-hint { font-size:12px; letter-spacing:.08em; white-space:nowrap; }
  /* Newsletter: stack input above a full-width button so nothing bleeds off. */
  .cbl-dir .news-form { flex-direction:column; max-width:none; }
  .cbl-dir .news-form input, .cbl-dir .news-form button { width:100%; }
  /* Tighten the section eyebrows so they don't orphan a word onto line 2. */
  .cbl-dir .section-eyebrow { letter-spacing:.06em; }
  /* Section headings: size the main word to fit one line and drop the italic
     tagline ("powered by CBL", "see the difference"…) cleanly to its own line
     instead of orphaning a single word mid-phrase. Kept below the hero size. */
  .cbl-dir .section-h2 { font-size:clamp(28px,7.4vw,40px); }
  .cbl-dir .section-h2 .it { display:block; margin-left:0; margin-top:3px; white-space:nowrap; font-size:.62em; }
  /* Section switcher is a swipe strip on mobile — shrink tabs so more read at once */
  .cbl-dir .sec-btn { font-size:13px; padding:6px 13px 9px; letter-spacing:.07em; gap:4px; }
  .cbl-dir .sec-btn .ic { width:28px; height:28px; }
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
  SHOP: [], // filled in below from SHOP_CATEGORIES so the chip list and the
  // Google Places / partner-matching keywords can never drift apart.
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
    ownerId: l.user_id ?? null,
    tier: l.tier ?? null,
    driverCode: l.driver_referral_code ?? null,
    driverAd: (l.driver_ad as DriverAd | null) ?? null,
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

// Fixed Shopping-section taxonomy. Each category carries everything needed to
// keep search "correct" end to end: `keyword`/`type` drive the live Google
// Places lookup (same /api/places proxy Eats & Attractions use — see
// netlify/functions/places.js), and `aliases` match a partner's free-text
// business_type/directory_category into the same bucket, so "Pizza" shows
// pizza places whether they're a real CBL partner or a live nearby result.
type PlacesDef = { k: string; l: string; keyword: string; type: string; aliases: string[] };

// Top-level Shopping-section taxonomy — mutually exclusive venue *types*
// (Google Places `type` values), so no two top-level categories compete for
// the same businesses. Cuisine (Pizza, Italian, ...) is a REFINEMENT within
// Restaurants, not a sibling of it — see RESTAURANT_CUISINES below — so
// "Pizza" and "Restaurants" can never show conflicting/overlapping results.
const SHOP_CATEGORIES: (PlacesDef & { d: string })[] = [
  { k: "ALL", l: "All", d: "M4 6h16M4 12h16M4 18h16", keyword: "top rated local business", type: "point_of_interest", aliases: [] },
  { k: "RESTAURANTS", l: "Restaurants", d: "M4 8h16v3a8 8 0 0 1-16 0V8z M3 21h18", keyword: "restaurants", type: "restaurant", aliases: ["restaurant", "dine", "eatery", "diner", "pizza", "pizzeria", "coffee", "cafe", "café", "espresso", "roaster"] },
  { k: "BARS", l: "Bars & Nightlife", d: "M3 4h18l-9 9v7h4v2H8v-2h4v-7z", keyword: "bar nightlife", type: "bar", aliases: ["bar", "pub", "brewery", "nightclub", "lounge", "tavern"] },
  { k: "AUTO", l: "Auto Services", d: "M3 13l2-5h14l2 5v5h-2a2 2 0 0 1-4 0H9a2 2 0 0 1-4 0H3v-5z", keyword: "auto repair", type: "car_repair", aliases: ["auto", "mechanic", "tire", "car repair", "body shop", "car wash"] },
  { k: "HOME", l: "Home Services", d: "M3 12l9-8 9 8v8H3z", keyword: "home services contractor", type: "general_contractor", aliases: ["contractor", "plumb", "electric", "hvac", "landscap", "roofing", "cleaning", "handyman"] },
  { k: "BEAUTY", l: "Health & Beauty", d: "M9 8a3 3 0 1 1 6 0 3 3 0 0 1-6 0z M3 21c0-4 4-6 9-6s9 2 9 6", keyword: "salon spa", type: "beauty_salon", aliases: ["salon", "spa", "barber", "beauty", "nail", "skincare"] },
  { k: "FITNESS", l: "Fitness", d: "M4 9h2v6H4z M18 9h2v6h-2z M8 11h8v2H8z", keyword: "gym fitness", type: "gym", aliases: ["gym", "fitness", "yoga", "pilates", "crossfit", "martial arts"] },
  { k: "RETAIL", l: "Retail & Shops", d: "M3 7h18l-1 14H4z M8 7V5a4 4 0 0 1 8 0v2", keyword: "shop store", type: "store", aliases: ["shop", "store", "boutique", "retail", "market"] },
  { k: "PROFESSIONAL", l: "Professional Services", d: "M14 7l3 3-9 9H5v-3l9-9z M16 5l3 3", keyword: "professional services", type: "lawyer", aliases: ["law", "attorney", "account", "insurance", "real estate", "financial", "notary"] },
  { k: "PETS", l: "Pet Services", d: "M12 13c-3 0-5 2-5 4v1h10v-1c0-2-2-4-5-4z M7 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4z M17 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4z", keyword: "pet store vet groomer", type: "veterinary_care", aliases: ["pet", "vet", "groom", "kennel"] },
  { k: "ENTERTAINMENT", l: "Entertainment", d: "M3 8h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V8z", keyword: "entertainment", type: "movie_theater", aliases: ["theater", "theatre", "cinema", "entertainment", "arcade", "bowling", "venue"] },
];
CHIPS.SHOP = SHOP_CATEGORIES.map((c) => ({ k: c.k, l: c.l, d: c.d }));

// Cuisine sub-filter — only shown/applied when "Restaurants" is the selected
// top-level category. Keyword values match the ones EatsAndDrinks.tsx already
// uses for the same cuisines, so "Pizza" means the same thing app-wide.
const RESTAURANT_CUISINES: PlacesDef[] = [
  { k: "ALL", l: "All Cuisines", keyword: "restaurants", type: "restaurant", aliases: [] },
  { k: "PIZZA", l: "Pizza", keyword: "pizza", type: "restaurant", aliases: ["pizza", "pizzeria"] },
  // Cafes are their own Google Places `type` (not "restaurant"), so this
  // entry keeps that type for accurate results even though it's grouped
  // under Restaurants in the UI, per how people actually look for coffee.
  { k: "COFFEE", l: "Coffee & Cafes", keyword: "coffee cafe", type: "cafe", aliases: ["coffee", "cafe", "café", "espresso", "roaster"] },
  { k: "ITALIAN", l: "Italian", keyword: "italian", type: "restaurant", aliases: ["italian"] },
  { k: "MEXICAN", l: "Mexican", keyword: "mexican", type: "restaurant", aliases: ["mexican", "taqueria", "taco"] },
  { k: "CHINESE", l: "Chinese", keyword: "chinese", type: "restaurant", aliases: ["chinese"] },
  { k: "AMERICAN", l: "American", keyword: "american restaurant", type: "restaurant", aliases: ["american", "grill", "diner"] },
  { k: "SUSHI", l: "Sushi & Japanese", keyword: "sushi japanese", type: "restaurant", aliases: ["sushi", "japanese", "hibachi"] },
  { k: "THAI", l: "Thai", keyword: "thai", type: "restaurant", aliases: ["thai"] },
  { k: "INDIAN", l: "Indian", keyword: "indian", type: "restaurant", aliases: ["indian"] },
  { k: "SEAFOOD", l: "Seafood", keyword: "seafood", type: "restaurant", aliases: ["seafood"] },
  { k: "BURGERS", l: "Burgers", keyword: "burgers", type: "restaurant", aliases: ["burger"] },
  { k: "BREAKFAST", l: "Breakfast & Brunch", keyword: "breakfast brunch", type: "restaurant", aliases: ["breakfast", "brunch", "pancake"] },
];

function matchesShopCategory(p: Partner, catKey: string): boolean {
  if (catKey === "ALL") return true;
  const def = SHOP_CATEGORIES.find((c) => c.k === catKey);
  if (!def) return true;
  const text = `${p.business_type ?? ""} ${p.directory_category ?? ""}`.toLowerCase();
  return def.aliases.some((a) => text.includes(a));
}

function matchesCuisine(p: Partner, cuisineKey: string): boolean {
  if (cuisineKey === "ALL") return true;
  const def = RESTAURANT_CUISINES.find((c) => c.k === cuisineKey);
  if (!def) return true;
  const text = `${p.business_type ?? ""} ${p.directory_category ?? ""}`.toLowerCase();
  return def.aliases.some((a) => text.includes(a));
}

// Raw shape returned by /api/places (netlify/functions/places.js) — already
// sorted best-rated-first and capped at 6 server-side.
type RawPlace = {
  id: string; name: string; rating: number | null; reviews: number; price: string;
  open: boolean | null; address: string; coord: [number, number] | null; photo: string | null;
};

function placeToCard(p: RawPlace, categoryLabel: string): Listing {
  return {
    id: `g-${p.id}`,
    name: p.name,
    loc: [p.address, categoryLabel].filter(Boolean).join(" · "),
    desc: p.reviews
      ? `${p.reviews.toLocaleString()} local reviews${p.open === false ? " · closed now" : p.open === true ? " · open now" : ""}.`
      : "Popular nearby business.",
    price: p.rating ? `★ ${p.rating.toFixed(1)} (${p.reviews ?? 0})` : "New listing",
    img: p.photo || undefined,
    badges: [{ t: "⭐ Top Rated Nearby" }],
    featured: false,
    placeholder: !p.photo,
    foot: "Top-rated nearby",
  };
}

const shopLiveCache = new Map<string, RawPlace[]>();

// Backfills the Shopping section with real, live-rated nearby businesses
// (via Google Places) for the selected category/cuisine whenever CBL doesn't
// yet have enough of its own partners there — same proxy/pattern
// EatsAndDrinks.tsx uses for restaurants. Safe no-op (returns []) if the API
// key isn't configured on the server; callers should treat null as "still
// loading". Takes the resolved def directly (category or cuisine) so a
// Restaurants + Pizza selection queries "pizza", not the generic "restaurants".
function useLiveShopPlaces(coords: Coords | null, enabled: boolean, def: PlacesDef): RawPlace[] | null {
  const [live, setLive] = useState<RawPlace[] | null>(null);
  useEffect(() => {
    if (!enabled || !coords) {
      setLive(null);
      return;
    }
    const cacheKey = `${def.k}@${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
    const cached = shopLiveCache.get(cacheKey);
    if (cached) {
      setLive(cached);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({
      lat: String(coords.lat), lng: String(coords.lng), keyword: def.keyword, type: def.type,
    });
    fetch(`/api/places?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (!d.configured) {
          // Server doesn't have the Places key (yet) — don't cache this, so
          // a later retry (once it IS configured) isn't masked forever by a
          // stale empty result from this same browser tab/session.
          setLive([]);
          return;
        }
        const results: RawPlace[] = d.results ?? [];
        shopLiveCache.set(cacheKey, results);
        setLive(results);
      })
      .catch(() => {
        if (!cancelled) setLive([]);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, coords?.lat, coords?.lng, def.k]);
  return live;
}

const PRICING: Tier[] = [
  { name: "Basic", price: "Free", per: "forever", bullets: ["Text-only listing", "30 days active", "Category placement", "Contact via in-app message"], muted: ["No photos", "No featured badge", "Standard placement", "No view stats"], cta: "Post Free Ad" },
  { name: "Photo Boost", price: "$2.99", per: "one-time", bullets: ["Up to 5 photos", "30 days active", "Photo gallery", "Category placement"], muted: ["No featured badge", "Standard placement"], cta: "Add Photos" },
  { name: "Featured", price: "$4.99", per: "for 30 days", accent: true, badge: "Most Popular", bullets: ["Up to 10 photos", "Featured for 30 days", "Featured badge", "Top of search results", "Gold border highlight", "View counter"], cta: "Go Featured" },
  { name: "Business Pro", price: "$29.99", per: "per month", bullets: ["Unlimited photos", "Unlimited listings", "CBL Partner badge", "Auto-featured", "Analytics dashboard", "Priority support"], cta: "Go Pro" },
];

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7l3 3 6-7" fill="none" stroke="#C99742" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
const Cross = () => (
  <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3l8 8M11 3l-8 8" stroke="#666" strokeWidth="2" strokeLinecap="round" /></svg>
);

function Hero({ onPost, signedIn }: { onPost: () => void; signedIn?: boolean }) {
  return (
    <section className="hero cbl-light-streams">
      {/* first child = dedicated streak layer (hosts 2 of the 4 light streams), under the copy */}
      <div className="hero-streams" aria-hidden="true" />
      <div className="hero-inner">
        <div className="eyebrow">classifieds · drivers · riders<span className="eb-sm"> · shopping · coupons</span></div>
        <h1 className="hero-title">
          <span className="title-stack">
            <span className="h1-main">CBL Directory</span>
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
          Sign in to post · Free to join
        </button>
        {signedIn && (
          <a className="signup-hint manage-link" href="/studio">
            Manage my posts in CBL Studio
          </a>
        )}
      </div>
    </section>
  );
}

// A horizontal scroller with edge fades + tappable ‹ › chevrons that appear
// only when there's more to scroll in that direction (so people know the
// section tabs / category chips swipe for more).
function ScrollRow({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ l: false, r: false });
  const update = () => {
    const el = ref.current;
    if (!el) return;
    const l = el.scrollLeft > 4;
    const r = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setEdge((prev) => (prev.l === l && prev.r === r ? prev : { l, r })); // guard re-render loop
  };
  // Re-measure after every render (content/section change) and on resize.
  useEffect(() => { update(); });
  useEffect(() => {
    const t = window.setTimeout(update, 250); // after fonts/layout settle
    window.addEventListener("resize", update);
    return () => { window.clearTimeout(t); window.removeEventListener("resize", update); };
  }, []);
  const nudge = (dir: number) => ref.current?.scrollBy({ left: dir * 150, behavior: "smooth" });
  return (
    <div className={"scroller" + (edge.l ? " sl" : "") + (edge.r ? " sr" : "")}>
      <button type="button" className="sc-arrow left" aria-label="Scroll left" tabIndex={-1} onClick={() => nudge(-1)}>‹</button>
      <div ref={ref} className={className} onScroll={update}>{children}</div>
      <button type="button" className="sc-arrow right" aria-label="Scroll right" tabIndex={-1} onClick={() => nudge(1)}>›</button>
    </div>
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
        <ScrollRow className="sec-row">
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
        </ScrollRow>
        <ScrollRow className="chip-row">
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
        </ScrollRow>
      </div>
    </div>
  );
}

function SectionHead({ section, onPost }: { section: string; onPost: () => void }) {
  const h: Record<string, { eb: string; h: string; sub: string; cta: string }> = {
    CLASSIFIEDS: { eb: "classifieds · buy · sell · trade", h: "Local Classifieds", sub: "powered by CBL", cta: "+ Post Listing" },
    DRIVERS: { eb: "driver ads · qr codes · self-promo", h: "Driver Posts", sub: "meet your driver", cta: "+ Post an Ad" },
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
      <div
        className="img"
        role="img"
        aria-label="Example featured listing photo — a local boutique storefront"
        style={{ backgroundImage: "linear-gradient(180deg,rgba(0,0,0,0) 55%,rgba(0,0,0,.35) 100%),url(/directory/featured-example.jpg)" }}
      >
        <span className="feat-badge">★ Featured</span>
        <span className="img-count">📷 Up to 10 photos</span>
      </div>
      <div className="body">
        <div style={{ height: 14, background: "rgba(201,151,66,.2)", borderRadius: 4, marginBottom: 8, width: "70%" }} />
        <div className="meta">Your category · <span className="gold">Top of search · 30 days</span></div>
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
              <div className="price-tag"><b>$4.99</b> · for 30 days</div>
            </div>
            <FeaturedListingMock />
            <ul>
              <li><Check /> Up to 10 photos — gallery view</li>
              <li><Check /> Gold border + featured badge</li>
              <li><Check /> Top of search results</li>
              <li><Check /> Live view counter + contact-verified</li>
              <li><Check /> 30 days active</li>
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

// "Verified CBL Driver" QR business card that rides along on an active driver's
// driver-availability posts — riders scan to connect with them in the CBL app.
function DriverQRCard({ code }: { code: string }) {
  const link = `${APP_URL}/r/${code}`;
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(link, { margin: 0, width: 360, color: { dark: "#000000", light: "#FFFFFF" } })
      .then(setQr).catch(() => setQr(""));
  }, [link]);
  return (
    <div style={{ marginTop: 18, display: "flex", gap: 14, alignItems: "center", background: "rgba(77,191,102,.06)", border: "1px solid rgba(77,191,102,.32)", borderRadius: "14px 0 14px 0", padding: 14 }}>
      <div style={{ width: 84, height: 84, background: "#fff", borderRadius: 10, padding: 6, flexShrink: 0 }}>
        {qr && <img src={qr} alt="Driver referral QR code" style={{ width: "100%", height: "100%", display: "block" }} />}
      </div>
      <div>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "#8FE0A2", marginBottom: 5 }}>★ Verified CBL Driver</div>
        <div style={{ fontSize: 13, color: "#C8C8C8", lineHeight: 1.45 }}>Scan to connect with this driver in the CBL app.</div>
      </div>
    </div>
  );
}

// Premium driver-ad "business card" — the full self-promo card a driver posts.
// Header + profile photo + car photo + license plate + big QR + contact, on
// brand and on-message (SaaS / independent contractor). Fields are customizable.
const DRIVERAD_CSS = `
.cbl-drivercard { position:relative; background:#0b0b0b; }
.cbl-drivercard .dc-top { position:relative; padding:32px 24px 24px; text-align:center;
  background:linear-gradient(180deg, rgba(10,10,10,.30) 0%, rgba(10,10,10,.82) 82%, #0b0b0b 100%), url('${MAP_BG}') center top / cover no-repeat; }
.cbl-drivercard .dc-avatar { width:118px; height:118px; border-radius:50%; object-fit:cover; border:3px solid #C99742; box-shadow:0 0 0 4px rgba(201,151,66,.16); margin:0 auto 16px; display:block; }
.cbl-drivercard .dc-avatar.ph { display:flex; align-items:center; justify-content:center; background:#161616; font-family:${DISPLAY}; font-weight:900; font-size:44px; color:#C99742; }
.cbl-drivercard .dc-eyebrow { font-family:${MONO}; font-size:12px; letter-spacing:.24em; text-transform:uppercase; color:#8f8f8f; margin-bottom:8px; }
.cbl-drivercard .dc-h { font-family:${DISPLAY}; font-weight:900; font-size:clamp(34px,9vw,44px); line-height:.98; text-transform:uppercase; letter-spacing:-.01em; color:#fff; margin:0 0 8px; }
.cbl-drivercard .dc-ride { font-size:19px; color:#cfcfcf; margin-bottom:16px; }
.cbl-drivercard .dc-ride b { font-family:${ITALIC}; font-style:italic; font-weight:600; color:#C99742; }
.cbl-drivercard .dc-badge { display:inline-flex; align-items:center; gap:8px; font-family:${MONO}; font-size:11px; letter-spacing:.11em; text-transform:uppercase; color:#C99742; border:1px solid rgba(201,151,66,.5); border-radius:999px; padding:8px 16px; }
.cbl-drivercard .dc-avail { margin-top:14px; font-family:${MONO}; font-size:11.5px; letter-spacing:.07em; text-transform:uppercase; color:#cbb27f; display:inline-flex; align-items:center; gap:7px; }
.cbl-drivercard .dc-car { position:relative; margin:20px 20px 0; border-radius:14px; overflow:hidden; min-height:150px; border:1px solid rgba(255,255,255,.07);
  background:linear-gradient(180deg,#161616,#0c0c0c); display:flex; align-items:center; justify-content:center; }
.cbl-drivercard .dc-car img { width:82%; max-height:150px; object-fit:contain; filter:drop-shadow(0 12px 22px rgba(0,0,0,.6)); }
.cbl-drivercard .dc-carph { color:#6a6a6a; font-family:${MONO}; font-size:12px; letter-spacing:.08em; text-transform:uppercase; text-align:center; padding:26px; }
.cbl-drivercard .dc-carinfo { text-align:center; padding:30px 24px; }
.cbl-drivercard .dc-carinfo .cv { font-family:${DISPLAY}; font-weight:900; font-size:24px; line-height:1.05; text-transform:uppercase; letter-spacing:-.01em; color:#fff; }
.cbl-drivercard .dc-carinfo .cc { font-family:${MONO}; font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:#C99742; margin-top:8px; }
.cbl-drivercard .dc-plate { position:absolute; bottom:14px; right:14px; background:#fff; color:#111; border-radius:8px; padding:7px 14px; font-family:${DISPLAY}; font-weight:900; font-size:23px; letter-spacing:.02em; display:flex; align-items:baseline; gap:8px; box-shadow:0 6px 16px rgba(0,0,0,.55); }
.cbl-drivercard .dc-plate .st { font-size:11px; font-weight:700; color:#777; letter-spacing:.1em; }
.cbl-drivercard .dc-contact { display:flex; gap:18px; align-items:center; padding:22px 24px 6px; }
.cbl-drivercard .dc-qr { width:118px; height:118px; background:#fff; border-radius:12px; padding:8px; flex-shrink:0; }
.cbl-drivercard .dc-qr img { width:100%; height:100%; display:block; }
.cbl-drivercard .dc-scan { font-family:${MONO}; font-size:11.5px; letter-spacing:.1em; text-transform:uppercase; color:#C99742; margin-bottom:9px; }
.cbl-drivercard .dc-phone { font-family:${DISPLAY}; font-weight:800; font-size:20px; color:#fff; margin-bottom:5px; }
.cbl-drivercard .dc-email { font-size:14px; color:#bcbcbc; margin-bottom:3px; word-break:break-all; }
.cbl-drivercard .dc-url { font-family:${MONO}; font-size:12px; color:#777; word-break:break-all; }
.cbl-drivercard .dc-foot { border-top:1px solid rgba(255,255,255,.08); margin:16px 24px 0; padding:18px 0 8px; text-align:center; }
.cbl-drivercard .dc-powered { display:flex; align-items:center; justify-content:center; gap:10px; margin-bottom:12px; }
.cbl-drivercard .dc-powered .pb { font-family:${MONO}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#7a7a7a; }
.cbl-drivercard .dc-powered img { height:24px; width:auto; display:block; }
.cbl-drivercard .dc-disc { font-size:12px; line-height:1.5; color:#7a7a7a; max-width:46ch; margin:0 auto; }
@media (max-width:480px) {
  /* On a phone the car block is too narrow for the plate to float over the
     centered car text — stack it below instead so nothing overlaps. */
  .cbl-drivercard .dc-car { flex-direction:column; }
  .cbl-drivercard .dc-carinfo { padding:22px 18px 6px; }
  .cbl-drivercard .dc-plate { position:static; margin:0 0 16px; font-size:20px; padding:6px 12px; }
  .cbl-drivercard .dc-car img { margin-bottom:12px; }
  .cbl-drivercard .dc-carinfo .cv { font-size:21px; }
}
`;

type DriverAd = {
  name: string; photo?: string | null; carPhoto?: string | null;
  car?: string | null; color?: string | null; // text fallback: "2024 Hyundai Santa Fe" + "Black"
  plate?: string | null; plateState?: string | null; code: string;
  phone?: string | null; email?: string | null; since?: string | null;
  availability?: string | null; // e.g. "Scheduled rides only · Book 12+ hrs ahead"
  radius?: number | null; // miles the driver serves — controls how far a search surfaces this ad (default 100)
};

// Default driver service radius (miles). Justin's call: drivers serve a wide
// area by default, and can narrow/widen it in the builder.
const DEFAULT_DRIVER_RADIUS_MI = 100;
const RADIUS_OPTIONS = [15, 25, 50, 100, 150, 250];

function DriverAdCard({ d }: { d: DriverAd }) {
  const link = `${APP_URL}/r/${d.code}`;
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(link, { margin: 0, width: 420, color: { dark: "#000000", light: "#FFFFFF" } })
      .then(setQr).catch(() => setQr(""));
  }, [link]);
  const first = d.name.trim().split(/\s+/)[0] || d.name;
  const initials = d.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="cbl-drivercard">
      <style>{DRIVERAD_CSS}</style>
      <div className="dc-top">
        {d.photo ? <img className="dc-avatar" src={d.photo} alt={d.name} /> : <div className="dc-avatar ph">{initials}</div>}
        <div className="dc-eyebrow">CBL Drivers Directory</div>
        <div className="dc-h">Need a Ride?</div>
        <div className="dc-ride">Ride with <b>{first}.</b></div>
        <div className="dc-badge">★ Private Membership Association{d.since ? ` · Since ${d.since}` : ""}</div>
        {d.availability && <div className="dc-avail">🕐 {d.availability}</div>}
      </div>
      <div className="dc-car">
        {d.carPhoto ? (
          <img src={d.carPhoto} alt={`${first}'s vehicle`} />
        ) : d.car ? (
          <div className="dc-carinfo"><div className="cv">{d.car}</div>{d.color && <div className="cc">{d.color}</div>}</div>
        ) : (
          <div className="dc-carph">Your vehicle photo</div>
        )}
        {d.plate && <div className="dc-plate">{d.plateState && <span className="st">{d.plateState}</span>}{d.plate}</div>}
      </div>
      <div className="dc-contact">
        <div className="dc-qr">{qr && <img src={qr} alt={`Scan to book with ${first}`} />}</div>
        <div>
          <div className="dc-scan">Scan to book with {first}</div>
          {d.phone && <div className="dc-phone">{d.phone}</div>}
          {d.email && <div className="dc-email">{d.email}</div>}
          <div className="dc-url">app.citybucketlist.com/r/{d.code}</div>
        </div>
      </div>
      <div className="dc-foot">
        <div className="dc-powered"><span className="pb">Powered by</span><img src={wordmark} alt="CityBucketList.com" /></div>
        <div className="dc-disc">CityBucketList is a SaaS platform. All drivers are independent contractors. CBL is not a rideshare company.</div>
      </div>
    </div>
  );
}

function DirListingModal({
  l, onClose, canEditPhotos, onEditPhotos, onCustomizeDriverAd,
}: {
  l: Listing | null;
  onClose: () => void;
  canEditPhotos?: boolean;
  onEditPhotos?: () => void;
  onCustomizeDriverAd?: () => void; // owner viewing their own driver card → open the builder
}) {
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
        <button className="close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
        {l.driverCode ? (
          <>
            {/* Driver posts render the premium "Need a Ride?" business card from
                the member's saved driver_ad (falls back to the post's own fields
                for older posts with no saved ad yet). */}
            <DriverAdCard
              d={{
                name: l.driverAd?.name || l.name,
                photo: l.driverAd?.photo ?? null,
                carPhoto: l.driverAd?.carPhoto ?? null,
                car: l.driverAd?.car ?? null,
                color: l.driverAd?.color ?? null,
                plate: l.driverAd?.plate ?? null,
                plateState: l.driverAd?.plateState ?? null,
                code: l.driverCode,
                phone: l.driverAd?.phone ?? null,
                email: l.driverAd?.email ?? null,
                since: l.driverAd?.since ?? null,
                availability: l.driverAd?.availability ?? null,
              }}
            />
            {onCustomizeDriverAd && (
              <div style={{ padding: "4px 24px 22px" }}>
                <button
                  type="button"
                  onClick={onCustomizeDriverAd}
                  style={{
                    width: "100%", cursor: "pointer", borderRadius: 999,
                    padding: "12px 18px", background: "transparent", color: "#C99742",
                    border: "1px solid #C99742", fontFamily: DISPLAY, fontWeight: 800,
                    fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase",
                  }}
                >
                  ＋ Customize my ad
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {l.placeholder || !l.img ? (
              <div className="shot ph">
                <span className="ph-ic">🏷️</span>
              </div>
            ) : (
              <div className="shot" style={{ backgroundImage: `url(${l.img})` }}>
                {l.photos ? <span className="pcount">📷 {l.photos}</span> : null}
              </div>
            )}
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
              {canEditPhotos && onEditPhotos && (
                <button
                  type="button"
                  onClick={onEditPhotos}
                  style={{
                    marginTop: 18, width: "100%", cursor: "pointer", borderRadius: 999,
                    padding: "12px 18px", background: "transparent", color: "#C99742",
                    border: "1px solid #C99742", fontFamily: DISPLAY, fontWeight: 800,
                    fontSize: 13, letterSpacing: ".1em", textTransform: "uppercase",
                  }}
                >
                  ＋ Add / edit photos
                </button>
              )}
            </div>
          </>
        )}
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
          <span>{l.foot ?? (l.featured ? <span style={{ color: "#C99742" }}>★ Featured · 247 views</span> : "Basic listing")}</span>
          <span className="arrow">›</span>
        </div>
      </div>
    </article>
  );
}

// Grid preview for a driver post — a compact echo of the full DriverAdCard so
// the teaser resembles the card riders open for details. Falls back to the
// generic ClassifiedCard if the post has no driver_ad yet.
function DriverPreviewCard({ l }: { l: Listing }) {
  const openModal = useContext(DirModalCtx);
  const d = l.driverAd;
  if (!d) return <ClassifiedCard l={l} />;
  const nm = d.name || l.name;
  const first = String(nm).trim().split(/\s+/)[0] || String(nm);
  const initials = String(nm).split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const open = () => openModal(l);
  return (
    <article
      className={"listing dpc" + (l.featured ? " featured" : "")}
      onClick={open}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
      style={{ cursor: "pointer" }}
    >
      <div className="dpc-hero">
        <div className="dpc-av">{d.photo ? <img src={d.photo} alt={String(nm)} /> : initials}</div>
        <div className="dpc-eb">Need a Ride?</div>
        <div className="dpc-h">Ride with {first}</div>
        <div className="dpc-ride"><b>{l.loc.split(" · ")[0]}</b></div>
      </div>
      <div className="dpc-body">
        {d.availability && <div className="dpc-avail">🕐 {d.availability}</div>}
        {(d.car || d.plate) && (
          <div className="dpc-carrow">
            {d.car ? <span className="dpc-car">{d.car}{d.color ? ` · ${d.color}` : ""}</span> : <span />}
            {d.plate && <span className="dpc-plate">{d.plateState && <span className="st">{d.plateState}</span>}{d.plate}</span>}
          </div>
        )}
        <div className="dpc-cta"><span>📱 Scan &amp; book</span><span>View card ›</span></div>
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
      <a className="cta" href={RIDER_BOOK_URL} target="_blank" rel="noopener noreferrer">Book a Pickup Ride →</a>
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
              {/* You post a listing first (free), then choose a boost on the success
                  screen — so every tier's CTA opens the post flow. Free just posts;
                  paid tiers guide you to Featured/Pro after posting. */}
              <button type="button" className="cta" onClick={onPost}>{t.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Driver-specific notice shown at the foot of the Driver Ads section. Clarifies
// the member-to-driver connection flow + independent-contractor status.
// Plain-language — have counsel review before relying on it as binding terms.
function DriverDisclaimer() {
  return (
    <CollapsibleLegal title="Software Platform Notice">
      <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "#9A9A9A", margin: 0 }}>
        <b style={{ color: "#DDB15F" }}>City Bucket List is a software-as-a-service (SaaS) platform —
        not a rideshare company, transportation provider, or passenger carrier.</b> We provide software
        that connects members with independent drivers; we <b style={{ color: "#C0C0C0" }}>do not own
        vehicles, employ or dispatch drivers, set fares, or provide transportation</b>. Drivers listed
        here are <b style={{ color: "#C0C0C0" }}>independent contractors</b>, not employees or agents of
        City Bucket List. To connect, a rider scans a driver&rsquo;s QR code, signs up as a City Bucket
        List Private Membership member, and arranges{" "}
        <b style={{ color: "#C0C0C0" }}>private, scheduled rides directly with that driver</b> — who
        decides, <b style={{ color: "#C0C0C0" }}>at their sole discretion</b>, whether to accept any
        request. City Bucket List is <b style={{ color: "#C0C0C0" }}>not a party to any ride</b> and
        accepts no liability for it; riders and drivers are responsible for their own licensing,
        insurance, safety, and compliance with applicable law, and interact{" "}
        <b style={{ color: "#C0C0C0" }}>at their own risk</b>.
      </p>
      <p style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.6, color: "#6f6f6f", margin: "12px 0 0", letterSpacing: ".02em" }}>
        &copy; {new Date().getFullYear()} Citybucketlist.com, LLC. All rights reserved. City Bucket
        List&trade; is a service of Citybucketlist.com, LLC.
      </p>
    </CollapsibleLegal>
  );
}

/* ── Driver Ad builder ───────────────────────────────────────────────────────
 * The premium "Need a Ride?" business card is a Driver Member perk ($19.99/mo
 * Private Membership). Flow:
 *   • Not signed in → sign-in gate.
 *   • Signed in, not an active driver member → upgrade gate (explain the perk +
 *     "Become a Driver Member"; secondary "post a basic text ad" for a plain
 *     driver-availability post with no card).
 *   • Active driver member → the builder: prefilled from their membership
 *     (photo, name, vehicle, contact, referral code), Edit/Preview tabs, and a
 *     live DriverAdCard preview. Saves the fields into directory_listings.driver_ad.
 */
const DRIVERMODAL_CSS = `
.cbl-drivermodal { position:fixed; inset:0; z-index:995; display:grid; place-items:center; padding:16px; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-drivermodal *,.cbl-drivermodal *::before,.cbl-drivermodal *::after { box-sizing:border-box; margin:0; padding:0; }
.cbl-drivermodal .backdrop { position:absolute; inset:0; background:rgba(0,0,0,.74); backdrop-filter:blur(3px); -webkit-backdrop-filter:blur(3px); }
.cbl-drivermodal .panel { position:relative; width:min(520px,100%); max-height:calc(100dvh - 32px); overflow-y:auto; background:#141414; border:1px solid rgba(201,151,66,.45); border-radius:18px 0 18px 0; box-shadow:0 18px 44px rgba(0,0,0,.55); padding:26px; animation:cbl-post-pop .26s cubic-bezier(.2,.9,.3,1.25) both; }
.cbl-drivermodal .close { position:absolute; top:12px; right:12px; background:transparent; border:0; color:#888; cursor:pointer; font-size:15px; line-height:1; padding:6px 8px; z-index:2; }
.cbl-drivermodal .close:hover { color:#fff; }
.cbl-drivermodal .eyebrow { font-family:${MONO}; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:#C99742; margin-bottom:8px; }
.cbl-drivermodal h2 { font-family:${DISPLAY}; font-weight:900; font-size:28px; line-height:.98; letter-spacing:-.01em; text-transform:uppercase; color:#fff; margin:0 0 8px; }
.cbl-drivermodal h2 .it { font-family:${ITALIC}; font-style:italic; font-weight:600; color:#C99742; text-transform:none; }
.cbl-drivermodal .sub { font-size:13.5px; line-height:1.5; color:#B8B8B8; margin:0 0 18px; }
.cbl-drivermodal .tabs { display:flex; gap:6px; background:#0A0A0A; border:1px solid rgba(255,255,255,.1); border-radius:999px; padding:4px; margin:0 0 18px; }
.cbl-drivermodal .tabs button { flex:1; border:0; cursor:pointer; border-radius:999px; padding:9px 12px; background:transparent; color:#9a9a9a; font-family:${MONO}; font-size:11px; letter-spacing:.14em; text-transform:uppercase; font-weight:700; transition:background .2s,color .2s; }
.cbl-drivermodal .tabs button[aria-selected="true"] { background:#C99742; color:#0A0A0A; }
.cbl-drivermodal label { display:block; font-family:${MONO}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#8f8f8f; margin:0 0 7px 2px; }
.cbl-drivermodal label .req { color:#C99742; }
.cbl-drivermodal .field { margin-bottom:13px; }
.cbl-drivermodal .row { display:flex; gap:10px; }
.cbl-drivermodal .row .field { flex:1; }
.cbl-drivermodal .field input, .cbl-drivermodal .field select, .cbl-drivermodal .field textarea { width:100%; background:#0A0A0A; color:#fff; font-size:15px; font-family:inherit; border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:11px 13px; transition:border-color .2s, box-shadow .2s, background .2s; }
.cbl-drivermodal .field textarea { resize:vertical; min-height:70px; line-height:1.45; }
.cbl-drivermodal .field input::placeholder, .cbl-drivermodal .field textarea::placeholder { color:#6a6a6a; }
.cbl-drivermodal .field input:focus, .cbl-drivermodal .field select:focus, .cbl-drivermodal .field textarea:focus { outline:none; border-color:#C99742; background:rgba(201,151,66,.05); box-shadow:0 0 0 4px rgba(201,151,66,.16); }
.cbl-drivermodal .photorow { display:flex; align-items:center; gap:14px; margin-bottom:16px; }
.cbl-drivermodal .avatar { width:64px; height:64px; border-radius:50%; overflow:hidden; flex-shrink:0; border:2px solid #C99742; background:#1A1A1A; display:grid; place-items:center; color:#C99742; font-weight:800; font-size:22px; }
.cbl-drivermodal .avatar img { width:100%; height:100%; object-fit:cover; }
.cbl-drivermodal .photorow .acts { display:flex; flex-direction:column; gap:6px; }
.cbl-drivermodal .minibtn { display:inline-flex; align-items:center; gap:6px; cursor:pointer; border:1px solid rgba(201,151,66,.5); background:rgba(201,151,66,.06); color:#DDB15F; border-radius:999px; padding:6px 13px; font-size:12px; font-weight:700; font-family:inherit; transition:background .18s; }
.cbl-drivermodal .minibtn:hover { background:rgba(201,151,66,.14); }
.cbl-drivermodal .minibtn input { display:none; }
.cbl-drivermodal .minibtn.ghost { border-color:rgba(255,255,255,.18); background:transparent; color:#9a9a9a; }
.cbl-drivermodal .carthumb { position:relative; width:100%; height:120px; border-radius:12px; overflow:hidden; background:#0A0A0A; border:1px dashed rgba(201,151,66,.4); display:grid; place-items:center; margin-bottom:6px; }
.cbl-drivermodal .carthumb img { width:100%; height:100%; object-fit:cover; }
.cbl-drivermodal .carthumb .rm { position:absolute; top:6px; right:6px; width:24px; height:24px; border-radius:50%; border:0; background:rgba(0,0,0,.72); color:#fff; font-size:12px; cursor:pointer; }
.cbl-drivermodal .hint { font-size:11.5px; color:#7a7a7a; margin:-4px 2px 14px; line-height:1.5; }
.cbl-drivermodal .submit { width:100%; border:0; cursor:pointer; border-radius:999px; padding:14px 30px; background:#C99742; color:#000; font-family:${DISPLAY}; font-weight:900; font-size:14px; letter-spacing:.14em; text-transform:uppercase; transition:background .2s; }
.cbl-drivermodal .submit:hover:not(:disabled) { background:#DDB15F; }
.cbl-drivermodal .submit:disabled { background:#555; cursor:not-allowed; }
.cbl-drivermodal .submit.ghost { background:transparent; color:#9A9A9A; border:1px solid rgba(255,255,255,.16); margin-top:10px; }
.cbl-drivermodal .submit.ghost:hover:not(:disabled) { background:rgba(255,255,255,.05); color:#C8C8C8; }
.cbl-drivermodal .alert { border-radius:12px; padding:11px 14px; font-size:13px; line-height:1.45; margin-bottom:14px; background:rgba(220,60,60,.12); border:1px solid rgba(220,60,60,.4); color:#f0b3b3; }
.cbl-drivermodal .gate, .cbl-drivermodal .success { text-align:center; padding:6px 0 2px; }
.cbl-drivermodal .gate .mark, .cbl-drivermodal .success .mark { width:52px; height:52px; margin:0 auto 14px; border-radius:50%; border:2px solid #C99742; display:grid; place-items:center; color:#C99742; font-size:24px; }
.cbl-drivermodal .perks { list-style:none; text-align:left; margin:0 auto 18px; max-width:320px; display:flex; flex-direction:column; gap:9px; }
.cbl-drivermodal .perks li { display:flex; gap:9px; align-items:flex-start; font-size:13.5px; line-height:1.45; color:#C8C8C8; }
.cbl-drivermodal .perks li svg { flex-shrink:0; margin-top:2px; color:#C99742; }
.cbl-drivermodal .price { font-family:${MONO}; font-size:12px; letter-spacing:.06em; color:#9a9a9a; margin:0 0 16px; }
.cbl-drivermodal .price b { color:#DDB15F; }
.cbl-drivermodal .previewwrap { margin:0 0 16px; }
@media (max-width:480px) { .cbl-drivermodal .panel { padding:22px 18px; } .cbl-drivermodal h2 { font-size:24px; } }
`;

// Driver-subscription join target (app owns the real subscription flow).
const DRIVER_JOIN_URL = `${APP_URL}/driver/signup`;

type EditDriverListing = { id: string; title: string; city: string | null; state: string | null; driverAd: DriverAd | null };

function DriverAdModal({
  open, onClose, defaultCity, defaultState, onPosted, onBasicPost, editListing,
}: {
  open: boolean;
  onClose: () => void;
  defaultCity?: string | null;
  defaultState?: string | null;
  onPosted: () => void;
  onBasicPost: () => void;
  editListing?: EditDriverListing | null;
}) {
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<MyDriverProfile | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  // Builder fields.
  const [headline, setHeadline] = useState("");
  const [cityField, setCityField] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [memberPhoto, setMemberPhoto] = useState<string | null>(null); // membership photo (for "reset")
  const [carPhoto, setCarPhoto] = useState<string | null>(null);
  const [car, setCar] = useState("");
  const [color, setColor] = useState("");
  const [plate, setPlate] = useState("");
  const [plateState, setPlateState] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [since, setSince] = useState("");
  const [availability, setAvailability] = useState("Scheduled rides only · Book 12+ hrs ahead");
  const [radius, setRadius] = useState(DEFAULT_DRIVER_RADIUS_MI);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState<"" | "profile" | "car">("");
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  useEffect(() => {
    if (!open) return;
    const ed = editListing?.driverAd ?? null;
    setChecking(true);
    setTab("edit");
    setStatus("idle");
    setErrorMsg("");
    setJoinOpen(false);
    // Editing → seed from the saved card; new post → blank/defaults.
    setHeadline(editListing?.title ?? "");
    setCityField(editListing?.city ?? defaultCity ?? "");
    setCarPhoto(ed?.carPhoto ?? null);
    setColor(ed?.color ?? "");
    setPlate(ed?.plate ?? "");
    setPlateState(ed?.plateState ?? "");
    setDescription("");
    setAvailability(ed?.availability ?? "Scheduled rides only · Book 12+ hrs ahead");
    setRadius(Number(ed?.radius) || DEFAULT_DRIVER_RADIUS_MI);

    let cancelled = false;
    getMyDriverProfile().then((p) => {
      if (cancelled) return;
      setSignedIn(p !== null);
      setProfile(p);
      if (p?.isActiveDriver) {
        setMemberPhoto(p.photo ?? null);
        // Editing keeps the card's saved values; only fall back to membership
        // for anything the saved card didn't have.
        setPhoto(ed?.photo ?? p.photo ?? null);
        setCar(ed?.car ?? [p.vehicleYear, p.vehicleInfo].filter(Boolean).join(" "));
        setPhone(ed?.phone ?? formatPhone(p.phone));
        setEmail(ed?.email ?? p.email ?? "");
        setSince(ed?.since ?? String(new Date().getFullYear()));
      }
      setChecking(false);
    });

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelled = true;
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, defaultCity, editListing]);

  if (!open) return null;

  const onPhotoFile = async (files: FileList | null, kind: "profile" | "car") => {
    const f = files?.[0];
    if (!f) return;
    setUploading(kind);
    setErrorMsg("");
    const { url, error } = await uploadDriverAdPhoto(f, kind);
    setUploading("");
    if (error) { setErrorMsg(error); return; }
    if (url) { kind === "profile" ? setPhoto(url) : setCarPhoto(url); }
  };

  const draft: DriverAd = {
    name: profile?.name || "Your Name",
    photo,
    carPhoto,
    car: car.trim() || null,
    color: color.trim() || null,
    plate: plate.trim() || null,
    plateState: plateState.trim() || null,
    code: profile?.referralCode || "yourcode",
    phone: phone.trim() || null,
    email: email.trim() || null,
    since: since.trim() || null,
    availability: availability.trim() || null,
    radius,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "pending") return;
    if (!headline.trim()) { setStatus("error"); setErrorMsg("Add a headline for your ad (e.g. “Need a Ride? Airport runs in Pittsburgh”)."); setTab("edit"); return; }
    setStatus("pending");
    setErrorMsg("");
    const adFields = {
      name: profile?.name ?? null,
      photo: photo ?? null,
      carPhoto: carPhoto ?? null,
      car: car.trim() || null,
      color: color.trim() || null,
      plate: plate.trim() || null,
      plateState: plateState.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      since: since.trim() || null,
      availability: availability.trim() || null,
      radius,
    };
    let error: string | null;
    if (editListing) {
      // Editing keeps the same city/state unless the field was changed.
      const cityUnchanged = cityField.trim().toLowerCase() === (editListing.city ?? "").trim().toLowerCase();
      ({ error } = await updateDriverAd(editListing.id, {
        title: headline.trim(),
        city: cityField.trim() || undefined,
        state: cityUnchanged ? editListing.state : null,
        driverAd: adFields,
      }));
    } else {
      const cityUnchanged = cityField.trim().toLowerCase() === (defaultCity ?? "").trim().toLowerCase();
      ({ error } = await postDirectoryListing({
        title: headline.trim(),
        category: "driver_post",
        description: description.trim() || undefined,
        city: cityField.trim() || undefined,
        state: cityUnchanged ? (defaultState?.trim() || null) : null,
        driverAd: adFields,
      }));
    }
    if (error) { setStatus("error"); setErrorMsg(error); }
    else { setStatus("success"); onPosted(); }
  };

  const initials = (profile?.name || "You").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <div className="cbl-drivermodal" role="dialog" aria-modal="true" aria-labelledby="cbl-driverad-title">
        <style>{DRIVERMODAL_CSS}</style>
        <div className="backdrop" onClick={onClose} />
        <div className="panel">
          <button className="close" aria-label="Close" onClick={onClose}>✕</button>

          {checking ? (
            <p className="sub" style={{ margin: "8px 0" }}>Checking your membership…</p>
          ) : !signedIn ? (
            <div className="gate">
              <div className="mark" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </div>
              <div className="eyebrow">driver ad</div>
              <h2 id="cbl-driverad-title">Sign in <span className="it">to post.</span></h2>
              <p className="sub">The driver business card is part of your City Bucket List membership. Sign in with the same account you use across the site and app.</p>
              <button type="button" className="submit" onClick={() => setJoinOpen(true)}>Sign in / Join Free →</button>
            </div>
          ) : profile && !profile.isActiveDriver ? (
            <div className="gate">
              <div className="eyebrow">driver membership</div>
              <h2 id="cbl-driverad-title">Your own <span className="it">ride card.</span></h2>
              <p className="sub">The premium &ldquo;Need a Ride?&rdquo; business card — your photo, your car, your plate, and a big personal QR riders scan to book you — is a <b style={{ color: "#DDB15F" }}>Driver Member</b> perk.</p>
              <ul className="perks">
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg><span>Full business card with your photo &amp; car — images included, no extra fees.</span></li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg><span>Your personal QR code — riders scan, join, and request rides from you directly.</span></li>
                <li><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg><span>You stay an independent contractor — you decide which rides to accept.</span></li>
              </ul>
              <p className="price"><b>$19.99/mo</b> Private Membership · cancel anytime</p>
              <a className="submit" href={DRIVER_JOIN_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", textDecoration: "none" }}>Become a Driver Member →</a>
              <button type="button" className="submit ghost" onClick={() => { onClose(); onBasicPost(); }}>Post a basic text ad instead</button>
            </div>
          ) : status === "success" ? (
            <div className="success">
              <div className="mark" aria-hidden="true">✓</div>
              <h2 id="cbl-driverad-title">Your card is <span className="it">{editListing ? "updated." : "live."}</span></h2>
              <p className="sub">{editListing ? "Your changes are saved — your card is updated across the directory." : "Your driver business card is posted to the directory. Riders can scan your QR to join and book you. You can edit or repost it any time."}</p>
              <button type="button" className="submit" onClick={onClose}>Done</button>
            </div>
          ) : (
            <>
              <div className="eyebrow">driver ad · member perk</div>
              <h2 id="cbl-driverad-title">{editListing ? <>Edit your <span className="it">ride card.</span></> : <>Build your <span className="it">ride card.</span></>}</h2>
              <p className="sub">{editListing ? "Update anything below — your live card refreshes the moment you save." : "This is what riders see. Everything’s prefilled from your membership — tweak anything, then post."}</p>

              <div className="tabs" role="tablist" aria-label="Edit or preview">
                <button role="tab" aria-selected={tab === "edit"} onClick={() => setTab("edit")}>Edit</button>
                <button role="tab" aria-selected={tab === "preview"} onClick={() => setTab("preview")}>Preview</button>
              </div>

              {errorMsg && <div className="alert" role="alert">{errorMsg}</div>}

              {tab === "preview" ? (
                <div className="previewwrap">
                  <DriverAdCard d={draft} />
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="photorow">
                    <div className="avatar">{photo ? <img src={photo} alt="Your profile" /> : initials}</div>
                    <div className="acts">
                      <label className="minibtn" style={{ margin: 0 }}>
                        {uploading === "profile" ? "Uploading…" : "Change photo"}
                        <input type="file" accept="image/*" disabled={!!uploading} onChange={(e) => onPhotoFile(e.target.files, "profile")} />
                      </label>
                      {memberPhoto && photo !== memberPhoto && (
                        <button type="button" className="minibtn ghost" onClick={() => setPhoto(memberPhoto)}>Use my member photo</button>
                      )}
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="da-headline">Headline <span className="req">*</span></label>
                    <input id="da-headline" type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Need a Ride? Airport runs in Pittsburgh" maxLength={90} required />
                  </div>

                  <div className="row">
                    <div className="field">
                      <label htmlFor="da-city">City you serve</label>
                      <input id="da-city" type="text" value={cityField} onChange={(e) => setCityField(e.target.value)} placeholder="Pittsburgh" />
                    </div>
                    <div className="field" style={{ maxWidth: 150 }}>
                      <label htmlFor="da-radius">How far you&rsquo;ll go</label>
                      <select id="da-radius" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                        {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r} mi</option>)}
                      </select>
                    </div>
                  </div>
                  <p className="hint">Your ad shows to riders searching anywhere within this range of your city.</p>

                  <div className="row">
                    <div className="field">
                      <label htmlFor="da-car">Your car</label>
                      <input id="da-car" type="text" value={car} onChange={(e) => setCar(e.target.value)} placeholder="2017 Hyundai Santa Fe" />
                    </div>
                    <div className="field" style={{ maxWidth: 130 }}>
                      <label htmlFor="da-color">Color</label>
                      <input id="da-color" type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="Black" />
                    </div>
                  </div>

                  <div className="row">
                    <div className="field">
                      <label htmlFor="da-plate">License plate</label>
                      <input id="da-plate" type="text" value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} placeholder="KBL-2408" maxLength={10} />
                    </div>
                    <div className="field" style={{ maxWidth: 90 }}>
                      <label htmlFor="da-pstate">State</label>
                      <input id="da-pstate" type="text" value={plateState} onChange={(e) => setPlateState(e.target.value.toUpperCase().slice(0, 2))} placeholder="PA" maxLength={2} />
                    </div>
                  </div>

                  <div className="carthumb">
                    {carPhoto ? (
                      <>
                        <img src={carPhoto} alt="Your car" />
                        <button type="button" className="rm" aria-label="Remove car photo" onClick={() => setCarPhoto(null)}>✕</button>
                      </>
                    ) : (
                      <label className="minibtn" style={{ margin: 0 }}>
                        {uploading === "car" ? "Uploading…" : "＋ Add a car photo (optional)"}
                        <input type="file" accept="image/*" disabled={!!uploading} onChange={(e) => onPhotoFile(e.target.files, "car")} />
                      </label>
                    )}
                  </div>
                  <p className="hint">No photo? No problem — your card shows your car&rsquo;s year, make, model &amp; color instead.</p>

                  <div className="row">
                    <div className="field">
                      <label htmlFor="da-phone">Phone</label>
                      <input id="da-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(412) 555-0148" />
                    </div>
                    <div className="field">
                      <label htmlFor="da-since">Driving since</label>
                      <input id="da-since" type="text" value={since} onChange={(e) => setSince(e.target.value)} placeholder="2025" maxLength={4} />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="da-email">Email</label>
                    <input id="da-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                  </div>

                  <div className="field">
                    <label htmlFor="da-avail">Availability line</label>
                    <input id="da-avail" type="text" value={availability} onChange={(e) => setAvailability(e.target.value)} placeholder="Scheduled rides only · Book 12+ hrs ahead" maxLength={70} />
                  </div>

                  <div className="field">
                    <label htmlFor="da-desc">Anything else (optional)</label>
                    <textarea id="da-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Areas you cover, airport specialties, notice you need…" maxLength={400} />
                  </div>

                  <button type="submit" className="submit" disabled={status === "pending" || !!uploading}>
                    {status === "pending" ? (editListing ? "Saving…" : "Posting…") : (editListing ? "Save changes →" : "Post my ad →")}
                  </button>
                </form>
              )}

              {tab === "preview" && (
                <button type="button" className="submit" disabled={status === "pending"} onClick={handleSubmit}>
                  {status === "pending" ? (editListing ? "Saving…" : "Posting…") : (editListing ? "Save changes →" : "Post my ad →")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      {joinOpen && <JoinModal open={joinOpen} onClose={() => setJoinOpen(false)} source="directory-driver-ad" />}
    </>
  );
}

// Firm conduct / legal disclaimer shown at the foot of every Directory section.
// Plain-language policy — Keith should have counsel review before relying on it
// as binding terms in your jurisdiction.
function ConductDisclaimer() {
  return (
    <CollapsibleLegal title="Community & Conduct Policy">
          <p style={{ fontSize: 12.5, lineHeight: 1.65, color: "#9A9A9A", margin: 0 }}>
            The City Bucket List Directory, operated by <b style={{ color: "#C0C0C0" }}>Citybucketlist.com, LLC</b>{" "}
            (&ldquo;City Bucket List&rdquo;), is a member-powered marketplace. Listings are submitted by
            members and are <b style={{ color: "#C0C0C0" }}>not verified, endorsed, or guaranteed</b> by
            City Bucket List. <b style={{ color: "#C0C0C0" }}>We have zero tolerance for malicious activity.</b>{" "}
            Anything illegal, fraudulent, or harmful — including solicitation, adult or sexual content,
            harassment, hate speech, threats, scams, spam, impersonation, or misuse of another person's
            information — is strictly prohibited. Violations result in{" "}
            <b style={{ color: "#DDB15F" }}>immediate removal of your content and a permanent ban from the
            City Bucket List platform, including termination of your Private Membership without refund</b>,
            and may be reported to law enforcement. Members interact and transact{" "}
            <b style={{ color: "#C0C0C0" }}>at their own risk</b>; City Bucket List is not a party to, and
            accepts no liability for, dealings between members. We reserve the right to remove any listing
            and to suspend or terminate any account at our sole discretion. Posting to the Directory
            constitutes acceptance of these terms.
          </p>
          <p
            style={{
              fontSize: 12.5, lineHeight: 1.6, color: "#B8B8B8", margin: "14px 0 0",
              paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.07)",
            }}
          >
            See something that doesn&rsquo;t belong here? Email us at{" "}
            <a
              href="mailto:info@citybucketlist.com?subject=Directory%20report"
              style={{ color: "#C99742", fontWeight: 700, textDecoration: "underline" }}
            >
              info@citybucketlist.com
            </a>{" "}
            and we&rsquo;ll review it.
          </p>
    </CollapsibleLegal>
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
            <p style={{ color: "#B0B0B0", fontSize: 15, lineHeight: 1.55, maxWidth: "52ch", marginBottom: 20, textWrap: "pretty" }}>
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

// Pittsburgh metro center + radius (same as Eats) — used only to LABEL the
// "whole area" scope toggle as "Pittsburgh area" when the visitor is in the
// metro. Listings themselves are filtered by city/state (they carry no coords).
const PGH_CENTER: [number, number] = [40.4406, -79.9959];
const METRO_RADIUS_MI = 45;
function milesFromPgh(coords: { lat: number; lng: number } | null): number | null {
  if (!coords) return null;
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(PGH_CENTER[0] - coords.lat);
  const dLng = toRad(PGH_CENTER[1] - coords.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coords.lat)) * Math.cos(toRad(PGH_CENTER[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function LocationBar({
  city, onChangeCity, scope, onScope, metroLabel, showScope,
}: {
  city: string | null;
  onChangeCity: (c: string) => void;
  scope: "metro" | "local";
  onScope: (s: "metro" | "local") => void;
  metroLabel: string;
  showScope: boolean;
}) {
  // Auto-detected city prefills; type ANY city or town to look there (works
  // everywhere — listings are city-tagged, so they show for that city as they post).
  const [q, setQ] = useState(city ?? "");
  useEffect(() => {
    setQ(city ?? "");
  }, [city]);
  // Google-backed location autocomplete (via our server-side proxy). Suggestions
  // are best-effort — free-typing + Enter still works if the API is unset/down.
  const [sug, setSug] = useState<{ mainText: string; secondaryText: string }[]>([]);
  const [openSug, setOpenSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
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
        if (seq !== reqSeq.current) return; // a newer keystroke won
        const preds = (data.predictions || []).map((p: { mainText: string; secondaryText: string }) => ({ mainText: p.mainText, secondaryText: p.secondaryText }));
        setSug(preds);
        setOpenSug(preds.length > 0);
        setActiveIdx(-1);
      } catch {
        setSug([]); setOpenSug(false);
      }
    }, 240);
  };
  const commit = () => {
    const v = q.trim();
    if (v && v.toLowerCase() !== (city ?? "").toLowerCase()) onChangeCity(v);
  };
  const pick = (text: string) => {
    setQ(text);
    setSug([]); setOpenSug(false); setActiveIdx(-1);
    if (text && text.toLowerCase() !== (city ?? "").toLowerCase()) onChangeCity(text);
  };
  // Close the dropdown on an outside click.
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpenSug(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  const pill = (active: boolean) => ({
    background: active ? "#C99742" : "transparent",
    color: active ? "#0A0A0A" : "#DDD",
    border: active ? "1px solid #C99742" : "1px solid rgba(255,255,255,.18)",
    borderRadius: 999,
    padding: "5px 14px",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
  });
  // What we're showing right now: the metro name when scoped wide, else the town.
  const shownPlace = showScope && scope === "metro" ? metroLabel : city;
  return (
    <div className="band tight" style={{ paddingBottom: 0 }}>
      <div className="band-inner" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ color: "#999", fontSize: 13 }}>
          {city ? <>Showing partners &amp; listings in <b style={{ color: "#C99742" }}>{shownPlace}</b></> : "Search a city to see local partners & listings"}
        </span>
        {showScope && (
          <div role="group" aria-label="Choose area" style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
            <button type="button" onClick={() => onScope("metro")} aria-pressed={scope === "metro"} style={pill(scope === "metro")}>
              {metroLabel}
            </button>
            <button type="button" onClick={() => onScope("local")} aria-pressed={scope === "local"} style={pill(scope === "local")}>
              Just {city}
            </button>
          </div>
        )}
        <div ref={wrapRef} style={{ position: "relative" }}>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); fetchSug(e.target.value); }}
            onFocus={() => { if (sug.length) setOpenSug(true); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setOpenSug(true); setActiveIdx((i) => Math.min(i + 1, sug.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
              else if (e.key === "Enter") { e.preventDefault(); if (openSug && activeIdx >= 0 && sug[activeIdx]) pick(sug[activeIdx].mainText); else commit(); }
              else if (e.key === "Escape") { setOpenSug(false); }
            }}
            onBlur={commit}
            placeholder="Search a city or town…"
            aria-label="Search a city"
            role="combobox"
            aria-expanded={openSug}
            aria-autocomplete="list"
            autoComplete="off"
            style={{ background: "#141414", color: "#fff", border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "6px 16px", fontSize: 12, minWidth: 190 }}
          />
          {openSug && sug.length > 0 && (
            <ul
              role="listbox"
              style={{
                position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, minWidth: 240, zIndex: 40,
                listStyle: "none", margin: 0, padding: 6, background: "#141414",
                border: "1px solid rgba(201,151,66,.4)", borderRadius: 14, boxShadow: "0 14px 34px rgba(0,0,0,.5)",
              }}
            >
              {sug.map((s, i) => (
                <li
                  key={s.mainText + i}
                  role="option"
                  aria-selected={i === activeIdx}
                  onMouseDown={(e) => { e.preventDefault(); pick(s.mainText); }}
                  onMouseEnter={() => setActiveIdx(i)}
                  style={{
                    display: "flex", flexDirection: "column", gap: 1, padding: "8px 12px", borderRadius: 9, cursor: "pointer",
                    background: i === activeIdx ? "rgba(201,151,66,.14)" : "transparent",
                  }}
                >
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>{s.mainText}</span>
                  {s.secondaryText && <span style={{ color: "#8f8f8f", fontSize: 11 }}>{s.secondaryText}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ city, onPost, ctaLabel = "Post the First Listing" }: { city: string | null; onPost: () => void; ctaLabel?: string }) {
  return (
    <div className="cbl-dir-empty" style={{ textAlign: "center", padding: "48px 24px", color: "#999" }}>
      <p style={{ marginBottom: 16 }}>
        {city ? `No listings near ${city} yet — be the first.` : "No listings yet — be the first."}
      </p>
      <button type="button" className="post-btn" onClick={onPost}>{ctaLabel} →</button>
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
  { v: "ride_request", l: "Ride Request (need a ride)" },
  { v: "driver_post", l: "Driver Available (offering rides)" },
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
.cbl-post .boost-opts { display:flex; flex-direction:column; gap:10px; text-align:left; margin:0 0 14px; }
.cbl-post .boost-btn { display:flex; flex-direction:column; gap:3px; width:100%; cursor:pointer; border-radius:14px 0 14px 0; padding:13px 16px; background:#141414; border:1px solid rgba(255,255,255,.12); transition:border-color .18s, background .18s; }
.cbl-post .boost-btn:hover:not(:disabled) { border-color:#C99742; background:rgba(201,151,66,.08); }
.cbl-post .boost-btn.feat { border-color:rgba(201,151,66,.55); background:linear-gradient(180deg, rgba(201,151,66,.12), rgba(201,151,66,.02)); }
.cbl-post .boost-btn:disabled { opacity:.6; cursor:not-allowed; }
.cbl-post .boost-btn .bt-name { font-family:${DISPLAY}; font-weight:800; font-size:14.5px; color:#fff; display:flex; align-items:center; gap:8px; }
.cbl-post .boost-btn .bt-tag { font-family:${MONO}; font-size:9.5px; letter-spacing:.12em; text-transform:uppercase; color:#000; background:#C99742; border-radius:999px; padding:2px 7px; }
.cbl-post .boost-btn .bt-price { font-size:12.5px; color:#9A9A9A; }
.cbl-post .submit.ghost { background:transparent; color:#9A9A9A; border:1px solid rgba(255,255,255,.16); }
.cbl-post .submit.ghost:hover { background:rgba(255,255,255,.05); color:#C8C8C8; }
.cbl-post .gate-btn { display:inline-block; border:0; cursor:pointer; border-radius:999px; padding:14px 32px; background:#C99742; color:#000; font-family:${DISPLAY}; font-weight:900; font-size:13.5px; letter-spacing:.14em; text-transform:uppercase; transition:background .2s; }
.cbl-post .gate-btn:hover { background:#DDB15F; }
@media (max-width:480px) { .cbl-post .panel { padding:24px 20px; } .cbl-post h2 { font-size:26px; } }
`;

function PostListingModal({
  open, onClose, defaultCity, defaultState, onPosted,
}: {
  open: boolean;
  onClose: () => void;
  defaultCity?: string | null;
  defaultState?: string | null;
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
  const [newId, setNewId] = useState<string | null>(null); // id of the just-posted listing (to boost)
  const [boosting, setBoosting] = useState<BoostTier | "">("");
  const [boostErr, setBoostErr] = useState("");

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
    setNewId(null);
    setBoosting("");
    setBoostErr("");
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
    // Send the visitor's detected state so a Pittsburgh post isn't left on the
    // table's legacy 'GA' default. If they typed a DIFFERENT city than detected we
    // don't know its state, so send null (never GA) rather than guess.
    const cityUnchanged = cityField.trim().toLowerCase() === (defaultCity ?? "").trim().toLowerCase();
    const { error, id } = await postDirectoryListing({
      title: title.trim(),
      category,
      description: description.trim() || undefined,
      priceType: free ? "free" : "fixed",
      price: free ? null : price.trim() ? Number(price) : null,
      city: cityField.trim() || undefined,
      state: cityUnchanged ? (defaultState?.trim() || null) : null,
    });
    if (error) {
      setStatus("error");
      setErrorMsg(error);
    } else {
      setNewId(id);
      setStatus("success");
      onPosted(); // re-run the page's getDirectoryListings().then(setListings)
    }
  };

  // Kick off a paid boost for the listing that was just posted → Stripe Checkout.
  const startBoost = async (tier: BoostTier) => {
    if (!newId || boosting) return;
    setBoostErr("");
    setBoosting(tier);
    const { error } = await startListingBoost(newId, tier); // redirects on success
    if (error) {
      setBoosting("");
      setBoostErr(error);
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
              <p>Posted to your local directory — free. Want it to sell faster? Boost it to
                the top with photos and a Featured badge.</p>
              {newId ? (
                <>
                  <div className="boost-opts">
                    <button type="button" className="boost-btn" disabled={!!boosting} onClick={() => startBoost("photo")}>
                      <span className="bt-name">📷 Photo Boost</span>
                      <span className="bt-price">{boosting === "photo" ? "Redirecting…" : "$2.99 · add up to 5 photos"}</span>
                    </button>
                    <button type="button" className="boost-btn feat" disabled={!!boosting} onClick={() => startBoost("featured")}>
                      <span className="bt-name">⭐ Featured <span className="bt-tag">Most popular</span></span>
                      <span className="bt-price">{boosting === "featured" ? "Redirecting…" : "$4.99 · top of results, 30 days"}</span>
                    </button>
                    <button type="button" className="boost-btn" disabled={!!boosting} onClick={() => startBoost("pro")}>
                      <span className="bt-name">🚀 Business Pro</span>
                      <span className="bt-price">{boosting === "pro" ? "Redirecting…" : "$29.99/mo · unlimited + analytics"}</span>
                    </button>
                  </div>
                  {boostErr && <div className="alert" role="alert" style={{ marginTop: 12 }}>{boostErr}</div>}
                  <button type="button" className="submit ghost" onClick={onClose}>No thanks — I&rsquo;m done</button>
                </>
              ) : (
                <button type="button" className="submit" onClick={onClose}>Done</button>
              )}
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
                <p style={{ fontSize: 11.5, lineHeight: 1.4, color: "#8A8A8A", margin: "2px 0 12px" }}>
                  Keep it friendly and legit — no solicitation, adult content, or
                  hateful/harassing posts. Anything that breaks our community
                  guidelines is removed and the account can be banned.
                </p>
                <button type="submit" className="submit" disabled={status === "pending"}>
                  {status === "pending" ? "Posting…" : "Post Listing — Free"}
                </button>
                {/* Posts free as tier:'basic'; the success screen then offers the
                    paid Photo/Featured/Pro boosts for this listing. */}
                <p className="tier-note">
                  Publishes free — you can boost it to Featured on the next step.
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

const EDIT_CSS = `
.cbl-edit { position:fixed; inset:0; z-index:1000; display:flex; align-items:center; justify-content:center; padding:20px; }
.cbl-edit .backdrop { position:absolute; inset:0; background:rgba(0,0,0,.72); backdrop-filter:blur(3px); }
.cbl-edit .panel { position:relative; width:100%; max-width:520px; max-height:90vh; overflow:auto; background:#0F0F0F; border:1px solid rgba(201,151,66,.3); border-radius:20px 0 20px 0; padding:30px 28px; }
.cbl-edit .close { position:absolute; top:14px; right:16px; background:none; border:0; color:#888; font-size:20px; cursor:pointer; }
.cbl-edit .eyebrow { font-family:${MONO}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#C99742; margin-bottom:8px; }
.cbl-edit h2 { font-family:${DISPLAY}; font-weight:900; font-size:26px; text-transform:uppercase; color:#fff; margin:0 0 6px; }
.cbl-edit h2 .it { font-family:${ITALIC}; font-style:italic; font-weight:600; text-transform:none; color:#C99742; }
.cbl-edit .sub { font-size:14px; color:#B8B8B8; line-height:1.5; margin:0 0 18px; }
.cbl-edit .grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:16px; }
.cbl-edit .thumb { position:relative; aspect-ratio:1; border-radius:12px; overflow:hidden; background:#1A1A1A; border:1px solid rgba(255,255,255,.1); }
.cbl-edit .thumb img { width:100%; height:100%; object-fit:cover; display:block; }
.cbl-edit .thumb .cover { position:absolute; top:6px; left:6px; background:#C99742; color:#000; font-family:${MONO}; font-size:9px; letter-spacing:.06em; text-transform:uppercase; padding:2px 6px; border-radius:999px; }
.cbl-edit .thumb .rm { position:absolute; top:5px; right:5px; width:22px; height:22px; border-radius:50%; border:0; background:rgba(0,0,0,.72); color:#fff; font-size:12px; cursor:pointer; display:grid; place-items:center; }
.cbl-edit .add { aspect-ratio:1; border:1.5px dashed rgba(201,151,66,.5); border-radius:12px; background:rgba(201,151,66,.05); color:#C99742; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; cursor:pointer; font-size:12px; font-weight:700; text-align:center; }
.cbl-edit .add:hover { background:rgba(201,151,66,.1); }
.cbl-edit .add input { display:none; }
.cbl-edit .submit { width:100%; border:0; cursor:pointer; border-radius:999px; padding:14px 30px; background:#C99742; color:#000; font-family:${DISPLAY}; font-weight:900; font-size:14px; letter-spacing:.14em; text-transform:uppercase; transition:background .2s; }
.cbl-edit .submit:hover:not(:disabled) { background:#DDB15F; }
.cbl-edit .submit:disabled { background:#555; cursor:not-allowed; }
.cbl-edit .note { font-size:12px; color:#8A8A8A; margin:10px 0 0; text-align:center; }
.cbl-edit .alert { border-radius:12px; padding:11px 14px; font-size:13px; margin:0 0 14px; background:rgba(220,60,60,.12); border:1px solid rgba(220,60,60,.4); color:#f0b3b3; }
`;

// Photo editor for a member's own paid listing. Opens after a boost payment (to
// add the photos they paid for) and is reachable again from the owner's own
// listing detail panel. Uploads to the directory-photos bucket, saves photos[].
function EditListingModal({
  listingId, onClose, onSaved,
}: { listingId: string | null; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<OwnListing | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    setErr("");
    getOwnListing(listingId).then((l) => {
      setListing(l);
      setPhotos(l?.photos ?? []);
      setLoading(false);
    });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [listingId]);

  if (!listingId) return null;

  const max = maxPhotosForTier(listing?.tier);
  const onFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setErr("");
    setUploading(true);
    const room = Math.max(0, max - photos.length);
    const added: string[] = [];
    for (const f of Array.from(files).slice(0, room)) {
      const { url, error } = await uploadListingPhoto(f, listingId);
      if (error) { setErr(error); break; }
      if (url) added.push(url);
    }
    if (added.length) setPhotos((p) => [...p, ...added]);
    setUploading(false);
  };
  const save = async () => {
    setSaving(true);
    setErr("");
    const { error } = await saveListingPhotos(listingId, photos);
    setSaving(false);
    if (error) { setErr(error); return; }
    onSaved();
    onClose();
  };

  return (
    <div className="cbl-edit" role="dialog" aria-modal="true" aria-label="Add photos to your listing">
      <style>{EDIT_CSS}</style>
      <div className="backdrop" onClick={onClose} />
      <div className="panel">
        <button className="close" aria-label="Close" onClick={onClose}>✕</button>
        {loading ? (
          <p className="sub" style={{ margin: "8px 0" }}>Loading your ad…</p>
        ) : !listing ? (
          <>
            <div className="eyebrow">your ad</div>
            <h2>Couldn&rsquo;t <span className="it">load it.</span></h2>
            <p className="sub">We couldn&rsquo;t open this listing to edit. Make sure you&rsquo;re signed in
              with the account that posted it — then try again from your listing.</p>
            <button type="button" className="submit" onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <div className="eyebrow">finish your ad{listing.tier ? ` · ${listing.tier}` : ""}</div>
            <h2>Add your <span className="it">photos.</span></h2>
            <p className="sub">
              &ldquo;{listing.title}&rdquo; — add up to {max} photo{max === 1 ? "" : "s"}. The first is
              your cover image, and they show on your ad the moment you save.
            </p>
            {err && <div className="alert" role="alert">{err}</div>}
            <div className="grid">
              {photos.map((url, i) => (
                <div className="thumb" key={url + i}>
                  <img src={url} alt={`Listing photo ${i + 1}`} />
                  {i === 0 && <span className="cover">Cover</span>}
                  <button type="button" className="rm" aria-label="Remove photo" onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}>✕</button>
                </div>
              ))}
              {photos.length < max && (
                <label className="add">
                  {uploading ? "Uploading…" : <><span style={{ fontSize: 20 }}>＋</span><span>Add photo</span></>}
                  <input type="file" accept="image/*" multiple disabled={uploading} onChange={(e) => onFiles(e.target.files)} />
                </label>
              )}
            </div>
            <button type="button" className="submit" disabled={saving || uploading} onClick={save}>
              {saving ? "Saving…" : photos.length ? "Save & publish photos" : "Save — done"}
            </button>
            <p className="note">You can add or change photos any time from your listing.</p>
          </>
        )}
      </div>
    </div>
  );
}

export function Directory() {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramSection = searchParams.get("section");
  const [section, setSection] = useState(
    paramSection && SECTIONS.some((s) => s.key === paramSection) ? paramSection : "CLASSIFIEDS",
  );
  // Follow the ?section= deep-link (from the header Directory dropdown).
  useEffect(() => {
    const p = searchParams.get("section");
    if (p && SECTIONS.some((s) => s.key === p)) setSection(p);
  }, [searchParams]);

  // Boost return handler: Stripe sends the buyer back to
  // /directory?boost=success&session_id=… — verify + apply the boost, banner it,
  // refresh listings, then strip the query so a refresh doesn't re-run it.
  const [boostBanner, setBoostBanner] = useState<{ ok: boolean; msg: string } | null>(null);
  // Auto-dismiss the banner so it never lingers as a stale "add your photos" nag.
  useEffect(() => {
    if (!boostBanner) return;
    const t = window.setTimeout(() => setBoostBanner(null), 9000);
    return () => window.clearTimeout(t);
  }, [boostBanner]);
  // Photo editor: which listing (if any) is open for adding photos.
  const [editId, setEditId] = useState<string | null>(null);
  // Current member's auth id — lets an owner reopen the photo editor on their listing.
  const [sessionUid, setSessionUid] = useState<string | null>(null);
  useEffect(() => {
    authClient.auth.getSession().then(({ data }) => setSessionUid(data.session?.user?.id ?? null));
  }, []);

  useEffect(() => {
    const boost = searchParams.get("boost");
    if (!boost) return;
    if (boost === "success") {
      const sid = searchParams.get("session_id");
      if (sid) {
        applyListingBoost(sid).then((r) => {
          if (r?.applied) {
            setBoostBanner({ ok: true, msg: "Payment received 🎉 Add your photos to finish your ad." });
            getDirectoryListings().then(setListings);
            // Open the photo editor on the just-boosted listing.
            const lid = r.listing?.id != null ? String(r.listing.id) : null;
            if (lid) setEditId(lid);
          } else {
            setBoostBanner({ ok: true, msg: "Payment received — your boost is being applied. You can add photos from your listing in a moment." });
          }
        });
      }
    } else if (boost === "cancelled") {
      setBoostBanner({ ok: false, msg: "Boost cancelled — no charge. Your listing is still posted, free." });
    }
    setSearchParams(
      (prev) => { prev.delete("boost"); prev.delete("session_id"); prev.delete("tier"); return prev; },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const { city, state, coords, setManualCity } = useVisitorLocation();
  // Scope choice (Keith): "metro" = the whole area (e.g. all of Pittsburgh), the
  // default so the view isn't empty; "local" = just the visitor's own town/suburb
  // (e.g. the North Hills). Only meaningful for the auto-detected home location —
  // a typed city search has no state, so both scopes behave the same (strict city).
  const [scope, setScope] = useState<"metro" | "local">("metro");
  const inPghMetro = (() => {
    const mi = milesFromPgh(coords);
    return mi != null && mi <= METRO_RADIUS_MI;
  })();
  const metroLabel = inPghMetro ? "Pittsburgh area" : state ? `${state} area` : "Wider area";

  const [partners, setPartners] = useState<Partner[]>([]);
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [postOpen, setPostOpen] = useState(false);
  const openPost = () => setPostOpen(true);
  // Driver posts get the dedicated card builder (member-gated) instead of the
  // generic classifieds form.
  const [driverAdOpen, setDriverAdOpen] = useState(false);
  const openDriverAd = () => setDriverAdOpen(true);
  // Editing an existing driver card (opened via /directory?editDriverAd=<id>,
  // e.g. from the CBL Studio "Edit" on a driver post).
  const [editDriverAd, setEditDriverAd] = useState<EditDriverListing | null>(null);
  const [modalL, setModalL] = useState<Listing | null>(null);
  // Re-pull member classifieds after a successful post so the new one appears.
  const refetchListings = () => getDirectoryListings().then(setListings);

  useEffect(() => {
    getActivePartners().then(setPartners);
    getDirectoryListings().then(setListings);
  }, []);

  // Deep-link from CBL Studio's "View" button: /directory?listing=<id> opens that
  // listing's detail panel once listings load (searches the raw set so the location
  // filter can't hide the owner's own listing). Strip the param so refresh won't reopen.
  const openedListingRef = useRef(false);
  useEffect(() => {
    const lid = searchParams.get("listing");
    if (!lid || openedListingRef.current || !listings.length) return;
    openedListingRef.current = true;
    const found = listings.find((l) => String(l.id) === lid);
    if (found) setModalL(listingToCard(found));
    setSearchParams((prev) => { prev.delete("listing"); return prev; }, { replace: true });
  }, [searchParams, listings, setSearchParams]);

  // Open the driver-ad builder in EDIT mode from /directory?editDriverAd=<id>
  // (the CBL Studio "Edit card" link on a driver post).
  const openedEditRef = useRef(false);
  useEffect(() => {
    const eid = searchParams.get("editDriverAd");
    if (!eid || openedEditRef.current || !listings.length) return;
    openedEditRef.current = true;
    const found = listings.find((l) => String(l.id) === eid);
    if (found) {
      setSection("DRIVERS");
      setEditDriverAd({
        id: String(found.id),
        title: found.title,
        city: found.city ?? null,
        state: found.state ?? null,
        driverAd: (found.driver_ad as DriverAd | null) ?? null,
      });
    }
    setSearchParams((prev) => { prev.delete("editDriverAd"); return prev; }, { replace: true });
  }, [searchParams, listings, setSearchParams]);


  // Resolve the SEARCHED place to coordinates for proximity matching — so a
  // suburb search ("North Hills PA") surfaces the metro's listings (Pittsburgh)
  // without the visitor having to type the exact city. Gazetteer resolves the
  // home market instantly/offline; unknown places fall back to keyless geocoding.
  const [searchCoords, setSearchCoords] = useState<Coords | null>(null);
  // Network-resolved coords for listing cities the gazetteer doesn't know,
  // keyed by lowercased city name (fills in async, re-renders when it lands).
  const [cityGeo, setCityGeo] = useState<Record<string, Coords>>({});
  useEffect(() => {
    if (!city) { setSearchCoords(null); return; }
    const q = state ? `${city}, ${state}` : city;
    const seed = seedCoords(q) ?? seedCoords(city);
    if (seed) { setSearchCoords(seed); return; }
    let cancelled = false;
    forwardGeocode(q).then((c) => { if (!cancelled) setSearchCoords(c); });
    return () => { cancelled = true; };
  }, [city, state]);

  // Coordinates for a listing: prefer its stored lat/lng, else the gazetteer,
  // else a previously network-resolved city (see the effect below).
  const listingCoords = (i: { city?: string | null; latitude?: number | null; longitude?: number | null }): Coords | null => {
    if (typeof i.latitude === "number" && typeof i.longitude === "number") return { lat: i.latitude, lng: i.longitude };
    const seed = seedCoords(i.city);
    if (seed) return seed;
    const key = (i.city ?? "").trim().toLowerCase();
    return key ? cityGeo[key] ?? null : null;
  };

  // Best-effort backfill: resolve any listing city the gazetteer doesn't know,
  // once, so proximity works for markets we haven't seeded by hand.
  useEffect(() => {
    const unknown = new Set<string>();
    for (const l of listings) {
      const key = (l.city ?? "").trim().toLowerCase();
      if (!key || seedCoords(l.city) || cityGeo[key]) continue;
      unknown.add(l.city!.trim());
    }
    if (!unknown.size) return;
    let cancelled = false;
    Promise.all([...unknown].slice(0, 8).map(async (name) => {
      const c = await forwardGeocode(name);
      return [name.toLowerCase(), c] as const;
    })).then((pairs) => {
      if (cancelled) return;
      const add: Record<string, Coords> = {};
      for (const [k, c] of pairs) if (c) add[k] = c;
      if (Object.keys(add).length) setCityGeo((prev) => ({ ...prev, ...add }));
    });
    return () => { cancelled = true; };
  }, [listings]); // eslint-disable-line react-hooks/exhaustive-deps

  // FILTER to the selected/detected location (not just sort) so a search actually
  // narrows results — "Ohio" shows Ohio listings only (empty here), not a
  // Pittsburgh shop floated down the list. A listing counts if:
  //   1. Its city name matches (forgiving contains-match, so "Pittsburgh" catches
  //      "Pittsburgh, PA").
  //   2. In "metro" scope (the default): it's within METRO_RADIUS_MI of the
  //      searched place — so a suburb search (North Hills) surfaces the whole
  //      metro (Pittsburgh) but a far city (Ohio) doesn't. "Just {city}" (local
  //      scope) drops proximity for an exact-town view.
  //   3. In "metro" scope: same state as the auto-detected visitor (coarse
  //      fallback when neither side has resolvable coordinates).
  // No city set yet → show everything.
  const filterByLocation = <T extends { city?: string | null; state?: string | null; latitude?: number | null; longitude?: number | null; driver_ad?: { radius?: number | null } | null }>(items: T[]) => {
    if (!city) return items;
    const c = city.trim().toLowerCase();
    const s = (state ?? "").trim().toLowerCase();
    return items.filter((i) => {
      const ic = (i.city ?? "").trim().toLowerCase();
      if (ic && (ic === c || ic.includes(c) || c.includes(ic))) return true;
      if (scope !== "metro") return false;
      const lc = listingCoords(i);
      // Driver ads reach as far as the driver set (default 100mi); other
      // listings use the metro radius (45mi).
      const radius = i.driver_ad ? (Number(i.driver_ad.radius) || DEFAULT_DRIVER_RADIUS_MI) : METRO_RADIUS_MI;
      if (searchCoords && lc && milesBetween(searchCoords, lc) <= radius) return true;
      const is = (i.state ?? "").trim().toLowerCase();
      return !!s && !!is && is === s;
    });
  };

  const classifiedsLive = useMemo(() => {
    // Classifieds excludes ride/driver posts — those show in their own sections.
    const base = listings.filter((l) => l.category !== "ride_request" && l.category !== "driver_post");
    const slug = CLASSIFIEDS_CHIP_TO_SLUG[cat];
    const filtered = slug ? base.filter((l) => l.category === slug) : base;
    return filterByLocation(filtered).map(listingToCard);
  }, [listings, cat, city, state, scope, searchCoords, cityGeo]);

  // Driver Posts + Rider Requests are just public classified-style posts, filtered
  // by category — the same simple post flow, no special form.
  const driversLive = useMemo(
    () => filterByLocation(listings.filter((l) => l.category === "driver_post")).map(listingToCard),
    [listings, city, state, scope, searchCoords, cityGeo],
  );
  const ridersLive = useMemo(
    () => filterByLocation(listings.filter((l) => l.category === "ride_request")).map(listingToCard),
    [listings, city, state, scope, searchCoords, cityGeo],
  );

  const shopCategory = SHOP_CATEGORIES.find((c) => c.k === cat) ?? SHOP_CATEGORIES[0];
  // Cuisine only ever refines "Restaurants" — reset it whenever the visitor
  // picks a different top-level category (or leaves Shopping) so a stale
  // "Pizza" pick can't silently apply once they're looking at, say, Auto.
  const [shopCuisine, setShopCuisine] = useState("ALL");
  useEffect(() => {
    setShopCuisine("ALL");
  }, [cat, section]);
  const shopQueryDef: PlacesDef =
    cat === "RESTAURANTS" && shopCuisine !== "ALL"
      ? (RESTAURANT_CUISINES.find((c) => c.k === shopCuisine) ?? RESTAURANT_CUISINES[0])
      : shopCategory;
  const shopResultLabel = shopQueryDef === shopCategory ? shopCategory.l : `${shopQueryDef.l} (Restaurants)`;

  const shopPartnersLive = useMemo(() => {
    let inCategory = cat === "ALL" ? partners : partners.filter((p) => matchesShopCategory(p, cat));
    if (cat === "RESTAURANTS" && shopCuisine !== "ALL") {
      inCategory = inCategory.filter((p) => matchesCuisine(p, shopCuisine));
    }
    return filterByLocation(inCategory);
  }, [partners, cat, shopCuisine, city, state, scope, searchCoords, cityGeo]);

  // We rarely have 6 real partners yet in any given category/location, so
  // backfill the rest of the row with live, top-rated real businesses nearby
  // (Google Places) — same source EatsAndDrinks.tsx uses for restaurants.
  const liveShopPlaces = useLiveShopPlaces(searchCoords ?? coords, section === "SHOP", shopQueryDef);
  const shopPartnerCards = useMemo(() => shopPartnersLive.map(partnerToCard), [shopPartnersLive]);
  const shopLive = useMemo(() => {
    const need = Math.max(0, 6 - shopPartnerCards.length);
    const liveCards = need > 0 && liveShopPlaces
      ? liveShopPlaces.slice(0, need).map((p) => placeToCard(p, shopResultLabel))
      : [];
    return [...shopPartnerCards, ...liveCards];
  }, [shopPartnerCards, liveShopPlaces, shopResultLabel]);
  const shopShowingLiveOnly = shopPartnerCards.length === 0 && shopLive.length > 0;

  return (
    <DirModalCtx.Provider value={setModalL}>
    <main className="cbl-dir">
      <style>{DIR_CSS}</style>

      {boostBanner && (
        <div
          role="status"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
            padding: "12px 18px", textAlign: "center", fontSize: 14, fontWeight: 600,
            background: boostBanner.ok ? "rgba(77,191,102,.12)" : "rgba(201,151,66,.12)",
            borderBottom: `1px solid ${boostBanner.ok ? "rgba(77,191,102,.4)" : "rgba(201,151,66,.4)"}`,
            color: boostBanner.ok ? "#8FE0A2" : "#E6C588",
          }}
        >
          <span>{boostBanner.msg}</span>
          <button
            type="button"
            onClick={() => setBoostBanner(null)}
            aria-label="Dismiss"
            style={{ background: "none", border: 0, color: "inherit", fontSize: 18, cursor: "pointer", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
      )}

      <Hero onPost={openPost} signedIn={!!sessionUid} />
      <LocationBar
        city={city}
        onChangeCity={setManualCity}
        scope={scope}
        onScope={setScope}
        metroLabel={metroLabel}
        showScope={!!state}
      />
      <Filters section={section} setSection={setSection} cat={cat} setCat={setCat} />

      {section === "CLASSIFIEDS" && (
        <>
          <section className="band">
            <div className="band-inner">
              <SectionHead section="CLASSIFIEDS" onPost={openPost} />
              {classifiedsLive.length === 0 ? (
                <EmptyState city={city} onPost={openPost} ctaLabel="Post a Listing" />
              ) : (
                <div className="listings-grid">
                  {classifiedsLive.map((l) => <ClassifiedCard key={l.id} l={l} />)}
                </div>
              )}
            </div>
          </section>
          <CompareBand onPost={openPost} />
          <Pricing onPost={openPost} />
        </>
      )}

      {section === "DRIVERS" && (
        <>
          <section className="band">
            <div className="band-inner">
              <SectionHead section="DRIVERS" onPost={openDriverAd} />
              {driversLive.length === 0 ? (
                <EmptyState city={city} onPost={openDriverAd} ctaLabel="Post an Ad" />
              ) : (
                <div className="listings-grid">
                  {driversLive.map((l) => <DriverPreviewCard key={l.id} l={l} />)}
                </div>
              )}
            </div>
          </section>
          <DriverDisclaimer />
        </>
      )}

      {section === "RIDERS" && (
        <>
          <section className="band">
            <div className="band-inner">
              <SectionHead section="RIDERS" onPost={openPost} />
              {ridersLive.length === 0 ? (
                <EmptyState city={city} onPost={openPost} ctaLabel="Post a Request" />
              ) : (
                <div className="listings-grid">
                  {ridersLive.map((l) => <ClassifiedCard key={l.id} l={l} />)}
                </div>
              )}
            </div>
          </section>
          <PlatformNotice variant="rides" />
        </>
      )}

      {section === "SHOP" && (
        <section className="band">
          <div className="band-inner">
            <SectionHead section="SHOPPING" onPost={openPost} />
            {cat === "RESTAURANTS" && (
              <ScrollRow className="chip-row">
                {RESTAURANT_CUISINES.map((c) => (
                  <button
                    key={c.k}
                    className={"chip" + (shopCuisine === c.k ? " active" : "")}
                    onClick={() => setShopCuisine(c.k)}
                  >
                    {c.l}
                  </button>
                ))}
              </ScrollRow>
            )}
            {shopShowingLiveOnly && (
              <p style={{ color: "#999", fontSize: 13, marginBottom: 16 }}>
                No CBL partners in {shopResultLabel.toLowerCase()} near {city ?? "you"} yet — here are the
                top-rated real spots nearby.
              </p>
            )}
            {shopLive.length === 0 ? (
              <EmptyState city={city} onPost={openPost} ctaLabel="List Your Shop" />
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
              title="Affiliate Coupons — Coming Soon"
              blurb="Coupons and deals from local affiliates and partners — free for everyone to browse. (Posting an offer requires a partner account.) Coming soon."
            />
            <CompareBand onPost={openPost} />
          </div>
        </section>
      )}

      <ConductDisclaimer />

      <Newsletter />

      <PostListingModal
        open={postOpen}
        onClose={() => setPostOpen(false)}
        defaultCity={city}
        defaultState={state}
        onPosted={refetchListings}
      />
      <DriverAdModal
        open={driverAdOpen || !!editDriverAd}
        onClose={() => { setDriverAdOpen(false); setEditDriverAd(null); }}
        defaultCity={city}
        defaultState={state}
        onPosted={refetchListings}
        onBasicPost={() => setPostOpen(true)}
        editListing={editDriverAd}
      />
      <DirListingModal
        l={modalL}
        onClose={() => setModalL(null)}
        canEditPhotos={
          !!modalL && !!sessionUid && modalL.ownerId === sessionUid && maxPhotosForTier(modalL.tier) > 0
        }
        onEditPhotos={() => {
          const id = modalL?.id;
          setModalL(null);
          if (id != null) setEditId(String(id));
        }}
        onCustomizeDriverAd={
          !!modalL && !!modalL.driverCode && !!sessionUid && modalL.ownerId === sessionUid
            ? () => {
                const id = String(modalL.id);
                const raw = listings.find((x) => String(x.id) === id);
                setModalL(null);
                setSection("DRIVERS");
                setEditDriverAd({
                  id,
                  title: raw?.title ?? modalL.name,
                  city: raw?.city ?? null,
                  state: raw?.state ?? null,
                  driverAd: (raw?.driver_ad as DriverAd | null) ?? modalL.driverAd ?? null,
                });
              }
            : undefined
        }
      />
      <EditListingModal
        listingId={editId}
        onClose={() => setEditId(null)}
        onSaved={() => {
          refetchListings();
          setBoostBanner({ ok: true, msg: "Photos added 🎉 Your ad is live and looking sharp." });
        }}
      />
    </main>
    </DirModalCtx.Provider>
  );
}
