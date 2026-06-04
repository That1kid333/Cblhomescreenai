# App Store Feasibility (Apple App Store & Google Play)

Running notes on what it takes to get CBL into the Apple App Store and Google
Play. The short version: **feasible, but not as-is.** A straight WebView wrapper
of the marketing site would likely be rejected by Apple; wrapping the
transactional app at `app.citybucketlist.com` is the right path.

---

## Two surfaces — wrap the right one

There are two distinct web surfaces:

1. **This marketing / home-screen site** (this repo) — directory, concierge,
   eats, travels, attractions, blog, login. Links *out* to the app.
   - References: `Home.tsx` `APP_URL = 'https://app.citybucketlist.com'`,
     "Apply Now" CTAs in `PartnerAttractions.tsx` / `Affiliates.tsx`,
     "download the CBL App" in `Login.tsx`.
2. **The transactional app at `app.citybucketlist.com`** — actual ride booking,
   accounts, concierge, driver matching. (Separate codebase, not in this repo.)

**Decision:** keep the marketing site as a plain website (out of the stores);
**wrap `app.citybucketlist.com`** and submit *that* to the stores. The domain you
wrap is the domain Apple/Google review, so all readiness work below applies to
`app.citybucketlist.com`.

---

## Biggest Apple risk: Guideline 4.2 (Minimum Functionality)

> "Your app should include features, content, and UI that elevate it beyond a
> repackaged website... If your app is not particularly useful, unique, or
> 'app-like,' it doesn't belong on the App Store."

- Wrapping the **marketing site** → very likely rejected as a repackaged website.
  **Don't submit that one.**
- Wrapping the **transactional app** (booking + accounts + location) → much
  safer; that's genuinely "app-like."
- Use **Capacitor** (best fit for the React/Vite stack) rather than a bare
  WebView, and wire up real native capabilities to clear 4.2:
  - Push notifications (ride / concierge updates, deals)
  - Native location (nearby restaurants / attractions / drivers)
  - Native / Apple sign-in, biometric login
  - Offline content, saved favorites, native maps, native share, camera

---

## Compliance blockers (apply to `app.citybucketlist.com`)

| Issue | Apple | Google Play | What's needed |
|---|---|---|---|
| **Account deletion** | Required since 2022 if accounts exist (there is a Login) | Required: in-app **and** a web URL | In-app "delete my account" flow, not just deactivate |
| **Privacy policy + data form** | App Privacy "nutrition label" | Data Safety form | Public privacy policy URL + accurate disclosures |
| **Completeness (Apple 2.1)** | No placeholder / "coming soon" pages | Similar | Partner / Concierge pages must be fully functional, not stubs |
| **User-generated content** | Moderation + report/block if UGC is public | Same | Reporting + moderation if Feedback / reviews are shown to others |
| **Login required up front** | Apple dislikes forcing login before any value | OK-ish | Let users browse before forcing login |
| **Sign in with Apple** | Required *if* other social logins (Google/FB) offered | n/a | Add Apple sign-in if other social logins exist |

---

## Payments

- **Real-world goods/services** (rides, food, attraction bookings) and
  **affiliate link-outs** (Uber/Lyft/Waymo — see `partnership-programs.md`) are
  **exempt** from Apple IAP (30%) and Google Play Billing. External checkout
  (Stripe, etc.) is fine. ✅
- **Digital-only content/subscriptions** (e.g., a paid Concierge membership that
  unlocks app features) → Apple requires In-App Purchase (15–30%), Google
  requires Play Billing. ⚠️ Design around this early if Concierge becomes a
  digital subscription.

---

## Domain verification files (required on the wrapped subdomain)

Both wrapping paths need a verification file hosted on `app.citybucketlist.com`
specifically, over HTTPS with the correct content type:

| Path | File | Location |
|---|---|---|
| Android TWA (Bubblewrap / PWABuilder) | `assetlinks.json` | `https://app.citybucketlist.com/.well-known/assetlinks.json` |
| iOS universal/deep links (Capacitor) | `apple-app-site-association` | `https://app.citybucketlist.com/.well-known/apple-app-site-association` |

Without these: Android TWA shows a browser URL bar (and may fail review); iOS
deep links won't route into the app.

---

## Apple vs. Google — relative difficulty

- **Apple is the harder gate.** Expect possible 1–2 rejection rounds on 4.2.
- **Google Play is more lenient** about web-based apps; cleanest Android path is
  a **Trusted Web Activity (TWA)** via Bubblewrap/PWABuilder. Still avoid
  low-value "webview spam." New developer accounts also face Google identity
  verification + a 14-day closed test with 12+ testers before production.

---

## Bottom line / path to approval

1. Wrap **`app.citybucketlist.com`** (not the marketing site) with **Capacitor**.
2. Add native value: **push + native location + native/Apple sign-in** minimum.
3. Ship compliance basics: **in-app account deletion, privacy policy,
   data-safety / privacy labels**.
4. No placeholder pages; let users explore before forcing login.
5. Keep ride/food/affiliate payments external (physical services); only worry
   about IAP / Play Billing if Concierge becomes a digital subscription.
6. Host `assetlinks.json` and `apple-app-site-association` on the subdomain.

**Open item:** audit the actual `app.citybucketlist.com` codebase (separate repo)
— does it force login first, support account deletion, use digital vs.
real-world payment, have any stub pages? That's where the real approval
questions live.
