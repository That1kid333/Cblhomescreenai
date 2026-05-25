import { useState, type ReactNode } from "react";

/**
 * Blog — ported from the approved "CBL Blog Desktop" design
 * (Claude Design · CBL Website 2026 project, May 2026 — updated rev).
 *
 * Re-skinned to match the other Explore pages (Our Story / Eats & Drinks /
 * Transportation / Travels / Attractions / Directory): dark canvas, gold
 * (#C99742) accents, Barlow Condensed / Myriad Pro display, Playfair Display
 * italic accents, mono eyebrow labels, CBL diagonal-corner cards.
 *
 * Nav + footer come from the shared Layout (same as OurStory), so this
 * component renders the page body only. All CSS is scoped under `.cbl-blog`.
 *
 * Updated rev: new category set (Transportation / Good Eats / Places to Stay /
 * Flight Deals / Arts & Culture / Behind the Brand), city-locator + tag chips
 * removed, refreshed post set, section reads "Latest stories from the CBL network".
 */

const DISPLAY = "'Barlow Condensed','Myriad Pro',sans-serif";
const ITALIC = "'Playfair Display',serif";
const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
const MAP_BG = "/eats/imagery/cbl-map-backdrop.jpg";

type CatDef = { key: string; label: string; Icon: (p: { s?: number }) => JSX.Element };
type Post = {
  id: number;
  cat: string;
  title: string;
  excerpt: string;
  author: string;
  avatar: string;
  date: string;
  read: string;
  img: string;
  tag?: string;
  featured?: boolean;
};

