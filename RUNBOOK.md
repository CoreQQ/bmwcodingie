# RUNBOOK — bmwcoding.ie

Operations manual for the whole system. If something breaks, start here.
Last major revision: July 2026.

---

## Architecture at a glance

```
Visitor ──▶ bmwcoding.ie (Next.js 14 on Vercel, edge-cached)
              │  /api/booking ──▶ Supabase (bookings, clients) ──▶ Telegram notify
              │  /api/slots   ──▶ live availability (hours, duration, overlaps)
              │  /api/chat    ──▶ Anthropic (site AI assistant)
              │  /api/visitor ──▶ Telegram visitor ping (consent-gated)
Owner  ──▶ Telegram bot (/api/telegram webhook) — full control plane
       ──▶ Mini App "PULT" (/miniapp + /api/miniapp) — visual admin + CRM
       ──▶ /admin web panel — content editing
Customer ─▶ /b/<token> — live booking tracker
Cron   ──▶ /api/cron/reminders daily 07:00 UTC (agenda, review nudges,
           stale-booking flags, IndexNow ping)
Dormant ─▶ /api/whatsapp (Meta Cloud API AI bot), /api/manychat (bridge)
```

## Environment variables (Vercel → Settings → Environment Variables)

| Var | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | public reads |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | server writes (bookings, admin, bot) |
| `NEXT_PUBLIC_SITE_URL` | yes | `https://www.bmwcoding.ie` (www matters!) |
| `TG_TOKEN` / `TG_CHAT_ID` | yes | bot + owner chat (group id works) |
| `TG_WEBHOOK_SECRET` | yes | protects /api/telegram |
| `TG_OWNER_ID` | rec. | Mini App owner check (falls back to TG_CHAT_ID) |
| `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` | yes | /admin login + calendar token |
| `ANTHROPIC_API_KEY` | yes | site chat + WhatsApp AI |
| `CRON_SECRET` | rec. | Bearer for /api/cron/reminders |
| `GOOGLE_REVIEW_URL` | optional | overrides the baked-in review link |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` / `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | when ads run | conversion tag (consent-gated) |
| `NEXT_PUBLIC_META_PIXEL_ID` | when ads run | Meta pixel (consent-gated) |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID` / `WHATSAPP_VERIFY_TOKEN` / `WHATSAPP_APP_SECRET` | for WA bot | Meta Cloud API (webhook `https://www.bmwcoding.ie/api/whatsapp`) |
| `MANYCHAT_SECRET` | for ManyChat | bridge auth (`?key=` or `x-manychat-secret`) |

After changing env vars: **Redeploy** (with cache is fine).

## Supabase tables (all migrations in `supabase/schema.sql`, idempotent — safe to run whole file)

`categories/services` (catalog) · `settings` · `gallery` · `reviews` ·
`bookings` (+ `public_token`, `source`, `how_heard`, `contact_pref`, `landing`) ·
`blocked_dates` · `business_hours` (weekday pk) · `invoice_drafts` ·
`app_config` (k/v: `slot_duration_hours`) · `clients` (codes C-001, `banned`, `note`) ·
`payments` · `wa_chats`/`wa_messages` (WhatsApp) · `cheat_notes` (/cheat add) ·
`car_models` (+configurator)

**A missing table/column never breaks the site**: the booking insert drops
unknown columns and retries; other readers fall back to defaults.

## Telegram bot commands

`/bookings` dates → day view (Free windows line; per booking: 💶 Paid, 🕓 Move, 🗑 Free) ·
`/stats` (+revenue) · `/invoice` PDF wizard (`/cancel`) · `/review [Name Service]` ·
`/client <name|number|C-code>` · `/reply [key]` canned replies · `/cheat [query|add|del]` ·
`/paid [120 Name Service]` · `/ban` `/unban` `/banlist` · `/calendar` ICS ·
`/wa +353… text` (when WA connected) · `/setup` re-registers this menu.

Mini App **PULT** tabs: Today · Schedule (block days) · Clients (CRM: search,
LTV, history, notes, ban, call/WhatsApp/review) · Services · Reviews · Hours
(+ slot length 1–4h) · Stats.

## Slot logic

