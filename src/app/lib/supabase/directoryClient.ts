import { createClient } from '@supabase/supabase-js';

// cbl-directory backs Justin's standalone classifieds/business directory app
// (directory.citybucketlist.com). The marketing site only ever reads from it
// (posting/payment/sign-in stays on that app) — anon key is safe to fall back
// to, access is governed by RLS.
const SUPABASE_URL = import.meta.env.VITE_DIRECTORY_SUPABASE_URL || 'https://kcmygfvxjncjyopvblhx.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_DIRECTORY_SUPABASE_ANON_KEY || 'sb_publishable_fo2BCSFh2ecV25cstLBSFw_y7TuKTwe';

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
    .from('businesses')
    .select(
      'id, business_name, description, city, state, business_type, directory_category, logo_url, photos, rating, review_count, featured, plan'
    )
    .eq('is_active', true);

  if (opts.city) query = query.ilike('city', opts.city);
  if (opts.category) query = query.eq('directory_category', opts.category);

  const { data, error } = await query.order('featured', { ascending: false });
  if (error) {
    console.error('[directoryClient] getActiveBusinesses failed:', error.message);
    return [];
  }
  return data ?? [];
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
