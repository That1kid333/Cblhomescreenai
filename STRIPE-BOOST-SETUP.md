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

## What I've built / what's left (my side)

**Done**
- `supabase/functions/create-listing-boost-checkout/` — the Checkout session
  creator (auto-provisions prices, test/live-gated, stamps
  `metadata.cbl_source='listing-boost'`, `cbl_boost_tier`, `cbl_listing_id`).
- Paid tiers gated to "Coming Soon" on the Directory page.

**Left before flipping it on**
1. **Deploy** `create-listing-boost-checkout` to CBL-Rides (I'll do this via Supabase).
2. **Extend `stripe-partner-webhook`** to also handle `cbl_source==='listing-boost'`:
   on `checkout.session.completed`, update `directory_listings` for
   `metadata.cbl_listing_id` — set `tier`, `featured=true` (for featured/pro),
   bump `expires_at`. Idempotent on `stripe_session_id` like the partner path.
   *(Uses the service-role key already in the webhook's secrets — works today.)*
3. **Frontend flow:** a member posts free, then a **"⚡ Boost this listing"** button
   (in their listing's detail panel) calls the function and redirects to Stripe;
   on return `?boost=success` we refresh and show the Featured badge. Then swap the
   pricing-card "Coming Soon" buttons back to live CTAs.
4. **Time-boxed "Featured" decision:** `directory_listings` has no `featured_until`
   column. Options: (a) add `featured_until timestamptz` + a nightly job to clear
   expired features (true "per week"); or (b) keep it simple — Featured stays on for
   the listing's 30-day life for a flat $4.99. Recommend (b) for launch. *(Your call.)*

**Not a blocker:** this does NOT depend on rotating the exposed service-role key —
the webhook already uses that key successfully. (Rotation is still worth doing for
security, but it doesn't hold up boosts.)
