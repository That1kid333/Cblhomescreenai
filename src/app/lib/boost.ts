// Client helpers for the directory "boost your listing" flow. They call the two
// CBL-Rides edge functions (create-listing-boost-checkout + apply-listing-boost).
// The anon/publishable key is public (already in the app bundle) and only routes
// the request; the functions are verify_jwt=false and validate server-side. The
// browser's Origin header drives the Stripe return URL, so we don't send it here.

const FN_BASE = 'https://jgbaqzgkdqqvxmqytgsx.supabase.co/functions/v1';
const ANON = 'sb_publishable_ftx_EkI4-nj0vfUqbP0FzQ_XRGsXZJ9';

const HEADERS = {
  'Content-Type': 'application/json',
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
};

export type BoostTier = 'photo' | 'featured' | 'pro';

// Starts Stripe Checkout for a boost and REDIRECTS the browser to it. Returns
// only on failure (with an error string); on success the page navigates away.
export async function startListingBoost(
  listingId: string,
  tier: BoostTier,
): Promise<{ error: string | null }> {
  try {
    const res = await fetch(`${FN_BASE}/create-listing-boost-checkout`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ listingId, tier }),
    });
    const data = await res.json();
    if (data?.url) {
      window.location.href = data.url as string;
      return { error: null };
    }
    return { error: (data?.error as string) || 'Could not start checkout. Please try again.' };
  } catch {
    return { error: 'Could not reach checkout. Please try again.' };
  }
}

// Called when the buyer returns from Stripe (?boost=success&session_id=…).
// Verifies the paid session and flips the listing. Idempotent.
export async function applyListingBoost(
  sessionId: string,
): Promise<{ applied?: boolean; listing?: { id: string | number; tier: string; featured: boolean }; error?: string; reason?: string }> {
  try {
    const res = await fetch(`${FN_BASE}/apply-listing-boost`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ sessionId }),
    });
    return await res.json();
  } catch {
    return { error: 'network' };
  }
}
