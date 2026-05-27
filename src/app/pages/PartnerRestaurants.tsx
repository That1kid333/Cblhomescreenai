/**
 * PartnerRestaurants — dedicated "Partner Restaurants" page, split out of the
 * combined Affiliates page. Carries the restaurant value props, the Bronze /
 * Silver / Gold pricing tiers, how-it-works, and commission info folded in.
 *
 * Matches the Affiliates.tsx editorial system (scoped under .cbl-partner-rest).
 * Shared Layout provides nav + footer. Hero reuses /eats/imagery/cbl-map-backdrop.jpg.
 */

const GOLD = '#C99742';
const DISPLAY = "'Myriad Pro', sans-serif";
const BODY = "'Myriad Pro', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";
const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

const BENEFITS = [
  { rev: 'Spotlight', name: 'Featured Placement', sub: 'Eats & Drinks page', note: 'Appear above standard listings with a sponsored badge and a full profile.' },
  { rev: 'Coupons', name: 'Promos & Deals', sub: 'Member offers', note: 'Run coupon opportunities that reach CBL members and local drivers.' },
  { rev: 'Social', name: 'Posts & Fundraising', sub: 'Built into every tier', note: 'Social media posts plus fundraising solutions to drive new traffic.' },
];

const STEPS = [
  { t: 'Apply', d: 'Tell us about your restaurant and pick the tier that fits your business.' },
  { t: 'Onboard', d: 'Quick verification and setup. We build your profile, listing, and stickers.' },
  { t: 'Go live', d: 'Your listing, badge, and placement go live across the CBL directory.' },
  { t: 'Grow', d: 'Reach members and drivers exploring your city, and track results from your dashboard.' },
];

