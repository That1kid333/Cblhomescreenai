// Dynamic sitemap.xml — lists the static marketing pages plus every published
// blog post (pulled live from Supabase), so search engines and AI crawlers
// discover new stories automatically. Uses the request origin, so it works on
// both the preview host and citybucketlist.com. See netlify.toml for the path.

import type { Context } from 'https://edge.netlify.com';

const SUPABASE_URL = 'https://jgbaqzgkdqqvxmqytgsx.supabase.co';
const PUBLISHABLE = 'sb_publishable_ftx_EkI4-nj0vfUqbP0FzQ_XRGsXZJ9';

// Public marketing routes worth indexing (keep in sync as pages are added —
// the /page-ready skill reminds you to).
const STATIC_PATHS = [
  '/',
  '/blog',
  '/travels',
  '/transportation',
  '/eats-and-drinks',
  '/attractions',
  '/delivery',
  '/directory',
  '/concierge',
  '/affiliates',
  '/partner-restaurants',
  '/partner-attractions',
  '/our-story',
  '/how-it-works',
  '/meet-buckee',
  '/faq',
  '/contact',
];

export default async function handler(req: Request, _context: Context): Promise<Response> {
  const origin = new URL(req.url).origin;
  let posts: { slug: string; updated_at?: string | null }[] = [];
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,updated_at&status=eq.published`,
      { headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${PUBLISHABLE}` } },
    );
    if (r.ok) posts = await r.json();
  } catch (_e) {
    /* fall back to just the static pages */
  }

  const entry = (loc: string, lastmod?: string | null) =>
    `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}</url>`;

  const urls = [
    ...STATIC_PATHS.map((p) => entry(`${origin}${p}`)),
    ...posts.map((p) => entry(`${origin}/blog/${p.slug}`, p.updated_at)),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' },
  });
}
