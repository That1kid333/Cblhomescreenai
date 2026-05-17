import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const data = req.body;

      // 1. Send notification to site owner
      await resend.emails.send({
        from: 'City Bucket List <info@citybucketlist.com>',
        to: ['info@citybucketlist.com'],
        subject: `New Contact Form Submission: ${data.topic}`,
        text: `Name: ${data.fullName}\nEmail: ${data.email}\nPhone: ${data.phone}\nMessage: ${data.message}`
      });

      // 2. Send confirmation to user
      await resend.emails.send({
        from: 'City Bucket List <info@citybucketlist.com>',
        to: [data.email],
        subject: 'We received your message!',
        text: `Hi ${data.fullName},\n\nThank you for contacting City Bucket List. We have received your message regarding "${data.topic}" and will get back to you within 24 hours.\n\nYour message:\n${data.message}`
      });

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Resend error:', error);
      res.status(500).json({ error: error.message || 'Error sending email' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
