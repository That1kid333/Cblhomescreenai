import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { getPostBySlug, type BlogPost as Post } from '../lib/blog';
import { Markdown } from '../components/Markdown';
import { LikeButton } from '../components/LikeButton';
import { ShareBar } from '../components/ShareBar';
import { ReadingProgress } from '../components/ReadingProgress';

/** Rough read time from the markdown body (~200 wpm, floor of 1 min). */
function readMinutes(md?: string | null): number {
  if (!md) return 0;
  const words = md.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/**
 * CBL Blog — post detail (/blog/:slug). Renders the "Where the Locals Go"
 * template: kicker, title, dek, byline, hero, markdown body (which already
 * carries the driver's-take pull-quote), then the first-party media gallery.
 */

const GOLD = '#C99742';
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const ITALIC = "'Playfair Display', serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const CSS = `
.cbl-post { background:#0A0A0A; color:#EDEDED; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; min-height:100vh; }
.cbl-post *,.cbl-post *::before,.cbl-post *::after { box-sizing:border-box; }
.cbl-post a { color:${GOLD}; }
.cbl-post .col { padding:0 22px; }
.cbl-post .col-inner { max-width:1080px; margin:0 auto; }
.cbl-post .col-inner > .body, .cbl-post .col-inner > .gallery, .cbl-post .col-inner > .likebar, .cbl-post .col-inner > .foot { max-width:720px; }

.cbl-post .back { display:inline-block; margin:26px 0 4px; font-family:${MONO}; font-size:11px; letter-spacing:.1em; text-transform:uppercase; color:#8a8a8a; }
.cbl-post .back:hover { color:${GOLD}; }

.cbl-post .kick { font-family:${MONO}; font-size:11px; letter-spacing:.16em; text-transform:uppercase; color:${GOLD}; margin:22px 0 12px; }
.cbl-post h1.title { font-family:${DISPLAY}; font-weight:900; font-size:clamp(32px,5.2vw,52px); line-height:1.02; letter-spacing:-.015em; color:#fff; margin:0 0 14px; }
.cbl-post .dek { font-family:${ITALIC}; font-style:italic; font-size:clamp(17px,2.4vw,21px); line-height:1.45; color:#C7C7C7; margin:0 0 18px; }
.cbl-post .by { font-family:${MONO}; font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:#8a8a8a; margin-bottom:24px; }
.cbl-post .by b { color:${GOLD}; font-weight:700; }

/* header: title/dek/byline beside the hero image; body flows below */
.cbl-post .head { padding:0 22px; }
.cbl-post .head-inner { max-width:1080px; margin:0 auto; display:grid; grid-template-columns:1.05fr .95fr; gap:42px; align-items:center; padding:6px 0 30px; }
.cbl-post .head-text { min-width:0; }
.cbl-post .head-media img { width:100%; border-radius:16px 0 16px 0; display:block; box-shadow:0 16px 44px rgba(0,0,0,.55); }
/* no hero photo: collapse to a single left-aligned column (title + body align left) */
.cbl-post .head-inner.no-media { grid-template-columns:1fr; }
.cbl-post .head-inner.no-media .head-text { max-width:760px; }
@media (max-width:860px){
  .cbl-post .head-inner { grid-template-columns:1fr; gap:20px; padding-bottom:20px; }
  .cbl-post .head-media { margin-top:4px; }
}

/* article body */
.cbl-post .body { font-size:18px; line-height:1.72; color:#DcDcDc; }
.cbl-post .body p { margin:0 0 20px; }
.cbl-post .body h2 { font-family:${DISPLAY}; font-weight:900; font-size:26px; line-height:1.15; letter-spacing:-.01em; color:#fff; margin:36px 0 14px; }
.cbl-post .body h3 { font-family:${DISPLAY}; font-weight:800; font-size:20px; color:#fff; margin:28px 0 10px; }
.cbl-post .body ul { margin:0 0 20px; padding-left:0; list-style:none; }
.cbl-post .body li { position:relative; padding-left:22px; margin-bottom:11px; }
.cbl-post .body li::before { content:''; position:absolute; left:0; top:11px; width:8px; height:8px; border-radius:50%; background:${GOLD}; }
.cbl-post .body strong { color:#fff; font-weight:700; }
.cbl-post .body blockquote { margin:30px 0; padding:20px 26px; border-left:3px solid ${GOLD}; background:rgba(201,151,66,.07); border-radius:0 10px 10px 0; }
.cbl-post .body blockquote p { margin:0 0 6px; font-family:${ITALIC}; font-style:italic; font-size:20px; line-height:1.5; color:#F0E6D2; }
.cbl-post .body blockquote p:last-child { margin:0; }

/* Driver's Take — a dedicated optional callout (renders only when the field is filled) */
.cbl-post .dtake { max-width:720px; margin:38px 0 6px; padding:22px 26px; border-left:3px solid ${GOLD}; background:rgba(201,151,66,.08); border-radius:0 14px 14px 0; }
.cbl-post .dtake .dtake-label { font-family:${MONO}; font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:${GOLD}; margin-bottom:10px; }
.cbl-post .dtake blockquote { margin:0; font-family:${ITALIC}; font-style:italic; font-size:21px; line-height:1.5; color:#F0E6D2; }
.cbl-post .dtake .dtake-by { margin-top:10px; font-family:${DISPLAY}; font-weight:800; font-size:13px; letter-spacing:.04em; text-transform:uppercase; color:#fff; }

/* media gallery */
.cbl-post .gallery { margin:40px 0 20px; display:flex; flex-direction:column; gap:22px; }
.cbl-post .gallery .m img, .cbl-post .gallery .m video { width:100%; border-radius:14px 0 14px 0; display:block; background:#000; }
.cbl-post .gallery .cap { margin-top:8px; font-family:${MONO}; font-size:10.5px; letter-spacing:.04em; color:#888; }
.cbl-post .gallery .cap b { color:${GOLD}; }

.cbl-post .likebar { margin-top:38px; display:flex; justify-content:center; }
.cbl-post .foot { border-top:1px solid rgba(255,255,255,.08); margin-top:34px; padding:26px 0 70px; }
.cbl-post .foot-share { margin-bottom:22px; }
.cbl-post .foot-share-label { font-family:${DISPLAY}; font-weight:800; font-size:15px; color:#fff; margin-bottom:12px; }
.cbl-post .foot a.more { font-family:${MONO}; font-size:11px; letter-spacing:.1em; text-transform:uppercase; }
.cbl-post .state { text-align:center; padding:120px 24px; color:#888; }
`;

export function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<Post | null | undefined>(undefined); // undefined=loading, null=not found

  useEffect(() => {
    let live = true;
    if (!slug) return;
    getPostBySlug(slug).then((p) => {
      if (live) setPost(p);
    });
    return () => {
      live = false;
    };
  }, [slug]);

  useEffect(() => {
    if (post) document.title = `${post.seo_title || post.title} — CBL Blog`;
  }, [post]);

  if (post === undefined) return <main className="cbl-post"><style>{CSS}</style><div className="state">Loading…</div></main>;
  if (post === null)
    return (
      <main className="cbl-post">
        <style>{CSS}</style>
        <div className="col">
          <div className="state">
            <p>That story isn’t here.</p>
            <Link to="/blog" className="back">← Back to the blog</Link>
          </div>
        </div>
      </main>
    );

  const hero = post.hero_image;
  const heroAlt = post.media.find((m) => m.slot === 'hero')?.alt || post.title;
  const gallery = post.media.filter((m) => m.url !== hero); // everything except the hero already shown
  const mins = readMinutes(post.body_md);

  return (
    <main className="cbl-post">
      <style>{CSS}</style>
      <ReadingProgress />
      <div className="head">
        <div className={`head-inner${hero ? '' : ' no-media'}`}>
          <div className="head-text">
            <Link to="/blog" className="back">← The CBL Blog</Link>
            {post.kicker && <div className="kick">{post.kicker}</div>}
            <h1 className="title">{post.title}</h1>
            {post.subtitle && <p className="dek">{post.subtitle}</p>}
            {(post.author_name || mins > 0) && (
              <div className="by">
                {post.author_name && <>By <b>{post.author_name}</b></>}
                {post.author_name && post.city ? ` · ${post.city}` : (!post.author_name && post.city ? post.city : '')}
                {mins > 0 && <>{post.author_name || post.city ? ' · ' : ''}{mins} min read</>}
              </div>
            )}
            <ShareBar title={post.title} />
          </div>
          {hero && (
            <div className="head-media">
              <img src={hero} alt={heroAlt} />
            </div>
          )}
        </div>
      </div>

      <div className="col">
        <div className="col-inner">
        <div className="body">{post.body_md && <Markdown source={post.body_md} />}</div>

        {post.drivers_take && (
          <div className="dtake">
            <div className="dtake-label">Driver's Take</div>
            <blockquote>{post.drivers_take}</blockquote>
            {post.drivers_take_name && <div className="dtake-by">— {post.drivers_take_name}</div>}
          </div>
        )}
        {post.riders_take && (
          <div className="dtake">
            <div className="dtake-label">Rider's Take</div>
            <blockquote>{post.riders_take}</blockquote>
            {post.riders_take_name && <div className="dtake-by">— {post.riders_take_name}</div>}
          </div>
        )}

        {gallery.length > 0 && (
          <div className="gallery">
            {gallery.map((m, i) =>
              m.type === 'video' ? (
                <div className="m" key={i}>
                  <video controls preload="none" poster={m.poster} playsInline>
                    <source src={m.url} type="video/mp4" />
                  </video>
                  {(m.alt || m.credit) && (
                    <div className="cap">
                      {m.alt}
                      {m.credit ? <> — <b>{m.credit}</b></> : null}
                    </div>
                  )}
                </div>
              ) : (
                <div className="m" key={i}>
                  <img src={m.url} alt={m.alt || ''} />
                  {m.alt && <div className="cap">{m.alt}</div>}
                </div>
              ),
            )}
          </div>
        )}

        <div className="likebar">
          <LikeButton slug={post.slug} />
        </div>

        <div className="foot">
          <div className="foot-share">
            <div className="foot-share-label">Know someone who’d love this?</div>
            <ShareBar title={post.title} />
          </div>
          <Link to="/blog" className="more">← More from the CBL Blog</Link>
        </div>
        </div>
      </div>
    </main>
  );
}
