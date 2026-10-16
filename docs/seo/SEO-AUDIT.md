# SEO audit — bmwcoding.ie

Audit date: 16 Oct 2026. Branch: `claude/website-analysis-review-oboy2c`.
Checkpoint before changes: tag `seo-checkpoint-2026-10-16` (= production `main` 93923f4).

Method: full crawl of every sitemap URL on the live site with a Googlebot
user agent (status, robots, canonical, title, description, H1–H6, JSON-LD,
images, internal links), the same crawl against a local production build of
the changed code, a review of the source, and Playwright checks at 390 px and
1440 px. Field data (CrUX) does not exist for this site yet, so Core Web
Vitals below are **lab measurements only** and are marked as such.

Severity: **Critical** — harms customers or indexing now · **High** — clear
ranking/CTR impact · **Medium** — worth fixing · **Low** — hygiene.

## Findings

| # | Severity | Issue | Evidence | Status |
|---|---|---|---|---|
| 1 | Critical | Appointment reminders still sent customers to the closed workshop ("We're at Grants View, Greenogue Business Park… big ORANGE GATES") | `src/app/api/cron/reminders/route.ts` — text not gated by the 20 Sep 2026 mobile-only switch | **Fixed** |
| 2 | Critical | Gallery photos served as raw uploads: 1.8 MB JPEG, 3.7–4.5 MB PNGs, on the homepage and every service page | measured on the live image URLs | **Fixed** (next/image → WebP/AVIF at display size) |
| 3 | High | Titles too long — every page got " \| BMW Coding" appended; model pages reached 124 chars, descriptions 225 | live crawl: 66/66 pages over 65 chars or 160 chars | **Fixed earlier today** (`seoTitle`/`seoDescription`), in production |
| 4 | High | Full duplicate of the site on `bmwcodingie.vercel.app` (HTTP 200, no noindex) | curl | **Fixed earlier today** (308 → www), in production |
| 5 | High | Sitemap listed ~295 locale copies whose canonical is the English URL ("alternate page with proper canonical" ×83 in Search Console) | Search Console screenshot, sitemap | **Fixed 15 Oct**, in production |
| 6 | High | Technical inaccuracy: CarPlay Dublin page said CarPlay is enabled on "NBT, NBT Evo and MGU"; native CarPlay is not possible on NBT (non-Evo) by coding | `servicePages.ts` | **Fixed** — NBT/CIC now stated as "needs a different head unit" |
| 7 | High | Pages advertised "FSC code generation" | servicePages, codingList, defaults, chassis F10 FAQ, Japan blog post | **Reworded** to "FSC activation code" — owner to confirm wording (see Owner decisions) |
| 8 | High | Homepage title/H1 did not contain the primary phrase "BMW Coding Ireland" | live HTML | **Fixed** |
| 9 | High | Homepage and `/bmw-coding-ireland` hub both targeted "BMW Coding Ireland" | titles | **Fixed** — hub retitled "BMW Coding Across Ireland \| Every County & Model" |
| 10 | Medium | Orphan page `/bmw-cruise-control-retrofit` (0 internal links) | link graph from `/` | **Fixed** (service nav + retrofits page) |
| 11 | Medium | Blog posts had 1–2 internal links each | link graph | **Fixed** — "Guides on this topic" block on every service page (auto from each post's related services) |
| 12 | Medium | Footer links `#services`, `#work`, `#about`, `#contact` were relative — on inner pages they pointed at anchors that do not exist | Footer.tsx | **Fixed** (`/#…`) |
| 13 | Medium | Heading hierarchy skipped levels (h2 → h4) on 50+ pages — footer used h4 | crawl | **Fixed** (footer h2) |
| 14 | Medium | Opening hours in JSON-LD hard-coded in the layout, independent of the diary hours | layout.tsx | **Fixed** — read from `business_hours` (admin) with the same default |
| 15 | Medium | Service JSON-LD repeated a thin, separate provider object on every page | ServiceLanding.tsx | **Fixed** — `provider: {@id: …/#business}` |
| 16 | Medium | Blog posts had no BreadcrumbList; author/publisher were loose objects | blog/[slug] | **Fixed** |
| 17 | Medium | Core service pages showed no price although prices are public in the calculator | servicePages.ts | **Fixed** — verified prices or "quoted per car" on 11 pages, plus schema `Offer` where a figure exists |
| 18 | Medium | No page for real completed jobs ("Actual Projects" layer of the architecture) | — | **Added** `/projects` (owner's own photos and captions only) |
| 19 | Medium | Language homepages `/ru` `/uk` `/pl` `/lt` `/ro` not linked by any crawlable `<a>` (switcher is a control) | link graph | **Fixed** — language links in footer |
| 20 | Medium | IndexNow ping only covered home, hub and blog | cron route | **Fixed** — all canonical pages |
| 21 | Medium | Head-unit list "NBT, NBT Evo and MGU (iDrive 6, 7 and 8)" mislabelled NBT | location + Dublin pages | **Fixed** — "NBT (iDrive 4), NBT Evo (iDrive 5/6), MGU (iDrive 7/8) — CarPlay needs NBT Evo or newer" |
| 22 | Medium | 11 county pages share most of their text (one local paragraph + towns each) — doorway-page risk | locationPages.ts | **Not changed** — some get traffic (Cork, Limerick); project rule forbids noindex. See roadmap: enrich or consolidate. |
| 23 | Medium | React hydration errors #418/#423 on every ServiceLanding page (production build) | Playwright; documented in RUNBOOK since July | **Pre-existing, unchanged.** Page renders correctly; costs a client re-render (INP). Roadmap item. |
| 24 | Low | `/en` redirects with 307 (temporary) to `/` | curl | Not changed (next-intl default; `/en` is not linked or in the sitemap) |
| 25 | Low | AggregateRating is built from the site's own review rows — Google does not show stars for self-served LocalBusiness reviews | layout.tsx | Kept (real rows only, per project rule); no rich-result expectation |
| 26 | Low | FAQPage schema on commercial pages — valid, but Google shows FAQ rich results only for government/health sites | — | Kept as valid markup, no rich-result expectation |
| 27 | Low | ESLint not configured (`next lint` opens the setup wizard) | npm run lint | Not changed — adding a config would turn `next build` linting on and is a separate task |
| 28 | Info | WhatsApp Business profile still shows the Greenogue address and `https://bmwcoding.ie` (no www) | Dualhook health response | **Owner action** (see LOCAL-SEO.md) |

## Things checked and found correct

- robots.txt allows the site, disallows `/admin`, `/api`, `/payment`; lists both sitemaps.
- HTTPS everywhere; `http://` and apex → `https://www.` with 308.
- Every sitemap URL returns 200, self-canonical, no `noindex` (meta or header).
- One H1 per page; no duplicate titles or descriptions across 67 pages.
- No broken internal links (323 unique internal hrefs checked).
- All JSON-LD parses; types present: WebSite, AutoRepair, Service, Offer, FAQPage, BreadcrumbList, Article, CollectionPage, ItemList.
- `<html lang="en">` everywhere; locale homepages correct hreflang set.
- Every `<img>` has alt text.
- No horizontal scroll at 390 px on home, service, model, blog and projects pages.
- Business address in schema is locality-only (Dublin, IE) since the mobile switch — no premises published.

## Core Web Vitals (unverified field data)

| Metric | Source | Value |
|---|---|---|
| LCP (mobile) | PageSpeed Insights lab run by owner, 5 Oct | 7.3 s (score 67) |
| LCP (mobile) | local Lighthouse, simulated throttling, after the 5–6 Oct fixes | 3.3–4.4 s |
| CLS | local Lighthouse | 0–0.009 |
| TBT | local Lighthouse | 50–90 ms |
| INP | — | **Unverified** (needs field data; lab cannot measure INP) |

PageSpeed's own lab run on the live site has not been repeated since these
changes — see TEST-RESULTS.md.

## Owner decisions needed

1. **Coding "from" price:** homepage card says "BMW Coding — From €80"; the price calculator lists a single setting from €40 and a hidden-features session from €50. The Dublin coding page now says "priced per job — see the calculator" until you choose one figure.
2. **FSC wording:** pages now say "apply the FSC activation code". If you obtain codes a specific way, tell me and the wording can say so precisely.
3. **Louth** is marked as an in-person county; your stated area is Dublin, Kildare, Wicklow, Meath (+€1.25/km beyond Dublin). Confirm or switch Louth to remote.
4. **"Base in Rathcoole"** appears in the call-out explanation (distance is measured from there) and in the Kildare/Wicklow copy. It is not presented as a place to visit; confirm you are happy to name the area.
