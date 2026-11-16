/**
 * FAQ questions and answers: ONE copy, read by two things.
 *
 *  - src/app/pages/FAQ.tsx draws them on /faq.
 *  - netlify/edge-functions/prerender.ts writes them into /faq's HTML as FAQPage
 *    structured data, which is how Google and AI answer engines learn that the
 *    page answers these questions (SEO audit, Nov 2026).
 *
 * Google only honors FAQ markup that matches what is on the page, which is why
 * this lives in one file instead of two. Plain data only: the edge function runs
 * in Deno and cannot load anything React or Vite specific from here.
 *
 * Wording rules (Brian reviews changes): City Bucket List is a private
 * membership platform, drivers are independent drivers, and nothing here may
 * describe CBL as a transportation provider or a rideshare company.
 */

export const FAQ_DATA: { question: string; answer: string }[] = [
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
    question: 'Where do I manage or edit my directory listings?',
    answer: 'Everything you post lives in CBL Studio — your member hub. Open it from your profile avatar (top-right) or the "Manage my posts" link on the Directory. There you can edit any listing’s title, price, and photos, pause or delete it, boost it to Featured, and share your digital business card, all in one place. Active Private Membership drivers also get a "Verified Independent Driver" QR card that rides along on their driver posts so riders can connect in the app.',
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
    // Approved wording, Keith + Brian, Oct 5 2026. Deliberately no "negotiable" and no
    // Uber or Lyft; the same line sits on the app's Book a Ride confirmation.
    question: 'How much does a ride cost?',
    answer: 'It depends on your driver. Every independent driver on CBL sets their own rates, so prices vary. Some keep rates low, others charge more for the service they offer. Agree on the price with your driver before you ride.',
  },
  {
    question: 'Does City Bucket List take a percentage of rides?',
    // The fee rule changed on Aug 17 2026 (flat 4.6% + $0.50, fare only, never the tip) and
    // again on Nov 11 2026 (margin-targeted, tip included, since the flat rate lost money on
    // generously-tipped rides). The round-up wording here predates both.
    answer: 'Yes, for card payments only. A transparent platform and processing fee is added to the fare, covering the real cost of processing your payment (including any tip), and shown in full before you book. In-person payments have no fee. 100% of the fare goes directly to your driver; the fee supports the platform, not the driver\'s earnings.',
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
