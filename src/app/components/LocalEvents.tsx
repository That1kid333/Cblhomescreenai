import { useEffect, useState } from 'react';
import { Car, Ticket } from 'lucide-react';
import { ticketmasterEventHref, AFFILIATE_REL, PARTNER_META } from '../lib/affiliates';
import { RIDER_BOOK_URL } from '../lib/constants';
import type { Coords } from '../lib/location';

/** Same ride action the venue cards use. Duplicated as a one-liner rather than
 *  imported from Attractions.tsx, which would make the import cycle. */
function openRide() {
  window.open(RIDER_BOOK_URL, '_blank', 'noopener,noreferrer');
}

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
      // 20 (Discovery's cap in our proxy) rather than 12. Only a few rows are
      // woven into the grid; the headroom is what lets nextEventAtVenue() find a
      // venue's own next event. Measured 2026-08-12: Discovery returns one row
      // PER DATE, so a 3-game Pirates series eats 3 slots — 12 rows collapsed to
      // just 5 distinct venues on the Sports tab, which is why venues that
      // genuinely sell tickets were rendering with no chip.
      // 80, with the proxy capped at 100 so there's headroom. Measured 2026-08-12
      // against the live proxy: Discovery returns one row PER DATE, so long-running
      // shows hog a shallow page. New York yielded just 6 distinct venues at
      // size=20 (a few Broadway runs filling every slot) vs 40 at 80; Pittsburgh
      // went 14 → 20 and is identical at 80 and 100. Distinct venues is what drives
      // how many cards can carry a TICKETS button, so depth here is directly how
      // much Ticketmaster inventory we can promote. 80 costs 4.5KB gzipped, one
      // upstream request, hour-cached at the CDN, and showed no latency penalty
      // over 20 across repeated uncached samples.
      size: '80',
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

/**
 * The soonest event happening AT a given venue, or null.
 *
 * Powers the spotlight line: the top-rated pick stays an editorial choice (PNC
 * Park because it's rated 4.8), and the ticketed event rides along as "what's
 * actually on there" rather than replacing it. That keeps the page's most
 * prominent slot honest while still being bookable.
 *
 * Matching is name-based and forgiving in both directions: Google says "PNC
 * Park", Ticketmaster may say "PNC Park - Pittsburgh". Events already arrive
 * sorted soonest-first, so the first hit is the next one.
 */
/**
 * Canonical key for a venue name, used both to match a venue card to its event
 * and to dedupe the event queue.
 *
 * Ticketmaster lists the SAME room under spelling variants — "Mr Smalls Theatre"
 * and "Mr Smalls Theater" both appear in the live Pittsburgh Music feed (Keith
 * confirmed 2026-08-12 it is one venue), which made the dedupe treat it as two
 * places and would also stop a venue card from finding its own event. Folding the
 * -re/-er pair and a leading "the" is enough to catch that class without fuzzy
 * matching, which risks collapsing genuinely different rooms. Note this keeps
 * "The Funhouse at Mr. Smalls" separate from "Mr Smalls Theatre" — correctly, as
 * those are two different rooms at the same complex.
 */
export function venueKey(s: string | null | undefined): string {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\btheatre\b/g, 'theater')
    .replace(/\bcentre\b/g, 'center')
    .replace(/^the\s+/, '')
    .trim();
}

export function nextEventAtVenue(events: TMEvent[], venueName: string | null | undefined): TMEvent | null {
  if (!venueName) return null;
  const norm = venueKey;
  const target = norm(venueName);
  if (target.length < 4) return null; // too short to match safely
  return (
    events.find((e) => {
      if (!e.venue) return false;
      const v = norm(e.venue);
      return v === target || v.includes(target) || target.includes(v);
    }) ?? null
  );
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
          {/* Price moved out of the button label: the pill is one nowrap line at
              12.5px, and "TICKETS · FROM $99" cannot fit beside SCHEDULE at 375px. */}
          {typeof e.priceFrom === 'number' && (
            <span className="tk-from">· from ${Math.round(e.priceFrom)}</span>
          )}
        </div>
        {/* Same approved pill system as the venue cards (Keith, 2026-08-12). No
            info circle here — a Ticketmaster event has no on-site detail panel to
            open, so SCHEDULE and TICKETS split the row evenly. */}
        <div className="venue-actions has-tix">
          <button className="va gold" onClick={openRide}>
            <Car size={17} color="#000" strokeWidth={2} aria-hidden="true" />
            Schedule
          </button>
          {/* rel="sponsored" only when the link is genuinely an affiliate link.
              An untracked international listing is an ordinary outbound link. */}
          <a className="va tix" href={link.href} target="_blank" rel={link.tracked ? AFFILIATE_REL : 'noopener noreferrer'}>
            <Ticket size={17} color="#fff" strokeWidth={2} aria-hidden="true" />
            Tickets
          </a>
        </div>
      </div>
    </article>
  );
}

