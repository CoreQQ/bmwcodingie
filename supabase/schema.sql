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
  translations jsonb not null default '{}'::jsonb,
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
  translations jsonb not null default '{}'::jsonb,
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
  translations jsonb not null default '{}'::jsonb,
  constraint single_row check (id = 1)
);

create table if not exists car_models (
  id bigint generated always as identity primary key,
  chassis_code text not null unique,
  label text not null,
  year_from int not null,
  year_to int,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists model_compatibility (
  id bigint generated always as identity primary key,
  model_id bigint not null references car_models(id) on delete cascade,
  service_id bigint not null references services(id) on delete cascade,
  status text not null default 'on_request' check (status in ('yes', 'no', 'on_request')),
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (model_id, service_id)
);

-- Migration: add per-locale translation overrides to tables that predate
-- multi-language support. Safe to re-run.
alter table categories add column if not exists translations jsonb not null default '{}'::jsonb;
alter table services add column if not exists translations jsonb not null default '{}'::jsonb;
alter table site_settings add column if not exists translations jsonb not null default '{}'::jsonb;

-- Migration: add requested booking slot + confirmation status. The slot is a
-- customer-proposed preference; status moves pending -> confirmed/declined when
-- the owner taps a button on the Telegram notification. Safe to re-run.
alter table bookings add column if not exists slot_date date;
alter table bookings add column if not exists slot_time text not null default '';
alter table bookings add column if not exists status text not null default 'pending';
-- Public tracking token for the customer's booking-status page (/b/<token>).
alter table bookings add column if not exists public_token uuid not null default gen_random_uuid();

-- One in-progress invoice draft per Telegram chat, driven by the bot's
-- /invoice wizard. Server-role access only (RLS on, no public policies).
create table if not exists invoice_drafts (
  chat_id bigint primary key,
  step text not null default '',
  client text not null default '',
  pending_service text not null default '',
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);
alter table invoice_drafts enable row level security;

-- Days the owner has blocked out — hidden from the public slot picker.
create table if not exists blocked_dates (
  day date primary key
);
alter table blocked_dates enable row level security;

-- Customer reviews shown on the site (owner-managed in the admin panel).
create table if not exists reviews (
  id bigint generated always as identity primary key,
  author text not null,
  car text not null default '',
  rating int not null default 5,
  body text not null default '',
  visible boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table reviews enable row level security;
create policy "public read reviews" on reviews for select using (true);

-- ---------- Row Level Security ----------
-- Public site reads with the ANON key; admin writes use the
-- SERVICE ROLE key which bypasses RLS entirely.
alter table categories enable row level security;
alter table services enable row level security;
alter table gallery enable row level security;
alter table site_settings enable row level security;
alter table bookings enable row level security;
alter table car_models enable row level security;
alter table model_compatibility enable row level security;

-- Public can read catalog + settings.
create policy "public read categories" on categories for select using (true);
create policy "public read services" on services for select using (true);
create policy "public read gallery" on gallery for select using (true);
create policy "public read site_settings" on site_settings for select using (true);
create policy "public read car_models" on car_models for select using (true);
create policy "public read model_compatibility" on model_compatibility for select using (true);

-- Public (anon) can INSERT a booking from the contact form, but not read them.
create policy "public insert bookings" on bookings for insert with check (true);

-- ---------- Seed ----------
insert into site_settings (id) values (1) on conflict (id) do nothing;

insert into categories (slug, name, sort_order) values
  ('multimedia', 'Multimedia & Comfort', 1),
  ('lighting', 'Light & Appearance', 2),
  ('assist', 'Assistants & Convenience', 3),
  ('conversion', 'Conversions & Diagnostics', 4),
  ('tuning', 'Performance & Tuning', 5)
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

-- Performance & Tuning: in-person ECU remap (mobile_available = false).
insert into services (category_id, title, description, price_label, mobile_available, sort_order)
select c.id,
       'Stage 1 / Stage 2 remap',
       'ECU remap for more power and torque — Stage 1 on the standard car, Stage 2 with supporting hardware. Built for your exact engine and spec, flashed in person.',
       'On request', false, 1
from categories c
where c.slug = 'tuning'
  and not exists (select 1 from services s where s.title = 'Stage 1 / Stage 2 remap');

-- Common F/G-series chassis as a starting point — review and correct exact
-- per-model/service compatibility in Admin → Models, nothing here is assumed.
insert into car_models (chassis_code, label, year_from, year_to, sort_order) values
  ('F20', '1 Series (F20/F21)', 2011, 2019, 1),
  ('F30', '3 Series (F30/F31/F34)', 2012, 2019, 2),
  ('F10', '5 Series (F10/F11)', 2010, 2017, 3),
  ('F48', 'X1 (F48)', 2015, 2022, 4),
  ('F15', 'X5 (F15)', 2013, 2018, 5),
  ('G20', '3 Series (G20/G21)', 2019, null, 6),
  ('G30', '5 Series (G30/G31)', 2017, null, 7),
  ('G01', 'X3 (G01)', 2017, null, 8),
  ('G05', 'X5 (G05)', 2018, null, 9),
  ('E90', '3 Series (E90/E91/E92/E93)', 2005, 2013, 10)
on conflict (chassis_code) do nothing;
