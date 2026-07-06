import { createClient } from '@supabase/supabase-js';

// Member sign-in against the main app's Supabase (CBL-Rides) — the SAME
// accounts as app.citybucketlist.com. Unlike ridesClient/directoryClient
// (read-only, persistSession:false), this client keeps a session so the site
// can greet returning members. A distinct storageKey avoids colliding with
// any other GoTrue instance on this origin. Access is governed by RLS.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jgbaqzgkdqqvxmqytgsx.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYmFxemdrZHFxdnhtcXl0Z3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExODg5NzksImV4cCI6MjA0Njc2NDk3OX0.XpmQLQy2Mm2vgWg6UourHAapIee3JfuS1Ncz5mt8610';

export const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    storageKey: 'cbl-site-auth',
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
