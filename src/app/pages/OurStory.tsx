import buckeeConcierge from '../../assets/buckee.png';
import driverImg from '../../assets/driver_at_wheel.jpg';
import riderImg from '../../assets/rider_meeting_driver_neutral.png';
import { Globe, QrCode, Share2, TrendingUp } from 'lucide-react';
import { APP_URL } from '../lib/constants';

/**
 * Our Story — re-skinned to match the Explore pages (Travels / Transportation /
 * Eats & Drinks / Attractions) branding: dark canvas, gold (#C99742) accents,
 * Myriad Pro display headers with Playfair Display italic accents, mono eyebrow
 * labels, the shared map-backdrop hero, and the angled-corner card treatment.
 *
 * Copy is unchanged from the previous version; only the presentation now follows
 * the rest of the new site. Hero backdrop reuses `/eats/imagery/cbl-map-backdrop.jpg`.
 */

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

const STORY_CSS = `
.cbl-story { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-story *,.cbl-story *::before,.cbl-story *::after { box-sizing:border-box; }
.cbl-story button { font-family:inherit; cursor:pointer; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }
@keyframes cbl-reveal { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

/* ── Hero band ── */
.cbl-story .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 16px;
}
.cbl-story .hero-inner { max-width:1280px; margin:0 auto; }
.cbl-story .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#fff; font-weight:700; text-transform:lowercase; margin-bottom:10px;
}
.cbl-story .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:#C99742; animation:cbl-pulse 2.4s ease-in-out infinite;
}
.cbl-story h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-story h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-story h1.hero-title .h1-main { color:#fff; white-space:nowrap; }
.cbl-story .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:#C99742;
}
.cbl-story .hero-subtitle .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:#C99742; text-transform:none; letter-spacing:0; font-size:.82em;
}
.cbl-story .hero p.lede { margin-top:14px; max-width:620px; font-size:16px; line-height:1.45; color:#B8B8B8; }

/* ── Section frame ── */
.cbl-story section.band { padding:48px 48px 56px; }
.cbl-story section.band.tight { padding:28px 48px 36px; }
.cbl-story .band-inner { max-width:1280px; margin:0 auto; }
.cbl-story .section-eyebrow {
  font-family:${MONO}; font-size:12px; color:#C99742;
  letter-spacing:.18em; text-transform:uppercase;
  display:inline-flex; align-items:center; gap:10px; margin-bottom:12px;
}
.cbl-story .section-eyebrow::before { content:''; width:28px; height:1px; background:#C99742; }
.cbl-story .section-h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(40px,4.6vw,64px); line-height:.95;
  letter-spacing:-.01em; text-transform:uppercase; margin-bottom:8px;
}
.cbl-story .section-h2 .it {
  font-family:${ITALIC}; font-style:italic;
  color:#C99742; font-weight:600; text-transform:none;
  font-size:.6em; margin-left:8px;
}
.cbl-story .section-lede {
  color:#B0B0B0; font-size:15px; line-height:1.55; max-width:62ch; margin-bottom:24px;
}

/* ── Split (image + copy) rows ── */
.cbl-story .split {
  display:grid; grid-template-columns:1fr 1fr; gap:0;
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; overflow:hidden;
  transition:transform .35s, border-color .35s;
  animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both;
}
.cbl-story .split:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.45); }
.cbl-story .split.reverse .split-media { order:2; }
.cbl-story .split-media { position:relative; min-height:340px; }
.cbl-story .split-media img { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block; }
.cbl-story .split-body { padding:40px 44px; display:flex; flex-direction:column; justify-content:center; gap:14px; }
.cbl-story .split-body h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(30px,3.2vw,44px); line-height:.98;
  letter-spacing:-.01em; text-transform:uppercase;
}
.cbl-story .split-body p { color:#B0B0B0; font-size:15px; line-height:1.6; }

/* ── Feature cards (Exciting News) ── */
.cbl-story .feature-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
.cbl-story .feature-card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:18px 0 18px 0; padding:26px 24px;
  display:flex; flex-direction:column; gap:14px;
  transition:transform .35s, border-color .35s;
  animation:cbl-reveal .6s cubic-bezier(.2,.8,.2,1) both;
}
.cbl-story .feature-card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.45); }
.cbl-story .feature-card .ic {
  width:72px; height:72px; border-radius:16px;
  background:#0A0A0A; border:1px solid rgba(201,151,66,.35);
  display:flex; align-items:center; justify-content:center; color:#C99742; padding:12px;
}
.cbl-story .feature-card .ic img { width:100%; height:100%; object-fit:contain; }
.cbl-story .feature-card h3 {
  font-family:${DISPLAY}; font-weight:900; font-size:21px;
  line-height:1.05; text-transform:uppercase; letter-spacing:-.005em; color:#C99742;
}
.cbl-story .feature-card p { color:#A8A8A8; font-size:13px; line-height:1.55; }

/* ── CTA band ── */
.cbl-story .cta-band {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(201,151,66,.16), transparent 60%),
    linear-gradient(180deg, #0F0F0F 0%, #0A0A0A 100%);
  border-top:1px solid rgba(201,151,66,.18);
  text-align:center;
}
.cbl-story .cta-band h2 {
  font-family:${DISPLAY}; font-weight:900;
  font-size:clamp(34px,4vw,56px); line-height:.98;
  letter-spacing:-.01em; text-transform:uppercase; margin-bottom:10px;
}
.cbl-story .cta-band h2 .it {
  font-family:${ITALIC}; font-style:italic; color:#C99742;
  font-weight:600; text-transform:none; font-size:.6em; margin-left:8px;
}
.cbl-story .cta-band p { color:#B0B0B0; font-size:16px; line-height:1.6; max-width:52ch; margin:0 auto 24px; }
.cbl-story .cta-band .cta {
  display:inline-flex; align-items:center; gap:10px;
  background:#C99742; color:#000; border:0;
  padding:14px 32px; border-radius:999px;
  font-family:${DISPLAY}; font-weight:900;
  font-size:14px; letter-spacing:.14em; text-transform:uppercase;
}
.cbl-story .cta-band .cta:hover { background:#DDB15F; }

/* ── Responsive ── */
@media (max-width:1100px){
  .cbl-story .hero { padding:22px 24px 16px; }
  .cbl-story section.band { padding:48px 24px; }
  .cbl-story .split { grid-template-columns:1fr; }
  .cbl-story .split.reverse .split-media { order:0; }
  .cbl-story .split-media { min-height:240px; }
  .cbl-story .split-body { padding:28px 24px; }
  .cbl-story .feature-grid { grid-template-columns:1fr; }
}
`;

