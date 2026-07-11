import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { getPublishedPosts, getLikeCounts, type BlogCard } from '../lib/blog';
import keithPhoto from '../../assets/cbl-keith.png';

/**
 * Blog — Keith's approved "CBL Blog Desktop" design (Claude Design · CBL Website
 * 2026), restored from git 485f6ff and WIRED TO THE REAL BACKEND: the hero,
 * sticky category rail, featured spotlight, card grid, and newsletter strip are
 * his; the posts now come live from `blog_posts` (lib/blog.ts) with like counts,
 * and every card links to the /blog/:slug post page. Category tabs are derived
 * from the verticals actually present so there are no empty tabs (expand to the
 * full fixed set — Good Eats / Flight Deals / Places to Stay, etc. — as content
 * grows into them). Scoped under `.cbl-blog`.
 */

const DISPLAY = "'myriad-pro','Source Sans 3',sans-serif";
const ITALIC = "'Playfair Display',serif";
const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

type CatDef = { key: string; label: string; Icon: (p: { s?: number }) => JSX.Element };
type Card = {
  slug: string;
  cat: string;
  catLabel: string;
  title: string;
  excerpt: string;
  author: string;
  avatar: string;
  date: string;
  city: string;
  img: string;
  featured: boolean;
  likes: number;
};

const BLOG_CSS = `
.cbl-blog { background:#0A0A0A; color:#fff; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; min-height:100vh; }
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
  font-family:${MONO}; font-size:12px; letter-spacing:.14em; color:#fff; font-weight:700;
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
.cbl-blog .filters-inner { max-width:1280px; margin:0 auto; display:flex; align-items:center; gap:20px; }
.cbl-blog .cat-row { flex:1; min-width:0; display:flex; gap:6px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,.06); overflow-x:auto; scrollbar-width:none; }

/* Keyword search */
.cbl-blog .search { flex:none; position:relative; display:flex; align-items:center; }
.cbl-blog .search .mag { position:absolute; left:15px; display:flex; color:#8a8a8a; pointer-events:none; }
.cbl-blog .search input {
  width:216px; background:#141414; border:1px solid rgba(255,255,255,.10); border-radius:999px;
  padding:10px 34px 10px 40px; font-family:${MONO}; font-size:13px; letter-spacing:.02em; color:#fff; outline:0;
  transition:border-color .2s, width .25s ease, background .2s;
}
.cbl-blog .search input::placeholder { color:#666; }
.cbl-blog .search input:focus { border-color:#C99742; width:264px; background:#191919; }
.cbl-blog .search input::-webkit-search-cancel-button { -webkit-appearance:none; appearance:none; }
.cbl-blog .search .clear {
  position:absolute; right:8px; width:22px; height:22px; border:0; background:transparent; color:#888;
  font-size:16px; line-height:1; border-radius:50%; display:flex; align-items:center; justify-content:center;
}
.cbl-blog .search .clear:hover { color:#C99742; background:rgba(201,151,66,.12); }
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
.cbl-blog .spotlight { display:grid; grid-template-columns:1.1fr 1fr; background:linear-gradient(135deg,#141414,#0c0c0c); border:1px solid rgba(201,151,66,.25); border-radius:24px 0 24px 0; overflow:hidden; margin-bottom:24px; transition:border-color .3s; }
.cbl-blog .spotlight:hover { border-color:rgba(201,151,66,.5); }
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
.cbl-blog .spotlight .actions { display:flex; gap:12px; margin-top:8px; align-items:center; }
.cbl-blog .spotlight .cta { background:#C99742; border:0; color:#000; padding:14px 24px; border-radius:999px; font-family:${DISPLAY}; font-weight:800; font-size:13px; letter-spacing:.12em; text-transform:uppercase; }
.cbl-blog .spotlight .cta:hover { background:#DDB15F; }
.cbl-blog .spotlight .likes { font-family:${MONO}; font-size:12px; color:#C99742; letter-spacing:.06em; }

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
.cbl-blog .post .byline .lk { font-family:${MONO}; font-size:11px; color:#C99742; letter-spacing:.04em; }
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

.cbl-blog .state { text-align:center; padding:70px 24px; color:#888; font-family:${MONO}; letter-spacing:.06em; }

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
  .cbl-blog h1.hero-title { display:flex; flex-wrap:nowrap; position:relative; gap:0; align-items:flex-start; font-size:clamp(30px,8vw,44px); }
  .cbl-blog h1.hero-title .title-stack { min-width:0; flex:1; }
  .cbl-blog h1.hero-title .title-stack > span:first-child { display:block; padding-right:64px; }
  .cbl-blog h1.hero-title .blog-icon { display:flex; position:absolute; top:0; right:0; width:56px; height:44px; }
  .cbl-blog .hero-subtitle { flex-wrap:nowrap; white-space:nowrap; font-size:clamp(20px,5.4vw,27px); }
  .cbl-blog .eyebrow { display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; }
  .cbl-blog .eyebrow::before { display:inline-block; vertical-align:middle; margin-right:10px; }
  .cbl-blog .hero p.lede { font-size:16px; }
  .cbl-blog .posts-grid { grid-template-columns:1fr; }
  .cbl-blog .eyebrow, .cbl-blog .section-eyebrow, .cbl-blog .section-head .count { font-size:12px; }
  .cbl-blog .post h3 { font-size:23px; }
  .cbl-blog .post .excerpt { font-size:15px; line-height:1.6; }
  .cbl-blog .spotlight h3 { font-size:34px; }
  .cbl-blog .spotlight p { font-size:15px; line-height:1.6; }
  .cbl-blog .filters-inner { flex-wrap:wrap; gap:0; }
  .cbl-blog .cat-row { order:1; width:100%; }
  .cbl-blog .search { order:2; width:100%; padding:8px 0 10px; }
  .cbl-blog .search input, .cbl-blog .search input:focus { width:100%; }
}
`;

