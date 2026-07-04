/**
 * Login — Members-only sign-in / private-membership invitation page.
 * Ported from the Claude Design "CBL Login.html" file.
 *
 * Scoped under .cbl-login. Shared Layout provides nav + footer (so the design
 * file's own topbar/footer are intentionally dropped — the live site dropdown
 * comes from Layout.tsx, which already carries the correct AFFILIATES menu).
 *
 * Editorial typography matches the rest of the site (Myriad Pro + Playfair),
 * not the design file's Barlow Condensed, so it sits beside Transportation /
 * Affiliates / Concierge typographically. Hero map backdrop reuses
 * /eats/imagery/cbl-map-backdrop.jpg; the PMA seal lives at
 * /eats/imagery/cbl-pma-seal.png (uploaded alongside the page).
 *
 * The membership form is the no-password "quick join" — it POSTs to /api/lead
 * (Netlify function → Resend → info@citybucketlist.com), same pipeline as the
 * homepage JoinModal. Real password auth stays in the app (APP_URL); the
 * "Sign in here" button links there. Full password-protected accounts unlock
 * complete blog + directory access once the auth phase lands (Justin's side).
 */
import { useState } from 'react';
import { APP_URL } from '../lib/constants';

const GOLD = '#C99742';
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";
const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';
const SEAL = '/eats/imagery/cbl-pma-seal.png';

