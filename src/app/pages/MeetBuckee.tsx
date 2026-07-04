import { useState, useEffect, useRef } from 'react';
import buckeeConcierge from '../../assets/buckee_concierge.png';
import cittyImage from '../../assets/citty.png';
import listyImage from '../../assets/listy.png';
import { APP_URL } from '../lib/constants';
import { useBuckeeChat, BUCKEE_GREETING, BUCKEE_GATE_LINE } from '../lib/useBuckeeChat';

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
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

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

// §5.3 — intentional status badges: Buckee is live (chat), the others are marketing-only for now.
const CHAR_STATUS: Record<CharKey, 'on-duty' | 'coming-soon'> = {
  buckee: 'on-duty',
  citty: 'coming-soon',
  listy: 'coming-soon',
};

// §5.2 — "Hear from the crew" intro-video row. The videos are real (galaxy.ai CDN, verified
// video/mp4) and play on click; the play button is just the poster state. Kept as a flag for
// easy toggling. (Optional future polish: add poster frames so the black first frame isn't blank.)
const SHOW_CREW_VIDEOS = true;

// §5b.3 — the wired Talk-to-Buckee bar on this page (same buckee-public endpoint + shared
// teaser counter as the home screen). Set false to hide behind a flag if it ships pre-wiring.
const SHOW_MEET_BUCKEE_CHAT = true;

