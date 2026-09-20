import appStoreBadge from '../../assets/app/app-store-badge.svg';
import phoneDashboard from '../../assets/app/phone-dashboard.png';
import phoneMessage from '../../assets/app/phone-message.png';
import phoneBuckee from '../../assets/app/phone-buckee.png';
import { APP_URL } from '../lib/constants';

/**
 * Get the App. CityBucketList 1.0 is live on the App Store (Apple ID 6809569228)
 * and the marketing site needed somewhere to say so. Built to the approved mockup
 * at docs/design/app-page-2026-09-19/app-page.html; copy is that mock's, verbatim.
 *
 * Follows the OurStory / Explore page pattern: one scoped CSS string under
 * `.cbl-getapp`, no nav or footer (the shared Layout supplies both), the canonical
 * 1280px column and 48px band padding that keeps every page's left edge aligned.
 *
 * Hierarchy is deliberate (Keith, 2026-09-19): App Store first, the web app as the
 * alternate. Android gets one honest line rather than a badge it cannot deliver.
 *
 * On rides, the page says BOTH things and must keep saying both: CBL rides are
 * scheduled ahead with a private driver, AND the app hands you to Uber or Lyft when
 * you need a car this minute. Never reduce that to "no on-demand".
 *
 * No em-dashes or en-dashes anywhere in this file. Commas, periods, parentheses.
 */

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const APP_STORE_URL = 'https://apps.apple.com/us/app/citybucketlist/id6809569228';

