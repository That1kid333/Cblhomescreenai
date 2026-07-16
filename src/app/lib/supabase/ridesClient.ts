import { createClient } from '@supabase/supabase-js';
import type { DirectoryListing } from './directoryClient';

// CBL-Rides is the main app's database (app.citybucketlist.com). The anon key
// is safe to fall back to here — it's already public in the app's own client
// bundle, and access is governed by RLS, not key secrecy.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jgbaqzgkdqqvxmqytgsx.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'sb_publishable_ftx_EkI4-nj0vfUqbP0FzQ_XRGsXZJ9';

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

// Classifieds live in CBL-Rides `directory_listings` — the SAME project as member
// auth, so members post via RLS (no bridge). Public read = active listings only
// (RLS enforces status='active' AND not expired). Mapped to the DirectoryListing
// shape so the existing card mapping keeps working (neighborhood → subcategory).
export async function getDirectoryListings(
  opts: { city?: string; category?: string } = {},
): Promise<DirectoryListing[]> {
  let query = ridesClient
    .from('directory_listings')
    .select('id, title, description, category, price, price_type, city, state, neighborhood, latitude, longitude, photos, featured, urgent, tier, user_id, driver_referral_code, driver_ad')
    .eq('status', 'active');
  if (opts.city) query = query.ilike('city', opts.city);
  if (opts.category) query = query.eq('category', opts.category);
  const { data, error } = await query.order('featured', { ascending: false }).limit(60);
  if (error) {
    console.error('[ridesClient] getDirectoryListings failed:', error.message);
    return [];
  }
  return (data ?? []).map((r: Record<string, unknown>) => ({
    id: String(r.id),
    title: r.title as string,
    description: (r.description as string | null) ?? null,
    category: r.category as string,
    subcategory: (r.neighborhood as string | null) ?? null,
    price: (r.price as number | null) ?? null,
    price_type: (r.price_type as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    state: (r.state as string | null) ?? null,
    photos: (r.photos as string[] | null) ?? null,
    featured: (r.featured as boolean | null) ?? null,
    urgent: (r.urgent as boolean | null) ?? null,
    tier: (r.tier as string | null) ?? null,
    user_id: (r.user_id as string | null) ?? null,
    driver_referral_code: (r.driver_referral_code as string | null) ?? null,
    driver_ad: (r.driver_ad as Record<string, unknown> | null) ?? null,
    latitude: (r.latitude as number | null) ?? null,
    longitude: (r.longitude as number | null) ?? null,
  }));
}
