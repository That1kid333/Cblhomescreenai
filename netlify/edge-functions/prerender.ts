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
// Square logo (matches the favicon/apple-touch-icon) — used as the default
// share-preview image wherever a page has no image of its own. The old
// default (cbl-map-backdrop.jpg, a 1800x478 wide hero banner) had too extreme
// an aspect ratio for iMessage/Facebook/Twitter link previews, which silently
// drop the image and show text-only when it's this far from ~1.91:1 or 1:1.
const OG_FALLBACK = '/CBL-1024.png';

// Security headers — set here because netlify.toml [[headers]] do NOT apply to
// edge-function responses (this function returns its own Response). Mirrors the
// [[headers]] block in netlify.toml, which covers static assets + non-edge routes.
const CSP =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; " +
  "script-src 'self' 'unsafe-inline'; " +
  "style-src 'self' 'unsafe-inline' https://use.typekit.net https://p.typekit.net https://fonts.googleapis.com; " +
  "font-src 'self' data: https://use.typekit.net https://p.typekit.net https://fonts.gstatic.com; " +
  "img-src 'self' data: https:; " +
  "media-src 'self' data: https:; " +
  "connect-src 'self' https://*.supabase.co https://use.typekit.net https://p.typekit.net https://ipwho.is https://ipapi.co https://api.bigdatacloud.net https://api.open-meteo.com https://*.googleapis.com; " +
  "frame-src 'self' https://www.google.com https://maps.google.com; upgrade-insecure-requests";
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Permissions-Policy': 'geolocation=(self), microphone=(self), camera=(), payment=()',
  'Content-Security-Policy': CSP,
};

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
  // Strip the default SEO tags baked into index.html so we don't duplicate them.
  let out = html
    .replace(/\s*<meta name="description"[^>]*>/gi, '')
    .replace(/\s*<meta property="og:[^"]*"[^>]*>/gi, '')
    .replace(/\s*<meta name="twitter:[^"]*"[^>]*>/gi, '')
    .replace(/\s*<link rel="canonical"[^>]*>/gi, '');
  out = out.replace(/<title>[\s\S]*?<\/title>/i, `<title>${esc(meta.title)}</title>`);
  out = out.replace('</head>', `${tags.join('\n    ')}\n  </head>`);
  return out;
}

// ── Static marketing pages: real crawlable title/meta/OG + hero content ──
// These are client-rendered in the SPA; without prerender a crawler sees an
// empty shell. Content mirrors each page's hero so bots/AI engines get real,
// non-cloaked HTML (React replaces #root for JS visitors).
type StaticPage = { title: string; description: string; eyebrow: string; h1: string; sub?: string; body: string };
const SAAS_NOTE =
  'City Bucket List is a software-as-a-service private-membership platform — not a rideshare, transportation provider, or passenger carrier.';