const CSS = `
.cbl-login { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; min-height:100vh; }
.cbl-login *,.cbl-login *::before,.cbl-login *::after { box-sizing:border-box; }
.cbl-login button { font-family:inherit; cursor:pointer; }
.cbl-login a { color:inherit; text-decoration:none; }
.cbl-login input, .cbl-login select, .cbl-login textarea { font-family:inherit; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-rise  { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }

/* hero */
.cbl-login .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 30px;
}
.cbl-login .hero-inner { max-width:1280px; margin:0 auto; }
.cbl-login .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#fff; font-weight:700; text-transform:lowercase; margin-bottom:10px;
}
.cbl-login .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:${GOLD}; animation:cbl-pulse 2.4s ease-in-out infinite;
}
.cbl-login h1.hero-title {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(56px,7.4vw,108px); line-height:.9; letter-spacing:-.02em;
  text-transform:uppercase; color:#fff; margin:0;
}
.cbl-login .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap; margin-top:4px;
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(28px,3vw,44px); text-transform:uppercase;
  letter-spacing:-.005em; line-height:1; color:${GOLD};
}
.cbl-login .hero-subtitle .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:${GOLD}; text-transform:none; letter-spacing:0; font-size:.84em;
}
.cbl-login .hero .lede { margin-top:14px; max-width:640px; font-size:16px; line-height:1.5; color:#B8B8B8; }

/* card */
.cbl-login .card-wrap { padding:0 48px 56px; }
.cbl-login .card {
  position:relative; overflow:hidden;
  max-width:960px; margin:0;
  background:
    radial-gradient(120% 80% at 20% 0%, rgba(201,151,66,.06), rgba(201,151,66,0) 60%),
    #121212;
  border:1px solid rgba(255,255,255,.08);
  border-radius:22px 0 22px 0;
  box-shadow:0 30px 70px rgba(0,0,0,.5);
  display:grid; grid-template-columns:0.92fr 1.08fr;
  animation:cbl-rise .6s ease both;
}
.cbl-login .card > .col { padding:48px 46px; }

/* left — seal pane */
.cbl-login .seal-pane {
  position:relative; display:flex; flex-direction:column; align-items:center;
  text-align:center; justify-content:center;
  border-right:1px solid rgba(255,255,255,.07);
  background:linear-gradient(180deg, rgba(255,255,255,.015), rgba(255,255,255,0));
}
.cbl-login .seal-wrap { position:relative; margin-bottom:22px; }
.cbl-login .seal-wrap::before {
  content:''; position:absolute; inset:-14%;
  background:radial-gradient(circle at 50% 45%,
    rgba(201,151,66,.30) 0%, rgba(201,151,66,.10) 38%, rgba(201,151,66,0) 68%);
  z-index:0;
}
.cbl-login .seal {
  position:relative; z-index:1; width:300px; max-width:60vw; height:auto;
  display:block; filter:drop-shadow(0 16px 40px rgba(0,0,0,.55));
}
.cbl-login .seal-title {
  font-family:${DISPLAY}; font-weight:900;
  font-size:34px; line-height:.94; letter-spacing:-.01em;
  text-transform:uppercase; color:#fff; margin:0;
}
.cbl-login .seal-title .it {
  display:block; font-family:${ITALIC}; font-style:italic;
  font-weight:600; font-size:.5em; color:${GOLD};
  text-transform:none; margin-top:7px;
}
.cbl-login .seal-copy { max-width:380px; margin:14px auto 0; font-size:14.5px; line-height:1.6; color:#ababab; }
.cbl-login .trust-row { display:flex; flex-wrap:wrap; justify-content:center; gap:9px; margin-top:22px; }
.cbl-login .trust {
  font-family:${MONO}; font-size:10px;
  letter-spacing:.12em; text-transform:uppercase; color:${GOLD};
  border:1px solid rgba(201,151,66,.34); border-radius:999px;
  padding:7px 13px; background:rgba(201,151,66,.06);
}

/* right — form pane */
.cbl-login .form-pane { display:flex; flex-direction:column; }
.cbl-login .form-eyebrow {
  font-family:${MONO}; font-size:11px;
  letter-spacing:.18em; text-transform:uppercase; color:#707070; margin-bottom:10px;
}
.cbl-login .form-head {
  font-family:${DISPLAY}; font-weight:900;
  font-size:34px; line-height:.96; letter-spacing:-.01em;
  text-transform:uppercase; margin:0 0 26px;
}
.cbl-login .form-head .g { color:${GOLD}; }
.cbl-login .label {
  display:block; font-family:${MONO}; font-size:11px;
  letter-spacing:.16em; text-transform:uppercase; color:#8f8f8f; margin:0 0 8px 2px;
}
.cbl-login .label .req { color:${GOLD}; }
.cbl-login .field { position:relative; margin-bottom:16px; }
.cbl-login .field input {
  width:100%; background:#0A0A0A; color:#fff; font-size:15px;
  border:1px solid rgba(255,255,255,.12); border-radius:12px;
  padding:13px 14px; transition:border-color .2s, box-shadow .2s, background .2s;
}
.cbl-login .field input::placeholder { color:#6a6a6a; }
.cbl-login .field input:focus {
  outline:none; border-color:${GOLD}; background:rgba(201,151,66,.05);
  box-shadow:0 0 0 4px rgba(201,151,66,.16);
}
.cbl-login .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:0 16px; }
.cbl-login .opt { text-transform:none; letter-spacing:0; color:#6f6f6f; }

.cbl-login .divider { height:1px; background:rgba(255,255,255,.08); margin:8px 0 18px; }
.cbl-login .consent { display:flex; align-items:flex-start; gap:11px; margin:0 2px 22px; }
.cbl-login .consent input {
  appearance:none; -webkit-appearance:none; flex-shrink:0;
  width:19px; height:19px; margin-top:1px; border:1.5px solid rgba(255,255,255,.28);
  border-radius:5px; background:rgba(255,255,255,.04); cursor:pointer; position:relative;
  transition:background .2s, border-color .2s;
}
.cbl-login .consent input:checked { background:${GOLD}; border-color:${GOLD}; }
.cbl-login .consent input:checked::after {
  content:''; position:absolute; left:5.5px; top:2px; width:5px; height:9px;
  border:solid #000; border-width:0 2px 2px 0; transform:rotate(45deg);
}
.cbl-login .consent label { font-size:12.5px; line-height:1.5; color:#9a9a9a; cursor:pointer; }
.cbl-login .consent a { color:${GOLD}; text-decoration:underline; text-underline-offset:2px; }

.cbl-login .btn {
  border:0; cursor:pointer; font-family:${DISPLAY}; font-weight:800;
  letter-spacing:.05em; text-transform:uppercase;
  transition:transform .12s, background .2s, box-shadow .2s;
}
.cbl-login .btn:active { transform:translateY(1px); }
.cbl-login .btn-primary {
  width:100%; border-radius:999px; font-size:15px; padding:14px 44px; letter-spacing:.14em;
  background:${GOLD}; color:#000;
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  box-shadow:0 10px 26px rgba(201,151,66,.3);
}
.cbl-login .btn-primary:hover { background:#DDB15F; }
.cbl-login .btn-primary .arr { font-size:15px; }

.cbl-login .switch {
  display:flex; align-items:center; gap:14px; margin:20px 0 14px;
  color:#8a8a8a; font-size:13px; font-weight:600; letter-spacing:.02em; text-transform:uppercase;
}
.cbl-login .switch::before, .cbl-login .switch::after {
  content:''; flex:1; height:1px; background:rgba(255,255,255,.1);
}
.cbl-login .btn-ghost {
  width:100%; border-radius:999px; font-size:15px; padding:14px 44px; letter-spacing:.14em;
  background:transparent; color:${GOLD}; border:1.5px solid rgba(201,151,66,.5);
  display:inline-flex; align-items:center; justify-content:center; gap:10px;
  font-family:${DISPLAY}; font-weight:800; text-transform:uppercase;
  transition:transform .12s, background .2s, border-color .2s;
}
.cbl-login .btn-ghost:hover { background:rgba(201,151,66,.1); border-color:${GOLD}; color:#DDB15F; }
.cbl-login .btn-primary:disabled { background:#555; cursor:not-allowed; box-shadow:none; }
.cbl-login .respond {
  margin-top:18px; font-family:${MONO}; font-size:10.5px;
  letter-spacing:.14em; text-transform:uppercase; color:#6f6f6f;
}

.cbl-login .perks { list-style:none; margin:0 0 18px; padding:0; display:flex; flex-direction:column; gap:9px; }
.cbl-login .perks li { position:relative; padding-left:22px; font-size:13.5px; line-height:1.45; color:#B8B8B8; }
.cbl-login .perks li::before { content:''; position:absolute; left:0; top:9px; width:13px; height:1.5px; background:${GOLD}; }
.cbl-login .perks li b { color:#fff; }
.cbl-login .btn-ghost:disabled { opacity:.5; cursor:not-allowed; }
.cbl-login .signin-line { margin-top:18px; text-align:center; font-size:13px; color:#8a8a8a; }
.cbl-login .signin-line a { color:${GOLD}; font-weight:700; }
.cbl-login .signin-line a:hover { text-decoration:underline; }

.cbl-login .alert { border-radius:12px; padding:11px 14px; font-size:13.5px; line-height:1.45; margin-bottom:16px; }
.cbl-login .alert.err { background:rgba(220,60,60,.12); border:1px solid rgba(220,60,60,.4); color:#f0b3b3; }

.cbl-login .note { font-size:12.5px; line-height:1.55; color:#8a8a8a; margin:14px 2px 0; }
.cbl-login .note a { color:${GOLD}; text-decoration:none; white-space:nowrap; }
.cbl-login .note a:hover { text-decoration:underline; }

.cbl-login .success { text-align:center; padding:24px 0; }
.cbl-login .success .mark { width:56px; height:56px; margin:0 auto 16px; border-radius:50%; border:2px solid ${GOLD}; display:grid; place-items:center; color:${GOLD}; font-size:26px; }
.cbl-login .success h3 { font-family:${DISPLAY}; font-weight:900; font-size:30px; text-transform:uppercase; color:#fff; margin:0 0 8px; }
.cbl-login .success h3 .g { color:${GOLD}; }
.cbl-login .success p { font-size:14.5px; line-height:1.55; color:#B8B8B8; margin:0 0 20px; }

.cbl-login .hp { position:absolute; left:-9999px; top:-9999px; }

/* responsive */
@media (max-width:980px) {
  .cbl-login .card { grid-template-columns:1fr; }
  /* Action first on mobile: signup pane on top, seal/brand story below. */
  .cbl-login .form-pane { order:1; }
  .cbl-login .seal-pane { order:2; border-right:0; border-top:1px solid rgba(255,255,255,.07); }
}
@media (max-width:560px) {
  .cbl-login .hero, .cbl-login .card-wrap { padding-left:18px; padding-right:18px; }
  /* Keep the signup pane inside the first viewport: compact hero, no lede
     (the seal pane below carries the story), tightened fields, no perks. */
  .cbl-login .hero { padding-top:14px; padding-bottom:14px; }
  .cbl-login .eyebrow { margin-bottom:4px; font-size:10.5px; }
  .cbl-login h1.hero-title { font-size:clamp(38px,11vw,52px); }
  .cbl-login .hero-subtitle { font-size:clamp(20px,5.5vw,26px); margin-top:2px; }
  .cbl-login .hero .lede { display:none; }
  .cbl-login .card-wrap { padding-bottom:28px; }
  .cbl-login .card > .col { padding:20px 18px; }
  .cbl-login .grid-2 { grid-template-columns:1fr; }
  .cbl-login .perks { display:none; }
  .cbl-login .form-eyebrow { display:none; }
  .cbl-login .form-head { font-size:24px; margin-bottom:14px; }
  .cbl-login .btn-primary, .cbl-login .btn-ghost { padding:12px 30px; font-size:13.5px; }
  .cbl-login .note { margin-top:10px; font-size:11.5px; }
  .cbl-login .switch { margin:14px 0 12px; }
  .cbl-login .label { margin-bottom:5px; }
  .cbl-login .field { margin-bottom:10px; }
  .cbl-login .field input { padding:10px 12px; font-size:14px; }
  .cbl-login .divider { margin:4px 0 12px; }
  .cbl-login .consent { margin-bottom:14px; }
  .cbl-login .consent label { font-size:11.5px; }
  .cbl-login .signin-line { margin-top:12px; font-size:12.5px; }
  .cbl-login .respond { display:none; }
}
`;

