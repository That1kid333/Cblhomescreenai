/**
 * Concierge — the flagship Concierge Program page (Affiliates family).
 * Ported from the approved standalone mockup (CBL-Concierge-Program/concierge-program-mockup.html).
 *
 * Matches the live editorial system used on Affiliates.tsx / Transportation.tsx:
 *   bg #0A0A0A · editorial gold #C99742 · Myriad Pro display · Playfair italic accents.
 * All CSS is scoped under .cbl-concierge. The shared Layout provides nav + footer,
 * so this file renders only <main>. Images are served from /public/concierge/* and
 * the shared map backdrop at /eats/imagery/cbl-map-backdrop.jpg.
 *
 * The #apply section hosts the on-brand partner application form — it POSTs to
 * /api/contact (Netlify function → Resend → info@citybucketlist.com) with a
 * partner-application topic, so applicants never bounce to an off-brand page.
 * The booking/Stripe backend is a later phase.
 */

import { useState } from 'react';
import { APP_URL } from '../lib/constants';
import conciergeDashImg from '../../assets/cbl-concierge-dashboard.png';
import plaqueImg from '../../assets/cbl-concierge-desk-plaque.png';

const CSS = `
.cbl-concierge{
  --bg:#0A0A0A; --gold:#C99742; --gold-lt:#DDB15F; --yellow:#FDB913;
  --ink:#fff; --muted:#B0B0B0; --muted2:#888; --card:#141414; --line:rgba(255,255,255,.08);
  --display:'myriad-pro','Source Sans 3','Helvetica Neue',Arial,sans-serif;
  --italic:'Playfair Display',serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  background:var(--bg); color:var(--ink); font-family:var(--display); -webkit-font-smoothing:antialiased;
}
.cbl-concierge *,.cbl-concierge *::before,.cbl-concierge *::after{box-sizing:border-box;}
.cbl-concierge button{font-family:inherit;cursor:pointer;}
.cbl-concierge a{color:inherit;text-decoration:none;}

@keyframes cbl-pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.45;transform:scale(.85);}}

/* hero */
.cbl-concierge .hero{
  position:relative;overflow:hidden;
  background:
    linear-gradient(180deg,rgba(10,10,10,.25) 0%,rgba(10,10,10,.55) 45%,rgba(10,10,10,.92) 90%,#0A0A0A 100%),
    url('/eats/imagery/cbl-map-backdrop.jpg') center top / cover no-repeat;
  padding:22px 48px 16px;
}
.cbl-concierge .wrap{max-width:1280px;margin:0 auto;}
.cbl-concierge .hero .wrap{display:grid;grid-template-columns:1.12fr .88fr;gap:44px;align-items:center;}
.cbl-concierge .hero-copy{min-width:0;}
.cbl-concierge .hero-media img{width:100%;height:auto;max-height:470px;object-fit:cover;border-radius:22px 0 22px 0;border:1px solid rgba(201,151,66,.4);box-shadow:0 26px 56px rgba(0,0,0,.55);display:block;}
.cbl-concierge .eyebrow{display:inline-flex;align-items:center;gap:10px;font-family:var(--mono);font-size:12px;letter-spacing:.14em;color:#fff;font-weight:700;text-transform:lowercase;margin-bottom:12px;}
.cbl-concierge .eyebrow::before{content:'';width:8px;height:8px;border-radius:50%;background:var(--gold);animation:cbl-pulse 2.4s ease-in-out infinite;}
.cbl-concierge h1.hero-title{font-family:var(--display);font-weight:900;font-size:clamp(56px,7.4vw,108px);line-height:.9;letter-spacing:-.02em;text-transform:uppercase;margin:0;color:#fff;}
.cbl-concierge .hero-subtitle{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;font-family:var(--display);font-weight:900;font-size:clamp(28px,3vw,44px);text-transform:uppercase;letter-spacing:-.005em;line-height:1.05;color:var(--gold);margin-top:6px;}
.cbl-concierge .hero-subtitle .it{font-family:var(--italic);font-style:italic;font-weight:600;color:var(--gold);text-transform:none;letter-spacing:0;font-size:.84em;}
.cbl-concierge .hero p.lede{margin-top:18px;max-width:640px;font-size:16px;line-height:1.5;color:#B8B8B8;}
.cbl-concierge .hero-cta{display:flex;gap:14px;flex-wrap:wrap;margin-top:26px;}
.cbl-concierge .btn{display:inline-flex;align-items:center;gap:8px;padding:13px 26px;border-radius:999px;font-family:var(--display);font-weight:800;font-size:13px;letter-spacing:.12em;text-transform:uppercase;transition:.2s;border:0;}
.cbl-concierge .btn.gold{background:var(--gold);color:#000;}
.cbl-concierge .btn.gold:hover{background:var(--gold-lt);}
.cbl-concierge .btn.ghost{background:transparent;border:1px solid rgba(255,255,255,.22);color:#fff;}
.cbl-concierge .btn.ghost:hover{border-color:var(--gold);color:var(--gold);}
.cbl-concierge .hero-stats{display:flex;gap:42px;flex-wrap:wrap;margin-top:34px;padding-top:26px;border-top:1px solid var(--line);}
.cbl-concierge .hero-stats .s b{display:block;font-family:var(--display);font-weight:900;font-size:34px;line-height:1;color:#fff;}
.cbl-concierge .hero-stats .s b.gold{color:var(--gold);}
.cbl-concierge .hero-stats .s span{font-family:var(--mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted2);margin-top:6px;display:block;}

/* section frame */
.cbl-concierge section.band{padding:54px 48px 60px;}
.cbl-concierge section.band.tight{padding:40px 48px 44px;}
.cbl-concierge .section-eyebrow{font-family:var(--mono);font-size:12px;color:var(--gold);letter-spacing:.18em;text-transform:uppercase;display:inline-flex;align-items:center;gap:10px;margin-bottom:12px;}
.cbl-concierge .section-eyebrow::before{content:'';width:28px;height:1px;background:var(--gold);}
.cbl-concierge .section-h2{font-family:var(--display);font-weight:900;font-size:clamp(40px,4.6vw,64px);line-height:.95;letter-spacing:-.01em;text-transform:uppercase;margin:0 0 14px;}
.cbl-concierge .section-h2 .it{font-family:var(--italic);font-style:italic;color:var(--gold);font-weight:600;text-transform:none;font-size:.6em;margin-left:8px;}
.cbl-concierge .section-lede{color:var(--muted);font-size:16px;line-height:1.6;max-width:64ch;margin:0 0 36px;}
.cbl-concierge .alt{background:radial-gradient(ellipse at top right,rgba(201,151,66,.10),transparent 60%),#0A0A0A;border-top:1px solid rgba(255,255,255,.06);border-bottom:1px solid rgba(255,255,255,.06);}

/* value cards */
.cbl-concierge .val-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.cbl-concierge .val-card{background:var(--card);border:1px solid var(--line);border-radius:22px 0 22px 0;padding:28px 26px;transition:.3s;}
.cbl-concierge .val-card:hover{transform:translateY(-4px);border-color:rgba(201,151,66,.5);}
.cbl-concierge .val-card .ic{width:44px;height:44px;border-radius:50%;border:1.5px solid var(--gold);display:flex;align-items:center;justify-content:center;margin-bottom:16px;}
.cbl-concierge .val-card .big{font-family:var(--display);font-weight:900;font-size:40px;line-height:1;letter-spacing:-.01em;color:var(--gold);}
.cbl-concierge .val-card h3{font-family:var(--display);font-weight:900;font-size:22px;text-transform:uppercase;letter-spacing:-.005em;margin:10px 0 8px;}
.cbl-concierge .val-card p{color:var(--muted);font-size:14px;line-height:1.55;margin:0;}

/* numbered steps */
.cbl-concierge .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;}
.cbl-concierge .step .num{width:46px;height:46px;border-radius:50%;border:1.5px solid var(--gold);color:var(--gold);font-family:var(--display);font-weight:900;font-size:18px;display:flex;align-items:center;justify-content:center;margin-bottom:14px;}
.cbl-concierge .step h4{font-family:var(--display);font-weight:900;font-size:20px;text-transform:uppercase;letter-spacing:-.005em;margin:0 0 8px;}
.cbl-concierge .step p{color:var(--muted);font-size:14px;line-height:1.55;margin:0;}

/* dashboard preview — real app screenshot phone mockup (transparent PNG,
   886x1866 ~2x retina). Sits flush on the black band; drop-shadow lifts it. */
.cbl-concierge .dash-grid{display:grid;grid-template-columns:420px 1fr;gap:48px;align-items:center;}
.cbl-concierge .dash-phone{
  width:min(100%,420px);height:auto;display:block;justify-self:center;
  filter:drop-shadow(0 30px 60px rgba(0,0,0,.6));
}
.cbl-concierge .feat-list{display:flex;flex-direction:column;gap:18px;}
.cbl-concierge .feat{display:flex;gap:16px;}
.cbl-concierge .feat .fic{flex-shrink:0;width:42px;height:42px;border-radius:12px;background:#0A0A0A;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;}
.cbl-concierge .feat h4{font-family:var(--display);font-weight:900;font-size:18px;text-transform:uppercase;letter-spacing:-.005em;margin:0 0 5px;}
.cbl-concierge .feat p{color:var(--muted);font-size:14px;line-height:1.5;margin:0;}

/* plaque — real desk-plaque artwork (transparent PNG, 840x1379 ~2x retina) */
.cbl-concierge .plaque-grid{display:grid;grid-template-columns:1fr 360px;gap:56px;align-items:start;}
.cbl-concierge .plaque-img{
  width:min(100%,360px);height:auto;display:block;justify-self:center;
  filter:drop-shadow(0 30px 60px rgba(0,0,0,.6));
}

/* earnings */
.cbl-concierge .earn-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.cbl-concierge .earn-card{background:var(--card);border:1px solid var(--line);border-radius:18px 0 18px 0;padding:26px 24px;}
.cbl-concierge .earn-card .e-num{font-family:var(--display);font-weight:900;font-size:46px;line-height:1;color:var(--gold);}
.cbl-concierge .earn-card .e-h{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#fff;margin:10px 0 4px;}
.cbl-concierge .earn-card .e-sub{font-family:var(--mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted2);margin-bottom:10px;}
.cbl-concierge .earn-card p{color:var(--muted);font-size:13.5px;line-height:1.5;margin:0;}

/* buckee */
.cbl-concierge .buckee{display:grid;grid-template-columns:190px 1fr;gap:30px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:22px 0 22px 0;padding:34px 38px;}
.cbl-concierge .buckee .buckee-art img{width:100%;height:auto;display:block;filter:drop-shadow(0 16px 26px rgba(0,0,0,.55));}
.cbl-concierge .buckee h3{font-family:var(--display);font-weight:900;font-size:clamp(28px,3vw,40px);text-transform:uppercase;letter-spacing:-.01em;margin:0 0 6px;}
.cbl-concierge .buckee h3 .it{font-family:var(--italic);font-style:italic;color:var(--gold);font-weight:600;text-transform:none;font-size:.6em;margin-left:6px;}
.cbl-concierge .buckee p{color:var(--muted);font-size:15px;line-height:1.6;max-width:74ch;margin:0;}
.cbl-concierge .buckee .fam{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);margin-top:14px;}

/* pricing */
.cbl-concierge .price-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.cbl-concierge .price-card{background:var(--card);border:1px solid var(--line);border-radius:22px 0 22px 0;padding:32px 30px;display:flex;flex-direction:column;}
.cbl-concierge .price-card.feature{background:linear-gradient(135deg,rgba(201,151,66,.16),rgba(201,151,66,.04));border-color:var(--gold);}
.cbl-concierge .price-card .pc-eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:10px;}
.cbl-concierge .price-card h3{font-family:var(--display);font-weight:900;font-size:26px;text-transform:uppercase;letter-spacing:-.005em;margin:0 0 4px;}
.cbl-concierge .price-card .who{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted2);margin-bottom:18px;}
.cbl-concierge .price-card .tag{font-family:var(--display);font-weight:900;font-size:54px;line-height:1;color:#fff;}
.cbl-concierge .price-card.feature .tag{color:var(--gold);}
.cbl-concierge .price-card .tag small{font-family:var(--mono);font-size:12px;font-weight:400;letter-spacing:.08em;color:var(--muted2);text-transform:uppercase;margin-left:6px;}
.cbl-concierge .price-card .sub{font-size:13px;color:var(--gold);font-family:var(--mono);letter-spacing:.06em;margin-top:8px;text-transform:uppercase;}
.cbl-concierge .price-card ul{list-style:none;margin:18px 0 22px;padding:0;display:flex;flex-direction:column;gap:9px;}
.cbl-concierge .price-card li{font-size:14px;color:#C8C8C8;line-height:1.45;padding-left:22px;position:relative;}
.cbl-concierge .price-card li::before{content:'';position:absolute;left:0;top:8px;width:12px;height:1.5px;background:var(--gold);}
.cbl-concierge .price-card .btn{align-self:flex-start;margin-top:auto;}
.cbl-concierge .price-note{font-family:var(--mono);font-size:12px;letter-spacing:.04em;color:var(--muted2);margin-top:20px;text-align:center;}
.cbl-concierge .price-note b{color:var(--gold);}

/* final CTA */
.cbl-concierge .cta-final{text-align:center;padding:64px 48px 72px;background:linear-gradient(rgba(10,10,10,.80),rgba(10,10,10,.92)),url('/eats/imagery/concierge-lobby.jpg') center 28% / cover no-repeat;}
.cbl-concierge .cta-final h2{font-family:var(--display);font-weight:900;font-size:clamp(34px,4.4vw,58px);text-transform:uppercase;letter-spacing:-.01em;margin:0 0 12px;}
.cbl-concierge .cta-final h2 .it{font-family:var(--italic);font-style:italic;color:var(--gold);font-weight:600;text-transform:none;}
.cbl-concierge .cta-final p{color:var(--muted);font-size:15px;line-height:1.6;max-width:60ch;margin:0 auto 26px;}
.cbl-concierge .cta-final .note{font-family:var(--mono);font-size:11px;letter-spacing:.06em;color:var(--muted2);margin-top:18px;}

/* apply form */
.cbl-concierge .apply-card{
  max-width:560px;margin:0 auto;text-align:left;
  background:var(--card);border:1px solid rgba(201,151,66,.45);border-radius:18px 0 18px 0;
  box-shadow:0 18px 44px rgba(0,0,0,.55);padding:28px;
}
.cbl-concierge .apply-card label{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8f8f8f;margin:0 0 7px 2px;}
.cbl-concierge .apply-card label .req{color:var(--gold);}
.cbl-concierge .apply-card label .opt{text-transform:none;letter-spacing:0;color:#6f6f6f;}
.cbl-concierge .apply-card .field{margin-bottom:14px;}
.cbl-concierge .apply-card input,.cbl-concierge .apply-card textarea{
  width:100%;box-sizing:border-box;background:#0A0A0A;color:#fff;font-size:15px;font-family:inherit;
  border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px 14px;
  transition:border-color .2s,box-shadow .2s,background .2s;
}
.cbl-concierge .apply-card input::placeholder,.cbl-concierge .apply-card textarea::placeholder{color:#6a6a6a;}
.cbl-concierge .apply-card input:focus,.cbl-concierge .apply-card textarea:focus{outline:none;border-color:var(--gold);background:rgba(201,151,66,.05);box-shadow:0 0 0 4px rgba(201,151,66,.16);}
.cbl-concierge .apply-card textarea{resize:vertical;min-height:88px;}
.cbl-concierge .apply-card .grid-2{display:grid;grid-template-columns:1fr 1fr;gap:0 16px;}
.cbl-concierge .apply-card .plan-row{display:flex;gap:8px;}
.cbl-concierge .apply-card .plan-pill{
  flex:1;cursor:pointer;background:transparent;border:1.5px solid rgba(255,255,255,.18);
  border-radius:999px;padding:11px 10px;color:#B0B0B0;font-family:var(--display);
  font-weight:800;font-size:12px;letter-spacing:.06em;text-transform:uppercase;
  transition:border-color .2s,color .2s,background .2s;
}
.cbl-concierge .apply-card .plan-pill:hover{border-color:rgba(201,151,66,.5);color:#fff;}
.cbl-concierge .apply-card .plan-pill.active{background:var(--gold);border-color:var(--gold);color:#000;}
@media(max-width:560px){.cbl-concierge .apply-card .plan-row{flex-direction:column;}}
.cbl-concierge .apply-card .submit{
  width:100%;border:0;cursor:pointer;border-radius:999px;padding:14px 36px;
  background:var(--gold);color:#000;font-family:var(--display);font-weight:900;
  font-size:14px;letter-spacing:.14em;text-transform:uppercase;transition:background .2s;
}
.cbl-concierge .apply-card .submit:hover{background:var(--gold-lt);}
.cbl-concierge .apply-card .submit:disabled{background:#555;cursor:not-allowed;}
.cbl-concierge .apply-card .alert{border-radius:12px;padding:11px 14px;font-size:13.5px;line-height:1.45;margin-bottom:14px;}
.cbl-concierge .apply-card .alert.err{background:rgba(220,60,60,.12);border:1px solid rgba(220,60,60,.4);color:#f0b3b3;}
.cbl-concierge .apply-success{text-align:center;padding:10px 0 4px;}
.cbl-concierge .apply-success .mark{width:52px;height:52px;margin:0 auto 14px;border-radius:50%;border:2px solid var(--gold);display:grid;place-items:center;color:var(--gold);font-size:24px;}
.cbl-concierge .apply-success h3{font-family:var(--display);font-weight:900;font-size:26px;text-transform:uppercase;color:#fff;margin:0 0 8px;}
.cbl-concierge .apply-success h3 .g{color:var(--gold);}
.cbl-concierge .apply-success p{color:var(--muted);font-size:14.5px;line-height:1.55;margin:0;}
@media(max-width:560px){
  .cbl-concierge .apply-card{padding:22px 18px;}
  .cbl-concierge .apply-card .grid-2{grid-template-columns:1fr;}
}

/* responsive */
@media(max-width:720px){
  .cbl-concierge .eyebrow{white-space:nowrap;font-size:11px;letter-spacing:.06em;}
  .cbl-concierge .eb-sm{display:none;}
}
@media(max-width:1000px){
  .cbl-concierge section.band{padding:44px 24px 48px;}
  .cbl-concierge .hero{padding:22px 24px 16px;}
  .cbl-concierge .hero .wrap{grid-template-columns:1fr;}
  .cbl-concierge .hero-media{display:none;}
  .cbl-concierge .val-grid{grid-template-columns:1fr;}
  .cbl-concierge .steps{grid-template-columns:1fr 1fr;}
  .cbl-concierge .dash-grid{grid-template-columns:1fr;gap:32px;}
  .cbl-concierge .dash-phone{width:min(74vw,360px);}
  .cbl-concierge .plaque-grid{grid-template-columns:1fr;gap:32px;}
  .cbl-concierge .earn-grid{grid-template-columns:1fr;}
  .cbl-concierge .price-grid{grid-template-columns:1fr;}
  .cbl-concierge .buckee{grid-template-columns:1fr;}
  .cbl-concierge .buckee .buckee-art{max-width:170px;margin-bottom:6px;}
}
@media(max-width:560px){
  .cbl-concierge .steps{grid-template-columns:1fr;}
  .cbl-concierge .hero-stats{gap:26px;}
}
`;

