# Production Cutover — ship the new site to citybucketlist.com

**Goal:** make THIS repo the source for **citybucketlist.com** (it currently only
lives on the preview, `cbl-homescreen-preview.netlify.app`). This one step unblocks
a lot: the Travelpayouts project re-review (→ ~50 affiliate programs), the pending
KAYAK application, the blog going live/crawlable, and seamless directory posting.

Almost everything is already configured in `netlify.toml`. The cutover is really
just **(1) point the domain's Netlify site at this repo** and **(2) set 3 secret
env vars**. Owner: **Justin** (production Netlify + DNS). Est: ~15 min + build.

---

## 1. Point citybucketlist.com's Netlify site at this repo
In the Netlify site that serves **citybucketlist.com**:
- Link the GitHub repo **`That1kid333/Cblhomescreenai`**, branch **`main`**.
- Build settings come from `netlify.toml` (don't override):
  - **Build command:** `npm run build`
  - **Publish directory:** `dist`
  - Functions dir: `netlify/functions` · Edge functions: `netlify/edge-functions`

(Or, to test first without touching DNS: deploy this build to a staging Netlify
site, verify with the checklist below, then swap the custom domain over.)

## 2. Set the 3 required server-side env vars (Netlify → Site settings → Environment)
These are **secret** and have **no fallback** — the site needs them in production.
Set them as plain Netlify env vars (server-side; NOT `VITE_`-prefixed):

| Variable | Powers | Value |
|---|---|---|
| `GOOGLE_PLACES_API_KEY` | Eats & Attractions live Google data (`places.js`, `place-photo.js`, `place-details.js`) | CBL's Google Maps key (same one already set on the **preview** env — reused from Justin's app `VITE_GOOGLE_MAPS_API_KEY`, verified clean server-side) |
| `GOOGLE_MAPS_API_KEY` | Geocode-by-city (`geocode.js`) for the location search | Same Google key as above |
| `RESEND_API_KEY` | `/api/lead` + `/api/contact` emails to info@ | The Resend key that already sends CBL's info@ mail (likely already present on the production Netlify site) |

Client (`VITE_*`) vars are **optional** — the publishable Supabase/anon keys are
public and already baked in as fallbacks. Only set them to override a default
(e.g. a different Supabase project). Do NOT put any secret/service-role key in a
`VITE_` var — those ship to the browser.

## 3. Nothing else to configure
`netlify.toml` already handles:
- `/api/*` → Netlify functions; `/*` → `index.html` (SPA fallback)
- Edge-function prerender on `/blog`, `/blog/:slug`, `/attractions`, `/directory`
- Dynamic `/sitemap.xml`

## 4. Post-cutover verification (5-min checklist)
- [ ] Home + all nav pages load; `Welcome back` / member avatar works
- [ ] **Eats & Drinks** shows live restaurants + photos (proves `GOOGLE_PLACES_API_KEY`)
- [ ] **Attractions** shows live attractions + live weather + location detect
- [ ] **Directory → Classifieds** reads `directory_listings` (empty state until posts)
- [ ] `curl https://citybucketlist.com/blog` → real `<title>`/meta + `x-cbl-prerender: 1`
- [ ] `curl https://citybucketlist.com/attractions` and `/directory` → same (prerendered)
- [ ] `/sitemap.xml` returns the page list + blog posts; `robots.txt` points to it
- [ ] Submit the homepage "Join Now" + `/contact` → email lands at info@ (proves `RESEND_API_KEY`)

## Related, NOT part of this cutover
- **Weekly CBL Dispatch** needs `RESEND_API_KEY` as a **Supabase** function secret
  (different from Netlify) — see `blog/WEEKLY-DIGEST-ACTIVATION.md`.
- **Directory posting** (write path) is wired to CBL-Rides `directory_listings` via
  the member's own session — no extra env needed; requires a real member sign-in.
