import { useState } from 'react';

/**
 * CBL Blog share bar — X, Facebook, LinkedIn, Copy Link.
 * Per CBL Blog UI standards: max 3–4 icons, Copy Link gets priority placement
 * (it's the most-used). Uses the live page URL so it's correct per-environment
 * and picks up the canonical citybucketlist.com URL once the blog is on prod.
 */

const GOLD = '#C99742';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const CSS = `
.cbl-share { display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin:0 0 26px; }
.cbl-share .lbl { font-family:${MONO}; font-size:10.5px; letter-spacing:.16em; text-transform:uppercase; color:#7d7d7d; margin-right:2px; }
.cbl-share button, .cbl-share a {
  display:inline-flex; align-items:center; gap:7px; cursor:pointer;
  background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.12);
  color:#D8D8D8; border-radius:999px; padding:8px 13px;
  font-family:${MONO}; font-size:11px; letter-spacing:.06em; text-transform:uppercase;
  text-decoration:none; transition:border-color .18s, color .18s, background .18s;
}
.cbl-share button:hover, .cbl-share a:hover { border-color:${GOLD}; color:#fff; background:rgba(201,151,66,.12); }
.cbl-share svg { width:15px; height:15px; display:block; }
/* Copy Link = priority: filled gold */
.cbl-share .copy { background:${GOLD}; border-color:${GOLD}; color:#000; font-weight:700; }
.cbl-share .copy:hover { background:#DDB15F; border-color:#DDB15F; color:#000; }
.cbl-share .copy.done { background:#4DBF66; border-color:#4DBF66; color:#000; }
`;

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const t = encodeURIComponent(title);
  const u = encodeURIComponent(url);

  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer,width=600,height=560');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for older browsers / insecure contexts
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="cbl-share">
      <style>{CSS}</style>
      <span className="lbl">Share</span>
      <button
        className={`copy${copied ? ' done' : ''}`}
        onClick={copy}
        aria-label="Copy link to this story"
      >
        {copied ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        )}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
      <button onClick={() => open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`)} aria-label="Share on X">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.657l-5.214-6.817-5.966 6.817H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
        </svg>
        X
      </button>
      <button onClick={() => open(`https://www.facebook.com/sharer/sharer.php?u=${u}`)} aria-label="Share on Facebook">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
        </svg>
        Facebook
      </button>
      <button onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`)} aria-label="Share on LinkedIn">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5ZM3 9h4v12H3V9Zm7 0h3.83v1.64h.05c.53-1 1.84-2.06 3.79-2.06 4.05 0 4.8 2.67 4.8 6.14V21h-4v-5.44c0-1.3-.02-2.97-1.81-2.97-1.81 0-2.09 1.42-2.09 2.88V21h-4V9Z" />
        </svg>
        LinkedIn
      </button>
    </div>
  );
}
