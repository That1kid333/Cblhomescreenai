# Scheduled blog posts

The Studio editor has a **Go live on** date and time next to the Publish button.
Pressing **Schedule** saves the post with `status = 'scheduled'` and the go-live
time in `published_at`. No new column is needed: the `blog_posts_status_chk`
constraint already allows `'scheduled'`.

Until that time the post is invisible everywhere public. The `blog_public_read`
RLS policy, the blog list, the post page, the prerender and sitemap edge functions,
and the like-count functions all read only `status = 'published'`.

A database job flips due posts to published every 5 minutes. The site reads posts
live, so nothing needs to be deployed when a post goes live.

## Database job (run once, when this change is merged)

```sql
select cron.schedule(
  'blog-publish-scheduled',
  '*/5 * * * *',
  $$update public.blog_posts
      set status = 'published'
    where status = 'scheduled'
      and published_at <= now()$$
);
```

To turn it off: `select cron.unschedule('blog-publish-scheduled');`

Merge the Studio change and create the job together. Without the job, scheduled
posts would never go live.
