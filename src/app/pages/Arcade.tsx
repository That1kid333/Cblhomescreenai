import { Link } from 'react-router';
import { Gamepad2, ExternalLink } from 'lucide-react';

/**
 * Two CBL-made games, open to everyone. Each card is a plain outbound link to its
 * own, independently deployed site (not embedded here), same pattern as any other
 * external link on this site.
 *
 * Brand note: this page uses #F5A623 ("cbl-gold" in the app repo's Tailwind config),
 * the one-gold-everywhere standard set Oct 18 2026. The rest of this repo still runs
 * on the older #C99742 / #FDB913 pair; that's a pre-existing drift this page doesn't
 * try to fix.
 */

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const GOLD = '#F5A623';

const ARCADE_CSS = `
.cbl-arcade { background:#0A0A0A; color:#fff; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; min-height:100vh; }
.cbl-arcade *,.cbl-arcade *::before,.cbl-arcade *::after { box-sizing:border-box; }
.cbl-arcade a { color:inherit; text-decoration:none; }

@keyframes cbl-arcade-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }

.cbl-arcade .hero { padding:64px 24px 24px; text-align:center; }
.cbl-arcade .eyebrow {
  display:inline-flex; align-items:center; gap:10px; justify-content:center;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em; color:${GOLD};
  text-transform:uppercase; margin-bottom:14px;
}
.cbl-arcade .eyebrow::before { content:''; width:8px; height:8px; border-radius:50%; background:${GOLD}; animation:cbl-arcade-pulse 2.4s ease-in-out infinite; }
.cbl-arcade h1 {
  font-weight:900; font-size:clamp(44px,7vw,76px); line-height:.95; letter-spacing:-.02em;
  text-transform:uppercase; margin:0 0 14px; color:#fff;
}
.cbl-arcade .lede { font-size:16px; line-height:1.5; color:#B8B8B8; max-width:52ch; margin:0 auto; }

.cbl-arcade .grid {
  max-width:900px; margin:40px auto 80px; padding:0 24px;
  display:grid; grid-template-columns:repeat(2,1fr); gap:20px;
}
@media (max-width: 700px) { .cbl-arcade .grid { grid-template-columns:1fr; } }

.cbl-arcade .card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; padding:28px; display:flex; flex-direction:column; gap:14px;
  transition:transform .3s, border-color .3s;
}
.cbl-arcade .card:hover { transform:translateY(-4px); border-color:rgba(245,166,35,.45); }
.cbl-arcade .card .ic {
  width:56px; height:56px; border-radius:14px; background:#0A0A0A; border:1px solid rgba(245,166,35,.35);
  display:flex; align-items:center; justify-content:center; color:${GOLD};
}
.cbl-arcade .card h3 {
  font-weight:900; font-size:24px; line-height:1; text-transform:uppercase; letter-spacing:-.01em; margin:0; color:#fff;
}
.cbl-arcade .card .tagline {
  font-family:${MONO}; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:${GOLD}; margin:-6px 0 0;
}
.cbl-arcade .card p.desc { color:#A8A8A8; font-size:14px; line-height:1.55; margin:0; flex:1; }
.cbl-arcade .card .play {
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  background:${GOLD}; color:#000; font-weight:700; font-size:14px;
  border-radius:999px; padding:12px 22px; margin-top:4px;
}
.cbl-arcade .card .play:hover { background:#E09612; }

.cbl-arcade .back { display:block; text-align:center; font-size:13px; color:#888; text-decoration:underline; padding-bottom:64px; }
.cbl-arcade .back:hover { color:#fff; }
`;

let injected = false;
function injectStyles() {
  if (injected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = ARCADE_CSS;
  document.head.appendChild(style);
  injected = true;
}

const GAMES = [
  {
    name: 'ParKING',
    tagline: 'Idle Parking Tycoon',
    description: 'Build a parking empire from a gravel lot to the stars. Idle income, upgrades, prestige.',
    url: 'https://parking-idle-tycoon.netlify.app',
  },
  {
    name: 'CBL Pinball',
    tagline: 'City Bucket List Pinball',
    description: 'A full pinball table, CBL themed. Quick to pick up, hard to put down.',
    url: 'https://cbl-bucket-list-pinball.netlify.app',
  },
];

export function Arcade() {
  injectStyles();
  return (
    <main className="cbl-arcade">
      <section className="hero">
        <div className="eyebrow">free to play</div>
        <h1>Arcade</h1>
        <p className="lede">A couple of games we built for fun. Open to riders, drivers and everyone in&nbsp;between.</p>
      </section>

      <div className="grid">
        {GAMES.map((game) => (
          <div className="card" key={game.name}>
            <div className="ic">
              <Gamepad2 size={28} />
            </div>
            <p className="tagline">{game.tagline}</p>
            <h3>{game.name}</h3>
            <p className="desc">{game.description}</p>
            <a className="play" href={game.url} target="_blank" rel="noopener noreferrer">
              Play {game.name}
              <ExternalLink size={16} />
            </a>
          </div>
        ))}
      </div>

      <Link className="back" to="/">
        ← Back to Home
      </Link>
    </main>
  );
}
