import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import conciergeImage from '../../assets/9b0fc11a5ef647d02d147f7c1dee023bd105e175.png';
import transportationImage from '../../assets/0c14cb1865bf0ca612f6fcb9d74d4ff3578188ac.png';
import eatsImage from '../../assets/5f602f7d30b9658349675aa8836bb8d75594e226.png';
import attractionsImage from '../../assets/e04fa8d75cf2828287ef82f02beaae9386ee6f52.png';
import blogImage from '../../assets/cbl_blog_slide.png';
import directoryImage from '../../assets/cbl_directory_slide.png';
import buckeeImage from '../../assets/buckee.png';

/**
 * Home — re-skinned to match the rest of the site (Our Story / Explore /
 * Affiliates): dark canvas, gold (#C99742) accents, Myriad Pro display headers
 * with Playfair Display italic accents, mono eyebrow labels, the shared
 * map-backdrop hero, and the angled-corner card treatment.
 *
 * The original single-viewport showcase has been re-imagined as a scrolling
 * page, but the function carried over from the old home is preserved: the hero
 * auto-rotates through six panels (4 categories + blog + directory), pauses on
 * hover, and the category / link chips highlight in sync with the active panel.
 * Previous version archived at Home.old.tsx.
 */

const GOLD = '#C99742';
const DISPLAY = "'Myriad Pro', sans-serif";
const BODY = "'Myriad Pro', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';
const APP_URL = 'https://app.citybucketlist.com';

type Slide = {
  key: string;
  image: string;
  alt: string;
  headline: React.ReactNode;
  caption: React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    key: 'travels',
    image: conciergeImage,
    alt: 'Hotel Concierge Services',
    headline: (
      <>
        Travel smart.<br />
        Live local.<br />
        <span className="gold">Save more.</span>
      </>
    ),
    caption: (
      <>
        Hotel concierge available —{' '}
        <a href={APP_URL} className="cap-link">
          sign up
        </a>
      </>
    ),
  },
  {
    key: 'transportation',
    image: transportationImage,
    alt: 'Transportation Services',
    headline: (
      <>
        Need a ride?<br />
        Arrive safe.<br />
        <span className="gold">Save more.</span>
      </>
    ),
    caption: (
      <>
        Safe rides on demand —{' '}
        <a href={APP_URL} className="cap-link">
          book a ride
        </a>
      </>
    ),
  },
  {
    key: 'eats',
    image: eatsImage,
    alt: 'Dining and Restaurants',
    headline: (
      <>
        Hungry?<br />
        Eat local.<br />
        <span className="gold">Save more.</span>
      </>
    ),
    caption: (
      <>
        Local restaurant deals —{' '}
        <Link to="/eats-and-drinks" className="cap-link">
          explore dining
        </Link>
      </>
    ),
  },
  {
    key: 'attractions',
    image: attractionsImage,
    alt: 'Local Attractions',
    headline: (
      <>
        Bored?<br />
        Explore local.<br />
        <span className="gold">Save more.</span>
      </>
    ),
    caption: (
      <>
        Local experiences —{' '}
        <Link to="/attractions" className="cap-link">
          start exploring
        </Link>
      </>
    ),
  },
  {
    key: 'blog',
    image: blogImage,
    alt: 'CBL Blog',
    headline: (
      <>
        Stay in the<br />
        know.<br />
        <span className="gold">Read local.</span>
      </>
    ),
    caption: (
      <>
        Guides, tips & stories —{' '}
        <Link to="/blog" className="cap-link">
          read the blog
        </Link>
      </>
    ),
  },
  {
    key: 'directory',
    image: directoryImage,
    alt: 'CBL Directory',
    headline: (
      <>
        Find local<br />
        businesses.<br />
        <span className="gold">Connect more.</span>
      </>
    ),
    caption: (
      <>
        Local business directory —{' '}
        <a href="https://directory.citybucketlist.com/" target="_blank" rel="noopener noreferrer" className="cap-link">
          browse now
        </a>
      </>
    ),
  },
];

const CATEGORIES = [
  { key: 'travels', label: 'Travels', to: '/travels' },
  { key: 'transportation', label: 'Transportation', to: '/transportation' },
  { key: 'eats', label: 'Eats & Drinks', to: '/eats-and-drinks' },
  { key: 'attractions', label: 'Attractions', to: '/attractions' },
];

