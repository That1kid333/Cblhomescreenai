import { useEffect, useRef, useState } from 'react';
import { getLikeState, toggleLike } from '../lib/blog';

/**
 * Reader like button for a blog post. One like per device (no login) — the
 * device id lives in localStorage and the server dedupes. Optimistic UI.
 */

const GOLD = '#C99742';
const DISPLAY = "'myriad-pro', 'Source Sans 3', sans-serif";

const CSS = `
.cbl-like { display:inline-flex; align-items:center; gap:10px; cursor:pointer; background:transparent;
  border:1.5px solid rgba(201,151,66,.5); border-radius:999px; padding:11px 20px; color:#EDEDED;
  font-family:${DISPLAY}; font-weight:800; font-size:13px; letter-spacing:.06em; text-transform:uppercase;
  transition:background .2s, color .2s, border-color .2s; }
.cbl-like:hover { border-color:${GOLD}; }
.cbl-like .heart { font-size:17px; line-height:1; color:${GOLD}; transition:transform .18s; }
.cbl-like.on { background:rgba(201,151,66,.12); border-color:${GOLD}; color:#fff; }
.cbl-like.on .heart { transform:scale(1.12); }
.cbl-like:disabled { opacity:.7; cursor:default; }
`;

export function LikeButton({ slug }: { slug: string }) {
  const [likes, setLikes] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const busy = useRef(false);

  useEffect(() => {
    let live = true;
    getLikeState(slug).then((s) => {
      if (live) {
        setLikes(s.likes);
        setLiked(s.liked);
      }
    });
    return () => {
      live = false;
    };
  }, [slug]);

  const onClick = async () => {
    if (busy.current) return;
    busy.current = true;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikes((n) => Math.max(0, (n ?? 0) + (nextLiked ? 1 : -1))); // optimistic
    try {
      const s = await toggleLike(slug);
      setLikes(s.likes);
      setLiked(s.liked);
    } catch {
      // revert on failure
      setLiked(!nextLiked);
      setLikes((n) => Math.max(0, (n ?? 0) + (nextLiked ? -1 : 1)));
    } finally {
      busy.current = false;
    }
  };

  const label = likes == null ? '' : `${likes} ${likes === 1 ? 'like' : 'likes'}`;

  return (
    <>
      <style>{CSS}</style>
      <button className={`cbl-like${liked ? ' on' : ''}`} onClick={onClick} aria-pressed={liked}>
        <span className="heart">{liked ? '♥' : '♡'}</span>
        <span>{liked ? 'Liked' : 'Like this'}</span>
        {label && <span style={{ opacity: 0.7, fontWeight: 700 }}>· {label}</span>}
      </button>
    </>
  );
}
