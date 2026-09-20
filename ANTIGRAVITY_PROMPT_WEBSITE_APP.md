This is the marketing site repo (Cblhomescreenai), not the CBL App repo.

Read WEBSITE_APP_UPDATE_BRIEF-2026-09-19.md in the repo root, then open
docs/design/app-page-2026-09-19/app-page.html in a browser at 1440 and 390 wide so you
have seen the target before writing anything. The phone images it uses are already in
src/assets/app/.

Then, in this order, one PR per task or one PR for all four titled
"feat(site): App Store app on Home, new /app page, nav + footer + Join links":

1. Download Apple's official "Download on the App Store" badge (black, English, SVG) to
   src/assets/app/app-store-badge.svg. Do not draw a substitute.
2. Task 1: build src/app/pages/GetTheApp.tsx from the mock, following OurStory.tsx's
   page pattern (scoped inline CSS under .cbl-getapp, no nav/footer, the 1280px column
   and 48px band padding). Copy is verbatim from the mock. Add the route `app` in
   routes.ts. Commit the page file BEFORE routes.ts so no commit imports a missing file.
3. Task 2: Home.tsx app band. App Store badge first, "or open it in your browser" link
   second, "See how it works" to /app, one Android line.
4. Task 3: GET THE APP in the desktop nav and mobile accordion, "Get the App" in the
   footer row, and JoinModal's "Get the app" pointing at /app.
5. Task 4 verify list in the brief: build, esbuild syntax check on the new page, 390 and
   1440 checks, no em or en dashes in the new page, all links resolve, then push to main
   and confirm https://citybucketlist.com/app live.
6. Report back: PR number(s), a screenshot of /app at 390 and 1440, and anything you
   changed that the brief did not ask for.

Do NOT: rewrite How It Works or FAQ, add an Android or Play badge, touch the Buckee bar's
link, add a helmet or meta library, use em-dashes or en-dashes in copy, or run git against
the mounted folder from a Claude session.
