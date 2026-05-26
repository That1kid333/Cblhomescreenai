import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import buckeeConcierge from '../../assets/buckee_concierge.png';
import cittyImage from '../../assets/citty.png';
import listyImage from '../../assets/listy.png';

/**
 * Meet the Buckee Family — ported from the concierge-hero mockup into the
 * site's editorial brand system (black canvas, gold #C99742 accents, Playfair
 * italic accents, mono eyebrows, angled-corner cards). Lives under /meet-buckee
 * and is linked from the About dropdown + a homepage teaser band.
 *
 * Interactions carried over from the mockup: the hero speech bubble cycles
 * through Buckee's prompts, and tapping a family member swaps the services
 * panel + voice bar to that mascot.
 */

const GOLD = '#C99742';
const DISPLAY = "'Myriad Pro', sans-serif";
const BODY = "'Myriad Pro', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const APP_URL = 'https://app.citybucketlist.com';

type CharKey = 'buckee' | 'citty' | 'listy';

type Service = { ico: string; name: string; hint: string };
type Member = {
  name: string;
  img: string;
  role: string;
  tag: string;
  blurb: string;
  services: Service[];
};

const FAMILY: Record<CharKey, Member> = {
  buckee: {
    name: 'Buckee',
    img: buckeeConcierge,
    role: 'concierge · greeter',
    tag: 'general help · suggestions · triage',
    blurb:
      "The face of City Bucket List and your lead concierge. Ask Buckee anything — he'll point you to the right place, build a plan for the day, or hand you off to Citty or Listy when it's their turn.",
    services: [
      { ico: '✨', name: 'Surprise me', hint: 'Pick something great for tonight' },
      { ico: '📋', name: 'Build a bucket list', hint: 'A plan for this city' },
      { ico: '🗺️', name: "What's nearby", hint: 'Explore around me' },
      { ico: '💬', name: 'Ask anything', hint: 'Type or talk to me' },
    ],
  },
  citty: {
    name: 'Citty',
    img: cittyImage,
    role: 'host · hospitality',
    tag: 'food · stays · events · occasions',
    blurb:
      'The host of the family. Citty handles the good life — a table for two, a room for the night, tickets to the show, and the perfect spot for whatever the occasion calls for.',
    services: [
      { ico: '🍽️', name: 'Find a table', hint: 'Restaurants & bars' },
      { ico: '🏨', name: 'Book a stay', hint: 'Hotels & rentals' },
      { ico: '🎭', name: 'Tickets & shows', hint: 'Concerts, theater, sports' },
      { ico: '🥂', name: 'Special occasion', hint: 'Anniversary, birthday, date' },
    ],
  },
  listy: {
    name: 'Listy',
    img: listyImage,
    role: 'rides · errands',
    tag: 'rides · tickets · tours · bookings',
    blurb:
      "The fetcher. Listy chases down rides, transit passes, tours and reservations — then brings them back booked and ready. If it needs picking up, Listy's already on it.",
    services: [
      { ico: '🚗', name: 'Get a ride', hint: 'Uber, Lyft, taxi compared' },
      { ico: '🚇', name: 'Transit & passes', hint: 'Subway, bus, day pass' },
      { ico: '🎟️', name: 'Tours & passes', hint: 'City tours, attractions' },
      { ico: '📞', name: 'Reservations', hint: "I'll fetch and book" },
    ],
  },
};

const ORDER: CharKey[] = ['buckee', 'citty', 'listy'];

const HERO_LINES = [
  'How can I help you today?',
  'Do you need a ride?',
  'Hungry?',
  'Looking for a place to stay?',
  'Wanna build a bucket list?',
];

