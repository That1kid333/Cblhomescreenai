/**
 * Affiliates — re-skinned to match the rest of the site (Explore + About):
 * dark canvas, gold (#C99742) accents, Myriad Pro display headers with Playfair
 * Display italic accents, mono eyebrow labels, the shared map-backdrop hero, and
 * the angled-corner card treatment. No hero icon, consistent with the About
 * section. Hero backdrop reuses `/eats/imagery/cbl-map-backdrop.jpg`.
 *
 * Partner-type cards carry anchor ids (#hotels / #restaurants / #attractions)
 * so other pages (e.g. the Eats & Drinks "Become a Partner" CTA) can deep-link.
 */

import { APP_URL } from '../lib/constants';

const GOLD = '#C99742';
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

type Partner = {
  id: string;
  tag: string;
  name: string;
  link: string;
  blurb: string;
  bullets: string[];
  feature?: boolean;
};

const PARTNERS: Partner[] = [
  {
    id: 'restaurants',
    tag: 'Eats & Drinks',
    name: 'Partner Restaurants',
    feature: true,
    link: '/partner-restaurants',
    blurb:
      'Claim a sponsored spot on the Eats & Drinks page — featured above standard listings, with a partner badge and a full profile.',
    bullets: [
      'Spotlight placement in local results',
      'Sponsored badge + full restaurant profile',
      'Reach CBL members and local drivers',
    ],
  },
  {
    id: 'hotels',
    tag: 'Hotels & Concierge',
    name: 'Hotel & Concierge',
    link: '/concierge',
    blurb:
      'Connect guests with trusted drivers and plan their itineraries — staff free and earning, the property on a simple flat plan.',
    bullets: [
      '8% to staff on every guest ride',
      'Property earns 2% + branded welcome kit',
      'Full concierge dashboard',
    ],
  },
  {
    id: 'attractions',
    tag: 'Attractions',
    name: 'Partner Attractions',
    link: '/partner-attractions',
    blurb:
      'Get featured on the Attractions page and sell tickets and experiences to members planning their week.',
    bullets: [
      'Featured placement on Attractions',
      'Ticketed bookings through CBL',
      'Reach members planning their week',
    ],
  },
];

const STEPS = [
  { t: 'Apply', d: 'Tell us about your business and how you want to partner — restaurant, hotel, attraction, or concierge.' },
  { t: 'Onboard', d: 'Quick verification and setup. We build your profile, links, and QR codes.' },
  { t: 'Go live', d: 'Your listing, badge, or referral tools go live across the CBL platform.' },
  { t: 'Earn', d: 'Track bookings and commission from your dashboard. Payouts via Stripe.' },
];

const TIERS = [
  { rev: '10%', name: 'Concierge Partners', sub: 'Hotels, venues & businesses', note: 'On every ride or booking you refer.' },
  { rev: '4–6%', name: 'Affiliate Bookings', sub: 'Rides, travel & tickets', note: 'Paid by the network — never by the member.' },
  { rev: 'Featured', name: 'Sponsored Listings', sub: 'Restaurants & attractions', note: 'Top placement + partner badge on your category page.' },
];