/* ── Brand icons (viewBox 288×227.01, stroke-based) ── */
function BrandIcon({ paths, s = 32 }: { paths: ReactNode; s?: number }) {
  return (
    <svg width={s} height={s * (227.01 / 288)} viewBox="0 0 288 227.01" fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
      {paths}
    </svg>
  );
}
const IconBlog = ({ s }: { s?: number }) => (
  <BrandIcon s={s} paths={<>
    <path d="M146.81,169.65c15.66,8.83,41.52,11.54,58.01,3.58,21.73,8.83,47.18,20.37,47.18,20.37l-17.3-34.63s22.84-8.16,18.09-39.58c0,0-4.07-23.61-27.16-29.46" />
    <path d="M45.35,183.91l17.3-34.63s-29.88-24.77-25.13-56.19c4.75-31.42,42.78-59.26,91.68-59.26s96.43,27.16,96.43,63.84-38.71,84.21-133.1,65.87c-21.73,8.83-47.18,20.37-47.18,20.37Z" />
    <circle cx="95.83" cy="99.4" r="9.47" fill="currentColor" stroke="none" />
    <circle cx="137.35" cy="99.4" r="9.47" fill="currentColor" stroke="none" />
    <circle cx="178.87" cy="99.4" r="9.47" fill="currentColor" stroke="none" />
  </>} />
);
const IconStays = ({ s }: { s?: number }) => (
  <BrandIcon s={s} paths={<>
    <rect x="47.43" y="115.99" width="193.15" height="74.01" />
    <line x1="47.43" y1="169.51" x2="240.57" y2="169.51" />
    <path d="M58.39,112.96v-45.6c0-17.4,27.37-25.75,85.61-25.75" />
    <path d="M229.61,112.96s0-28.2,0-45.6c0-17.4-27.37-25.75-85.61-25.75" />
    <line x1="58.39" y1="190" x2="58.39" y2="204.05" />
    <line x1="229.61" y1="190" x2="229.61" y2="204.05" />
    <path d="M83.44,115.99v-29.64c0-3.94,3.23-7.17,7.17-7.17h44.11c3.94,0,7.17,3.23,7.17,7.17v29.64" />
    <path d="M142.27,115.99v-29.38c0-4.08,3.34-7.42,7.42-7.42h47.78c4.08,0,7.42,3.34,7.42,7.42v29.38" />
  </>} />
);
const IconEats = ({ s }: { s?: number }) => (
  <BrandIcon s={s} paths={<>
    <path d="M125.23,129.43l-13-13-5.03,5.02c-3.43,3.43-9.09,3.35-12.63-.2l-40.55-40.55c-14.56-14.56-14.92-37.8-.81-51.91h0s73.32,73.32,73.32,73.32l15.17,15.17" />
    <path d="M156.6,132.18l50.43,50.43c4.08,4.08,4.18,10.58.23,14.53-3.95,3.95-10.46,3.85-14.53-.23l-51.01-51.01" />
    <path d="M245.13,63.97l-50.59,50.59c-5.93,5.93-15.54,5.93-21.46,0l-88.44,88.44c-3.81,3.81-9.99,3.81-13.8,0h0c-3.81-3.81-3.81-9.99,0-13.8l88.44-88.44c-5.93-5.93-5.93-15.54,0-21.46l50.59-50.59" />
    <line x1="221.36" y1="40.21" x2="179.37" y2="82.2" />
    <line x1="233.2" y1="52.04" x2="191.21" y2="94.03" />
  </>} />
);
const IconTransport = ({ s }: { s?: number }) => (
  <BrandIcon s={s} paths={<>
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
  </>} />
);
const IconAttractions = ({ s }: { s?: number }) => (
  <BrandIcon s={s} paths={<>
    <circle cx="175.91" cy="51.34" r="16.21" />
    <circle cx="110.58" cy="82.5" r="16.21" />
    <path d="M175.91,17.05s-36.14,2.29-36.14,37.66,36.14,59.27,36.14,59.27c0,0,35.1-22.04,35.1-61.58,0-35.48-35.1-35.35-35.1-35.35Z" />
    <path d="M55.97,135.76c-1.34-6.16-1.51-9.88-1.51-16.44,0-44.47,32.42-81.37,74.91-88.35" />
    <path d="M221.73,74.85c7.51,13.1,11.81,28.29,11.81,44.48,0,8.08-1.07,15.91-3.08,23.36" />
    <path d="M153.24,153.53s23.41-25.05,29.69-24.84c8.98.3,41.25,30.53,41.25,30.53-14.05,31.07-43.87,49.64-80.18,49.64-38.46,0-71.25-24.25-83.93-58.29,0,0,33.97-36.62,42.62-36.59,5.39.02,7.83.64,24.11,16.8,16.28,16.16,63.57,61.36,63.57,61.36" />
  </>} />
);
const IconTravel = ({ s }: { s?: number }) => (
  <BrandIcon s={s} paths={<path d="M232.63,25.99c2.31,6.92-3.42,19.87-9.4,28.16-6.96,9.63-39.07,35.86-39.07,35.86l22.75,100.97-9.63,9.81-43.88-82.95-44.15,42.01,7.76,36.66-5.62,4.28-21.99-34.89-34.61-21.72,4.28-5.62,36.66,7.76,42.01-44.15L54.77,58.29l9.81-9.63,100.97,22.75s26.22-32.11,35.86-39.07c8.47-6.12,22.05-12.58,28.59-9.2,0,0,2.2,1.58,2.63,2.86Z" />} />
);

