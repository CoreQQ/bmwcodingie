import type { ServicePage } from './servicePages';

// Programmatic location landing pages — one per county/city we get real
// search demand from. Each page is generated from genuinely distinct local
// facts (towns, distance, in-person vs remote availability) so no two pages
// read the same; the honest service details are shared because the service
// genuinely is the same everywhere.

type LocationFacts = {
  slug: string;
  /** Display name used in titles/H1 — "Cork", "Kildare", … */
  name: string;
  /** "county" or "city & county" phrasing helper. */
  kind: 'county' | 'city';
  /** Local towns mentioned in copy for relevance. */
  towns: string[];
  /** True when we regularly drive out — Dublin commuter belt. */
  inPerson: boolean;
  /** One unique local sentence woven into the intro. */
  localLine: string;
  /** Related location slugs (2–3 neighbours). */
  nearby: string[];
};

const LOCATIONS: LocationFacts[] = [
  {
    slug: 'bmw-coding-cork',
    name: 'Cork',
    kind: 'city',
    towns: ['Cork city', 'Carrigaline', 'Midleton', 'Mallow', 'Bandon'],
    inPerson: false,
    localLine:
      'Cork has one of the biggest BMW communities outside Dublin, and remote coding means you get the same work done from your own driveway on Leeside — no round trip up the M8.',
    nearby: ['bmw-coding-limerick', 'bmw-coding-waterford', 'bmw-coding-kilkenny'],
  },
  {
    slug: 'bmw-coding-galway',
    name: 'Galway',
    kind: 'city',
    towns: ['Galway city', 'Oranmore', 'Tuam', 'Loughrea', 'Ballinasloe'],
    inPerson: false,
    localLine:
      'From Galway city out to Tuam and Ballinasloe, remote ENET coding saves you the drive across the country — most jobs are done in under an hour from your own home.',
    nearby: ['bmw-coding-limerick', 'bmw-coding-westmeath', 'bmw-coding-cork'],
  },
  {
    slug: 'bmw-coding-limerick',
    name: 'Limerick',
    kind: 'city',
    towns: ['Limerick city', 'Castletroy', 'Raheen', 'Newcastle West', 'Annacotty'],
    inPerson: false,
    localLine:
      'Limerick owners usually book a remote session — with the laptop and ENET cable set up, your car in Castletroy or Raheen is coded exactly as if it were parked outside our Dublin workshop.',
    nearby: ['bmw-coding-cork', 'bmw-coding-galway', 'bmw-coding-waterford'],
  },
  {
    slug: 'bmw-coding-waterford',
    name: 'Waterford',
    kind: 'city',
    towns: ['Waterford city', 'Tramore', 'Dungarvan', 'Portlaw'],
    inPerson: false,
    localLine:
      'Whether the car is in Waterford city, Tramore or Dungarvan, a remote ENET session gets CarPlay, hidden features and diagnostics done without leaving the Déise.',
    nearby: ['bmw-coding-kilkenny', 'bmw-coding-wexford', 'bmw-coding-cork'],
  },
  {
    slug: 'bmw-coding-kilkenny',
    name: 'Kilkenny',
    kind: 'county',
    towns: ['Kilkenny city', 'Callan', 'Castlecomer', 'Thomastown'],
    inPerson: false,
    localLine:
      'Kilkenny sits an easy remote session away — and if you are ever up the M9 towards Dublin, you are welcome to call into the workshop at Greenogue instead.',
    nearby: ['bmw-coding-waterford', 'bmw-coding-wexford', 'bmw-coding-kildare'],
  },
  {
    slug: 'bmw-coding-kildare',
    name: 'Kildare',
    kind: 'county',
    towns: ['Naas', 'Newbridge', 'Celbridge', 'Maynooth', 'Leixlip', 'Kilcock'],
    inPerson: true,
    localLine:
      'Our workshop at Greenogue Business Park sits right on the Dublin–Kildare border off the N7, so Naas, Newbridge, Celbridge and Maynooth are some of our most regular postcodes — often same-week slots.',
    nearby: ['bmw-coding-wicklow', 'bmw-coding-meath', 'bmw-coding-kilkenny'],
  },
  {
    slug: 'bmw-coding-wicklow',
    name: 'Wicklow',
    kind: 'county',
    towns: ['Bray', 'Greystones', 'Wicklow town', 'Arklow', 'Blessington'],
    inPerson: true,
    localLine:
      'Bray, Greystones and Blessington are a short hop from our Rathcoole workshop, and we regularly come to the car anywhere in north Wicklow — Arklow and south Wicklow can choose in-person or remote.',
    nearby: ['bmw-coding-kildare', 'bmw-coding-wexford', 'bmw-coding-meath'],
  },
  {
    slug: 'bmw-coding-meath',
    name: 'Meath',
    kind: 'county',
    towns: ['Navan', 'Ashbourne', 'Dunboyne', 'Trim', 'Kells'],
    inPerson: true,
    localLine:
      'Ashbourne, Dunboyne and Navan are inside our regular in-person area — we come to your home or workplace with the full kit, or you can drop into the workshop at Greenogue off the N7.',
    nearby: ['bmw-coding-louth', 'bmw-coding-kildare', 'bmw-coding-westmeath'],
  },
  {
    slug: 'bmw-coding-louth',
    name: 'Louth',
    kind: 'county',
    towns: ['Drogheda', 'Dundalk', 'Ardee'],
    inPerson: true,
    localLine:
      'Drogheda is an easy run up the M1 for an in-person visit, and Dundalk owners can pick whichever suits — a visit to the car or a remote ENET session the same evening.',
    nearby: ['bmw-coding-meath', 'bmw-coding-westmeath', 'bmw-coding-kildare'],
  },
  {
    slug: 'bmw-coding-westmeath',
    name: 'Westmeath',
    kind: 'county',
    towns: ['Athlone', 'Mullingar', 'Moate', 'Kinnegad'],
    inPerson: false,
    localLine:
      'Mullingar and Kinnegad owners sometimes meet us in person via the M4/M6, but most Westmeath jobs — Athlone included — are done remotely in a single evening session.',
    nearby: ['bmw-coding-meath', 'bmw-coding-galway', 'bmw-coding-kildare'],
  },
  {
    slug: 'bmw-coding-wexford',
    name: 'Wexford',
    kind: 'county',
    towns: ['Wexford town', 'Gorey', 'Enniscorthy', 'New Ross'],
    inPerson: false,
    localLine:
      'Gorey and north Wexford can combine with a Wicklow run for an in-person visit; Wexford town, Enniscorthy and New Ross are usually remote sessions — same coding, no travel.',
    nearby: ['bmw-coding-wicklow', 'bmw-coding-waterford', 'bmw-coding-kilkenny'],
  },
];

