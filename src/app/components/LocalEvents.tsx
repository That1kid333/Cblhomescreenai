import { useEffect, useState } from 'react';
import { affiliateHref, AFFILIATE_REL, PARTNER_META } from '../lib/affiliates';
import { AffiliateDisclosure } from './AffiliateDisclosure';
import type { Coords } from '../lib/location';

/**
 * "What's on near you" — REAL upcoming events from the Ticketmaster Discovery
 * API (netlify/functions/events.js), rendered as dated cards.
 *
 * This is the difference between sending someone to a generic ticket search and
 * telling them the Steelers play the Packers at Acrisure on the 13th. Each card
 * links to that specific event, wrapped in the Impact affiliate link with its
 * own subId1, so Impact reports which event earned rather than lumping
 * everything under one placement.
 *
 * Self-hiding by design. No API key (production until the env var is set), no
 * coordinates, or no events in range → renders nothing at all rather than an
 * empty shell. Same "never show a broken promise" rule the affiliate bands use.
 */

const GOLD = '#C99742';
const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
const DISPLAY = "'Barlow Condensed',system-ui,sans-serif";

type TMEvent = {
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

// The segments we surface, in the order Keith asked for them: local sport
// first, then live music. Labels are ours; `seg` must match Discovery's
// segmentName exactly.
const TABS = [
  { key: 'Sports', label: 'Sports' },
  { key: 'Music', label: 'Music' },
  { key: 'Arts & Theatre', label: 'Arts & Theater' },
] as const;

/** "Wed, Aug 13" from Discovery's local date, with no timezone shifting. */
function formatDate(date: string | null): string {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return '';
  // Construct in LOCAL time from parts. new Date("2026-08-13") parses as UTC and
  // renders as the 12th for anyone west of Greenwich — which would put a Friday
  // game on Thursday.
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** "7:05 PM" from Discovery's local 24h time. */
function formatTime(time: string | null): string {
  if (!time) return '';
  const [h, min] = time.split(':').map(Number);
  if (Number.isNaN(h)) return '';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(min ?? 0).padStart(2, '0')} ${ampm}`;
}

function useLocalEvents(coords: Coords | null | undefined, segment: string) {
  const [events, setEvents] = useState<TMEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setLoading(true);
    const qs = new URLSearchParams({
      lat: String(coords.lat),
      lng: String(coords.lng),
      segment,
      size: '8',
      radius: '50',
    });
    fetch(`/api/events?${qs}`)
      .then((r) => (r.ok ? r.json() : { events: [] }))
      .then((d) => {
        if (cancelled) return;
        setEvents(Array.isArray(d?.events) ? d.events : []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords?.lat, coords?.lng, segment]);

  return { events, loading };
}

export function LocalEvents({
  activeCity,
  coords,
  placement = 'attractions_events',
}: {
  activeCity: string;
  coords?: Coords | null;
  placement?: string;
}) {
  const [segment, setSegment] = useState<string>('Sports');
  const { events, loading } = useLocalEvents(coords, segment);

  // Only events we can actually sell a ticket to. An event with no URL can't be
  // wrapped in the affiliate link, so it would be an unmonetized dead end.
  const sellable = events.filter((e) => e.url);
  if (!coords) return null;
  if (!loading && sellable.length === 0 && segment === 'Sports') return null;

  const meta = PARTNER_META.ticketmaster!;

  return (
    <section className="band cbl-events">
      <style>{CSS}</style>
      <div className="band-inner">
        <div className="ev-head">
          <div>
            <div className="section-eyebrow">on sale · near {activeCity}</div>
            <h2 className="section-h2">
              What&rsquo;s on <span className="it">this month</span>
            </h2>
          </div>
          <div className="ev-tabs" role="tablist" aria-label="Event type">
            {TABS.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={segment === t.key}
                className={'ev-tab' + (segment === t.key ? ' active' : '')}
                onClick={() => setSegment(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading && sellable.length === 0 ? (
          <p className="ev-empty">Finding what&rsquo;s on near {activeCity}…</p>
        ) : sellable.length === 0 ? (
          <p className="ev-empty">
            No {segment.toLowerCase()} events on sale near {activeCity} right now.
          </p>
        ) : (
          <div className="ev-grid">
            {sellable.map((e) => {
              // Per-EVENT sub_id, so Impact reports the individual game or show
              // that earned rather than one lumped "attractions" bucket.
              const link = affiliateHref('ticketmaster', e.url!, `${placement}_${e.id}`);
              if (!link) return null;
              const when = [formatDate(e.date), formatTime(e.time)].filter(Boolean).join(' · ');
              return (
                <a
                  key={e.id}
                  className="ev-card"
                  href={link.href}
                  target="_blank"
                  rel={AFFILIATE_REL}
                >
                  <div className="ev-shot">
                    {e.image ? (
                      <img src={e.image} alt="" loading="lazy" />
                    ) : (
                      <div className="ev-ph" aria-hidden="true" />
                    )}
                    {when && <span className="ev-when">{when}</span>}
                  </div>
                  <div className="ev-body">
                    <h3 className="ev-name">{e.name}</h3>
                    {e.venue && (
                      <p className="ev-venue">
                        {e.venue}
                        {e.city ? ` · ${e.city}` : ''}
                      </p>
                    )}
                    <span className="ev-cta">
                      {meta.cta}
                      {typeof e.priceFrom === 'number' ? ` · from $${Math.round(e.priceFrom)}` : ''}
                      <span aria-hidden="true"> →</span>
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <div className="ev-by">
          <span>Tickets by</span>
          <img src={meta.logo} alt="Ticketmaster" />
        </div>
      </div>
      <AffiliateDisclosure />
    </section>
  );
}

const CSS = `
.cbl-events .ev-head { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; flex-wrap:wrap; margin-bottom:22px; }
.cbl-events .ev-tabs { display:flex; gap:8px; flex-wrap:wrap; }
.cbl-events .ev-tab {
  font-family:${MONO}; font-size:12px; letter-spacing:.08em; text-transform:lowercase;
  padding:8px 14px; border-radius:999px; cursor:pointer;
  background:transparent; border:1px solid rgba(255,255,255,.18); color:#9A9A9A; transition:all .2s;
}
.cbl-events .ev-tab:hover { border-color:rgba(201,151,66,.55); color:#fff; }
.cbl-events .ev-tab.active { background:${GOLD}; border-color:${GOLD}; color:#000; font-weight:700; }

.cbl-events .ev-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:18px; }
@media (max-width:1100px){ .cbl-events .ev-grid { grid-template-columns:repeat(2,1fr); } }
@media (max-width:640px){ .cbl-events .ev-grid { grid-template-columns:1fr; } }

.cbl-events .ev-card {
  display:flex; flex-direction:column; text-decoration:none; overflow:hidden;
  background:#141414; border:1px solid rgba(255,255,255,.08); border-radius:18px 0 18px 0;
  transition:transform .2s, border-color .2s;
}
.cbl-events .ev-card:hover { transform:translateY(-4px); border-color:rgba(201,151,66,.5); }
.cbl-events .ev-shot { position:relative; aspect-ratio:16/9; background:#0A0A0A; overflow:hidden; }
.cbl-events .ev-shot img { width:100%; height:100%; object-fit:cover; display:block; }
.cbl-events .ev-ph { width:100%; height:100%; background:linear-gradient(135deg, rgba(201,151,66,.22), rgba(10,10,10,.9)); }
.cbl-events .ev-when {
  position:absolute; left:0; bottom:0; background:rgba(0,0,0,.82); color:${GOLD};
  font-family:${MONO}; font-size:11px; letter-spacing:.06em; padding:6px 10px; border-radius:0 12px 0 0;
}
.cbl-events .ev-body { padding:14px 16px 16px; display:flex; flex-direction:column; gap:6px; flex:1; }
.cbl-events .ev-name {
  font-family:${DISPLAY}; font-weight:800; font-size:19px; line-height:1.15; color:#fff;
  text-transform:uppercase; letter-spacing:-.01em; margin:0;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}
.cbl-events .ev-venue { font-size:13px; color:#9A9A9A; margin:0; line-height:1.35; }
.cbl-events .ev-cta { margin-top:auto; padding-top:8px; font-family:${MONO}; font-size:12px; letter-spacing:.06em; color:${GOLD}; }

.cbl-events .ev-empty { color:#9A9A9A; font-size:15px; margin:0 0 8px; }
.cbl-events .ev-by { display:flex; align-items:center; gap:10px; margin-top:18px; color:#707070; font-family:${MONO}; font-size:11px; letter-spacing:.1em; text-transform:uppercase; }
.cbl-events .ev-by img { height:15px; width:auto; display:block; filter:brightness(0) invert(1); opacity:.75; }
`;
