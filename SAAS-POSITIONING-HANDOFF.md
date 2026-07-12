# SaaS Positioning — "independent driver," not "CBL driver"

**Rule (Keith, 2026-07-12):** City Bucket List is a **Software-as-a-Service / Private Membership Platform — NOT a rideshare company.** Drivers are **independent contractors**; members sign up **their own** driver via the CBL Private Membership. Never say "CBL driver" in user-facing copy → use **"independent driver," "your own driver," "your private/scheduled driver."** This must be evident across the site *and* the app.

## Marketing site — DONE (deployed)
Swept `CBL driver(s)` → `independent driver` in HowItWorks, Transportation, Delivery, Directory, OurStory, the blog "Share your story" referral flow, and the published *Rideshare vs. Cabs* post.

## App (`citybucketlist.com` repo) — STAGED, needs Justin
Edits made in the local checkout at `~/Desktop/CBL App/citybucketlist.com`, **left uncommitted** for review — nothing deployed:

| File | Change |
|---|---|
| `src/components/rides/RideshareFallback.tsx` | footer note "No CBL driver available?" → "No independent driver available?" (+ 2 comments) |
| `src/components/itinerary/ActivityBookingActions.tsx` | ride dropdown option "CBL Driver" → "My Driver" |
| `src/components/driver/PriceComparisonWidget.tsx` | header comment |
| `supabase/functions/build-itinerary/index.ts` | itinerary ride notes ×2: "Book with CBL driver…" → "Book with your independent driver…" |

**Justin:** `git diff` in the app repo, adjust wording if you prefer, then commit + deploy on the app's pipeline (this is your repo, so I didn't push it). The footer disclaimer + FAQ already state the SaaS/contractor model.
