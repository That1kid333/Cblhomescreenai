# Production Cutover — ship the new site to citybucketlist.com

**Goal:** make this repo the source for **citybucketlist.com** (it currently only
lives on the preview, `cbl-homescreen-preview.netlify.app`). This one step unblocks
a lot: the Travelpayouts project re-review (→ ~50 affiliate programs), the pending
KAYAK application, the blog going live/crawlable, and seamless directory posting.

Almost everything is already configured in `netlify.toml`. The cutover is really
**(1) a Netlify site building this repo with 3 env vars**, then **(2) a DNS repoint
at Cloudflare**. Est: ~15 min of Netlify setup + the DNS flip + build.

---

## Status (2026-07-14) — most of this is done

- ✅ Repo forked to the company org: **`Citybucketlist/Cblhomescreenai`** (deploy source; keep synced with the main repo, or make the fork primary and add Justin as a collaborator).
- ✅ Cloudflare DNS changes written out (2 website records; MX/email untouched). **Keith controls the Cloudflare account** (`Kdesign1245@icloud.com`) → the DNS flip is self-serve.
- ✅ Demo directory listings cleaned up.
- ✅ Env vars (Google + Resend) being set on the new site.
- ⏳ **One blocker left — Netlify team ownership** (see below).

## The one decision: which Netlify team serves the apex

Netlify won't let a second team add `citybucketlist.com` because Justin's team already
holds the domain claim + the `app.` / `ride.` / `directory.` subdomains, and **Netlify
won't split one domain's subdomains across two teams.**

> Note: the "managed by Netlify DNS on another team" message is a Netlify **ownership
> claim**, not authoritative DNS. **Cloudflare is authoritative** (nameservers
> `*.ns.cloudflare.com`), so moving sites between Netlify teams does **not** break
> `app.` / `ride.` / `directory.` or email — those resolve via the Cloudflare records.

**→ Recommended for launch-ASAP: Option B.** (Reason: Keith's Pro team is out of build
minutes until **July 26** — all deploys are CLI-only until then. Option A drags Justin's
actively-built app onto that throttled team; Option B avoids it entirely.)

- **Option B (launch now):** the main site deploys from **Justin's team**. Justin links
  the company fork to a site on his side and adds the domain there. App + directory stay
  put with working builds; add Keith as a collaborator. Nothing on Justin's live side moves.
- **Option A (consolidate later, after July 26):** transfer `cblapp` + `cbl-directory-preview`
  to Keith's Pro team and remove the citybucketlist.com claim from Justin's team, so
  everything lives under one roof. Do this **after** the credit reset so it doesn't put
  Justin's app on CLI-only builds for ~2 weeks.

Everything below applies to whichever team hosts the apex.

---

## 1. Point the Netlify site at the repo
On the site that will serve **citybucketlist.com**:
- Link the GitHub repo **`Citybucketlist/Cblhomescreenai`**, branch **`main`**.
- Build settings come from `netlify.toml` (don't override):
  - **Build command:** `npm run build` · **Publish directory:** `dist`
  - Functions: `netlify/functions` · Edge functions: `netlify/edge-functions`

## 2. Set the 3 required server-side env vars (Netlify → Site settings → Environment)
Secret, **no fallback**, server-side (NOT `VITE_`-prefixed):

| Variable | Powers | Value |
|---|---|---|
| `GOOGLE_PLACES_API_KEY` | Eats & Attractions live Google data (`places.js`, `place-photo.js`, `place-details.js`) | CBL's Google Maps key (same one already on the **preview** env — reused from Justin's app `VITE_GOOGLE_MAPS_API_KEY`, verified clean server-side) |
| `GOOGLE_MAPS_API_KEY` | Geocode-by-city (`geocode.js`) for the location search | Same Google key as above |
| `RESEND_API_KEY` | `/api/lead` + `/api/contact` emails to info@ | The Resend key that already sends CBL's info@ mail (likely already present on the production Netlify site) |

Client (`VITE_*`) vars are optional — the publishable Supabase/anon keys are public and
baked in as fallbacks. **Never** put a secret/service-role key in a `VITE_` var (those ship
to the browser).

