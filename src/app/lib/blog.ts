import { ridesClient } from './supabase/ridesClient';

/**
 * CBL Blog data access. Reads public `blog_posts` from the CBL-Rides Supabase
 * via the publishable key — RLS restricts anon to status='published', so drafts
 * never leak. See blog/BLOG-BACKEND-HANDOFF.md for the schema.
 */

export type BlogMedia = {
  slot: string;
  type: 'image' | 'video';
  url: string;
  alt?: string;
  poster?: string;
  credit?: string | null;
};

export type BlogCard = {
  slug: string;
  title: string;
  subtitle: string | null;
  kicker: string | null;
  vertical: string | null;
  city: string | null;
  excerpt: string | null;
  hero_image: string | null;
  author_name: string | null;
  featured: boolean;
  published_at: string | null;
};

export type BlogPost = BlogCard & {
  body_md: string | null;
  media: BlogMedia[];
  drivers_take: string | null;
  drivers_take_name: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

const CARD_COLS =
  'slug, title, subtitle, kicker, vertical, city, excerpt, hero_image, author_name, featured, published_at';
const FULL_COLS =
  `${CARD_COLS}, body_md, media, drivers_take, drivers_take_name, seo_title, seo_description`;

export async function getPublishedPosts(): Promise<BlogCard[]> {
  const { data, error } = await ridesClient
    .from('blog_posts')
    .select(CARD_COLS)
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false });
  if (error) {
    console.error('getPublishedPosts', error.message);
    return [];
  }
  return (data as BlogCard[]) ?? [];
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await ridesClient
    .from('blog_posts')
    .select(FULL_COLS)
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();
  if (error) {
    console.error('getPostBySlug', error.message);
    return null;
  }
  if (!data) return null;
  return { ...(data as BlogPost), media: Array.isArray((data as BlogPost).media) ? (data as BlogPost).media : [] };
}

/* ── Likes ── one per device (random id in localStorage), deduped server-side. */

export function deviceId(): string {
  if (typeof localStorage === 'undefined') return '';
  let id = localStorage.getItem('cbl_device_id');
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `d-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    localStorage.setItem('cbl_device_id', id);
  }
  return id;
}

export type LikeState = { likes: number; liked: boolean };

export async function getLikeState(slug: string): Promise<LikeState> {
  const { data } = await ridesClient.rpc('blog_like_state', { p_slug: slug, p_device: deviceId() });
  return (data as LikeState) ?? { likes: 0, liked: false };
}

export async function toggleLike(slug: string): Promise<LikeState> {
  const { data } = await ridesClient.rpc('blog_like_toggle', { p_slug: slug, p_device: deviceId() });
  return (data as LikeState) ?? { likes: 0, liked: false };
}

export async function getLikeCounts(): Promise<Record<string, number>> {
  const { data } = await ridesClient.rpc('blog_like_counts');
  const map: Record<string, number> = {};
  ((data as { slug: string; likes: number }[]) ?? []).forEach((r) => {
    map[r.slug] = Number(r.likes) || 0;
  });
  return map;
}