export function Login() {
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [company, setCompany] = useState(''); // honeypot
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

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
          source: 'login-page',
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

  return (
    <main className="cbl-login">
      <style>{CSS}</style>

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">members only · private membership association</div>
          <h1 className="hero-title">Login</h1>
          <div className="hero-subtitle">
            <span>Welcome back.</span>
            <span className="it">Let's ride.</span>
          </div>
          <p className="lede">
            Create your free password-protected membership for the complete experience — full
            blog &amp; directory access, plus rides from your local independent-contractor
            drivers in the CBL App. In a hurry? The two-step quick join keeps you in the loop,
            no password needed.
          </p>
        </div>
      </section>

      {/* MEMBERSHIP CARD */}
      <div className="card-wrap">
        <div className="card">

          {/* Left: PMA seal */}
          <div className="col seal-pane">
            <div className="seal-wrap">
              <img className="seal" src={SEAL} alt="CityBucketList Private Membership Association Seal" />
            </div>
            <h2 className="seal-title">
              More than a ride.
              <span className="it">It's a membership.</span>
            </h2>
            <p className="seal-copy">
              CityBucketList is a Private Membership Association. Explore the directory, discover
              local restaurants, attractions, and stays — then download the CBL App to connect with
              your local independent-contractor drivers.
            </p>
            <div className="trust-row">
              <span className="trust">100% Free to Join</span>
              <span className="trust">Full Directory Access</span>
              <span className="trust">Local Spots &amp; Stays</span>
              <span className="trust">Rides via CBL App</span>
            </div>
          </div>

          {/* Right: form */}
          <div className="col form-pane">
            <div className="form-eyebrow">Welcome</div>
            <h2 className="form-head">Private Membership <span className="g">Invitation</span></h2>

            {status === 'success' ? (
              <div className="success">
                <div className="mark" aria-hidden="true">✓</div>
                <h3>You're <span className="g">in.</span></h3>
                <p>Check your inbox — we'll keep you posted on the best of the city.</p>
                <a className="btn btn-ghost" href={APP_URL}>Create your free account →</a>
                <p className="note">
                  Quick join keeps you in the loop. For full blog &amp; directory access — and
                  rides in the app — you'll need a free password-protected account.
                </p>
              </div>
            ) : (
              <>
                {/* Option 1 — full membership (featured) */}
                <ul className="perks">
                  <li><b>Full blog &amp; directory access</b> — post, save spots, member pricing</li>
                  <li><b>Rides with your own driver</b> — schedule &amp; message from the app</li>
                  <li><b>Buckee, your AI concierge</b> — plus savings in every partner city</li>
                </ul>
                <a className="btn btn-primary" href={APP_URL}>
                  Create Full Account <span className="arr">→</span>
                </a>
                <p className="note" style={{ textAlign: 'center' }}>
                  100% free · password-protected · everything unlocked
                </p>

                <div className="switch">In a hurry? Quick join</div>

                {/* Option 2 — easy two-step, no password */}
                <form onSubmit={handleSubmit}>
                {status === 'error' && <div className="alert err" role="alert">{errorMessage}</div>}

                <div className="grid-2">
                  <div className="field">
                    <label className="label" htmlFor="first">First name <span className="req">*</span></label>
                    <input
                      type="text"
                      id="first"
                      name="first"
                      placeholder="Enter your first name"
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      maxLength={100}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="label" htmlFor="cell">Cell <span className="opt">(optional)</span></label>
                    <input
                      type="tel"
                      id="cell"
                      name="cell"
                      placeholder="(555) 123-4567"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (!e.target.value.trim()) setSmsConsent(false);
                      }}
                      maxLength={30}
                    />
                  </div>
                </div>

                <div className="field">
                  <label className="label" htmlFor="email">Email <span className="req">*</span></label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="your.email@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={200}
                    required
                  />
                </div>

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

                <div className="divider" />

                <div className="consent">
                  <input
                    type="checkbox"
                    id="sms"
                    checked={smsConsent}
                    disabled={!phone.trim()}
                    onChange={(e) => setSmsConsent(e.target.checked)}
                  />
                  <label htmlFor="sms">
                    I agree to receive SMS notifications from CityBucketList.com. Message &amp; data
                    rates may apply. <a href="/terms#privacy-policy">See our Privacy policy.</a>
                  </label>
                </div>

                <button type="submit" className="btn btn-ghost" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Sending…' : <>Quick Join — No Password <span className="arr">→</span></>}
                </button>

                <p className="note">
                  Quick join keeps you in the loop — updates &amp; local tips only. Full access
                  lives in your free account above.
                </p>

                <div className="signin-line">
                  Already a member? <a href={APP_URL}>Sign in here →</a>
                </div>

                <div className="respond">Free to join · Directory access · Earn on every local spot you bring</div>
                </form>
              </>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