/**
 * "Next here: Pirates vs Red Sox · Fri, Aug 14 · 6:40 PM — Get tickets"
 *
 * Sits inside the spotlight card, under the venue's own details. Deliberately a
 * line rather than a button: the card's primary action stays CBL's ("Book a Ride
 * There"), and the ticket link is the supporting move.
 */
export function VenueNextEvent({ event, placement }: { event: TMEvent; placement: string }) {
  const link = ticketmasterEventHref(event.url!, placement);
  if (!link) return null;
  const meta = PARTNER_META.ticketmaster!;
  const when = [formatDate(event.date), formatTime(event.time)].filter(Boolean).join(' · ');

  return (
    <div className="next-ev">
      <style>{CARD_CSS}</style>
      <span className="ne-k">Next here</span>
      <span className="ne-name">{event.name}</span>
      {when && <span className="ne-when">{when}</span>}
      <a className="ne-cta" href={link.href} target="_blank" rel={link.tracked ? AFFILIATE_REL : 'noopener noreferrer'}>
        {meta.cta} <span aria-hidden="true">→</span>
      </a>
      <img className="ne-logo" src={meta.logo} alt="Ticketmaster" />
    </div>
  );
}

const CARD_CSS = `
.cbl-attractions .next-ev {
  display:flex; align-items:center; gap:10px; flex-wrap:wrap;
  margin:10px 0 2px; padding:10px 12px;
  background:rgba(201,151,66,.08); border:1px solid rgba(201,151,66,.28); border-radius:12px 0 12px 0;
}
.cbl-attractions .next-ev .ne-k {
  font-family:${MONO}; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:${GOLD};
}
.cbl-attractions .next-ev .ne-name { color:#EDEDED; font-size:14px; font-weight:600; }
.cbl-attractions .next-ev .ne-when { font-family:${MONO}; font-size:11px; color:#9A9A9A; letter-spacing:.05em; }
.cbl-attractions .next-ev .ne-cta {
  font-family:${MONO}; font-size:11px; letter-spacing:.08em; text-transform:uppercase;
  color:#000; background:${GOLD}; padding:6px 12px; border-radius:999px; text-decoration:none; font-weight:700;
}
.cbl-attractions .next-ev .ne-cta:hover { background:#DDB15F; }
.cbl-attractions .next-ev .ne-logo { height:12px; width:auto; filter:brightness(0) invert(1); opacity:.6; margin-left:auto; }
@media (max-width:640px){ .cbl-attractions .next-ev .ne-logo { display:none; } }
.cbl-attractions .ticket-card .tag.tk { background:${GOLD}; color:#000; font-weight:800; }
.cbl-attractions .ticket-card .when-pill {
  position:absolute; left:0; bottom:0; z-index:2;
  background:rgba(0,0,0,.84); color:${GOLD};
  font-family:${MONO}; font-size:11px; letter-spacing:.06em;
  padding:6px 10px; border-radius:0 12px 0 0;
}
.cbl-attractions .ticket-card .tk-by { display:flex; align-items:center; gap:7px; margin:2px 0 4px; color:#777; font-family:${MONO}; font-size:10px; letter-spacing:.1em; text-transform:uppercase; }
.cbl-attractions .ticket-card .tk-by img { height:13px; width:auto; display:block; filter:brightness(0) invert(1); opacity:.8; }
.cbl-attractions .ticket-card .tk-by .tk-from { color:${GOLD}; }
/* The .venue-actions / .va pill system itself is defined once in Attractions.tsx
   (ATTRACTIONS_CSS) and inherited here — this card only ever renders inside
   .cbl-attractions. Only the push-to-bottom is card-specific, so the row lines
   up across a mixed grid of tall and short cards. Don't delete the .va rules in
   Attractions.tsx without checking this file: they style this card too, and
   removing them once already left "Get tickets" as unstyled plain text. */
.cbl-attractions .ticket-card .venue-actions { margin-top:auto; padding-top:14px; }
`;
