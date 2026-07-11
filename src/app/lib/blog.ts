import { ridesClient } from './supabase/ridesClient';
import { authClient } from './supabase/authClient';

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
  riders_take: string | null;
  riders_take_name: string | null;
  seo_title: string | null;
  seo_description: string | null;
};

const CARD_COLS =
  'slug, title, subtitle, kicker, vertical, city, excerpt, hero_image, author_name, featured, published_at';
const FULL_COLS =
  `${CARD_COLS}, body_md, media, drivers_take, drivers_take_name, riders_take, riders_take_name, seo_title, seo_description`;

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

/* ══════════════════════════════════════════════════════════════════════════
   CBL Studio — admin authoring layer. Every call goes through `authClient`
   (the signed-in member/admin session), so the database's `blog_admin_all`
   RLS policy (has_role admin|moderator) is what actually authorizes writes —
   the anon publishable key can't touch these rows. See Studio.tsx.
   ═════════════════════════════════════════════════════════════════════════ */

export type StudioListItem = {
  id: string;
  slug: string;
  title: string;
  status: string;
  vertical: string | null;
  city: string | null;
  featured: boolean;
  updated_at: string | null;
  published_at: string | null;
};

export type StudioInput = {
  slug: string;
  title: string;
  subtitle: string;
  kicker: string;
  vertical: string;
  city: string;
  excerpt: string;
  body_md: string;
  hero_image: string;
  author_name: string;
  drivers_take: string;
  drivers_take_name: string;
  riders_take: string;
  riders_take_name: string;
  tags: string[];
  featured: boolean;
  show_trip_planner: boolean;
  seo_title: string;
  seo_description: string;
  status: 'draft' | 'published';
};

export type StudioFullPost = StudioInput & { id: string; published_at: string | null };

/** True only if the signed-in user holds the admin/moderator role (server-checked). */
export async function studioIsAdmin(): Promise<boolean> {
  const { data, error } = await authClient.rpc('blog_is_admin');
  if (error) {
    console.error('studioIsAdmin', error.message);
    return false;
  }
  return data === true;
}

/** All posts (drafts included) for the Studio dashboard — admin-gated by RLS. */
export async function getStudioPosts(): Promise<StudioListItem[]> {
  const { data, error } = await authClient
    .from('blog_posts')
    .select('id, slug, title, status, vertical, city, featured, updated_at, published_at')
    .order('updated_at', { ascending: false });
  if (error) {
    console.error('getStudioPosts', error.message);
    return [];
  }
  return (data as StudioListItem[]) ?? [];
}

/** One post by id, with every editable field, to preload the editor. */
export async function getStudioPost(id: string): Promise<StudioFullPost | null> {
  const { data, error } = await authClient.from('blog_posts').select('*').eq('id', id).maybeSingle();
  if (error) {
    console.error('getStudioPost', error.message);
    return null;
  }
  if (!data) return null;
  const p = data as Record<string, unknown>;
  return {
    id: p.id as string,
    slug: (p.slug as string) ?? '',
    title: (p.title as string) ?? '',
    subtitle: (p.subtitle as string) ?? '',
    kicker: (p.kicker as string) ?? '',
    vertical: (p.vertical as string) ?? '',
    city: (p.city as string) ?? '',
    excerpt: (p.excerpt as string) ?? '',
    body_md: (p.body_md as string) ?? '',
    hero_image: (p.hero_image as string) ?? '',
    author_name: (p.author_name as string) ?? '',
    drivers_take: (p.drivers_take as string) ?? '',
    drivers_take_name: (p.drivers_take_name as string) ?? '',
    riders_take: (p.riders_take as string) ?? '',
    riders_take_name: (p.riders_take_name as string) ?? '',
    tags: Array.isArray(p.tags) ? (p.tags as string[]) : [],
    featured: !!p.featured,
    show_trip_planner: !!p.show_trip_planner,
    seo_title: (p.seo_title as string) ?? '',
    seo_description: (p.seo_description as string) ?? '',
    status: (p.status as 'draft' | 'published') ?? 'draft',
    published_at: (p.published_at as string) ?? null,
  };
}

const nn = (s: string): string | null => {
  const t = (s ?? '').trim();
  return t === '' ? null : t;
};

/**
 * Create (no id) or update (id) a post. `media` is intentionally NOT written
 * here so any photo/video gallery set elsewhere survives an edit. `published_at`
 * is stamped the first time a post goes live and preserved thereafter.
 */
export async function savePost(
  input: StudioInput,
  opts: { id?: string; existingPublishedAt?: string | null } = {},
): Promise<{ id: string | null; slug: string; error: string | null }> {
  const { data: sess } = await authClient.auth.getSession();
  const uid = sess.session?.user?.id ?? null;

  let published_at = opts.existingPublishedAt ?? null;
  if (input.status === 'published' && !published_at) published_at = new Date().toISOString();

  const row: Record<string, unknown> = {
    slug: input.slug.trim(),
    title: input.title.trim(),
    subtitle: nn(input.subtitle),
    kicker: nn(input.kicker),
    vertical: nn(input.vertical),
    city: nn(input.city),
    excerpt: nn(input.excerpt),
    body_md: nn(input.body_md),
    hero_image: nn(input.hero_image),
    author_name: nn(input.author_name),
    author_id: uid,
    drivers_take: nn(input.drivers_take),
    drivers_take_name: nn(input.drivers_take_name),
    riders_take: nn(input.riders_take),
    riders_take_name: nn(input.riders_take_name),
    tags: input.tags,
    featured: input.featured,
    show_trip_planner: input.show_trip_planner,
    seo_title: nn(input.seo_title),
    seo_description: nn(input.seo_description),
    status: input.status,
    published_at,
  };

  if (opts.id) {
    const { data, error } = await authClient
      .from('blog_posts')
      .update(row)
      .eq('id', opts.id)
      .select('id, slug')
      .maybeSingle();
    return { id: (data?.id as string) ?? opts.id, slug: (data?.slug as string) ?? input.slug, error: error?.message ?? null };
  }
  const { data, error } = await authClient
    .from('blog_posts')
    .insert({ ...row, created_by: uid })
    .select('id, slug')
    .maybeSingle();
  return { id: (data?.id as string) ?? null, slug: (data?.slug as string) ?? input.slug, error: error?.message ?? null };
}

export async function deleteStudioPost(id: string): Promise<{ error: string | null }> {
  const { error } = await authClient.from('blog_posts').delete().eq('id', id);
  return { error: error?.message ?? null };
}
