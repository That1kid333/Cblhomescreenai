import { createClient } from '@supabase/supabase-js';

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