const BLOG_CSS = `
.cbl-blog { background:#0A0A0A; color:#fff; font-family:Inter,system-ui,sans-serif; -webkit-font-smoothing:antialiased; min-height:100vh; }
.cbl-blog *,.cbl-blog *::before,.cbl-blog *::after { box-sizing:border-box; margin:0; padding:0; }
.cbl-blog a { color:inherit; text-decoration:none; }
.cbl-blog button { font-family:inherit; cursor:pointer; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

/* Hero band */
.cbl-blog .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 16px;
}
.cbl-blog .hero-inner { display:grid; grid-template-columns:1fr; gap:0; align-items:start; max-width:1280px; margin:0 auto; }
.cbl-blog .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em; color:#8a8a8a;
  text-transform:lowercase; margin-bottom:10px;
}
.cbl-blog .eyebrow::before { content:''; width:8px; height:8px; border-radius:50%; background:#C99742; animation:cbl-pulse 2.4s ease-in-out infinite; }
.cbl-blog h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(64px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-blog h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-blog h1.hero-title .h1-main { color:#fff; white-space:nowrap; position:relative; }
.cbl-blog .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:#fff;
}
.cbl-blog .hero-subtitle .it { font-family:${ITALIC}; font-style:italic; font-weight:600; color:#C99742; text-transform:none; letter-spacing:0; font-size:.82em; }
.cbl-blog h1.hero-title .blog-icon { flex-shrink:0; width:220px; height:180px; display:flex; align-items:center; justify-content:center; opacity:.92; }
.cbl-blog h1.hero-title .blog-icon svg { width:100%; height:100%; }
.cbl-blog .hero p.lede { margin-top:-6px; max-width:620px; font-size:16px; line-height:1.45; color:#B8B8B8; }

/* Filter rail */
.cbl-blog .filters {
  position:sticky; top:0; z-index:20;
  background:rgba(10,10,10,.94); backdrop-filter:blur(14px); -webkit-backdrop-filter:blur(14px);
  border-bottom:1px solid rgba(255,255,255,.06); padding:8px 48px 0;
}
.cbl-blog .filters-inner { max-width:1280px; margin:0 auto; }
.cbl-blog .cat-row { display:flex; gap:6px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,.06); overflow-x:auto; scrollbar-width:none; }
.cbl-blog .cat-row::-webkit-scrollbar { display:none; }
.cbl-blog .cat-btn {
  flex-shrink:0; background:transparent; border:0; color:#888; padding:6px 22px 10px;
  display:flex; flex-direction:column; align-items:center; gap:6px;
  font-family:${DISPLAY}; font-weight:900; font-size:17px; letter-spacing:.14em;
  text-transform:uppercase; transition:color .2s; border-bottom:3px solid transparent; margin-bottom:-1px;
}
.cbl-blog .cat-btn .ic { width:38px; height:38px; color:#fff; opacity:.9; transition:opacity .2s,color .2s; display:flex; align-items:center; justify-content:center; }
.cbl-blog .cat-btn:hover { color:#B8B8B8; }
.cbl-blog .cat-btn:hover .ic { opacity:1; }
.cbl-blog .cat-btn.active { color:#B8B8B8; border-bottom-color:#C99742; }
.cbl-blog .cat-btn.active .ic { opacity:1; color:#fff; }

/* Section frame */
.cbl-blog section.band { padding:36px 48px 56px; }
.cbl-blog section.band.tight { padding:28px 48px 36px; }
.cbl-blog .band-inner { max-width:1280px; margin:0 auto; }
.cbl-blog .section-eyebrow { font-family:${MONO}; font-size:12px; color:#C99742; letter-spacing:.18em; text-transform:uppercase; display:inline-flex; align-items:center; gap:10px; margin-bottom:12px; }
.cbl-blog .section-eyebrow::before { content:''; width:28px; height:1px; background:#C99742; }
.cbl-blog .section-h2 { font-family:${DISPLAY}; font-weight:900; font-size:clamp(40px,4.6vw,64px); line-height:.95; letter-spacing:-.01em; text-transform:uppercase; margin-bottom:8px; }
.cbl-blog .section-h2 .it { font-family:${ITALIC}; font-style:italic; color:#C99742; font-weight:600; text-transform:none; font-size:.6em; margin-left:8px; }
.cbl-blog .section-head { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:24px; gap:24px; flex-wrap:wrap; }
.cbl-blog .section-head .count { font-family:${MONO}; font-size:11px; letter-spacing:.14em; color:#8a8a8a; text-transform:uppercase; }
.cbl-blog .section-head .count b { color:#C99742; }

/* Featured spotlight */
.cbl-blog .spotlight { display:grid; grid-template-columns:1.1fr 1fr; background:linear-gradient(135deg,#141414,#0c0c0c); border:1px solid rgba(201,151,66,.25); border-radius:24px 0 24px 0; overflow:hidden; margin-bottom:24px; }
.cbl-blog .spotlight .shot { min-height:320px; position:relative; background-size:cover; background-position:center; }
.cbl-blog .spotlight .shot::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(10,10,10,0) 40%,rgba(10,10,10,.65)); }
.cbl-blog .spotlight .shot .cat-pill { position:absolute; top:20px; left:20px; z-index:2; font-family:${MONO}; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:#C99742; background:rgba(0,0,0,.7); padding:6px 12px; border-radius:4px; border:1px solid rgba(201,151,66,.5); backdrop-filter:blur(6px); }
.cbl-blog .spotlight .text { padding:32px 38px; display:flex; flex-direction:column; gap:14px; }
.cbl-blog .spotlight .kicker { display:inline-flex; align-items:center; gap:10px; font-family:${MONO}; font-size:11px; color:#C99742; letter-spacing:.18em; text-transform:uppercase; }
.cbl-blog .spotlight .kicker::before { content:''; width:22px; height:1px; background:#C99742; }
.cbl-blog .spotlight h3 { font-family:${DISPLAY}; font-weight:900; font-size:48px; line-height:.95; letter-spacing:-.01em; text-transform:uppercase; }
.cbl-blog .spotlight h3 .it { font-family:${ITALIC}; font-style:italic; color:#C99742; font-weight:600; text-transform:none; font-size:.55em; display:block; margin-top:4px; }
.cbl-blog .spotlight p { color:#B8B8B8; font-size:15px; line-height:1.6; max-width:58ch; }
.cbl-blog .spotlight .byline { display:flex; align-items:center; gap:12px; margin-top:4px; flex-wrap:wrap; }
.cbl-blog .spotlight .byline .avatar { width:36px; height:36px; border-radius:50%; background-size:cover; background-position:center; border:1.5px solid #C99742; flex-shrink:0; }
.cbl-blog .spotlight .byline .author { font-family:${DISPLAY}; font-weight:900; font-size:15px; text-transform:uppercase; letter-spacing:.04em; }
.cbl-blog .spotlight .byline .meta { font-family:${MONO}; font-size:10px; color:#888; letter-spacing:.12em; text-transform:uppercase; }
.cbl-blog .spotlight .actions { display:flex; gap:12px; margin-top:8px; }
.cbl-blog .spotlight .cta { background:#C99742; border:0; color:#000; padding:14px 24px; border-radius:999px; font-family:${DISPLAY}; font-weight:800; font-size:13px; letter-spacing:.12em; text-transform:uppercase; }
.cbl-blog .spotlight .cta:hover { background:#DDB15F; }
.cbl-blog .spotlight .cta.ghost { background:transparent; color:#fff; border:1px solid rgba(255,255,255,.18); }
.cbl-blog .spotlight .cta.ghost:hover { border-color:#C99742; color:#C99742; }

/* Blog cards grid */
.cbl-blog .posts-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.cbl-blog .post { background:#141414; border:1px solid rgba(255,255,255,.08); border-radius:18px 0 18px 0; overflow:hidden; display:flex; flex-direction:column; transition:transform .35s,border-color .35s; animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both; }
.cbl-blog .post:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.45); }
.cbl-blog .post .img { aspect-ratio:5/3.4; background-size:cover; background-position:center; position:relative; }
.cbl-blog .post .img::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(10,10,10,0) 40%,rgba(10,10,10,.55)); }
.cbl-blog .post .cat-pill { position:absolute; top:14px; left:14px; font-family:${MONO}; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#C99742; background:rgba(0,0,0,.65); padding:5px 10px; border-radius:4px; border:1px solid rgba(201,151,66,.4); backdrop-filter:blur(6px); z-index:2; }
.cbl-blog .post .read-time { position:absolute; top:14px; right:14px; font-family:${MONO}; font-size:10px; letter-spacing:.12em; color:#fff; background:rgba(0,0,0,.6); padding:5px 8px; border-radius:4px; border:1px solid rgba(255,255,255,.15); backdrop-filter:blur(6px); z-index:2; }
.cbl-blog .post .body { padding:20px 22px; display:flex; flex-direction:column; gap:8px; flex:1; }
.cbl-blog .post h3 { font-family:${DISPLAY}; font-weight:900; font-size:24px; line-height:1.05; letter-spacing:-.005em; text-transform:uppercase; }
.cbl-blog .post .excerpt { font-size:13.5px; line-height:1.55; color:#A8A8A8; flex:1; }
.cbl-blog .post .byline { display:flex; align-items:center; gap:10px; padding-top:12px; margin-top:auto; border-top:1px solid rgba(255,255,255,.06); }
.cbl-blog .post .byline .avatar { width:28px; height:28px; border-radius:50%; background-size:cover; background-position:center; border:1.5px solid rgba(201,151,66,.5); flex-shrink:0; }
.cbl-blog .post .byline .meta { flex:1; display:flex; flex-direction:column; }
.cbl-blog .post .byline .author { font-family:${DISPLAY}; font-weight:800; font-size:13px; text-transform:uppercase; letter-spacing:.04em; line-height:1; }
.cbl-blog .post .byline .date { font-family:${MONO}; font-size:10px; color:#888; letter-spacing:.12em; text-transform:uppercase; margin-top:3px; }
.cbl-blog .post .byline .arrow { color:#C99742; font-family:${DISPLAY}; font-weight:900; font-size:22px; line-height:1; }

/* Newsletter strip */
.cbl-blog .news-band { background: radial-gradient(ellipse at top right, rgba(201,151,66,.12), transparent 60%), linear-gradient(180deg,#0A0A0A 0%,#0F0F0F 100%); border-top:1px solid rgba(255,255,255,.06); border-bottom:1px solid rgba(255,255,255,.06); }
.cbl-blog .news-grid { display:grid; grid-template-columns:1.2fr 1fr; gap:56px; align-items:center; }
.cbl-blog .news-form { display:flex; gap:10px; max-width:460px; }
.cbl-blog .news-form input { flex:1; background:#141414; border:1px solid rgba(255,255,255,.10); border-radius:999px; padding:14px 20px; font-family:Inter,sans-serif; font-size:15px; color:#fff; outline:0; }
.cbl-blog .news-form input::placeholder { color:#555; }
.cbl-blog .news-form input:focus { border-color:#C99742; }
.cbl-blog .news-form button { background:#C99742; color:#000; border:0; padding:14px 28px; border-radius:999px; font-family:${DISPLAY}; font-weight:900; font-size:14px; letter-spacing:.14em; text-transform:uppercase; }
.cbl-blog .news-form button:hover { background:#DDB15F; }

/* Responsive */
@media (max-width:1100px) {
  .cbl-blog .hero { padding:22px 24px 16px; }
  .cbl-blog section.band { padding:36px 24px 48px; }
  .cbl-blog h1.hero-title .blog-icon { width:160px; height:130px; }
  .cbl-blog .posts-grid { grid-template-columns:repeat(2,1fr); }
  .cbl-blog .spotlight { grid-template-columns:1fr; }
  .cbl-blog .spotlight .shot { aspect-ratio:16/9; min-height:0; }
  .cbl-blog .news-grid { grid-template-columns:1fr; gap:24px; }
}
@media (max-width:720px) {
  .cbl-blog h1.hero-title .blog-icon { width:110px; height:90px; }
  .cbl-blog .posts-grid { grid-template-columns:1fr; }
}
`;

