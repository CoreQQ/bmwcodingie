-- ============================================================
-- BMW Coding IE — database schema + seed
-- Run this in Supabase → SQL Editor (or psql).
-- ============================================================

-- ---------- Tables ----------
create table if not exists categories (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists services (
  id bigint generated always as identity primary key,
  category_id bigint references categories(id) on delete set null,
  title text not null,
  description text not null default '',
  price_label text not null default 'On request',
  mobile_available boolean not null default true,
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists gallery (
  id bigint generated always as identity primary key,
  image_url text not null,
  caption text not null default '',
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists bookings (
  id bigint generated always as identity primary key,
  name text not null,
  contact text not null,
  bmw_model text not null default '',
  service text not null default '',
  message text not null default '',
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Single-row settings table (id is always 1).
create table if not exists site_settings (
  id int primary key default 1,
  hero_title text not null default 'BMW Coding & Retrofits — In-Person & Remote, Dublin',
  hero_subtitle text not null default 'Dealer-level BMW coding, diagnostics and retrofits. Done in person across Dublin, or remotely if you have a laptop and an ENET cable.',
  about_text text not null default 'Independent BMW coding team based in Dublin. ISTA/Rheingold, E-Sys and BimmerCode across F and G series — done in person or remotely over ENET, paid on completion.',
  service_area text not null default 'In person across Dublin, Kildare, Wicklow and Meath. Remote coding available anywhere — you just need a laptop and an ENET cable.',
  phone text not null default '+353 00 000 0000',
  whatsapp text not null default '+353000000000',
  telegram text not null default 'bmwcoding_ie',
  instagram text not null default 'bmwcoding.ie',
  email text not null default 'hello@bmwcoding.ie',
  constraint single_row check (id = 1)
);

-- ---------- Row Level Security ----------
-- Public site reads with the ANON key; admin writes use the
-- SERVICE ROLE key which bypasses RLS entirely.
alter table categories enable row level security;
alter table services enable row level security;
alter table gallery enable row level security;
alter table site_settings enable row level security;
alter table bookings enable row level security;

-- Public can read catalog + settings.
create policy "public read categories" on categories for select using (true);
create policy "public read services" on services for select using (true);
create policy "public read gallery" on gallery for select using (true);
create policy "public read site_settings" on site_settings for select using (true);

-- Public (anon) can INSERT a booking from the contact form, but not read them.
create policy "public insert bookings" on bookings for insert with check (true);

-- ---------- Seed ----------
insert into site_settings (id) values (1) on conflict (id) do nothing;

insert into categories (slug, name, sort_order) values
  ('multimedia', 'Multimedia & Comfort', 1),
  ('lighting', 'Light & Appearance', 2),
  ('assist', 'Assistants & Convenience', 3),
  ('conversion', 'Conversions & Diagnostics', 4)
on conflict (slug) do nothing;

-- Helper inserts keyed by category slug.
insert into services (category_id, title, description, price_label, sort_order)
select c.id, v.title, v.description, v.price_label, v.sort_order
from (values
  -- Multimedia & Comfort
  ('multimedia', 'Apple CarPlay activation', 'Wired or full wireless CarPlay enabled on NBT, NBT Evo and MGU head units.', 'from €120', 1),
  ('multimedia', 'Android Auto activation', 'Enabled where supported — iDrive 7 (MGU) only; iDrive 6 / NBT Evo assessed per car.', 'from €120', 2),
  ('multimedia', 'Video in Motion', 'Watch video and use full screen functions while the car is moving.', 'from €60', 3),
  ('multimedia', 'BMW Apps & Remote Services', 'Activate connected apps, Remote Services and online features in the head unit.', 'from €80', 4),
  ('multimedia', 'Navigation FSC & map codes', 'FSC generation for navigation activation and map updates.', 'On request', 5),
  -- Light & Appearance
  ('lighting', 'Ambient lighting retrofit', 'OEM contour lighting retrofit or coding for existing harnesses on F/G platforms.', 'On request', 1),
  ('lighting', 'Welcome / Coming Home', 'Welcome light animation, Coming Home timing and carpet lighting.', 'from €50', 2),
  ('lighting', 'DRL, indicators & window logic', 'Daytime running lights, indicator behaviour and one-touch window coding.', 'from €50', 3),
  ('lighting', 'Sport displays & M view', 'Sport digital displays and M-style instrument cluster layouts.', 'from €60', 4),
  -- Assistants & Convenience
  ('assist', 'Cruise control retrofit / activation', 'Hardware retrofit or coding activation, including SZL and steering module setup.', 'On request', 1),
  ('assist', 'Comfort Access & folding mirrors', 'Keyless comfort access tweaks and auto mirror folding on lock.', 'from €50', 2),
  ('assist', 'Speed limit & sign recognition', 'Traffic sign recognition and speed limit display coding.', 'from €60', 3),
  ('assist', 'Start/Stop memory & reminders', 'Remember last Start/Stop state, seatbelt and service reminder coding.', 'from €40', 4),
  -- Conversions & Diagnostics
  ('conversion', 'Japan → EU conversion', 'Region change, FSC, ETC mirror and TCB hardware considerations for JDM imports.', 'from €150', 1),
  ('conversion', 'Full ISTA diagnostics', 'Complete fault scan, read and clear codes, written summary of findings.', 'from €80', 2),
  ('conversion', 'Hidden features & custom coding', 'Bespoke coding to your spec — tell us what you want, we will scope it.', 'On request', 3)
) as v(cat_slug, title, description, price_label, sort_order)
join categories c on c.slug = v.cat_slug
on conflict do nothing;
