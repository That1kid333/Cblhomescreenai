/**
 * PartnerAttractions — dedicated "Partner Attractions" page, split out of the
 * combined Affiliates page. Carries the attractions value props, how earnings /
 * commission work (folded in), how-it-works, and a CTA.
 *
 * Matches the Affiliates.tsx editorial system (scoped under .cbl-partner-attr).
 * Shared Layout provides nav + footer. Hero reuses /eats/imagery/cbl-map-backdrop.jpg.
 */

const GOLD = '#C99742';
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";
const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

const BENEFITS = [
  { rev: 'Featured', name: 'Top Placement', sub: 'Attractions page', note: 'Get featured on the Attractions page in front of members planning their week.' },
  { rev: 'Tickets', name: 'Ticketed Bookings', sub: 'Sold through CBL', note: 'Sell tickets and experiences directly to members and hotel guests.' },
  { rev: 'Reach', name: 'Planners & Guests', sub: 'Members + concierge', note: 'Reach travelers and locals building their itineraries — and concierge partners booking for guests.' },
];

const EARN = [
  { rev: 'Featured', name: 'Sponsored Listing', sub: 'Attractions category', note: 'Top placement and a partner badge on your category page.' },
  { rev: 'Per booking', name: 'Ticketed Sales', sub: 'Through CBL', note: 'Earn on experiences booked through the platform — tracked in your dashboard.' },
  { rev: 'No markup', name: 'Member-Friendly', sub: 'Commission built in', note: 'Commission is built into bookings — never added to the member’s price.' },
];

const STEPS = [
  { t: 'Apply', d: 'Tell us about your attraction or experience and how you’d like to partner.' },
  { t: 'Onboard', d: 'Quick verification and setup. We build your profile, listing, and booking links.' },
  { t: 'Go live', d: 'Your featured listing and ticketed bookings go live across the CBL platform.' },
  { t: 'Earn', d: 'Track bookings and commission from your dashboard. Payouts via Stripe.' },
];

const CSS = `
.cbl-partner-attr { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-partner-attr *,.cbl-partner-attr *::before,.cbl-partner-attr *::after { box-sizing:border-box; }
.cbl-partner-attr button { font-family:inherit; cursor:pointer; }
.cbl-partner-attr a { text-decoration:none; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

.cbl-partner-attr .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 16px;
}
.cbl-partner-attr .hero-inner { max-width:1280px; margin:0 auto; }
.cbl-partner-attr .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#8a8a8a; text-transform:lowercase; margin-bottom:10px;
}
.cbl-partner-attr .eyebrow::before { content:''; width:8px; height:8px; border-radius:50%; background:${GOLD}; animation:cbl-pulse 2.4s ease-in-out infinite; }
.cbl-partner-attr h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-partner-attr h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-partner-attr h1.hero-title .h1-main { color:#fff; white-space:nowrap; }
.cbl-partner-attr .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:${GOLD};
}
.cbl-partner-attr .hero-subtitle .it { font-family:${ITALIC}; font-style:italic; font-weight:600; color:${GOLD}; text-transform:none; letter-spacing:0; font-size:.82em; }
.cbl-partner-attr .hero p.lede { margin-top:14px; max-width:620px; font-size:16px; line-height:1.45; color:#B8B8B8; }

.cbl-partner-attr section.band { padding:48px 48px 56px; }
.cbl-partner-attr section.band.tight { padding:28px 48px 36px; }
.cbl-partner-attr .band-inner { max-width:1280px; margin:0 auto; }
.cbl-partner-attr .section-eyebrow {
  font-family:${MONO}; font-size:12px; color:${GOLD};
  letter-spacing:.18em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
}
.cbl-partner-attr .section-eyebrow::before { content:''; width:28px; height:1px; background:${GOLD}; }
.cbl-partner-attr .section-h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(40px,4.6vw,64px); line-height:.95;
  letter-spacing:-.01em; text-transform:uppercase; margin-bottom:8px;
}
.cbl-partner-attr .section-h2 .it { font-family:${ITALIC}; font-style:italic; color:${GOLD}; font-weight:600; text-transform:none; font-size:.6em; margin-left:8px; }
.cbl-partner-attr .section-lede { color:#B0B0B0; font-size:15px; line-height:1.55; max-width:64ch; margin-bottom:28px; }

.cbl-partner-attr .comm-band {
  background:
    radial-gradient(ellipse at 70% 0%, rgba(201,151,66,.12), transparent 60%),
    linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%);
  border-top:1px solid rgba(201,151,66,.18);
  border-bottom:1px solid rgba(201,151,66,.18);
}
.cbl-partner-attr .tier-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
.cbl-partner-attr .tier { background:#141414; border:1px solid rgba(255,255,255,.08); border-radius:14px 0 14px 0; padding:24px 26px; display:flex; flex-direction:column; gap:8px; }
.cbl-partner-attr .tier .rev { font-family:${DISPLAY}; font-weight:900; font-size:32px; line-height:1; color:${GOLD}; letter-spacing:-.01em; }
.cbl-partner-attr .tier .name { font-family:${DISPLAY}; font-weight:900; font-size:19px; text-transform:uppercase; letter-spacing:-.005em; }
.cbl-partner-attr .tier .sub { font-family:${MONO}; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:${GOLD}; }
.cbl-partner-attr .tier .note { color:#A8A8A8; font-size:13px; line-height:1.5; margin-top:2px; }

.cbl-partner-attr .steps { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
.cbl-partner-attr .step { display:flex; flex-direction:column; gap:10px; }
.cbl-partner-attr .step .num { width:42px; height:42px; border-radius:50%; border:1.5px solid ${GOLD}; color:${GOLD}; font-family:${DISPLAY}; font-weight:900; font-size:18px; display:flex; align-items:center; justify-content:center; }
.cbl-partner-attr .step h4 { font-family:${DISPLAY}; font-weight:900; font-size:20px; text-transform:uppercase; letter-spacing:-.005em; }
.cbl-partner-attr .step p { color:#A8A8A8; font-size:13px; line-height:1.5; }

.cbl-partner-attr .cta-band { background: radial-gradient(ellipse at 50% 0%, rgba(201,151,66,.16), transparent 60%), linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%); text-align:center; }
.cbl-partner-attr .cta-band h2 { font-family:${DISPLAY}; font-weight:900; font-size:clamp(34px,4vw,56px); line-height:.98; letter-spacing:-.01em; text-transform:uppercase; margin-bottom:10px; }
.cbl-partner-attr .cta-band h2 .it { font-family:${ITALIC}; font-style:italic; color:${GOLD}; font-weight:600; text-transform:none; font-size:.6em; margin-left:8px; }
.cbl-partner-attr .cta-band p { color:#B0B0B0; font-size:16px; line-height:1.6; max-width:54ch; margin:0 auto 24px; }
.cbl-partner-attr .apply { display:inline-flex; align-items:center; gap:10px; background:${GOLD}; color:#000; border:0; padding:15px 36px; border-radius:999px; font-family:${DISPLAY}; font-weight:900; font-size:14px; letter-spacing:.14em; text-transform:uppercase; transition:background .2s; }
.cbl-partner-attr .apply:hover { background:#DDB15F; }

@media (max-width:1100px){
  .cbl-partner-attr .hero { padding:22px 24px 16px; }
  .cbl-partner-attr section.band { padding:48px 24px; }
  .cbl-partner-attr .tier-grid { grid-template-columns:1fr; }
  .cbl-partner-attr .steps { grid-template-columns:repeat(2,1fr); }
}
`;