/* ── Brand icons (from /lib/icons, viewBox 288×227.01, stroke-based) ── */
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

const IconBlog = ({ s }: { s?: number }) => (
  <BrandIcon
    s={s}
    paths={
      <>
        <path d="M146.81,169.65c15.66,8.83,41.52,11.54,58.01,3.58,21.73,8.83,47.18,20.37,47.18,20.37l-17.3-34.63s22.84-8.16,18.09-39.58c0,0-4.07-23.61-27.16-29.46" />
        <path d="M45.35,183.91l17.3-34.63s-29.88-24.77-25.13-56.19c4.75-31.42,42.78-59.26,91.68-59.26s96.43,27.16,96.43,63.84-38.71,84.21-133.1,65.87c-21.73,8.83-47.18,20.37-47.18,20.37Z" />
        <circle cx="95.83" cy="99.4" r="9.47" fill="currentColor" stroke="none" />
        <circle cx="137.35" cy="99.4" r="9.47" fill="currentColor" stroke="none" />
        <circle cx="178.87" cy="99.4" r="9.47" fill="currentColor" stroke="none" />
      </>
    }
  />
);

const IconStays = ({ s }: { s?: number }) => (
  <BrandIcon
    s={s}
    paths={
      <>
        <rect x="47.43" y="115.99" width="193.15" height="74.01" />
        <line x1="47.43" y1="169.51" x2="240.57" y2="169.51" />
        <path d="M58.39,112.96v-45.6c0-17.4,27.37-25.75,85.61-25.75" />
        <path d="M229.61,112.96s0-28.2,0-45.6c0-17.4-27.37-25.75-85.61-25.75" />
        <line x1="58.39" y1="190" x2="58.39" y2="204.05" />
        <line x1="229.61" y1="190" x2="229.61" y2="204.05" />
        <path d="M83.44,115.99v-29.64c0-3.94,3.23-7.17,7.17-7.17h44.11c3.94,0,7.17,3.23,7.17,7.17v29.64" />
        <path d="M142.27,115.99v-29.38c0-4.08,3.34-7.42,7.42-7.42h47.78c4.08,0,7.42,3.34,7.42,7.42v29.38" />
      </>
    }
  />
);

