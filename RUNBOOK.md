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
              │  /api/visitor ──▶ site_visits row (consent-gated) → evening digest
Owner  ──▶ Telegram bot (/api/telegram webhook) — full control plane
       ──▶ Mini App "PULT" (/miniapp + /api/miniapp) — visual admin + CRM
       ──▶ /admin web panel — content editing
Customer ─▶ /b/<token> — live booking tracker
Cron   ──▶ /api/cron/reminders daily 08:00 UTC (agenda, customer reminders
           over WhatsApp, review nudges, IndexNow ping)
       ──▶ /api/cron/digest daily 21:00 UTC (evening summary: visitors,
           enquiries, WhatsApp, money, tomorrow)
Customer ─▶ WhatsApp ──▶ /api/whatsapp (Meta Cloud API webhook; via Dualhook
           coexistence relay — owner's number stays in the WhatsApp app).
           ManyChat was removed on 20 Oct 2026.
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
| `CRON_SECRET` | rec. | Bearer for /api/cron/reminders and /api/cron/digest |
| `GOOGLE_REVIEW_URL` | optional | overrides the baked-in review link |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` / `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | when ads run | conversion tag (consent-gated) |
| `NEXT_PUBLIC_GA_ID` | optional (default G-698G9NVGCZ baked in) | GA4 via the same gtag; events whatsapp_click, call_click, vin_check_submit, booking_submit |
| `NEXT_PUBLIC_META_PIXEL_ID` | when ads run | Meta pixel (consent-gated) |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID` / `WHATSAPP_VERIFY_TOKEN` / `WHATSAPP_APP_SECRET` | for WA bot | Meta Cloud API (webhook `https://www.bmwcoding.ie/api/whatsapp`) |
| `MANYCHAT_SECRET` | legacy name | still accepted as the `?key=` for /api/insights, /api/section-time stats and /api/google-place (ManyChat itself is gone) |
| `WHATSAPP_VERIFY_TOKEN` | for WhatsApp | Meta GET-challenge token AND the `?key=` on the webhook URL (Dualhook signs with its own app secret we never see) |
| `WHATSAPP_API_BASE` | for Dualhook | `https://api.dualhook.com/v25.0`; unset = graph.facebook.com direct |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID` | for WhatsApp | Dualhook `dh_live_…` key (or Meta token) + phone_number_id from the Dualhook connection |
| `WHATSAPP_APP_SECRET` | Meta direct only | X-Hub-Signature-256 check |

After changing env vars: **Redeploy** (with cache is fine).

## Supabase tables (all migrations in `supabase/schema.sql`, idempotent — safe to run whole file)

`categories/services` (catalog) · `settings` · `gallery` · `reviews` ·
`bookings` (+ `public_token`, `source`, `how_heard`, `contact_pref`, `landing`) ·
`blocked_dates` · `business_hours` (weekday pk) · `invoice_drafts` ·
`app_config` (k/v: `slot_duration_hours`) · `clients` (codes C-001, `banned`, `note`) ·
`payments` · `wa_chats`/`wa_messages` (WhatsApp) · `cheat_notes` (/cheat add) ·
`car_models` (+configurator) · `site_visits` (evening digest; until it exists
the digest falls back to section_time). The assistant's per-chat facts live in
`app_config` as `wa_memory:<wa_id>`; `wa_ai_owner = meta` means "assistant off
for every chat" (`/wa off all`).

**A missing table/column never breaks the site**: the booking insert drops
unknown columns and retries; other readers fall back to defaults.

## Telegram bot commands (rebuilt 20 Oct 2026 — 8 in the menu)

- `/agenda` — today, tomorrow, enquiries waiting >24h, and **WhatsApp chats
  nobody answered** (button → list with 🤖 answer now / 💬 open / ✅ handled).
- `/bookings` — dates → day view (free windows; per booking 💶 Paid, 🕓 Move, 🗑 Free).
- `/find <name|number|service>` — clients (history + C-code), WhatsApp chats
  (📖 read), enquiries. `/client` is an alias.
- `/paid [120 Name Service] [cost 50 FSC] [share 25 Name]` · `/paid del last`.
  Also 💶 under a booking and the PULT Money tab. `/log` is an alias of `/paid`.
- `/wa` — help + assistant state. `/wa pending` · `/wa log|stop|start|reset|mine +353…` ·
  `/wa +353… text` · `/wa off all` / `/wa on all` (old `/ai on|off` maps here).
  **Swipe-reply** to a WhatsApp mirror or 🚨 alert in the group sends the text to
  that customer (only within 24h of their last message; only TG_OWNER_ID's replies).
- `/reply [key]` — canned replies + ⭐ review request (`/review Name Service` still works).
- `/invoice` — PDF wizard (`/cancel`; a draft idle for 30 min expires).
- `/tools` — 🇯🇵 `/jp` address · 🔧 `/cheat [query|add|del]` · 📊 `/stats` ·
  📆 `/calendar` · ⛔️ `/banlist` (`/ban C-007 reason`, `/unban`).
- `/setup` re-registers the menu and the reply keyboard (⏰ Agenda · 📅 Bookings ·
  💰 Paid · 🧰 Tools).

Automatic messages: booking/VIN/chat leads, one WhatsApp mirror per customer
message (a specific-time request is a line in it, not a separate alert), 🚨
pinned alert only when a customer asks for a person or is fed up, morning
agenda + reminders, evening digest. No per-visitor pings any more.

Mini App **PULT** tabs: Today · Money (full accounting) · Schedule (block
days) · Clients (CRM: search, LTV, history, notes, ban, rename, delete,
call/WhatsApp/review) · Services · Reviews · Hours (+ slot length 1–4h) · Stats.

**Installable app (iOS + Windows).** PULT is a PWA (`/manifest.webmanifest`
+ `/sw.js`, scope `/miniapp`). iPhone: open `bmwcoding.ie/miniapp` in Safari
→ Share → *Add to Home Screen*. Windows: open in Chrome/Edge → *Install* icon
in the address bar. Outside Telegram it shows a **password sign-in**
(`ADMIN_PASSWORD`); the key is stored in localStorage (`pult_key`) and sent as
`adminKey` on every `/api/miniapp` call — same owner access as Telegram
initData. Log out = clear the app's site data.

**Money tab / accounting.** Per job: client, paid, costs (FSC/parts), net
(= paid − costs), partner share (% of net, default 25%), and *yours*
(= net − share). 30-day totals: received / costs / net profit / to-pay-out,
plus owed-per-person. Add-job form + per-row delete. Same rows and math as the
bot's `/paid` (economics columns in `payments`: `cost`, `cost_note`,
`share_pct`, `share_name`).

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
| Digest says "site activity" not "visitors" | `site_visits` table not created yet | run the `site_visits` block of `supabase/schema.sql` |
| Swipe-reply says "only the owner's replies" | TG_OWNER_ID is not the replier's user id | set TG_OWNER_ID to Alex's personal Telegram id |
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

60+ indexable pages: 12 service landings (incl. CarPlay Ireland, fullscreen
CarPlay, ID4→ID6, 6WA→6WB, iDrive upgrades) + 11 county + 13 chassis (dynamic
`[landing]` route) + hub `/bmw-coding-ireland` + `/bmw-coding-list` + blog (12
guides) + `/find-us`. Sitemap lists ONLY canonical URLs (~64): the homepage in
all 6 locales (fully translated, self-canonical + hreflang) and every other
page in English only — their /ru,/pl… copies are English bodies that canonical
to the English URL, so they carry no hreflang and are not in the sitemap
(Search Console flagged 295 of them as "alternate with canonical" in Oct 2026).
`/image-sitemap.xml` (gallery) — both in robots.txt.
Titles/descriptions go through `src/lib/seoText.ts` (≤62 / ≤158 chars, brand
only when it fits) — use it for any new page. `/projects` lists real gallery
photos with their captions (`src/lib/projectLinks.ts` links each to its
service/model pages). Full audit, keyword map and roadmap: `docs/seo/`. JSON-LD: WebSite +
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
