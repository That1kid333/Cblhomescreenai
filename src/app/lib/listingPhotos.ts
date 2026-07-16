// Photo management for a member's own directory listing. Uploads go to the public
// `directory-photos` bucket under <uid>/<listingId>/… (RLS lets a member touch only
// their own folder); the public URLs are saved into directory_listings.photos[]
// (RLS update_own: auth.uid() = user_id). The first photo becomes the card image.

import { authClient } from './supabase/authClient';

const BUCKET = 'directory-photos';

// Photo allowance by paid tier (basic/free = none).
export function maxPhotosForTier(tier: string | null | undefined): number {
  switch ((tier || 'basic').toLowerCase()) {
    case 'photo': return 5;
    case 'featured': return 10;
    case 'pro': return 20;
    default: return 0;
  }
}

export type OwnListing = {
  id: string;
  title: string;
  photos: string[];
  tier: string | null;
  featured: boolean | null;
  user_id: string;
};

// Load a listing the signed-in member owns (for the photo editor). Returns null
// if not signed in or the row isn't theirs.
export async function getOwnListing(id: string): Promise<OwnListing | null> {
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) return null;
  const { data, error } = await authClient
    .from('directory_listings')
    .select('id, title, photos, tier, featured, user_id')
    .eq('id', Number(id))
    .maybeSingle();
  if (error || !data || data.user_id !== session.user.id) return null;
  return {
    id: String(data.id),
    title: (data.title as string) ?? '',
    photos: (data.photos as string[] | null) ?? [],
    tier: (data.tier as string | null) ?? null,
    featured: (data.featured as boolean | null) ?? null,
    user_id: data.user_id as string,
  };
}

export async function uploadListingPhoto(
  file: File,
  listingId: string,
): Promise<{ url: string | null; error: string | null }> {
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) return { url: null, error: 'Please sign in to add photos.' };
  if (!file.type.startsWith('image/')) return { url: null, error: 'Please choose an image file.' };
  if (file.size > 8 * 1024 * 1024) return { url: null, error: 'Image is too large (max 8 MB).' };

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${session.user.id}/${listingId}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
  const { error: upErr } = await authClient.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (upErr) return { url: null, error: upErr.message };
  const { data } = authClient.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

// Upload a driver-ad image (profile or car photo) BEFORE the listing exists.
// Goes to the member's own folder (<uid>/driver-ad/…) so the same bucket RLS
// (first path segment = auth.uid()) allows it; returns the public URL to store
// in driver_ad.photo / driver_ad.carPhoto.
export async function uploadDriverAdPhoto(
  file: File,
  kind: 'profile' | 'car',
): Promise<{ url: string | null; error: string | null }> {
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) return { url: null, error: 'Please sign in first.' };
  if (!file.type.startsWith('image/')) return { url: null, error: 'Please choose an image file.' };
  if (file.size > 8 * 1024 * 1024) return { url: null, error: 'Image is too large (max 8 MB).' };

  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${session.user.id}/driver-ad/${kind}-${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
  const { error: upErr } = await authClient.storage
    .from(BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (upErr) return { url: null, error: upErr.message };
  const { data } = authClient.storage.from(BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

// Persist the ordered photo URL list onto the listing (RLS: owner only).
export async function saveListingPhotos(
  listingId: string,
  photos: string[],
): Promise<{ error: string | null }> {
  const { error } = await authClient
    .from('directory_listings')
    .update({ photos })
    .eq('id', Number(listingId));
  return { error: error?.message ?? null };
}
