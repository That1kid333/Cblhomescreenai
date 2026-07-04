import { useState, useEffect, useRef } from 'react';
import { APP_URL } from '../lib/constants';

/**
 * JoinModal — the two-path "Join Now — Free" chooser.
 *
 * Option A (featured): no-password quick join — first name + email (+ optional
 * cell with SMS consent) POSTed to /api/lead, which emails the lead to
 * info@citybucketlist.com and sends the visitor a branded confirmation.
 * Option B: link out to the full app signup at app.citybucketlist.com.
 *
 * Scoped under .cbl-join (per-component <style> injection, like every page).
 * Mount as a direct child of a page's <main> — position:fixed breaks inside
 * ancestors with filter/transform (e.g. Home's slide-fade hero copy).
 */

const GOLD = '#C99742';
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const JOIN_CSS = `
.cbl-join { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:16px; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-join *,.cbl-join *::before,.cbl-join *::after { box-sizing:border-box; }
.cbl-join .backdrop { position:absolute; inset:0; background:rgba(0,0,0,.7); backdrop-filter:blur(2px); }
.cbl-join .panel {
  position:relative; width:min(440px,100%); max-height:calc(100dvh - 32px); overflow-y:auto;
  background:#141414; border:1px solid rgba(201,151,66,.45); border-radius:18px 0 18px 0;
  box-shadow:0 18px 44px rgba(0,0,0,.55); padding:28px;
  animation:cbl-join-pop .26s cubic-bezier(.2,.9,.3,1.25) both;
}
@keyframes cbl-join-pop { 0% { opacity:0; transform:translateY(8px) scale(.96); } 100% { opacity:1; transform:translateY(0) scale(1); } }
@media (prefers-reduced-motion: reduce) { .cbl-join .panel { animation:none; } }

.cbl-join .close {
  position:absolute; top:12px; right:12px; background:transparent; border:0;
  color:#888; cursor:pointer; font-size:15px; line-height:1; padding:6px 8px;
}
.cbl-join .close:hover { color:#fff; }

.cbl-join .eyebrow { font-family:${MONO}; font-size:11px; letter-spacing:.18em; text-transform:uppercase; color:${GOLD}; margin-bottom:8px; }
.cbl-join h2 { font-family:${DISPLAY}; font-weight:900; font-size:30px; line-height:.96; letter-spacing:-.01em; text-transform:uppercase; color:#fff; margin:0 0 8px; }
.cbl-join h2 .it { font-family:${ITALIC}; font-style:italic; font-weight:600; color:${GOLD}; text-transform:none; }
.cbl-join .sub { font-size:14px; line-height:1.5; color:#B8B8B8; margin:0 0 20px; }

.cbl-join label { display:block; font-family:${MONO}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:#8f8f8f; margin:0 0 7px 2px; }
.cbl-join label .req { color:${GOLD}; }
.cbl-join .field { margin-bottom:14px; }
.cbl-join .field input {
  width:100%; background:#0A0A0A; color:#fff; font-size:15px; font-family:inherit;
  border:1px solid rgba(255,255,255,.12); border-radius:12px; padding:12px 14px;
  transition:border-color .2s, box-shadow .2s, background .2s;
}
.cbl-join .field input::placeholder { color:#6a6a6a; }
.cbl-join .field input:focus { outline:none; border-color:${GOLD}; background:rgba(201,151,66,.05); box-shadow:0 0 0 4px rgba(201,151,66,.16); }

.cbl-join .sms-consent { display:flex; align-items:flex-start; gap:10px; margin:2px 2px 16px; }
.cbl-join .sms-consent input { accent-color:${GOLD}; width:17px; height:17px; margin-top:1px; flex-shrink:0; cursor:pointer; }
.cbl-join .sms-consent label { font-family:inherit; font-size:12.5px; line-height:1.5; color:#9a9a9a; text-transform:none; letter-spacing:0; margin:0; cursor:pointer; }

.cbl-join .submit {
  width:100%; border:0; cursor:pointer; border-radius:999px; padding:14px 36px;
  background:${GOLD}; color:#000; font-family:${DISPLAY}; font-weight:900;
  font-size:14px; letter-spacing:.14em; text-transform:uppercase; transition:background .2s;
}
.cbl-join .submit:hover { background:#DDB15F; }
.cbl-join .submit:disabled { background:#555; cursor:not-allowed; }

.cbl-join .alert { border-radius:12px; padding:11px 14px; font-size:13.5px; line-height:1.45; margin-bottom:14px; }
.cbl-join .alert.err { background:rgba(220,60,60,.12); border:1px solid rgba(220,60,60,.4); color:#f0b3b3; }

.cbl-join .note { font-size:12px; line-height:1.55; color:#8a8a8a; margin:12px 2px 0; }
.cbl-join .note a { color:${GOLD}; text-decoration:none; white-space:nowrap; }
.cbl-join .note a:hover { text-decoration:underline; }

.cbl-join .switch {
  display:flex; align-items:center; gap:14px; margin:18px 0 14px;
  color:${GOLD}; font-size:13px; font-weight:900; letter-spacing:.1em; text-transform:uppercase;
}
.cbl-join .switch::before, .cbl-join .switch::after { content:''; flex:1; height:1px; background:rgba(201,151,66,.4); }
.cbl-join .alt {
  display:flex; align-items:center; justify-content:center; gap:10px; width:100%;
  border:0; border-radius:999px; padding:14px 32px;
  background:${GOLD}; color:#000; font-family:${DISPLAY}; font-weight:900; font-size:13.5px;
  letter-spacing:.14em; text-transform:uppercase; text-decoration:none;
  transition:background .2s;
}
.cbl-join .alt:hover { background:#DDB15F; }
.cbl-join .alt-cap { text-align:center; font-family:${MONO}; font-size:11px; letter-spacing:.06em; color:#6f6f6f; margin:8px 0 0; }

.cbl-join .success { text-align:center; padding:10px 0 4px; }
.cbl-join .success .mark { width:52px; height:52px; margin:0 auto 14px; border-radius:50%; border:2px solid ${GOLD}; display:grid; place-items:center; color:${GOLD}; font-size:24px; }
.cbl-join .success h3 { font-family:${DISPLAY}; font-weight:900; font-size:28px; text-transform:uppercase; color:#fff; margin:0 0 8px; }
.cbl-join .success h3 .g { color:${GOLD}; }
.cbl-join .success p { font-size:14px; line-height:1.55; color:#B8B8B8; margin:0 0 18px; }

.cbl-join .hp { position:absolute; left:-9999px; top:-9999px; }

@media (max-width:480px) {
  .cbl-join .panel { padding:24px 20px; }
  .cbl-join h2 { font-size:26px; }
}
`;