const STATIC_PAGES: Record<string, StaticPage> = {
  '/': {
    title: 'City Bucket List — Private Rides, Local Eats & Attractions in Your City',
    description:
      'City Bucket List is a private-membership platform for living like a local in every city — schedule private rides with a driver you know, discover top restaurants and attractions, plan trips, and get AI concierge help from Buckee.',
    eyebrow: "what's on your bucket list?",
    h1: 'City Bucket List — your city, your way',
    sub: 'Private, scheduled rides · local eats & drinks · attractions · travel · your AI concierge Buckee',
    body: `<p>${SAAS_NOTE} Members schedule private rides with independent local drivers they already know, discover top-rated restaurants and attractions near them, plan travel, and get personalized recommendations from Buckee, the CBL AI city concierge.</p><h2>What you can do on City Bucket List</h2><ul><li>Book a private, scheduled ride with a driver you already know</li><li>Find top local restaurants and reserve a table</li><li>Discover top-rated attractions and things to do near you</li><li>Plan hotels, weekend trips, and full itineraries</li><li>Browse the local directory, classifieds, and member deals</li><li>Read the CBL Blog — where the locals go</li></ul>`,
  },
  '/transportation': {
    title: 'Private, Scheduled Rides — Your Own Driver | City Bucket List',
    description:
      'Schedule a private ride with a local independent driver you already know — booked ahead, never on-demand, never a stranger. Uber, Lyft and autonomous partner options coming soon for the trips CBL does not cover.',
    eyebrow: 'cbl private · scheduled rides',
    h1: 'Transportation — your city, your way',
    sub: 'Private, scheduled, your-own-driver rides',
    body: `<p>CBL rides are scheduled, by-invitation, and your-own-driver — every ride is booked at least 12 hours ahead, so you always know who is picking you up. ${SAAS_NOTE} Third-party partner options (Uber, Lyft, autonomous) are coming soon for trips an independent driver cannot cover.</p><h2>Three ways to join</h2><ul><li>Riders — ride with a trusted local driver, free to join</li><li>Drivers — build your own private rider base, keep 100% of your fare</li><li>Concierge partners — hotels and businesses that connect guests to drivers</li></ul>`,
  },
  '/eats-and-drinks': {
    title: 'Eats & Drinks — Top Local Restaurants Near You | City Bucket List',
    description:
      'Discover top-rated local restaurants near you — real ratings, real photos, and reservations. Picked by the drivers, bartenders and regulars who actually live here. Reserve a table on OpenTable and book a ride to get there.',
    eyebrow: "what's on your list tonight?",
    h1: 'Eats & Drinks — top local restaurants near you',
    sub: 'Breakfast · lunch · dinner · dessert, picked by locals',
    body: `<p>The best local restaurants near you — breakfast, lunch, dinner and dessert — with real ratings and reviews pulled live, plus reserve-a-table links. Real picks from the people who live here, not recycled top-tens. ${SAAS_NOTE}</p><h2>Find your spot</h2><ul><li>Top-rated restaurants near you by cuisine</li><li>Reserve a table on OpenTable</li><li>Book a private ride to dinner</li></ul>`,
  },
  '/travels': {
    title: 'Travels — Hotels, Weekend Trips & Itineraries | City Bucket List',
    description:
      'Plan your trip with City Bucket List — hotels, B&Bs, short-term rentals, weekend day trips, and full multi-day itineraries curated by CBL, with Buckee planning the rest.',
    eyebrow: 'cbl curated · booking launching soon',
    h1: 'Travels — plan it, book it, live it',
    sub: 'Hotels · resorts · trips · itineraries',
    body: `<p>Hotels, B&Bs, short-term rentals, weekend day trips, and full multi-day itineraries — curated by CBL, with full hotel and flight booking launching soon. Buckee, your AI concierge, plans the rest. ${SAAS_NOTE}</p>`,
  },
  '/meet-buckee': {
    title: 'Meet Buckee — Your AI City Concierge | City Bucket List',
    description:
      'Meet Buckee, the City Bucket List AI concierge — ask him anything about the city in your language and get personalized rides, restaurants, attractions, and itineraries.',
    eyebrow: 'meet your concierge',
    h1: 'Meet Buckee — your AI city concierge',
    sub: 'Ask him anything about the city',
    body: `<p>Buckee is the City Bucket List AI concierge. Ask him anything about the city — in English, Spanish, French or Portuguese — and he plans rides, restaurant reservations, attractions, and full itineraries for you. ${SAAS_NOTE}</p>`,
  },
  '/our-story': {
    title: 'Our Story — Locals Helping Travelers Feel at Home | City Bucket List',
    description:
      'What began as a community-driven transportation platform has grown into a full lifestyle and local-discovery membership — built to help you live like a local in every city you visit.',
    eyebrow: 'since day one',
    h1: 'Our story — locals everywhere',
    sub: 'Friends from anywhere',
    body: `<p>What began as a community-driven transportation platform has grown into a full lifestyle and local-discovery membership. ${SAAS_NOTE} Our mission is to help you live like a local — with a driver you know, the best local spots, and an AI concierge in your pocket.</p>`,
  },
  '/how-it-works': {
    title: 'How It Works — Scheduled Rides, Drivers You Know | City Bucket List',
    description:
      "City Bucket List isn't on-demand. It's a private membership for scheduled rides — where drivers build their own network of riders, and riders ride with someone they've already met. Here's how it works for riders, drivers, and concierge partners.",
    eyebrow: 'private membership association',
    h1: 'How it works — scheduled rides, drivers you know',
    sub: 'For riders, drivers, and concierge partners',
    body: `<p>City Bucket List isn't on-demand. It's a private membership for scheduled rides — drivers build their own network of riders, and riders ride with someone they've already met. Need a quick one-off? Use whatever rideshare you like. ${SAAS_NOTE}</p><h2>Three ways to join</h2><ul><li>Riders — ride with a driver you already met, free to join</li><li>Drivers — build a private rider base and keep your full fare</li><li>Concierge partners — connect your guests to trusted drivers</li></ul>`,
  },
  '/concierge': {
    title: 'Hotel & Concierge Partner Program | City Bucket List',
    description:
      'A free partnership for hotels, residences, and hospitality teams. Connect your guests with trusted local drivers, plan complete itineraries, and earn commission on every ride and booking.',
    eyebrow: 'hotels & hospitality · partner program',
    h1: 'Hotel & Concierge Program',
    sub: 'Earn on every ride',
    body: `<p>A free partner program for hotels, residences, senior communities, venues, and hospitality teams. Connect guests with trusted independent drivers, plan complete itineraries, and earn commission on every ride and booking. ${SAAS_NOTE}</p>`,
  },
  '/partner-restaurants': {
    title: 'Restaurant Partners — Reach Local Diners | City Bucket List',
    description:
      'Partner with City Bucket List to reach local members and drivers deciding where to eat and drink. Get featured placement, full website and app access, and build your own delivery driver network.',
    eyebrow: 'eats & drinks · partner program',
    h1: 'Restaurant Partners',
    sub: 'Reach the locals deciding where to eat',
    body: `<p>CBL members and local drivers use City Bucket List to decide where to eat and drink. Restaurant partners get top placement, full website and app access, and can even build their own delivery driver network. ${SAAS_NOTE}</p>`,
  },
  '/partner-attractions': {
    title: 'Attraction & Venue Partners | City Bucket List',
    description:
      'Partner with City Bucket List to get your attraction, venue, or experience in front of members planning their next outing — with sponsored top placement and ticketed booking.',
    eyebrow: 'attractions · partner program',
    h1: 'Attraction & Venue Partners',
    sub: 'Get in front of local explorers',
    body: `<p>Get your attraction, venue, or experience in front of City Bucket List members planning their next outing — sponsored spots appear first, plus ticketed bookings and a partner badge. ${SAAS_NOTE}</p>`,
  },
  '/affiliates': {
    title: 'Affiliate & Commission Program | City Bucket List',
    description:
      'Join the City Bucket List partner network and earn commission across the platform — transportation, restaurants, attractions, travel, and more.',
    eyebrow: 'partners · commission program',
    h1: 'Affiliate & Commission Program',
    sub: 'Earn across the platform',
    body: `<p>Join the City Bucket List partner network and earn commission across the platform — transportation, restaurants, attractions, and travel. ${SAAS_NOTE}</p>`,
  },
  '/faq': {
    title: 'FAQ — How City Bucket List Works | City Bucket List',
    description:
      'Frequently asked questions about City Bucket List — is it a rideshare company, how membership works, how payments work, and how drivers and riders connect.',
    eyebrow: 'questions · how the platform works',
    h1: 'Frequently Asked Questions',
    body: `<p>Answers to common questions about City Bucket List. ${SAAS_NOTE} It connects members who schedule rides directly with independent contractors they already know.</p>`,
  },
  '/contact': {
    title: 'Contact — We’re Here to Help | City Bucket List',
    description: 'Get in touch with the City Bucket List team — support, partnerships, and general questions.',
    eyebrow: 'support · we’re here to help',
    h1: 'Contact City Bucket List',
    body: `<p>Get in touch with the City Bucket List team for support, partnerships, or general questions. ${SAAS_NOTE}</p>`,
  },
  '/login': {
    title: 'Join Free or Sign In | City Bucket List',
    description:
      'Join City Bucket List free or sign in — a private membership for scheduled rides, local eats, attractions, and travel, with your AI concierge Buckee.',
    eyebrow: 'private membership · free to join',
    h1: 'Join City Bucket List',
    sub: 'Free to join',
    body: `<p>Join City Bucket List free or sign in to your account. ${SAAS_NOTE}</p>`,
  },
  '/delivery': {
    title: 'CBL Delivery — Coming Soon | City Bucket List',
    description:
      'Same-day local delivery powered by independent local drivers — coming soon from City Bucket List. Leave your email and we’ll let you know the moment it’s live.',
    eyebrow: 'coming soon',
    h1: 'CBL Delivery',
    sub: 'Same-day local delivery, coming soon',
    body: `<p>Same-day local delivery, powered by independent local drivers — coming soon. ${SAAS_NOTE}</p>`,
  },
  '/feedback': {
    title: 'Feedback — Tell Us What You Think | City Bucket List',
    description: 'Share your feedback with the City Bucket List team. We read every one.',
    eyebrow: 'your voice · we read every one',
    h1: 'Share Your Feedback',
    body: `<p>Tell us what you think — we read every message. ${SAAS_NOTE}</p>`,
  },
  '/terms': {
    title: 'Terms & Conditions | City Bucket List',
    description: 'The terms and conditions for using City Bucket List, operated by Citybucketlist.com, LLC.',
    eyebrow: 'legal',
    h1: 'Terms & Conditions',
    body: `<p>The terms and conditions for using City Bucket List, operated by Citybucketlist.com, LLC. ${SAAS_NOTE}</p>`,
  },
};

