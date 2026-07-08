// The rider/driver app — booking, sign-up, and account flows all live here.
export const APP_URL = 'https://app.citybucketlist.com';

// Justin's standalone classifieds/business directory app — posting, featured
// upgrades, and sign-in already work there; the marketing site only renders
// a read-only preview of the same data (see lib/supabase/directoryClient.ts).
export const DIRECTORY_APP_URL = 'https://directory.citybucketlist.com/';

// Public teaser Buckee edge function (lives in the main-app Supabase project).
// Deployed by Justin per BUCKEE_HOMESCREEN_HANDOFF.md §3; override once it's live.
export const BUCKEE_PUBLIC_URL =
  import.meta.env.VITE_BUCKEE_PUBLIC_URL ||
  'https://jgbaqzgkdqqvxmqytgsx.supabase.co/functions/v1/buckee-public';

// Restaurant-partner Stripe Checkout (Supabase edge function in the main-app
// project). POST { plan: 'bronze'|'silver'|'gold' } → { url, mode }; redirect
// to url. Test mode until app_settings.stripe_live_payments_enabled = "true".
export const PARTNER_CHECKOUT_URL =
  'https://jgbaqzgkdqqvxmqytgsx.supabase.co/functions/v1/create-partner-checkout';

// Anon key for the main-app Supabase project (public by design; RLS governs access —
// same key already shipped in ridesClient.ts). Used only to pass the functions gateway.
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYmFxemdrZHFxdnhtcXl0Z3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExODg5NzksImV4cCI6MjA0Njc2NDk3OX0.XpmQLQy2Mm2vgWg6UourHAapIee3JfuS1Ncz5mt8610';
