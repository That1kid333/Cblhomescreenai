import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { APP_URL } from '../lib/constants';
import { useAuth, firstNameOf } from '../lib/auth';

/**
 * MemberCard — the signed-in member's digital business card.
 *
 * Opens from the header avatar: photo, welcome-back greeting, member-since,
 * their referral QR code + link with native Share / Copy, live referral
 * count, a gateway to the full app dashboard, and sign out. Follows the
 * JoinModal overlay conventions (.cbl-card scoped CSS, focus trap, Esc and
 * backdrop close, onClose held in a ref so parent re-renders never re-run
 * the open effect).
 */

const GOLD = '#C99742';
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';
const ITALIC = "'Playfair Display', serif";

const CARD_CSS = `
.cbl-card { position:fixed; inset:0; z-index:1000; display:grid; place-items:center; padding:16px; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-card *,.cbl-card *::before,.cbl-card *::after { box-sizing:border-box; }
.cbl-card .backdrop { position:absolute; inset:0; background:rgba(0,0,0,.7); backdrop-filter:blur(2px); }
.cbl-card .panel {
  position:relative; width:min(400px,100%); max-height:calc(100dvh - 32px); overflow-y:auto;
  background:#141414; border:1px solid rgba(201,151,66,.45); border-radius:18px 0 18px 0;
  box-shadow:0 18px 44px rgba(0,0,0,.55); padding:28px; text-align:center;
  animation:cbl-card-pop .26s cubic-bezier(.2,.9,.3,1.25) both;
}
@keyframes cbl-card-pop { 0% { opacity:0; transform:translateY(8px) scale(.96); } 100% { opacity:1; transform:translateY(0) scale(1); } }
@media (prefers-reduced-motion: reduce) { .cbl-card .panel { animation:none; } }

.cbl-card .close { position:absolute; top:12px; right:12px; background:transparent; border:0; color:#888; cursor:pointer; font-size:15px; line-height:1; padding:6px 8px; }
.cbl-card .close:hover { color:#fff; }

.cbl-card .avatar {
  width:92px; height:92px; margin:0 auto 12px; border-radius:50%; border:3px solid ${GOLD};
  overflow:hidden; display:grid; place-items:center;
  background:radial-gradient(circle at 50% 35%, #2a2a2a, #0f0f0f);
  font-family:${DISPLAY}; font-weight:900; font-size:34px; color:${GOLD};
}
.cbl-card .avatar img { width:100%; height:100%; object-fit:cover; display:block; }

.cbl-card .eyebrow { font-family:${MONO}; font-size:10.5px; letter-spacing:.18em; text-transform:uppercase; color:${GOLD}; margin-bottom:6px; }
.cbl-card h2 { font-family:${DISPLAY}; font-weight:900; font-size:26px; line-height:1; letter-spacing:-.01em; text-transform:uppercase; color:#fff; margin:0 0 4px; }
.cbl-card h2 .it { font-family:${ITALIC}; font-style:italic; font-weight:600; color:${GOLD}; text-transform:none; }
.cbl-card .since { font-family:${MONO}; font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:#8a8a8a; margin-bottom:16px; }

.cbl-card .qr-wrap { display:inline-block; background:#fff; border-radius:14px; padding:10px; border:1px solid rgba(201,151,66,.4); }
.cbl-card .qr-wrap img { width:164px; height:164px; display:block; }
.cbl-card .scan { font-family:${MONO}; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#B8B8B8; margin:10px 0 2px; }
.cbl-card .link { font-family:${MONO}; font-size:11px; letter-spacing:.02em; color:${GOLD}; word-break:break-all; margin-bottom:14px; }

.cbl-card .count { font-size:13.5px; line-height:1.5; color:#B8B8B8; margin:0 0 16px; }
.cbl-card .count b { color:${GOLD}; font-weight:800; }

.cbl-card .row { display:flex; gap:10px; margin-bottom:10px; }
.cbl-card .row button {
  flex:1; cursor:pointer; background:transparent; border:1.5px solid rgba(255,255,255,.22);
  border-radius:999px; padding:11px 10px; color:#fff; font-family:${DISPLAY};
  font-weight:800; font-size:12px; letter-spacing:.1em; text-transform:uppercase;
  transition:border-color .2s, color .2s;
}
.cbl-card .row button:hover { border-color:${GOLD}; color:${GOLD}; }

.cbl-card .go {
  display:flex; align-items:center; justify-content:center; gap:8px; width:100%;
  background:${GOLD}; color:#000; border:0; border-radius:999px; padding:13px 30px;
  font-family:${DISPLAY}; font-weight:900; font-size:13px; letter-spacing:.14em;
  text-transform:uppercase; text-decoration:none; transition:background .2s;
}
.cbl-card .go:hover { background:#DDB15F; }

.cbl-card .signout { margin-top:14px; background:transparent; border:0; cursor:pointer; font-family:${MONO}; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#8a8a8a; }
.cbl-card .signout:hover { color:#fff; }

@media (max-width:420px) {
  .cbl-card .panel { padding:24px 18px; }
  .cbl-card .qr-wrap img { width:148px; height:148px; }
}
`;

