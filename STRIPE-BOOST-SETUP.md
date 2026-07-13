# Directory "Boost your listing" — Stripe checkout setup

Goal: let a member pay to boost their own directory listing (Photo Boost $2.99,
Featured $4.99/wk, Business Pro $29.99/mo). Reuses the **exact** pattern of the
restaurant `create-partner-checkout` + `stripe-partner-webhook` already live in the
CBL-Rides Supabase project, so most of the plumbing already exists.

**Status:** paid tiers show **"Coming Soon"** on the site until the steps below are
done. Only the Free tier posts today.

---

## What Keith does in Stripe — the short list

Because the checkout function **auto-creates the products/prices** (via Stripe
lookup keys) the first time it runs, you do **NOT** need to build any products in
the dashboard. Your whole to-do is keys + one webhook:

1. **Secret keys — probably already set.** The partner checkout already uses
   `STRIPE_TEST_SECRET_KEY` (test) and `STRIPE_SECRET_KEY` (live) as **Supabase
   Edge Function secrets** (Supabase → Project `jgbaqzgkdqqvxmqytgsx` → Edge
   Functions → Secrets). If they're there, nothing to do. If the live key is
   missing, add it from Stripe → Developers → API keys → *Secret key* (`sk_live_…`).

2. **Webhook — likely nothing new.** The existing endpoint that feeds
   `stripe-partner-webhook` already receives **every** `checkout.session.completed`
   event, so once I extend that function to also handle boosts (see below), boost
   payments flow through the **same** webhook + the same `STRIPE_TEST_WEBHOOK_SECRET`
   / `STRIPE_WEBHOOK_SECRET` you already set. **No new Stripe webhook to create.**
   *(If we ever split it into its own endpoint instead, you'd add one endpoint in
   Stripe → Developers → Webhooks for `checkout.session.completed` and paste me the
   signing secret — but the plan is to reuse the existing one so you don't have to.)*

3. **Test first.** Everything stays in **test mode** until you flip
   `app_settings.stripe_live_payments_enabled = 'true'` (the same switch that gates
   ride + partner payments). We'll run a test-card boost end-to-end, confirm the
   listing turns Featured, then flip live.

That's it on your end. Prices, products, success/return pages — all in code.

---

## Boost tiers (fixed server-side, in the checkout function)

| Tier | Price | Stripe mode | Effect on the listing |
|---|---|---|---|
| Photo Boost | $2.99 | one-time | `tier='photo'`, allow up to 5 photos |
| Featured | $4.99 | one-time (1 week) | `tier='featured'`, `featured=true`, top of results |
| Business Pro | $29.99/mo | subscription | `tier='pro'`, `featured=true`, unlimited |

The amount is **never** sent by the browser — the client only picks which tier.

---

## Architecture (built + deployed 2026-07-13)

Rather than edit Justin's shared partner webhook, boosts use a self-contained
**verify-on-return** pair — no new Stripe webhook endpoint needed:

1. **`create-listing-boost-checkout`** (deployed, `verify_jwt=false`) — makes the
   Checkout session. Auto-provisions prices via lookup keys, test/live-gated,
   stamps `metadata.cbl_source='listing-boost' + cbl_boost_tier + cbl_listing_id`.
2. **`apply-listing-boost`** (deployed, `verify_jwt=false`) — on return from Stripe
   (`/directory?boost=success&session_id=…`) the site calls this; it retrieves the
   session straight from Stripe, confirms `payment_status==='paid'` + the boost
   metadata, then flips `directory_listings` for that id: `tier`, `featured=true`
   (featured/pro), `expires_at = now()+30 days`. Idempotent; the unguessable
   session id is the proof of payment.

**Featured = flat 30-day life** (Keith's call 2026-07-13) — one-time $4.99, no
`featured_until` column or expiry cron needed.

## Verified 2026-07-13 (test mode)
- Checkout → valid `cs_test` session, correct product/price ($4.99), metadata stamped. ✅
- `apply-listing-boost` on an **unpaid** session → correctly **refuses** (`applied:false,
  payment_status=unpaid`) — no pay, no boost. ✅
- The flip write → `basic → featured=true, tier=featured, 30-day expiry`. ✅
- (Stripe's headless Sandbox card UI blocks bot entry, so the real-card click-through
  is best done by a human with test card `4242 4242 4242 4242`.)

## Left before flipping the paid tiers live
1. **Frontend flow:** a member posts free, then a **"⚡ Boost this listing"** entry
   (recommended: on the post-success screen, using the new listing's id) calls
   `create-listing-boost-checkout` → redirect to Stripe; on return `?boost=success`
   the site calls `apply-listing-boost` and shows the Featured badge. Then swap the
   pricing-card "Coming Soon" buttons to live CTAs.
2. **Go live:** flip `app_settings.stripe_live_payments_enabled='true'` (also confirm
   the live `STRIPE_SECRET_KEY` is set). Until then it's test-card only.

**Not a blocker:** boosts do NOT depend on rotating the exposed service-role key —
`apply-listing-boost` uses that key successfully today. (Rotation is still worth
doing for security, but it doesn't hold up boosts.)