const CSS = `
.cbl-partner-rest { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-partner-rest *,.cbl-partner-rest *::before,.cbl-partner-rest *::after { box-sizing:border-box; }
.cbl-partner-rest button { font-family:inherit; cursor:pointer; }
.cbl-partner-rest a { text-decoration:none; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

.cbl-partner-rest .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 16px;
}
.cbl-partner-rest .hero-inner { max-width:1280px; margin:0 auto; }
.cbl-partner-rest .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#8a8a8a; text-transform:lowercase; margin-bottom:10px;
}
.cbl-partner-rest .eyebrow::before { content:''; width:8px; height:8px; border-radius:50%; background:${GOLD}; animation:cbl-pulse 2.4s ease-in-out infinite; }
.cbl-partner-rest h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-partner-rest h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-partner-rest h1.hero-title .h1-main { color:#fff; white-space:nowrap; }
.cbl-partner-rest .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:${GOLD};
}
.cbl-partner-rest .hero-subtitle .it { font-family:${ITALIC}; font-style:italic; font-weight:600; color:${GOLD}; text-transform:none; letter-spacing:0; font-size:.82em; }
.cbl-partner-rest .hero p.lede { margin-top:14px; max-width:620px; font-size:16px; line-height:1.45; color:#B8B8B8; }

.cbl-partner-rest section.band { padding:48px 48px 56px; }
.cbl-partner-rest section.band.tight { padding:28px 48px 36px; }
.cbl-partner-rest .band-inner { max-width:1280px; margin:0 auto; }
.cbl-partner-rest .section-eyebrow {
  font-family:${MONO}; font-size:12px; color:${GOLD};
  letter-spacing:.18em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
}
.cbl-partner-rest .section-eyebrow::before { content:''; width:28px; height:1px; background:${GOLD}; }
.cbl-partner-rest .section-h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(40px,4.6vw,64px); line-height:.95;
  letter-spacing:-.01em; text-transform:uppercase; margin-bottom:8px;
}
.cbl-partner-rest .section-h2 .it { font-family:${ITALIC}; font-style:italic; color:${GOLD}; font-weight:600; text-transform:none; font-size:.6em; margin-left:8px; }
.cbl-partner-rest .section-lede { color:#B0B0B0; font-size:15px; line-height:1.55; max-width:64ch; margin-bottom:28px; }

/* benefits / tier cards */
.cbl-partner-rest .tier-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
.cbl-partner-rest .tier { background:#141414; border:1px solid rgba(255,255,255,.08); border-radius:14px 0 14px 0; padding:24px 26px; display:flex; flex-direction:column; gap:8px; }
.cbl-partner-rest .tier .rev { font-family:${DISPLAY}; font-weight:900; font-size:32px; line-height:1; color:${GOLD}; letter-spacing:-.01em; }
.cbl-partner-rest .tier .name { font-family:${DISPLAY}; font-weight:900; font-size:19px; text-transform:uppercase; letter-spacing:-.005em; }
.cbl-partner-rest .tier .sub { font-family:${MONO}; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:${GOLD}; }
.cbl-partner-rest .tier .note { color:#A8A8A8; font-size:13px; line-height:1.5; margin-top:2px; }

/* how it works */
.cbl-partner-rest .steps { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
.cbl-partner-rest .step { display:flex; flex-direction:column; gap:10px; }
.cbl-partner-rest .step .num { width:42px; height:42px; border-radius:50%; border:1.5px solid ${GOLD}; color:${GOLD}; font-family:${DISPLAY}; font-weight:900; font-size:18px; display:flex; align-items:center; justify-content:center; }
.cbl-partner-rest .step h4 { font-family:${DISPLAY}; font-weight:900; font-size:20px; text-transform:uppercase; letter-spacing:-.005em; }
.cbl-partner-rest .step p { color:#A8A8A8; font-size:13px; line-height:1.5; }

/* pricing tiers */
.cbl-partner-rest .pricing-band { background:#0A0A0A; border-top:1px solid rgba(201,151,66,.14); }
.cbl-partner-rest .pricing-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
.cbl-partner-rest .pricing-card { background:#111; border:1px solid rgba(255,255,255,.08); border-radius:18px 0 18px 0; padding:32px 30px 28px; display:flex; flex-direction:column; gap:0; transition:transform .35s, border-color .35s; animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both; position:relative; overflow:hidden; }
.cbl-partner-rest .pricing-card:hover { transform:translateY(-5px); border-color:rgba(201,151,66,.4); }
.cbl-partner-rest .pricing-card.gold-card { background:linear-gradient(145deg,#181408,#120f04); border-color:rgba(201,151,66,.55); box-shadow:0 0 40px rgba(201,151,66,.08); }
.cbl-partner-rest .pricing-card.gold-card::before { content:'MOST POPULAR'; position:absolute; top:0; right:0; background:${GOLD}; color:#000; font-family:${MONO}; font-size:9px; font-weight:700; letter-spacing:.16em; text-transform:uppercase; padding:5px 14px; border-radius:0 0 0 10px; }
.cbl-partner-rest .pricing-tier-label { font-family:${MONO}; font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:${GOLD}; margin-bottom:10px; font-weight:700; }
.cbl-partner-rest .pricing-price { font-family:${DISPLAY}; font-weight:900; font-size:clamp(42px,5vw,64px); line-height:1; color:#fff; letter-spacing:-.02em; margin-bottom:20px; }
.cbl-partner-rest .pricing-price span { font-size:.38em; font-weight:700; color:#888; vertical-align:middle; margin-left:4px; letter-spacing:.06em; }
.cbl-partner-rest .pricing-divider { width:100%; height:1px; background:linear-gradient(90deg, ${GOLD}, transparent); margin-bottom:20px; opacity:.35; }
.cbl-partner-rest .pricing-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:12px; flex:1; }
.cbl-partner-rest .pricing-list li { position:relative; padding-left:24px; color:#C8C8C8; font-size:14px; line-height:1.5; }
.cbl-partner-rest .pricing-list li::before { content:''; position:absolute; left:0; top:8px; width:10px; height:10px; border-radius:50%; background:${GOLD}; opacity:.8; }
.cbl-partner-rest .pricing-list strong { color:#fff; font-weight:800; }
.cbl-partner-rest .pricing-list .gold-flag { display:inline-block; margin-left:6px; font-family:${MONO}; font-size:9px; font-weight:700; letter-spacing:.10em; text-transform:uppercase; color:#000; background:${GOLD}; padding:2px 7px; border-radius:3px; vertical-align:middle; }
.cbl-partner-rest .pricing-cta { margin-top:28px; display:inline-flex; align-items:center; gap:8px; background:${GOLD}; color:#000; border:0; padding:14px 28px; border-radius:6px 0 6px 0; font-family:${DISPLAY}; font-weight:800; font-size:13px; letter-spacing:.10em; text-transform:uppercase; text-decoration:none; transition:background .2s, transform .2s; width:100%; justify-content:center; }
.cbl-partner-rest .pricing-cta:hover { background:#DDB15F; transform:translateY(-1px); }

/* CTA band */
.cbl-partner-rest .cta-band { background: radial-gradient(ellipse at 50% 0%, rgba(201,151,66,.16), transparent 60%), linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%); text-align:center; }
.cbl-partner-rest .cta-band h2 { font-family:${DISPLAY}; font-weight:900; font-size:clamp(34px,4vw,56px); line-height:.98; letter-spacing:-.01em; text-transform:uppercase; margin-bottom:10px; }
.cbl-partner-rest .cta-band h2 .it { font-family:${ITALIC}; font-style:italic; color:${GOLD}; font-weight:600; text-transform:none; font-size:.6em; margin-left:8px; }
.cbl-partner-rest .cta-band p { color:#B0B0B0; font-size:16px; line-height:1.6; max-width:54ch; margin:0 auto 24px; }
.cbl-partner-rest .apply { display:inline-flex; align-items:center; gap:10px; background:${GOLD}; color:#000; border:0; padding:15px 36px; border-radius:999px; font-family:${DISPLAY}; font-weight:900; font-size:14px; letter-spacing:.14em; text-transform:uppercase; transition:background .2s; }
.cbl-partner-rest .apply:hover { background:#DDB15F; }

@media (max-width:1100px){
  .cbl-partner-rest .hero { padding:22px 24px 16px; }
  .cbl-partner-rest section.band { padding:48px 24px; }
  .cbl-partner-rest .tier-grid { grid-template-columns:1fr; }
  .cbl-partner-rest .steps { grid-template-columns:repeat(2,1fr); }
  .cbl-partner-rest .pricing-grid { grid-template-columns:1fr; }
}
`;

