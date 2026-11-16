import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { FAQ_DATA } from '../../../shared/faq';

/**
 * FAQ — re-skinned to match the Explore pages branding: dark canvas, gold
 * (#C99742) accents, Myriad Pro display headers with Playfair Display italic
 * accents, mono eyebrow labels, the shared map-backdrop hero, and the
 * angled-corner card treatment. The Radix accordion behavior is unchanged;
 * only the presentation now follows the rest of the new site.
 */

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

// The questions live in shared/faq.ts so the page and its search markup can't drift apart.
const faqData = FAQ_DATA;

const FAQ_CSS = `
.cbl-faq { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-faq *,.cbl-faq *::before,.cbl-faq *::after { box-sizing:border-box; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }

/* ── Hero band ── */
.cbl-faq .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 16px;
}
.cbl-faq .hero-inner { max-width:1280px; margin:0 auto; position:relative; z-index:2; }
.cbl-faq .hero-streams { position:absolute; inset:0; z-index:1; pointer-events:none; }
.cbl-faq .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#fff; font-weight:700; text-transform:lowercase; margin-bottom:10px;
}
.cbl-faq .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:#C99742; animation:cbl-pulse 2.4s ease-in-out infinite;
}
.cbl-faq h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-faq h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-faq h1.hero-title .h1-main { color:#fff; white-space:nowrap; }
.cbl-faq .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:#C99742;
}
.cbl-faq .hero-subtitle .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:#C99742; text-transform:none; letter-spacing:0; font-size:.82em;
}
.cbl-faq .hero p.lede { margin-top:14px; max-width:620px; font-size:16px; line-height:1.45; color:#B8B8B8; }

/* ── Section frame ── */
.cbl-faq section.band { padding:48px 48px 64px; }
.cbl-faq .band-inner { max-width:1280px; margin:0 auto; }

/* ── Accordion ── */
.cbl-faq .faq-list { display:flex; flex-direction:column; gap:10px; }
.cbl-faq .faq-item {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:14px 0 14px 0; overflow:hidden;
  transition:border-color .25s;
}
.cbl-faq .faq-item[data-state="open"] { border-color:rgba(201,151,66,.45); }
.cbl-faq .faq-item:hover { border-color:rgba(201,151,66,.30); }
.cbl-faq .faq-trigger {
  width:100%; background:transparent; border:0; cursor:pointer;
  padding:20px 22px; display:flex; align-items:center; justify-content:space-between; gap:18px;
  text-align:left; color:#fff;
}
.cbl-faq .faq-trigger .q {
  font-family:${DISPLAY}; font-weight:800; font-size:19px;
  line-height:1.15; letter-spacing:-.005em; text-transform:uppercase;
  transition:color .2s;
}
.cbl-faq .faq-trigger:hover .q { color:#C99742; }
.cbl-faq .faq-trigger .ic {
  flex-shrink:0; width:32px; height:32px; border-radius:50%;
  border:1px solid rgba(201,151,66,.4); color:#C99742;
  display:flex; align-items:center; justify-content:center;
  transition:transform .25s, background .25s, color .25s;
}
.cbl-faq .faq-trigger[data-state="open"] .ic { transform:rotate(180deg); background:#C99742; color:#000; }
.cbl-faq .faq-content { overflow:hidden; }
.cbl-faq .faq-content[data-state="open"] { animation:accordion-down 200ms ease-out; }
.cbl-faq .faq-content[data-state="closed"] { animation:accordion-up 200ms ease-out; }
.cbl-faq .faq-content .answer {
  padding:2px 22px 20px; color:#B0B0B0; font-size:14px; line-height:1.65;
  border-top:1px solid rgba(201,151,66,.18); margin-top:0; padding-top:16px;
}

@media (max-width:1100px){
  .cbl-faq .hero { padding:22px 24px 16px; }
  .cbl-faq section.band { padding:40px 24px 56px; }
}
`;

export function FAQ() {
  return (
    <main className="cbl-faq">
      <style>{FAQ_CSS}</style>

      <section className="hero cbl-light-streams">
        {/* first child = dedicated streak layer (hosts 2 of the 4 light streams), under the copy */}
        <div className="hero-streams" aria-hidden="true" />
        <div className="hero-inner">
          <div className="eyebrow">questions · how the platform works</div>
          <h1 className="hero-title">
            <span className="title-stack">
              <span className="h1-main">FAQ</span>
              <span className="hero-subtitle">
                <span>Everything you need</span>
                <span className="it">to know</span>
              </span>
            </span>
          </h1>
          <p className="lede">
            The essentials on memberships, scheduled rides, payments, and how City Bucket List
            connects riders with the independent drivers they already know.
          </p>
        </div>
      </section>

      <section className="band">
        <div className="band-inner">
          <Accordion.Root type="single" collapsible className="faq-list">
            {faqData.map((faq, index) => (
              <Accordion.Item key={index} value={`item-${index}`} className="faq-item">
                <Accordion.Header asChild>
                  <Accordion.Trigger className="faq-trigger">
                    <span className="q">{faq.question}</span>
                    <span className="ic">
                      <ChevronDown className="w-5 h-5" aria-hidden />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content className="faq-content">
                  <div className="answer">{faq.answer}</div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </div>
      </section>
    </main>
  );
}
