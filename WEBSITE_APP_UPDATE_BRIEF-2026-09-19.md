# WEBSITE BRIEF: citybucketlist.com learns the App Store app exists
Date: Sep 19, 2026. Repo: this one (Cblhomescreenai, the marketing site). Decisions by Keith
the same day. Nothing here touches app.citybucketlist.com or the CBL App repo.

## Why

CityBucketList 1.0 is live on the App Store (Apple ID 6809569228, iPhone, US) and 1.0.1 is
in review. The marketing site does not know. Every "app" mention on it points at
app.citybucketlist.com, the web version: the Home page's "Launch the App" button and
"app.citybucketlist.com" link, the Buckee bar's "Meet Buckee in the app", the Join popup's
"Get the app", the footer, and the How It Works and FAQ pages. There is no App Store badge
anywhere and nothing about scanning a driver's QR code, which is the real way riders join.

## Keith's decisions (Sep 19)

1. Scope: the Home page plus a NEW /app page. Footer and Join popup point at /app.
   How It Works and FAQ are NOT rewritten in this pass.
2. Hierarchy: App Store first, the web app as the alternate ("or open it in your browser").
3. Android: one line, "iPhone today. Android is coming." Android visitors get the web link.
4. Rides: CBL rides are scheduled with a private driver, AND the app offers Uber and Lyft
   for on-demand. Say both. Never say "no on-demand".
5. Standing rule from the CBL App repo's CLAUDE.md, applies here too: NO em-dashes or
   en-dashes in any prose. Commas, periods, parentheses.

## The design, already done

docs/design/app-page-2026-09-19/app-page.html is the approved mockup. Open it in a browser
from the repo (its images are relative paths into src/assets/app/). Build to it. The nav
strip and footer line in the mock are placeholders; the real page sits inside the shared
Layout like every other page.

Assets already in the repo:
  src/assets/app/phone-dashboard.png   500x982, the phone only, cropped from the store panel
  src/assets/app/phone-message.png     same
  src/assets/app/phone-buckee.png      same
  src/assets/app/phone-book.png        spare
  src/assets/app/phone-referrals.png   spare

One asset to add: Apple's official "Download on the App Store" badge, black, English, SVG,
from Apple's marketing tools (tools.applemediaservices.com/app-store or the App Store
marketing guidelines page). Save as src/assets/app/app-store-badge.svg. Do NOT draw a
substitute; the dashed square in the mock is only a placeholder for this file. Apple's
guidelines: minimum 40px tall, clear space around it, never recolor.

Links used throughout:
  App Store   https://apps.apple.com/us/app/citybucketlist/id6809569228
  Web app     https://app.citybucketlist.com  (APP_URL in src/app/lib/constants.ts)

---

## Task 1: the /app page

File: src/app/pages/GetTheApp.tsx, named export `export function GetTheApp()`, route
`{ path: 'app', Component: GetTheApp }` in src/app/routes.ts (import alongside the others).

Follow the repo's page pattern exactly (OurStory.tsx is the reference):
  - all CSS in one inline `<style>{CSS}</style>` string, scoped under `.cbl-getapp`,
    wrapping `<main>`; no nav or footer in the page
  - the same constants: DISPLAY/BODY = 'myriad-pro','Source Sans 3',sans-serif;
    ITALIC = 'Playfair Display',serif; MONO = ui-monospace stack; gold #C99742
  - the canonical column: content max-width 1280px centred, section.band padding
    `48px 48px 56px`, tight variant `28px 48px 36px`, hero title clamp(52px,7vw,104px),
    section-h2 clamp(38px,4.4vw,60px). At <=900px the side padding drops to 24px,
    at <=480px to 16px. This is what keeps every page's left edge lined up; Keith
    notices when it drifts
  - background #0A0A0A like the other reskinned pages (the mock uses the same)

