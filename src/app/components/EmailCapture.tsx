import { useState } from 'react';
import { subscribeEmail } from '../lib/blog';

/**
 * Compact, inline email-capture band for mid-article placement on blog posts.
 * Per CBL Blog UI standards this is an INLINE band (it scrolls into view around
 * the article's halfway mark) — never a pop-up. Reuses subscribeEmail() →
 * newsletter_subscribers, tagged by `source`.
 */

const GOLD = '#C99742';
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const ITALIC = "'Playfair Display', serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const CSS = `
.cbl-capture { max-width:720px; margin:40px 0; padding:26px 28px;
  background:linear-gradient(135deg, rgba(201,151,66,.10), rgba(20,20,20,.6));
  border:1px solid rgba(201,151,66,.28); border-radius:20px 0 20px 0; }
.cbl-capture .cap-eyebrow { font-family:${MONO}; font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:${GOLD}; font-weight:700; margin-bottom:8px; }
.cbl-capture h3 { font-family:${DISPLAY}; font-weight:900; font-size:24px; line-height:1.1; color:#fff; margin:0 0 6px; }
.cbl-capture h3 .it { font-family:${ITALIC}; font-style:italic; font-weight:600; color:${GOLD}; }
.cbl-capture p { font-size:14.5px; line-height:1.5; color:#B8B8B8; margin:0 0 16px; max-width:52ch; }
.cbl-capture form { display:flex; gap:10px; flex-wrap:wrap; }
.cbl-capture input[type=email] { flex:1; min-width:0; background:#0d0d0d; border:1px solid rgba(255,255,255,.16);
  border-radius:999px; padding:13px 18px; color:#fff; font-family:${DISPLAY}; font-size:15px; outline:none; }
.cbl-capture input[type=email]:focus { border-color:${GOLD}; }
.cbl-capture input[type=email]::placeholder { color:#777; }
.cbl-capture button { background:${GOLD}; color:#000; border:0; border-radius:999px; padding:13px 24px;
  font-family:${DISPLAY}; font-weight:800; font-size:14px; letter-spacing:.04em; text-transform:uppercase; cursor:pointer; white-space:nowrap; transition:background .18s; }
.cbl-capture button:hover { background:#DDB15F; }
.cbl-capture button:disabled { opacity:.6; cursor:default; }
.cbl-capture .cap-msg { margin:12px 0 0; font-size:13.5px; color:#B8B8B8; }
.cbl-capture .cap-msg.err { color:#E5934B; }
.cbl-capture .cap-done { font-family:${DISPLAY}; font-weight:700; font-size:16px; color:#fff; margin:4px 0 0; display:flex; align-items:center; gap:9px; }
.cbl-capture .cap-done svg { width:20px; height:20px; color:#4DBF66; flex-shrink:0; }
.cbl-capture .hp { position:absolute; left:-9999px; width:1px; height:1px; opacity:0; }
`;

export function EmailCapture({ source = 'blog-post' }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle');
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (hp) return; // honeypot — drop bots silently
    setState('sending');
    setMsg('');
    const { error, already } = await subscribeEmail(email, source);
    if (error) {
      setState('idle');
      setMsg(error);
      return;
    }
    setState('done');
    setMsg(already ? "You're already on the list — thanks!" : "You're in. Watch your inbox for the next dispatch.");
    setEmail('');
  }

  return (
    <div className="cbl-capture">
      <style>{CSS}</style>
      <div className="cap-eyebrow">the cbl dispatch</div>
      {state === 'done' ? (
        <>
          <h3>Enjoying the read?</h3>
          <div className="cap-done">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {msg}
          </div>
        </>
      ) : (
        <>
          <h3>
            One good email a week — <span className="it">worth opening.</span>
          </h3>
          <p>
            Local picks, member-only deals, and the occasional note from Buckee — written by real people who
            know your city. No spam, unsubscribe anytime.
          </p>
          <form onSubmit={submit}>
            <input
              className="hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              aria-hidden="true"
            />
            <input
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
            />
            <button type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? 'Joining…' : 'Get the dispatch'}
            </button>
          </form>
          {msg && <p className="cap-msg err">{msg}</p>}
        </>
      )}
    </div>
  );
}