const APP_FEATURES = [
  { t: 'Meet Buckee', d: 'Your AI travel buddy builds personalized itineraries and local insider tips on demand.' },
  { t: 'Book in seconds', d: 'Trusted rides, dining, and attractions — all from one membership, on any device.' },
  { t: 'Save more', d: 'Member savings and partner offers across every city you visit. Joining is free.' },
];

// Circular nav icons carried over from the original homepage (CategoryButton +
// the old Blog/Directory widgets). Re-stroked with currentColor so each badge
// inherits its chip's color — white by default, gold when active/hovered.
const ICON_VIEWBOX: Record<string, string> = {
  travels: '0 0 70 70',
  transportation: '0 0 70 70',
  eats: '0 0 70 70',
  attractions: '0 0 70 70',
  blog: '0 0 100 100',
  directory: '0 0 100 100',
};

const CHIP_ICONS: Record<string, React.ReactNode> = {
  travels: (
    <g transform="translate(2,2)" fill="none" stroke="currentColor" strokeWidth={1.58} strokeLinecap="round" strokeLinejoin="round">
      <g transform="translate(-122.07, -53.18)">
        <path d="M170.53,69.41c1.35.94-.05,4-1.36,5.82s-7.37,6.76-7.37,6.76l4.29,19.04-1.82,1.85-8.28-15.65-8.33,7.92,1.46,6.91-1.06.81-3.99-6.46" />
        <path d="M170.87,69.76c-.94-1.35-4,.05-5.82,1.36s-6.76,7.37-6.76,7.37l-19.04-4.29-1.85,1.82,15.65,8.28-7.92,8.33-6.91-1.46-.81,1.06,6.46,3.99" />
      </g>
    </g>
  ),
  transportation: (
    <g transform="translate(2,2)" fill="none" stroke="currentColor" strokeWidth={1.62} strokeLinecap="round" strokeLinejoin="round">
      <g transform="translate(-339.38, -53.15)">
        <path d="M358.22,80.37l-2.38,3.89c-.46.75-.66,1.61-.56,2.47l.95,8.15h16.14" />
        <path d="M358.22,80.37s-1.01-.87-2.55-1.09c-1.54-.22-2.6-.06-2.79.53-.23.72-1.26,2.3,1.33,2.38" />
        <path d="M372.72,74.31s-8.93-.12-10.73.74c-1.58.75-3.35,4.42-3.77,5.32" />
        <path d="M366.43,88.28s-2.2-.12-5.19-.23c-2.99-.12-2.42-2.03-2.42-2.03" />
        <path d="M366.43,91.52h12.58" />
        <path d="M358.13,80.52s.56.89,2.58.89h11.9" />
        <path d="M360.84,94.88h0c1.56,0,2.82,1.27,2.82,2.82v.3h-5.65v-.3c0-1.56,1.27-2.82,2.82-2.82Z" transform="translate(721.69 192.88) rotate(180)" />
        <path d="M386.54,80.37l2.38,3.89c.46.75.66,1.61.56,2.47l-.95,8.15h-16.14" />
        <path d="M386.54,80.37s1.01-.87,2.55-1.09c1.54-.22,2.6-.06,2.79.53.23.72,1.26,2.3-1.33,2.38" />
        <path d="M372.04,74.31s8.93-.12,10.73.74c1.58.75,3.35,4.42,3.77,5.32" />
        <path d="M378.33,88.28s2.2-.12,5.19-.23c2.99-.12,2.42-2.03,2.42-2.03" />
        <path d="M378.33,91.52h-12.58" />
        <path d="M386.63,80.52s-.56.89-2.58.89h-11.9" />
        <path d="M381.09,94.88h5.65v.3c0,1.56-1.27,2.82-2.82,2.82h0c-1.56,0-2.82-1.27-2.82-2.82v-.3h0Z" />
      </g>
    </g>
  ),
  eats: (
    <g transform="translate(2,2)" fill="none" stroke="currentColor" strokeWidth={1.71} strokeLinecap="round" strokeLinejoin="round">
      <g transform="translate(-618.69, -49.71)">
        <path d="M649.18,85.45l-2.49-2.49-.96.96c-.66.66-1.74.64-2.42-.04l-7.75-7.75c-2.78-2.78-2.85-7.23-.15-9.93h0s14.02,14.02,14.02,14.02l2.9,2.9" />
        <path d="M655.18,85.98l9.64,9.64c.78.78.8,2.02.04,2.78s-2,.74-2.78-.04l-9.75-9.75" />
        <path d="M672.1,72.94l-9.67,9.67c-1.13,1.13-2.97,1.13-4.1,0l-16.91,16.91c-.73.73-1.91.73-2.64,0h0c-.73-.73-.73-1.91,0-2.64l16.91-16.91c-1.13-1.13-1.13-2.97,0-4.1l9.67-9.67" />
        <line x1="667.56" y1="68.39" x2="659.53" y2="76.42" />
        <line x1="669.82" y1="70.66" x2="661.79" y2="78.68" />
      </g>
    </g>
  ),
  attractions: (
    <g transform="translate(2,2)" fill="none" stroke="currentColor" strokeWidth={1.78} strokeLinecap="round" strokeLinejoin="round">
      <g transform="translate(-897.94, -50.73)">
        <circle cx="937.26" cy="70.09" r="3.21" />
        <circle cx="924.32" cy="76.27" r="3.21" />
        <path d="M937.26,63.3s-7.16.45-7.16,7.46,7.16,11.74,7.16,11.74c0,0,6.95-4.37,6.95-12.2,0-7.03-6.95-7-6.95-7Z" />
        <path d="M913.5,86.82c-.27-1.22-.3-1.96-.3-3.26,0-8.81,6.42-16.12,14.84-17.5" />
        <path d="M946.34,74.75c1.49,2.6,2.34,5.6,2.34,8.81,0,1.6-.21,3.15-.61,4.63" />
        <path d="M932.77,90.34s4.64-4.96,5.88-4.92c1.78.06,8.17,6.05,8.17,6.05-2.78,6.15-8.69,9.83-15.88,9.83-7.62,0-14.12-4.8-16.63-11.55,0,0,6.73-7.26,8.44-7.25,1.07,0,1.55.13,4.78,3.33,3.22,3.2,12.59,12.16,12.59,12.16" />
      </g>
    </g>
  ),
  blog: (
    <g transform="translate(50, 50) scale(0.8) translate(-73, -71)" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M49.9,87.54l4.34-8.68s-7.49-6.21-6.3-14.09c1.19-7.88,10.73-14.86,22.99-14.86s24.18,6.81,24.18,16.01-9.71,21.12-33.38,16.52c-5.45,2.21-11.83,5.11-11.83,5.11Z" />
      <path d="M75.35,83.96c3.93,2.21,10.41,2.89,14.55.9,5.45,2.21,11.83,5.11,11.83,5.11l-4.34-8.68s5.73-2.05,4.54-9.92c0,0-1.02-5.92-6.81-7.39" />
      <circle fill="currentColor" stroke="none" cx="62.56" cy="66.35" r="2.37" />
      <circle fill="currentColor" stroke="none" cx="72.97" cy="66.35" r="2.37" />
      <circle fill="currentColor" stroke="none" cx="83.39" cy="66.35" r="2.37" />
    </g>
  ),
  directory: (
    <g transform="translate(50, 50) scale(0.7) translate(-74, -72)" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="51.23" y="50.63" width="8.1" height="5.41" />
      <rect x="51.23" y="61.46" width="8.1" height="5.41" />
      <rect x="51.23" y="72.13" width="8.1" height="5.41" />
      <rect x="51.23" y="82.88" width="8.1" height="5.41" />
      <circle cx="80.6" cy="66.15" r="3.82" />
      <path d="M82.48,69.55s5.21,2.58,5.21,6.67c-3.14,0-4.95,0-4.95,0h-2.98s-3.39,0-6.53,0c0-4.09,5.21-6.67,5.21-6.67" />
      <path d="M55.28,88.74v5.18h38.45c2.54,0,2.54-2.54,2.54-2.54v-43.55c0-2.54-2.87-2.65-2.87-2.65h-38.12v4.85" />
      <line x1="64.07" y1="49.26" x2="64.07" y2="89.95" />
      <line x1="55.28" y1="56.04" x2="55.28" y2="61.46" />
      <line x1="55.28" y1="67.26" x2="55.28" y2="71.31" />
      <line x1="55.28" y1="78.66" x2="55.28" y2="82.71" />
    </g>
  ),
};

