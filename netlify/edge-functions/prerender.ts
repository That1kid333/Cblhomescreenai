// CBL Blog prerender — Netlify Edge Function.
//
// The site is a client-rendered React SPA, so crawlers (Google) and AI answer
// engines would otherwise see an empty <div id="root"></div>. This function
// runs on /blog and /blog/:slug, fetches the post JSON from Supabase, and
// injects real, crawlable HTML + full SEO metadata (title, description,
// canonical, Open Graph, Twitter, and Article JSON-LD) into the shell BEFORE it
// reaches the client. Real visitors still get the full SPA — React's
// createRoot().render() replaces the #root content on load, so there's no
// user-agent sniffing and no cloaking. See netlify.toml for the path config.

import type { Context } from 'https://edge.netlify.com';

const SUPABASE_URL = 'https://jgbaqzgkdqqvxmqytgsx.supabase.co';
const PUBLISHABLE = 'sb_publishable_ftx_EkI4-nj0vfUqbP0FzQ_XRGsXZJ9';
const OG_FALLBACK = '/eats/imagery/cbl-map-backdrop.jpg';

type Media = { slot?: string; type?: string; url?: string; alt?: string; credit?: string | null };
type Post = {
  slug: string;
  title: string;
  subtitle?: string | null;
  kicker?: string | null;
  vertical?: string | null;
  city?: string | null;
  excerpt?: string | null;
  body_md?: string | null;
  hero_image?: string | null;
  media?: Media[] | null;
  author_name?: string | null;
  drivers_take?: string | null;
  drivers_take_name?: string | null;
  riders_take?: string | null;
  riders_take_name?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
};

const esc = (s: string): string =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Minimal, dependency-free Markdown -> HTML (mirrors the app's Markdown
// component: h2/h3, bold, italic, links, unordered lists, blockquotes,
// paragraphs). Content is escaped first, so output is XSS-safe.
function inlineMd(raw: string): string {
  let s = esc(raw);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/_([^_]+)_/g, '<em>$1</em>');
  s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|\/)[^\s)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

function mdToHtml(md: string): string {
  const blocks = md.replace(/\r\n/g, '\n').split(/\n{2,}/);
  const out: string[] = [];
  for (const block of blocks) {
    const b = block.trim();
    if (!b) continue;
    if (b.startsWith('### ')) {
      out.push(`<h3>${inlineMd(b.slice(4))}</h3>`);
    } else if (b.startsWith('## ')) {
      out.push(`<h2>${inlineMd(b.slice(3))}</h2>`);
    } else if (b.startsWith('# ')) {
      out.push(`<h2>${inlineMd(b.slice(2))}</h2>`);
    } else if (/^>\s?/.test(b)) {
      const inner = b.split('\n').map((l) => inlineMd(l.replace(/^>\s?/, ''))).join('<br/>');
      out.push(`<blockquote>${inner}</blockquote>`);
    } else if (/^[-*]\s+/.test(b)) {
      const items = b.split('\n').filter((l) => /^[-*]\s+/.test(l)).map((l) => `<li>${inlineMd(l.replace(/^[-*]\s+/, ''))}</li>`).join('');
      out.push(`<ul>${items}</ul>`);
    } else {
      out.push(`<p>${inlineMd(b)}</p>`);
    }
  }
  return out.join('\n');
}

const absUrl = (origin: string, u?: string | null): string =>
  !u ? `${origin}${OG_FALLBACK}` : /^https?:\/\//.test(u) ? u : `${origin}${u.startsWith('/') ? '' : '/'}${u}`;

function injectHead(html: string, meta: { title: string; description: string; url: string; image: string; type: string; jsonld?: unknown }): string {
  const tags = [
    `<meta name="description" content="${esc(meta.description)}" />`,
    `<link rel="canonical" href="${esc(meta.url)}" />`,
    `<meta property="og:type" content="${esc(meta.type)}" />`,
    `<meta property="og:title" content="${esc(meta.title)}" />`,
    `<meta property="og:description" content="${esc(meta.description)}" />`,
    `<meta property="og:url" content="${esc(meta.url)}" />`,
    `<meta property="og:image" content="${esc(meta.image)}" />`,
    `<meta property="og:site_name" content="City Bucket List" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(meta.title)}" />`,
    `<meta name="twitter:description" content="${esc(meta.description)}" />`,
    `<meta name="twitter:image" content="${esc(meta.image)}" />`,
  ];
  if (meta.jsonld) tags.push(`<script type="application/ld+json">${JSON.stringify(meta.jsonld)}</script>`);
  let out = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(meta.title)}</title>`);
  out = out.replace('</head>', `${tags.join('\n    ')}\n  </head>`);
  return out;
}

function injectRoot(html: string, content: string): string {
  return html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${content}</div>`);
}