// §5b.2 — prompt each "What can Buckee do?" card fires into the chat (empty = just open + focus).
const BUCKEE_PROMPTS: Record<string, string> = {
  'Surprise me': 'Surprise me — pick something great to do tonight.',
  'Build a bucket list': 'Help me build a bucket list for this city.',
  "What's nearby": "What's nearby that's worth checking out?",
  'Ask anything': '',
};

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
  const chat = useBuckeeChat(lang);
  const chatBarRef = useRef<HTMLDivElement>(null);
  const scrollToChat = () => { chat.setOpen(true); chatBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const onCard = (name: string) => {
    scrollToChat();
    const prompt = BUCKEE_PROMPTS[name];
    if (prompt) chat.sendPrompt(prompt);
    else setTimeout(() => chat.inputRef.current?.focus(), 300);
  };

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

  // Tapping a family "ON DUTY" card selects that mascot, brings their intro
  // video into view, and plays it (tap = user gesture, so audio is allowed).
  const selectAndPlay = (id: CharKey) => {
    setActive(id);
    if (!SHOW_CREW_VIDEOS) return; // video row hidden — card just selects the character
    vidRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    playVideo(id);
  };

  const c = FAMILY[active];

  return (
    <div className="cbl-buckee">
      <style>{CSS}</style>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">meet your concierge</span>
          <h1 className="hero-title">
            <span className="title-stack">
              <span className="h1-main">Your city,</span>
              <span className="hero-subtitle">
                At your service. <span className="it">just ask.</span>
              </span>
            </span>
          </h1>
          <p className="lede">
            Buckee and his family are standing by — ready to book a ride, set a dinner, find a
            room, or build a bucket list for your next city. Just ask.
          </p>
          <div className="hero-cta">
            <a className="btn-gold" href={APP_URL} target="_blank" rel="noopener noreferrer">
              Open the app
            </a>
            <button className="btn-ghost" onClick={scrollToChat}>
              Say hi to Buckee ↓
            </button>
          </div>
        </div>
      </section>

      {/* ── MEET THE CREW (talking-head intro videos) — hidden until real videos exist (§5.2) ── */}
      {SHOW_CREW_VIDEOS && (
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
                  poster={FAMILY[v.id].img}
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
      )}

      {/* ── FAMILY PICKER ── */}
      <section className="wrap family">
        {ORDER.map((key) => {
          const m = FAMILY[key];
          return (
            <button
              key={key}
              className={'char' + (active === key ? ' active' : '')}
              onClick={() => selectAndPlay(key)}
              aria-pressed={active === key}
            >
              <span className={'char-badge ' + CHAR_STATUS[key]}>
                {CHAR_STATUS[key] === 'on-duty' ? 'ON DUTY' : 'COMING SOON'}
              </span>
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
            {c.services.map((s) => {
              const inner = (
                <>
                  <span className="svc-ico">{s.ico}</span>
                  <div className="svc-name">{s.name}</div>
                  <div className="svc-hint">{s.hint}</div>
                </>
              );
              // §5b.2/5b.4 — Buckee (on duty) = clickable prompt-starters; Citty/Listy = static list.
              return active === 'buckee' ? (
                <button className="svc svc-btn" key={s.name} onClick={() => onCard(s.name)}>{inner}</button>
              ) : (
                <div className="svc" key={s.name}>{inner}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TALK TO BUCKEE — wired teaser chat (§5b.3) ── */}
      {SHOW_MEET_BUCKEE_CHAT && (
      <section className="wrap voice" ref={chatBarRef}>
        {chat.open && (
          <div className="bkchat" role="log" aria-live="polite">
            <div className="bkchat-scroll" ref={chat.scrollRef}>
              <div className="bkmsg bot">{BUCKEE_GREETING[lang]}</div>
              {chat.messages.map((m, i) => (
                <div key={i} className={'bkmsg ' + (m.role === 'user' ? 'me' : 'bot')}>{m.content}</div>
              ))}
              {chat.sending && <div className="bkmsg bot typing"><span></span><span></span><span></span></div>}
            </div>
            {chat.gated ? (
              <div className="bkgate">
                <div>{BUCKEE_GATE_LINE[lang]}</div>
                <a className="btn-gold" href={APP_URL}>Join now — free</a>
              </div>
            ) : (
              <form className="bkinput" onSubmit={(e) => { e.preventDefault(); chat.send(chat.input); }}>
                <input
                  ref={chat.inputRef}
                  value={chat.input}
                  onChange={(e) => chat.setInput(e.target.value)}
                  placeholder={chat.listening ? 'Listening…' : 'Ask Buckee anything…'}
                  maxLength={500}
                  aria-label="Message Buckee"
                />
                <button type="submit" className="bksend" aria-label="Send" disabled={chat.sending || !chat.input.trim()}>→</button>
              </form>
            )}
          </div>
        )}
        <div className="voice-bar">
          <button className={'mic-btn' + (chat.listening ? ' listening' : '')} aria-label="Talk to Buckee" onClick={chat.toggleMic}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="2" width="6" height="12" rx="3" />
              <path d="M5 10v2a7 7 0 0 0 14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          </button>
          <div className="voice-text">
            <div className="voice-label">talk to Buckee</div>
            <div className="voice-prompt">Type or tap the mic — English, Español, Français, Português.</div>
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
      )}
    </div>
  );
}

const CSS = `
.cbl-buckee {
  --bg:#000; --surface:#141414; --surface-2:#1A1A1A;
  --text-body:#C9C9C9; --text-muted:#8A8A8A; --gold:${GOLD};
  --line:rgba(255,255,255,0.08);
  --corner-lg:24px 0 24px 0; --corner-md:18px 0 18px 0; --corner-sm:12px 0 12px 0;
  background:var(--bg); color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased;
  padding-bottom:72px;
}
.cbl-buckee * { box-sizing:border-box; }
.cbl-buckee button { font-family:inherit; cursor:pointer; }
.cbl-buckee .wrap { max-width:1376px; margin:0 auto; padding:0 48px; }

/* ── HERO (map-backdrop header — matches Our Story / Explore) ── */
.cbl-buckee .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.55) 45%, rgba(0,0,0,.92) 90%, #000 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:26px 48px 16px;
}
.cbl-buckee .hero-copy { position:relative; z-index:1; max-width:1376px; margin:0 auto; }
.cbl-buckee .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em; text-transform:lowercase;
  color:#fff; font-weight:700; margin-bottom:12px;
}
.cbl-buckee .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%; background:var(--gold);
  animation:cblb-pulse 2.4s ease-in-out infinite;
}
@keyframes cblb-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
.cbl-buckee .hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(48px,6.2vw,84px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase; margin:0 0 10px;
}
.cbl-buckee .hero-title .title-stack { display:flex; flex-direction:column; gap:4px; align-items:flex-start; }
.cbl-buckee .hero-title .h1-main { color:#fff; }
.cbl-buckee .hero-subtitle {
  display:flex; align-items:baseline; gap:12px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(26px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:var(--gold);
}
.cbl-buckee .hero-subtitle .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:var(--gold); text-transform:none; letter-spacing:0; font-size:.82em;
}
.cbl-buckee .lede { font-size:17px; line-height:1.5; color:var(--text-body); max-width:560px; margin:0 0 18px; }
.cbl-buckee .hero-cta { display:flex; gap:14px; flex-wrap:wrap; }
.cbl-buckee .btn-gold {
  display:inline-block; background:var(--gold); color:#111; font-weight:800; font-size:15px;
  padding:13px 26px; border-radius:var(--corner-sm); transition:background .2s;
}
.cbl-buckee .btn-gold:hover { background:#DDB15F; }
.cbl-buckee .btn-ghost {
  display:inline-block; border:1px solid rgba(255,255,255,.25); color:#fff; font-weight:700; font-size:15px;
  padding:12px 24px; border-radius:var(--corner-sm); transition:border-color .2s,color .2s;
  background:transparent; cursor:pointer; font-family:inherit;
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
/* §5.3 — intentional per-character status badges */
.cbl-buckee .char-badge {
  position:absolute; top:-10px; right:16px;
  font-family:${MONO}; font-size:10px; letter-spacing:.1em; font-weight:600;
  padding:4px 10px; border-radius:2px; text-transform:uppercase;
}
.cbl-buckee .char-badge.on-duty { background:#4DBF66; color:#062615; }
.cbl-buckee .char-badge.coming-soon { background:rgba(201,151,66,.12); color:var(--gold); border:1px solid rgba(201,151,66,.45); }
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
.cbl-buckee .svc-btn { cursor:pointer; text-align:left; width:100%; font:inherit; color:inherit; }
.cbl-buckee .svc-btn:hover { border-color:rgba(201,151,66,.4); transform:translateY(-2px); }
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

/* §5b — wired Talk-to-Buckee chat panel */
.cbl-buckee .bkchat { background:var(--surface); border:1px solid rgba(201,151,66,.4); border-radius:12px; padding:12px 14px; margin-bottom:12px; display:flex; flex-direction:column; gap:10px; }
.cbl-buckee .bkchat-scroll { display:flex; flex-direction:column; gap:8px; max-height:300px; overflow-y:auto; padding-right:4px; }
.cbl-buckee .bkmsg { max-width:86%; padding:9px 13px; border-radius:14px; font-size:14px; line-height:1.4; word-wrap:break-word; }
.cbl-buckee .bkmsg.bot { align-self:flex-start; background:rgba(201,151,66,.12); border:1px solid rgba(201,151,66,.25); color:#EDEDED; border-bottom-left-radius:4px; }
.cbl-buckee .bkmsg.me { align-self:flex-end; background:var(--gold); color:#111; font-weight:600; border-bottom-right-radius:4px; }
.cbl-buckee .bkmsg.typing { display:inline-flex; gap:4px; align-items:center; }
.cbl-buckee .bkmsg.typing span { width:6px; height:6px; border-radius:50%; background:var(--gold); opacity:.5; animation:bk-typing 1s infinite; }
.cbl-buckee .bkmsg.typing span:nth-child(2){ animation-delay:.15s; }
.cbl-buckee .bkmsg.typing span:nth-child(3){ animation-delay:.3s; }
@keyframes bk-typing { 0%,100%{ opacity:.3; transform:translateY(0);} 50%{ opacity:1; transform:translateY(-3px);} }
.cbl-buckee .bkinput { display:flex; gap:8px; }
.cbl-buckee .bkinput input { flex:1; min-width:0; background:#0A0A0A; border:1px solid rgba(255,255,255,.15); border-radius:999px; padding:10px 16px; color:#fff; font-size:14px; outline:none; }
.cbl-buckee .bkinput input:focus { border-color:var(--gold); }
.cbl-buckee .bksend { flex-shrink:0; width:40px; height:40px; border-radius:50%; border:0; background:var(--gold); color:#111; font-size:18px; font-weight:900; cursor:pointer; }
.cbl-buckee .bksend:disabled { opacity:.4; cursor:default; }
.cbl-buckee .bkgate { display:flex; flex-direction:column; gap:10px; align-items:flex-start; font-size:14px; color:#EDEDED; }
.cbl-buckee .mic-btn.listening { animation:bk-mic-pulse 1.2s ease-in-out infinite; }
@keyframes bk-mic-pulse { 0%,100%{ box-shadow:0 0 0 0 rgba(201,151,66,.35);} 50%{ box-shadow:0 0 0 9px rgba(201,151,66,.10);} }

/* ── Meet-the-crew intro videos ── */
.cbl-buckee .videos { padding-top:0; padding-bottom:20px; }
.cbl-buckee .videos-head { text-align:center; margin-bottom:14px; }
.cbl-buckee .videos-head .eyebrow { justify-content:center; margin-bottom:8px; }
.cbl-buckee .videos-title { font-family:${ITALIC}; font-style:italic; font-weight:700; font-size:clamp(24px,3.4vw,34px); color:#fff; margin:0 0 4px; }
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
  .cbl-buckee .hero { padding:32px 20px 40px; }
  .cbl-buckee .hero-title { font-size:clamp(40px,11vw,60px); }
  .cbl-buckee .hero-subtitle { font-size:clamp(22px,5.5vw,32px); }
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
