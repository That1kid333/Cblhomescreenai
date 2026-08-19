# CityBucketList: Rider Coverage & Affiliate Notes

Working notes, Aug 16-19, 2026. Lives in the repo so Cowork, Antigravity, and Justin all see the same picture.

---

## Positioning rule (applies to all CBL copy and outreach)

**CityBucketList is a SaaS platform plus a Private Membership Association (PMA). Never describe it as a rideshare or ride service.** Drivers are members and customers of the software, not a fleet CBL operates.

Why it matters: Keith's correction, Aug 16, 2026 ("we're not a rideshare, just a SaaS and PMA"). It also means there is no competitor conflict to manage with Uber or Lyft partnerships.

How to apply: affiliate applications and partner outreach present citybucketlist.com as the travel and experiences content platform. The app is the SaaS / membership product, mentioned secondarily if at all, and described as a membership platform.

~~Loose end: the CBL repo CLAUDE.md still opens with "rideshare platform."~~ **FIXED Aug 19.** It was the *app* repo's CLAUDE.md (`That1kid333/citybucketlist.com`), not this one — this repo already had the correct SaaS wording. The two were giving contradictory instructions to anyone reading them. The app copy now states SaaS + PMA, the independent-contractor status, and the no-competitor-conflict point.

---

## Uber affiliate application, submitted Aug 16, 2026

Submitted through Uber's Affiliate Partnership Contact Form (uber.surveymonkey.com/r/GNC8PHX).

What we told them:

- Applied as citybucketlist.com, US travel and experiences platform (city guides, events, trip planning)
- Promoting Uber rides + Uber Eats, deliberately NOT Uber driver
- CPA model: yes
- On Impact: yes, publisher account 7504721 (display name CityBucketList.com, under info@citybucketlist.com, W-9 on file under citybucketlist.com LLC)
- "Just launched in July 2026, growing month over month," no traffic figures
- Contact: Keith Schmiedlin, Founder, (412) 977-2408
- No mention of the app or rideshare anywhere

Uber pays only for NEW users' first ride or first Eats order. If approved, the program attaches inside Impact account 7504721.

Follow-up reminder is scheduled for Sept 1, 2026, 9am ET: check Gmail for Uber / impact.com replies and check whether the program appeared in Impact.

**Note on the copy this unlocks:** because Uber pays on *new users only*, the ask that earns is "not an Uber rider? sign up through us." Telling an existing Uber rider to use our link earns nothing. `OnDemandHandoff.tsx` carries this in a comment so nobody writes the wrong CTA on approval.

---

## Affiliate stack update

Expedia is approved and on board, replacing KAYAK. **The website side is largely done** (confirmed Aug 17). What remains is the app: as of Aug 16 the itinerary `TravelSearchSection` component (`src/components/itinerary/TravelSearchSection.tsx`) still built KAYAK affiliate links, so that swap is the open piece, and it's the same component the new Airport pickup option should land in.

**Verified Aug 19 — still true.** That file still hardcodes `KAYAK_AFFILIATE_ID = '34E7EF98-...'` and builds `kayak.com/in?a=...` URLs for flights, hotels and cars. Two things to know when doing the swap:

- **Expedia pays nothing on flights or cruises.** Hotels 4%, activities 4%, vacation rentals 2%, packages 2%, cars 1.5%. So a straight find-and-replace of KAYAK with Expedia *loses* nothing on flights (KAYAK was never approved either) but the flight tab should stay honest about earning nothing.
- **The website already has the builders.** `src/app/lib/expedia.ts` here has `expediaStaySearch`, `expediaFlightSearch` and `expediaLink` with the camref and pubref handling done and verified against the live network. The app should port these rather than rebuild them, so both properties stamp the same placement strings and reconcile against the same reports.

---

## Travelpayouts transfer partners, set up Aug 16, 2026

Account keith@citybucketlist.com, ID 704468, project Citybucketlist, source 499800. All programs were already unlocked; links generated with sub_id `arrival`.

Partner mix, decided after a Trustpilot check:

| Partner | Role | Terms | Trustpilot |
|---|---|---|---|
| Welcome Pickups | **Primary** | 8–9%, 45-day cookie | 4.8 / ~49.6k reviews, 96% five-star |
| Kiwitaxi | Backup | 9–11%, 30-day cookie | 4.3 / ~1k reviews |
| GetTransfer | **Dropped** | 4–25%, 30-day cookie | 4.2 but 31% one-star |

Live links:

- Welcome Pickups (primary): https://tpx.li/qmGzb2az
- Kiwitaxi (backup): https://kiwitaxi.tpx.li/UTwcbPJ8
- GetTransfer (parked, not for member-facing use): https://gettransfer.tpx.li/ltce79CM

Notes: GetTransfer was dropped for brand risk (driver no-shows, last-minute cancellations, refund fights). Kiwitaxi's included hotel waiting window is a strict 15 minutes, so copy pointing at them should not repeat Welcome Pickups' one-hour waiting claim.

### Status on the website side (Aug 19)

