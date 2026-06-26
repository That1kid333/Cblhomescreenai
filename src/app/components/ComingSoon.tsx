import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';

/**
 * Standard treatment for any feature that's shown on the site but isn't a
 * real, finished service yet. Two forms:
 *  - <ComingSoonPage> — replaces an entire page's content.
 *  - <ComingSoonInline> — marks a single button/CTA inside an otherwise-live
 *    page as not-yet-available, without hiding the rest of the page.
 *
 * Keep using these two instead of ad-hoc "TODO" buttons or dead hrefs — they
 * give visitors an honest, on-brand answer instead of a link to nowhere.
 */

const GOLD = '#C99742';
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

const SOON_CSS = `
.cbl-soon { background:#0A0A0A; color:#fff; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; min-height:80vh; }
.cbl-soon *,.cbl-soon *::before,.cbl-soon *::after { box-sizing:border-box; }
.cbl-soon button { font-family:inherit; cursor:pointer; }
.cbl-soon a { color:inherit; }

@keyframes cbl-soon-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }

.cbl-soon .hero {
  position:relative; overflow:hidden; min-height:80vh; display:flex; align-items:center;
  background:
    linear-gradient(180deg, rgba(10,10,10,.45) 0%, rgba(10,10,10,.7) 45%, rgba(10,10,10,.96) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:80px 48px;
}
.cbl-soon .inner { max-width:640px; margin:0 auto; text-align:center; }
.cbl-soon .eyebrow {
  display:inline-flex; align-items:center; gap:10px; justify-content:center;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em; color:#8a8a8a;
  text-transform:uppercase; margin-bottom:18px;
}
.cbl-soon .eyebrow::before { content:''; width:8px; height:8px; border-radius:50%; background:${GOLD}; animation:cbl-soon-pulse 2.4s ease-in-out infinite; }
.cbl-soon h1 {
  font-weight:900; font-size:clamp(40px,6vw,64px); line-height:1; letter-spacing:-.02em;
  text-transform:uppercase; margin:0 0 18px; color:#fff;
}
.cbl-soon p.blurb { font-size:17px; line-height:1.5; color:#B8B8B8; margin:0 0 32px; }
.cbl-soon .eta { display:inline-block; margin-bottom:28px; font-family:${MONO}; font-size:12px; letter-spacing:.1em; color:${GOLD}; text-transform:uppercase; }

.cbl-soon form.notify { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-bottom:18px; }
.cbl-soon form.notify input {
  background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.14); border-radius:999px;
  padding:12px 18px; color:#fff; font-size:14px; min-width:240px;
}
.cbl-soon form.notify input::placeholder { color:#777; }
.cbl-soon form.notify button {
  background:${GOLD}; color:#0A0A0A; border:0; border-radius:999px; padding:12px 26px;
  font-weight:700; font-size:14px; letter-spacing:.02em;
}
.cbl-soon form.notify button:disabled { opacity:.6; cursor:default; }
.cbl-soon .notify-status { font-size:13px; color:${GOLD}; margin-bottom:18px; }
.cbl-soon .back { display:inline-block; font-size:13px; color:#888; text-decoration:underline; }
.cbl-soon .back:hover { color:#fff; }

.cbl-soon-inline {
  display:inline-flex; align-items:center; gap:6px;
  background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.14);
  color:#999; border-radius:999px; padding:9px 18px;
  font-family:${MONO}; font-size:11px; letter-spacing:.08em; text-transform:uppercase;
  cursor:default;
}
.cbl-soon-inline::before { content:''; width:6px; height:6px; border-radius:50%; background:${GOLD}; }

.cbl-soon-section {
  text-align:center; padding:64px 24px; border:1px dashed rgba(255,255,255,.14); border-radius:14px;
  background:rgba(255,255,255,.02);
}
.cbl-soon-section h3 { font-weight:900; font-size:clamp(24px,3vw,32px); text-transform:uppercase; margin:0 0 10px; }
.cbl-soon-section p { color:#999; font-size:14px; line-height:1.5; max-width:48ch; margin:0 auto; }
`;

let injected = false;
function injectStyles() {
  if (injected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = SOON_CSS;
  document.head.appendChild(style);
  injected = true;
}

export function ComingSoonPage({
  title,
  blurb,
  eta,
  icon,
}: {
  title: string;
  blurb: string;
  eta?: string;
  icon?: ReactNode;
}) {
  injectStyles();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Friend',
          email,
          phone: '',
          topic: `${title} — Notify Me`,
          message: `Please notify me when ${title} launches.`,
        }),
      });
    } catch {
      // Best-effort — still show confirmation so the visitor isn't blocked.
    } finally {
      setSubmitting(false);
      setDone(true);
    }
  };

  return (
    <main className="cbl-soon">
      <section className="hero">
        <div className="inner">
          <div className="eyebrow">coming soon</div>
          {icon}
          <h1>{title}</h1>
          <p className="blurb">{blurb}</p>
          {eta && <div className="eta">{eta}</div>}

          {done ? (
            <p className="notify-status">You're on the list — we'll email you when {title} is live.</p>
          ) : (
            <form className="notify" onSubmit={handleSubmit}>
              <input
                type="email"
                required
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" disabled={submitting}>
                {submitting ? 'Sending…' : 'Notify Me'}
              </button>
            </form>
          )}

          <div>
            <Link className="back" to="/">
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export function ComingSoonInline({ label }: { label: string }) {
  injectStyles();
  return <span className="cbl-soon-inline">{label} · Coming Soon</span>;
}

// Same idea as ComingSoonInline but for a whole tab/section nested inside an
// otherwise-live page (e.g. one tab of a multi-tab page) rather than a single button.
export function ComingSoonSection({ title, blurb }: { title: string; blurb: string }) {
  injectStyles();
  return (
    <div className="cbl-soon-section">
      <h3>{title}</h3>
      <p>{blurb}</p>
    </div>
  );
}