type JoinModalProps = {
  open: boolean;
  onClose: () => void;
  /** Tags the lead email with which CTA converted (e.g. "home-hero"). */
  source?: string;
};

export function JoinModal({ open, onClose, source = 'site' }: JoinModalProps) {
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [company, setCompany] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const panelRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    firstFieldRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          email,
          phone,
          smsConsent: Boolean(phone.trim() && smsConsent),
          source,
          company,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok && result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please check your connection and try again.');
    }
  };

  const accessNote = (
    <p className="note">
      Quick join keeps you in the loop. Full site &amp; app access requires a free
      password-protected account — <a href={APP_URL}>create yours here →</a>
    </p>
  );

  return (
    <div className="cbl-join" role="dialog" aria-modal="true" aria-labelledby="cbl-join-title">
      <style>{JOIN_CSS}</style>
      <div className="backdrop" onClick={onClose} />
      <div className="panel" ref={panelRef}>
        <button className="close" aria-label="Close" onClick={onClose}>✕</button>

        {status === 'success' ? (
          <div className="success">
            <div className="mark" aria-hidden="true">✓</div>
            <h3>You're <span className="g">in.</span></h3>
            <p>Check your inbox — we'll keep you posted on the best of the city.</p>
            <a className="alt" href={APP_URL}>Create your free account →</a>
            {accessNote}
          </div>
        ) : (
          <>
            <div className="eyebrow">join the list</div>
            <h2 id="cbl-join-title">Get in <span className="it">free.</span></h2>
            <p className="sub">First name and email — that's it. No password, no spam.</p>

            {status === 'error' && <div className="alert err" role="alert">{errorMessage}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="cbl-join-first">First name <span className="req">*</span></label>
                <input
                  ref={firstFieldRef}
                  id="cbl-join-first"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                  maxLength={100}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="cbl-join-email">Email <span className="req">*</span></label>
                <input
                  id="cbl-join-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  autoComplete="email"
                  maxLength={200}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="cbl-join-cell">Cell <span style={{ textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                <input
                  id="cbl-join-cell"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (!e.target.value.trim()) setSmsConsent(false);
                  }}
                  placeholder="(555) 123-4567"
                  autoComplete="tel"
                  maxLength={30}
                />
              </div>

              {phone.trim() !== '' && (
                <div className="sms-consent">
                  <input
                    id="cbl-join-sms"
                    type="checkbox"
                    checked={smsConsent}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                  />
                  <label htmlFor="cbl-join-sms">
                    Text me local tips &amp; offers. Message &amp; data rates may apply.
                  </label>
                </div>
              )}

              {/* Honeypot — hidden from real users, bots fill it in */}
              <div className="hp" aria-hidden="true">
                <input
                  type="text"
                  name="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <button type="submit" className="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending…' : 'Join Free — No Password'}
              </button>
              {accessNote}
            </form>

            <div className="switch">Prefer the full app?</div>
            <a className="alt" href={APP_URL}>Create your free account →</a>
            <p className="alt-cap">app.citybucketlist.com</p>
          </>
        )}
      </div>
    </div>
  );
}
