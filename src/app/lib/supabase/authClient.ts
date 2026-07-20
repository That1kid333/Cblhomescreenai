import { createClient } from '@supabase/supabase-js';
import { screenListing } from '../moderation';
import { forwardGeocode } from '../location';

// Member sign-in against the main app's Supabase (CBL-Rides) — the SAME
// accounts as app.citybucketlist.com. Unlike ridesClient/directoryClient
// (read-only, persistSession:false), this client keeps a session so the site
// can greet returning members. A distinct storageKey avoids colliding with
// any other GoTrue instance on this origin. Access is governed by RLS.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jgbaqzgkdqqvxmqytgsx.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'sb_publishable_ftx_EkI4-nj0vfUqbP0FzQ_XRGsXZJ9';

export const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'cbl-site-auth',
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// ── Directory classifieds: member-authored posts ────────────────────────────
// Members post a classified into CBL-Rides `directory_listings` through their
// OWN authenticated session (no bridge, no service-role). RLS INSERT policy is
// authenticated-only with WITH CHECK (auth.uid() = user_id), so we MUST stamp
// user_id with the signed-in member's id — which we read from the REAL session
// here (authClient.auth.getSession()), never from useAuth()'s state (that can
// be a fake demo session on preview with no real auth.uid()).

export type PostListingInput = {
  title: string;
  category: string;
  description?: string;
  price?: number | null;
  priceType?: 'fixed' | 'free';
  city?: string;
  state?: string | null;
  driverAd?: Record<string, unknown> | null; // driver business-card fields (driver_post only)
};

// Active-driver profile for prefilling / gating the driver-ad builder. Returns
// isActiveDriver=false for non-drivers or lapsed subscriptions.
export type MyDriverProfile = {
  isActiveDriver: boolean;
  referralCode: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  photo: string | null;
  vehicleYear: string | null;
  vehicleInfo: string | null; // make/model, e.g. "Santa Fe"
};

// ── Real member sign-up (mirrors the app's own rider signup flow exactly —
// citybucketlist.com's src/components/home/MembershipForm.tsx) ─────────────
// This creates the SAME kind of account as app.citybucketlist.com: a real
// Supabase Auth user (with password) plus its `riders` row, so the member can
// sign into the app, the directory, and everywhere else with that password —
// not just a lead-capture record. Uses `authClient` (this site's persisted
// session) so the visitor is also immediately signed in here.
export type MemberSignUpInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
  smsOptIn: boolean;
};

const ALREADY_SIGNED_IN_ERROR =
  'That email already has an account. Enter your password to sign in, or use "Forgot password" in the app.';