const IconEats = ({ s }: { s?: number }) => (
  <BrandIcon
    s={s}
    paths={
      <>
        <path d="M125.23,129.43l-13-13-5.03,5.02c-3.43,3.43-9.09,3.35-12.63-.2l-40.55-40.55c-14.56-14.56-14.92-37.8-.81-51.91h0s73.32,73.32,73.32,73.32l15.17,15.17" />
        <path d="M156.6,132.18l50.43,50.43c4.08,4.08,4.18,10.58.23,14.53-3.95,3.95-10.46,3.85-14.53-.23l-51.01-51.01" />
        <path d="M245.13,63.97l-50.59,50.59c-5.93,5.93-15.54,5.93-21.46,0l-88.44,88.44c-3.81,3.81-9.99,3.81-13.8,0h0c-3.81-3.81-3.81-9.99,0-13.8l88.44-88.44c-5.93-5.93-5.93-15.54,0-21.46l50.59-50.59" />
        <line x1="221.36" y1="40.21" x2="179.37" y2="82.2" />
        <line x1="233.2" y1="52.04" x2="191.21" y2="94.03" />
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
        <path d="M65.43,90.76s-5.61-4.85-14.17-6.07c-8.56-1.23-14.41-.33-15.46,2.94-1.27,3.97-6.98,12.74,7.38,13.23" />
        <path d="M145.89,57.11s-49.54-.65-59.55,4.11c-8.76,4.17-18.6,24.53-20.91,29.54" />
        <path d="M110.99,134.64s-12.2-.65-28.8-1.3c-16.6-.65-13.42-11.26-13.42-11.26" />
        <path d="M110.99,152.62h69.8" />
        <path d="M64.93,91.59s3.11,4.94,14.34,4.94h66.01" />
        <path d="M222.56,90.76l13.2,21.57c2.58,4.17,3.66,8.95,3.11,13.68l-5.26,45.23h-89.57" />
        <path d="M222.56,90.76s5.61-4.85,14.17-6.07c8.56-1.23,14.41-.33,15.46,2.94,1.27,3.97,6.98,12.74-7.38,13.23" />
        <path d="M142.11,57.11s49.54-.65,59.55,4.11c8.76,4.17,18.6,24.53,20.91,29.54" />
        <path d="M177,134.64s12.2-.65,28.8-1.3c16.6-.65,13.42-11.26,13.42-11.26" />
        <path d="M177,152.62h-69.8" />
        <path d="M223.07,91.59s-3.11,4.94-14.34,4.94h-66.01" />
      </>
    }
  />
);

