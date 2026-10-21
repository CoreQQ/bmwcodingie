# SEO roadmap — 30 / 60 / 90 days

No rankings are promised. Targets are actions and measurable signals.

## Days 0–30
**Site (developer)**
- [x] Review and deploy this branch (deployed 21 Oct). Next: request indexing in Search Console for `/`, `/projects`, the 10 P1/P2 service pages.
- [x] Fix the ServiceLanding hydration errors (#418/#423) — fixed 21 Oct (footer LinkBlock).
- [ ] Re-run PageSpeed Insights (mobile) on `/` and `/apple-carplay-activation-dublin`; record LCP/CLS in TEST-RESULTS.md.
- [ ] Owner decisions from SEO-AUDIT.md (coding "from" price, FSC wording, Louth, "base in Rathcoole").

**Owner**
- [ ] Google Business Profile: create/verify, service areas, services with prices, 10 real photos (LOCAL-SEO.md §1).
- [ ] WhatsApp profile: remove Greenogue address, website with www.
- [ ] Ask every customer from the last 3 months for a Google review.
- [ ] Enable Vercel Web Analytics (one click) so visits by source are visible.
- [ ] Add model/year/before/after to gallery captions (CONTENT-PLAN.md → case studies).

**Measure:** indexed pages (Search Console → Pages), impressions for P1 queries, GBP views.

## Days 31–60
- [ ] Publish 4 articles from CONTENT-PLAN.md (#1–#4).
- [ ] County pages: either enrich each with a real local job/photo and genuinely local detail, or consolidate remote-only counties into `/remote-bmw-coding-ireland` with 301s (decide from Search Console: keep pages that get impressions).
- [ ] Case-study pages generated from enriched gallery captions.
- [ ] Citations: Bing Places, Apple Business Connect, Golden Pages, Facebook/Instagram links.
- [ ] adverts.ie / DoneDeal ads for CarPlay, Japan → EU and coding, each linking to its page.
- [ ] Weekly GBP post.

**Measure:** clicks from Google (target: steady week-on-week growth), position of P1 queries, review count, WhatsApp clicks and VIN checks in GA4.

## Days 61–90
- [ ] 4 more articles (#5–#8); refresh the price article.
- [ ] Look for page-2 queries (positions 8–20) in Search Console and strengthen those pages first (intro, FAQ, real photos).
- [ ] Decide on CarPlay Dublin vs Ireland merge if they cannibalise.
- [ ] Link earning: ask satisfied trade customers (dealers, importers you convert cars for) for a link from their site.
- [ ] Review GA4 conversions by landing page; adjust titles/CTAs on pages that get visits but no leads.

**Measure:** organic leads per month (VIN checks + bookings + WhatsApp clicks from organic), compared with the 30-day baseline.

## Measurement plan
| What | Where | How |
|---|---|---|
| Organic clicks, impressions, average position, queries | Search Console → Performance | Weekly; filter Country = Ireland |
| Indexing | Search Console → Pages | After each deploy |
| Sessions by source, landing pages | GA4 (`G-698G9NVGCZ`, live since 7 Oct) | Reports → Acquisition / Engagement |
| WhatsApp clicks | GA4 event `whatsapp_click` (page_path) | already sent from the site |
| Phone clicks | GA4 event `call_click` | already sent |
| VIN checks | GA4 `vin_check_submit` + Telegram lead | already sent |
| Booking / quote requests | GA4 `booking_submit` + Telegram lead | already sent |
| Google Ads conversions | `AW-17881862993` (consent-gated) | existing |
| Organic conversion rate | GA4: organic sessions → events above | mark the 4 events as Key events in GA4 Admin |
| GBP | Business Profile → Performance | calls, website clicks, direction requests |
| Lead flow by channel (internal) | `/api/insights?key=…` | weekly counts by channel |

Owner setup still needed: mark `whatsapp_click`, `call_click`, `vin_check_submit`, `booking_submit` as **Key events** in GA4 (Admin → Events), and link GA4 ↔ Google Ads (Admin → Product links).