**Built and shipped, but dark.** `welcomepickups` and `kiwitaxi` are wired as Programs in `src/app/lib/affiliates.ts` with partner meta and an `arrivalTransferOffer(city, placement)` resolver. The fallback chain is verified: Welcome Pickups → Kiwitaxi → **renders nothing at all** (no empty state, per spec).

**It is dark because the `tpx.li` short links above cannot be used as base links.** `buildAffiliateLink()` re-targets the destination `u` and stamps a per-placement `sub_id`; a shortened link can carry neither, so using one would ship untracked. What is needed is the raw `tp.media/r?...` deeplink from **Tools → Links → row ⋮ → "Full link"** for each. Paste those two into `PROGRAM_BASE` and the block goes live.

**Do not click the `tpx.li` links to test them** — opening one logs a real click and puts false data in the Travelpayouts reports. Copy by hover/right-click.

**The 15-minute constraint is already honoured in code:** Kiwitaxi's highlights say "Driver waiting on arrival" with no duration, and no waiting-time claim appears on either partner. Keep it that way — the one-hour figure belongs to Welcome Pickups only, and only if we ever verify it.

**GetTransfer:** confirmed absent from this codebase, and called out as banned in a comment beside the base links so nobody adds it later. Still needs deleting from the Travelpayouts saved links — dashboard job.

---

## Remaining work

1. **Justin / coding session:** bundle an "Airport pickup" option into the KAYAK-to-Expedia swap in `TravelSearchSection` (Welcome Pickups primary, Kiwitaxi backup), plus a reusable arrival block with the FTC disclosure line baked in. Check whether the travel search section is missing its disclosure line during the swap. Spot-check PIT coverage on Welcome Pickups before go-live; fall back to Kiwitaxi; hide the block if neither quotes. Full detail is in `travelpayouts-transfer-placements-plan.md`.

   **Advice:** port `expedia.ts` and `arrivalTransferOffer()` from this repo rather than reimplementing. And on the disclosure — a real gap was found on the website Aug 18: the Directory's disclosure existed but at 10.5px, under the **13px minimum Expedia's terms require**. Whatever the app renders must clear 13px, in the same viewport as the links, never behind a tap.

2. **Uber/Lyft in-app fallback: BUILT** (Aug 19, on `feat/ride-intent-chooser`). `OnDemandHandoff.tsx` deep-links to Uber and Lyft with pickup/dropoff carried across, shown behind the "I need one now" door of `RideIntentChooser` on the schedule page. Before merge: test both deep links on a real phone; Uber's address-only prefill is the historically flaky part, and the fix if it misbehaves is passing lat/lng (the form already has Places data). Merge this branch before or together with `fix/decline-vs-transfer`, whose rider-facing decline messages point at this door. After Uber affiliate approval: add our client_id to the Uber link and rework the "We earn nothing on these" copy. Nice-to-have later: wire the `onHandoff` callback to count handoffs, so we learn how much on-demand demand the membership actually has.

   **Advice:** the `onHandoff` callback is worth wiring sooner than "later". The website already has an `affiliate_clicks` table (INSERT-only for anon, no read access, no PII) that the app could reuse rather than inventing a second logging path. It is also the only way to answer "did the handoff work" without waiting on a partner dashboard.

3. **Lyft:** no open affiliate program (the old FlexOffers driver offer is closed). Deep links are free, so Lyft is coverage only, no revenue.

   **Also checked Aug 19: Waymo has no affiliate program either** — only a consumer refer-a-friend code paying in ride credit, and a corporate partnerships desk (Avis, Lyft). Nothing a publisher can join. The Waymo and Tesla Cybercab cards were removed from the Transportation page for that reason, plus Waymo running in roughly four metros and Cybercab not being a shipped product.

4. **Decline flow (`fix/decline-vs-transfer`):** transfer promoted over decline, decline gets a one-time interstitial, and the new `notify-ride-declined` edge function finally tells the rider (push + message-inbox fallback, mirroring `notify-price-change`, including the rider_id-as-email convention). After merging: **deploy the edge function to the CBL-Rides Supabase project**, or declines will look fixed in the app while riders still hear nothing. Merge order matters: land the chooser branch first or same day, since this branch's messages promise an on-demand option on the ride screen.

---

## Open questions worth someone's attention

**Cancellations are the largest unexplained outcome.** Measured Aug 18 on the live `rides` table:

| status | rides | median lead time | outside riders |
|---|---|---|---|
| cancelled | **110** | 18.6 h | **99** |
| completed | 93 | 25.4 h | 73 |
| declined | 28 | **1.8 h** | 27 |

The decline pattern is understood — a declined ride was booked 14× closer to pickup than a completed one, which is what the intent chooser addresses. **Cancellations are four times larger and uncharacterised.** They are not our own testing: 99 of 110 are outside riders, spanning Mar 2025 to Aug 2026.

**Affiliate reporting has no independent check.** Until Aug 16 the networks were the only record of a click, they report 1–2 business days late, and a zero was indistinguishable from broken tracking. The `affiliate_clicks` table now gives a first-party count to reconcile against. Worth a weekly habit: if our log says 40 and Partnerize says 3, tracking broke somewhere in between and nobody would otherwise notice.
