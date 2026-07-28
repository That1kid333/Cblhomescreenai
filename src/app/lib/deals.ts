import { ridesClient } from './supabase/ridesClient';

/**
 * Public "Submit a Travel Deal" — an affiliate/partner proposes an offer for the
 * Directory Coupons section. Lands in `deal_submissions` (anon insert, admin-only
 * read, RLS-gated) for review. Nothing publishes automatically: we approve and add
 * it to TRAVEL_DEALS with CBL's tracked link, so every published deal earns for us.
 */
const nn = (s?: string): string | null => {
  const t = (s ?? '').trim();
  return t ? t : null;
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only the affiliate partners we're actually signed up with can be submitted. This
// scopes the form to real partners (deals must route through our tracking anyway)
// AND limits abuse — a spammer can't promote a random brand. Enforced BOTH here and
// by a DB check constraint on `deal_submissions.partner`, so a direct POST can't skip it.
export const AFFILIATE_PARTNERS = [
  'Go City', 'Turbopass', 'Tiqets', 'Klook', 'WeGoTrip', 'USA Guided Tours', 'TicketNetwork', 'BikesBooking',
] as const;

export type DealSubmission = {
  partner: string;
  title: string;
  discount: string;
  discountLabel: string;
  terms: string;
  code: string;
  destUrl: string;
  city: string;
  expires: string; // YYYY-MM-DD or ''
  contactName: string;
  contactEmail: string;
  notes: string;
  website?: string; // honeypot — real users leave it blank
};

export async function submitDeal(input: DealSubmission): Promise<{ error: string | null }> {
  if (input.website && input.website.trim()) return { error: null }; // bot — pretend success
  if (!(AFFILIATE_PARTNERS as readonly string[]).includes(input.partner.trim())) {
    return { error: 'Please choose one of our partner brands from the list.' };
  }
  if (!input.title.trim() || !input.destUrl.trim()) {
    return { error: 'Please add the deal title and the booking link.' };
  }
  if (!EMAIL_RE.test(input.contactEmail.trim())) {
    return { error: 'Please enter a valid contact email so we can reach you.' };
  }
  const { error } = await ridesClient.from('deal_submissions').insert({
    partner: nn(input.partner),
    title: nn(input.title),
    discount: nn(input.discount),
    discount_label: nn(input.discountLabel),
    terms: nn(input.terms),
    code: nn(input.code),
    dest_url: nn(input.destUrl),
    city: nn(input.city),
    expires: nn(input.expires),
    contact_name: nn(input.contactName),
    contact_email: nn(input.contactEmail),
    notes: nn(input.notes),
  });
  if (error) {
    console.error('submitDeal', error.message);
    return { error: 'Could not send right now — please try again.' };
  }
  return { error: null };
}
