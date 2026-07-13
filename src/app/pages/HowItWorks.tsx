import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import riderImage from '../../assets/rider_meeting_driver_neutral.png';
import driverImage from '../../assets/driver_at_wheel.jpg';
import conciergeImage from '../../assets/concierge_professional.jpg';
import driverFace from '../../assets/mock-driver-headshot.jpg'; // Unsplash (free/commercial license) — example driver headshot
import { APP_URL, DRIVER_SIGNUP_URL } from '../lib/constants';
import { Link } from 'react-router';

// Little example of the member digital business card — a driver's shareable card.
function BizCardMock() {
  const [qr, setQr] = useState('');
  useEffect(() => {
    QRCode.toDataURL(`${APP_URL}/r/demo`, { margin: 0, width: 200, color: { dark: '#000000', light: '#FFFFFF' } })
      .then(setQr).catch(() => setQr(''));
  }, []);
  return (
    <div className="bizcard" role="img" aria-label="Example: a driver's CBL digital business card with photo, name, and a scannable QR code">
      <div className="bc-eyebrow">Example — a driver's card</div>
      <div className="bc-top">
        <img src={driverFace} alt="" className="bc-face" />
        <div>
          <div className="bc-verified">★ Verified CBL Driver</div>
          <div className="bc-name">Simone D.</div>
          <div className="bc-role">Airport Runs · Pittsburgh</div>
        </div>
      </div>
      <div className="bc-bottom">
        <div className="bc-qr">{qr && <img src={qr} alt="" />}</div>
        <div className="bc-scan">Scan to <b>connect</b> — or join under Simone's code and she earns.</div>
      </div>
    </div>
  );
}

/**
 * How It Works — re-skinned to match the Explore pages (Travels / Transportation
 * / Eats & Drinks / Attractions) branding: dark canvas, gold (#C99742) accents,
 * Myriad Pro display headers with Playfair Display italic accents, mono eyebrow
 * labels, the shared map-backdrop hero, and the angled-corner card treatment.
 *
 * Copy, images, and the three audience rows (Riders / Drivers / Concierge) are
 * unchanged from the previous version; only the presentation now follows the
 * rest of the new site. Hero backdrop reuses `/eats/imagery/cbl-map-backdrop.jpg`.
 */

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