// Fixed topic set — advertises the blog's scope (the kinds of stories we post)
// even before every category has content. Post `vertical` values map onto these
// keys. Edit this list to change the topics shown in the rail.
// The brand's canonical category set — same as the site/app nav (Transportation,
// Travels, Eats & Drinks, Attractions). Everything stems from these; "Where the
// Locals Go" and "Perfect Saturdays" live as THEMES inside them (see the kicker),
// not as separate tabs. Keep this list in sync with the site/app categories.
const CATS: CatDef[] = [
  { key: 'ALL', label: 'All Posts', Icon: IconBlog },
  { key: 'TRANSPO', label: 'Transportation', Icon: IconTransport },
  { key: 'TRAVELS', label: 'Travels', Icon: IconTravel },
  { key: 'EATS', label: 'Eats & Drinks', Icon: IconEats },
  { key: 'ATTRACTIONS', label: 'Attractions', Icon: IconAttractions },
];

// A post's `vertical` (from blog_posts) maps to one of the brand categories above.
const VERTICAL_CAT: Record<string, string> = {
  transpo: 'TRANSPO',
  drivers: 'TRANSPO',
  riders: 'TRANSPO',
  travels: 'TRAVELS',
  flights: 'TRAVELS',
  stays: 'TRAVELS',
  eats: 'EATS',
  entertainment: 'ATTRACTIONS',
  events: 'ATTRACTIONS',
  attractions: 'ATTRACTIONS',
  itinerary: 'ATTRACTIONS',
};

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

