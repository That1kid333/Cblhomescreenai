# Weekly CBL Dispatch — Activation Checklist

**Status: BUILT + DEPLOYED + verified running.** Three short steps to go live. The
sender runs as a **Supabase Edge Function** (not Netlify) because the Resend key
lives on the production Netlify site — a separate account I can't reach — and the
subscribers/posts are all in Supabase anyway.

## What's already deployed (Supabase project `jgbaqzgkdqqvxmqytgsx`)
- **`send-weekly-digest`** — compiles the week's published posts (falls back to the
  latest 3 so it's never empty) + a featured community submission, and emails every
  **active** `newsletter_subscribers` row via Resend from **info@citybucketlist.com**.
  `?test=<email>` sends a single preview to that address only. Auth = service-role bearer.
- **`unsubscribe`** — the public unsubscribe-link target; sets `status='unsubscribed'`
  by the subscriber's token. Verified live.
- Verified: the sender returns `401 unauthorized` without the key; unsubscribe renders
  its branded page. Every email carries an unsubscribe link + `List-Unsubscribe` header.

## Go live — 3 steps (Keith/Justin)

### 1. Add the Resend key — THE unlock
Supabase Dashboard → **Project Settings → Edge Functions → Secrets** → add
`RESEND_API_KEY` = the same key that already sends your info@ / lead / contact mail.
_(CLI: `supabase secrets set RESEND_API_KEY=re_xxx --project-ref jgbaqzgkdqqvxmqytgsx`)_

### 2. Send yourself a test (before it ever touches the list)
```bash
curl -X POST 'https://jgbaqzgkdqqvxmqytgsx.supabase.co/functions/v1/send-weekly-digest?test=keith@citybucketlist.com' \
  -H 'Authorization: Bearer <YOUR_SUPABASE_SERVICE_ROLE_KEY>'
```
Service-role key: Supabase → **Project Settings → API → service_role**. Check your inbox,
approve the look. (Tell Claude to tweak the template anytime.)

### 3. Schedule it weekly (Thursdays 9am ET)
```sql
-- one-time: stash the service-role key in Vault so the cron can authenticate
select vault.create_secret('<YOUR_SUPABASE_SERVICE_ROLE_KEY>', 'digest_service_role');

select cron.schedule('weekly-cbl-dispatch', '0 13 * * 4', $$
  select net.http_post(
    url := 'https://jgbaqzgkdqqvxmqytgsx.supabase.co/functions/v1/send-weekly-digest',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='digest_service_role')
    )
  );
$$);
```
(Needs the `pg_cron`, `pg_net`, and `vault` extensions — all standard on Supabase. Change
`0 13 * * 4` to reschedule; UTC.)

## Good to know
- **From:** info@citybucketlist.com — already a verified sender in Resend, so nothing new there.
- Sends **individually** (each with its own unsubscribe link), with a gentle rate-limit — fine for the current list. If the list grows into the thousands, we'd switch to Resend batch.
- Content each week = new posts since last Thursday + one featured "Boast about your city" submission. Skips nothing; never sends an empty email.