function renderPost(origin: string, p: Post): string {
  const heroAlt = (Array.isArray(p.media) ? p.media.find((m) => m.slot === 'hero')?.alt : '') || p.title;
  const gallery = (Array.isArray(p.media) ? p.media : []).filter((m) => m.url && m.url !== p.hero_image);
  const parts: string[] = ['<article>'];
  if (p.kicker) parts.push(`<p class="kicker">${esc(p.kicker)}</p>`);
  parts.push(`<h1>${esc(p.title)}</h1>`);
  if (p.subtitle) parts.push(`<p class="dek">${esc(p.subtitle)}</p>`);
  if (p.author_name) parts.push(`<p class="byline">By ${esc(p.author_name)}${p.city ? ` · ${esc(p.city)}` : ''}</p>`);
  if (p.hero_image) parts.push(`<img src="${esc(absUrl(origin, p.hero_image))}" alt="${esc(heroAlt)}" width="1200" height="740" />`);
  if (p.body_md) parts.push(mdToHtml(p.body_md));
  if (p.drivers_take) parts.push(`<aside><p class="label">Driver's Take</p><blockquote>${esc(p.drivers_take)}</blockquote>${p.drivers_take_name ? `<p>— ${esc(p.drivers_take_name)}</p>` : ''}</aside>`);
  if (p.riders_take) parts.push(`<aside><p class="label">Rider's Take</p><blockquote>${esc(p.riders_take)}</blockquote>${p.riders_take_name ? `<p>— ${esc(p.riders_take_name)}</p>` : ''}</aside>`);
  for (const m of gallery) {
    if (m.type === 'video') {
      parts.push(`<figure><video controls src="${esc(absUrl(origin, m.url))}"></video>${m.alt ? `<figcaption>${esc(m.alt)}</figcaption>` : ''}</figure>`);
    } else {
      parts.push(`<figure><img src="${esc(absUrl(origin, m.url))}" alt="${esc(m.alt || '')}" />${m.alt ? `<figcaption>${esc(m.alt)}</figcaption>` : ''}</figure>`);
    }
  }
  parts.push('</article>');
  return parts.join('\n');
}

function articleJsonLd(origin: string, p: Post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.title,
    description: p.seo_description || p.excerpt || p.subtitle || '',
    image: [absUrl(origin, p.hero_image)],
    datePublished: p.published_at || undefined,
    dateModified: p.updated_at || p.published_at || undefined,
    author: { '@type': 'Person', name: p.author_name || 'City Bucket List' },
    publisher: {
      '@type': 'Organization',
      name: 'City Bucket List',
      logo: { '@type': 'ImageObject', url: `${origin}/eats/imagery/cbl-map-backdrop.jpg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${origin}/blog/${p.slug}` },
    ...(p.city ? { locationCreated: { '@type': 'Place', name: p.city } } : {}),
  };
}

const sbHeaders = { apikey: PUBLISHABLE, Authorization: `Bearer ${PUBLISHABLE}` };