export function PartnerRestaurants() {
  return (
    <main className="cbl-partner-rest">
      <style>{CSS}</style>

      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">eats &amp; drinks · partner program</div>
          <h1 className="hero-title">
            <span className="title-stack">
              <span className="h1-main">Restaurants</span>
              <span className="hero-subtitle">
                <span>Partner with CBL.</span>
                <span className="it">get discovered.</span>
              </span>
            </span>
          </h1>
          <p className="lede">
            Claim a sponsored spot on the Eats &amp; Drinks page — featured above standard listings
            with a partner badge and a full profile — and reach CBL members and local drivers
            exploring your city.
          </p>
        </div>
      </section>

      <section className="band">
        <div className="band-inner">
          <div className="section-eyebrow">why partner</div>
          <h2 className="section-h2">Get found <span className="it">get booked</span></h2>
          <p className="section-lede">
            Every tier puts your restaurant in front of locals and travelers actively planning where
            to eat — with the tools to turn that visibility into covers.
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

      <section className="band pricing-band">
        <div className="band-inner">
          <div className="section-eyebrow">restaurant partner pricing</div>
          <h2 className="section-h2">Choose your <span className="it">tier</span></h2>
          <p className="section-lede">
            Every tier includes placement on the CBL directory, coupon opportunities, social media
            posts, and fundraising solutions — no commission taken, just a flat annual rate. Pick the
            package that fits your business.
          </p>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-tier-label">Bronze Tier</div>
              <div className="pricing-price">$49<span>/yr</span></div>
              <div className="pricing-divider" />
              <ul className="pricing-list">
                <li>Post on CBL Directory</li>
                <li>Coupon Opportunities</li>
                <li>Social Media Posts</li>
                <li>Fundraising Solutions</li>
                <li>Door Sticker 12&quot; x 12&quot; (1)</li>
              </ul>
              <a className="pricing-cta" href="https://app.citybucketlist.com">Sign Up →</a>
            </div>

            <div className="pricing-card">
              <div className="pricing-tier-label">Silver Tier</div>
              <div className="pricing-price">$199<span>/yr</span></div>
              <div className="pricing-divider" />
              <ul className="pricing-list">
                <li>Top Search on our CBL Directory (Ex. Restaurant/Bar)</li>
                <li>Coupon Opportunities</li>
                <li>Social Media Posts</li>
                <li>Fundraising Solutions</li>
                <li>Door Sticker 12&quot; x 12&quot; (1) &amp; Table Stickers 6&quot; x 6&quot; (4)</li>
              </ul>
              <a className="pricing-cta" href="https://app.citybucketlist.com">Sign Up →</a>
            </div>

            <div className="pricing-card gold-card">
              <div className="pricing-tier-label">Gold Tier</div>
              <div className="pricing-price">$299<span>/yr</span></div>
              <div className="pricing-divider" />
              <ul className="pricing-list">
                <li><strong>CBL App Delivery Service</strong> — set up your own delivery through the CBL app <span className="gold-flag">Gold exclusive</span></li>
                <li>Placement on Rotating Top Banner</li>
                <li>Top Search on our CBL Directory (Ex. Restaurant/Bar)</li>
                <li>Coupon Opportunities</li>
                <li>Social Media Posts</li>
                <li>Fundraising Solutions</li>
                <li>Door Sticker 12&quot; x 12&quot; (1) &amp; Table Stickers (8)</li>
              </ul>
              <a className="pricing-cta" href="https://app.citybucketlist.com">Sign Up →</a>
            </div>
          </div>
        </div>
      </section>

      <section className="band tight">
        <div className="band-inner">
          <div className="section-eyebrow">how it works</div>
          <h2 className="section-h2" style={{ marginBottom: 28 }}>From apply <span className="it">to growth</span></h2>
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
          <h2>Ready to get <span className="it">listed?</span></h2>
          <p>Apply in minutes. Pick your tier and we'll get your restaurant live across the CBL platform.</p>
          <a className="apply" href="https://app.citybucketlist.com">Apply Now →</a>
        </div>
      </section>
    </main>
  );
}
