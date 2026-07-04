import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import conciergeImage from '../../assets/9b0fc11a5ef647d02d147f7c1dee023bd105e175.png';
import transportationImage from '../../assets/0c14cb1865bf0ca612f6fcb9d74d4ff3578188ac.png';
import eatsImage from '../../assets/5f602f7d30b9658349675aa8836bb8d75594e226.png';
import attractionsImage from '../../assets/e04fa8d75cf2828287ef82f02beaae9386ee6f52.png';
import blogImage from '../../assets/cbl_blog_slide.png';
import directoryImage from '../../assets/cbl_directory_slide.png';
import buckeeImage from '../../assets/buckee.png';
import buckeeServerImg from '../../assets/buckee_server.png';
import cittyImage from '../../assets/citty.png';
import listyImage from '../../assets/listy.png';
import riderDashboardImg from '../../assets/cbl-rider-dashboard.png';
import { APP_URL, BUCKEE_PUBLIC_URL, SUPABASE_ANON_KEY } from '../lib/constants';
import { JoinModal } from '../components/JoinModal';

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
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';


type Slide = {
  key: string;
  image: string;
  alt: string;
  headline: React.ReactNode;
  caption: React.ReactNode;
  /** Optional CSS object-position for the hero image (e.g. to keep a subject
   * that sits near the top from being cropped in the short mobile banner). */
  imgPos?: string;
};