const HOW_CSS = `
.cbl-how { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-how *,.cbl-how *::before,.cbl-how *::after { box-sizing:border-box; }
.cbl-how button { font-family:inherit; cursor:pointer; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

/* ── Hero band ── */
.cbl-how .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 16px;
}
.cbl-how .hero-inner { max-width:1280px; margin:0 auto; }
.cbl-how .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#fff; font-weight:700; text-transform:lowercase; margin-bottom:10px;
}
.cbl-how .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:#C99742; animation:cbl-pulse 2.4s ease-in-out infinite;
}
.cbl-how h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-how h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-how h1.hero-title .h1-main { color:#fff; white-space:nowrap; }
.cbl-how .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:#C99742;
}
.cbl-how .hero-subtitle .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:#C99742; text-transform:none; letter-spacing:0; font-size:.82em;
}
.cbl-how .hero p.lede { margin-top:14px; max-width:620px; font-size:16px; line-height:1.45; color:#B8B8B8; margin-bottom:20px; }
.cbl-how .hero-cta {
  display:inline-flex; align-items:center; gap:10px;
  background:#C99742; color:#000; border:0;
  padding:14px 28px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:900;
  font-size:14px; letter-spacing:.14em; text-transform:uppercase;
  text-decoration:none; cursor:pointer;
}
.cbl-how .hero-cta:hover { background:#DDB15F; }

/* ── Stats row ── */
.cbl-how .stats {
  display:grid; grid-template-columns:repeat(4,1fr); gap:24px;
  max-width:1280px; margin:0 auto; padding:0 48px 8px;
}
.cbl-how .stat { padding:18px 0; border-top:1px solid rgba(255,255,255,.10); }
.cbl-how .stat .lbl { font-family:${MONO}; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:#8a8a8a; margin-bottom:6px; }
.cbl-how .stat .val { font-family:${DISPLAY}; font-weight:900; font-size:26px; line-height:1; color:#C99742; letter-spacing:-.01em; text-transform:uppercase; }

/* ── Section frame ── */
.cbl-how section.band { padding:48px 48px 56px; }
.cbl-how section.band.tight { padding:28px 48px 36px; }
.cbl-how .band-inner { max-width:1280px; margin:0 auto; }
.cbl-how .section-eyebrow {
  font-family:${MONO}; font-size:12px; color:#C99742;
  letter-spacing:.18em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
}
.cbl-how .section-eyebrow::before { content:''; width:28px; height:1px; background:#C99742; }

/* ── Choice band ── */
.cbl-how .choice {
  background:linear-gradient(135deg, rgba(201,151,66,.14), rgba(201,151,66,.03));
  border:1px solid rgba(201,151,66,.4);
  border-radius:18px 0 18px 0; padding:26px 30px;
  display:grid; grid-template-columns:auto 1fr auto; gap:24px; align-items:center;
}
.cbl-how .choice .mark {
  width:52px; height:52px; border-radius:50%;
  border:1.5px solid #C99742; color:#C99742;
  display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0;
}
.cbl-how .choice h3 { font-family:${DISPLAY}; font-weight:900; font-size:22px; text-transform:uppercase; letter-spacing:-.005em; margin-bottom:6px; }
.cbl-how .choice p { color:#B0B0B0; font-size:14px; line-height:1.55; max-width:60ch; }
.cbl-how .choice .chips { display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; }
.cbl-how .choice .chip {
  font-family:${MONO}; font-size:11px; letter-spacing:.1em; text-transform:uppercase;
  color:#B8B8B8; border:1px solid rgba(255,255,255,.16); padding:6px 12px; border-radius:999px; white-space:nowrap;
}
.cbl-how .choice .card-chips { margin-top:16px; justify-content:flex-start; }
/* Share-Your-Card variant: no ✦ mark column — copy fills the width, card on the right. */
.cbl-how .card-choice { grid-template-columns:1fr auto; }
.cbl-how .bizcard {
  width:262px; max-width:100%; flex-shrink:0; background:linear-gradient(180deg,#161616,#0c0c0c);
  border:1px solid rgba(201,151,66,.4); border-radius:16px 0 16px 0; padding:18px; box-shadow:0 14px 40px rgba(0,0,0,.5);
}
.cbl-how .bizcard .bc-eyebrow { font-family:${MONO}; font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:#C99742; margin-bottom:12px; }
.cbl-how .bizcard .bc-top { display:flex; gap:12px; align-items:center; margin-bottom:14px; }
.cbl-how .bizcard .bc-face { width:54px; height:54px; border-radius:50%; object-fit:cover; object-position:top center; border:2px solid #C99742; flex-shrink:0; }
.cbl-how .bizcard .bc-verified { font-family:${MONO}; font-size:9px; letter-spacing:.06em; text-transform:uppercase; color:#8FE0A2; margin-bottom:3px; }
.cbl-how .bizcard .bc-name { font-family:${DISPLAY}; font-weight:800; font-size:16px; color:#fff; line-height:1.1; }
.cbl-how .bizcard .bc-role { font-size:11.5px; color:#9a9a9a; margin-top:2px; }
.cbl-how .bizcard .bc-bottom { display:flex; gap:12px; align-items:center; border-top:1px solid rgba(255,255,255,.08); padding-top:14px; }
.cbl-how .bizcard .bc-qr { width:66px; height:66px; background:#fff; border-radius:8px; padding:5px; flex-shrink:0; }
.cbl-how .bizcard .bc-qr img { width:100%; height:100%; display:block; }
.cbl-how .bizcard .bc-scan { font-size:12px; color:#C8C8C8; line-height:1.4; }
.cbl-how .bizcard .bc-scan b { color:#C99742; }

/* ── Audience rows ── */
.cbl-how .row {
  display:grid; grid-template-columns:1fr 1fr; gap:0;
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; overflow:hidden;
  transition:transform .35s, border-color .35s;
  animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both;
}
.cbl-how .row:hover { border-color:rgba(201,151,66,.45); }
.cbl-how .row.reverse .row-media { order:2; }
.cbl-how .row-media { position:relative; min-height:380px; }
.cbl-how .row-media img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
.cbl-how .row-media .num {
  position:absolute; top:18px; left:18px; z-index:2;
  width:54px; height:54px; border-radius:50%;
  background:#C99742; color:#000;
  font-family:${DISPLAY}; font-weight:900; font-size:22px;
  display:flex; align-items:center; justify-content:center;
}
.cbl-how .row-body { padding:38px 44px; display:flex; flex-direction:column; gap:14px; }
.cbl-how .row-body .kicker { font-family:${MONO}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#C99742; }
.cbl-how .row-body h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(28px,3vw,40px); line-height:.98;
  letter-spacing:-.01em; text-transform:uppercase;
}
.cbl-how .row-body h2 .it {
  font-family:${ITALIC}; font-style:italic; color:#C99742;
  font-weight:600; text-transform:none; font-size:.7em; margin-left:6px;
}
.cbl-how .row-body .lede { color:#B0B0B0; font-size:15px; line-height:1.6; }
.cbl-how .callout {
  background:#0A0A0A; border-left:3px solid #C99742;
  border-radius:0 12px 12px 0; padding:14px 16px;
}
.cbl-how .callout p { color:#C8C8C8; font-size:13px; line-height:1.55; margin:0; }
.cbl-how .callout b { color:#C99742; }
.cbl-how ol.steps { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:10px; }
.cbl-how ol.steps li { display:flex; gap:12px; align-items:flex-start; color:#C8C8C8; font-size:14px; line-height:1.45; }
.cbl-how ol.steps li .n {
  flex-shrink:0; width:24px; height:24px; border-radius:50%;
  border:1.5px solid #C99742; color:#C99742;
  font-family:${MONO}; font-size:11px; font-weight:700;
  display:flex; align-items:center; justify-content:center; margin-top:1px;
}
.cbl-how .btn-row { display:flex; flex-wrap:wrap; gap:10px; margin-top:4px; }
.cbl-how .btn {
  display:inline-flex; align-items:center;
  background:#C99742; color:#000; border:0;
  padding:11px 22px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800;
  font-size:12px; letter-spacing:.12em; text-transform:uppercase;
  text-decoration:none; cursor:pointer;
}
.cbl-how .btn:hover { background:#DDB15F; }
.cbl-how .btn.ghost { background:transparent; color:#C99742; border:1px solid rgba(201,151,66,.5); }
.cbl-how .btn.ghost:hover { background:rgba(201,151,66,.12); }

/* ── Responsive ── */
@media (max-width:1100px){
  .cbl-how .hero { padding:22px 24px 16px; }
  .cbl-how .stats { grid-template-columns:repeat(2,1fr); padding:0 24px 8px; }
  .cbl-how section.band { padding:48px 24px; }
  .cbl-how .choice { grid-template-columns:1fr; }
  .cbl-how .choice .chips { justify-content:flex-start; }
  .cbl-how .row { grid-template-columns:1fr; }
  .cbl-how .row.reverse .row-media { order:0; }
  .cbl-how .row-media { min-height:260px; }
  .cbl-how .row-body { padding:28px 24px; }
}
`;

