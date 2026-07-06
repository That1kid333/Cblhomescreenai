import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

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

const faqData = [
  {
    question: 'Is City Bucket List a rideshare company?',
    answer: 'No. City Bucket List is not a rideshare company and does not operate as a transportation provider. It is a Private Membership Platform (Software as a Service) that connects subscribed members who choose to communicate and schedule rides directly with independent contractors.',
  },
  {
    question: 'Why is this platform more transparent than other transportation apps?',
    answer: 'Platform fees often hide in per-ride commissions and unpredictable price changes. City Bucket List uses a flat membership model, so: Riders know exactly what they\'re paying. Drivers know exactly what they\'re earning. Pricing is upfront and consistent. There are no surprise markups or percentages taken out. This model keeps everything fair, honest, and community-driven.',
  },
  {
    question: 'Do drivers work for City Bucket List?',
    answer: 'No. Drivers are Independent Contractors and are not employees of City Bucket List. They use our software tools (calendar, communication features, payment processing, member directory) to manage their own members and scheduled rides.',
  },
  {
    question: 'How do Riders qualify for membership?',
    answer: 'Anyone can sign up as a rider! While a referral code isn\'t required, using one rewards the person who referred you with bonus points. Ask a friend or driver for their code to help them earn rewards when you join.',
  },
  {
    question: 'What is the member digital business card, and how do I earn by sharing it?',
    answer: 'City Bucket List is a software-as-a-service platform, and every free member account includes a digital business card — your profile plus a personal QR code, built right into the site and app. Share it with anyone: a restaurant owner you love, a friend, or a driver worth knowing. When they join under your code, you earn rewards. It turns the local spots and people you already recommend into value for you — and helps grow the community.',
  },
  {
    question: 'Do Riders pay a monthly fee?',
    answer: 'No. Rider membership is completely free. First-time members may receive special onboarding incentives depending on availability.',
  },
  {
    question: 'Do Drivers pay a monthly fee?',
    answer: 'Yes. Drivers pay a $19.99 Monthly Subscription to access all driver tools. The first month is free, and the subscription can be canceled anytime. Membership includes: Digital driver packet, QR codes, Badges, Full access to the app and booking tools.',
  },
  {
    question: 'Does City Bucket List take a percentage of rides?',
    answer: 'Yes. For card payments only, a small service fee (round-up to the nearest dollar, ranging from $0.01 to $0.99) is added to support platform operations. This fee is clearly displayed before booking. In-person payments do not include a service fee. 100% of your driver\'s fare goes directly to them — the service fee supports the platform, not the driver\'s earnings.',
  },
  {
    question: 'What kind of rides can Riders schedule?',
    answer: 'All rides are scheduled rides only through the private membership platform. There is no on-demand or "instant pickup" service. Members coordinate together using the tools provided inside the app.',
  },
  {
    question: 'How do payments work?',
    answer: 'Riders can pay by: Card (securely processed through Stripe) or In-person payment with their Independent Driver. Drivers receive payouts directly and instantly through their connected Stripe account.',
  },
  {
    question: 'Can Independent Drivers share Riders with each other?',
    answer: 'Yes. If a Driver cannot take a scheduled Rider, they can easily share the ride with another verified Driver and still receive a portion of the revenue. This creates more flexibility and higher earnings within the membership community.',
  },
  {
    question: 'How do members communicate?',
    answer: 'All communication happens inside the app, where riders and independent drivers can: Connect, Message, Schedule, Coordinate their transportation needs. This keeps everything secure and organized.',
  },
];

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
.cbl-faq .hero-inner { max-width:1280px; margin:0 auto; }
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

      <section className="hero">
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
