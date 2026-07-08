/**
 * Referral attribution — how a member earns commission on a restaurant signup.
 *
 * A member's card gives them a link like
 *   https://citybucketlist.com/partner-restaurants?ref=k2408a
 * When a restaurant owner lands on the partner page via that link, we capture
 * and persist the code, then attach it to the Stripe checkout POST. The
 * create-partner-checkout edge fn stamps it onto the session metadata and
 * partner-checkout-webhook resolves the referrer + records the commission.
 *
 * Persisted to localStorage so it survives in-site navigation and the Stripe
 * redirect round-trip. Codes are short (e.g. k2408a); we only accept the same
 * safe charset the edge function validates against.
 */

const REF_KEY = 'cbl_referrer_code';
const VALID = /^[A-Za-z0-9_-]{2,64}$/;

/** Read ?ref= from the current URL, persist it if valid, and return the code
 *  in effect (freshly captured, or a previously stored one). */
export function captureRefFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = new URLSearchParams(window.location.search).get('ref');
    if (raw && VALID.test(raw)) {
      localStorage.setItem(REF_KEY, raw);
      return raw;
    }
  } catch {
    /* URL / storage unavailable — fall through to any stored value */
  }
  return getStoredRef();
}

/** The referral code we should attach to a checkout, or null if none. */
export function getStoredRef(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(REF_KEY);
    return v && VALID.test(v) ? v : null;
  } catch {
    return null;
  }
}
