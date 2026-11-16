/**
 * IndexNow ping after each production deploy (SEO audit, Nov 2026).
 *
 * Netlify runs a function named "deploy-succeeded" by itself when a deploy goes
 * live; nobody calls it. It tells Bing, Yandex, Seznam, Naver and the other
 * IndexNow engines (Bing in turn feeds ChatGPT search, Copilot, DuckDuckGo and
 * Yahoo) that the site's pages changed, so they recrawl in hours, not weeks.
 *
 * What it sends: the main pages, plus blog posts updated in the last 7 days,
 * read from our own /sitemap.xml. Directory listings are left out: there can be
 * hundreds and they change on their own schedule.
 *
 * The key is public by design. IndexNow proves we own the site by fetching
 * https://citybucketlist.com/<key>.txt, which lives in public/. To change the
 * key, rename that file and change KEY below in the same commit.
 *
 * Deploy previews and branch deploys are skipped. Any failure is logged and
 * swallowed: a missed ping must never look like a failed deploy.
 */

const HOST = 'citybucketlist.com';
const KEY = 'cfb550d7974584458cbd20a2f1d08263';
const RECENT_DAYS = 7;

export const handler = async (event) => {
  let deploy = {};
  try {
    deploy = JSON.parse(event.body || '{}').payload || {};
  } catch {
    deploy = {};
  }
  if (deploy.context !== 'production') {
    console.log(`[indexnow] skipped: deploy context is ${deploy.context || 'unknown'}`);
    return { statusCode: 200, body: 'skipped' };
  }

  try {
    const res = await fetch(`https://${HOST}/sitemap.xml`);
    const xml = res.ok ? await res.text() : '';
    const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
    const urls = [];
    for (const m of xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)) {
      const loc = m[1].replace(/&amp;/g, '&');
      if (!loc.startsWith(`https://${HOST}/`) || loc.includes('?listing=')) continue;
      const lastmod = m[2] ? Date.parse(m[2]) : NaN;
      // No date = a main page, which can change with any deploy.
      if (Number.isNaN(lastmod) || lastmod >= cutoff) urls.push(loc);
    }
    if (!urls.length) {
      console.log('[indexnow] no URLs read from the sitemap; nothing sent');
      return { statusCode: 200, body: 'empty' };
    }
    const ping = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: HOST,
        key: KEY,
        keyLocation: `https://${HOST}/${KEY}.txt`,
        urlList: urls.slice(0, 10000),
      }),
    });
    console.log(`[indexnow] sent ${urls.length} URLs, answer ${ping.status}`);
  } catch (err) {
    console.log(`[indexnow] ping failed: ${err && err.message ? err.message : err}`);
  }
  return { statusCode: 200, body: 'ok' };
};