type MemberCardProps = { open: boolean; onClose: () => void };

export function MemberCard({ open, onClose }: MemberCardProps) {
  const { session, profile, referralCount, signOut } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const firstName = firstNameOf(profile, session);
  const referralLink = profile?.referral_code ? `${APP_URL}/r/${profile.referral_code}` : APP_URL;
  // Format in UTC so a midnight-UTC created_at doesn't drift into the prior
  // month for US timezones.
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    : null;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    QRCode.toDataURL(referralLink, { margin: 0, width: 512, color: { dark: '#000000', light: '#FFFFFF' } })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, referralLink]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the link is visible to copy manually */
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on City Bucket List',
          text: `Join City Bucket List with my code — rides with trusted local drivers, local eats, attractions & member savings.`,
          url: referralLink,
        });
        return;
      } catch {
        /* user dismissed the share sheet — fall through to copy */
      }
    }
    copyLink();
  };

  return (
    <div className="cbl-card" role="dialog" aria-modal="true" aria-labelledby="cbl-card-title">
      <style>{CARD_CSS}</style>
      <div className="backdrop" onClick={onClose} />
      <div className="panel" ref={panelRef}>
        <button className="close" aria-label="Close" onClick={onClose}>✕</button>

        <div className="avatar">
          {profile?.photo ? <img src={profile.photo} alt={firstName} /> : <span>{firstName.charAt(0)}</span>}
        </div>

        <div className="eyebrow">your digital business card</div>
        <h2 id="cbl-card-title">
          Welcome back, <span className="it">{firstName}.</span>
        </h2>
        {memberSince && <div className="since">CBL member since {memberSince}</div>}

        {qrDataUrl && (
          <div className="qr-wrap">
            <img src={qrDataUrl} alt={`Referral QR code — scan to join City Bucket List under ${firstName}'s code`} />
          </div>
        )}
        <div className="scan">Scan to join under your code</div>
        <div className="link">{referralLink.replace('https://', '')}</div>

        <p className="count">
          {referralCount && referralCount > 0 ? (
            <>
              <b>{referralCount}</b> {referralCount === 1 ? 'friend has' : 'friends have'} joined with your code — keep sharing, keep earning.
            </>
          ) : (
            <>Share your code with riders, drivers &amp; local businesses — earn on every signup.</>
          )}
        </p>

        <div className="row">
          <button onClick={shareLink}>Share</button>
          <button onClick={copyLink}>{copied ? 'Copied ✓' : 'Copy link'}</button>
        </div>
        <a className="go" href={APP_URL}>Open your dashboard →</a>

        <button
          className="signout"
          onClick={async () => {
            await signOut();
            onCloseRef.current();
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
