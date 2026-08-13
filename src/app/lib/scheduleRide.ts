/**
 * Schedule-a-Ride handoff — website → app, with the destination prefilled.
 *
 * The app's /rider/schedule page already reads `destination`, `date` and
 * `pickup_time` off the query string and drops them into the booking form (built
 * for the itinerary "Book Ride" button, but it's generic). Until this, the
 * website sent a member to a bare /rider/login carrying no context at all, so
 * they arrived at an empty form and had to retype where they were going.
 *
 * NOTICE WINDOW (Keith, 2026-08-13): a scheduled ride should give an independent
 * contractor driver about **24 hours**. It is NOT a hard block — the driver
 * decides what they'll take — so this never prevents anyone from requesting a
 * ride. What it does is refuse to auto-fill a pickup time we can't realistically
 * promise: inside the window the member picks the time themselves, deliberately,
 * rather than being handed a prefilled 7pm that reads as already arranged.
 *
 * ⚠️ The app itself does NOT enforce any notice window — /rider/schedule's picker
 * floor is `new Date()`, so a ride 20 minutes out is currently accepted. That's
 * an app-side gap, tracked separately; this module only controls what WE prefill.
 */

import { APP_URL } from './constants';

/** Hours of notice a scheduled ride should give the driver. Guideline, not a gate. */
export const RIDE_NOTICE_HOURS = 24;

/** How early to be dropped off before an event starts. */
const ARRIVE_BEFORE_MIN = 45;

const pad = (n: number) => String(n).padStart(2, '0');

export type RideTarget = {
  /** Where they're going. Venue name + address reads best in the app's field. */
  destination: string;
  /** Event local date, 'YYYY-MM-DD'. Omit for a plain venue with no event. */
  date?: string | null;
  /** Event local start, 'HH:MM' or 'HH:MM:SS'. Needs `date` to be usable. */
  time?: string | null;
};

/**
 * True when we're willing to prefill a pickup time for this start.
 * Parsed as browser-local: the venue's local time and the visitor's clock agree
 * on the "near you" page, and being an hour off only shifts a courtesy
 * threshold, never a booking.
 */
export function clearsNoticeWindow(date?: string | null, time?: string | null, now = new Date()): boolean {
  if (!date || !time) return false;
  const start = new Date(`${date}T${time.length === 5 ? `${time}:00` : time}`);
  if (Number.isNaN(start.getTime())) return false;
  return start.getTime() - now.getTime() >= RIDE_NOTICE_HOURS * 3600 * 1000;
}

/**
 * Build the prefilled Schedule-a-Ride URL for the app.
 *
 * Always carries the destination. Carries date + pickup time only when the event
 * clears the notice window, so we never hand someone a time a driver realistically
 * can't take.
 */
/**
 * Route through /rider/login?redirect=… rather than straight at the scheduler.
 *
 * ON since 2026-08-13, once both app PRs landed on main and deployed:
 *  - #35 `feat/login-redirect-param` — login honours a same-origin ?redirect,
 *    in the already-signed-in effect as well as after sign-in, so BOTH a signed-in
 *    member and a signed-out one end up on the prefilled form.
 *  - #36 `fix(rider-login): don't decode the redirect twice` — without it, a venue
 *    whose name contains "&" arrived truncated. "Pittsburgh Zoo & Aquarium" became
 *    "Pittsburgh Zoo ", and two of the first 21 Pittsburgh attractions hit it.
 *
 * Both verified present on app main before flipping. If this ever needs to go back
 * to false, the fallback is a direct /rider/schedule link: still right for signed-in
 * members, and signed-out ones get the app's "Authentication Required" toast.
 */
const LOGIN_HONOURS_REDIRECT = true;

export function scheduleRideUrl(target: RideTarget, now = new Date()): string {
  const url = new URL(`${APP_URL}/rider/schedule`);
  const dest = target.destination.trim();
  if (dest) url.searchParams.set('destination', dest);

  if (clearsNoticeWindow(target.date, target.time, now)) {
    const t = target.time!.length === 5 ? `${target.time}:00` : target.time!;
    // Drop-off ARRIVE_BEFORE_MIN ahead of the start. Doing the arithmetic on a
    // Date (rather than on the string) keeps a late show correct: 00:15 minus 45
    // minutes has to move the DATE back a day too, not just the clock.
    const pickup = new Date(`${target.date}T${t}`);
    pickup.setMinutes(pickup.getMinutes() - ARRIVE_BEFORE_MIN);
    url.searchParams.set('date', `${pickup.getFullYear()}-${pad(pickup.getMonth() + 1)}-${pad(pickup.getDate())}`);
    url.searchParams.set('pickup_time', `${pad(pickup.getHours())}:${pad(pickup.getMinutes())}`);
  }

  if (!LOGIN_HONOURS_REDIRECT) return url.toString();

  // Hand the whole prefilled path to login, which returns them to it afterwards.
  const login = new URL(`${APP_URL}/rider/login`);
  login.searchParams.set('redirect', `${url.pathname}${url.search}`);
  return login.toString();
}
