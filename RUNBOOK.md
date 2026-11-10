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
              │  /api/visitor ──▶ Telegram visitor ping + site_visits row → digest
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
the digest falls back to section_time). (`wa_memory:<wa_id>` rows in
`app_config` are from the old assistant and no longer read.) `wa_ai_owner = meta` means "assistant off
for every chat" (`/wa off all`).

**A missing table/column never breaks the site**: the booking insert drops
unknown columns and retries; other readers fall back to defaults.

## Telegram bot commands (rebuilt 20 Oct 2026 — 10 in the menu)

- `/agenda` — today, tomorrow, enquiries waiting >24h, and **WhatsApp chats
  nobody answered** (button → list with 🤖 answer now / 💬 open / ✅ handled).
- `/quotes` — **every enquiry (quote request) in one place** until it is closed:
  🆕 not answered yet → 💬 answered, waiting on the customer → 🏁 Booked
  (`status='won'`) or 👎 No deal (`status='lost'`). Enquiries = `bookings`
  rows with no slot, `status='pending'`, last 30 days, one line per person.
  Card: number, WhatsApp, chat log, ✅ Answered, 📋 follow-up text, ✖️ Dismiss.
  The agenda shows the counts and a 📥 button. `/enquiries`, `/leads` work too.
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
- `/prices` — every coding price in one message, by system, with the
  combinations, extras, rules and current/upcoming offers. Built from
  `src/lib/pricing.ts` (`src/lib/priceList.ts`), so it always matches the site.
  Also 💶 in `/tools` and on the reply keyboard.
- `/tools` — 🇯🇵 `/jp` address · 🔧 `/cheat [query|add|del]` · 📊 `/stats` ·
  📆 `/calendar` · ⛔️ `/banlist` (`/ban C-007 reason`, `/unban`).
- `/setup` re-registers the menu and the reply keyboard (⏰ Agenda · 📅 Bookings ·
  📥 Quotes · 💰 Paid · 💶 Prices · 🧰 Tools).