const GETAPP_CSS = `
.cbl-getapp { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-getapp *,.cbl-getapp *::before,.cbl-getapp *::after { box-sizing:border-box; }
.cbl-getapp img { max-width:100%; display:block; }
.cbl-getapp p { text-wrap:pretty; }
.cbl-getapp h1,.cbl-getapp h2,.cbl-getapp h3 { text-wrap:balance; margin:0; }

.cbl-getapp .wrap { max-width:1280px; margin:0 auto; }
.cbl-getapp section.band { padding:48px 48px 56px; }
.cbl-getapp section.band.tight { padding:28px 48px 36px; }

.cbl-getapp .eyebrow {
  display:inline-flex; align-items:center; gap:10px; font-family:${MONO};
  font-size:12px; letter-spacing:.14em; color:#fff; font-weight:700;
  text-transform:lowercase; margin-bottom:12px;
}
.cbl-getapp .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%; background:#C99742;
  animation:cbl-getapp-pulse 2.4s ease-in-out infinite;
}
@keyframes cbl-getapp-pulse { 0%,100%{opacity:1;} 50%{opacity:.35;} }
@media (prefers-reduced-motion:reduce) { .cbl-getapp .eyebrow::before { animation:none; } }
.cbl-getapp .section-eyebrow {
  font-family:${MONO}; font-size:12px; color:#C99742; letter-spacing:.18em;
  text-transform:uppercase; display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
}
.cbl-getapp .section-eyebrow::before { content:''; width:28px; height:1px; background:#C99742; }

/* ── hero ── */
.cbl-getapp .hero {
  position:relative; overflow:hidden; padding:56px 48px 40px;
  background:
    radial-gradient(900px 420px at 20% 0%, rgba(201,151,66,.16), transparent 60%),
    linear-gradient(180deg,#151005 0%,#0A0A0A 70%);
}
.cbl-getapp .hero .grid { display:grid; grid-template-columns:1.15fr .85fr; gap:48px; align-items:center; }
.cbl-getapp h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(52px,7vw,104px);
  line-height:.92; letter-spacing:-.015em; text-transform:uppercase;
}
.cbl-getapp h1.hero-title .gold { color:#C99742; }
.cbl-getapp .hero p.lede { margin-top:18px; max-width:560px; font-size:17px; line-height:1.5; color:#B0B0B0; }
.cbl-getapp .cta { display:flex; align-items:center; gap:22px; flex-wrap:wrap; margin-top:26px; }

/* Apple's own artwork. Their guidelines: at least 40px tall, clear space around it,
   never recolored, never redrawn. Do not add a filter, border or background here. */
.cbl-getapp .badge { display:inline-block; text-decoration:none; line-height:0; }
.cbl-getapp .badge img { height:54px; width:auto; }
.cbl-getapp .badge:focus-visible { outline:2px solid #C99742; outline-offset:4px; border-radius:8px; }

.cbl-getapp .alt { font-size:14px; color:#B0B0B0; }
.cbl-getapp .alt a {
  font-family:${MONO}; font-size:13px; letter-spacing:.04em; color:#C99742;
  text-decoration:none; font-weight:600;
}
.cbl-getapp .alt a:hover { text-decoration:underline; }
.cbl-getapp .note { margin-top:14px; font-size:13px; color:#8A8A8A; }
.cbl-getapp .note b { color:#B0B0B0; font-weight:600; }
.cbl-getapp .device { display:flex; justify-content:center; position:relative; }
.cbl-getapp .device img {
  width:min(340px,100%); border-radius:36px;
  box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 1px #222;
}
.cbl-getapp .device::after {
  content:''; position:absolute; inset:auto 0 -20px 0; height:120px;
  background:radial-gradient(60% 100% at 50% 100%, rgba(201,151,66,.18), transparent 70%);
  pointer-events:none; z-index:-1;
}

/* ── steps ── */
.cbl-getapp .section-h2 {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(38px,4.4vw,60px);
  line-height:.95; letter-spacing:-.01em; text-transform:uppercase; margin:0 0 8px;
}
.cbl-getapp .section-h2 .it {
  font-family:${ITALIC}; font-style:italic; color:#C99742; font-weight:600;
  text-transform:none; font-size:.6em; margin-left:8px;
}
.cbl-getapp .section-lede { color:#B0B0B0; font-size:15px; line-height:1.55; max-width:62ch; margin:0 0 28px; }
.cbl-getapp .steps { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-top:8px; }
.cbl-getapp .step {
  background:#141414; border:1px solid #262626; border-radius:18px; padding:26px 24px 24px;
  position:relative; min-height:230px; display:flex; flex-direction:column; gap:12px;
}
.cbl-getapp .step .n { font-family:${MONO}; font-size:12px; letter-spacing:.18em; color:#C99742; }
.cbl-getapp .step h3 {
  font-family:${DISPLAY}; font-weight:900; font-size:26px; line-height:1;
  text-transform:uppercase; letter-spacing:-.01em;
}
.cbl-getapp .step p { margin:0; color:#B0B0B0; font-size:15px; line-height:1.5; }
.cbl-getapp .step .ic {
  width:52px; height:52px; border-radius:50%; border:2px solid #C99742;
  display:grid; place-items:center; margin-bottom:4px;
}
.cbl-getapp .step .ic svg {
  width:26px; height:26px; stroke:#fff; fill:none; stroke-width:1.8;
  stroke-linecap:round; stroke-linejoin:round;
}
.cbl-getapp .step em { font-style:normal; color:#fff; font-weight:600; }
.cbl-getapp .pill-row { display:flex; gap:10px; flex-wrap:wrap; margin-top:22px; }
.cbl-getapp .pill { border:1px solid #C99742; border-radius:999px; padding:8px 16px; font-size:13px; color:#fff; letter-spacing:.02em; }
.cbl-getapp .pill b { color:#C99742; font-weight:700; }

/* ── feature rows ── */
.cbl-getapp .split { display:grid; grid-template-columns:1fr 1fr; gap:56px; align-items:center; padding:28px 0; }
.cbl-getapp .split.reverse .split-media { order:2; }
.cbl-getapp .split-media { display:flex; justify-content:center; }
.cbl-getapp .split-media img {
  width:min(300px,100%); border-radius:32px;
  box-shadow:0 24px 60px rgba(0,0,0,.55),0 0 0 1px #222;
}
.cbl-getapp .split h3 {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(30px,3.4vw,44px);
  line-height:.98; text-transform:uppercase; letter-spacing:-.01em;
}
.cbl-getapp .split h3 .gold { color:#C99742; }
.cbl-getapp .split p { color:#B0B0B0; font-size:15px; line-height:1.55; max-width:52ch; margin:14px 0 0; }
.cbl-getapp .split ul { margin:18px 0 0; padding:0; list-style:none; display:flex; flex-direction:column; gap:10px; }
.cbl-getapp .split li { display:flex; gap:12px; align-items:flex-start; font-size:15px; color:#fff; }
.cbl-getapp .split li::before { content:''; flex:none; width:9px; height:9px; border-radius:50%; background:#C99742; margin-top:7px; }
.cbl-getapp .split li span { color:#B0B0B0; }

/* ── member strip ── */
.cbl-getapp .strip {
  background:#141414; border:1px solid #262626; border-radius:18px; padding:26px 28px;
  display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap:wrap;
}
.cbl-getapp .strip h3 { font-family:${DISPLAY}; font-weight:900; font-size:24px; text-transform:uppercase; line-height:1; }
.cbl-getapp .strip p { margin:6px 0 0; color:#B0B0B0; font-size:14px; max-width:60ch; }
.cbl-getapp .btn-ghost {
  display:inline-flex; align-items:center; gap:10px; border:1px solid #C99742; color:#fff;
  border-radius:999px; padding:13px 26px; font-weight:700; font-size:14px; letter-spacing:.04em;
  text-transform:uppercase; text-decoration:none; white-space:nowrap;
}
.cbl-getapp .btn-ghost:hover { background:rgba(201,151,66,.14); }
.cbl-getapp .btn-ghost:focus-visible { outline:2px solid #C99742; outline-offset:3px; }

/* ── faq ── */
.cbl-getapp .faq { display:grid; grid-template-columns:1fr 1fr; gap:16px 40px; margin-top:10px; }
.cbl-getapp .q { border-top:1px solid #262626; padding:18px 0 6px; }
.cbl-getapp .q h4 { margin:0 0 6px; font-family:${DISPLAY}; font-weight:700; font-size:18px; }
.cbl-getapp .q p { margin:0; color:#B0B0B0; font-size:14.5px; line-height:1.5; }

/* ── closing band ── */
.cbl-getapp .cta-band {
  border-top:1px solid #262626; padding:56px 48px 64px; text-align:left;
  background:linear-gradient(180deg,#0A0A0A,#120e05);
}
.cbl-getapp .cta-band .wrap { display:grid; grid-template-columns:1.2fr .8fr; gap:40px; align-items:center; }
.cbl-getapp .cta-band h2 {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(40px,5vw,72px);
  line-height:.92; text-transform:uppercase; letter-spacing:-.015em;
}
.cbl-getapp .cta-band h2 .gold { color:#C99742; }
.cbl-getapp .cta-band .cta { justify-content:flex-start; }
.cbl-getapp .cta-band .closing-note { font-size:15px; line-height:1.55; }

@media (max-width:900px) {
  .cbl-getapp .hero,
  .cbl-getapp section.band,
  .cbl-getapp .cta-band { padding-left:24px; padding-right:24px; }
  .cbl-getapp .hero { padding-top:36px; }
  .cbl-getapp .hero .grid { grid-template-columns:1fr; gap:28px; }
  .cbl-getapp .device { order:-1; }
  .cbl-getapp .device img { width:min(260px,100%); }
  .cbl-getapp .steps { grid-template-columns:1fr; }
  .cbl-getapp .step { min-height:0; }
  .cbl-getapp .split,
  .cbl-getapp .split.reverse { grid-template-columns:1fr; gap:24px; }
  .cbl-getapp .split.reverse .split-media { order:0; }
  .cbl-getapp .faq { grid-template-columns:1fr; }
  .cbl-getapp .cta-band .wrap { grid-template-columns:1fr; }
  /* Drop the italic accent to its own line so a headline never leaves one word
     stranded on the last line. Same fix OurStory uses. */
  .cbl-getapp .section-h2 .it { display:block; margin-left:0; }
  .cbl-getapp .split h3 .gold,
  .cbl-getapp .cta-band h2 .gold { display:block; }
}
@media (max-width:480px) {
  .cbl-getapp .hero,
  .cbl-getapp section.band,
  .cbl-getapp .cta-band { padding-left:16px; padding-right:16px; }
}
`;