function fmtDate(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  } catch {
    return '';
  }
}

function toCard(p: BlogCard, likes: number): Card {
  const catKey = VERTICAL_CAT[(p.vertical || '').toLowerCase()];
  const cat = catKey || 'ALL';
  // Pill shows the brand category (matches the rail); unmapped verticals fall
  // back to a title-cased label so the pill is never blank.
  const catLabel = (catKey && CATS.find((c) => c.key === catKey)?.label) || (p.vertical ? titleCase(p.vertical) : 'Story');
  return {
    slug: p.slug,
    cat,
    catLabel,
    title: p.title,
    excerpt: p.excerpt || '',
    author: p.author_name || 'City Bucket List',
    avatar: (p.author_name || '').toLowerCase().includes('keith') ? keithPhoto : '',
    date: fmtDate(p.published_at),
    city: p.city || '',
    img: p.hero_image || MAP_BG,
    featured: !!p.featured,
    likes,
  };
}

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
        <div className="eyebrow">What's on your bucket list?</div>
        <h1 className="hero-title">
          <span className="title-stack">
            <span className="h1-main">CBL Blog<span style={{ color: '#C99742' }}>.</span></span>
            <span className="hero-subtitle">
              <span>Field notes</span>
              <span className="it">from your city.</span>
            </span>
          </span>
          <BlogIconHero />
        </h1>
        <p className="lede">
          City experiences from the people who actually know the place — the drivers and riders who
          live here. New posts weekly.
        </p>
      </div>
    </section>
  );
}

