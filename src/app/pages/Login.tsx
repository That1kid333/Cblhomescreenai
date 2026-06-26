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
 * Note: form actions are placeholders for now — the auth backend is a later
 * Claude Code phase (see Affiliate-Network-Integration-Guide.md sequencing).
 */
import { useState } from 'react';

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
  color:#8a8a8a; text-transform:lowercase; margin-bottom:10px;
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
.cbl-login .field .toggle {
  position:absolute; right:8px; top:34px; background:none; border:0; cursor:pointer;
  padding:8px; color:#8a8a8a; display:inline-flex; transition:color .2s;
}
.cbl-login .field .toggle:hover { color:${GOLD}; }
.cbl-login .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:0 16px; }

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
}
.cbl-login .btn-ghost:hover { background:rgba(201,151,66,.1); border-color:${GOLD}; color:#DDB15F; }
.cbl-login .respond {
  margin-top:18px; font-family:${MONO}; font-size:10.5px;
  letter-spacing:.14em; text-transform:uppercase; color:#6f6f6f;
}

/* responsive */
@media (max-width:980px) {
  .cbl-login .card { grid-template-columns:1fr; }
  .cbl-login .seal-pane { border-right:0; border-bottom:1px solid rgba(255,255,255,.07); }
}
@media (max-width:560px) {
  .cbl-login .hero, .cbl-login .card-wrap { padding-left:24px; padding-right:24px; }
  .cbl-login .card > .col { padding:34px 26px; }
  .cbl-login .grid-2 { grid-template-columns:1fr; }
}
`;

export function Login() {
  const [showPw, setShowPw] = useState(false);

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
            Sign in to your CityBucketList membership — or request your private invitation to join.
            Browse the member directory, discover local restaurants, attractions, and stays. To
            request rides from your local independent-contractor drivers, download the CBL App.
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

            <form onSubmit={(e) => e.preventDefault()}>
              <div className="grid-2">
                <div className="field">
                  <label className="label" htmlFor="first">First name <span className="req">*</span></label>
                  <input type="text" id="first" name="first" placeholder="Enter your first name" autoComplete="given-name" />
                </div>
                <div className="field">
                  <label className="label" htmlFor="cell">Cell <span className="req">*</span></label>
                  <input type="tel" id="cell" name="cell" placeholder="(555) 123-4567" autoComplete="tel" />
                </div>
              </div>

              <div className="field">
                <label className="label" htmlFor="email">Email <span className="req">*</span></label>
                <input type="email" id="email" name="email" placeholder="your.email@example.com" autoComplete="email" />
              </div>

              <div className="field">
                <label className="label" htmlFor="pw">Password <span className="req">*</span></label>
                <input
                  type={showPw ? 'text' : 'password'}
                  id="pw"
                  name="password"
                  placeholder="Create a password"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="toggle"
                  onClick={() => setShowPw((s) => !s)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                    {showPw && <line x1="3" y1="3" x2="21" y2="21" />}
                  </svg>
                </button>
              </div>

              <div className="divider" />

              <div className="consent">
                <input type="checkbox" id="sms" />
                <label htmlFor="sms">
                  I agree to receive SMS notifications from CityBucketList.com. Message &amp; data
                  rates may apply. <a href="/terms#privacy-policy">See our Privacy policy.</a>
                </label>
              </div>

              <button type="submit" className="btn btn-primary">
                Join Membership <span className="arr">→</span>
              </button>

              <div className="switch">Already a member?</div>
              <button type="button" className="btn btn-ghost">Sign in here</button>

              <div className="respond">Free to join · Directory access · Earn on every local spot you bring</div>
            </form>
          </div>

        </div>
      </div>
    </main>
  );
}