/** App Store badge. Apple's official artwork, linked out, never recolored. */
function StoreBadge() {
  return (
    <a className="badge" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
      <img src={appStoreBadge} alt="Download CityBucketList on the App Store" />
    </a>
  );
}

/** The App Store badge plus the web-app alternate. Used in the hero and the closing band. */
function CtaRow() {
  return (
    <div className="cta">
      <StoreBadge />
      <div className="alt">
        or open it in your browser
        <br />
        <a href={APP_URL} target="_blank" rel="noopener noreferrer">
          app.citybucketlist.com
        </a>
      </div>
    </div>
  );
}

export function GetTheApp() {
  return (
    <main className="cbl-getapp">
      <style>{GETAPP_CSS}</style>

      <section className="hero">
        <div className="wrap grid">
          <div>
            <div className="eyebrow">now on the app store</div>
            <h1 className="hero-title">
              Your city.
              <br />
              Your driver.
              <br />
              One <span className="gold">app.</span>
            </h1>
            <p className="lede">
              The CityBucketList app is on the App Store. Scan your driver&rsquo;s code, download,
              and every ride, message and trip plan lives in one place, with your driver already
              saved.
            </p>
            <CtaRow />
            <p className="note">
              <b>iPhone today.</b> Android is coming. Until then the web app works on any phone, and
              it is the same account.
            </p>
          </div>
          <div className="device">
            <img src={phoneDashboard} alt="CityBucketList rider dashboard on an iPhone" />
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="section-eyebrow">three steps, one ride</div>
          <h2 className="section-h2">
            Scan. Download. <span className="it">Ride.</span>
          </h2>
          <p className="section-lede">
            Every CBL driver carries a QR code. It is how riders join, and it is how a driver
            becomes yours.
          </p>
          <div className="steps">
            <div className="step">
              <div className="ic">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <path d="M14 14h3v3M21 14v3h-3M14 21h3M21 21h-1" />
                </svg>
              </div>
              <div className="n">STEP 1</div>
              <h3>Scan your driver&rsquo;s code</h3>
              <p>
                Point your camera at the QR on their card, window or phone. It opens a short
                sign-up, free for riders. <em>That driver is saved as your preferred driver</em> the
                moment you join.
              </p>
            </div>
            <div className="step">
              <div className="ic">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3v12M7 10l5 5 5-5" />
                  <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
              </div>
              <div className="n">STEP 2</div>
              <h3>Download the app</h3>
              <p>
                Tap the App Store button on the welcome screen, install CityBucketList, and sign in
                with the account you just made. <em>Allow notifications</em> so you hear back when
                your driver accepts.
              </p>
            </div>
            <div className="step">
              <div className="ic">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 13l1.5-5h11L19 13" />
                  <rect x="3" y="13" width="18" height="6" rx="1.5" />
                  <path d="M7 19v2M17 19v2" />
                </svg>
              </div>
              <div className="n">STEP 3</div>
              <h3>Book ahead. Ride.</h3>
              <p>
                Schedule your ride, give your driver notice, message them before pickup.{' '}
                <em>No stranger, no guessing</em> who is pulling up. Need one right now? Uber and
                Lyft are one tap away inside the app.
              </p>
            </div>
          </div>
          <div className="pill-row">
            <span className="pill">
              <b>Free</b> for riders
            </span>
            <span className="pill">
              <b>Scheduled</b> private rides
            </span>
            <span className="pill">
              <b>Uber &amp; Lyft</b> for on demand
            </span>
            <span className="pill">
              <b>Your</b> driver, saved
            </span>
            <span className="pill">
              <b>Same account</b> on web and app
            </span>
          </div>
        </div>
      </section>

      <section className="band tight">
        <div className="wrap">
          <div className="split">
            <div className="split-media">
              <img src={phoneMessage} alt="Messaging a driver inside the CityBucketList app" />
            </div>
            <div>
              <div className="section-eyebrow">in the app</div>
              <h3>
                Text your driver <span className="gold">before you ride.</span>
              </h3>
              <p>
                Pickup spot, bag count, &ldquo;I&rsquo;ll flash the lights.&rdquo; The conversation
                stays with the ride, and a push notification lands on your phone when your driver
                replies, accepts, or moves the time.
              </p>
              <ul>
                <li>
                  <span>Ride requests, acceptances and time changes arrive as notifications.</span>
                </li>
                <li>
                  <span>Your next ride shows at the bottom of every screen once it is close.</span>
                </li>
                <li>
                  <span>
                    Drivers get reminders the morning of, two hours out, and thirty minutes out.
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <div className="split reverse">
            <div className="split-media">
              <img src={phoneBuckee} alt="Buckee trip planner inside the CityBucketList app" />
            </div>
            <div>
              <div className="section-eyebrow">meet buckee</div>
              <h3>
                Buckee plans <span className="gold">the whole trip.</span>
              </h3>
              <p>
                Tell Buckee where you are headed and for how long. He lines up stays, eats, tickets
                and CBL rides into one itinerary, then you book what you like. Trip planning, from
                the same dashboard as your ride.
              </p>
              <ul>
                <li>
                  <span>Stays, restaurants, attractions and rides in one plan.</span>
                </li>
                <li>
                  <span>Ask Buckee anything about the city, right from the dashboard.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="band tight">
        <div className="wrap">
          <div className="strip">
            <div>
              <h3>Already a member?</h3>
              <p>
                Your citybucketlist.com login works in the app. Download it, sign in, and everything
                you set up on the web is already there.
              </p>
            </div>
            <a
              className="btn-ghost"
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Get the app →
            </a>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="section-eyebrow">good to know</div>
          <h2 className="section-h2">
            Questions <span className="it">before you download</span>
          </h2>
          <div className="faq">
            <div className="q">
              <h4>Is the app free?</h4>
              <p>
                Yes. Rider membership is free, and there is nothing to buy inside the app. You pay
                your driver for rides, and that is between the two of you.
              </p>
            </div>
            <div className="q">
              <h4>Do I need a driver&rsquo;s QR code to join?</h4>
              <p>
                No. You can join free right here on citybucketlist.com and download the app.
                Scanning a driver&rsquo;s code just saves that driver to your dashboard from day
                one. You can scan one later from the app too.
              </p>
            </div>
            <div className="q">
              <h4>What about Android?</h4>
              <p>
                Coming. In the meantime, app.citybucketlist.com does everything the iPhone app does,
                from any phone&rsquo;s browser. It is the same account.
              </p>
            </div>
            <div className="q">
              <h4>Why does it ask for notifications?</h4>
              <p>
                So you hear back. When your driver accepts, replies, or moves the pickup time, that
                is how you find out without opening the app.
              </p>
            </div>
            <div className="q">
              <h4>What if I need a ride right now?</h4>
              <p>
                CBL rides are scheduled ahead with a private driver you know. Give them notice, and
                they accept or hand it to another member driver. Need a car this minute? The app
                hands you off to Uber or Lyft for an on-demand ride, so you always have a way to get
                there.
              </p>
            </div>
            <div className="q">
              <h4>I drive. Is the driver side in the app?</h4>
              <p>
                Yes. Drivers sign in to the same app and get their dashboard, schedule, rides and
                ride reminders. Driver membership itself is handled on citybucketlist.com.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="wrap">
          <div>
            <h2>
              Ready when <span className="gold">you are.</span>
            </h2>
            <CtaRow />
          </div>
          <div className="alt closing-note">
            Have a driver already? Ask them for their code and scan it first, so they are waiting
            for you inside the app.
          </div>
        </div>
      </section>
    </main>
  );
}
