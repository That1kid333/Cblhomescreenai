// Data layer for CBL Studio — a member's "manage my stuff" hub. All calls use the
// member's own authClient session, so RLS (owner select/update/delete on
// directory_listings) keeps a member scoped to their own listings. Photos are
// handled separately in listingPhotos.ts.

import { authClient } from './supabase/authClient';

export type MyListing = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  price: number | null;
  price_type: string | null;
  city: string | null;
  state: string | null;
  photos: string[];
  featured: boolean;
  tier: string | null;
  status: string;
  created_at: string | null;
  expires_at: string | null;
};

const COLS =
  'id, title, description, category, price, price_type, city, state, photos, featured, tier, status, created_at, expires_at';

function toMyListing(r: Record<string, unknown>): MyListing {
  return {
    id: String(r.id),
    title: (r.title as string) ?? '',
    description: (r.description as string | null) ?? null,
    category: (r.category as string) ?? 'general',
    price: (r.price as number | null) ?? null,
    price_type: (r.price_type as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    state: (r.state as string | null) ?? null,
    photos: (r.photos as string[] | null) ?? [],
    featured: !!r.featured,
    tier: (r.tier as string | null) ?? null,
    status: (r.status as string) ?? 'active',
    created_at: (r.created_at as string | null) ?? null,
    expires_at: (r.expires_at as string | null) ?? null,
  };
}

// All of the signed-in member's listings (any status), newest first.
export async function getMyListings(): Promise<{ listings: MyListing[]; error: string | null }> {
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) return { listings: [], error: 'Please sign in.' };
  const { data, error } = await authClient
    .from('directory_listings')
    .select(COLS)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
  if (error) return { listings: [], error: error.message };
  return { listings: (data ?? []).map(toMyListing), error: null };
}

export type ListingEdits = {
  title?: string;
  description?: string | null;
  category?: string;
  price?: number | null;
  price_type?: 'fixed' | 'free';
};

// Update a listing's text/price fields (RLS: owner only).
export async function updateListing(id: string, edits: ListingEdits): Promise<{ error: string | null }> {
  const patch: Record<string, unknown> = {};
  if (edits.title !== undefined) patch.title = edits.title;
  if (edits.description !== undefined) patch.description = edits.description;
  if (edits.category !== undefined) patch.category = edits.category;
  if (edits.price_type !== undefined) patch.price_type = edits.price_type;
  if (edits.price !== undefined) patch.price = edits.price_type === 'free' ? null : edits.price;
  const { error } = await authClient.from('directory_listings').update(patch).eq('id', Number(id));
  return { error: error?.message ?? null };
}

// Flip a listing between active and paused (hidden from the public directory).
export async function setListingStatus(id: string, status: 'active' | 'paused'): Promise<{ error: string | null }> {
  const { error } = await authClient.from('directory_listings').update({ status }).eq('id', Number(id));
  return { error: error?.message ?? null };
}

export async function deleteListing(id: string): Promise<{ error: string | null }> {
  const { error } = await authClient.from('directory_listings').delete().eq('id', Number(id));
  return { error: error?.message ?? null };
}

// The signed-in member's driver record (if any) — powers the "Verified CBL Driver"
// business card in Studio. Active = a paid $19.99 subscription (or an override).
export type MyDriver = { referralCode: string | null; active: boolean; name: string | null };
export async function getMyDriver(): Promise<MyDriver | null> {
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) return null;
  const { data, error } = await authClient
    .from('drivers')
    .select('referral_code, subscription_status, subscription_end, manual_subscription_override, name')
    .eq('auth_user_id', session.user.id)
    .maybeSingle();
  if (error || !data) return null;
  const status = String(data.subscription_status ?? '');
  const notExpired = !data.subscription_end || new Date(data.subscription_end as string) > new Date();
  // 'canceled_grace_period' still has PAID access until the period ends.
  const active = !!data.manual_subscription_override || (['active', 'trial', 'canceled_grace_period'].includes(status) && notExpired);
  return { referralCode: (data.referral_code as string | null) ?? null, active, name: (data.name as string | null) ?? null };
}
