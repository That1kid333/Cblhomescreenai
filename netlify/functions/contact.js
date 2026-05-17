import { Resend } from 'resend';

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const data = JSON.parse(event.body);

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

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('Resend error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: error.message || 'Error sending email' })
    };
  }
};