function renderStatic(p: StaticPage): string {
  return `<main><p>${esc(p.eyebrow)}</p><h1>${esc(p.h1)}</h1>${p.sub ? `<p>${esc(p.sub)}</p>` : ''}${p.body}</main>`;
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
      logo: { '@type': 'ImageObject', url: `${origin}/CBL-1024.png` },
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

  // Only rewrite successful 200 OK HTML documents. Pass through 304 Not Modified,
  // redirects, and errors untouched to avoid body-reading crashes or blank pages.
  if (res.status !== 200) return res;

  const ctype = res.headers.get('content-type') || '';
  // Only rewrite HTML documents; let static assets (images, etc.) pass through.
  if (!ctype.includes('text/html')) return res;

  // Clone the response first so we can fall back to the original response
  // if reading or parsing the text body fails.
  const fallbackRes = res.clone();

  try {
    let html = await res.text();
    const finish = () =>
      new Response(html, {
        status: 200,
        headers: { 'content-type': 'text/html; charset=utf-8', 'x-cbl-prerender': '1', ...SECURITY_HEADERS },
      });

    try {
      const path = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '') || '/';

    // Static marketing pages (home + section/landing pages).
    const staticPage = STATIC_PAGES[path];
    if (staticPage) {
      const canonical = `${origin}${path === '/' ? '/' : path}`;
      const jsonld =
        path === '/'
          ? {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'City Bucket List',
              url: `${origin}/`,
              logo: `${origin}/CBL-1024.png`,
              description: staticPage.description,
              sameAs: [
                'https://www.youtube.com/@CitybucketlistCBL',
                'https://www.instagram.com/citybucketlist_pittsburgh/',
                'https://www.tiktok.com/@citybucketlist.com',
                'https://x.com/citybucketlists',
                'https://www.facebook.com/groups/cbl.mobi',
              ],
            }
          : {
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: staticPage.title,
              description: staticPage.description,
              url: canonical,
            };
      html = injectHead(html, {
        title: staticPage.title,
        description: staticPage.description,
        url: canonical,
        image: absUrl(origin, null),
        type: 'website',
        jsonld,
      });
      html = injectRoot(html, renderStatic(staticPage));
      return finish();
    }

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
  } catch (_err) {
    return fallbackRes;
  }
}
