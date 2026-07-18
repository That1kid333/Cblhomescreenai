import { createClient } from '@supabase/supabase-js';

// cbl-directory backs Justin's standalone classifieds/business directory app
// (directory.citybucketlist.com). The marketing site only ever reads from it
// (posting/payment/sign-in stays on that app) — anon key is safe to fall back
// to, access is governed by RLS.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jgbaqzgkdqqvxmqytgsx.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ftx_EkI4-nj0vfUqbP0FzQ_XRGsXZJ9';

export const directoryClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export type DirectoryCategory = {
  name: string;
  slug: string;
  icon: string | null;
  applies_to: 'listings' | 'businesses' | 'both';
  sort_order: number;
};

export type DirectoryBusiness = {
  id: string;
  business_name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  business_type: string | null;
  directory_category: string | null;
  logo_url: string | null;
  photos: string[] | null;
  rating: number | null;
  review_count: number | null;
  featured: boolean | null;
  plan: string | null;
};

export type DirectoryListing = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  price: number | null;
  price_type: string | null;
  city: string | null;
  state: string | null;
  photos: string[] | null;
  featured: boolean | null;
  urgent: boolean | null;
  tier?: string | null;
  user_id?: string | null; // owner (CBL-Rides listings only) — enables "edit my listing"
  driver_referral_code?: string | null; // active-driver posts → "Verified CBL Driver" QR
  driver_ad?: Record<string, unknown> | null; // driver business-card fields (driver_post only)
  latitude?: number | null;
  longitude?: number | null;
};

export async function getDirectoryCategories(): Promise<DirectoryCategory[]> {
  const { data, error } = await directoryClient
    .from('categories')
    .select('name, slug, icon, applies_to, sort_order')
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('[directoryClient] getDirectoryCategories failed:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getActiveBusinesses(opts: { city?: string; category?: string } = {}): Promise<DirectoryBusiness[]> {
  let query = directoryClient
    .from('partners')
    .select(
      'id, business_name, description, city, state, business_type, directory_category, logo_url, status, show_in_directory'
    )
    .eq('status', 'active')
    .eq('show_in_directory', true);

  if (opts.city) query = query.ilike('city', opts.city);
  if (opts.category) query = query.eq('directory_category', opts.category);

  const { data, error } = await query;
  if (error) {
    console.error('[directoryClient] getActiveBusinesses failed:', error.message);
    return [];
  }
  return (data ?? []).map((p: any) => ({
    id: String(p.id),
    business_name: p.business_name,
    description: p.description,
    city: p.city,
    state: p.state,
    business_type: p.business_type,
    directory_category: p.directory_category,
    logo_url: p.logo_url,
    photos: p.logo_url ? [p.logo_url] : [],
    rating: null,
    review_count: null,
    featured: false,
    plan: null,
  }));
}

export async function getActiveListings(opts: { city?: string; category?: string } = {}): Promise<DirectoryListing[]> {
  let query = directoryClient
    .from('listings')
    .select('id, title, description, category, subcategory, price, price_type, city, state, photos, featured, urgent')
    .eq('status', 'active');

  if (opts.city) query = query.ilike('city', opts.city);
  if (opts.category) query = query.eq('category', opts.category);

  const { data, error } = await query.order('featured', { ascending: false });
  if (error) {
    console.error('[directoryClient] getActiveListings failed:', error.message);
    return [];
  }
  return data ?? [];
}