Sections, top to bottom, copy verbatim from the mock:
  1. Hero. Eyebrow "now on the app store". H1 "Your city. / Your driver. / One app."
     with "app." in gold, forced line breaks as in the mock. Lede. CTA row: the App Store
     badge (link, target _blank, rel noopener) then "or open it in your browser" over the
     mono link app.citybucketlist.com. Note line: "iPhone today. Android is coming. Until
     then the web app works on any phone, and it is the same account." Right column: the
     dashboard phone, 340px wide, 36px radius, the soft gold glow under it.
  2. "Scan. Download. Ride." Three step cards (this is a real sequence, so the STEP 1/2/3
     labels stay). Then the pill row: Free for riders / Scheduled private rides /
     Uber & Lyft for on demand / Your driver, saved / Same account on web and app.
  3. Two split rows, phone left then phone right: "Text your driver before you ride."
     and "Buckee plans the whole trip." with their bullet lists.
  4. "Already a member?" strip with the ghost button "Get the app" to the App Store.
  5. "Questions before you download": six Q&As. Keep "What if I need a ride right now?"
     exactly as written (private driver first, Uber and Lyft for on demand).
  6. Closing band "Ready when you are." with the same CTA row, and the line about asking
     your driver for their code first.

Headline widows: the mock breaks headlines with <br> on purpose. Keep those breaks, and
at phone width make sure no headline leaves a single word alone on its last line (the
OurStory pattern of dropping the italic accent to its own line at <=900px is the fix).

Document title: if the repo has no per-page title mechanism, add none; do not introduce a
helmet library for this.

## Task 2: Home page, "Check out our app" band

src/app/pages/Home.tsx, the `.app-band` section (around line 929).
  - Eyebrow stays. H2 becomes "Get the CBL <span class="it">app</span>".
  - Lede: "Rides with a driver you know, Buckee to plan the rest, and your referral code,
    all in one app. It is on the App Store now, and the same account works in your
    browser."
  - APP_FEATURES list stays as is.
  - `.app-actions`: replace the gold "Launch the App" button with the App Store badge
    (link to the App Store, target _blank, rel noopener), keep the mono
    app.citybucketlist.com link beside it but relabel its lead-in "or open it in your
    browser". Add a third item: a text link "See how it works" to /app (react-router
    Link). Under the row, one line in .app-note style (13px, #8a8a8a): "iPhone today.
    Android is coming."
  - The phone image stays. Optionally swap riderDashboardImg for
    src/assets/app/phone-dashboard.png if the current one is older than the 1.0 store
    build; compare first.
  - Buckee bar (around line 877, `href={APP_URL}` on the mic button): leave it. It is a
    feature entry, not a download call to action.

## Task 3: nav, footer, Join popup

  - Layout.tsx desktop nav (the `hidden lg:flex` list, line ~116): add a last top-level
    item "GET THE APP" linking to /app, no dropdown, same type style as the other
    headings. Mobile accordion (`MOBILE_SECTIONS` / line ~298): add the same as a plain
    item (a section with `to: '/app'` and no `items`).
  - Layout.tsx footer (lines ~404-406, the Privacy / Terms / Membership row): add
    "Get the App" to /app as the first item in that row.
  - JoinModal.tsx line ~268: "you'll use in the CBL App. Get the app" currently opens
    APP_URL in a new tab. Point "Get the app" at /app instead (router Link, same tab),
    since that page carries both the store badge and the web link.

## Task 4: verify before pushing

  - `npm run build` passes (vite only; no type-check in this repo, so also run
    `npx esbuild src/app/pages/GetTheApp.tsx --jsx=automatic` as a syntax check).
  - /app at 390px and 1440px matches the mock; no horizontal scroll at 390.
  - Home band at both widths; the badge is at least 40px tall.
  - `grep -rn "[—–]" src/app/pages/GetTheApp.tsx` returns nothing.
  - Every App Store link resolves to id6809569228; every web link to
    https://app.citybucketlist.com.
  - Nav shows GET THE APP on desktop and in the mobile accordion; footer and Join popup
    reach /app.
  - Push to main; Netlify builds; open https://citybucketlist.com/app live and confirm.

## Not in this pass

How It Works and FAQ still describe "the app" generically and still say "scheduled rides
only" in places; those get a copy pass later. No Android badge until there is a Play
listing. No changes to app.citybucketlist.com.
