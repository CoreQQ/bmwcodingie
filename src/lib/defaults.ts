import type { CategoryWithServices, SiteSettings } from './types';

// These mirror the seed in supabase/schema.sql so the public site looks
// complete out of the box — even before Supabase is connected.

export const DEFAULT_SETTINGS: SiteSettings = {
  hero_title: 'BMW Coding & Retrofits — In-Person & Remote, Dublin',
  hero_subtitle:
    'Dealer-level BMW coding, diagnostics and retrofits. Done in person across Dublin, or remotely if you have a laptop and an ENET cable.',
  about_text:
    'Independent BMW coding team based in Dublin. ISTA/Rheingold, E-Sys and BimmerCode across F and G series — done in person or remotely over ENET, paid on completion.',
  service_area:
    'In person across Dublin, Kildare, Wicklow and Meath. Remote coding available anywhere — you just need a laptop and an ENET cable.',
  phone: '+353 00 000 0000',
  whatsapp: '+353000000000',
  telegram: 'bmwcoding_ie',
  instagram: 'bmwcoding.ie',
  email: 'hello@bmwcoding.ie',
};

export const DEFAULT_CATALOG: CategoryWithServices[] = [
  {
    id: 1,
    slug: 'multimedia',
    name: 'Multimedia & Comfort',
    sort_order: 1,
    services: [
      svc(1, 1, 'Apple CarPlay activation', 'Wired or full wireless CarPlay enabled on NBT, NBT Evo and MGU head units.', 'from €120'),
      svc(2, 1, 'Android Auto activation', 'Enabled where supported — iDrive 7 (MGU) only; iDrive 6 / NBT Evo assessed per car.', 'from €120'),
      svc(3, 1, 'Video in Motion', 'Watch video and use full screen functions while the car is moving.', 'from €60'),
      svc(4, 1, 'BMW Apps & Remote Services', 'Activate connected apps, Remote Services and online features in the head unit.', 'from €80'),
      svc(5, 1, 'Navigation FSC & map codes', 'FSC generation for navigation activation and map updates.', 'On request'),
    ],
  },
  {
    id: 2,
    slug: 'lighting',
    name: 'Light & Appearance',
    sort_order: 2,
    services: [
      svc(6, 2, 'Ambient lighting retrofit', 'OEM contour lighting retrofit or coding for existing harnesses on F/G platforms.', 'On request'),
      svc(7, 2, 'Welcome / Coming Home', 'Welcome light animation, Coming Home timing and carpet lighting.', 'from €50'),
      svc(8, 2, 'DRL, indicators & window logic', 'Daytime running lights, indicator behaviour and one-touch window coding.', 'from €50'),
      svc(9, 2, 'Sport displays & M view', 'Sport digital displays and M-style instrument cluster layouts.', 'from €60'),
    ],
  },
  {
    id: 3,
    slug: 'assist',
    name: 'Assistants & Convenience',
    sort_order: 3,
    services: [
      svc(10, 3, 'Cruise control retrofit / activation', 'Hardware retrofit or coding activation, including SZL and steering module setup.', 'On request'),
      svc(11, 3, 'Comfort Access & folding mirrors', 'Keyless comfort access tweaks and auto mirror folding on lock.', 'from €50'),
      svc(12, 3, 'Speed limit & sign recognition', 'Traffic sign recognition and speed limit display coding.', 'from €60'),
      svc(13, 3, 'Start/Stop memory & reminders', 'Remember last Start/Stop state, seatbelt and service reminder coding.', 'from €40'),
    ],
  },
  {
    id: 4,
    slug: 'conversion',
    name: 'Conversions & Diagnostics',
    sort_order: 4,
    services: [
      svc(14, 4, 'Japan → EU conversion', 'Region change, FSC, ETC mirror and TCB hardware considerations for JDM imports.', 'from €150'),
      svc(15, 4, 'Full ISTA diagnostics', 'Complete fault scan, read and clear codes, written summary of findings.', 'from €80'),
      svc(16, 4, 'Hidden features & custom coding', 'Bespoke coding to your spec — tell us what you want, we will scope it.', 'On request'),
    ],
  },
  {
    id: 5,
    slug: 'tuning',
    name: 'Performance & Tuning',
    sort_order: 5,
    services: [
      svc(17, 5, 'Stage 1 / Stage 2 remap', 'ECU remap for more power and torque — Stage 1 on the standard car, Stage 2 with supporting hardware. Built for your exact engine and spec, flashed in person.', 'On request', false),
    ],
  },
];

function svc(
  id: number,
  category_id: number,
  title: string,
  description: string,
  price_label: string,
  mobile_available = true,
) {
  return {
    id,
    category_id,
    title,
    description,
    price_label,
    mobile_available,
    visible: true,
    sort_order: id,
  };
}
