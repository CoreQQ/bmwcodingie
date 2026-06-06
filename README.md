# BMW Coding IE

Premium marketing site + CMS for **BMW Coding IE** — a mobile BMW coding, diagnostics and retrofit service in Dublin. Built with **Next.js 14 (App Router) + TypeScript + Tailwind CSS**, backed by **Supabase** (Postgres + Storage), and deployed on **Vercel**.

Services, prices, gallery photos and all site copy/contacts live in the database and are edited from a protected `/admin` panel — no code changes needed.

---

## Stack

- **Next.js 14.2** (App Router, server actions)
- **TypeScript**, **Tailwind CSS 3.4**
- **Supabase** — Postgres for the catalogue/bookings/settings, Storage for gallery images
- **lucide-react** icons
- Fonts: **Bebas Neue** (display) + **Manrope** (body), via `next/font`

The public site reads with the Supabase **anon** key. If Supabase isn't configured yet, the site falls back to bundled default content so it still looks complete in preview. The `/admin` panel writes with the **service-role** key (server-only) which bypasses RLS.

---

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it. This creates the `categories`, `services`, `gallery`, `bookings` and `site_settings` tables, enables row-level security, and seeds the 4 categories + 16 services + the settings row.
3. Create the gallery image bucket: **Storage → New bucket** → name it `gallery` → mark it **Public**. (The name must match `SUPABASE_GALLERY_BUCKET`.)
4. Grab your keys from **Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` *(secret — server only, never exposed to the browser)*

---

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill it in:

```bash
cp .env.example .env.local
```

| Variable | What it's for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public read key for the live site |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only write key (admin panel + uploads) |
| `SUPABASE_GALLERY_BUCKET` | Storage bucket name — `gallery` |
| `ADMIN_PASSWORD` | The single owner password for `/admin` |
| `ADMIN_SESSION_SECRET` | Random string used to sign the session cookie. Generate with `openssl rand -hex 32` |
| `NEXT_PUBLIC_SITE_URL` | `https://bmwcoding.ie` — used for SEO, sitemap and OpenGraph |

---

## 3. Run locally

```bash
npm install
npm run dev
```

- Site: <http://localhost:3000>
- Admin: <http://localhost:3000/admin> (log in with `ADMIN_PASSWORD`)

---

## 4. Deploy to Vercel

1. Push this project to GitHub.
2. In Vercel, **Add New → Project**, import the repo. Framework preset auto-detects **Next.js** — no build settings to change.
3. Add **all** the environment variables from the table above under **Settings → Environment Variables** (Production + Preview).
4. Deploy.

### Connect the domain `bmwcoding.ie`

1. In Vercel: **Settings → Domains → Add** `bmwcoding.ie` (and `www.bmwcoding.ie`).
2. At your domain registrar's DNS panel, point the domain at Vercel:
   - **A record** — host `@` → `76.76.21.21`
   - **CNAME** — host `www` → `cname.vercel-dns.com`
   *(Vercel shows the exact target values to use — follow what it displays for your project.)*
3. Wait for DNS to propagate; Vercel issues the SSL certificate automatically.

---

## 5. Using the admin panel

Go to `/admin` and log in. Sections:

- **Dashboard** — counts and quick links.
- **Services** — add / edit / delete coding services: title, description, price label (e.g. `from €120`, `On request`), category, sort order, "mobile available" flag, show/hide.
- **Categories** — manage the service groups.
- **Gallery** — upload work photos from your phone or computer (stored in Supabase Storage), add captions, reorder, hide or delete.
- **Content & Contacts** — edit the hero headline/subtitle, the about blurb, the service area, and every contact (phone, WhatsApp, Telegram, Instagram, email).
- **Bookings** — enquiries submitted through the contact form; mark handled or delete.

Every change is written to the database and the public site is revalidated immediately.

The whole panel is mobile-friendly — you can run it from a phone.

---

## 6. Images to add

Two optional image slots are referenced but not bundled — add your own:

- **`public/hero.jpg`** — large hero background (a clean shot of a BMW / iDrive / interior). Without it the hero shows the engineered dark/blueprint background, which is fine on its own.
- **`public/og.jpg`** — 1200×630 social-share preview image used for OpenGraph / link previews.

Real gallery photos are uploaded through **Admin → Gallery** (not committed to the repo).

---

## 7. Project structure

```
src/
  app/
    page.tsx              Public homepage (all sections)
    layout.tsx            SEO metadata + JSON-LD (AutoRepair / LocalBusiness)
    sitemap.ts robots.ts
    api/booking/route.ts  Contact-form submission endpoint
    admin/
      layout.tsx          noindex, dynamic
      login/page.tsx
      page.tsx            Dashboard
      services/  categories/  gallery/  content/  bookings/
      actions.ts          Server actions (auth + all CRUD)
  components/
    site/                 Header, Hero, Services, HowItWorks, Gallery, WhyUs, Faq, Contact, Footer, ...
    admin/                AdminShell, AdminNav, ui, ConfirmButton
  lib/
    supabase.ts auth.ts data.ts admin-data.ts defaults.ts types.ts
  middleware.ts           Protects /admin/*
supabase/schema.sql       Tables + RLS + seed data
```

---

## Notes

- **Security:** the service-role key is only ever read in server code (`getSupabaseAdmin`). Never add it to a `NEXT_PUBLIC_*` variable.
- **Auth** is a single-owner password + signed HTTP-only session cookie, enforced by `middleware.ts`. Change `ADMIN_PASSWORD` to something long.
- **Fallback content:** before Supabase is wired up, the site renders the defaults in `src/lib/defaults.ts`, so previews never look broken.

*BMW is a trademark of Bayerische Motoren Werke AG. BMW Coding IE is an independent service and is not affiliated with or endorsed by BMW AG.*
# bmwcodingie
