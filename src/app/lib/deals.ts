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
  if (!input.partner.trim() || !input.title.trim() || !input.destUrl.trim()) {
    return { error: 'Please add at least the brand, the deal, and the link.' };
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