export function OurStory() {
  return (
    <main className="cbl-story">
      <style>{STORY_CSS}</style>

      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">since day one · locals helping travelers feel at home</div>
          <h1 className="hero-title">
            <span className="title-stack">
              <span className="h1-main">Our Story</span>
              <span className="hero-subtitle">
                <span>Locals everywhere.</span>
                <span className="it">Friends from anywhere.</span>
              </span>
            </span>
          </h1>
          <p className="lede">
            What began as a community-driven transportation platform has grown into a full
            lifestyle and local discovery membership — built to help you live like a local in
            every city you visit.
          </p>
        </div>
      </section>

      <section className="band">
        <div className="band-inner" style={{ display: 'grid', gap: 24 }}>
          {/* How It All Started */}
          <div className="split">
            <div className="split-media">
              <img
                src={driverImg}
                alt="CBL driver"
              />
            </div>
            <div className="split-body">
              <div className="section-eyebrow">how it all started</div>
              <h2>
                A simple idea <span className="it">that grew</span>
              </h2>
              <p>
                City Bucket List started with a simple idea: locals everywhere helping new friends
                from anywhere feel at home. What began as a community-driven transportation platform
                has evolved into something much bigger — a full lifestyle and local discovery
                membership built for every city.
              </p>
            </div>
          </div>

          {/* What We Do */}
          <div className="split reverse">
            <div className="split-media">
              <img
                src={riderImg}
                alt="Rider meeting their CBL driver"
              />
            </div>
            <div className="split-body">
              <div className="section-eyebrow">what we do</div>
              <h2>
                Live like <span className="it">a local</span>
              </h2>
              <p>
                City Bucket List connects members with authentic local experiences across four key
                categories: transportation, dining, attractions, and travel services. Whether you
                need a safe ride from a trusted independent driver, want to discover the best local
                restaurants, or are looking for hidden attractions that only locals know about, our
                membership platform brings it all together.
              </p>
              <p>
                We partner with independent contractors, local businesses, and community experts to
                create a curated directory of services and experiences that help you live like a
                local in any city you visit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Your card, shareable — the member digital business card / referral loop */}
      <section className="band tight">
        <div className="band-inner">
          <div className="section-eyebrow">share &amp; earn</div>
          <h2 className="section-h2" style={{ marginBottom: 12 }}>
            Your membership, <span className="it">made to share</span>
          </h2>
          <p style={{ color: '#B0B0B0', fontSize: 15, lineHeight: 1.6, maxWidth: '64ch', margin: '0 0 24px' }}>
            City Bucket List is a software-as-a-service platform — and every member gets their own
            digital business card built right in. It carries your profile and a personal QR code, so
            sharing City Bucket List is as easy as showing your phone. Found a restaurant you love?
            Share your card with the owner. Meet a driver worth knowing? Same code. When they join
            under you, you earn — and the community grows.
          </p>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="ic"><QrCode className="w-full h-full" /></div>
              <h3>Your Own QR Code</h3>
              <p>
                A digital business card with a personal QR code, ready the moment you create your free
                account — no printing, no setup.
              </p>
            </div>
            <div className="feature-card">
              <div className="ic"><Share2 className="w-full h-full" /></div>
              <h3>Share With Anyone</h3>
              <p>
                Riders, drivers, and local business owners — one tap or scan brings them into your
                circle and unlocks member savings for everyone.
              </p>
            </div>
            <div className="feature-card">
              <div className="ic"><TrendingUp className="w-full h-full" /></div>
              <h3>Earn On Every Signup</h3>
              <p>
                When someone joins under your code, you're rewarded — turning the spots and people you
                already recommend into real value for you and for CBL.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Exciting News */}
      <section className="band tight">
        <div className="band-inner">
          <div className="section-eyebrow">what's next</div>
          <h2 className="section-h2" style={{ marginBottom: 24 }}>
            Exciting news <span className="it">on the horizon</span>
          </h2>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="ic">
                <img src={buckeeConcierge} alt="Buckee" />
              </div>
              <h3>Meet Buckee — Your AI Travel Assistant</h3>
              <p>
                We're launching Buckee, an AI-powered travel companion that creates personalized
                itineraries based on your preferences, connects you with local insiders, and helps
                you discover experiences tailored just for you. Think of it as having a local friend
                in every city, available 24/7.
              </p>
            </div>

            <div className="feature-card">
              <div className="ic">
                <svg viewBox="682 100 83 90" fill="none" stroke="currentColor" strokeWidth="3.98" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="735.03" cy="138.87" r="6.35" />
                  <path d="M738.15,144.53s8.66,4.29,8.66,11.09c-5.22,0-8.23,0-8.23,0h-4.95s-5.64,0-10.86,0c0-6.8,8.66-11.09,8.66-11.09" />
                  <path d="M692.94,176.42v8.62h63.93c4.22,0,4.22-4.22,4.22-4.22v-72.41c0-4.22-4.77-4.4-4.77-4.4h-63.38v8.07" />
                  <line x1="707.56" x2="707.56" y1="110.8" y2="178.44" />
                  <line x1="692.94" x2="692.94" y1="122.07" y2="131.08" />
                  <line x1="692.94" x2="692.94" y1="140.71" y2="147.46" />
                  <line x1="692.94" x2="692.94" y1="159.67" y2="166.41" />
                  <rect x="686.2" y="113.07" width="13.47" height="9" />
                  <rect x="686.2" y="131.08" width="13.47" height="9" />
                  <rect x="686.2" y="148.81" width="13.47" height="9" />
                  <rect x="686.2" y="166.69" width="13.47" height="9" />
                </svg>
              </div>
              <h3>Expanding Our Directory</h3>
              <p>
                We're rapidly growing our network of verified independent contractors and local
                businesses. From boutique hotels to family-owned restaurants, from local tour guides
                to trusted transportation providers — our directory is becoming the most
                comprehensive resource for authentic local experiences.
              </p>
            </div>

            <div className="feature-card">
              <div className="ic">
                <Globe className="w-full h-full" />
              </div>
              <h3>Growing Strategic Partnerships</h3>
              <p>
                We're partnering with hotels, tourism boards, and travel platforms to bring the City
                Bucket List experience to more cities worldwide. Our vision is to create a global
                community where every traveler can access local expertise and every local can share
                their city with the world.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="band cta-band">
        <div className="band-inner">
          <h2>
            Ready to start <span className="it">your journey?</span>
          </h2>
          <p>Join free and let locals everywhere help you feel at home — in any city you visit.</p>
          <a className="cta" href={APP_URL}>
            Join City Bucket List →
          </a>
        </div>
      </section>
    </main>
  );
}
