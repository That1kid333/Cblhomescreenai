import { createClient } from '@supabase/supabase-js';

// CBL-Rides is the main app's database (app.citybucketlist.com). The anon key
// is safe to fall back to here — it's already public in the app's own client
// bundle, and access is governed by RLS, not key secrecy.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jgbaqzgkdqqvxmqytgsx.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnYmFxemdrZHFxdnhtcXl0Z3N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExODg5NzksImV4cCI6MjA0Njc2NDk3OX0.XpmQLQy2Mm2vgWg6UourHAapIee3JfuS1Ncz5mt8610';

export const ridesClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export type Partner = {
  id: number;
  business_name: string;
  business_type: string;
  description: string | null;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  logo_url: string | null;
  website_url: string | null;
  referral_code: string;
  directory_category: string | null;
};

const PARTNER_COLUMNS =
  'id, business_name, business_type, description, address, city, state, zip_code, logo_url, website_url, referral_code, directory_category';

export async function getActivePartners(opts: { city?: string; businessType?: string } = {}): Promise<Partner[]> {
  let query = ridesClient
    .from('partners')
    .select(PARTNER_COLUMNS)
    .eq('status', 'active')
    .eq('show_in_directory', true);

  if (opts.businessType) query = query.eq('business_type', opts.businessType);
  if (opts.city) query = query.ilike('city', opts.city);

  const { data, error } = await query;
  if (error) {
    console.error('[ridesClient] getActivePartners failed:', error.message);
    return [];
  }
  return data ?? [];
}