Windows start **every hour**, length = `slot_duration_hours` (PULT → Hours,
default 2h). A **confirmed** booking blocks every overlapping window
(site picker, PULT move, bot move/free lists all agree — logic in
`src/lib/hours.ts`: `windowsFor`, `windowsOverlap`). Freeing (status
`cancelled`) releases the window instantly; customer data is kept.
Blacklisted clients: booking auto-declined silently, slot never held.

## Common issues → fixes

| Symptom | Cause | Fix |
|---|---|---|
| Telegram buttons dead | webhook on apex domain (308) | re-set webhook on `https://www.bmwcoding.ie/api/telegram` with secret |
| PULT "auth: none / not owner" | apex URL in BotFather, or TG_OWNER_ID mismatch | BotFather URL must be `https://www.bmwcoding.ie/miniapp`; set TG_OWNER_ID to id from debug line; Redeploy w/o cache |
| PULT shows stale UI | Telegram WebView cache | fully close Mini App / restart Telegram |
| "Something went wrong" on booking | insert failing — check Vercel logs | insert self-heals for missing columns; run `supabase/schema.sql` |
| "Server / app error" reports: removeChild | browser auto-translate vs React | guarded in root layout (`Node.prototype.removeChild` patch) — if new patterns appear, extend guard |
| Slow TTFB / cache MISS | something made root layout dynamic | root layout must stay locale-independent; `setRequestLocale` in [locale] |
| Hydration crash (#418/#425) | `new Date()` in first render of a static page | gate with `mounted` state (see SlotPicker) |
| No visitor pings | normal — pings only fire after cookie **Accept all** | check Vercel Analytics / GSC for true traffic |
| Command menu missing in group | Telegram cache | `/setup` again, reopen chat |

## Deploy flow

Work happens on `claude/website-analysis-review-oboy2c`, merged `--no-ff` into
`main`; Vercel auto-deploys `main` (1–2 min). Verify:
`curl -s https://www.bmwcoding.ie/api/slots` (fresh JSON) and the page in an
incognito tab. Local: `npm run build` must be clean before any merge.

## Security posture

- All admin surfaces owner-gated: Telegram (chat id + webhook secret),
  Mini App (initData HMAC + owner id), /admin (HMAC session cookie).
- Public APIs rate-limited per IP: booking 5/10min, chat 15/5min (2k chars/msg),
  error-report 5/10min, visitor 4/10min; WhatsApp AI 20/hr per sender.
- All user text HTML-escaped before Telegram; slot fields format-validated.
- Security headers in `next.config.js` (nosniff, referrer, permissions).
  No X-Frame-Options globally — Telegram Web embeds /miniapp in an iframe.
- Secrets only in env vars; the only baked-in public value is the Google
  review link.

## SEO surface (don't regress)

30+ indexable pages: 7 service landings + 11 county + 11 chassis (dynamic
`[landing]` route) + hub `/bmw-coding-ireland` + `/bmw-coding-list` + blog (8
guides) + `/find-us`. Sitemap 264 URLs + `/image-sitemap.xml` (gallery) —
both in robots.txt. hreflang on all landings (6 locales). JSON-LD: WebSite +
AutoRepair (+AggregateRating only when real reviews exist) + Service/FAQ/
Breadcrumb per page. `llms.txt` + `/rss.xml` + daily IndexNow ping (key file
`public/f8a4….txt`). Never add `noindex`, never fabricate reviews.

## Known issue (cosmetic, documented July 2026)

Landing pages rendered by `ServiceLanding` (service/county/chassis pages) log
recoverable React hydration errors (8×#418 + 1×#423) in the browser console on
production builds. **No user-visible impact**: React falls back to client
rendering, the page looks and works correctly, and crawlers read the complete
SSR HTML (SEO unaffected). Homepage and blog are clean; dev mode doesn't
reproduce. Repro: `npm run build && npx next start`, open /bmw-f30-coding,
watch console. Investigated: not width-dependent, not the translate-guard
(predates it), text content SSR≈hydrated (only structural/attr level).
Next step if ever needed: build with unminified React errors
(NEXT_PRIVATE_DEBUG or patched react-dom) to get the exact node, or bisect by
stubbing ServiceLanding islands (Header/MobileActionBar) one at a time.

## The one rule

**Never lose a lead.** Every write path that touches bookings must degrade
gracefully (notify Telegram even if the DB write fails) — keep it that way.
