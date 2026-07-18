import { useState } from 'react';

/**
 * Contact Us — re-skinned to match the Explore pages branding: dark canvas, gold
 * (#C99742) accents, Myriad Pro display headers with Playfair Display italic
 * accents, mono eyebrow labels, the shared map-backdrop hero, and the
 * angled-corner card treatment. The form state and submit logic (POST /api/contact)
 * are unchanged; only the presentation now follows the rest of the new site.
 */

const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const BODY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

const CONTACT_CSS = `
.cbl-contact { background:#0A0A0A; color:#fff; font-family:${BODY}; -webkit-font-smoothing:antialiased; }
.cbl-contact *,.cbl-contact *::before,.cbl-contact *::after { box-sizing:border-box; }
.cbl-contact button { font-family:inherit; cursor:pointer; }

@keyframes cbl-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.45;transform:scale(.85);} }

/* ── Hero band ── */
.cbl-contact .hero {
  position:relative; overflow:hidden;
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.55) 45%, rgba(10,10,10,.92) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:22px 48px 16px;
}
.cbl-contact .hero-inner { max-width:1280px; margin:0 auto; position:relative; z-index:2; }
.cbl-contact .hero-streams { position:absolute; inset:0; z-index:1; pointer-events:none; }
.cbl-contact .eyebrow {
  display:inline-flex; align-items:center; gap:10px;
  font-family:${MONO}; font-size:12px; letter-spacing:.14em;
  color:#fff; font-weight:700; text-transform:lowercase; margin-bottom:10px;
}
.cbl-contact .eyebrow::before {
  content:''; width:8px; height:8px; border-radius:50%;
  background:#C99742; animation:cbl-pulse 2.4s ease-in-out infinite;
}
.cbl-contact h1.hero-title {
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(56px,7.4vw,108px);
  line-height:.9; letter-spacing:-.02em; text-transform:uppercase;
  display:flex; align-items:center; gap:28px; flex-wrap:nowrap; margin:0;
}
.cbl-contact h1.hero-title .title-stack { display:flex; flex-direction:column; gap:2px; align-items:flex-start; }
.cbl-contact h1.hero-title .h1-main { color:#fff; white-space:nowrap; }
.cbl-contact .hero-subtitle {
  display:flex; align-items:baseline; gap:14px; flex-wrap:wrap;
  font-family:${DISPLAY}; font-weight:900; font-size:clamp(28px,3vw,44px);
  text-transform:uppercase; letter-spacing:-.005em; line-height:1; color:#C99742;
}
.cbl-contact .hero-subtitle .it {
  font-family:${ITALIC}; font-style:italic; font-weight:600;
  color:#C99742; text-transform:none; letter-spacing:0; font-size:.82em;
}
.cbl-contact .hero p.lede { margin-top:14px; max-width:620px; font-size:16px; line-height:1.45; color:#B8B8B8; }

/* ── Section frame ── */
.cbl-contact section.band { padding:28px 48px 44px; }
.cbl-contact .band-inner { max-width:1280px; margin:0 auto; }

/* ── Form card (left-aligned under the header, two-column) ── */
.cbl-contact .form-card {
  background:#141414; border:1px solid rgba(255,255,255,.08);
  border-radius:22px 0 22px 0; padding:28px 32px; max-width:960px;
}
.cbl-contact form { display:grid; grid-template-columns:1fr 1fr; gap:16px 28px; align-items:stretch; }
.cbl-contact .fields-col { display:flex; flex-direction:column; gap:14px; }
.cbl-contact .field { display:flex; flex-direction:column; gap:6px; }
.cbl-contact .message-field { display:flex; flex-direction:column; gap:6px; }
.cbl-contact .message-field textarea { flex:1; min-height:200px; }
.cbl-contact .form-footer {
  grid-column:1 / -1;
  display:flex; align-items:center; justify-content:space-between;
  gap:24px; flex-wrap:wrap;
  border-top:1px solid rgba(255,255,255,.08); padding-top:18px;
}
.cbl-contact label {
  font-family:${MONO}; font-size:11px; letter-spacing:.14em;
  text-transform:uppercase; color:#B8B8B8;
}
.cbl-contact label .req { color:#C99742; }
.cbl-contact input, .cbl-contact select, .cbl-contact textarea {
  width:100%; background:#0A0A0A; border:1px solid rgba(255,255,255,.12);
  border-radius:12px; padding:13px 14px; color:#fff;
  font-family:${BODY}; font-size:15px; outline:0; transition:border-color .2s;
}
.cbl-contact input::placeholder, .cbl-contact textarea::placeholder { color:#555; }
.cbl-contact input:focus, .cbl-contact select:focus, .cbl-contact textarea:focus { border-color:#C99742; }
.cbl-contact select { appearance:none; cursor:pointer; }
.cbl-contact textarea { resize:none; line-height:1.5; }
.cbl-contact .terms { display:flex; align-items:flex-start; gap:12px; flex:1; min-width:240px; }
.cbl-contact .terms input { width:18px; height:18px; flex-shrink:0; margin-top:2px; accent-color:#C99742; padding:0; }
.cbl-contact .terms label { text-transform:none; letter-spacing:0; font-family:${BODY}; font-size:13px; color:#B0B0B0; }
.cbl-contact .terms a { color:#C99742; text-decoration:underline; }
.cbl-contact .submit {
  background:#C99742; color:#000; border:0;
  padding:14px 44px; border-radius:999px; white-space:nowrap;
  font-family:${DISPLAY}; font-weight:900;
  font-size:15px; letter-spacing:.14em; text-transform:uppercase; transition:background .2s;
}
.cbl-contact .submit:hover:not(:disabled) { background:#DDB15F; }
.cbl-contact .submit:disabled { background:#555; cursor:not-allowed; }
.cbl-contact .alert { grid-column:1 / -1; padding:14px 16px; border-radius:12px; text-align:center; font-weight:600; font-size:14px; }
.cbl-contact .alert.ok { background:rgba(77,191,102,.12); border:1px solid rgba(77,191,102,.5); color:#7FD68F; }
.cbl-contact .alert.err { background:rgba(229,76,76,.12); border:1px solid rgba(229,76,76,.5); color:#F08A8A; }
.cbl-contact .note { grid-column:1 / -1; text-align:left; font-family:${MONO}; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#8a8a8a; }

@media (max-width:900px){
  .cbl-contact .hero { padding:22px 24px 16px; }
  .cbl-contact section.band { padding:28px 24px 44px; }
  .cbl-contact .form-card { padding:24px 22px; max-width:none; }
  .cbl-contact form { grid-template-columns:1fr; }
  .cbl-contact .message-field textarea { min-height:140px; }
  .cbl-contact .form-footer { flex-direction:column; align-items:stretch; }
  .cbl-contact .submit { width:100%; }
}
`;