function buildLocationPage(f: LocationFacts): ServicePage {
  const where = f.kind === 'city' ? `${f.name} city and county` : `Co. ${f.name}`;
  const townList = f.towns.join(', ');

  const formatLine = f.inPerson
    ? `We cover ${f.name} in person — we come to your home or workplace, or you call into our workshop at Greenogue Business Park, Rathcoole (just off the N7) — and remote ENET coding is there when it suits you better.`
    : `${f.name} is covered by remote ENET coding: you plug a laptop and an inexpensive ENET cable into the car's OBD port, we connect over a screen-share session and code the car exactly as if we were sitting in it. You are also always welcome at our Dublin workshop at Greenogue Business Park, just off the N7.`;

  return {
    slug: f.slug,
    metaTitle: `BMW Coding ${f.name} | CarPlay, Hidden Features & Diagnostics`,
    metaDescription: `BMW coding in ${f.name} — Apple CarPlay activation, hidden features, Video in Motion, diagnostics and retrofit support for F and G Series. ${
      f.inPerson ? 'In-person visits and remote coding' : 'Remote coding sessions'
    } across ${where}.`,
    serviceName: `BMW Coding ${f.name}`,
    eyebrow: `BMW Coding · ${f.name}`,
    h1: `BMW Coding ${f.name} — CarPlay, Hidden Features & Diagnostics`,
    heroSub: `Independent BMW coding for owners in ${where} — ${townList}. ${
      f.inPerson
        ? 'In person at the car or at our Dublin workshop, or remotely over ENET.'
        : 'Remote ENET sessions from your own driveway, or at our Dublin workshop if you are passing.'
    }`,
    intro: [
      `BMW coding unlocks features your car already has the hardware for — Apple CarPlay, Video in Motion, sport displays, comfort functions and dozens more — by adjusting software parameters that are dormant from the factory. Everything is reversible, compatibility is confirmed from your model, year and VIN before anything is booked, and you pay on completion once you have seen it working.`,
      `${f.localLine} ${formatLine}`,
    ],
    includedHeading: `Popular coding in ${f.name}`,
    included: [
      'Apple CarPlay and Android Auto activation (supported systems)',
      'Video in Motion and full-screen functions while moving',
      'Sport / M digital displays and digital speed readout',
      'Ambient lighting, Welcome lights and comfort coding',
      'Auto-folding mirrors, one-touch windows, Comfort Access tweaks',
      'Full ISTA diagnostics with a written summary',
    ],
    modelsHeading: 'Models and systems we code',
    models: [
      'F-Series: F20, F30, F31, F32, F36, F10, F80, F82 and related chassis',
      'G-Series: G20, G30, G31, G01, G05 and other current platforms',
      'Head units: NBT, NBT Evo and MGU (iDrive 6, 7 and 8)',
      'Tooling: ISTA / Rheingold, E-Sys with PSdZData and ENET / OBD',
    ],
    process: f.inPerson
      ? [
          { title: 'Send your details', body: `Message your model, year and what you want enabled. We confirm what is possible on your exact car and offer the next slots for ${f.name}.` },
          { title: 'Pick the format', body: 'We come to the car anywhere in the county, you call into the workshop at Greenogue off the N7, or we set up a remote ENET session — whichever suits.' },
          { title: 'Code and verify', body: 'We apply the coding and show each feature working on your car before anything else.' },
          { title: 'Pay on completion', body: 'Card or cash once you have seen the result. No deposit, no dealer queue.' },
        ]
      : [
          { title: 'Send your details', body: 'Message your model, year and what you want enabled. We confirm what can be done remotely on your exact car before you book.' },
          { title: 'Get set up', body: 'You need a Windows laptop and a cheap ENET (OBD) cable — we tell you exactly which one and guide you through plugging in.' },
          { title: 'Code remotely', body: `We connect over a screen-share session at a time that suits you and code the car in ${f.name}, showing each feature working as we go.` },
          { title: 'Pay on completion', body: 'You pay once the features are running — the same as an in-person session.' },
        ],
    faqs: [
      {
        q: `Do you do BMW coding in ${f.name}?`,
        a: f.inPerson
          ? `Yes — ${f.name} is inside our regular in-person area (${townList}), and remote ENET coding is available too. Send your model and year and we will offer the next slots.`
          : `Yes — owners across ${where} (${townList}) are covered by remote ENET coding, and you are welcome at our Dublin workshop at Greenogue Business Park if you prefer in person.`,
      },
      {
        q: 'What do I need for a remote coding session?',
        a: 'A Windows laptop and an inexpensive ENET (OBD) cable — we tell you exactly which cable to buy and guide you through the connection. Most sessions take 30–60 minutes.',
      },
      {
        q: `Can you activate Apple CarPlay on my BMW in ${f.name}?`,
        a: 'On most NBT Evo and MGU systems, yes — including wireless CarPlay where supported. Send your model, year and VIN-derived build and we confirm before you book. Activation starts from €120.',
      },
      {
        q: 'Will coding affect my BMW warranty?',
        a: 'Coding adjusts software values that already exist in the car and is reversible — we can return any setting to factory before a dealer visit, and we tell you up front if a request is likely to be flagged.',
      },
    ],
    related: [
      ...f.nearby.slice(0, 2).map((slug) => ({
        slug,
        label: `BMW coding ${LOCATIONS.find((l) => l.slug === slug)?.name ?? ''}`.trim(),
      })),
      { slug: 'remote-bmw-coding-ireland', label: 'remote BMW coding across Ireland' },
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
    ],
    waMessage: `Hi — I'd like BMW coding in ${f.name}. My car is a `,
    area: [f.name, 'Ireland'],
  };
}

export const LOCATION_PAGES: Record<string, ServicePage> = Object.fromEntries(
  LOCATIONS.map((f) => [f.slug, buildLocationPage(f)]),
);

export const LOCATION_NAV: { slug: string; label: string }[] = LOCATIONS.map((f) => ({
  slug: f.slug,
  label: f.name,
}));
