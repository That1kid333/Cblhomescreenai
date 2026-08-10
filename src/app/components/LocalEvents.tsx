import { useEffect, useState } from 'react';
import { ticketmasterEventHref, AFFILIATE_REL, PARTNER_META } from '../lib/affiliates';
import type { Coords } from '../lib/location';

/**
 * Real upcoming events near the visitor, from the Ticketmaster Discovery API
 * (netlify/functions/events.js).
 *
 * These do NOT live in a section of their own. Keith's call: the page already
 * has a Sports/Music/Arts rail at the top, so a second set of category buttons
 * asked the same question twice. Instead the event segment FOLLOWS the page's
 * active category, and the cards are woven into the attractions grid — a
 * Steelers game sits beside the Warhol as another thing to do tonight, rather
 * than in a walled-off "affiliate" box further down.
 *
 * Ticket cards stay visually identifiable (gold TICKETS tag + the Ticketmaster
 * wordmark on every card), so a monetized listing is never mistaken for an
 * editorial pick.
 */

const GOLD = '#C99742';
const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";

export type TMEvent = {
  id: string;
  name: string;
  date: string | null;
  time: string | null;
  segment: string | null;
  genre: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  priceFrom: number | null;
  currency: string;
  image: string | null;
  url: string | null;
};

/**
 * Page category → Discovery segmentName. The page's own rail is the control, so
 * these must line up with CATS in Attractions.tsx. OUTDOORS has no ticketed
 * equivalent, and TOP PICKS deliberately returns '' so the mixed grid shows
 * whatever is on rather than only sport.
 */
export function ticketSegmentFor(cat: string): string {
  switch (cat) {
    case 'SPORTS': return 'Sports';
    case 'MUSIC': return 'Music';
    case 'NIGHT': return 'Music';       // nightlife → live music is the closest ticketed match
    case 'ARTS': return 'Arts & Theatre';
    case 'FAMILY': return 'Family';
    case 'ALL': return '';              // no filter — anything on sale nearby
    default: return '';
  }
}

/** Fetch events near `coords` for a Discovery segment ('' = all segments). */
export function useLocalEvents(coords: Coords | null | undefined, segment: string, enabled = true) {
  const [events, setEvents] = useState<TMEvent[]>([]);

  useEffect(() => {
    if (!coords || !enabled) { setEvents([]); return; }
    let cancelled = false;
    const qs = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      size: '8',
      radius: '50',
    });
    if (segment) qs.set('segment', segment);
    fetch(`/api/events?${qs}`)
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => { if (!cancelled) setEvents(Array.isArray(d?.events) ? d.events : []); })
      .catch(() => { if (!cancelled) setEvents([]); });
    return () => { cancelled = true; };
  }, [coords?.lat, coords?.lng, segment, enabled]);

  // Only events we can actually sell — no URL means no tracked link, which would
  // be a dead end on a card that promises tickets.
  return events.filter((e) => e.url);
}

/** "Wed, Aug 13" built from local parts — new Date("2026-08-13") parses as UTC
 *  and would render a Thursday game as Wednesday for every US visitor. */
function formatDate(date: string | null): string {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });
}

function formatTime(time: string | null): string {
  if (!time) return '';
  const [h, min] = time.split(':').map(Number);
  if (Number.isNaN(h)) return '';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(min ?? 0).padStart(2, '0')} ${ampm}`;
}

/**
 * A ticketed event, styled as a sibling of Attractions' own `.event-card` so it
 * reads as part of the grid. `placement` becomes the per-event subId1, so Impact
 * reports the individual game or show rather than one lumped bucket.
 */
export function EventTicketCard({ e, placement }: { e: TMEvent; placement: string }) {
  const link = ticketmasterEventHref(e.url!, placement);
  if (!link) return null;
  const meta = PARTNER_META.ticketmaster!;
  const when = [formatDate(e.date), formatTime(e.time)].filter(Boolean).join(' · ');

  return (
    <article className="event-card ticket-card">
      <style>{CARD_CSS}</style>
      <div className="img" style={e.image ? { backgroundImage: `url(${e.image})` } : undefined}>
        <div className="tag-row">
          <span className="tag tk">Tickets</span>
        </div>
        {when && <span className="when-pill">{when}</span>}
      </div>
      <div className="body">
        <h3>{e.name}</h3>
        <div className="venue">
          {e.venue}
          {e.city ? ` · ${e.city}` : ''}
        </div>
        <div className="tk-by">
          <span>on</span>
          <img src={meta.logo} alt="Ticketmaster" />
        </div>
        <div className="cta-row">
          <a className="cta" href={link.href} target="_blank" rel={AFFILIATE_REL}>
            {meta.cta}
            {typeof e.priceFrom === 'number' ? ` · from $${Math.round(e.priceFrom)}` : ''}
          </a>
        </div>
      </div>
    </article>
  );
}

const CARD_CSS = `
.cbl-attractions .ticket-card .tag.tk { background:${GOLD}; color:#000; font-weight:800; }
.cbl-attractions .ticket-card .when-pill {
  position:absolute; left:0; bottom:0; z-index:2;
  background:rgba(0,0,0,.84); color:${GOLD};
  font-family:${MONO}; font-size:11px; letter-spacing:.06em;
  padding:6px 10px; border-radius:0 12px 0 0;
}
.cbl-attractions .ticket-card .tk-by { display:flex; align-items:center; gap:7px; margin:2px 0 4px; color:#777; font-family:${MONO}; font-size:10px; letter-spacing:.1em; text-transform:uppercase; }
.cbl-attractions .ticket-card .tk-by img { height:13px; width:auto; display:block; filter:brightness(0) invert(1); opacity:.8; }
.cbl-attractions .ticket-card .cta-row { margin-top:auto; }
.cbl-attractions .ticket-card a.cta { text-decoration:none; justify-content:center; }
`;
