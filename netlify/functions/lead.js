import { Resend } from 'resend';

/**
 * Quick-join lead capture — the no-password path behind the homepage
 * "Join Now — Free" modal and the /login membership form.
 *
 * Deliberately stricter than contact.js: JSON is parsed defensively, fields
 * are validated server-side, and a hidden honeypot field silently drops bots.
 * The lead confirmation email is sent best-effort so a bouncing address can
 * never lose a captured lead.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APP_URL = 'https://app.citybucketlist.com';

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  let data;
  try {
    data = JSON.parse(event.body || '');
  } catch {
    return json(400, { error: 'Invalid request' });
  }

  // Honeypot: real users never see this field. Pretend success so bots move on.
  if (typeof data.company === 'string' && data.company.trim() !== '') {
    return json(200, { success: true });
  }

  const firstName = String(data.firstName || '').trim().slice(0, 100);
  const email = String(data.email || '').trim().slice(0, 200);
  const phone = String(data.phone || '').trim().slice(0, 30);
  const smsConsent = Boolean(phone && data.smsConsent);
  const source = String(data.source || 'unknown').trim().slice(0, 60);

  if (!firstName) {
    return json(400, { error: 'Please tell us your first name.' });
  }
  if (!EMAIL_RE.test(email)) {
    return json(400, { error: 'Please enter a valid email address.' });
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // 1. Notification to the team — this is the lead; it must succeed.
    await resend.emails.send({
      from: 'City Bucket List <info@citybucketlist.com>',
      to: ['info@citybucketlist.com'],
      subject: `New quick join lead: ${firstName}`,
      text: [
        `Name: ${firstName}`,
        `Email: ${email}`,
        `Cell: ${phone || 'not provided'}`,
        `SMS consent: ${smsConsent ? 'yes' : 'no'}`,
        `Source: ${source}`,
        `Submitted: ${new Date().toISOString()}`,
      ].join('\n'),
    });

    // 2. Automated welcome email to the lead — sells the full (password)
    //    membership: app access, sharing, and earning by referring restaurants
    //    and drivers. Best effort; never fail the capture.
    const benefit = (title, body) => `
        <tr>
          <td style="padding:0 0 14px;">
            <p style="margin:0;font-size:14px;line-height:1.5;color:#B8B8B8;">
              <span style="color:#C99742;font-weight:bold;">&#8213;</span>&nbsp;
              <span style="color:#FFFFFF;font-weight:bold;text-transform:uppercase;font-size:13px;letter-spacing:.04em;">${title}</span><br>
              <span style="display:inline-block;padding-left:22px;">${body}</span>
            </p>
          </td>
        </tr>`;

    try {
      await resend.emails.send({
        from: 'City Bucket List <info@citybucketlist.com>',
        to: [email],
        subject: "You're on the list — here's everything City Bucket List unlocks",
        html: `
<div style="background:#0A0A0A;padding:32px 16px;">
  <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="max-width:520px;width:100%;background:#141414;border:1px solid rgba(201,151,66,.45);border-radius:18px;">
    <tr>
      <td style="padding:34px 32px;font-family:Helvetica,Arial,sans-serif;">
        <p style="margin:0 0 6px;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#C99742;font-family:Menlo,Consolas,monospace;">you're on the list</p>
        <h1 style="margin:0 0 14px;font-size:26px;line-height:1.05;text-transform:uppercase;color:#FFFFFF;">Welcome, ${firstName}.</h1>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.55;color:#B8B8B8;">
          You're in — we'll keep you posted on the best of the city from
          <span style="color:#C99742;font-weight:bold;">City Bucket List</span>.
          And when you're ready for the full experience, your free
          password-protected account unlocks all of this:
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
          ${benefit('Your own driver', 'Schedule rides and message your preferred driver — a private driver you know and trust, not a stranger on demand.')}
          ${benefit('Buckee, your AI concierge', 'Personalized itineraries and local insider tips, any city, on demand.')}
          ${benefit('Full site access', 'The complete CBL blog and member directory — local eats, attractions, stays, and member-only savings.')}
          ${benefit('Share with friends', 'Your personal QR invite code brings friends and family into your circle — everyone saves.')}
          ${benefit('Earn with CBL', 'Get rewarded for growing the network: sign up your favorite restaurants and local spots, refer riders, or bring drivers on board.')}
        </table>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:10px 0 0;">
          <tr>
            <td style="background:#C99742;border-radius:999px;">
              <a href="${APP_URL}" style="display:inline-block;padding:13px 30px;font-size:13px;font-weight:bold;letter-spacing:.12em;text-transform:uppercase;color:#000000;text-decoration:none;">Create your free account</a>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#8a8a8a;">
          100% free to join &middot; no credit card &middot; ${APP_URL.replace('https://', '')}
        </p>
        <p style="margin:26px 0 0;font-size:11px;line-height:1.5;color:#6f6f6f;">
          City Bucket List &middot; citybucketlist.com &middot; A Private Membership Association
        </p>
      </td>
    </tr>
  </table>
</div>`,
        text: [
          `Hi ${firstName},`,
          '',
          "You're in — we'll keep you posted on the best of the city from City Bucket List.",
          '',
          'When you\'re ready for the full experience, your free password-protected account unlocks all of this:',
          '',
          '— YOUR OWN DRIVER: schedule rides and message your preferred driver — a private driver you know and trust.',
          '— BUCKEE, YOUR AI CONCIERGE: personalized itineraries and local insider tips, any city, on demand.',
          '— FULL SITE ACCESS: the complete CBL blog and member directory — local eats, attractions, stays, and member-only savings.',
          '— SHARE WITH FRIENDS: your personal QR invite code brings friends and family into your circle — everyone saves.',
          '— EARN WITH CBL: get rewarded for growing the network — sign up your favorite restaurants and local spots, refer riders, or bring drivers on board.',
          '',
          `Create your free account: ${APP_URL}`,
          '',
          '100% free to join · no credit card',
          'City Bucket List · citybucketlist.com · A Private Membership Association',
        ].join('\n'),
      });
    } catch (confirmError) {
      console.error('Lead welcome email failed (lead still captured):', confirmError);
    }

    return json(200, { success: true });
  } catch (error) {
    console.error('Resend error:', error);
    return json(500, { error: 'Error saving your info. Please try again.' });
  }
};