**Group topics** (8 Nov): with Topics switched on in the group, `/topics`
creates six topics and stores their thread ids in `app_config.tg_topics`:
📥 Заявки (enquiries without a time) · 💬 WhatsApp (mirrors; 🚨 when the
customer got no answer) · 🚨 Срочно (handover alerts, delivery/bot errors,
Dualhook trouble) · 📅 Записи и день (booking requests with a time, morning
agenda, reminders, digest) · 👀 Посетители · 🚀 Сайт и система ("Site
updated", offer-mismatch warning, events). Each send names its topic
(`sendOwnerMessage(text, kb, topic)` etc.); command replies go back to the
topic the owner typed in (`replyInThread`, AsyncLocalStorage). Topics can be
renamed or reordered in Telegram; a deleted one falls back to General, and
`/topics` recreates whatever is missing. Bots cannot switch Topics on: the
owner flips it once in the group settings, and the bot creates its topics by
itself on the next update (or at the 08:00 cron) — `autoTopics()`.

Automatic messages: booking/VIN/chat leads, one WhatsApp mirror per customer
message (a specific-time request is a line in it, not a separate alert), 🚨
pinned alert only when a customer asks for a person or is fed up, morning
agenda + reminders, evening digest, and a ping per site visitor (consent-gated,
IE/GB only, 10-min cooldown per IP — back by the owner's choice on 25 Oct).

Tomorrow's reminders (morning cron): free text if the customer wrote in the
last 24h, otherwise the approved WhatsApp template `appointment_reminder`
(utility, en, 4 body params; created via Dualhook 21 Oct, id 2125231011455361);
if that fails (pending review, no payment method) Alex gets copy buttons.

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

## WhatsApp assistant (rebuilt 10 Nov 2026)

`src/lib/waAgent.ts` + the prompt in `src/lib/assistantPrompt.ts`
(`WHATSAPP_PROMPT`; prices come from `CORE_FACTS`, shared with the site chat).

- **One model call, one structured answer** (`output_config.format`): `reply`
  (the exact message, may be empty), `notify_alex` (shown in the Telegram
  mirror as "👉 For you"), `urgent` (pinned 🚨 alert + 6h stand-down) and
  `lead` (creates or updates the open enquiry). The model's own notes can no
  longer reach a customer, which happened on 10 Nov.
- **Model:** `claude-opus-5-5`, effort `low`, refusal fallback to
  `claude-opus-5` (server-side `fallbacks`), and `claude-sonnet-5-5` as a
  backup when the call errors or takes over 25 s. Thinking is always on and
  counts toward `max_tokens` (4000) — do not lower it to "keep replies short";
  the prompt does that.
- **The conversation goes in as one labelled transcript** (last 30 messages:
  Customer / You / Alex, with Irish timestamps); everything the customer sent
  since the last reply is answered together.
- **Bursts:** the webhook waits 6 s and only the newest customer message in
  the chat is answered (`BURST_WAIT_MS`). Reactions and stickers are stored
  and never answered. The "album didn't come through" and "can't open
  attachments" lines are sent once per chat per 12 h / 6 h.
- **No regex gates any more.** The old code went silent for 6 h whenever a
  message contained "Alex", handed over on words like "ai", "bot" or "yoke",
  and forced a speech about times on any "today". The model now decides: it
  answers what the facts cover and flags the rest for Alex.
- **Stand-down rules unchanged:** Alex replying from his phone (or "I'll
  reply") silences the assistant in that chat for 6 h; `/wa stop` for good.
- **Testing:** `POST /api/report/agent-test?key=<diagnostics key>` runs the
  assistant on made-up conversations — no database, no WhatsApp, no Telegram.
  `GET /api/report/review?key=…&part=wa` returns recent real chats with
  numbers masked. The 30 scenarios used on 10 Nov are in the session
  scratchpad; re-run them after any prompt change.

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

**Flaky build:** `next/font/google` downloads Sora and DM Sans from Google at
build time, and now and then that fails ("An error occurred in `next/font`
… Cannot read properties of null (reading '1')"). The site keeps the previous
version; `npm run build` retries once after 20 s (package.json), which is
what fixes it every time.

**"Site updated" in Telegram:** each production build is announced once
(`src/lib/deployPing.ts`, key `last_deploy` = "<build time>:<commit>" in
`app_config`) — by `GET /api/deploy-ping` after a deploy, or by the first
WhatsApp / Telegram / visitor request the new build serves. It reads the
stored value, stays silent for the same commit or a newer build, claims with
a compare-and-swap, and a server instance announces at most once. It sent
repeats on 8 and 10 Nov — **never poll `/api/deploy-ping` in a loop**; wait
on the `v:` marker of `/api/whatsapp` and call the ping once. The line quotes
the commit's first line (merge prefix stripped), so write it for the owner.

**Offers (11.11, Black Friday, Christmas):** dates in
`src/lib/season-dates.json` as `[first day, last day, show-as-coming-soon
from]`. They are baked in at build time (`NEXT_PUBLIC_SEASON`,
`NEXT_PUBLIC_UPCOMING` in `next.config.js`), so the site must be redeployed
on each switch day (scheduled in the Claude session; the 08:00 reminders
cron warns in Telegram when the live offer does not match the date).
Bookings made on 11 Nov carry an "11.11 offer" note in their message
(`src/lib/offerNote.ts`).

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

## Fixed: landing-page hydration errors (July → 21 Oct 2026)

`ServiceLanding` pages logged 8×#418 + 1×#423 on every production load, and the
dev server 500'd on them with "Cannot read properties of null (reading 'is')".
Cause: the footer's `LinkBlock` rendered the same `children` element objects
twice (desktop grid + phone `<details>`), which Next 14's RSC payload
de-duplication cannot hydrate. Fix: `children` is a function called once per
copy. **Rule: never render one JSX element object in two places** — build it
with a function (see `ctaRow()` in ServiceLanding).

## The one rule

**Never lose a lead.** Every write path that touches bookings must degrade
gracefully (notify Telegram even if the DB write fails) — keep it that way.