export async function signUpMember(input: MemberSignUpInput): Promise<{ error: string | null }> {
  const email = input.email.trim();

  // Matches the app's own MembershipForm: a returning email signs in instead
  // of erroring, rather than trying (and failing) to re-create the account.
  const { data: existingRider } = await authClient
    .from('riders')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();
  if (existingRider) {
    const { error } = await authClient.auth.signInWithPassword({ email, password: input.password });
    return { error: error ? ALREADY_SIGNED_IN_ERROR : null };
  }

  const { data: authData, error: authError } = await authClient.auth.signUp({
    email,
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/`,
      data: { name: input.name, phone: input.phone },
    },
  });

  if (authError) {
    if (authError.message.toLowerCase().includes('already registered')) {
      const { error } = await authClient.auth.signInWithPassword({ email, password: input.password });
      return { error: error ? ALREADY_SIGNED_IN_ERROR : null };
    }
    return { error: authError.message };
  }

  const userId = authData.user?.id;
  if (!userId) return { error: 'Something went wrong creating your account. Please try again.' };

  // Auth user exists and is signed in (no email-confirmation gate on this
  // project) — now create their `riders` profile row, same shape the app's
  // own signup writes (RLS: auth.uid() = id, satisfied by the session above).
  const { error: riderError } = await authClient.from('riders').insert({
    id: userId,
    name: input.name,
    email,
    phone: input.phone,
    sms_opt_in: input.smsOptIn,
    sms_consent_timestamp: input.smsOptIn ? new Date().toISOString() : null,
  });
  if (riderError) return { error: riderError.message };

  // Fire-and-forget welcome email — the SAME edge function the app's own
  // signup invokes (supabase/functions/send-rider-welcome in the app repo).
  // Best-effort: a delivery failure here shouldn't block the account existing.
  void authClient.functions.invoke('send-rider-welcome', { body: { riderId: userId } }).catch(() => {});

  return { error: null };
}

export async function getMyDriverProfile(): Promise<MyDriverProfile | null> {
  const {
    data: { session },
  } = await authClient.auth.getSession();
  if (!session?.user) return null;
  const { data: drv } = await authClient
    .from('drivers')
    .select('referral_code, name, phone, email, photo, vehicle, vehicle_year, subscription_status, subscription_end, manual_subscription_override')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();
  if (!drv) return { isActiveDriver: false, referralCode: null, name: null, phone: null, email: null, photo: null, vehicleYear: null, vehicleInfo: null };
  const status = String(drv.subscription_status ?? '');
  const notExpired = !drv.subscription_end || new Date(drv.subscription_end as string) > new Date();
  const isActiveDriver = !!drv.manual_subscription_override || (['active', 'trial', 'canceled_grace_period'].includes(status) && notExpired);
  // vehicle is a jsonb like { info: "Santa Fe" }.
  const veh = drv.vehicle as { info?: string } | null;
  return {
    isActiveDriver,
    referralCode: (drv.referral_code as string) ?? null,
    name: (drv.name as string) ?? null,
    phone: (drv.phone as string) ?? null,
    email: (drv.email as string) ?? null,
    photo: (drv.photo as string) ?? null,
    vehicleYear: (drv.vehicle_year as string) ?? null,
    vehicleInfo: (veh?.info as string) ?? null,
  };
}

export async function postDirectoryListing(
  input: PostListingInput,
): Promise<{ error: string | null; id: string | null }> {
  const {
    data: { session },
  } = await authClient.auth.getSession();
  if (!session?.user) return { error: 'Please sign in to post.', id: null };

  // Auto-screen for solicitation / adult / hateful content BEFORE saving — no
  // approval queue, no manual moderation. Blocked posts never reach the table.
  const screen = screenListing(input.title, input.description);
  if (!screen.ok) return { error: screen.reason, id: null };

  // If an active $19.99 driver is posting a driver-availability post, stamp their
  // referral code so a "Verified CBL Driver" QR business card can ride along on the
  // public post. Read from their OWN driver row (RLS self-read); null otherwise.
  let driverCode: string | null = null;
  if (input.category === 'driver_post') {
    const { data: drv } = await authClient
      .from('drivers')
      .select('referral_code, subscription_status, subscription_end, manual_subscription_override')
      .eq('auth_user_id', session.user.id)
      .maybeSingle();
    if (drv) {
      const status = String(drv.subscription_status ?? '');
      const notExpired = !drv.subscription_end || new Date(drv.subscription_end as string) > new Date();
      // 'canceled_grace_period' still has PAID access until the period ends.
      const active = !!drv.manual_subscription_override || (['active', 'trial', 'canceled_grace_period'].includes(status) && notExpired);
      if (active) driverCode = (drv.referral_code as string | null) ?? null;
    }
  }

  // Geocode the post's city so it can be matched by proximity (a "North Hills"
  // search should surface a "Pittsburgh" listing ~11mi away). Best-effort and
  // keyless — falls back to null coords, which just means name-only matching.
  let lat: number | null = null;
  let lng: number | null = null;
  if (input.city) {
    const geo = await forwardGeocode(input.state ? `${input.city}, ${input.state}` : input.city);
    if (geo) { lat = geo.lat; lng = geo.lng; }
  }

  // Return the new row's id so the caller can immediately offer to BOOST it.
  const { data, error } = await authClient
    .from('directory_listings')
    .insert({
      user_id: session.user.id, // MUST equal auth.uid() for the RLS WITH CHECK
      title: input.title,
      category: input.category,
      description: input.description ?? null,
      price_type: input.priceType ?? 'fixed',
      price: input.priceType === 'free' ? null : (input.price ?? null),
      driver_referral_code: driverCode,
      // Driver business-card fields — only meaningful on active-driver posts.
      driver_ad: input.category === 'driver_post' && driverCode ? (input.driverAd ?? null) : null,
      // city/state have DB defaults ('Atlanta' / 'GA') — only send when provided
      // so an unset field falls back to its default instead of a null override.
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(lat != null ? { latitude: lat, longitude: lng } : {}),
      posted_by_email: session.user.email ?? null,
      posted_by_name: (session.user.user_metadata?.name as string) ?? null,
      source: 'citybucketlist',
    })
    .select('id')
    .single();

  return { error: error?.message ?? null, id: data?.id != null ? String(data.id) : null };
}
