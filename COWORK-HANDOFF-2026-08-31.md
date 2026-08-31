# Cowork → Antigravity handoff — Aug 31, 2026

Two files changed in the working copy of THIS repo, uncommitted. Please commit and push
together; nothing else was touched. Typecheck (`npm run typecheck`) passes clean.

## 1. `src/app/lib/affiliates.ts`
- Welcome Pickups and Kiwitaxi base links are now LIVE in `PROGRAM_BASE` (raw tp.media/r
  Full links pulled from Tools → Links on Aug 31; the `sub_id=arrival` was stripped because
  `buildAffiliateLink()` stamps the per-placement sub_id itself).
  - welcomepickups: campaign_id=627, p=8919
  - kiwitaxi: campaign_id=1, p=647
- Viator STAYS DARK: Travelpayouts shows CBL's Viator connection request as DECLINED
  (Aug 31), so no link can be generated. Comment updated so nobody waits on a paste.
- `arrivalTransferOffer()` is now coverage-gated. welcomepickups.com has NO search URL
  (the old `/search/?query=` was a 404), only one hub page per served city. So the new
  `WELCOME_PICKUPS_US` table (30 US cities from their homepage, plus airport-code and
  nickname aliases) is both the destination URL and the coverage list; anything not in it
  renders nothing. Twelve slugs verified live incl. the two odd ones (`/washington/` for
  DC, `/san-jose-ca/`). Kiwitaxi is the coded backup but has an EMPTY coverage table until
  we get a verified list of US destinations they fulfil (their PIT page quoted "no transfer
  found"); add entries to `KIWITAXI_US` and it picks up automatically.
- `welcomePickupsCity()` is exported for the app to reuse when the airport pre-book block
  is built into the rider dashboard / Buckee itinerary work.

## 2. `src/app/pages/Travels.tsx`
- Flights tab: the pre-flight row (`PreflightBand`) now leads with an arrival-transfer card
  keyed off the typed "To" destination (state lifted out of `FlightSearchPanel` via
  `onDestinationChange`). Card = `.pf-card.pf-arrival`: pure black, CBL gold hairline, no
  ranking labels (Keith's partner-card spec). Copy uses the partner's vetted briefing and
  highlights from `PARTNER_META`; no waiting-time claims. If Kiwitaxi ever renders it adds
  the "Code TPO5 takes 5% off through Dec 31, 2026" line (Travelpayouts confirmed the code
  stacks with attribution).
- Hidden when: nothing typed (< 3 chars), destination is in CBL's own driver market
  (`destinationInCblMarket`: Pittsburgh / PIT / PGH text match, or gazetteer coords within
  the existing 45-mile `MARKET_RADIUS_MI`), or no partner covers the destination. This is
  Keith's Aug 18 rule: a CBL driver is always first and never shown beside alternatives.
  The existing CBL "Need a ride to the airport?" banner covers the departure leg; this card
  covers the arrival leg in a city CBL does not serve, so they are not alternatives.
- Sub_id for this placement: `travels_flights_arrival`; click log:
  `travels_flights_arrival_<program>`.
- `<AffiliateDisclosure inline />` added directly under the row (13px floor, same
  viewport). The page-level band under the search bar is unchanged.

## Please eyeball on the deploy preview
Type "Chicago", "NYC", "LAX" in the Flights "To" field → card appears; "Pittsburgh" or
"PIT" → no card. Do NOT click the tpx.li short links in the Travelpayouts dashboard to
test (logs a real click); the card's own link is fine to click on the preview host, where
`affiliateHref()` returns the plain untracked destination anyway.

## Still with Keith
- Push decision on `docs/camref-fallback-stays`; the pre-existing TS5095 tsconfig item.
- Travelpayouts question on native-app attribution (drafted Aug 31) goes on ticket #246226.

## Addendum, later Aug 31: logo slot on the pre-flight / arrival cards
- `PartnerBy` in Travels.tsx renders `PARTNER_META.logo` as supplied (no white filter),
  scaled by `logoHeight` (20px wordmarks, 30px for Kiwitaxi's stacked lockup), with the
  brand name in text beside it. Empty `logo` = text by-line, so nothing ships broken.
- No affiliate logo files are in hand yet: Travelpayouts program pages carry no brand
  assets, newsroom.welcomepickups.com is editorial-use only, and the Welcome Pickups /
  Kiwitaxi logo answers are still pending on tickets #246226 / #246232. When files arrive,
  save to `public/travels/partners/<program>-logo.svg` and set the path in PARTNER_META.
- Both Aug 31 commits are LOCAL on main (Cowork's shell has no GitHub login). Push them.