const SLIDES: Slide[] = [
  {
    key: 'transportation',
    image: transportationImage,
    alt: 'Transportation Services',
    headline: (
      <>
        <span className="ln">Need a ride?</span>{' '}
        <span className="ln">Arrive safe.</span>{' '}
        <span className="ln gold">Save more.</span>
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
    key: 'travels',
    image: conciergeImage,
    alt: 'Hotel Concierge Services',
    headline: (
      <>
        <span className="ln">Travel smart.</span>{' '}
        <span className="ln">Live local.</span>{' '}
        <span className="ln gold">Save more.</span>
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
    key: 'eats',
    image: eatsImage,
    alt: 'Dining and Restaurants',
    imgPos: '50% 18%', // keep the waiter's head from being cropped in the short mobile banner
    headline: (
      <>
        <span className="ln">Hungry?</span>{' '}
        <span className="ln">Eat local.</span>{' '}
        <span className="ln gold">Save more.</span>
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
        <span className="ln">Bored?</span>{' '}
        <span className="ln">Explore local.</span>{' '}
        <span className="ln gold">Save more.</span>
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
        <span className="ln">Stay in the</span>{' '}
        <span className="ln">know.</span>{' '}
        <span className="ln gold">Read local.</span>
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
        <span className="ln">Find local</span>{' '}
        <span className="ln">businesses.</span>{' '}
        <span className="ln gold">Connect more.</span>
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
  { key: 'transportation', label: 'Transportation', to: '/transportation' },
  { key: 'travels', label: 'Travels', to: '/travels' },
  { key: 'eats', label: 'Eats & Drinks', to: '/eats-and-drinks' },
  { key: 'attractions', label: 'Attractions', to: '/attractions' },
];

const APP_FEATURES = [
  { t: 'Meet Buckee', d: 'Your AI travel buddy builds personalized itineraries and local insider tips on demand.' },
  { t: 'Book in seconds', d: 'Trusted rides, dining, and attractions — all from one membership, on any device.' },
  { t: 'Your preferred driver', d: 'Schedule and message your own private driver, right from the dashboard.' },
  { t: 'Share your QR code', d: 'Invite friends and family into your circle with one tap — everyone saves.' },
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
    <g transform="translate(35, 35) scale(1.4) translate(-151.67, -85.68)" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M170.53,69.41c1.35.94-.05,4-1.36,5.82s-7.37,6.76-7.37,6.76l4.29,19.04-1.82,1.85-8.28-15.65-8.33,7.92,1.46,6.91-1.06.81-3.99-6.46" />
      <path d="M170.87,69.76c-.94-1.35-4,.05-5.82,1.36s-6.76,7.37-6.76,7.37l-19.04-4.29-1.85,1.82,15.65,8.28-7.92,8.33-6.91-1.46-.81,1.06,6.46,3.99" />
    </g>
  ),
  transportation: (
    <g transform="translate(35, 35) scale(1.4) translate(-372, -86)" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
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
  ),
  eats: (
    <g transform="translate(35, 35) scale(1.4) translate(-653.6, -81.7)" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M649.18,85.45l-2.49-2.49-.96.96c-.66.66-1.74.64-2.42-.04l-7.75-7.75c-2.78-2.78-2.85-7.23-.15-9.93h0s14.02,14.02,14.02,14.02l2.9,2.9" />
      <path d="M655.18,85.98l9.64,9.64c.78.78.8,2.02.04,2.78s-2,.74-2.78-.04l-9.75-9.75" />
      <path d="M672.1,72.94l-9.67,9.67c-1.13,1.13-2.97,1.13-4.1,0l-16.91,16.91c-.73.73-1.91.73-2.64,0h0c-.73-.73-.73-1.91,0-2.64l16.91-16.91c-1.13-1.13-1.13-2.97,0-4.1l9.67-9.67" />
      <line x1="667.56" y1="68.39" x2="659.53" y2="76.42" />
      <line x1="669.82" y1="70.66" x2="661.79" y2="78.68" />
    </g>
  ),
  attractions: (
    <g transform="translate(35, 35) scale(1.4) translate(-931, -81.8)" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="937.26" cy="70.09" r="3.21" />
      <circle cx="924.32" cy="76.27" r="3.21" />
      <path d="M937.26,63.3s-7.16.45-7.16,7.46,7.16,11.74,7.16,11.74c0,0,6.95-4.37,6.95-12.2,0-7.03-6.95-7-6.95-7Z" />
      <path d="M913.5,86.82c-.27-1.22-.3-1.96-.3-3.26,0-8.81,6.42-16.12,14.84-17.5" />
      <path d="M946.34,74.75c1.49,2.6,2.34,5.6,2.34,8.81,0,1.6-.21,3.15-.61,4.63" />
      <path d="M932.77,90.34s4.64-4.96,5.88-4.92c1.78.06,8.17,6.05,8.17,6.05-2.78,6.15-8.69,9.83-15.88,9.83-7.62,0-14.12-4.8-16.63-11.55,0,0,6.73-7.26,8.44-7.25,1.07,0,1.55.13,4.78,3.33,3.22,3.2,12.59,12.16,12.59,12.16" />
    </g>
  ),
  blog: (
    <g transform="translate(50, 50) scale(1.45) translate(-73, -71)" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M49.9,87.54l4.34-8.68s-7.49-6.21-6.3-14.09c1.19-7.88,10.73-14.86,22.99-14.86s24.18,6.81,24.18,16.01-9.71,21.12-33.38,16.52c-5.45,2.21-11.83,5.11-11.83,5.11Z" />
      <path d="M75.35,83.96c3.93,2.21,10.41,2.89,14.55.9,5.45,2.21,11.83,5.11,11.83,5.11l-4.34-8.68s5.73-2.05,4.54-9.92c0,0-1.02-5.92-6.81-7.39" />
      <circle fill="currentColor" stroke="none" cx="62.56" cy="66.35" r="2.37" />
      <circle fill="currentColor" stroke="none" cx="72.97" cy="66.35" r="2.37" />
      <circle fill="currentColor" stroke="none" cx="83.39" cy="66.35" r="2.37" />
    </g>
  ),
  directory: (
    <g transform="translate(50, 50) scale(1.45) translate(-74, -72)" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
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
  color:#fff; font-weight:700; text-transform:lowercase; margin-bottom:14px;
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
.cbl-home h1.hero-title .ln { display:block; }
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
.cbl-home .btn-ghost {
  display:inline-flex; align-items:center; gap:10px; margin-left:12px;
  background:transparent; color:#fff; border:1.5px solid rgba(255,255,255,.25);
  padding:15px 32px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:900;
  font-size:14px; letter-spacing:.14em; text-transform:uppercase; transition:border-color .2s, color .2s;
}
.cbl-home .btn-ghost:hover { border-color:${GOLD}; color:${GOLD}; }

/* ── Talk to Buckee voice bar ── */
.cbl-home .talk-band { padding:18px 48px 0; }
.cbl-home .talk-wrap { position:relative; max-width:1280px; margin:0 auto; display:flex; align-items:center; gap:20px; }
.cbl-home .buckee-bubble { position:absolute; bottom:calc(100% + 12px); left:0; z-index:20; max-width:560px; background:#141414; border:1px solid rgba(201,151,66,.45); border-radius:18px 18px 18px 0; padding:16px 20px; box-shadow:0 18px 44px rgba(0,0,0,.55); animation:cbl-bubble-pop .26s cubic-bezier(.2,.9,.3,1.25) both; }
.cbl-home .buckee-bubble::after { content:''; position:absolute; bottom:-9px; left:30px; width:18px; height:18px; background:#141414; border-right:1px solid rgba(201,151,66,.45); border-bottom:1px solid rgba(201,151,66,.45); transform:rotate(45deg); }
.cbl-home .bubble-eyebrow { font-family:${MONO}; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:${GOLD}; margin-bottom:6px; }
.cbl-home .bubble-text { font-size:16px; line-height:1.45; color:#EAEAEA; margin-bottom:12px; }
.cbl-home .bubble-chips { display:flex; flex-wrap:wrap; gap:8px; }
.cbl-home .bubble-chips button { background:rgba(201,151,66,.10); border:1px solid rgba(201,151,66,.4); color:#F0D9A8; border-radius:999px; padding:7px 14px; font-family:${DISPLAY}; font-weight:700; font-size:13px; cursor:pointer; transition:background .2s, color .2s, border-color .2s; }
.cbl-home .bubble-chips button:hover { background:${GOLD}; color:#000; border-color:${GOLD}; }
@keyframes cbl-bubble-pop { 0% { opacity:0; transform:translateY(8px) scale(.96); } 100% { opacity:1; transform:translateY(0) scale(1); } }
@media (max-width:1000px) { .cbl-home .buckee-bubble { max-width:none; right:0; } }
.cbl-home .talk-buckee { width:100px; height:100px; flex-shrink:0; object-fit:contain; filter:drop-shadow(0 10px 22px rgba(0,0,0,.5)); }
.cbl-home .talk-card { flex:1; display:flex; align-items:center; gap:20px; background:linear-gradient(180deg, rgba(201,151,66,.10) 0%, #141414 100%); border:1px solid rgba(201,151,66,.35); border-radius:18px 0 18px 0; padding:16px 22px; }
.cbl-home .mic-btn { flex-shrink:0; width:64px; height:64px; border-radius:50%; border:0; background:${GOLD}; color:#000; display:grid; place-items:center; box-shadow:0 0 0 6px rgba(201,151,66,.12); transition:transform .2s, background .2s; }
.cbl-home .mic-btn:hover { transform:scale(1.05); background:#DDB15F; }
.cbl-home .mic-btn svg { width:24px; height:24px; }
.cbl-home .talk-text { flex:1; min-width:0; }
.cbl-home .talk-eyebrow { font-family:${MONO}; font-size:12px; letter-spacing:.18em; text-transform:uppercase; color:${GOLD}; margin-bottom:4px; }
.cbl-home .talk-lede { font-size:18px; line-height:1.3; color:#E8E8E8; }
.cbl-home .lang-chips { display:flex; gap:8px; flex-shrink:0; }
.cbl-home .lang-chip { min-width:48px; padding:8px 12px; border-radius:10px; cursor:pointer; font-family:${DISPLAY}; font-weight:800; font-size:14px; letter-spacing:.08em; background:transparent; border:1px solid rgba(255,255,255,.18); color:#888; transition:all .2s; }
.cbl-home .lang-chip:hover { border-color:rgba(201,151,66,.5); color:#fff; }
.cbl-home .lang-chip.active { background:${GOLD}; border-color:${GOLD}; color:#000; }

/* ── Talk to Buckee: teaser chat panel ── */
.cbl-home .buckee-chat {
  position:absolute; bottom:calc(100% + 12px); left:0; right:0; z-index:20; max-width:560px;
  background:#141414; border:1px solid rgba(201,151,66,.45); border-radius:18px 18px 18px 0;
  padding:12px 14px; box-shadow:0 18px 44px rgba(0,0,0,.55);
  display:flex; flex-direction:column; gap:10px;
  animation:cbl-bubble-pop .26s cubic-bezier(.2,.9,.3,1.25) both;
}
.cbl-home .buckee-chat-head { display:flex; align-items:center; justify-content:space-between; }
.cbl-home .buckee-chat-close { background:transparent; border:0; color:#888; cursor:pointer; font-size:13px; line-height:1; padding:2px 4px; }
.cbl-home .buckee-chat-close:hover { color:#fff; }
.cbl-home .buckee-chat-scroll { display:flex; flex-direction:column; gap:8px; max-height:280px; overflow-y:auto; padding-right:4px; }
.cbl-home .bmsg { max-width:86%; padding:9px 13px; border-radius:14px; font-size:14px; line-height:1.4; word-wrap:break-word; }
.cbl-home .bmsg.buckee { align-self:flex-start; background:rgba(201,151,66,.12); border:1px solid rgba(201,151,66,.25); color:#EDEDED; border-bottom-left-radius:4px; }
.cbl-home .bmsg.me { align-self:flex-end; background:${GOLD}; color:#111; font-weight:600; border-bottom-right-radius:4px; }
.cbl-home .bmsg.typing { display:inline-flex; gap:4px; align-items:center; }
.cbl-home .bmsg.typing span { width:6px; height:6px; border-radius:50%; background:${GOLD}; opacity:.5; animation:cbl-typing 1s infinite; }
.cbl-home .bmsg.typing span:nth-child(2){ animation-delay:.15s; }
.cbl-home .bmsg.typing span:nth-child(3){ animation-delay:.3s; }
@keyframes cbl-typing { 0%,100%{ opacity:.3; transform:translateY(0);} 50%{ opacity:1; transform:translateY(-3px);} }
.cbl-home .buckee-input { display:flex; gap:8px; }
.cbl-home .buckee-input input { flex:1; min-width:0; background:#0A0A0A; border:1px solid rgba(255,255,255,.15); border-radius:999px; padding:10px 16px; color:#fff; font-size:14px; outline:none; }
.cbl-home .buckee-input input:focus { border-color:${GOLD}; }
.cbl-home .buckee-send { flex-shrink:0; width:40px; height:40px; border-radius:50%; border:0; background:${GOLD}; color:#111; font-size:18px; font-weight:900; cursor:pointer; }
.cbl-home .buckee-send:disabled { opacity:.4; cursor:default; }
.cbl-home .buckee-gate { display:flex; flex-direction:column; gap:10px; align-items:flex-start; }
.cbl-home .buckee-gate-text { font-size:14px; color:#EDEDED; }
.cbl-home .mic-btn.listening { animation:cbl-mic-pulse 1.2s ease-in-out infinite; }
@keyframes cbl-mic-pulse { 0%,100%{ box-shadow:0 0 0 6px rgba(201,151,66,.12);} 50%{ box-shadow:0 0 0 13px rgba(201,151,66,.22);} }
/* Buckee walk-in + idle bob (triggered when the bar scrolls into view) */
.cbl-home .talk-buckee-wrap { display:inline-flex; opacity:0; }
.cbl-home .talk-band.talk-in .talk-buckee-wrap { animation:cbl-buckee-in .85s cubic-bezier(.2,.85,.3,1) forwards; }
.cbl-home .talk-band.talk-in .talk-buckee { animation:cbl-buckee-bob 3.4s ease-in-out .95s infinite; }
@keyframes cbl-buckee-in {
  0%   { transform:translateX(-60px); opacity:0; }
  30%  { transform:translateX(-30px) translateY(-6px); opacity:1; }
  55%  { transform:translateX(-14px) translateY(0); }
  78%  { transform:translateX(-4px) translateY(-4px); }
  100% { transform:translateX(0) translateY(0); opacity:1; }
}
@keyframes cbl-buckee-bob { 0%,100% { transform:translateY(0) rotate(0deg); } 50% { transform:translateY(-6px) rotate(-2.5deg); } }
@media (prefers-reduced-motion: reduce) {
  .cbl-home .talk-buckee-wrap { opacity:1 !important; animation:none !important; }
  .cbl-home .talk-band.talk-in .talk-buckee { animation:none !important; }
}
@media (max-width:1000px) {
  .cbl-home .talk-band { padding:14px 22px 0; }
  .cbl-home .talk-wrap { flex-direction:column; gap:14px; }
  .cbl-home .talk-buckee { width:84px; height:84px; }
  .cbl-home .talk-card { flex-wrap:wrap; gap:14px; width:100%; }
  .cbl-home .talk-text { flex:1 1 auto; }
  .cbl-home .lang-chips { width:100%; }
  .cbl-home .lang-chip { flex:1; }
}

/* ── Meet the Buckee Family teaser ── */
.cbl-home .family-band-inner { display:flex; align-items:center; gap:48px; }
.cbl-home .family-copy { flex:1; }
.cbl-home .family-copy .btn-primary { margin-top:6px; }
.cbl-home .family-figs { flex:0 0 auto; display:flex; align-items:flex-end; justify-content:flex-end; }
.cbl-home .family-figs img {
  height:220px; width:auto; display:block;
  filter:drop-shadow(0 16px 28px rgba(0,0,0,.55));
}
.cbl-home .family-figs img:not(:first-child) { margin-left:-14px; }
@media (max-width:1000px) {
  .cbl-home .family-band-inner { flex-direction:column; align-items:flex-start; gap:20px; }
  .cbl-home .family-figs { align-self:center; }
  .cbl-home .family-figs img { height:150px; }
}

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
  display:inline-flex; align-items:center; gap:12px;
  padding:7px 22px 7px 16px; border-radius:999px;
  border:1.5px solid rgba(255,255,255,.22); background:transparent;
  color:#fff; font-family:${DISPLAY}; font-weight:800;
  font-size:12px; letter-spacing:.1em; text-transform:uppercase;
  transition:border-color .25s, color .25s, background .25s;
}
.cbl-home .chip-ic {
  width:38px; height:38px; flex-shrink:0;
  display:inline-flex; align-items:center; justify-content:center;
}
.cbl-home .chip-ic svg { width:100%; height:100%; display:block; }
.cbl-home .chip:hover { border-color:${GOLD}; color:${GOLD}; }
.cbl-home .chip.active { border-color:${GOLD}; color:${GOLD}; background:rgba(201,151,66,.1); }
/* Mobile-only big icon row (rendered under the hero image); hidden on desktop */
.cbl-home .mobile-icon-row { display:none; }

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

/* ── App showcase band ── */
.cbl-home .app-band {
  background:
    radial-gradient(ellipse at 80% 0%, rgba(201,151,66,.1), transparent 55%),
    linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%);
  border-bottom:1px solid rgba(201,151,66,.18);
}
.cbl-home .app-grid { display:grid; grid-template-columns:1fr 1fr; gap:48px; align-items:center; }
.cbl-home .app-features { list-style:none; margin:24px 0 28px; padding:0; display:flex; flex-direction:column; gap:18px; }
.cbl-home .app-features li { position:relative; padding-left:26px; }
.cbl-home .app-features li::before { content:''; position:absolute; left:0; top:9px; width:14px; height:1.5px; background:${GOLD}; }
.cbl-home .app-features h4 { font-family:${DISPLAY}; font-weight:900; font-size:18px; text-transform:uppercase; letter-spacing:-.005em; margin:0 0 3px; }
.cbl-home .app-features p { color:#A8A8A8; font-size:14px; line-height:1.5; margin:0; }
.cbl-home .app-actions { display:flex; align-items:center; gap:24px; flex-wrap:wrap; margin-top:28px; }
.cbl-home .app-url { display:inline-block; font-family:${MONO}; font-size:13px; letter-spacing:.06em; color:#8a8a8a; }
.cbl-home .app-url b { color:${GOLD}; font-weight:600; }

/* Real Rider Dashboard phone mockup — transparent PNG (886×1866, ~2x retina),
   shown at roughly half its pixel width so it stays crisp on retina screens.
   Transparent bg sits flush on the black band; drop-shadow lifts it off. */
.cbl-home .device-wrap { display:flex; justify-content:center; }
.cbl-home .app-phone {
  width:min(100%, 420px); height:auto; display:block;
  filter:drop-shadow(0 30px 60px rgba(0,0,0,.6));
  animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both;
}
/* ── Explore-more cards (Blog + Directory) ── */
.cbl-home .more-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
.cbl-home .more-card {
  position:relative; overflow:hidden; min-height:340px;
  border:1px solid rgba(255,255,255,.08); border-radius:18px 0 18px 0;
  display:flex; flex-direction:column;
  transition:transform .3s, border-color .3s;
  animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both;
}
.cbl-home .more-card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.45); }
.cbl-home .more-card:hover img { transform:scale(1.04); }
.cbl-home .more-card img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:transform .4s ease; }
.cbl-home .more-card .overlay {
  position:absolute; inset:0; z-index:1; padding:26px 28px;
  background:linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,.45) 40%, rgba(10,10,10,.95) 100%);
  display:flex; flex-direction:column; justify-content:flex-end;
}
.cbl-home .more-card .tag { font-family:${MONO}; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:${GOLD}; text-shadow:0 1px 2px rgba(0,0,0,0.6); }
.cbl-home .more-card h3 { font-family:${DISPLAY}; font-weight:900; font-size:28px; line-height:1; text-transform:uppercase; letter-spacing:-.005em; margin:6px 0 6px; text-shadow:0 2px 4px rgba(0,0,0,0.7); }
.cbl-home .more-card p { color:#C0C0C0; font-size:13px; line-height:1.5; margin:0 0 12px; text-shadow:0 1px 2px rgba(0,0,0,0.6); }
.cbl-home .more-card .go { display:inline-flex; align-items:center; gap:8px; color:${GOLD}; font-family:${DISPLAY}; font-weight:800; font-size:12px; letter-spacing:.12em; text-transform:uppercase; text-shadow:0 1px 2px rgba(0,0,0,0.6); }

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
  .cbl-home .hero { padding:16px 20px 28px; }
  .cbl-home section.band { padding:48px 22px; }
  .cbl-home .hero-grid { grid-template-columns:1fr; gap:8px; }
  .cbl-home .hero-lede { white-space:normal; font-size:14px; margin-bottom:14px; }
  /* Stack order: image → big icon row → copy (title/lede/CTAs/labeled pills) */
  .cbl-home .hero-media { order:1; aspect-ratio:auto; height:clamp(120px,26vh,200px); }
  .cbl-home .mobile-icon-row { order:2; }
  .cbl-home .hero-copy { order:3; text-align:center; } /* center title, lede, CTAs on mobile */
  .cbl-home .hero-media .cap { display:none; } /* caption already shown in the lede */
  /* Large centered title: three consistent lines (one phrase per line) via base .ln{display:block} */
  .cbl-home h1.hero-title { font-size:clamp(36px,7.8vw,52px); margin-bottom:12px; text-align:center; line-height:1.02; }
  .cbl-home .btn-primary { padding:12px 24px; font-size:13px; }
  .cbl-home .btn-ghost { padding:12px 22px; font-size:13px; margin-left:10px; }
  /* Big icon-only row hugging the image (like the live site) */
  .cbl-home .mobile-icon-row { display:flex; flex-wrap:nowrap; justify-content:space-between; align-items:center; gap:8px; margin:2px 0 8px; }
  .cbl-home .micon { flex:0 0 auto; display:inline-flex; color:#fff; font-size:0; transition:color .25s; }
  .cbl-home .micon.active { color:${GOLD}; }
  .cbl-home .micon .chip-ic { width:44px; height:44px; }
  /* Option B: text-only pills, 2-column grid (icons removed, labels centered) */
  .cbl-home .chip-row { margin-top:22px; display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .cbl-home .chip { padding:11px 12px; font-size:11.5px; gap:0; justify-content:center; min-width:0; }
  .cbl-home .chip .chip-ic { display:none; }
  .cbl-home .app-grid { grid-template-columns:1fr; gap:32px; }
  .cbl-home .app-grid .device-wrap { order:-1; }
  .cbl-home .app-phone { width:min(74vw, 360px); }
  .cbl-home .more-grid { grid-template-columns:1fr; }
}
@media (max-width:640px){
  .cbl-home .eyebrow { margin-bottom:6px; font-size:11px; }
  .cbl-home .hero-media { height:clamp(110px,20vh,160px); }
  .cbl-home h1.hero-title { font-size:clamp(34px,10vw,46px); }
  .cbl-home .hero-lede { margin-bottom:10px; }
  /* Tighten CTAs so both stay on one row on small phones */
  .cbl-home .btn-primary { padding:11px 18px; font-size:12px; }
  .cbl-home .btn-ghost { padding:11px 16px; font-size:12px; margin-left:8px; }
  .cbl-home .mobile-icon-row { margin:2px 0 6px; }
  .cbl-home .micon .chip-ic { width:40px; height:40px; }
  .cbl-home .chip-row { margin-top:18px; gap:8px; }
  .cbl-home .chip { padding:10px 10px; font-size:11px; gap:0; letter-spacing:.03em; }
}
`;

export function Home() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);
  const [paused, setPaused] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [talkLang, setTalkLang] = useState('EN');
  const talkRef = useRef<HTMLElement>(null);
  const [buckeeIn, setBuckeeIn] = useState(false);
  useEffect(() => {
    const el = talkRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) { setBuckeeIn(true); obs.disconnect(); } },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  // ── Talk to Buckee: free teaser chat (5 messages, then a signup gate) ──
  const BUCKEE_MAX = 5;
  const BUCKEE_GREETING: Record<string, string> = {
    EN: "Hey, I'm Buckee 👋 Ask me anything about the city.",
    ES: '¡Hola! Soy Buckee 👋 Pregúntame lo que quieras sobre la ciudad.',
    FR: 'Salut, je suis Buckee 👋 Demandez-moi ce que vous voulez sur la ville.',
    PT: 'Oi, eu sou o Buckee 👋 Pergunte o que quiser sobre a cidade.',
  };
  const GATE_LINE: Record<string, string> = {
    EN: "I'd love to keep helping — join free and I'm all yours. 💛",
    ES: 'Me encantaría seguir ayudándote: únete gratis y estoy a tu disposición. 💛',
    FR: "J'adorerais continuer à vous aider — inscrivez-vous gratuitement et je suis à vous. 💛",
    PT: 'Adoraria continuar ajudando — cadastre-se grátis e estou à disposição. 💛',
  };
  const LANG_LOCALE: Record<string, string> = { EN: 'en-US', ES: 'es-ES', FR: 'fr-FR', PT: 'pt-BR' };

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);
  const [gated, setGated] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Persist the teaser count so a refresh doesn't reset it.
    if (Number(localStorage.getItem('buckee_teaser_count') || '0') >= BUCKEE_MAX) setGated(true);
  }, []);

  const startMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { chatInputRef.current?.focus(); return; } // graceful fallback: just focus the input
    try {
      const rec = new SR();
      rec.lang = LANG_LOCALE[talkLang] || 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e: any) => {
        const t = e.results?.[0]?.[0]?.transcript || '';
        setChatInput((prev) => (prev ? prev + ' ' : '') + t);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
      setListening(true);
      rec.start();
    } catch { setListening(false); chatInputRef.current?.focus(); }
  };

  const onMicClick = () => {
    setChatOpen(true);
    if (listening) { recognitionRef.current?.stop?.(); setListening(false); return; }
    startMic();
    setTimeout(() => chatInputRef.current?.focus(), 60);
  };

  const sendMessage = async (text: string) => {
    const content = text.trim();
    if (!content || sending || gated) return;
    const prevCount = Number(localStorage.getItem('buckee_teaser_count') || '0');
    if (prevCount >= BUCKEE_MAX) { setGated(true); return; }

    const nextMessages = [...messages, { role: 'user' as const, content }];
    setMessages(nextMessages);
    setChatInput('');
    setSending(true);
    const newCount = prevCount + 1;
    localStorage.setItem('buckee_teaser_count', String(newCount));

    let replyText = '';
    let limit = false;
    try {
      const res = await fetch(BUCKEE_PUBLIC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ messages: nextMessages, language: talkLang }),
      });
      const data = await res.json();
      replyText = data?.message || '…';
      limit = !!data?.limitReached;
    } catch {
      // Endpoint not deployed yet (or offline) — graceful fallback so the flow still demos.
      replyText = "I'm just warming up — I'll have real answers the moment we go live. What else are you curious about? 😊";
    }
    setMessages((m) => [...m, { role: 'assistant', content: replyText }]);
    setSending(false);
    if (limit || newCount >= BUCKEE_MAX) setGated(true);
    setTimeout(() => chatScrollRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 60);
  };

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
        setFading(false);
      }, 300);
    }, 4000);
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
      <section className="hero">
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
              <button className="btn-primary" onClick={() => setJoinOpen(true)}>
                Join Now — Free
              </button>
              <Link className="btn-ghost" to="/login">
                Sign In
              </Link>

              {/* Category + link chips, highlighting in sync with the rotation */}
              <div
                className="chip-row"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
              >
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

            <div
              className="hero-media"
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="frame" style={fadeStyle}>
                <img src={slide.image} alt={slide.alt} style={{ objectPosition: slide.imgPos ?? 'center' }} />
                <div className="cap">{slide.caption}</div>
              </div>
            </div>

            {/* Mobile-only: big icon row directly under the hero image (labels hidden via CSS) */}
            <div className="mobile-icon-row">
              {CATEGORIES.map((c, i) => (
                <Link
                  key={c.key}
                  to={c.to}
                  className={'micon' + (current === i ? ' active' : '')}
                  onMouseEnter={() => goTo(i)}
                >
                  <ChipIcon k={c.key} />
                  {c.label}
                </Link>
              ))}
              <Link to="/blog" className={'micon' + (current === 4 ? ' active' : '')} onMouseEnter={() => goTo(4)}>
                <ChipIcon k="blog" />
                CBL Blog
              </Link>
              <a
                href="https://directory.citybucketlist.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={'micon' + (current === 5 ? ' active' : '')}
                onMouseEnter={() => goTo(5)}
              >
                <ChipIcon k="directory" />
                Directory
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Talk to Buckee (voice) ── */}
      <section ref={talkRef} className={'band talk-band' + (buckeeIn ? ' talk-in' : '')}>
        <div className="talk-wrap">
          {chatOpen && (
            <div className="buckee-chat" role="log" aria-live="polite">
              <div className="buckee-chat-head">
                <span className="bubble-eyebrow">Buckee</span>
                <button className="buckee-chat-close" aria-label="Close chat" onClick={() => setChatOpen(false)}>✕</button>
              </div>
              <div className="buckee-chat-scroll" ref={chatScrollRef}>
                <div className="bmsg buckee">{BUCKEE_GREETING[talkLang]}</div>
                {messages.map((m, i) => (
                  <div key={i} className={'bmsg ' + (m.role === 'user' ? 'me' : 'buckee')}>{m.content}</div>
                ))}
                {sending && (
                  <div className="bmsg buckee typing"><span></span><span></span><span></span></div>
                )}
              </div>
              {gated ? (
                <div className="buckee-gate">
                  <div className="buckee-gate-text">{GATE_LINE[talkLang]}</div>
                  <a className="btn-primary" href={APP_URL}>Join now — free</a>
                </div>
              ) : (
                <form className="buckee-input" onSubmit={(e) => { e.preventDefault(); sendMessage(chatInput); }}>
                  <input
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={listening ? 'Listening…' : 'Ask Buckee anything…'}
                    maxLength={500}
                    aria-label="Message Buckee"
                  />
                  <button type="submit" className="buckee-send" aria-label="Send" disabled={sending || !chatInput.trim()}>→</button>
                </form>
              )}
            </div>
          )}
          <span className="talk-buckee-wrap">
            <img className="talk-buckee" src={buckeeImage} alt="Buckee, the CityBucketList concierge" />
          </span>
          <div className="talk-card">
            <button className={'mic-btn' + (listening ? ' listening' : '')} aria-label="Talk to Buckee" onClick={onMicClick}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="2.5" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
                <path d="M5 11a7 7 0 0 0 14 0" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="8.5" y1="22" x2="15.5" y2="22" />
              </svg>
            </button>
            <div className="talk-text">
              <div className="talk-eyebrow">Talk to Buckee</div>
              <div className="talk-lede">Your AI concierge — ask him anything about the city.</div>
            </div>
            <div className="lang-chips">
              {['EN', 'ES', 'FR', 'PT'].map((l) => (
                <button
                  key={l}
                  className={'lang-chip' + (talkLang === l ? ' active' : '')}
                  onClick={() => setTalkLang(l)}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Meet the Buckee Family (teaser → /meet-buckee) ── */}
      <section className="band family-band">
        <div className="band-inner family-band-inner">
          <div className="family-copy">
            <div className="section-eyebrow">the buckee family</div>
            <h2 className="section-h2">
              Meet <span className="it">Buckee, Citty &amp; Listy</span>
            </h2>
            <p className="section-lede">
              Your City Bucket List concierge crew. Buckee greets and guides, Citty hosts the food,
              stays and good times, and Listy fetches your rides, tickets and reservations.
            </p>
            <Link className="btn-primary" to="/meet-buckee">
              Meet the family →
            </Link>
          </div>
          <div className="family-figs">
            <img src={buckeeServerImg} alt="Buckee" />
            <img src={cittyImage} alt="Citty" />
            <img src={listyImage} alt="Listy" />
          </div>
        </div>
      </section>

      {/* ── Check out our app (Buckee lives inside the dashboard) ── */}
      <section className="band app-band">
        <div className="band-inner app-grid">
          <div>
            <div className="section-eyebrow">your city, one app</div>
            <h2 className="section-h2">
              Check out <span className="it">our app</span>
            </h2>
            <p className="section-lede">
              Everything City Bucket List does — rides, dining, attractions, stays, and your AI
              travel buddy Buckee — lives in one place. Scan the code or open it on any device and
              start exploring in seconds.
            </p>
            <ul className="app-features">
              {APP_FEATURES.map((f) => (
                <li key={f.t}>
                  <h4>{f.t}</h4>
                  <p>{f.d}</p>
                </li>
              ))}
            </ul>
            <div className="app-actions">
              <a className="btn-primary" href={APP_URL}>
                Launch the App
              </a>
              <a className="app-url" href={APP_URL}>
                <b>app.citybucketlist.com</b>
              </a>
            </div>
          </div>

          <div className="device-wrap">
            <img
              className="app-phone"
              src={riderDashboardImg}
              alt="CityBucketList Rider Dashboard app on a phone — schedule rides, message your preferred driver, and share your referral QR code"
            />
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

      <JoinModal open={joinOpen} onClose={() => setJoinOpen(false)} source="home-hero" />
    </main>
  );
}
