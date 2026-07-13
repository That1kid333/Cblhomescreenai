// create-listing-boost-checkout
// Creates a Stripe Checkout session to BOOST a member's directory listing.
//
// Deploys to the CBL-Rides Supabase project (app.citybucketlist.com), NOT Netlify
// — same home as directory_listings + create-partner-checkout. Modeled on
// create-partner-checkout: prices are auto-provisioned via Stripe lookup keys, so
// there is NOTHING to hand-create in the Stripe dashboard. Test/live mode follows
// the same app_settings.stripe_live_payments_enabled toggle as every CBL payment.
//
// Request body: { listingId: number|string, tier: 'photo'|'featured'|'pro', email?, name? }
// The client can only choose WHICH tier — the amount is fixed server-side below.
// On success returns { url } to redirect the buyer to Stripe Checkout.
//
// After payment, stripe-partner-webhook (extended to honor cbl_source ===
// 'listing-boost') flips directory_listings.tier/featured for metadata.cbl_listing_id.
// See STRIPE-BOOST-SETUP.md.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Server-side source of truth. amount in cents. `mode` = one-time vs subscription.
const BOOSTS: Record<string, { name: string; amount: number; lookupKey: string; mode: 'payment' | 'subscription'; interval?: 'month' }> = {
  photo:    { name: 'CBL Listing — Photo Boost',        amount: 299,  lookupKey: 'cbl_listing_photo_boost',   mode: 'payment' },
  featured: { name: 'CBL Listing — Featured (30 days)', amount: 499,  lookupKey: 'cbl_listing_featured_30d',  mode: 'payment' },
  pro:      { name: 'CBL Business Pro (Monthly)',       amount: 2999, lookupKey: 'cbl_business_pro_monthly',  mode: 'subscription', interval: 'month' },
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json().catch(() => ({}))
    const tierKey = String(body.tier || '').toLowerCase()
    const boost = BOOSTS[tierKey]
    if (!boost) {
      return new Response(
        JSON.stringify({ error: "Invalid tier. Expected 'photo', 'featured', or 'pro'." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // The listing being boosted must be identified so the webhook can flip it.
    const listingId = String(body.listingId ?? '').trim()
    if (!/^\d+$/.test(listingId)) {
      return new Response(
        JSON.stringify({ error: 'A valid listingId is required to boost a listing.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Test vs live mode (same toggle as ride + partner payments).
    let liveMode = false
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'stripe_live_payments_enabled')
        .maybeSingle()
      liveMode = data?.value === 'true'
    } catch (e) {
      console.error('Could not read app_settings, defaulting to TEST mode:', e)
    }

    const secret = liveMode
      ? Deno.env.get('STRIPE_SECRET_KEY') || ''
      : Deno.env.get('STRIPE_TEST_SECRET_KEY') || ''
    if (!secret.startsWith('sk_')) {
      const which = liveMode ? 'STRIPE_SECRET_KEY' : 'STRIPE_TEST_SECRET_KEY'
      return new Response(
        JSON.stringify({ error: `Stripe is not configured (missing ${which})` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const stripe = new Stripe(secret, { apiVersion: '2022-11-15' })

    // Find (or lazily create) the price for this boost via its lookup key.
    let priceId: string
    const existing = await stripe.prices.list({ lookup_keys: [boost.lookupKey], active: true, limit: 1 })
    if (existing.data.length > 0) {
      priceId = existing.data[0].id
    } else {
      const product = await stripe.products.create({
        name: boost.name,
        metadata: { cbl_boost_tier: tierKey, cbl_source: 'listing-boost' },
      })
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: boost.amount,
        currency: 'usd',
        ...(boost.mode === 'subscription' ? { recurring: { interval: boost.interval ?? 'month' } } : {}),
        lookup_key: boost.lookupKey,
      })
      priceId = price.id
      console.log(`Provisioned boost ${tierKey} product/price:`, product.id, price.id)
    }

    // Reuse an existing Stripe customer if an email was provided.
    let customerId: string | undefined
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (email) {
      const found = await stripe.customers.list({ email, limit: 1 })
      customerId = found.data.length > 0
        ? found.data[0].id
        : (await stripe.customers.create({
            email,
            name: typeof body.name === 'string' ? body.name : undefined,
            metadata: { cbl_role: 'directory_member' },
          })).id
    }

    const meta = { cbl_source: 'listing-boost', cbl_boost_tier: tierKey, cbl_listing_id: listingId }
    const origin = req.headers.get('origin') || 'https://citybucketlist.com'
    const session = await stripe.checkout.sessions.create({
      ...(customerId ? { customer: customerId } : {}),
      line_items: [{ price: priceId, quantity: 1 }],
      mode: boost.mode,
      success_url: `${origin}/directory?boost=success&tier=${tierKey}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/directory?boost=cancelled&tier=${tierKey}`,
      metadata: meta,
      ...(boost.mode === 'subscription' ? { subscription_data: { metadata: meta } } : {}),
    })

    if (!session?.url) throw new Error('Failed to create checkout session')

    return new Response(
      JSON.stringify({ url: session.url, mode: liveMode ? 'live' : 'test' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error in create-listing-boost-checkout:', error)
    return new Response(
      JSON.stringify({ error: (error as { message?: string })?.message || 'Internal server error' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