export function Contact() {
  const [formData, setFormData] = useState({
    topic: '',
    fullName: '',
    email: '',
    phone: '',
    message: '',
    agreedToTerms: false,
    website: '', // honeypot — hidden from real users, bots fill it in
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('success');
        setFormData({
          topic: '',
          fullName: '',
          email: '',
          phone: '',
          message: '',
          agreedToTerms: false,
          website: '',
        });
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to send message.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error. Please try again later.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <main className="cbl-contact">
      <style>{CONTACT_CSS}</style>

      <section className="hero cbl-light-streams">
        {/* first child = dedicated streak layer (hosts 2 of the 4 light streams), under the copy */}
        <div className="hero-streams" aria-hidden="true" />
        <div className="hero-inner">
          <div className="eyebrow">support · we're here to help</div>
          <h1 className="hero-title">
            <span className="title-stack">
              <span className="h1-main">Contact</span>
              <span className="hero-subtitle">
                <span>Got a question?</span>
                <span className="it">Let's talk.</span>
              </span>
            </span>
          </h1>
          <p className="lede">
            Submit your question or issue below and our team will get back to you. Whether you're a
            rider, driver, or potential partner — we're here to help.
          </p>
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
                  <label htmlFor="topic">
                    What can we help you with? <span className="req">*</span>
                  </label>
                  <select id="topic" name="topic" value={formData.topic} onChange={handleChange} required>
                    <option value="" disabled>
                      Select a topic
                    </option>
                    <option value="general">General Inquiry</option>
                    <option value="rider">Rider Support</option>
                    <option value="driver">Driver Support</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="bug">Bug Report</option>
                  </select>
                </div>

                <div className="field">
                  <label htmlFor="fullName">
                    Full Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="field">
                  <label htmlFor="email">
                    Email <span className="req">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your.email@example.com"
                  />
                </div>

                <div className="field">
                  <label htmlFor="phone">Phone Number (optional)</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="field message-field">
                <label htmlFor="message">
                  How can we help? <span className="req">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Please describe your issue or question..."
                />
              </div>

              <div className="form-footer">
                <div className="terms">
                  <input
                    type="checkbox"
                    id="agreedToTerms"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleChange}
                    required
                  />
                  <label htmlFor="agreedToTerms">
                    I agree to the{' '}
                    <a href="/terms" target="_blank">
                      Terms and Conditions
                    </a>{' '}
                    <span className="req">*</span>
                  </label>
                </div>

                <button type="submit" className="submit" disabled={status === 'loading'}>
                  {status === 'loading' ? 'Sending…' : 'Submit →'}
                </button>
              </div>

              {status === 'success' && (
                <div className="alert ok">
                  Your message has been sent! We have emailed you a confirmation.
                </div>
              )}

              {status === 'error' && <div className="alert err">{errorMessage}</div>}

              <p className="note">We typically respond within 24 hours</p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
