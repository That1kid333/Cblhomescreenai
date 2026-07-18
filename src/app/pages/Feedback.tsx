import { useState } from 'react';

/**
 * Feedback — public-facing "tell us what you think" page. Distinct from
 * Contact (which is for tech help / inquiries). Lives at /feedback.
 *
 * Three audience buckets — Member · Rider · Driver · Partner · Other — and
 * an area picker so submissions can be triaged into the right team channel.
 * Open-ended free text; email and name are OPTIONAL so anonymous feedback
 * is welcome.
 *
 * Posts to /api/contact (same backend Contact uses) with topic='feedback'
 * so submissions ride the existing pipeline. Justin can split this off to
 * a dedicated /api/feedback route later without any frontend change.
 */

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

const AUDIENCES = [
  { value: 'member', label: 'Member' },
  { value: 'rider', label: 'Rider' },
  { value: 'driver', label: 'Independent Driver' },
  { value: 'partner', label: 'Partner (restaurant / attraction / hotel)' },
  { value: 'concierge', label: 'Concierge' },
  { value: 'other', label: 'Other / Visitor' },
];

const AREAS = [
  { value: 'website', label: 'Website' },
  { value: 'rider-app', label: 'Rider App' },
  { value: 'driver-app', label: 'Driver App' },
  { value: 'buckee', label: 'Buckee (the AI concierge)' },
  { value: 'partner-program', label: 'Partner Program' },
  { value: 'general', label: 'Something else' },
];

const FEEDBACK_CSS = `
.cbl-feedback { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-feedback *,.cbl-feedback *::before,.cbl-feedback *::after { box-sizing:border-box; }
.cbl-feedback button { font-family:inherit; cursor:pointer; }
.cbl-feedback a { color:#C99742; text-decoration:none; }
.cbl-feedback a:hover { text-decoration:underline; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }

/* ── Hero band ── */
.cbl-feedback .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 16px;
}
.cbl-feedback .hero-inner { max-width:1280px; margin:0 auto; position:relative; z-index:2; }
.cbl-feedback .hero-streams { position:absolute; inset:0; z-index:1; pointer-events:none; }
.cbl-feedback .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#fff; font-weight:700; text-transform:lowercase; margin-bottom:10px;
}
.cbl-feedback .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:#C99742; animation:cbl-pulse 2.4s ease-in-out infinite;
}
.cbl-feedback h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-feedback h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-feedback h1.hero-title .h1-main { color:#fff; white-space:nowrap; }
.cbl-feedback .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:#C99742;
}
.cbl-feedback .hero-subtitle .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:#C99742; text-transform:none; letter-spacing:0; font-size:.82em;
}
.cbl-feedback .hero p.lede { margin-top:14px; max-width:680px; font-size:16px; line-height:1.45; color:#B8B8B8; }
.cbl-feedback .hero .lede strong { color:#fff; font-weight:600; }
.cbl-feedback .hero .helpdesk-link { display:inline-block; margin-top:14px; font-family:${MONO}; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#8a8a8a; }
.cbl-feedback .hero .helpdesk-link a { color:#C99742; }

/* ── Section frame ── */
.cbl-feedback section.band { padding:28px 48px 60px; }
.cbl-feedback .band-inner { max-width:1280px; margin:0 auto; }

/* ── Form card ── */
.cbl-feedback .form-card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:22px 0 22px 0; padding:28px 32px; max-width:960px;
}
.cbl-feedback form { display:grid; grid-template-columns:1fr 1fr; gap:16px 28px; align-items:stretch; }
.cbl-feedback .fields-col { display:flex; flex-direction:column; gap:14px; }
.cbl-feedback .field { display:flex; flex-direction:column; gap:6px; }
.cbl-feedback .message-field { display:flex; flex-direction:column; gap:6px; }
.cbl-feedback .message-field textarea { flex:1; min-height:220px; }
.cbl-feedback .form-footer {
  grid-column:1 / -1;
  display:flex; align-items:center; justify-content:space-between;
  gap:24px; flex-wrap:wrap;
  border-top:1px solid rgba(255,255,255,.08); padding-top:18px;
}
.cbl-feedback label {
  font-family:${MONO}; font-size:11px; letter-spacing:.14em;
  text-transform:uppercase; color:#B8B8B8;
}
.cbl-feedback label .req { color:#C99742; }
.cbl-feedback label .opt { color:#666; font-size:10px; }
.cbl-feedback input, .cbl-feedback select, .cbl-feedback textarea {
  width:100%; background:#0A0A0A; border:1px solid rgba(255,255,255,.12);
  border-radius:12px; padding:13px 14px; color:#fff;
  font-family:${BODY}; font-size:15px; outline:0; transition:border-color .2s;
}
.cbl-feedback input::placeholder, .cbl-feedback textarea::placeholder { color:#555; }
.cbl-feedback input:focus, .cbl-feedback select:focus, .cbl-feedback textarea:focus { border-color:#C99742; }
.cbl-feedback select { appearance:none; cursor:pointer; }
.cbl-feedback textarea { resize:none; line-height:1.5; }
.cbl-feedback .footer-note { font-family:${MONO}; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#8a8a8a; flex:1; min-width:240px; line-height:1.5; }
.cbl-feedback .submit {
  background:#C99742; color:#000; border:0;
  padding:14px 44px; border-radius:999px; white-space:nowrap;
  font-family:${DISPLAY}; font-weight:900;
  font-size:15px; letter-spacing:.14em; text-transform:uppercase; transition:background .2s;
}
.cbl-feedback .submit:hover:not(:disabled) { background:#DDB15F; }
.cbl-feedback .submit:disabled { background:#555; cursor:not-allowed; }
.cbl-feedback .alert { grid-column:1 / -1; padding:14px 16px; border-radius:12px; text-align:center; font-weight:600; font-size:14px; }
.cbl-feedback .alert.ok { background:rgba(77,191,102,.12); border:1px solid rgba(77,191,102,.5); color:#7FD68F; }
.cbl-feedback .alert.err { background:rgba(229,76,76,.12); border:1px solid rgba(229,76,76,.5); color:#F08A8A; }

@media (max-width:900px){
  .cbl-feedback .hero { padding:22px 24px 16px; }
  .cbl-feedback section.band { padding:28px 24px 60px; }
  .cbl-feedback .form-card { padding:24px 22px; max-width:none; }
  .cbl-feedback form { grid-template-columns:1fr; }
  .cbl-feedback .message-field textarea { min-height:160px; }
  .cbl-feedback .form-footer { flex-direction:column; align-items:stretch; }
  .cbl-feedback .submit { width:100%; }
}
`;