export default async function handler(req: Request, context: Context): Promise<Response> {
  const url = new URL(req.url);
  const origin = url.origin;
  const res = await context.next();
  const ctype = res.headers.get('content-type') || '';
  // Only rewrite HTML documents; let static assets (images, etc.) pass through.
  if (!ctype.includes('text/html')) return res;

  let html = await res.text();
  const finish = () =>
    new Response(html, { status: 200, headers: { 'content-type': 'text/html; charset=utf-8', 'x-cbl-prerender': '1' } });

  try {
    const path = url.pathname.replace(/\/$/, '') || '/blog';

    if (path === '/blog') {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,title,subtitle,excerpt,city,author_name,hero_image,published_at&status=eq.published&order=featured.desc,published_at.desc`,
        { headers: sbHeaders },
      );
      const posts: Post[] = r.ok ? await r.json() : [];
      const title = 'CBL Blog — City experiences, told by locals | City Bucket List';
      const description =
        'The CBL Blog: honest city experiences from the drivers and riders who actually know the place — transportation, travels, eats & drinks, and attractions, one city at a time.';
      html = injectHead(html, { title, description, url: `${origin}/blog`, image: absUrl(origin, posts[0]?.hero_image), type: 'website' });
      const cards = posts
        .map(
          (p) =>
            `<article><a href="/blog/${esc(p.slug)}"><h2>${esc(p.title)}</h2></a>${p.subtitle ? `<p>${esc(p.subtitle)}</p>` : ''}${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}<p>${esc(p.author_name || '')}${p.city ? ` · ${esc(p.city)}` : ''}</p></article>`,
        )
        .join('\n');
      html = injectRoot(html, `<main><p>where the locals go</p><h1>CBL Blog</h1><p>${esc(description)}</p>${cards}</main>`);
      return finish();
    }

    if (path === '/directory') {
      const title = 'Local Directory — Classifieds, Shopping & Deals | City Bucket List';
      const description =
        'Browse local classifieds, driver posts, rider requests, shopping, and member coupons near you — free to browse, sign in to post. City Bucket List community directory.';
      const sections = ['Classifieds', 'Driver Posts', 'Rider Requests', 'Shopping', 'Coupons & Offers'];
      const jsonld = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description,
        url: `${origin}/directory`,
        mainEntity: {
          '@type': 'ItemList',
          name: 'Directory sections',
          itemListElement: sections.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s })),
        },
      };
      html = injectHead(html, {
        title,
        description,
        url: `${origin}/directory`,
        image: absUrl(origin, null),
        type: 'website',
        jsonld,
      });
      const list = sections.map((s) => `<li>${esc(s)}</li>`).join('');
      html = injectRoot(
        html,
        `<main><p>classifieds · drivers · riders · shopping · coupons</p><h1>Local Directory</h1><p>${esc(description)}</p><h2>Browse the directory</h2><ul>${list}</ul><p>Free to browse. Sign in to post. City Bucket List is a software-as-a-service platform.</p></main>`,
      );
      return finish();
    }

    if (path === '/attractions') {
      const title = 'Attractions Near You — Top-Rated Things To Do | City Bucket List';
      const description =
        'Discover the top-rated attractions near you — museums, parks, live music, sports, and family fun, pulled live from Google with real ratings. Then book a private CBL ride to get there.';
      // Representative, stable attractions so crawlers/AI engines get real entity
      // content (live visitors get results near their own location via the SPA).
      const spots = [
        'Phipps Conservatory and Botanical Gardens',
        'The Andy Warhol Museum',
        'Point State Park',
        'Carnegie Museum of Natural History',
        'Duquesne Incline',
        'National Aviary',
        'Pittsburgh Zoo & Aquarium',
        'Kennywood',
      ];
      const jsonld = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: title,
        description,
        url: `${origin}/attractions`,
        mainEntity: {
          '@type': 'ItemList',
          name: 'Top-rated attractions near you',
          itemListElement: spots.map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s })),
        },
      };
      html = injectHead(html, {
        title,
        description,
        url: `${origin}/attractions`,
        image: absUrl(origin, null),
        type: 'website',
        jsonld,
      });
      const list = spots.map((s) => `<li>${esc(s)}</li>`).join('');
      html = injectRoot(
        html,
        `<main><p>real attractions · near you</p><h1>Attractions Near You</h1><p>${esc(description)}</p><h2>Top-rated things to do</h2><ul>${list}</ul><p>Book a private CBL ride to any attraction. City Bucket List is a software-as-a-service platform — schedule a ride with an independent driver you already know.</p></main>`,
      );
      return finish();
    }

    const m = path.match(/^\/blog\/([^/]+)$/);
    if (m) {
      const slug = decodeURIComponent(m[1]);
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/blog_posts?select=*&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`,
        { headers: sbHeaders },
      );
      const rows: Post[] = r.ok ? await r.json() : [];
      const post = rows[0];
      if (!post) return finish(); // unknown/unpublished — let the SPA render its "not found"
      const title = `${post.seo_title || post.title} — CBL Blog`;
      const description = post.seo_description || post.excerpt || post.subtitle || '';
      html = injectHead(html, {
        title,
        description,
        url: `${origin}/blog/${post.slug}`,
        image: absUrl(origin, post.hero_image),
        type: 'article',
        jsonld: articleJsonLd(origin, post),
      });
      html = injectRoot(html, renderPost(origin, post));
      return finish();
    }
  } catch (_err) {
    // On any failure, fall through and serve the untouched SPA shell.
  }
  return finish();
}