function ChipIcon({ k }: { k: string }) {
  return (
    <span className="chip-ic" aria-hidden="true">
      <svg viewBox={ICON_VIEWBOX[k]}>{CHIP_ICONS[k]}</svg>
    </span>
  );
}

const HOME_CSS = `
.cbl-home { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-home *,.cbl-home *::before,.cbl-home *::after { box-sizing:border-box; }
.cbl-home button { font-family:inherit; cursor:pointer; }
.cbl-home a { text-decoration:none; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

/* ── Hero band ── */
.cbl-home .hero {
  position:relative; overflow:hidden; background:#0A0A0A;
  padding:22px 48px 44px;
}
/* Map backdrop pinned to a fixed-height header strip so it reads exactly like
   the About / Explore heroes regardless of the (taller) two-column hero body. */
.cbl-home .hero::before {
  content:''; position:absolute; left:0; right:0; top:0; z-index:0; pointer-events:none;
  height:clamp(260px,30vw,360px);
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
}
.cbl-home .hero-inner { position:relative; z-index:1; max-width:1280px; margin:0 auto; }
.cbl-home .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#8a8a8a; text-transform:lowercase; margin-bottom:14px;
}
.cbl-home .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:${GOLD}; animation:cbl-pulse 2.4s ease-in-out infinite;
}

.cbl-home .hero-grid {
  display:grid; grid-template-columns:1.05fr .95fr; gap:44px; align-items:center;
}
.cbl-home .hero-copy { min-width:0; }
.cbl-home h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(44px,5.2vw,76px);
  line-height:.96; letter-spacing:-.02em; text-transform:uppercase; margin:0 0 18px;
  color:#fff; transition:filter .5s, opacity .5s;
}
/* Locked to three lines so the rotation never shifts the layout. */
.cbl-home h1.hero-title .gold { color:${GOLD}; }
.cbl-home .hero-lede {
  font-size:16px; line-height:1.5; color:#B8B8B8; margin:0 0 24px;
  white-space:nowrap;
  transition:filter .5s, opacity .5s;
}
.cbl-home .hero-lede .cap-link { color:${GOLD}; }
.cbl-home .hero-lede .cap-link:hover { text-decoration:underline; }
/* Keep the arrow on the same line as its link text. */
.cbl-home .cap-link { white-space:nowrap; }

.cbl-home .btn-primary {
  display:inline-flex; align-items:center; gap:10px;
  background:${GOLD}; color:#000; border:0;
  padding:15px 36px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:900;
  font-size:14px; letter-spacing:.14em; text-transform:uppercase; transition:background .2s;
}
.cbl-home .btn-primary:hover { background:#DDB15F; }

/* ── Hero media (rotating) ── */
.cbl-home .hero-media {
  position:relative; border-radius:18px 0 18px 0; overflow:hidden;
  border:1px solid rgba(255,255,255,.08); background:#141414;
  aspect-ratio:4/3;
}
.cbl-home .hero-media .frame { position:absolute; inset:0; display:flex; flex-direction:column; transition:filter .5s, opacity .5s; }
.cbl-home .hero-media img { flex:1; width:100%; height:100%; object-fit:cover; display:block; min-height:0; }
.cbl-home .hero-media .cap {
  flex-shrink:0; background:rgba(10,10,10,.92); padding:12px 18px;
  font-size:13px; line-height:1.35; color:#D8D8D8; font-weight:600;
}
.cbl-home .hero-media .cap .cap-link { color:${GOLD}; }
.cbl-home .hero-media .cap .cap-link:hover { text-decoration:underline; }

/* ── Category / link chips ── */
.cbl-home .chip-row {
  margin-top:30px; display:flex; flex-wrap:wrap; gap:14px;
}
.cbl-home .chip {
  display:inline-flex; align-items:center; gap:11px;
  padding:7px 22px 7px 7px; border-radius:999px;
  border:1.5px solid rgba(255,255,255,.22); background:transparent;
  color:#fff; font-family:${DISPLAY}; font-weight:800;
  font-size:12px; letter-spacing:.1em; text-transform:uppercase;
  transition:border-color .25s, color .25s, background .25s;
}
.cbl-home .chip-ic {
  width:38px; height:38px; flex-shrink:0; border-radius:50%;
  border:1.5px solid currentColor; background:#0A0A0A;
  display:inline-flex; align-items:center; justify-content:center;
}
.cbl-home .chip-ic svg { width:84%; height:84%; display:block; }
.cbl-home .chip:hover { border-color:${GOLD}; color:${GOLD}; }
.cbl-home .chip.active { border-color:${GOLD}; color:${GOLD}; background:rgba(201,151,66,.1); }

/* ── Section frame ── */
.cbl-home section.band { padding:64px 48px; }
.cbl-home .band-inner { max-width:1280px; margin:0 auto; }
.cbl-home .section-eyebrow {
  font-family:${MONO}; font-size:12px; color:${GOLD};
  letter-spacing:.18em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
}
.cbl-home .section-eyebrow::before { content:''; width:28px; height:1px; background:${GOLD}; }
.cbl-home .section-h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(38px,4.4vw,60px); line-height:.95;
  letter-spacing:-.01em; text-transform:uppercase; margin:0 0 8px;
}
.cbl-home .section-h2 .it {
  font-family:${ITALIC}; font-style:italic;
  color:${GOLD}; font-weight:600; text-transform:none;
  font-size:.6em; margin-left:8px;
}
.cbl-home .section-lede { color:#B0B0B0; font-size:15px; line-height:1.55; max-width:62ch; margin:0 0 28px; }

/* ── Meet Buckee band ── */
.cbl-home .buckee-band {
  background:
    radial-gradient(ellipse at 18% 10%, rgba(201,151,66,.12), transparent 60%),
    linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%);
  border-top:1px solid rgba(201,151,66,.18);
  border-bottom:1px solid rgba(201,151,66,.18);
}
.cbl-home .buckee-grid { display:grid; grid-template-columns:auto 1fr; gap:36px; align-items:center; }
.cbl-home .buckee-art {
  width:200px; height:200px; flex-shrink:0;
  border-radius:24px 0 24px 0; border:1px solid rgba(201,151,66,.35);
  background:#0A0A0A; display:flex; align-items:center; justify-content:center; padding:18px;
}
.cbl-home .buckee-art img { width:100%; height:100%; object-fit:contain; }

/* ── App showcase band ── */
.cbl-home .app-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; }
.cbl-home .app-features { list-style:none; margin:24px 0 28px; padding:0; display:flex; flex-direction:column; gap:18px; }
.cbl-home .app-features li { position:relative; padding-left:26px; }
.cbl-home .app-features li::before { content:''; position:absolute; left:0; top:9px; width:14px; height:1.5px; background:${GOLD}; }
.cbl-home .app-features h4 { font-family:${DISPLAY}; font-weight:900; font-size:18px; text-transform:uppercase; letter-spacing:-.005em; margin:0 0 3px; }
.cbl-home .app-features p { color:#A8A8A8; font-size:14px; line-height:1.5; margin:0; }
.cbl-home .app-url { display:inline-block; margin-top:16px; font-family:${MONO}; font-size:13px; letter-spacing:.06em; color:#8a8a8a; }
.cbl-home .app-url b { color:${GOLD}; font-weight:600; }

/* device mockup */
.cbl-home .device-wrap { display:flex; justify-content:center; }
.cbl-home .device {
  position:relative; width:300px; aspect-ratio:9/19; max-width:100%;
  border-radius:46px; padding:14px;
  background:linear-gradient(160deg,#2a2a2a,#0c0c0c);
  border:1px solid rgba(255,255,255,.1);
  box-shadow:0 30px 80px rgba(0,0,0,.6), 0 0 0 2px rgba(201,151,66,.25);
  animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both;
}
.cbl-home .device-screen {
  position:relative; width:100%; height:100%; overflow:hidden;
  border-radius:34px;
  background:
    radial-gradient(ellipse at 50% 18%, rgba(201,151,66,.3), transparent 55%),
    linear-gradient(180deg,#141414 0%,#0A0A0A 100%);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  text-align:center; padding:30px 24px;
}
.cbl-home .device-notch {
  position:absolute; top:12px; left:50%; transform:translateX(-50%);
  width:42%; height:8px; border-radius:999px; background:rgba(0,0,0,.7);
}
.cbl-home .device-screen img { width:120px; height:120px; object-fit:contain; margin-bottom:16px; }
.cbl-home .device-screen .d-kicker { font-family:${MONO}; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:${GOLD}; margin-bottom:8px; }
.cbl-home .device-screen .d-title { font-family:${DISPLAY}; font-weight:900; font-size:24px; line-height:1; text-transform:uppercase; letter-spacing:-.01em; margin-bottom:10px; }
.cbl-home .device-screen .d-title .it { font-family:${ITALIC}; font-style:italic; font-weight:600; color:${GOLD}; text-transform:none; }
.cbl-home .device-screen .d-sub { font-size:12px; line-height:1.5; color:#B0B0B0; margin-bottom:20px; }
.cbl-home .device-screen .d-cta { background:${GOLD}; color:#000; font-family:${DISPLAY}; font-weight:900; font-size:11px; letter-spacing:.12em; text-transform:uppercase; padding:11px 24px; border-radius:999px; }

/* ── Explore-more cards (Blog + Directory) ── */
.cbl-home .more-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.cbl-home .more-card {
  position:relative; overflow:hidden; min-height:220px;
  border:1px solid rgba(255,255,255,.08); border-radius:18px 0 18px 0;
  display:flex; flex-direction:column; justify-content:flex-end;
  transition:transform .3s, border-color .3s;
  animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both;
}
.cbl-home .more-card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.45); }
.cbl-home .more-card img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; }
.cbl-home .more-card .overlay {
  position:relative; z-index:1; padding:26px 28px;
  background:linear-gradient(180deg, transparent, rgba(10,10,10,.55) 35%, rgba(10,10,10,.92));
}
.cbl-home .more-card .tag { font-family:${MONO}; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:${GOLD}; }
.cbl-home .more-card h3 { font-family:${DISPLAY}; font-weight:900; font-size:28px; line-height:1; text-transform:uppercase; letter-spacing:-.005em; margin:6px 0 6px; }
.cbl-home .more-card p { color:#C0C0C0; font-size:13px; line-height:1.5; margin:0 0 12px; }
.cbl-home .more-card .go { display:inline-flex; align-items:center; gap:8px; color:${GOLD}; font-family:${DISPLAY}; font-weight:800; font-size:12px; letter-spacing:.12em; text-transform:uppercase; }

/* ── Final CTA band ── */
.cbl-home .cta-band {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(201,151,66,.16), transparent 60%),
    linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%);
  border-top:1px solid rgba(201,151,66,.18);
  text-align:center;
}
.cbl-home .cta-band h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(34px,4vw,56px); line-height:.98;
  letter-spacing:-.01em; text-transform:uppercase; margin:0 0 10px;
}
.cbl-home .cta-band h2 .it { font-family:${ITALIC}; font-style:italic; color:${GOLD}; font-weight:600; text-transform:none; font-size:.6em; margin-left:8px; }
.cbl-home .cta-band p { color:#B0B0B0; font-size:16px; line-height:1.6; max-width:54ch; margin:0 auto 24px; }

/* ── Responsive ── */
@media (max-width:1000px){
  .cbl-home .hero { padding:28px 22px 36px; }
  .cbl-home section.band { padding:48px 22px; }
  .cbl-home .hero-grid { grid-template-columns:1fr; gap:28px; }
  .cbl-home .hero-lede { white-space:normal; }
  .cbl-home .hero-media { order:-1; }
  .cbl-home .buckee-grid { grid-template-columns:1fr; gap:24px; justify-items:center; text-align:center; }
  .cbl-home .app-grid { grid-template-columns:1fr; gap:32px; }
  .cbl-home .app-grid .device-wrap { order:-1; }
  .cbl-home .more-grid { grid-template-columns:1fr; }
}
`;