// Galaxy-generated talking-head intros (black bg + narration baked in).
// URLs are authoritative per the mascot handoff package.
const MASCOT_VIDEOS: { id: CharKey; name: string; role: string; url: string }[] = [
  { id: 'buckee', name: 'Buckee', role: 'concierge', url: 'https://cdn.galaxy.ai/user_366xyt7NI0XIYqXXItVcjkNHDKl/572b0c2b6cc54ad3a8d2f3da744ee462.mp4' },
  { id: 'citty', name: 'Citty', role: 'host & hospitality', url: 'https://cdn.galaxy.ai/user_366xyt7NI0XIYqXXItVcjkNHDKl/5223faf859f04687951b11efe82ba874.mp4' },
  { id: 'listy', name: 'Listy', role: 'rides & reservations', url: 'https://cdn.galaxy.ai/user_366xyt7NI0XIYqXXItVcjkNHDKl/d6e5e3cf35004c3486d238a646133f4c.mp4' },
];

const PlayGlyph = () => (
  <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
    <circle cx="40" cy="40" r="38" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" />
    <polygon points="32,24 60,40 32,56" fill="rgba(255,255,255,0.95)" />
  </svg>
);
const PauseGlyph = () => (
  <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
    <circle cx="40" cy="40" r="38" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.85)" strokeWidth="2.5" />
    <rect x="26" y="23" width="10" height="34" rx="3" fill="rgba(255,255,255,0.95)" />
    <rect x="44" y="23" width="10" height="34" rx="3" fill="rgba(255,255,255,0.95)" />
  </svg>
);

