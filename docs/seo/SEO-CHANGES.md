# SEO changes — what was changed and why

Two groups: changes **already in production** (made earlier on 15–16 Oct,
before this brief arrived) and changes **in this batch**, committed to
`claude/website-analysis-review-oboy2c` and **not deployed** (`main` is
untouched). Design, layout, colours and fonts are unchanged; the only visible
additions are one line of small text links under the homepage buttons, a
"Guides on this topic" block on service pages, a language row in the footer,
and the new `/projects` page built from existing styles.

## Already in production (for completeness)

| Change | Files | Why |
|---|---|---|
| Sitemap lists only canonical URLs (354 → 64); homepage self-canonical per locale with hreflang; no hreflang on English-only pages | `src/app/sitemap.ts`, `src/app/[locale]/page.tsx`, `src/lib/servicePages.ts` | Search Console: 83 "alternate with canonical", 121 "discovered, not indexed" — crawl budget wasted on locale copies |
| Title/description fitting (`seoTitle` ≤62, `seoDescription` ≤158 on a word boundary; brand only when it fits) on all pages | `src/lib/seoText.ts` + every metadata function | Titles up to 124 chars were cut mid-phrase in results |
| `*.vercel.app` production host → 308 to `www.bmwcoding.ie` | `src/middleware.ts` | A complete duplicate site was crawlable |
| llms.txt and cruise-control meta: removed "workshop off the N7" | `src/app/llms.txt/route.ts`, `src/lib/extraLandings.ts` | Google snippet still described a workshop |

## This batch (branch only)

### Business information / accuracy
- **Reminder messages** (`src/app/api/cron/reminders/route.ts`): removed the Greenogue address and "orange gates" directions; the reminder now says where the visit happens from the booking itself (mobile visit at the customer's address / meeting spot / remote), with a fallback query if the `visit_type` columns are missing.
- **CarPlay compatibility** (`src/lib/servicePages.ts`): CarPlay Dublin hero no longer lists NBT as supported; NBT (iDrive 4) and CIC are stated as needing a different head unit.
- **Head-unit labels** (`locationPages.ts`, `servicePages.ts`): "NBT (iDrive 4), NBT Evo (iDrive 5/6), MGU (iDrive 7/8) — CarPlay needs NBT Evo or newer"; Dublin FAQ "iDrive 4 to 8".
- **FSC wording** (`servicePages.ts`, `codingList.ts`, `defaults.ts`, `chassisPages.ts`, `blog.ts`): "generate the FSC" → "apply the FSC activation code".

### Metadata and headings
- Homepage (`messages/*.json`, `src/components/site/Hero.tsx`): title **"BMW Coding Ireland | CarPlay, iDrive & Japan to EU"**, description from the brief (154 chars), H1 **"BMW Coding Ireland — CarPlay, iDrive & Japan → EU"** in all 6 languages (same two-line hero style; an `sr-only` dash joins the lines for crawlers/screen readers; "Japan → EU" kept on one line).
- Unique keyword titles/descriptions for 15 service pages (`servicePages.ts`, `extraLandings.ts`, `upgradeLandings.ts`) — see KEYWORD-STRATEGY.md for the mapping.
- Hub `/bmw-coding-ireland` retitled "BMW Coding Across Ireland | Every County & Model" so it no longer competes with the homepage.
- Footer column headings h4 → h2 (same styling) — fixes h2 → h4 skips on every page.

### Prices (verified against `src/lib/pricing.ts` and the agent's price list)
Shown in the existing price chip and, where a figure exists, as a schema `Offer` (`minPrice`):
CarPlay €150 NBT Evo / €220 iDrive 7 · Android Auto €200 iDrive 7, iDrive 8.5 from €400, iDrive 8 per car · Japan → EU €250 / from €300 (MGU, since 24 Oct) incl. CarPlay · Diagnostics from €80 · Hidden features session from €50, single setting from €40 · Retrofits, maps, reverse camera, cruise control: "quoted per car after a VIN check" · Remote: "same prices, no call-out" · Coding Dublin: "priced per job — see the calculator" (owner decision pending, see audit).

### Structured data
- `AutoRepair` (layout): opening hours generated from the `business_hours` table (same source as the diary), fallback to the existing defaults; still locality-only address.
- `Service` (every service page): provider is now a reference to the single business entity (`@id …/#business`), `brand: BMW`, `Offer` where a price exists.
- Blog posts: `@graph` with `Article` (author/publisher → business `@id`, `inLanguage en-IE`, `dateModified`) and a 3-level `BreadcrumbList`.
- New `/projects`: `CollectionPage` + `ItemList` of `ImageObject` (real photos and captions) + `BreadcrumbList`.

### Internal linking
- `src/components/site/ServiceLanding.tsx`: "Guides on this topic" — every blog post that lists a service as related is linked from that service page (up to 4).
- `SERVICE_NAV`: added Reverse Camera, Cruise Control (was orphaned), Hidden Features, Real Projects.
- Retrofits page links to reverse-camera and cruise-control pages.
- Footer: `/#services`, `/#work`, `/#about`, `/#contact` (were broken on inner pages); plain links to the six language homepages.
- Homepage hero: quiet text links "Request a quote · View all services · Real projects" under the two existing buttons.

### New page
- `src/app/[locale]/projects/page.tsx` + `src/lib/projectLinks.ts`: real gallery photos with the owner's captions; each links to the service and model pages its caption names (keyword rules only — nothing inferred). Added to the sitemap (0.8) and the image sitemap.

### Performance
- `src/components/site/Gallery.tsx` and `ServiceLanding.tsx` "Real work": `next/image` with `fill` + `sizes` (Supabase host was already allowed in `next.config.js`) — originals of 0.1–4.5 MB are now served as WebP/AVIF at display size; lightbox uses a 1920 px optimised copy.

### Crawling
- IndexNow ping (daily cron) now sends every canonical page, not only home/hub/blog.

## Not changed on purpose
- No redesign; no colour, font or layout changes.
- No `noindex` added anywhere (project rule) — county-page consolidation is a roadmap decision.
- No new reviews, ratings, addresses, certifications or projects.
- No DNS, analytics IDs, Search Console or Google Business Profile changes.