function Filters({
  cats,
  cat,
  setCat,
  q,
  setQ,
}: {
  cats: CatDef[];
  cat: string;
  setCat: (v: string) => void;
  q: string;
  setQ: (v: string) => void;
}) {
  return (
    <div className="filters">
      <div className="filters-inner">
        <div className="cat-row" style={{ borderBottom: 0, paddingBottom: 12 }}>
          {cats.map((c) => (
            <button key={c.key} className={'cat-btn' + (cat === c.key ? ' active' : '')} onClick={() => setCat(c.key)}>
              <span className="ic"><c.Icon s={32} /></span>
              {c.label}
            </button>
          ))}
        </div>
        <div className="search" role="search">
          <span className="mag" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.5" y2="16.5" />
            </svg>
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search stories…"
            aria-label="Search stories by keyword"
            spellCheck={false}
          />
          {q && (
            <button type="button" className="clear" aria-label="Clear search" onClick={() => setQ('')}>
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Spotlight({ p }: { p: Card }) {
  return (
    <Link to={`/blog/${p.slug}`} className="spotlight">
      <div className="shot" style={{ backgroundImage: `url(${p.img})` }}>
        <span className="cat-pill">{p.catLabel}</span>
      </div>
      <div className="text">
        <div className="kicker">CBL Featured{p.city ? ` · ${p.city}` : ''}</div>
        <h3>{p.title}</h3>
        <p>{p.excerpt}</p>
        <div className="byline">
          {p.avatar && <div className="avatar" style={{ backgroundImage: `url(${p.avatar})` }} />}
          <div>
            <div className="author">{p.author}</div>
            <div className="meta">{p.date}{p.city ? ` · ${p.city}` : ''}</div>
          </div>
        </div>
        <div className="actions">
          <span className="cta">Read the Story →</span>
          {p.likes > 0 && <span className="likes">♥ {p.likes}</span>}
        </div>
      </div>
    </Link>
  );
}

function PostCard({ p }: { p: Card }) {
  return (
    <Link to={`/blog/${p.slug}`} className="post" style={{ textDecoration: 'none' }}>
      <div className="img" style={{ backgroundImage: `url(${p.img})` }}>
        <span className="cat-pill">{p.catLabel}</span>
        {p.city && <span className="read-time">{p.city}</span>}
      </div>
      <div className="body">
        <h3>{p.title}</h3>
        <p className="excerpt">{p.excerpt}</p>
        <div className="byline">
          {p.avatar && <div className="avatar" style={{ backgroundImage: `url(${p.avatar})` }} />}
          <div className="meta">
            <span className="author">{p.author}</span>
            <span className="date">{p.date}</span>
          </div>
          {p.likes > 0 && <span className="lk">♥ {p.likes}</span>}
          <span className="arrow">›</span>
        </div>
      </div>
    </Link>
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
            <p style={{ color: '#B0B0B0', fontSize: 15, lineHeight: 1.55, maxWidth: '52ch', marginBottom: 20 }}>
              Top picks for the week, member-only deals, and the occasional dispatch from Buckee. No spam,
              no algorithm tricks — written by humans in Pittsburgh.
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
  const [raw, setRaw] = useState<BlogCard[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [cat, setCat] = useState('ALL');
  const [q, setQ] = useState('');

  useEffect(() => {
    let live = true;
    getPublishedPosts().then((p) => live && setRaw(p));
    getLikeCounts().then((c) => live && setCounts(c));
    return () => {
      live = false;
    };
  }, []);

  const posts = (raw ?? []).map((p) => toCard(p, counts[p.slug] ?? 0));

  const cats = CATS;
  const query = q.trim().toLowerCase();
  const matchesQuery = (p: Card) =>
    !query || [p.title, p.excerpt, p.author, p.city, p.catLabel].some((f) => f.toLowerCase().includes(query));
  const filtered = posts.filter((p) => (cat === 'ALL' || p.cat === cat) && matchesQuery(p));
  const searching = query.length > 0;
  const catLabel = cats.find((c) => c.key === cat)?.label;
  const featured = searching ? undefined : filtered.find((p) => p.featured);
  const rest = filtered.filter((p) => p.slug !== featured?.slug);

  return (
    <main className="cbl-blog">
      <style>{BLOG_CSS}</style>

      <Hero />
      {cats.length > 1 && <Filters cats={cats} cat={cat} setCat={setCat} q={q} setQ={setQ} />}

      <section className="band">
        <div className="band-inner">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">{searching ? `results · “${q.trim()}”` : 'latest · refreshed weekly'}</div>
              <h2 className="section-h2">
                {searching ? 'Search results' : cat === 'ALL' ? 'Latest stories' : catLabel}
                <span className="it">
                  {searching ? (cat === 'ALL' ? 'across the CBL network' : `in ${catLabel}`) : 'from the CBL network'}
                </span>
              </h2>
            </div>
            <div className="count"><b>{filtered.length}</b> {filtered.length === 1 ? 'story' : 'stories'}</div>
          </div>

          {raw === null ? (
            <div className="state">Loading stories…</div>
          ) : posts.length === 0 ? (
            <div className="state">Our first field notes are being finalized. Check back soon.</div>
          ) : filtered.length === 0 ? (
            searching ? (
              <div className="state">No stories match “{q.trim()}”{cat === 'ALL' ? '' : ` in ${catLabel}`} — try another word or clear the search.</div>
            ) : (
              <div className="state">New {catLabel} stories are on the way — check back soon.</div>
            )
          ) : (
            <>
              {featured && <Spotlight p={featured} />}
              <div className="posts-grid">
                {rest.map((p) => (
                  <PostCard key={p.slug} p={p} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Newsletter />
    </main>
  );
}
