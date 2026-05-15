import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

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

export function FAQ() {
  return (
    <main className="max-w-4xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
      {/* Page Title */}
      <h1 className="text-4xl lg:text-5xl font-bold leading-none mb-2 text-center">
        Frequently Asked Questions
      </h1>
      <p className="text-[#FDB913] text-center mb-12 font-semibold">
        Everything you need to know about City Bucket List
      </p>

      {/* FAQ Accordion */}
      <Accordion.Root type="single" collapsible className="space-y-4">
        {faqData.map((faq, index) => (
          <Accordion.Item
            key={index}
            value={`item-${index}`}
            className="rounded-[24px_0_24px_0] overflow-hidden bg-black transition-all"
          >
            <Accordion.Trigger className="w-full px-6 py-5 flex items-center justify-between text-left group">
              <span className="text-white font-semibold text-lg pr-4 group-hover:text-[#FDB913] transition-colors">
                {faq.question}
              </span>
              <ChevronDown
                className="w-5 h-5 text-[#FDB913] transition-transform duration-300 group-data-[state=open]:rotate-180 flex-shrink-0"
                aria-hidden
              />
            </Accordion.Trigger>
            <Accordion.Content className="overflow-hidden data-[state=closed]:animate-[accordion-up_200ms_ease-out] data-[state=open]:animate-[accordion-down_200ms_ease-out]">
              <div className="px-6 pb-5 pt-2 text-gray-300 leading-relaxed border-t border-[#FDB913]/30">
                {faq.answer}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </main>
  );
}
