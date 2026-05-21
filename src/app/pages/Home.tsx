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
        Travel smart. <span className="it">Live local.</span> Save more.
      </>
    ),
    caption: (
      <>
        Hotel concierge services available —{' '}
        <a href={APP_URL} className="cap-link">
          sign up here →
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
        Need a ride? <span className="it">Arrive safe.</span> Save more.
      </>
    ),
    caption: (
      <>
        Transportation services available —{' '}
        <a href={APP_URL} className="cap-link">
          need a ride? →
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
        Hungry? <span className="it">Eat local.</span> Save more.
      </>
    ),
    caption: (
      <>
        Local restaurant partnerships available —{' '}
        <Link to="/eats-and-drinks" className="cap-link">
          explore dining →
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
        Bored? <span className="it">Explore local.</span> Save more.
      </>
    ),
    caption: (
      <>
        Local attractions & experiences available —{' '}
        <Link to="/attractions" className="cap-link">
          start exploring →
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
        Stay in the <span className="it">know.</span> Read local.
      </>
    ),
    caption: (
      <>
        Local guides, tips & stories on the CBL blog —{' '}
        <Link to="/blog" className="cap-link">
          read now →
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
        Find local <span className="it">businesses.</span> Connect more.
      </>
    ),
    caption: (
      <>
        Browse the City Bucket List directory —{' '}
        <a href="https://directory.citybucketlist.com/" target="_blank" rel="noopener noreferrer" className="cap-link">
          explore directory →
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

const HOME_CSS = `
.cbl-home { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-home *,.cbl-home *::before,.cbl-home *::after { box-sizing:border-box; }
.cbl-home button { font-family:inherit; cursor:pointer; }
.cbl-home a { text-decoration:none; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

/* ── Hero band ── */
.cbl-home .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:34px 48px 44px;
}
.cbl-home .hero-inner { max-width:1280px; margin:0 auto; }
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
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(46px,5.6vw,82px);
  line-height:.94; letter-spacing:-.02em; text-transform:uppercase; margin:0 0 18px;
  transition:filter .5s, opacity .5s;
}
.cbl-home h1.hero-title .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:${GOLD}; text-transform:none; letter-spacing:0;
}
.cbl-home .hero-lede {
  font-size:16px; line-height:1.5; color:#B8B8B8; max-width:48ch; margin:0 0 24px;
  transition:filter .5s, opacity .5s;
}
.cbl-home .hero-lede .cap-link { color:${GOLD}; }
.cbl-home .hero-lede .cap-link:hover { text-decoration:underline; }

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
  margin-top:30px; display:flex; flex-wrap:wrap; gap:12px;
}
.cbl-home .chip {
  display:inline-flex; align-items:center; gap:9px;
  padding:11px 22px; border-radius:999px;
  border:1.5px solid rgba(255,255,255,.22); background:transparent;
  color:#fff; font-family:${DISPLAY}; font-weight:800;
  font-size:12px; letter-spacing:.1em; text-transform:uppercase;
  transition:border-color .25s, color .25s, background .25s;
}
.cbl-home .chip::before {
  content:''; width:7px; height:7px; border-radius:50%;
  background:currentColor; opacity:.55; transition:opacity .25s;
}
.cbl-home .chip:hover { border-color:${GOLD}; color:${GOLD}; }
.cbl-home .chip.active { border-color:${GOLD}; color:${GOLD}; background:rgba(201,151,66,.1); }
.cbl-home .chip.active::before { opacity:1; }

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
                Join Now — Free →
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
                    {c.label}
                  </Link>
                ))}
                <Link to="/blog" className={'chip' + (current === 4 ? ' active' : '')} onMouseEnter={() => goTo(4)}>
                  CBL Blog
                </Link>
                <a
                  href="https://directory.citybucketlist.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={'chip' + (current === 5 ? ' active' : '')}
                  onMouseEnter={() => goTo(5)}
                >
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
              Meet Buckee →
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
              Launch the App →
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
                <span className="d-cta">Open the app →</span>
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
                <span className="go">Read now →</span>
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
                <span className="go">Explore directory →</span>
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
            Join City Bucket List →
          </a>
        </div>
      </section>
    </main>
  );
}
