/**
 * Google Analytics 4 for the marketing site (citybucketlist.com only).
 *
 * The measurement ID defaults to the CityBucketList.com web stream so a
 * deploy tracks visits without a Netlify setting. Set VITE_GA_MEASUREMENT_ID
 * to send a build to a different stream. A blank value keeps the default.
 *
 * Page views, plus the sign-up events below. The app (app.citybucketlist.com)
 * is a separate site and is not tagged here, so driver and partner sign-ups
 * that finish inside the app are not counted by this file.
 */

/** CityBucketList.com web stream. */
export const DEFAULT_GA_MEASUREMENT_ID = 'G-0L2B3437BE';

const MEASUREMENT_ID = /^G-[A-Z0-9]+$/;

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

export function gaMeasurementId(): string {
  const fromEnv = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    const id = fromEnv.trim();
    if (MEASUREMENT_ID.test(id)) return id;
    console.warn('[analytics] VITE_GA_MEASUREMENT_ID must look like G-XXXX. Using the default stream.');
  }
  return DEFAULT_GA_MEASUREMENT_ID;
}

let started = false;

/** Install gtag and load the GA4 library once. Safe to call more than once. */
export function initAnalytics(): void {
  if (started || typeof document === 'undefined') return;
  const id = gaMeasurementId();
  started = true;
  window.dataLayer = window.dataLayer || [];
  // gtag.js reads the `arguments` object off the queue, so this has to be a
  // classic function using `arguments`, not a rest-args array.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  // The route tracker sends page_view itself, including the first load,
  // so the automatic hit would double-count.
  window.gtag('config', id, { send_page_view: false });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

export function trackPageView(pagePath: string): void {
  if (typeof window === 'undefined') return;
  initAnalytics();
  window.gtag?.('event', 'page_view', {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  });
}

/**
 * Sign-up events (SEO audit, Nov 2026). Mark these as key events in GA4
 * (Admin > Events) so they count as conversions:
 *
 *   sign_up              a member account was created on this site
 *                        (member_type: rider; source: which form)
 *   generate_lead        a partner application was sent
 *                        (member_type: concierge_partner)
 *   login                a member signed in on this site
 *
 * Only fired after the form actually succeeds, never on a click, and never
 * with anything the person typed: no names, emails or phone numbers go to
 * Google from here.
 */
export type SignupEvent = 'sign_up' | 'generate_lead' | 'login';

export function trackEvent(name: SignupEvent, params: Record<string, string> = {}): void {
  if (typeof window === 'undefined') return;
  try {
    initAnalytics();
    window.gtag?.('event', name, params);
  } catch {
    /* analytics must never break a form */
  }
}
