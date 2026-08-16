/**
 * First-party affiliate click log.
 *
 * WHY: the networks are currently the only record of a click, they report 1-2
 * business days late, and a zero in their dashboard is indistinguishable from
 * broken tracking. (Exactly the question raised when Phil test-clicked the
 * flight links and there was nothing to check against.) `placement` is the SAME
 * string we send as pubref / subId1 / sub_id, so these rows reconcile 1:1 with
 * whatever the networks eventually report.
 *
 * WHAT IT IS NOT: analytics. It records no user id, no IP, no user agent, no
 * session, no referrer — four fields: network, placement, page, timestamp. There
 * is deliberately nothing here that identifies a person, which is why it needs no
 * cookie banner and why a full dump of the table would tell an attacker only how
 * many people clicked a hotel card.
 *
 * It also adds NO third-party script and NO CSP change — it reuses the Supabase
 * client already on the page, so `script-src 'self'` stays intact. That matters
 * more than usual here: the shared-cookie SSO will put a readable session cookie
 * on this domain, and every extra script on the page would be able to read it.
 */
import { ridesClient } from './supabase/ridesClient';

export type ClickNetwork = 'expedia' | 'ticketmaster' | 'travelpayouts' | 'awin';

/**
 * Record an outbound affiliate click. FIRE AND FORGET — never awaited, never
 * throws, never blocks the navigation. If logging fails the member still gets
 * their link; a broken analytics call must never cost a booking.
 */
export function logAffiliateClick(network: ClickNetwork, placement: string, page?: string): void {
  try {
    const row = {
      network,
      placement: String(placement || '').slice(0, 80),
      page: (page ?? (typeof window !== 'undefined' ? window.location.pathname : '')).slice(0, 120),
    };
    if (!row.placement) return;
    void ridesClient.from('affiliate_clicks').insert(row).then(
      () => {},
      () => {}, // swallow: a failed log is not the visitor's problem
    );
  } catch {
    /* never let logging break an outbound link */
  }
}