export function MeetBuckee() {
  const [active, setActive] = useState<CharKey>('buckee');
  const [qi, setQi] = useState(0);
  const [lang, setLang] = useState('EN');
  const [vplaying, setVplaying] = useState<CharKey | null>(null);
  const vidRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    const id = setInterval(() => setQi((i) => (i + 1) % HERO_LINES.length), 2600);
    return () => clearInterval(id);
  }, []);

  // Play one intro at a time — playing a new one resets/pauses the others.
  const playVideo = (id: CharKey) => {
    MASCOT_VIDEOS.forEach(({ id: other }) => {
      if (other !== id) {
        const ov = vidRefs.current[other];
        if (ov) { ov.pause(); ov.currentTime = 0; }
      }
    });
    vidRefs.current[id]?.play();
    setVplaying(id);
  };
  const pauseVideo = (id: CharKey) => { vidRefs.current[id]?.pause(); setVplaying(null); };
  const endVideo = (id: CharKey) => { const v = vidRefs.current[id]; if (v) v.currentTime = 0; setVplaying(null); };

  const c = FAMILY[active];

  return (
    <div className="cbl-buckee">
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <section className="wrap hero">
        <div className="hero-copy">
          <span className="eyebrow">meet your concierge</span>
          <h1>
            Your city,
            <br />
            <em>at your service.</em>
          </h1>
          <p className="lede">
            Buckee and his family are standing by — ready to book a ride, set a dinner, find a
            room, or build a bucket list for your next city. Just ask.
          </p>
          <div className="hero-cta">
            <a className="btn-gold" href={APP_URL} target="_blank" rel="noopener noreferrer">
              Open the app
            </a>
            <Link className="btn-ghost" to="/how-it-works">
              How it works
            </Link>
          </div>
        </div>

        <div className="stage">
          <div className="bubble">
            <span className="bubble-eyebrow">Buckee says</span>
            <span key={qi} className="bubble-text">
              {HERO_LINES[qi]}
            </span>
          </div>
          <img className="buckee-art" src={buckeeConcierge} alt="Buckee, the CityBucketList concierge, ringing a bell" />
        </div>
      </section>

      {/* ── MEET THE CREW (talking-head intro videos) ── */}
      <section className="wrap videos">
        <div className="videos-head">
          <span className="eyebrow">press play</span>
          <h2 className="videos-title">Hear from the <em>crew</em></h2>
          <p className="videos-sub">Tap a character to hear them introduce themselves.</p>
        </div>
        <div className="video-row">
          {MASCOT_VIDEOS.map((v) => (
            <div className="vcard" key={v.id}>
              <div
                className={'vmedia' + (vplaying === v.id ? ' playing' : '')}
                onClick={() => (vplaying === v.id ? pauseVideo(v.id) : playVideo(v.id))}
              >
                <video
                  ref={(el) => { vidRefs.current[v.id] = el; }}
                  src={v.url}
                  playsInline
                  preload="metadata"
                  onEnded={() => endVideo(v.id)}
                />
                <span className="vbtn">{vplaying === v.id ? <PauseGlyph /> : <PlayGlyph />}</span>
              </div>
              <div className="vcap">
                <span className="vname">{v.name}</span>
                <span className="vrole">{v.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAMILY PICKER ── */}
      <section className="wrap family">
        {ORDER.map((key) => {
          const m = FAMILY[key];
          return (
            <button
              key={key}
              className={'char' + (active === key ? ' active' : '')}
              onClick={() => setActive(key)}
              aria-pressed={active === key}
            >
              <span className="char-thumb" style={{ backgroundImage: `url(${m.img})` }} />
              <span className="char-info">
                <span className="char-name">{m.name}</span>
                <span className="char-role">{m.role}</span>
              </span>
            </button>
          );
        })}
      </section>

      {/* ── SERVICES PANEL ── */}
      <section className="wrap services-wrap">
        <div className="services">
          <div className="services-head">
            <div className="who">
              What can <em>{c.name}</em> do?
            </div>
            <div className="who-tag">{c.tag}</div>
          </div>
          <p className="who-blurb">{c.blurb}</p>
          <div className="services-grid">
            {c.services.map((s) => (
              <div className="svc" key={s.name}>
                <span className="svc-ico">{s.ico}</span>
                <div className="svc-name">{s.name}</div>
                <div className="svc-hint">{s.hint}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VOICE BAR ── */}
      <section className="wrap voice">
        <div className="voice-bar">
          <button className="mic-btn" aria-label={`Talk to ${c.name}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          <div className="voice-text">
            <div className="voice-label">talk to {c.name}</div>
            <div className="voice-prompt">Tap and speak — English, Español, Français, Português.</div>
          </div>
          <div className="lang-chips">
            {['EN', 'ES', 'FR', 'PT'].map((l) => (
              <button
                key={l}
                className={'chip' + (lang === l ? ' active' : '')}
                onClick={() => setLang(l)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const CSS = `
.cbl-buckee {
  --bg:#0A0A0A; --surface:#141414; --surface-2:#1A1A1A;
  --text-body:#C9C9C9; --text-muted:#8A8A8A; --gold:${GOLD};
  --line:rgba(255,255,255,0.08);
  --corner-lg:24px 0 24px 0; --corner-md:18px 0 18px 0; --corner-sm:12px 0 12px 0;
  background:var(--bg); color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased;
  padding-bottom:72px;
}
.cbl-buckee * { box-sizing:border-box; }
.cbl-buckee button { font-family:inherit; cursor:pointer; }
.cbl-buckee .wrap { max-width:1376px; margin:0 auto; padding:0 48px; }

/* ── HERO ── */
.cbl-buckee .hero {
  padding-top:64px; padding-bottom:56px;
  display:grid; grid-template-columns:1.05fr 1fr; gap:56px; align-items:center;
}
.cbl-buckee .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em; text-transform:lowercase;
  color:var(--text-muted); margin-bottom:20px;
}
.cbl-buckee .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%; background:var(--gold);
  animation:cblb-pulse 2.4s ease-in-out infinite;
}
@keyframes cblb-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
.cbl-buckee .hero h1 {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(48px,6vw,84px);
  line-height:.96; letter-spacing:-.02em; margin:0 0 22px;
}
.cbl-buckee .hero h1 em { font-family:${ITALIC}; font-style:italic; font-weight:400; color:var(--gold); }
.cbl-buckee .lede { font-size:19px; line-height:1.55; color:var(--text-body); max-width:520px; margin:0 0 30px; }
.cbl-buckee .hero-cta { display:flex; gap:14px; flex-wrap:wrap; }
.cbl-buckee .btn-gold {
  display:inline-block; background:var(--gold); color:#111; font-weight:800; font-size:15px;
  padding:13px 26px; border-radius:var(--corner-sm); transition:background .2s;
}
.cbl-buckee .btn-gold:hover { background:#DDB15F; }
.cbl-buckee .btn-ghost {
  display:inline-block; border:1px solid rgba(255,255,255,.25); color:#fff; font-weight:700; font-size:15px;
  padding:12px 24px; border-radius:var(--corner-sm); transition:border-color .2s,color .2s;
}
.cbl-buckee .btn-ghost:hover { border-color:var(--gold); color:var(--gold); }

/* ── BUCKEE STAGE ── */
.cbl-buckee .stage {
  position:relative; min-height:520px;
  display:flex; align-items:flex-end; justify-content:center;
}
.cbl-buckee .stage::after {
  content:''; position:absolute; bottom:34px; left:50%; transform:translateX(-50%);
  width:320px; height:28px;
  background:radial-gradient(ellipse at center, rgba(201,151,66,.32) 0%, transparent 70%);
  filter:blur(6px); z-index:0;
}
.cbl-buckee .buckee-art {
  position:relative; z-index:2; width:400px; max-width:88%; display:block;
  filter:drop-shadow(0 28px 40px rgba(0,0,0,.55));
  animation:cblb-walkin 1.05s cubic-bezier(.2,.8,.2,1) .1s both, cblb-float 3.8s ease-in-out 1.25s infinite;
}
@keyframes cblb-walkin { from{opacity:0;transform:translateX(-70px) translateY(10px);} to{opacity:1;transform:translateX(0) translateY(0);} }
@keyframes cblb-float { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-10px);} }

.cbl-buckee .bubble {
  position:absolute; top:24px; right:0; z-index:3;
  background:#fff; color:#111; padding:18px 22px; border-radius:var(--corner-md);
  width:300px; max-width:84%; box-shadow:0 20px 44px rgba(0,0,0,.45);
  animation:cblb-bubblein .5s cubic-bezier(.2,.8,.2,1) .9s both;
}
.cbl-buckee .bubble::after {
  content:''; position:absolute; bottom:-9px; left:34px; width:18px; height:18px;
  background:#fff; clip-path:polygon(0 0,100% 0,0 100%);
}
@keyframes cblb-bubblein { from{opacity:0;transform:translateY(-8px) scale(.96);} to{opacity:1;transform:translateY(0) scale(1);} }
.cbl-buckee .bubble-eyebrow {
  display:block; font-family:${MONO}; font-size:10px; letter-spacing:.12em; text-transform:uppercase;
  color:#8a8a8a; margin-bottom:6px;
}
.cbl-buckee .bubble-text {
  display:block; font-family:${ITALIC}; font-style:italic; font-weight:700;
  font-size:22px; line-height:1.25; color:#111; min-height:56px;
  animation:cblb-fade .5s ease both;
}
@keyframes cblb-fade { from{opacity:0;} to{opacity:1;} }

/* ── FAMILY PICKER ── */
.cbl-buckee .family {
  padding-top:8px; padding-bottom:8px;
  display:grid; grid-template-columns:repeat(3,1fr); gap:18px;
}
.cbl-buckee .char {
  display:flex; align-items:center; gap:16px; text-align:left;
  padding:18px 20px; background:var(--surface); border:1px solid var(--line);
  border-radius:var(--corner-md); position:relative;
  transition:border-color .2s, background .2s, transform .2s;
}
.cbl-buckee .char:hover { border-color:rgba(201,151,66,.35); background:var(--surface-2); transform:translateY(-2px); }
.cbl-buckee .char.active { border-color:var(--gold); background:linear-gradient(180deg, rgba(201,151,66,.08) 0%, var(--surface) 100%); }
.cbl-buckee .char.active::before {
  content:'ON DUTY'; position:absolute; top:-10px; right:16px;
  background:var(--gold); color:#111; font-family:${MONO}; font-size:10px; letter-spacing:.1em;
  font-weight:600; padding:4px 10px; border-radius:2px;
}
.cbl-buckee .char-thumb {
  width:64px; height:64px; border-radius:50%; flex-shrink:0;
  background-color:var(--surface-2); background-size:130%; background-position:center 16%;
  border:2px solid rgba(255,255,255,.08);
}
.cbl-buckee .char.active .char-thumb { border-color:var(--gold); }
.cbl-buckee .char-name { display:block; font-family:${ITALIC}; font-style:italic; font-weight:700; font-size:22px; color:#fff; margin-bottom:2px; }
.cbl-buckee .char-role { display:block; font-family:${MONO}; font-size:12px; letter-spacing:.06em; text-transform:uppercase; color:var(--text-muted); }

/* ── SERVICES PANEL ── */
.cbl-buckee .services-wrap { padding-top:18px; padding-bottom:14px; }
.cbl-buckee .services { background:var(--surface); border:1px solid var(--line); border-radius:var(--corner-lg); padding:34px 38px; }
.cbl-buckee .services-head { display:flex; align-items:baseline; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.cbl-buckee .who { font-family:${ITALIC}; font-style:italic; font-size:30px; font-weight:700; color:#fff; }
.cbl-buckee .who em { font-style:italic; color:var(--gold); font-weight:700; }
.cbl-buckee .who-tag { font-family:${MONO}; font-size:12px; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); }
.cbl-buckee .who-blurb { font-size:16px; line-height:1.55; color:var(--text-body); max-width:760px; margin:14px 0 24px; padding-bottom:22px; border-bottom:1px solid var(--line); }
.cbl-buckee .services-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
.cbl-buckee .svc { background:var(--surface-2); border:1px solid var(--line); border-radius:var(--corner-sm); padding:20px 18px; transition:border-color .2s, transform .2s; }
.cbl-buckee .svc:hover { border-color:rgba(201,151,66,.4); transform:translateY(-2px); }
.cbl-buckee .svc-ico { font-size:24px; margin-bottom:10px; display:block; }
.cbl-buckee .svc-name { font-size:15px; font-weight:700; color:#fff; margin-bottom:4px; }
.cbl-buckee .svc-hint { font-size:13px; line-height:1.4; color:var(--text-muted); }

/* ── VOICE BAR ── */
.cbl-buckee .voice { padding-top:14px; }
.cbl-buckee .voice-bar {
  display:flex; align-items:center; gap:20px;
  background:linear-gradient(180deg, rgba(201,151,66,.06) 0%, var(--surface) 100%);
  border:1px solid rgba(201,151,66,.2); border-radius:var(--corner-md); padding:18px 22px;
}
.cbl-buckee .mic-btn {
  width:52px; height:52px; border-radius:50%; background:var(--gold); color:#111; border:none;
  display:grid; place-items:center; flex-shrink:0; transition:transform .15s; box-shadow:0 8px 20px rgba(201,151,66,.35);
}
.cbl-buckee .mic-btn:hover { transform:scale(1.06); }
.cbl-buckee .mic-btn svg { width:22px; height:22px; }
.cbl-buckee .voice-text { flex:1; }
.cbl-buckee .voice-label { font-family:${MONO}; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:var(--gold); margin-bottom:3px; }
.cbl-buckee .voice-prompt { font-size:15px; color:var(--text-body); }
.cbl-buckee .lang-chips { display:flex; gap:6px; flex-shrink:0; }
.cbl-buckee .chip { font-family:${MONO}; font-size:12px; letter-spacing:.06em; padding:8px 12px; border-radius:6px; border:1px solid var(--line); color:var(--text-muted); background:transparent; transition:all .2s; }
.cbl-buckee .chip:hover { color:#fff; border-color:var(--text-body); }
.cbl-buckee .chip.active { background:var(--gold); color:#111; border-color:var(--gold); }

/* ── Meet-the-crew intro videos ── */
.cbl-buckee .videos { padding-top:14px; padding-bottom:20px; }
.cbl-buckee .videos-head { text-align:center; margin-bottom:26px; }
.cbl-buckee .videos-head .eyebrow { justify-content:center; }
.cbl-buckee .videos-title { font-family:${ITALIC}; font-style:italic; font-weight:700; font-size:clamp(28px,4vw,40px); color:#fff; margin:0 0 8px; }
.cbl-buckee .videos-title em { font-style:italic; color:var(--gold); }
.cbl-buckee .videos-sub { font-size:15px; color:var(--text-body); margin:0; }
.cbl-buckee .video-row { display:flex; gap:18px; align-items:flex-end; justify-content:center; }
.cbl-buckee .vcard { flex:1; min-width:0; max-width:340px; }
.cbl-buckee .vmedia { position:relative; background:#000; cursor:pointer; }
.cbl-buckee .vmedia video { width:100%; height:auto; display:block; }
.cbl-buckee .vbtn { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; opacity:1; transition:opacity .2s ease; pointer-events:none; }
.cbl-buckee .vmedia.playing .vbtn { opacity:0; }
.cbl-buckee .vbtn svg { width:64px; height:64px; filter:drop-shadow(0 2px 8px rgba(0,0,0,.6)); }
.cbl-buckee .vcap { text-align:center; padding-top:12px; }
.cbl-buckee .vname { display:block; font-family:${ITALIC}; font-style:italic; font-weight:700; font-size:20px; color:#fff; }
.cbl-buckee .vrole { display:block; font-family:${MONO}; font-size:11px; letter-spacing:.08em; text-transform:uppercase; color:var(--text-muted); margin-top:3px; }

@media (prefers-reduced-motion: reduce) {
  .cbl-buckee .buckee-art { animation:none; }
  .cbl-buckee .bubble { animation:none; }
  .cbl-buckee .eyebrow::before { animation:none; }
}

/* ── MOBILE (iPhone-first) ── */
@media (max-width:720px) {
  .cbl-buckee .wrap { padding:0 20px; }
  .cbl-buckee .hero { grid-template-columns:1fr; gap:28px; padding-top:40px; padding-bottom:40px; }
  .cbl-buckee .hero h1 { font-size:clamp(40px,11vw,60px); }
  .cbl-buckee .lede { font-size:16px; }
  .cbl-buckee .stage { min-height:380px; order:-1; }
  .cbl-buckee .buckee-art { width:260px; }
  .cbl-buckee .bubble { width:240px; right:auto; left:0; top:8px; }
  .cbl-buckee .bubble-text { font-size:18px; min-height:46px; }
  .cbl-buckee .family { grid-template-columns:1fr; gap:12px; }
  .cbl-buckee .services { padding:24px 20px; }
  .cbl-buckee .who { font-size:24px; }
  .cbl-buckee .who-blurb { font-size:15px; }
  .cbl-buckee .services-grid { grid-template-columns:repeat(2,1fr); }
  .cbl-buckee .voice-bar { flex-wrap:wrap; gap:14px; }
  .cbl-buckee .voice-text { flex-basis:100%; order:3; }
  .cbl-buckee .lang-chips { order:2; }
  .cbl-buckee .video-row { flex-direction:column; align-items:center; gap:28px; }
  .cbl-buckee .vcard { width:100%; max-width:380px; flex:none; }
  .cbl-buckee .videos-title { font-size:26px; }
}
`;
