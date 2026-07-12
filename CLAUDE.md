# CLAUDE.md

Read `RUNBOOK.md` first — it maps the whole system (env vars, tables, bot
commands, common failures, deploy flow).

## Working agreements (established with the owner)

- Develop on `claude/website-analysis-review-oboy2c`, merge `--no-ff` to
  `main` (Vercel auto-deploys). Never push other branches, never open PRs.
- The owner works from a phone; Telegram is his cockpit. Prefer bot/Mini App
  features over web admin.
- Owner messages are in Russian — reply in Russian, keep code/UI in English.
- Every DB migration goes into `supabase/schema.sql` (idempotent) AND the
  server code must tolerate the migration not having run yet (fallbacks /
  drop-and-retry). A pending migration must never break production.
- Never lose a lead: booking paths must notify Telegram even when the DB
  write fails.
- Honest marketing only: no fake reviews, AggregateRating only from real
  rows, no grey WhatsApp libraries (ban risk for the owner's number).

## Gotchas that already bit us (don't repeat)

- Webhooks MUST use `https://www.bmwcoding.ie` (www) — apex 308s and
  Telegram/Meta won't follow.
- Root layout stays locale-independent (edge cache HIT); `setRequestLocale`
  everywhere under `[locale]`. No `new Date()` in the first render of static
  pages (hydration) — gate with `mounted`.
- Next 14 `MetadataRoute.Sitemap` silently drops `images` — the image
  sitemap is a handwritten route (`/image-sitemap.xml`).
- Telegram WebView caches the Mini App hard — "it didn't update" usually
  means close/reopen Telegram, not a bug.
- `pkill` kills its own shell chain — run git in a separate Bash call.
- Slot windows overlap (hourly starts, configurable duration) — availability
  logic lives ONLY in `src/lib/hours.ts`; never reimplement it inline.

## Verify before merging

`npx tsc --noEmit` + `npm run build` clean, and for UI changes a Playwright
screenshot pass (mobile 390px + desktop) — scripts pattern in the scratchpad
history; hydration repro via `TZ='Pacific/Kiritimati' npm run build`.
