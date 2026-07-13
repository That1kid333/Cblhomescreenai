import { createClient } from '@supabase/supabase-js';
import { screenListing } from '../moderation';

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
  state?: string;
};

export async function postDirectoryListing(
  input: PostListingInput,
): Promise<{ error: string | null }> {
  const {
    data: { session },
  } = await authClient.auth.getSession();
  if (!session?.user) return { error: 'Please sign in to post.' };

  // Auto-screen for solicitation / adult / hateful content BEFORE saving — no
  // approval queue, no manual moderation. Blocked posts never reach the table.
  const screen = screenListing(input.title, input.description);
  if (!screen.ok) return { error: screen.reason };

  const { error } = await authClient.from('directory_listings').insert({
    user_id: session.user.id, // MUST equal auth.uid() for the RLS WITH CHECK
    title: input.title,
    category: input.category,
    description: input.description ?? null,
    price_type: input.priceType ?? 'fixed',
    price: input.priceType === 'free' ? null : (input.price ?? null),
    // city/state have DB defaults ('Atlanta' / 'GA') — only send when provided
    // so an unset field falls back to its default instead of a null override.
    ...(input.city !== undefined ? { city: input.city } : {}),
    ...(input.state !== undefined ? { state: input.state } : {}),
    posted_by_email: session.user.email ?? null,
    posted_by_name: (session.user.user_metadata?.name as string) ?? null,
    source: 'citybucketlist',
  });

  return { error: error?.message ?? null };
}