const IconAttractions = ({ s }: { s?: number }) => (
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

const CATS: CatDef[] = [
  { key: "ALL", label: "All Posts", Icon: IconBlog },
  { key: "TRANSPO", label: "Transportation", Icon: IconTransport },
  { key: "EATS", label: "Good Eats", Icon: IconEats },
  { key: "STAYS", label: "Places to Stay", Icon: IconStays },
  { key: "FLIGHTS", label: "Flight Deals", Icon: IconStays },
  { key: "CULTURE", label: "Arts & Culture", Icon: IconDirectory },
  { key: "BEHIND", label: "Behind the Brand", Icon: IconBlog },
];

const POSTS: Post[] = [
  {
    id: 1, cat: "TRANSPO",
    title: "Meet Brian: 847 Rides and Counting",
    excerpt: "How a former rideshare driver built a 5-figure side business booking the same regulars every week. The story of one of CBL's top earning Independent Drivers.",
    author: "CBL Team", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces",
    date: "May 20, 2026", read: "6 min read",
    img: "https://images.unsplash.com/photo-1542282088-fe8426682b8f?w=900&h=600&fit=crop",
    featured: true,
  },
  {
    id: 2, cat: "EATS",
    title: "12 Restaurants Worth the Drive",
    excerpt: "Hidden patios, neighborhood institutions, and the kind of plates locals tell their friends about. Our team's favorite tables across the network.",
    author: "CBL Team", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=faces",
    date: "May 19, 2026", read: "7 min read",
    img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&h=600&fit=crop",
  },
  {
    id: 3, cat: "FLIGHTS",
    title: "This Week's Best Flight Deals — Under $250 Round-Trip",
    excerpt: "Six destinations under $250 RT this week, plus the Kayak + Booking.com bundles that beat the airline direct rate. Member-rate fares included.",
    author: "CBL Team", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces",
    date: "May 18, 2026", read: "4 min read",
    img: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=900&h=600&fit=crop",
  },
  {
    id: 4, cat: "STAYS",
    title: "5 Boutique Hotels Built for a Long Weekend",
    excerpt: "A castle in Banff, a Brooklyn modernist tower, an Adirondack cottage. Hand-picked stays with one thing in common — they're worth the trip.",
    author: "CBL Team", avatar: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=200&h=200&fit=crop",
    date: "May 16, 2026", read: "6 min read",
    img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&h=600&fit=crop",
  },
  {
    id: 5, cat: "TRANSPO",
    title: "Same Driver Every Wednesday: A Rider's Story",
    excerpt: "Keith books the same Independent Driver for his weekly trip to dialysis. What it's like when your rideshare actually knows your name.",
    author: "CBL Team", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
    date: "May 14, 2026", read: "5 min read",
    img: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=900&h=600&fit=crop",
  },
  {
    id: 6, cat: "CULTURE",
    title: "Galleries Worth Your Weekend",
    excerpt: "Zynka, James, Warhol, Mattress Factory — a Saturday-afternoon itinerary that hits the openings, then the after-parties. Ride pre-booked.",
    author: "CBL Team", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=faces",
    date: "May 12, 2026", read: "5 min read",
    img: "https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=900&h=600&fit=crop",
  },
  {
    id: 7, cat: "TRANSPO",
    title: "How Drivers Build a Book of Regulars",
    excerpt: "Three Independent Drivers on how they turned one-off rides into weekly recurring fares — and 5-figure monthly earnings.",
    author: "CBL Team", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
    date: "May 10, 2026", read: "5 min read",
    img: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=900&h=600&fit=crop",
  },
  {
    id: 8, cat: "STAYS",
    title: "Short-Term Rentals That Actually Feel Like Home",
    excerpt: "Strip District lofts, Hudson Valley farmhouses, Asheville A-frames. The picks our team books when work brings them out of town.",
    author: "CBL Team", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
    date: "May 8, 2026", read: "6 min read",
    img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=900&h=600&fit=crop",
  },
  {
    id: 9, cat: "BEHIND",
    title: "Why We Added Uber, Lyft, and Waymo to CBL",
    excerpt: "100% coverage, zero rider cost. The affiliate routing layer that complements — not competes with — our Independent Drivers.",
    author: "Keith M.", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=faces",
    date: "May 4, 2026", read: "5 min read",
    img: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=900&h=600&fit=crop",
  },
];

function BlogIconHero() {
  return (
    <span className="blog-icon" aria-hidden="true">
      <svg viewBox="0 0 288 227.01" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M146.81,169.65c15.66,8.83,41.52,11.54,58.01,3.58,21.73,8.83,47.18,20.37,47.18,20.37l-17.3-34.63s22.84-8.16,18.09-39.58c0,0-4.07-23.61-27.16-29.46" />
        <path d="M45.35,183.91l17.3-34.63s-29.88-24.77-25.13-56.19c4.75-31.42,42.78-59.26,91.68-59.26s96.43,27.16,96.43,63.84-38.71,84.21-133.1,65.87c-21.73,8.83-47.18,20.37-47.18,20.37Z" />
        <circle cx="95.83" cy="99.4" r="9.47" fill="#fff" stroke="none" />
        <circle cx="137.35" cy="99.4" r="9.47" fill="#fff" stroke="none" />
        <circle cx="178.87" cy="99.4" r="9.47" fill="#fff" stroke="none" />
      </svg>
    </span>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="eyebrow">stories · interviews · the local scene</div>
        <h1 className="hero-title">
          <span className="title-stack">
            <span className="h1-main">Blog<span style={{ color: "#C99742" }}>.</span></span>
            <span className="hero-subtitle">
              <span>Field notes</span>
              <span className="it">from your city.</span>
            </span>
          </span>
          <BlogIconHero />
        </h1>
        <p className="lede">
          Driver stories, rider stories, and the playbook behind the
          platform. Built for the people in the cars and the people in
          the back seats. New posts weekly.
        </p>
      </div>
    </section>
  );
}

function Filters({ cat, setCat }: { cat: string; setCat: (v: string) => void }) {
  return (
    <div className="filters">
      <div className="filters-inner">
        <div className="cat-row" style={{ borderBottom: 0, paddingBottom: 12 }}>
          {CATS.map((c) => (
            <button
              key={c.key}
              className={"cat-btn" + (cat === c.key ? " active" : "")}
              onClick={() => setCat(c.key)}
            >
              <span className="ic"><c.Icon s={32} /></span>
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Spotlight({ p }: { p: Post }) {
  return (
    <div className="spotlight">
      <div className="shot" style={{ backgroundImage: `url(${p.img})` }}>
        <span className="cat-pill">{p.cat === "CITY" ? "Local Scene" : p.cat}</span>
      </div>
      <div className="text">
        <div className="kicker">CBL Featured{p.tag ? ` · ${p.tag}` : ""}</div>
        <h3>{p.title}</h3>
        <p>{p.excerpt}</p>
        <div className="byline">
          <div className="avatar" style={{ backgroundImage: `url(${p.avatar})` }} />
          <div>
            <div className="author">{p.author}</div>
            <div className="meta">{p.date} · {p.read}</div>
          </div>
        </div>
        <div className="actions">
          <button className="cta">Read the Story →</button>
          <button className="cta ghost">Share</button>
        </div>
      </div>
    </div>
  );
}

function PostCard({ p }: { p: Post }) {
  return (
    <article className="post">
      <div className="img" style={{ backgroundImage: `url(${p.img})` }}>
        <span className="cat-pill">{p.cat === "CITY" ? "Local Scene" : p.cat}</span>
        <span className="read-time">{p.read}</span>
      </div>
      <div className="body">
        <h3>{p.title}</h3>
        <p className="excerpt">{p.excerpt}</p>
        <div className="byline">
          <div className="avatar" style={{ backgroundImage: `url(${p.avatar})` }} />
          <div className="meta">
            <span className="author">{p.author}</span>
            <span className="date">{p.date}</span>
          </div>
          <span className="arrow">›</span>
        </div>
      </div>
    </article>
  );
}

function Newsletter() {
  return (
    <section className="band tight news-band">
      <div className="band-inner">
        <div className="news-grid">
          <div>
            <div className="section-eyebrow">weekly · the cbl dispatch</div>
            <h2 className="section-h2">
              One email a week <span className="it">that's worth opening</span>
            </h2>
            <p style={{ color: "#B0B0B0", fontSize: 15, lineHeight: 1.55, maxWidth: "52ch", marginBottom: 20 }}>
              Top picks for the week, member-only deals, and the occasional
              dispatch from Buckee. No spam, no algorithm tricks — written by
              humans in Pittsburgh.
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

export function Blog() {
  const [cat, setCat] = useState("ALL");

  const filtered = POSTS.filter((p) => cat === "ALL" || p.cat === cat);
  const featured = filtered.find((p) => p.featured) || POSTS.find((p) => p.featured);
  const rest = filtered.filter((p) => !p.featured);

  return (
    <main className="cbl-blog">
      <style>{BLOG_CSS}</style>

      <Hero />
      <Filters cat={cat} setCat={setCat} />

      <section className="band">
        <div className="band-inner">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">latest · refreshed weekly</div>
              <h2 className="section-h2">
                {cat === "ALL" ? "Latest stories" : CATS.find((c) => c.key === cat)?.label}
                <span className="it">from the CBL network</span>
              </h2>
            </div>
            <div className="count"><b>{filtered.length}</b> stories</div>
          </div>

          {featured && filtered.includes(featured) && <Spotlight p={featured} />}

          <div className="posts-grid">
            {rest.map((p) => <PostCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      <Newsletter />
    </main>
  );
}