export function PartnerAttractions() {
  return (
    <main className="cbl-partner-attr">
      <style>{CSS}</style>

      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">attractions · partner program</div>
          <h1 className="hero-title">
            <span className="title-stack">
              <span className="h1-main">Attractions</span>
              <span className="hero-subtitle">
                <span>Partner with CBL.</span>
                <span className="it">sell more tickets.</span>
              </span>
            </span>
          </h1>
          <p className="lede">
            Get featured on the Attractions page and sell tickets and experiences to members and
            hotel guests planning their week — reaching travelers and locals exactly when they’re
            deciding what to do.
          </p>
        </div>
      </section>

      <section className="band">
        <div className="band-inner">
          <div className="section-eyebrow">why partner</div>
          <h2 className="section-h2">Be the thing <span className="it">to do</span></h2>
          <p className="section-lede">
            CBL puts your attraction in front of people actively building their itineraries — then
            makes it easy for them to book.
          </p>
          <div className="tier-grid">
            {BENEFITS.map((b) => (
              <div className="tier" key={b.name}>
                <div className="rev">{b.rev}</div>
                <div className="name">{b.name}</div>
                <div className="sub">{b.sub}</div>
                <div className="note">{b.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band comm-band">
        <div className="band-inner">
          <div className="section-eyebrow">what you earn</div>
          <h2 className="section-h2">How it <span className="it">pays</span></h2>
          <p className="section-lede">
            Get featured for visibility and earn on every ticketed booking made through CBL.
            Commission is built into bookings and tracked from your dashboard with Stripe payouts.
          </p>
          <div className="tier-grid">
            {EARN.map((t) => (
              <div className="tier" key={t.name}>
                <div className="rev">{t.rev}</div>
                <div className="name">{t.name}</div>
                <div className="sub">{t.sub}</div>
                <div className="note">{t.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band tight">
        <div className="band-inner">
          <div className="section-eyebrow">how it works</div>
          <h2 className="section-h2" style={{ marginBottom: 28 }}>From apply <span className="it">to earning</span></h2>
          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={s.t}>
                <div className="num">{String(i + 1).padStart(2, '0')}</div>
                <h4>{s.t}</h4>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band cta-band">
        <div className="band-inner">
          <h2>Ready to get <span className="it">featured?</span></h2>
          <p>Apply in minutes. Tell us about your attraction and we'll get you live across the CBL platform.</p>
          <a className="apply" href="https://app.citybucketlist.com">Apply Now →</a>
        </div>
      </section>
    </main>
  );
}
