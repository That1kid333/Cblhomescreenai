/**
 * Directory listing shape — TYPES ONLY.
 *
 * This file used to also hold a second Supabase client plus getActiveListings(),
 * getActiveBusinesses() and getDirectoryCategories(). All three were deleted on
 * 2026-08-14: nothing imported them, and they were pointed at the wrong project.
 * They queried `directory_listings_public`, `directory_businesses_public` and
 * `directory_categories` against VITE_SUPABASE_URL, which on this site resolves to
 * CBL-Rides (jgbaqzgkdqqvxmqytgsx) — where the latter two do not exist at all and
 * return 404. The real cbl-directory project (kcmygfvxjncjyopvblhx) holds only four
 * Atlanta demo rows and no driver schema, so that path was doubly dead.
 *
 * The live path is `ridesClient.getDirectoryListings()`, which reads
 * `directory_listings` in CBL-Rides directly and lets RLS decide visibility.
 *
 * Keeping the dead copy around cost real time: it was edited while chasing a
 * missing driver ad before anyone noticed the Directory page never called it.
 * If you are looking for the query, it is in ridesClient.ts.
 */

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
  /** True = shown in every market, exempt from the proximity filter. Admin-set. */
  nationwide?: boolean | null;
};
