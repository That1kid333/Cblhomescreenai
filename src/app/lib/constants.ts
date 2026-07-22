// The rider/driver app — booking, sign-up, and account flows all live here.
// CONVENTION: any <a> pointing at one of the external targets in this file
// (APP_URL, RIDER_BOOK_URL, DRIVER_SIGNUP_URL, DIRECTORY_APP_URL) must set
// target="_blank" rel="noopener noreferrer" — it keeps the marketing site open
// behind the app (retention) and prevents reverse-tabnabbing.
export const APP_URL = 'https://app.citybucketlist.com';

// Direct driver-signup form in the app (Justin's `/driver/signup` route). Use this
// for "Become a Driver" acquisition CTAs so prospects land on the signup form, not
// the app's general home. (There's no single URL that shows the dashboard when
// logged-in AND signup when logged-out — the protected dashboard sends logged-out
// users to /driver/login, not signup — so acquisition CTAs point straight at signup.)
export const DRIVER_SIGNUP_URL = `${APP_URL}/driver/signup`;

// Rider booking entry in the app (Justin's `/rider/login` route). Unlike the driver
// side, this one URL does it all: it auto-redirects an already-logged-in rider
// straight to /rider/dashboard, shows the login form for returning riders, and has a
// "Don't have an account? Sign up" link for new ones — i.e. "dashboard if logged-in,
// sign-in/up if logged-out." Use for "Book a Ride" CTAs.
export const RIDER_BOOK_URL = `${APP_URL}/rider/login`;

// Justin's standalone classifieds/business directory app — posting, featured
// upgrades, and sign-in already work there; the marketing site only renders
// a read-only preview of the same data (see lib/supabase/directoryClient.ts).
export const DIRECTORY_APP_URL = 'https://directory.citybucketlist.com/';

// Restaurant-partner Stripe Checkout (Supabase edge function in the main-app
// project). POST { plan: 'bronze'|'silver'|'gold' } → { url, mode }; redirect
// to url. Test mode until app_settings.stripe_live_payments_enabled = "true".
export const PARTNER_CHECKOUT_URL =
  'https://jgbaqzgkdqqvxmqytgsx.supabase.co/functions/v1/create-partner-checkout';

// Member payout onboarding (Stripe Connect Express) — how a member turns on
// cash payouts for referral commissions. Call with the member's access token
// as the Authorization bearer (apikey = anon key for the gateway).
export const MEMBER_CONNECT_ONBOARD_URL =
  'https://jgbaqzgkdqqvxmqytgsx.supabase.co/functions/v1/create-member-connect-account';
export const MEMBER_CONNECT_STATUS_URL =
  'https://jgbaqzgkdqqvxmqytgsx.supabase.co/functions/v1/check-member-connect-status';

// Anon key for the main-app Supabase project (public by design; RLS governs access —
// same key already shipped in ridesClient.ts). Used only to pass the functions gateway.
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'sb_publishable_ftx_EkI4-nj0vfUqbP0FzQ_XRGsXZJ9';
