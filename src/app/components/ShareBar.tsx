import { useEffect, useState } from 'react';

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

/* ── Mobile ──────────────────────────────────────────────────────────────────
   Four pills plus a label wrap onto two rows on a phone, and on the Directory
   they sat under three scope pills and a search box — five rows of controls
   before any content (Keith, 2026-08-24).

   A dropdown would save the space but still ends at the same four destinations.
   The phone already has a better answer: navigator.share opens the OS sheet,
   which is ONE tap and offers Messages, WhatsApp, Mail and everything else the
   person actually uses. So on a narrow screen we show a single Share button and
   hide the row; the full row stays on desktop, where there is room and no share
   sheet worth calling. When navigator.share is missing, .cbl-share-native is
   never rendered and the row shows as before — no capability is lost. */
.cbl-share-native { display:none; }
@media (max-width: 700px) {
  .cbl-share.has-native { display:none; }
  .cbl-share-native { display:flex; align-items:center; gap:8px; margin:0 0 18px; }
  .cbl-share-native button {
    display:inline-flex; align-items:center; gap:8px; cursor:pointer;
    background:${GOLD}; border:1px solid ${GOLD}; color:#000; font-weight:700;
    border-radius:999px; padding:9px 16px;
    font-family:${MONO}; font-size:11px; letter-spacing:.06em; text-transform:uppercase;
  }
  .cbl-share-native svg { width:15px; height:15px; display:block; }
}
`;

/**
 * `url` overrides the page URL — used by the Directory to share ONE listing via
 * its /directory?listing=<id> deep link rather than whatever page you happen to
 * be on. Defaults to the current page, so the blog keeps working unchanged.
 */
export function ShareBar({ title, url: urlProp }: { title: string; url?: string }) {
  const [copied, setCopied] = useState(false);
  // Runtime check, not a media query: navigator.share exists on phones and on
  // some desktops, and is absent in prerender. Set after mount so the server-side
  // shell and the first client render agree.
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && typeof navigator.share === 'function');
  }, []);
  const url = urlProp ?? (typeof window !== 'undefined' ? window.location.href : '');
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
    <>
      <style>{CSS}</style>
      {canNativeShare && (
        <div className="cbl-share-native">
          <button
            type="button"
            onClick={() => {
              // A dismissed share sheet rejects with AbortError. That is a normal
              // user action, not a failure, so swallow it rather than logging.
              navigator.share({ title, url }).catch(() => {});
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            Share
          </button>
        </div>
      )}
      <div className={`cbl-share${canNativeShare ? ' has-native' : ''}`}>
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
    </>
  );
}