const AFFILIATES_CSS = `
.cbl-affiliates { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-affiliates *,.cbl-affiliates *::before,.cbl-affiliates *::after { box-sizing:border-box; }
.cbl-affiliates button { font-family:inherit; cursor:pointer; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

/* ── Hero band ── */
.cbl-affiliates .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 16px;
}
/* content sits above the light streams (see src/styles/light-streams.css) */
.cbl-affiliates .hero-inner { max-width:1280px; margin:0 auto; position:relative; z-index:2; }
/* empty first-child layer that hosts 2 of the 4 streaks, kept under the copy */
.cbl-affiliates .hero-streams { position:absolute; inset:0; z-index:1; pointer-events:none; }
.cbl-affiliates .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#fff; font-weight:700; text-transform:lowercase; margin-bottom:10px;
}
.cbl-affiliates .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:${GOLD}; animation:cbl-pulse 2.4s ease-in-out infinite;
}
.cbl-affiliates h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-affiliates h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-affiliates h1.hero-title .h1-main { color:#fff; white-space:nowrap; }
.cbl-affiliates .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:${GOLD};
}
.cbl-affiliates .hero-subtitle .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:${GOLD}; text-transform:none; letter-spacing:0; font-size:.82em;
}
.cbl-affiliates .hero p.lede { margin-top:14px; max-width:620px; font-size:16px; line-height:1.45; color:#B8B8B8; }

/* ── Section frame ── */
.cbl-affiliates section.band { padding:48px 48px 56px; }
.cbl-affiliates section.band.tight { padding:28px 48px 36px; }
.cbl-affiliates .band-inner { max-width:1280px; margin:0 auto; }
.cbl-affiliates .section-eyebrow {
  font-family:${MONO}; font-size:12px; color:${GOLD};
  letter-spacing:.18em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
}
.cbl-affiliates .section-eyebrow::before { content:''; width:28px; height:1px; background:${GOLD}; }
.cbl-affiliates .section-h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(40px,4.6vw,64px); line-height:.95;
  letter-spacing:-.01em; text-transform:uppercase; margin-bottom:8px;
}
.cbl-affiliates .section-h2 .it {
  font-family:${ITALIC}; font-style:italic;
  color:${GOLD}; font-weight:600; text-transform:none;
  font-size:.6em; margin-left:8px;
}
.cbl-affiliates .section-lede { color:#B0B0B0; font-size:15px; line-height:1.55; max-width:64ch; margin-bottom:28px; }

/* ── Partner cards ── */
.cbl-affiliates .partner-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
.cbl-affiliates .partner-card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; padding:28px 30px;
  display:flex; flex-direction:column; gap:14px;
  transition:transform .3s, border-color .3s; scroll-margin-top:24px;
  animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both;
}
.cbl-affiliates .partner-card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.45); }
.cbl-affiliates .partner-card.feature {
  background:linear-gradient(135deg, rgba(201,151,66,.16), rgba(201,151,66,.03));
  border-color:rgba(201,151,66,.5);
}
.cbl-affiliates .partner-card .tag { font-family:${MONO}; font-size:10px; letter-spacing:.16em; text-transform:uppercase; color:${GOLD}; }
.cbl-affiliates .partner-card h3 { font-family:${DISPLAY}; font-weight:900; font-size:26px; line-height:1; text-transform:uppercase; letter-spacing:-.005em; }
.cbl-affiliates .partner-card > p { color:#B0B0B0; font-size:14px; line-height:1.55; }
.cbl-affiliates .partner-card ul { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:8px; }
.cbl-affiliates .partner-card li { position:relative; padding-left:22px; color:#C8C8C8; font-size:13px; line-height:1.45; }
.cbl-affiliates .partner-card li::before { content:''; position:absolute; left:0; top:7px; width:12px; height:1.5px; background:${GOLD}; }
.cbl-affiliates .partner-card .cta {
  align-self:flex-start; margin-top:auto;
  display:inline-flex; align-items:center; gap:8px;
  background:${GOLD}; color:#000; border:0;
  padding:12px 26px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:800;
  font-size:12px; letter-spacing:.12em; text-transform:uppercase; transition:background .2s;
}
.cbl-affiliates .partner-card .cta:hover { background:#DDB15F; }
.cbl-affiliates .partner-card.feature .cta { background:${GOLD}; }

/* ── How it works ── */
.cbl-affiliates .steps { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
.cbl-affiliates .step { display:flex; flex-direction:column; gap:10px; }
.cbl-affiliates .step .num {
  width:42px; height:42px; border-radius:50%;
  border:1.5px solid ${GOLD}; color:${GOLD};
  font-family:${DISPLAY}; font-weight:900; font-size:18px;
  display:flex; align-items:center; justify-content:center;
}
.cbl-affiliates .step h4 { font-family:${DISPLAY}; font-weight:900; font-size:20px; text-transform:uppercase; letter-spacing:-.005em; }
.cbl-affiliates .step p { color:#A8A8A8; font-size:13px; line-height:1.5; }

/* ── Commission tiers ── */
.cbl-affiliates .comm-band {
  background:
    radial-gradient(ellipse at 70% 0%, rgba(201,151,66,.12), transparent 60%),
    linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%);
  border-top:1px solid rgba(201,151,66,.18);
  border-bottom:1px solid rgba(201,151,66,.18);
}
.cbl-affiliates .tier-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
.cbl-affiliates .tier {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:14px 0 14px 0; padding:24px 26px;
  display:flex; flex-direction:column; gap:8px;
}
.cbl-affiliates .tier .rev { font-family:${DISPLAY}; font-weight:900; font-size:40px; line-height:1; color:${GOLD}; letter-spacing:-.01em; }
.cbl-affiliates .tier .name { font-family:${DISPLAY}; font-weight:900; font-size:19px; text-transform:uppercase; letter-spacing:-.005em; }
.cbl-affiliates .tier .sub { font-family:${MONO}; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:${GOLD}; }
.cbl-affiliates .tier .note { color:#A8A8A8; font-size:13px; line-height:1.5; margin-top:2px; }

/* ── Restaurant partner pricing tiers ── */
.cbl-affiliates .pricing-band {
  background:#0A0A0A;
  border-top:1px solid rgba(201,151,66,.14);
}
.cbl-affiliates .pricing-grid {
  display:grid; grid-template-columns:repeat(3,1fr); gap:24px;
}
.cbl-affiliates .pricing-card {
  background:#111; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; padding:32px 30px 28px;
  display:flex; flex-direction:column; gap:0;
  transition:transform .35s, border-color .35s;
  animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both;
  position:relative; overflow:hidden;
}
.cbl-affiliates .pricing-card:hover { transform:translateY(-5px); border-color:rgba(201,151,66,.4); }
.cbl-affiliates .pricing-card.gold-card {
  background:linear-gradient(145deg,#181408,#120f04);
  border-color:rgba(201,151,66,.55);
  box-shadow:0 0 40px rgba(201,151,66,.08);
}
.cbl-affiliates .pricing-card.gold-card::before {
  content:'MOST POPULAR';
  position:absolute; top:0; right:0;
  background:${GOLD}; color:#000;
  font-family:${MONO}; font-size:9px; font-weight:700;
  letter-spacing:.16em; text-transform:uppercase;
  padding:5px 14px;
  border-radius:0 0 0 10px;
}
.cbl-affiliates .pricing-tier-label {
  font-family:${MONO}; font-size:10px; letter-spacing:.18em;
  text-transform:uppercase; color:${GOLD};
  margin-bottom:10px; font-weight:700;
}
.cbl-affiliates .pricing-price {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(42px,5vw,64px); line-height:1;
  color:#fff; letter-spacing:-.02em; margin-bottom:20px;
}
.cbl-affiliates .pricing-price span {
  font-size:.38em; font-weight:700; color:#888;
  vertical-align:middle; margin-left:4px; letter-spacing:.06em;
}
.cbl-affiliates .pricing-divider {
  width:100%; height:1px;
  background:linear-gradient(90deg, ${GOLD}, transparent);
  margin-bottom:20px; opacity:.35;
}
.cbl-affiliates .pricing-list {
  list-style:none; margin:0; padding:0;
  display:flex; flex-direction:column; gap:12px;
  flex:1;
}
.cbl-affiliates .pricing-list li {
  position:relative; padding-left:24px;
  color:#C8C8C8; font-size:14px; line-height:1.5;
}
.cbl-affiliates .pricing-list li::before {
  content:'';
  position:absolute; left:0; top:8px;
  width:10px; height:10px; border-radius:50%;
  background:${GOLD}; opacity:.8;
}
.cbl-affiliates .pricing-cta {
  margin-top:28px;
  display:inline-flex; align-items:center; gap:8px;
  background:${GOLD}; color:#000; border:0;
  padding:14px 28px; border-radius:6px 0 6px 0;
  font-family:${DISPLAY}; font-weight:800;
  font-size:13px; letter-spacing:.10em; text-transform:uppercase;
  text-decoration:none; transition:background .2s, transform .2s;
  width:100%; justify-content:center;
}
.cbl-affiliates .pricing-cta:hover { background:#DDB15F; transform:translateY(-1px); }

/* ── Apply CTA band ── */
.cbl-affiliates .cta-band {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(201,151,66,.16), transparent 60%),
    linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%);
  text-align:center;
}
.cbl-affiliates .cta-band h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(34px,4vw,56px); line-height:.98;
  letter-spacing:-.01em; text-transform:uppercase; margin-bottom:10px;
}
.cbl-affiliates .cta-band h2 .it { font-family:${ITALIC}; font-style:italic; color:${GOLD}; font-weight:600; text-transform:none; font-size:.6em; margin-left:8px; }
.cbl-affiliates .cta-band p { color:#B0B0B0; font-size:16px; line-height:1.6; max-width:54ch; margin:0 auto 24px; }
.cbl-affiliates .apply {
  display:inline-flex; align-items:center; gap:10px;
  background:${GOLD}; color:#000; border:0;
  padding:15px 36px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:900;
  font-size:14px; letter-spacing:.14em; text-transform:uppercase; transition:background .2s;
}
.cbl-affiliates .apply:hover { background:#DDB15F; }

/* ── Responsive ── */
@media (max-width:1100px){
  .cbl-affiliates .hero { padding:22px 24px 16px; }
  .cbl-affiliates section.band { padding:48px 24px; }
  .cbl-affiliates .partner-grid { grid-template-columns:1fr; }
  .cbl-affiliates .steps { grid-template-columns:repeat(2,1fr); }
  .cbl-affiliates .tier-grid { grid-template-columns:1fr; }
  .cbl-affiliates .pricing-grid { grid-template-columns:1fr; }
}
`;