## 3. Add the custom domain → grab the DNS values
In the Netlify site: **Domain management → Add a domain** → `citybucketlist.com`
(Netlify sees it's registered elsewhere — expected). Add `www` too.
Netlify then shows the **exact records to create** — hand those to Keith. Typically:
- apex `citybucketlist.com` → **A** `75.2.60.5` (or an ALIAS/CNAME to `<your-site>.netlify.app`)
- `www` → **CNAME** `<your-site>.netlify.app`

## 4. Flip DNS at Cloudflare (Keith — self-serve)
Cloudflare → citybucketlist.com → **DNS → Records**:
- Point the apex **A/ALIAS** + `www` **CNAME** at Netlify's values from step 3.
- **SSL/TLS mode = Full** (or set the records to "DNS only") so there's no redirect loop.
- Netlify auto-provisions the Let's Encrypt cert once DNS resolves (mins–~1 hr).

> 🛑 **NEVER touch the email records.** Google Workspace mail (keith@, info@, Justin,
> Brian — set up by Justin's brother's company) lives in this same DNS. Change ONLY the
> website's `A`/`CNAME`. Leave every `MX` and email `TXT` (SPF / DKIM / DMARC / Google
> verification) exactly as-is, or you break everyone's email.

## 5. `netlify.toml` already handles the rest
- `/api/*` → Netlify functions; `/*` → `index.html` (SPA fallback)
- Edge-function prerender on `/blog`, `/blog/:slug`, `/attractions`, `/directory`
- Dynamic `/sitemap.xml`

## 6. Post-cutover verification (5-min checklist)
- [ ] Home + all nav pages load; `Welcome back` / member avatar works
- [ ] **Eats & Drinks** shows live restaurants + photos (proves `GOOGLE_PLACES_API_KEY`)
- [ ] **Attractions** shows live attractions + live weather + location detect
- [ ] **Directory → Classifieds** reads `directory_listings` (empty state until posts)
- [ ] `curl https://citybucketlist.com/blog` → real `<title>`/meta + `x-cbl-prerender: 1`
- [ ] `curl https://citybucketlist.com/attractions` and `/directory` → same (prerendered)
- [ ] `/sitemap.xml` returns the page list + blog posts; `robots.txt` points to it
- [ ] Submit the homepage "Join Now" + `/contact` → email lands at info@ (proves `RESEND_API_KEY`)
- [ ] On a phone: no horizontal scroll; Buckee bubble on the opening screen

## Demo listings — already cleaned
- **Schmieddy's BBQ (Atlanta)** — sample row in `cbl-directory` `businesses`,
  **deactivated 2026-07-13** (`is_active=false`, id `b2fb99cf-…`); hard-delete at launch if desired.
- Any other seeded `businesses` rows that aren't real partners.
  (Square Cafe is a real CBL partner — keep it.)

## Post-launch (NOT blockers)
- **Restaurant-partner checkout** — register the Stripe webhook
  (`…/functions/v1/stripe-partner-webhook`, event `checkout.session.completed`) and set its
  `whsec_…` signing secret as a **Supabase** edge-function secret. Activates paid partner
  tiers + referral-commission attribution.
- **Live payments** — set `app_settings.stripe_live_payments_enabled = 'true'` for real
  charges (driver boost + partner checkout are in test mode until then).
- **Rotate the service-role key** — closes the July exposure; do before enabling live referral payouts.
- **Affiliate reviews** — with prod live, submit Travelpayouts (→ ~50 programs) + the KAYAK application.
- **Weekly CBL Dispatch** — needs `RESEND_API_KEY` as a **Supabase** function secret
  (different from Netlify) — see `blog/WEEKLY-DIGEST-ACTIVATION.md`.
- **Signup-page re-skin** (optional) — bring the app's Partner/Driver signup pages in line
  with the site using the prepared branded mockup + CSS kit / prompt.

## Build credits — heads up
Keith's Netlify Pro team is out of build minutes until **July 26**; until then deploys on that
team are CLI-based (draft → `restoreSiteDeploy`) or need a credit pack. This is why Option A
(consolidation) is best done after the reset. Justin's team is unaffected.