const PLANS = {
  team: 'Team member — Always Free',
  property: 'Property — Hotel Plan (Founding Rate)',
} as const;
type PlanKey = keyof typeof PLANS;

export function Concierge() {
  const [fullName, setFullName] = useState('');
  const [property, setProperty] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — hidden from real users
  const [plan, setPlan] = useState<PlanKey>('team');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: 'Hotel & Concierge Partner Application',
          fullName,
          email,
          phone,
          message: `Applying as: ${PLANS[plan]}\nProperty / company: ${property}\n\n${notes || '(no additional notes)'}`,
          website,
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
    <main className="cbl-concierge">
      <style>{CSS}</style>

      {/* HERO */}
      <section className="hero">
        <div className="wrap">
          <div className="hero-copy">
            <div className="eyebrow">hotels &amp; hospitality<span className="eb-sm"> · partner program</span></div>
            <h1 className="hero-title">Hotel &amp;</h1>
            <div className="hero-subtitle">
              <span>Concierge Program.</span>
              <span className="it">earn on every ride.</span>
            </div>
            <p className="lede">
              A free partnership for hotels, residences, and hospitality teams. Connect your guests
              with trusted local drivers, plan their complete itineraries, and earn commission on
              everything you book — powered by CityBucketList.com, the operating system for
              hospitality transportation.
            </p>
            <div className="hero-cta">
              <a className="btn gold" href="#apply">Become a Partner →</a>
              <a className="btn ghost" href="#dashboard">See the Dashboard</a>
            </div>
            <div className="hero-stats">
              <div className="s"><b className="gold">10%</b><span>per guest ride</span></div>
              <div className="s"><b className="gold">$5</b><span>per driver referred</span></div>
              <div className="s"><b>$0</b><span>free to join</span></div>
              <div className="s"><b>10</b><span>preferred drivers</span></div>
            </div>
          </div>
          <div className="hero-media">
            <img src="/eats/imagery/hospitality-frontdesk.jpg" alt="A hotel concierge welcoming a guest with luggage at the front desk" />
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="band">
        <div className="wrap">
          <div className="section-eyebrow">why partner</div>
          <h2 className="section-h2">Three ways <span className="it">you earn</span></h2>
          <p className="section-lede">
            Your front desk already sends guests out the door every day. The Hotel &amp; Concierge Program turns
            every ride, referral, and itinerary into ongoing revenue — free to join, with nothing to install.
          </p>
          <div className="val-grid">
            <div className="val-card">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C99742" strokeWidth="2" strokeLinecap="round"><path d="M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11" /><path d="M5 11h14v5H5z" /><circle cx="7.5" cy="16.5" r="1.5" /><circle cx="16.5" cy="16.5" r="1.5" /></svg>
              </div>
              <div className="big">10%</div>
              <h3>On every ride</h3>
              <p>Earn 10% commission on every ride you schedule for a guest — credited the moment your
                 driver completes the drop-off. Payouts go straight to your bank via Stripe Connect.</p>
            </div>
            <div className="val-card">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C99742" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M17 11h4M19 9v4" /></svg>
              </div>
              <div className="big">$5</div>
              <h3>Per driver referred</h3>
              <p>Build your own driver network and earn $5 for every successful signup. Add ride-share
                 drivers you trust, fellow staff, or friends &amp; family — up to 10 preferred drivers.</p>
            </div>
            <div className="val-card">
              <div className="ic">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C99742" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5h16v15H4z" /><path d="M4 9h16M8 3v4M16 3v4" /></svg>
              </div>
              <div className="big" style={{ fontSize: '30px', paddingTop: '8px' }}>ITINERARY</div>
              <h3>Plan the whole trip</h3>
              <p>Organize complete travel plans for guests — round-trip transportation, driver
                 scheduling, restaurant reservations, and activities — all from one dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="band alt">
        <div className="wrap">
          <div className="section-eyebrow">how it works</div>
          <h2 className="section-h2">From sign-up <span className="it">to earning</span></h2>
          <p className="section-lede">
            Getting started is simple and free. Once you're approved, we send a welcome kit with your
            front-desk plaque and QR code — everything you need to start connecting guests right away.
          </p>
          <div className="steps">
            <div className="step">
              <div className="num">01</div>
              <h4>Apply &amp; Authorize</h4>
              <p>Fill out the online form and sign the Building Management Authorization Letter. Once
                 approved, your welcome kit and desk placard ship out.</p>
            </div>
            <div className="step">
              <div className="num">02</div>
              <h4>Refer Guests</h4>
              <p>Guests scan your unique QR code to join the private membership and your concierge
                 services — instantly.</p>
            </div>
            <div className="step">
              <div className="num">03</div>
              <h4>Schedule Rides</h4>
              <p>Book trusted Independent Drivers for pre-scheduled guest transportation, right from
                 your dashboard.</p>
            </div>
            <div className="step">
              <div className="num">04</div>
              <h4>Earn Commissions</h4>
              <p>Earn on every ride booked and every driver referred. Track it all and get paid via
                 secure Stripe payouts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD PREVIEW */}
      <section className="band" id="dashboard">
        <div className="wrap">
          <div className="section-eyebrow">the concierge dashboard</div>
          <h2 className="section-h2">Your front desk, <span className="it">supercharged</span></h2>
          <p className="section-lede">
            One simple dashboard puts your drivers, schedule, guests, and earnings in one place — plus
            local Eats &amp; Drinks, Attractions, and Airport Info to share with every guest.
          </p>
          <div className="dash-grid">
            <img
              className="dash-phone"
              src={conciergeDashImg}
              alt="CityBucketList Concierge Dashboard on a phone — book rides for guests, manage drivers and guests, and track earnings in the Concierge Bank"
            />
            <div className="feat-list">
              <div className="feat">
                <div className="fic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C99742" strokeWidth="2" strokeLinecap="round"><path d="M5 11l1.5-4.5A2 2 0 018.4 5h7.2a2 2 0 011.9 1.5L19 11" /><path d="M5 11h14v5H5z" /></svg></div>
                <div><h4>Book a Ride for Guest</h4><p>Select a guest, set drop-off and pickup time, choose a preferred driver, and add special requests (Black Car, XL, pet). 10% commission credited on drop-off.</p></div>
              </div>
              <div className="feat">
                <div className="fic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C99742" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M2 19c0-3 2.7-5 6-5s6 2 6 5" /><path d="M15 19c0-2 1.3-3.6 4-3.6" /></svg></div>
                <div><h4>Drivers &amp; Guests</h4><p>Manage up to 10 preferred drivers (standard + luxury) with Approved / Pending / Rejected status. Guests are added automatically when you book for them.</p></div>
              </div>
              <div className="feat">
                <div className="fic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C99742" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg></div>
                <div><h4>Concierge Bank</h4><p>Connect your bank securely through Stripe Connect. See total earned, pending payouts, and your 10% commission rate — all in real time.</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WELCOME KIT / PLAQUE */}
      <section className="band alt">
        <div className="wrap">
          <div className="plaque-grid">
            <div>
              <div className="section-eyebrow">welcome kit</div>
              <h2 className="section-h2">A plaque for <span className="it">your front desk</span></h2>
              <p className="section-lede">
                Every approved partner gets a branded front-desk placard with your property's logo and a
                scan-to-join QR code — so guests can connect in seconds, right where they check in.
              </p>
              <div className="feat-list">
              <div className="feat"><div className="fic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C99742" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18v12H3z" /><path d="M3 11h18" /></svg></div><div><h4>Your Logo, Front &amp; Center</h4><p>Co-branded with your hotel, residence, or venue name — it looks like your concierge service, powered by CBL.</p></div></div>
              <div className="feat"><div className="fic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C99742" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="7" height="7" /><rect x="13" y="4" width="7" height="7" /><rect x="4" y="13" width="7" height="7" /><path d="M13 13h3v3M20 16v4M16 20h4" /></svg></div><div><h4>One-Scan Guest Join</h4><p>Guests scan with any phone camera to access transportation, dining, attractions, and member savings.</p></div></div>
              <div className="feat"><div className="fic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C99742" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" /></svg></div><div><h4>Everything to Get Started</h4><p>The welcome packet includes your placard, QR codes, and referral links — no setup cost, no equipment.</p></div></div>
              </div>
            </div>
            <img
              className="plaque-img"
              src={plaqueImg}
              alt="CBL front-desk plaque example — The Schmieddy Hotel Concierge Service, powered by CityBucketList.com, with a scan-to-join QR code"
            />
          </div>
        </div>
      </section>

      {/* EARNINGS */}
      <section className="band">
        <div className="wrap">
          <div className="section-eyebrow">what you earn</div>
          <h2 className="section-h2">Commission, <span className="it">simply paid</span></h2>
          <p className="section-lede">
            Your commission is funded by a small concierge fee added at booking and paid out securely
            through Stripe Connect — so your driver always keeps 100% of their fare. Track every dollar
            from your Concierge Bank.
          </p>
          <div className="earn-grid">
            <div className="earn-card">
              <div className="e-num">10%</div>
              <div className="e-h">Per Guest Ride</div>
              <div className="e-sub">credited on driver drop-off</div>
              <p>Every ride you schedule for a guest earns you 10% — automatically, on every completed trip.</p>
            </div>
            <div className="earn-card">
              <div className="e-num">$5</div>
              <div className="e-h">Per Driver Signup</div>
              <div className="e-sub">ongoing monetization</div>
              <p>Refer drivers with your QR code or link and earn $5 for each one that successfully joins.</p>
            </div>
            <div className="earn-card">
              <div className="e-num">Free</div>
              <div className="e-h">To Join</div>
              <div className="e-sub">no fees · no equipment</div>
              <p>The program, the dashboard, the welcome kit, and Stripe payouts are all free for partners.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BUCKEE */}
      <section className="band alt">
        <div className="wrap">
          <div className="buckee">
            <div className="buckee-art">
              <img src="/eats/imagery/buckee-concierge.png" alt="Buckee, the CityBucketList concierge mascot" />
            </div>
            <div className="buckee-copy">
              <div className="section-eyebrow" style={{ marginBottom: '6px' }}>meet your sidekick</div>
              <h3>Buckee, your concierge sidekick <span className="it">always on call</span></h3>
              <p>
                Buckee is your built-in concierge assistant. Ask him anything about travel or the local
                area, and he'll help you build a complete itinerary for your guests — round-trip
                transportation, driver scheduling, dining, and activities. His wife Citee and pet dog
                Listee drop in now and then to lend a hand, too.
              </p>
              <div className="fam">Buckee · Citee · Listee — the CBL family</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="band" id="pricing">
        <div className="wrap">
          <div className="section-eyebrow">what it costs</div>
          <h2 className="section-h2">Free for your team, <span className="it">simple for your property</span></h2>
          <p className="section-lede">
            Your staff never pay a cent — they earn. The property carries one flat annual subscription
            for the full concierge platform. No per-seat fees, no equipment, no surprises.
          </p>
          <div className="price-grid">
            <div className="price-card">
              <div className="pc-eyebrow">For your team</div>
              <h3>Always Free</h3>
              <div className="who">Bellmen · Front Desk · Concierge</div>
              <div className="tag">$0</div>
              <div className="sub">they earn, never pay</div>
              <ul>
                <li>Keep 8% commission on every guest ride you book</li>
                <li>Earn $5 for every driver you refer</li>
                <li>Full Concierge Dashboard + itinerary tools</li>
                <li>Secure Stripe payouts — no equipment, no fees</li>
              </ul>
              <a className="btn ghost" href="#apply" onClick={() => setPlan('team')}>Join Free</a>
            </div>
            <div className="price-card feature">
              <div className="pc-eyebrow">For your property</div>
              <h3>Hotel Plan</h3>
              <div className="who">Per property · billed annually</div>
              <div className="tag">$99<small>/mo · $1,188/yr</small></div>
              <div className="sub">founding rate available — first year half off</div>
              <ul>
                <li>Branded front-desk plaque + QR welcome kit</li>
                <li>Property earns 2% on every concierge ride</li>
                <li>Manage unlimited staff, drivers &amp; guests</li>
                <li>Earnings &amp; booking reporting dashboard</li>
                <li>Local Eats, Attractions &amp; Airport info for guests</li>
              </ul>
              <a className="btn gold" href="#apply" onClick={() => setPlan('property')}>Start with a Founding Rate →</a>
            </div>
          </div>
          <div className="price-note">
            Hotel groups &amp; chains — flat per-property pricing with <b>volume discounts</b>. Let's talk: info@citybucketlist.com
          </div>
        </div>
      </section>

      {/* FINAL CTA — partner application */}
      <section className="cta-final" id="apply">
        <h2>Ready to become <span className="it">a partner?</span></h2>
        <p>
          Join free in minutes. Tell us about your property and we'll reach out within 24 hours
          with your authorization letter and welcome kit — so you can start earning on every
          guest booking.
        </p>

        <div className="apply-card">
          {status === 'success' ? (
            <div className="apply-success">
              <div className="mark" aria-hidden="true">✓</div>
              <h3>Application <span className="g">received.</span></h3>
              <p>
                Thanks — we'll be in touch within 24 hours with your welcome kit details. One more
                step: create your CBL account now so we can activate your dashboard, referral
                code, and payouts the moment you're approved.
              </p>
              <a className="btn gold" href={`${APP_URL}/partner/signup`} target="_blank" rel="noopener noreferrer" style={{ marginTop: '18px', display: 'inline-flex' }}>
                Create your account in the app →
              </a>
            </div>
          ) : (
            <form onSubmit={handleApply}>
              {/* Honeypot — hidden from real users, bots fill it in */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              {status === 'error' && <div className="alert err" role="alert">{errorMessage}</div>}

              <div className="field">
                <label>I'm applying as <span className="req">*</span></label>
                <div className="plan-row" role="radiogroup" aria-label="Applying as">
                  {(Object.keys(PLANS) as PlanKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={plan === k}
                      className={'plan-pill' + (plan === k ? ' active' : '')}
                      onClick={() => setPlan(k)}
                    >
                      {k === 'team' ? 'Team member · Free' : 'Property · Hotel Plan'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid-2">
                <div className="field">
                  <label htmlFor="ap-name">Your name <span className="req">*</span></label>
                  <input id="ap-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" autoComplete="name" maxLength={100} required />
                </div>
                <div className="field">
                  <label htmlFor="ap-property">Property / company <span className="req">*</span></label>
                  <input id="ap-property" type="text" value={property} onChange={(e) => setProperty(e.target.value)} placeholder="Hotel or company name" autoComplete="organization" maxLength={150} required />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="ap-email">Work email <span className="req">*</span></label>
                  <input id="ap-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@property.com" autoComplete="email" maxLength={200} required />
                </div>
                <div className="field">
                  <label htmlFor="ap-phone">Phone <span className="opt">(optional)</span></label>
                  <input id="ap-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" autoComplete="tel" maxLength={30} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="ap-notes">About your property <span className="opt">(optional)</span></label>
                <textarea id="ap-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Rooms, location, concierge team size — anything that helps us set you up faster." maxLength={1000} />
              </div>

              <button type="submit" className="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending…' : 'Become a Partner →'}
              </button>
            </form>
          )}
        </div>

        <div className="note">Questions? info@citybucketlist.com · CityBucketList.com is an LLC company</div>
      </section>
    </main>
  );
}