type Audience = {
  num: string;
  reverse?: boolean;
  img: string;
  alt: string;
  kicker: string;
  title: React.ReactNode;
  lede: string;
  callout: React.ReactNode;
  steps: string[];
  primary: string;
  secondary: string;
  /** Optional targets for the primary/secondary buttons. `*To` renders an
   * internal react-router <Link>; `*Href` renders an external <a>; if neither
   * is set the button stays a plain (inert) button. */
  primaryTo?: string;
  secondaryTo?: string;
  primaryHref?: string;
  secondaryHref?: string;
};

const AUDIENCES: Audience[] = [
  {
    num: '01',
    img: riderImage,
    alt: 'Rider in back seat',
    kicker: 'For Riders',
    title: (
      <>
        Ride with a driver <span className="it">you've already met</span>
      </>
    ),
    lede:
      'CBL rides are scheduled, private, and arranged directly with a driver you know. Every CBL rider was invited by their driver — in person, in the car, via QR code.',
    callout: (
      <p>
        <b>How membership works today →</b> You become a CBL rider when a driver invites you. Scan
        their QR code, sign up as a Private Membership Association member, and you're set to schedule
        rides with that driver going forward.
      </p>
    ),
    steps: [
      'Meet your independent driver in person — in their car',
      'Scan their QR code to sign up as a PMA member',
      'Schedule rides with your driver, on your time',
      'Use any on-demand rideshare for one-off trips',
    ],
    primary: 'Learn About Membership',
    secondary: 'How to Find a Driver',
    primaryTo: '/faq',
    secondaryTo: '/transportation',
  },
  {
    num: '02',
    reverse: true,
    img: driverImage,
    alt: 'Independent driver at the wheel',
    kicker: 'For Independent Drivers',
    title: (
      <>
        Build <span className="it">your own</span> rider network
      </>
    ),
    lede:
      'CBL gives you the tools to bring your own riders on board and run scheduled, private rides — not ping-ponging strangers across town. You keep your full fare. Your riders stay with you.',
    callout: (
      <p>
        <b>Why the QR code →</b> Every driver gets a sign-up QR code. You invite riders in your car,
        they scan, they join your network. From there, they schedule rides directly with you through
        the CBL Private Membership Association.
      </p>
    ),
    steps: [
      'Apply to drive with CBL',
      'Pass background & vehicle checks',
      'Get your driver kit + personal QR code',
      'Invite riders to sign up — right from your car',
      'Schedule private rides with your members',
      'Keep your full fare — no CBL commission',
    ],
    primary: 'Start Driving',
    secondary: 'Driver FAQ',
    primaryHref: DRIVER_SIGNUP_URL,
    secondaryTo: '/faq',
  },
  {
    num: '03',
    img: conciergeImage,
    alt: 'CBL Concierge',
    kicker: 'For Concierge Partners',
    title: (
      <>
        Help drivers <span className="it">grow their network</span>
      </>
    ),
    lede:
      'Concierge Partners are the local backbone — hotels, senior communities, venues, small businesses — that connect riders to independent drivers who fit their needs. When your referrals sign up, drivers earn, riders get a trusted ride, and you share in every trip that follows.',
    callout: (
      <p>
        <b>Your role →</b> You're the bridge. You know who in your community needs reliable,
        scheduled rides — and you introduce them to an independent driver who can serve them for the long
        haul.
      </p>
    ),
    steps: [
      'Apply as a concierge partner',
      'Complete short onboarding',
      'Match your customers with an independent driver',
      'Drivers onboard them via QR code sign-up',
      'Earn a share on every ride from your referrals',
    ],
    primary: 'Become a Partner',
    secondary: 'Partner Benefits',
    primaryHref: `${APP_URL}/partner/signup`,
    secondaryTo: '/concierge',
  },
];

