// apply-listing-boost
// Applies a paid directory-listing boost after the buyer returns from Stripe
// Checkout (/directory?boost=success&session_id=...). Instead of relying on the
// shared partner webhook, this self-contained function retrieves the Checkout
// Session straight from Stripe, confirms it's PAID and is a listing boost, then
// flips directory_listings.tier / featured for the boosted listing (service-role).
// Idempotent — safe to call more than once for the same session.
//
// Deploys to CBL-Rides. verify_jwt = false: the Stripe session id itself is the
// proof of payment (unguessable, returned only to the buyer). Key selection is by
// session-id prefix so a cs_test_ session always uses the test key.
//
// Boost effects (Keith: 30-day life for all boosts):
//   photo    -> tier='photo'    (unlocks photos; not featured)
//   featured -> tier='featured', featured=true
//   pro      -> tier='pro',      featured=true
// All push expires_at to 30 days out.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.21.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  const json = (b: unknown, status = 200) =>
    new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const body = await req.json().catch(() => ({}))
    const sessionId = String(body.sessionId ?? body.session_id ?? '').trim()
    if (!sessionId.startsWith('cs_')) return json({ error: 'A valid Stripe session id is required.' }, 400)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const isTest = sessionId.startsWith('cs_test_')
    const secret = isTest
      ? Deno.env.get('STRIPE_TEST_SECRET_KEY') || ''
      : Deno.env.get('STRIPE_SECRET_KEY') || ''
    if (!secret.startsWith('sk_')) {
      return json({ error: `Stripe not configured (missing ${isTest ? 'STRIPE_TEST_SECRET_KEY' : 'STRIPE_SECRET_KEY'})` }, 500)
    }
    const stripe = new Stripe(secret, { apiVersion: '2022-11-15' })

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.metadata?.cbl_source !== 'listing-boost') {
      return json({ applied: false, ignored: 'not a listing boost' })
    }
    if (session.payment_status !== 'paid') {
      return json({ applied: false, reason: `payment_status=${session.payment_status}` })
    }

    const listingId = String(session.metadata?.cbl_listing_id ?? '').trim()
    const tier = String(session.metadata?.cbl_boost_tier ?? '').toLowerCase()
    if (!/^\d+$/.test(listingId) || !['photo', 'featured', 'pro'].includes(tier)) {
      return json({ applied: false, reason: 'missing/invalid listing id or tier' })
    }

    const featured = tier === 'featured' || tier === 'pro'
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('directory_listings')
      .update({ tier, featured, expires_at: expires })
      .eq('id', Number(listingId))
      .select('id, tier, featured, expires_at')

    if (error) {
      console.error('apply-listing-boost update failed:', listingId, error)
      return json({ error: 'Failed to apply boost' }, 500)
    }
    if (!data || data.length === 0) return json({ applied: false, reason: 'no listing matched', listingId })

    console.log(`boost applied: listing ${listingId} -> tier=${tier} featured=${featured} (${isTest ? 'test' : 'live'})`)
    return json({ applied: true, listing: data[0], mode: isTest ? 'test' : 'live' })
  } catch (error) {
    console.error('apply-listing-boost error:', error)
    return json({ error: (error as { message?: string })?.message || 'Internal error' }, 400)
  }
})
