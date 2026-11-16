import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';

/**
 * Branded "page not found" (SEO audit, Nov 2026).
 *
 * Before this, any wrong or old address (/fun-facts, a typo) answered "OK" with
 * the home page's title and then showed React Router's developer error screen,
 * so Google counted those addresses as duplicate home pages. Netlify now serves
 * unknown addresses with a real 404 status (see the last rule in netlify.toml),
 * and this page is what a visitor sees there. The noindex tag is belt and braces
 * for the in-app case, where a bad link is followed without a fresh page load.
 */

const GOLD = '#C99742';
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const MAP_BG = '/eats/imagery/cbl-map-backdrop.jpg';

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/eats-and-drinks', label: 'Eats & Drinks' },
  { to: '/attractions', label: 'Attractions' },
  { to: '/transportation', label: 'Transportation' },
  { to: '/blog', label: 'CBL Blog' },
  { to: '/directory', label: 'Directory' },
];

const CSS = `
.cbl-404 { background:#0A0A0A; color:#fff; min-height:70vh; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-404 .hero {
  background:
    linear-gradient(180deg, rgba(10,10,10,.25) 0%, rgba(10,10,10,.6) 45%, rgba(10,10,10,.95) 90%, #0A0A0A 100%),
    url('${MAP_BG}') center top / cover no-repeat;
  padding:72px 24px 96px; text-align:center;
}
.cbl-404 .eyebrow { font-family:${MONO}; font-size:12px; letter-spacing:.16em; text-transform:lowercase; color:${GOLD}; font-weight:700; margin-bottom:14px; }
.cbl-404 h1 { font-weight:900; font-size:clamp(40px,7vw,72px); line-height:.96; letter-spacing:-.02em; text-transform:uppercase; margin:0 0 16px; }
.cbl-404 h1 span { color:${GOLD}; }
.cbl-404 p { color:#B8B8B8; font-size:17px; line-height:1.55; max-width:46ch; margin:0 auto 28px; }
.cbl-404 .links { display:flex; flex-wrap:wrap; justify-content:center; gap:10px; max-width:640px; margin:0 auto; }
.cbl-404 .links a {
  display:inline-flex; padding:10px 20px; border-radius:999px; border:1px solid rgba(201,151,66,.55);
  color:#fff; font-weight:800; font-size:13px; letter-spacing:.1em; text-transform:uppercase; text-decoration:none;
  transition:background .2s, color .2s;
}
.cbl-404 .links a:first-child { background:${GOLD}; color:#000; border-color:${GOLD}; }
.cbl-404 .links a:hover { background:${GOLD}; color:#000; }
`;

export function NotFound() {
  const { pathname } = useLocation();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Page not found | City Bucket List';
    const robots = document.createElement('meta');
    robots.name = 'robots';
    robots.content = 'noindex';
    document.head.appendChild(robots);
    return () => {
      document.title = prevTitle;
      robots.remove();
    };
  }, [pathname]);

  return (
    <main className="cbl-404">
      <style>{CSS}</style>
      <section className="hero">
        <div className="eyebrow">404 · this stop isn't on the list</div>
        <h1>
          Page <span>not found</span>
        </h1>
        <p>The page you were looking for has moved or never existed. Pick up where the locals go:</p>
        <nav className="links" aria-label="Popular pages">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to}>
              {l.label}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}
