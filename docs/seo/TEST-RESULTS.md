# Test results — 16 Oct 2026

All tests run against a local **production build** (`npm run build` + `next start`)
of branch `claude/website-analysis-review-oboy2c`. The local build has no
database credentials, so gallery-driven content (photos on `/projects`, "Real
work" blocks, image sitemap entries) is empty locally; it renders from the
live database once deployed.

## Project checks
| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ pass |
| `npm run build` (includes Next type check) | ✅ pass, 0 errors |
| `npm run lint` | ⚠️ **not configured** — `next lint` opens the setup wizard; no ESLint config exists in the repo (pre-existing) |
| Automated tests | ⚠️ none exist in the repo |

## SEO checks (all 67 sitemap URLs, Googlebot UA)
| Check | Result |
|---|---|
| HTTP status | ✅ 67/67 = 200 |
| Canonical = own URL on www | ✅ 67/67 |
| `noindex` (meta or header) | ✅ none |
| Exactly one H1 | ✅ 67/67 |
| Heading level skips | ✅ none (were h2 → h4 on 50+ pages) |
| Title ≤ 65 chars / description ≤ 160 | ✅ 67/67 |
| Duplicate titles / descriptions | ✅ none |
| JSON-LD parses | ✅ all blocks; types: WebSite 67, AutoRepair 67, Service 42, FAQPage 47, BreadcrumbList 57, Article 13, CollectionPage 2, ItemList 2, OfferCatalog 1 |
| Images without alt | ✅ none |
| Internal links | ✅ 323 unique, 0 broken |
| Orphan pages (not reachable from `/`) | ✅ none (cruise-control page and language homepages were orphans) |
| Sitemap | ✅ 67 URLs; vs production: **0 removed**, 1 added (`/projects`) |
| Image sitemap | ✅ valid XML, `/` and `/projects` entries |
| `<html lang>` | ✅ `en` (locale homepages corrected on the client as before) |

## Functional checks (Playwright, Chromium)
| Check | Result |
|---|---|
| VIN form: empty → VIN error; bad phone → phone error; valid → POST `{vin, model, service, phone:+353871234567, page}`; success shows WhatsApp link | ✅ |
| Booking form: invalid phone blocks submit with message, no request sent | ✅ |
| Hero buttons + new text links (`#contact`, `#services`, `/projects`) | ✅ |
| WhatsApp links present (home 12, service 7, projects 6, blog 5) | ✅ |
| Horizontal overflow at 390 px and 1440 px (home, CarPlay Dublin, F30, projects, blog post) | ✅ 0 px |
| Console errors: home, projects, blog | ✅ 0 |
| Console errors: service/model pages (ServiceLanding) | ✅ 0 since 21 Oct (was 8×#418 + #423 since July — footer rendered the same link elements twice; see RUNBOOK) |

## Lighthouse (local, mobile, simulated throttling — lab only)
| Page | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| `/` | 82 | 93 | 96 | 92* | 2.8 s | 0 | 540 ms |
| `/apple-carplay-activation-dublin` | 83 | 96 | 96 | 100 | 3.2 s | 0.059 | 410 ms |

\* the only SEO failure is "canonical points to another domain" — an artefact
of testing on localhost (canonical is the www URL). Fixed during testing:
6 "More info" links without context, focusable elements inside closed
`aria-hidden` menus, an underline-less inline link.

Remaining accessibility notes (pre-existing design, not changed — no redesign):
small grey 10–12 px label text below 4.5:1 contrast in a few places; the
carousel dots are 10 px (hit area enlarged with an invisible pseudo-element,
which Lighthouse does not count).

## Not verified (no access or no data)
- **Field Core Web Vitals (CrUX) and INP** — not enough traffic for field data yet.
- **PageSpeed Insights on the live site** for this branch — needs deploy; the owner's last run (5 Oct) was 67 / LCP 7.3 s before the image and preloader work.
- **Google Rich Results Test** — not available from this environment; JSON-LD syntax validated locally.
- **Search Console / GA4 numbers** — read only from owner screenshots; nothing invented.
- **Photo optimisation savings** — measurable only in production (originals 0.1–4.5 MB each).