function PartnerCard({ p }: { p: Partner }) {
  return (
    <div id={p.id} className={'partner-card' + (p.feature ? ' feature' : '')}>
      <div className="tag">{p.tag}</div>
      <h3>{p.name}</h3>
      <p>{p.blurb}</p>
      <ul>
        {p.bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <a href={p.link} className="cta">
        Learn More →
      </a>
    </div>
  );
}

export function Affiliates() {
  return (
    <main className="cbl-affiliates">
      <style>{AFFILIATES_CSS}</style>

      <section className="hero cbl-light-streams">
        {/* first child = dedicated streak layer (hosts 2 of the 4 streaks), under the copy */}
        <div className="hero-streams" aria-hidden="true" />
        <div className="hero-inner">
          <div className="eyebrow">partners · commission program</div>
          <h1 className="hero-title">
            <span className="title-stack">
              <span className="h1-main">Affiliates</span>
              <span className="hero-subtitle">
                <span>Partner with CBL.</span>
                <span className="it">Earn on every booking.</span>
              </span>
            </span>
          </h1>
          <p className="lede">
            Whether you're a hotel, restaurant, or local attraction, join our network and connect
            with members and drivers exploring your city — and earn commission on every booking you
            send our way.
          </p>
        </div>
      </section>

      <section className="band">
        <div className="band-inner">
          <div className="section-eyebrow">ways to partner</div>
          <h2 className="section-h2">
            Three ways <span className="it">to join</span>
          </h2>
          <p className="section-lede">
            Pick the path that fits your business. Restaurants and attractions get featured placement
            on their category pages; hotels and concierge partners earn on every guest booking.
          </p>
          <div className="partner-grid">
            {PARTNERS.map((p) => (
              <PartnerCard key={p.id} p={p} />
            ))}
          </div>
        </div>
      </section>

      <section className="band tight">
        <div className="band-inner">
          <div className="section-eyebrow">how it works</div>
          <h2 className="section-h2" style={{ marginBottom: 28 }}>
            From apply <span className="it">to earning</span>
          </h2>
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

      <section className="band comm-band">
        <div className="band-inner">
          <div className="section-eyebrow">commission info</div>
          <h2 className="section-h2">
            What you earn <span className="it">how it pays</span>
          </h2>
          <p className="section-lede">
            Commissions are paid by the network or built into partner bookings — never added to a
            member's price. Track everything from your dashboard with instant Stripe payouts.
          </p>
          <div className="tier-grid">
            {TIERS.map((t) => (
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

      <section className="band cta-band">
        <div className="band-inner">
          <h2>
            Ready to partner <span className="it">with CBL?</span>
          </h2>
          <p>Apply in minutes. Tell us about your business and we'll get you set up across the platform.</p>
          <a className="apply" href={`${APP_URL}/partner/signup`} target="_blank" rel="noopener noreferrer">
            Apply Now →
          </a>
        </div>
      </section>
    </main>
  );
}