function AudienceRow({ a }: { a: Audience }) {
  return (
    <div className={'row' + (a.reverse ? ' reverse' : '')}>
      <div className="row-media">
        <span className="num">{a.num}</span>
        <img src={a.img} alt={a.alt} />
      </div>
      <div className="row-body">
        <span className="kicker">{a.kicker}</span>
        <h2>{a.title}</h2>
        <p className="lede">{a.lede}</p>
        <div className="callout">{a.callout}</div>
        <ol className="steps">
          {a.steps.map((s, i) => (
            <li key={s}>
              <span className="n">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <div className="btn-row">
          {a.primaryTo ? (
            <Link className="btn" to={a.primaryTo}>{a.primary}</Link>
          ) : a.primaryHref ? (
            <a className="btn" href={a.primaryHref}>{a.primary}</a>
          ) : (
            <button className="btn">{a.primary}</button>
          )}
          {a.secondaryTo ? (
            <Link className="btn ghost" to={a.secondaryTo}>{a.secondary}</Link>
          ) : a.secondaryHref ? (
            <a className="btn ghost" href={a.secondaryHref}>{a.secondary}</a>
          ) : (
            <button className="btn ghost">{a.secondary}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <main className="cbl-how">
      <style>{HOW_CSS}</style>

      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">private membership association · scheduled rides</div>
          <h1 className="hero-title">
            <span className="title-stack">
              <span className="h1-main">How It Works</span>
              <span className="hero-subtitle">
                <span>Scheduled rides.</span>
                <span className="it">Drivers you know.</span>
              </span>
            </span>
          </h1>
          <p className="lede">
            City Bucket List isn't on-demand. It's a private membership for scheduled rides — where
            drivers build their own network of riders, and riders ride with someone they've already
            met. Need a quick one-off? Use whatever rideshare you like. We're not here to replace
            on-demand apps. We're here to give drivers a network of their own.
          </p>
          <Link className="hero-cta" to="/login">Join CBL — Free for Riders →</Link>
        </div>
      </section>

      <div className="stats">
        <div className="stat">
          <div className="lbl">Ride Type</div>
          <div className="val">Scheduled</div>
        </div>
        <div className="stat">
          <div className="lbl">Structure</div>
          <div className="val">Membership</div>
        </div>
        <div className="stat">
          <div className="lbl">Drivers Keep</div>
          <div className="val">Full Fare</div>
        </div>
        <div className="stat">
          <div className="lbl">Riders Stay</div>
          <div className="val">Free to Choose</div>
        </div>
      </div>

      <section className="band tight">
        <div className="band-inner">
          <div className="choice">
            <div className="mark">✦</div>
            <div>
              <h3>Freedom to Choose</h3>
              <p>
                CBL is one option in your ride mix. Keep your on-demand apps, robotaxis, taxis, or
                transit — use whatever fits the trip. We just give drivers a way to run their own
                private rides.
              </p>
            </div>
            <div className="chips">
              <span className="chip">+ Rideshare apps</span>
              <span className="chip">+ Robotaxis</span>
              <span className="chip">+ Taxis</span>
              <span className="chip">+ Transit</span>
            </div>
          </div>
        </div>
      </section>

      <section className="band" style={{ paddingTop: 0 }}>
        <div className="band-inner" style={{ display: 'grid', gap: 24 }}>
          {AUDIENCES.map((a) => (
            <AudienceRow key={a.num} a={a} />
          ))}
        </div>
      </section>

      {/* Share your card, earn as you go — the member referral loop */}
      <section className="band tight" style={{ paddingTop: 0 }}>
        <div className="band-inner">
          <div className="choice card-choice">
            <div>
              <h3>Share Your Card, Earn As You Go</h3>
              <p>
                City Bucket List is a software-as-a-service platform, and every free membership
                comes with a digital business card — your profile plus a personal QR code. Share it
                with a restaurant you love, a rider, or a driver worth knowing. When they join under
                your code, you're rewarded — the people and places you already recommend become real
                value for you. Manage your card, and every listing you post, from{' '}
                <a href="/studio" style={{ color: '#C99742', fontWeight: 700 }}>CBL Studio</a> —
                your member hub, one tap from your profile avatar.
              </p>
              <div className="chips card-chips">
                <span className="chip">+ Restaurants</span>
                <span className="chip">+ Riders</span>
                <span className="chip">+ Drivers</span>
                <span className="chip">+ Local spots</span>
              </div>
            </div>
            <BizCardMock />
          </div>
        </div>
      </section>
    </main>
  );
}