export function Feedback() {
  const [formData, setFormData] = useState({
    audience: '',
    area: '',
    name: '',
    email: '',
    message: '',
    website: '', // honeypot — hidden from real users, bots fill it in
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const audienceLabel = (v: string) =>
    AUDIENCES.find((a) => a.value === v)?.label || 'Unknown';
  const areaLabel = (v: string) => AREAS.find((a) => a.value === v)?.label || 'Unknown';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    // Repurpose the existing /api/contact endpoint with topic='feedback'.
    // Stuff the audience + area context into the message body so the
    // backend doesn't need new fields to receive triage info.
    const payload = {
      topic: 'feedback',
      fullName: formData.name.trim() || 'Anonymous',
      email: formData.email.trim() || 'no-reply@feedback.cbl',
      phone: '',
      message:
        `[Audience: ${audienceLabel(formData.audience)}] ` +
        `[Area: ${areaLabel(formData.area)}]\n\n` +
        formData.message,
      agreedToTerms: true,
      website: formData.website,
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success !== false) {
        setStatus('success');
        setFormData({ audience: '', area: '', name: '', email: '', message: '', website: '' });
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Could not send your feedback. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again later.');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <main className="cbl-feedback">
      <style>{FEEDBACK_CSS}</style>

      <section className="hero cbl-light-streams">
        {/* first child = dedicated streak layer (hosts 2 of the 4 light streams), under the copy */}
        <div className="hero-streams" aria-hidden="true" />
        <div className="hero-inner">
          <div className="eyebrow">your voice · we read every one</div>
          <h1 className="hero-title">
            <span className="title-stack">
              <span className="h1-main">Feedback</span>
              <span className="hero-subtitle">
                <span>Tell us what you think.</span>
                <span className="it">we're listening.</span>
              </span>
            </span>
          </h1>
          <p className="lede">
            This isn't a complaint box. It's where ideas, stories, gripes and cheers from{' '}
            <strong>members, riders, drivers, partners and concierges</strong> shape what City
            Bucket List becomes next. Anonymous is welcome — email and name are optional.
          </p>
          <div className="helpdesk-link">
            something actually broken? → <a href="/contact">tech help &amp; support</a>
          </div>
        </div>
      </section>

      <section className="band">
        <div className="band-inner">
          <div className="form-card">
            <form onSubmit={handleSubmit}>
              {/* Honeypot — hidden from real users, bots fill it in */}
              <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} aria-hidden="true">
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={formData.website}
                  onChange={(e) => setFormData((f) => ({ ...f, website: e.target.value }))}
                />
              </div>
              <div className="fields-col">
                <div className="field">
                  <label htmlFor="audience">
                    Who are you? <span className="req">*</span>
                  </label>
                  <select
                    id="audience"
                    name="audience"
                    value={formData.audience}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Pick the one that fits
                    </option>
                    {AUDIENCES.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="area">
                    What's this about? <span className="req">*</span>
                  </label>
                  <select
                    id="area"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>
                      Pick an area
                    </option>
                    {AREAS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="name">
                    Your Name <span className="opt">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Leave blank to stay anonymous"
                  />
                </div>

                <div className="field">
                  <label htmlFor="email">
                    Email <span className="opt">(optional, if you want a reply)</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div className="field message-field">
                <label htmlFor="message">
                  Your feedback <span className="req">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={8}
                  placeholder={
                    "Tell us a story, share an idea, flag something that's not landing, or just say what's working. Long or short — we'll read it."
                  }
                />
              </div>

              <div className="form-footer">
                <div className="footer-note">
                  We read every submission. We can't reply to every one, but the team scans this
                  inbox weekly and the best ideas shape the roadmap.
                </div>
                <button type="submit" className="submit" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Sending…' : 'Send Feedback →'}
                </button>
              </div>

              {status === 'success' && (
                <div className="alert ok">
                  Thank you — your feedback is in. The team will read it.
                </div>
              )}

              {status === 'error' && <div className="alert err">{errorMessage}</div>}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