export function Home() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
        setFading(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [paused]);

  const goTo = (index: number) => {
    if (index === current) return;
    setFading(true);
    setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, 300);
  };

  const slide = SLIDES[current];
  const fadeStyle = { filter: fading ? 'blur(8px)' : 'blur(0px)', opacity: fading ? 0.4 : 1 };

  return (
    <main className="cbl-home">
      <style>{HOME_CSS}</style>

      {/* ── Hero (rotating showcase) ── */}
      <section
        className="hero"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="hero-inner">
          <div className="eyebrow">what's on your bucket list?</div>
          <div className="hero-grid">
            <div className="hero-copy">
              <h1 className="hero-title" style={fadeStyle}>
                {slide.headline}
              </h1>
              <p className="hero-lede" style={fadeStyle}>
                {slide.caption}
              </p>
              <a className="btn-primary" href={APP_URL}>
                Join Now — Free
              </a>

              {/* Category + link chips, highlighting in sync with the rotation */}
              <div className="chip-row">
                {CATEGORIES.map((c, i) => (
                  <Link
                    key={c.key}
                    to={c.to}
                    className={'chip' + (current === i ? ' active' : '')}
                    onMouseEnter={() => goTo(i)}
                  >
                    <ChipIcon k={c.key} />
                    {c.label}
                  </Link>
                ))}
                <Link to="/blog" className={'chip' + (current === 4 ? ' active' : '')} onMouseEnter={() => goTo(4)}>
                  <ChipIcon k="blog" />
                  CBL Blog
                </Link>
                <a
                  href="https://directory.citybucketlist.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={'chip' + (current === 5 ? ' active' : '')}
                  onMouseEnter={() => goTo(5)}
                >
                  <ChipIcon k="directory" />
                  Directory
                </a>
              </div>
            </div>

            <div className="hero-media">
              <div className="frame" style={fadeStyle}>
                <img src={slide.image} alt={slide.alt} />
                <div className="cap">{slide.caption}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Meet Buckee ── */}
      <section className="band buckee-band">
        <div className="band-inner buckee-grid">
          <div className="buckee-art">
            <img src={buckeeImage} alt="Buckee, the CBL AI travel buddy" />
          </div>
          <div>
            <div className="section-eyebrow">your ai travel buddy</div>
            <h2 className="section-h2">
              Meet Buckee <span className="it">free when you join</span>
            </h2>
            <p className="section-lede">
              Personalized itineraries, local insider tips, and smart savings from your AI travel
              buddy. Buckee learns what you love and helps you live like a local in every city you
              visit — and membership is completely free.
            </p>
            <a className="btn-primary" href={APP_URL}>
              Meet Buckee
            </a>
          </div>
        </div>
      </section>

      {/* ── Check out our app ── */}
      <section className="band">
        <div className="band-inner app-grid">
          <div>
            <div className="section-eyebrow">on every device</div>
            <h2 className="section-h2">
              Check out <span className="it">our app</span>
            </h2>
            <p className="section-lede">
              Everything City Bucket List does — rides, dining, attractions, travel, and Buckee —
              lives in one place. Open the web app on your phone, tablet, or desktop and start
              exploring in seconds.
            </p>
            <ul className="app-features">
              {APP_FEATURES.map((f) => (
                <li key={f.t}>
                  <h4>{f.t}</h4>
                  <p>{f.d}</p>
                </li>
              ))}
            </ul>
            <a className="btn-primary" href={APP_URL}>
              Launch the App
            </a>
            <a className="app-url" href={APP_URL}>
              <b>app.citybucketlist.com</b>
            </a>
          </div>

          <div className="device-wrap">
            <div className="device">
              <div className="device-screen">
                <div className="device-notch" />
                <img src={buckeeImage} alt="" />
                <div className="d-kicker">app.citybucketlist.com</div>
                <div className="d-title">
                  Your city, <span className="it">unlocked</span>
                </div>
                <div className="d-sub">Rides, dining, attractions & Buckee — all in one membership.</div>
                <span className="d-cta">Open the app</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Read & browse (Blog + Directory) ── */}
      <section className="band">
        <div className="band-inner">
          <div className="section-eyebrow">more to explore</div>
          <h2 className="section-h2" style={{ marginBottom: 28 }}>
            Read up <span className="it">& browse local</span>
          </h2>
          <div className="more-grid">
            <Link to="/blog" className="more-card">
              <img src={blogImage} alt="" />
              <div className="overlay">
                <div className="tag">CBL Blog</div>
                <h3>Stay in the know</h3>
                <p>Local guides, tips, and stories to plan your next adventure.</p>
                <span className="go">Read now</span>
              </div>
            </Link>
            <a
              href="https://directory.citybucketlist.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="more-card"
            >
              <img src={directoryImage} alt="" />
              <div className="overlay">
                <div className="tag">Directory & Savings</div>
                <h3>Find local businesses</h3>
                <p>Browse the City Bucket List directory and member savings near you.</p>
                <span className="go">Explore directory</span>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="band cta-band">
        <div className="band-inner">
          <h2>
            What's on <span className="it">your bucket list?</span>
          </h2>
          <p>Join free and let locals everywhere help you feel at home — in any city you visit.</p>
          <a className="btn-primary" href={APP_URL}>
            Join City Bucket List
          </a>
        </div>
      </section>
    </main>
  );
}
