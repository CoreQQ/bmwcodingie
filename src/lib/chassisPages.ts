import type { ServicePage } from './servicePages';

// Programmatic model/chassis landing pages — "bmw f30 coding", "bmw x5
// coding" and friends are exactly how owners search. Each page carries real
// per-generation facts (years, head units, what's popular and what to watch
// for) so the content is genuinely specific to that chassis.

type ChassisFacts = {
  slug: string;
  /** "3 Series (F30 / F31 / F34)" */
  title: string;
  /** Short name used in sentences — "F30 3 Series". */
  short: string;
  /** Chassis codes covered. */
  codes: string;
  years: string;
  headUnits: string;
  /** One-paragraph generation-specific truth. */
  genNote: string;
  /** Most-requested coding on this chassis. */
  popular: string[];
  /** One chassis-specific FAQ. */
  faq: { q: string; a: string };
  related: string[];
};

const CHASSIS: ChassisFacts[] = [
  {
    slug: 'bmw-f30-coding',
    title: '3 Series (F30 / F31 / F34)',
    short: 'F30 3 Series',
    codes: 'F30, F31, F34',
    years: '2012–2019',
    headUnits: 'Business/NBT on early cars, NBT Evo (ID5/ID6) from the 2015 LCI',
    genNote:
      'The F30 is the most-coded BMW in Ireland. Pre-LCI cars on NBT take hidden features, Video in Motion and comfort coding; LCI cars with NBT Evo add full Apple CarPlay — including wireless on most ID6 builds. Digital speed, sport displays and folding-mirror coding work across the whole run.',
    popular: [
      'Apple CarPlay activation on NBT Evo (2015+ LCI cars)',
      'Video in Motion and full menus while driving',
      'Sport displays and digital speed in the cluster',
      'Auto-folding mirrors on lock and one-touch windows',
      'Welcome lights, ambient light behaviour and DRL tweaks',
      'Seatbelt gong and legal-disclaimer removal',
    ],
    faq: {
      q: 'Can you activate CarPlay on my F30?',
      a: 'If it is a 2015+ LCI car with NBT Evo (ID5/ID6), usually yes — including wireless on most ID6 builds. Pre-LCI NBT cars do not support native CarPlay, but plenty of other coding still applies. Send your year and VIN-derived build and we confirm.',
    },
    related: ['bmw-g20-coding', 'bmw-f32-coding', 'bmw-f10-coding'],
  },
  {
    slug: 'bmw-f10-coding',
    title: '5 Series (F10 / F11)',
    short: 'F10 5 Series',
    codes: 'F10, F11',
    years: '2010–2017',
    headUnits: 'CIC on the earliest cars, NBT from 2013, NBT Evo on late builds',
    genNote:
      'The F10 responds brilliantly to comfort and convenience coding — folding mirrors, Comfort Access tweaks, one-touch windows from the key — and NBT cars take Video in Motion and hidden menus. Japanese-import F10s are common in Ireland and we handle the full Japan-to-EU conversion: region, radio bands, navigation FSC and EU maps.',
    popular: [
      'Comfort Access and auto-folding mirror coding',
      'Video in Motion on NBT / NBT Evo cars',
      'Digital speed and sport displays',
      'Japan-import conversion: region, bands, FSC, EU maps',
      'Start/Stop memory and Auto Hold behaviour',
      'Full ISTA health scan with written summary',
    ],
    faq: {
      q: 'My F10 is a Japanese import — can you sort the navigation?',
      a: 'Yes — Japan-to-EU conversion is a regular F10 job: region change, radio bands, navigation FSC generation and European maps, plus the ETC mirror handling imports need. Send the year and build and we quote the full conversion.',
    },
    related: ['bmw-g30-coding', 'bmw-f30-coding', 'bmw-x5-coding'],
  },
  {
    slug: 'bmw-f20-coding',
    title: '1 Series (F20 / F21)',
    short: 'F20 1 Series',
    codes: 'F20, F21',
    years: '2011–2019',
    headUnits: 'Business radio on base cars, NBT and NBT Evo on higher specs and LCI',
    genNote:
      'The F20 shares its electronics with the F30, so almost everything codeable on a 3 Series applies here. LCI cars with NBT Evo take CarPlay activation; every F20 benefits from the comfort pack — folding mirrors, one-touch windows, welcome lights — and the seatbelt-gong delete is the most requested single item.',
    popular: [
      'Apple CarPlay activation on NBT Evo builds',
      'Seatbelt chime / gong disable',
      'Auto-folding mirrors and one-touch windows from the key',
      'Digital speed readout and sport displays',
      'DRL behaviour and indicator blink count',
      'Video in Motion on NBT / NBT Evo cars',
    ],
    faq: {
      q: 'My F20 has the basic radio — is coding still worth it?',
      a: 'Yes — the comfort and lighting coding (mirrors, windows, welcome lights, chime removal) lives in the body modules, not the head unit, so it works regardless of the radio spec. CarPlay needs NBT Evo, which we confirm from your build.',
    },
    related: ['bmw-f30-coding', 'bmw-f32-coding', 'bmw-x1-coding'],
  },
  {
    slug: 'bmw-f32-coding',
    title: '4 Series (F32 / F33 / F36)',
    short: 'F32 4 Series',
    codes: 'F32, F33, F36',
    years: '2013–2020',
    headUnits: 'NBT on early cars, NBT Evo (ID5/ID6) from the 2017 LCI',
    genNote:
      'Coupé and Gran Coupé owners mostly come for the sporty stuff: M View gauges, digital speed, needle-sweep startup and sport displays — plus CarPlay on LCI NBT Evo cars. Convertible-specific coding on the F33 (roof operation behaviour) is also available.',
    popular: [
      'Sport / M digital displays and needle sweep animation',
      'Apple CarPlay activation on NBT Evo (2017+ LCI)',
      'Video in Motion and full-screen navigation',
      'Ambient lighting colour options',
      'F33 convertible roof behaviour coding',
      'Auto-folding mirrors and comfort pack',
    ],
    faq: {
      q: 'Can you enable the M startup needle sweep on my F32?',
      a: 'Yes — the cluster startup animation and sport display layouts are classic F32 coding, on both analogue and 6WB digital clusters. We enable them alongside digital speed in the same session.',
    },
    related: ['bmw-f30-coding', 'bmw-m3-m4-coding', 'bmw-g20-coding'],
  },
  {
    slug: 'bmw-g20-coding',
    title: '3 Series (G20 / G21)',
    short: 'G20 3 Series',
    codes: 'G20, G21',
    years: '2019–present',
    headUnits: 'MGU — iDrive 7, iDrive 8 on late builds',
    genNote:
      'The G20 ships with modern hardware where most features exist but are locked by market or options. Coding unlocks Video in Motion, extended BMW Digital cluster layouts, Android Auto behaviour tweaks and the little annoyances — legal disclaimers, chimes, auto Start/Stop memory. Wireless CarPlay is factory on most builds; where it is trial-limited we make it permanent.',
    popular: [
      'Video in Motion on iDrive 7 / 8',
      'Extended digital-cluster layouts and M View',
      'Start/Stop last-state memory',
      'Legal disclaimer and chime removal',
      'Ambient lighting and welcome-scene tweaks',
      'Android Auto enable on supported builds',
    ],
    faq: {
      q: 'The G20 already has CarPlay — what is left to code?',
      a: 'Plenty: Video in Motion, extended cluster layouts, Start/Stop memory, disclaimer removal, lighting behaviour and more. On cars where CarPlay shipped as a trial we also make it permanent. iDrive 7/8 coding is done with current-generation tooling.',
    },
    related: ['bmw-g30-coding', 'bmw-f30-coding', 'bmw-x3-coding'],
  },
  {
    slug: 'bmw-g30-coding',
    title: '5 Series (G30 / G31)',
    short: 'G30 5 Series',
    codes: 'G30, G31',
    years: '2017–2023',
    headUnits: 'NBT Evo (ID6) on 2017–2020 cars, MGU (iDrive 7) from the LCI',
    genNote:
      'The G30 splits into two worlds: pre-LCI cars run NBT Evo where we activate full wireless CarPlay, and LCI cars run iDrive 7 where coding focuses on Video in Motion, cluster layouts and convenience memory. Both take the comfort pack, and the G31 Touring tailgate behaviour is codeable too.',
    popular: [
      'Wireless Apple CarPlay activation (pre-LCI NBT Evo)',
      'Video in Motion on ID6 and iDrive 7',
      'Digital cluster layouts and sport displays',
      'Comfort Access, mirror and window coding',
      'G31 tailgate and Touring-specific behaviour',
      'Start/Stop and driving-mode memory',
    ],
    faq: {
      q: 'Is CarPlay on the G30 really subscription-free after coding?',
      a: 'Yes. On NBT Evo cars we activate full CarPlay through coding — no trial, no annual ConnectedDrive fee. It survives normal use; we show it working before you pay.',
    },
    related: ['bmw-f10-coding', 'bmw-g20-coding', 'bmw-7-series-coding'],
  },
  {
    slug: 'bmw-x3-coding',
    title: 'X3 (F25 / G01)',
    short: 'X3',
    codes: 'F25, G01',
    years: 'F25 2010–2017 · G01 2017–present',
    headUnits: 'CIC/NBT on the F25, NBT Evo then iDrive 7 on the G01',
    genNote:
      'X3s are family cars first, so the most-requested coding is practical: auto-folding mirrors, one-touch windows, tailgate behaviour, Comfort Access tweaks and camera views. G01 cars add CarPlay activation (NBT Evo) or Video in Motion and cluster coding (iDrive 7).',
    popular: [
      'Apple CarPlay activation on G01 NBT Evo builds',
      'Auto-folding mirrors and one-touch windows',
      'Powered tailgate and Comfort Access behaviour',
      'Reversing camera and PDC display tweaks',
      'Video in Motion (NBT and newer)',
      'Welcome lights and ambient lighting',
    ],
    faq: {
      q: 'Can you code the tailgate and mirrors on my X3?',
      a: 'Yes — tailgate opening behaviour, auto-folding mirrors on lock and Comfort Access tweaks are the bread-and-butter X3 jobs on both F25 and G01. Done in one session with anything else you want enabled.',
    },
    related: ['bmw-x5-coding', 'bmw-g20-coding', 'bmw-x1-coding'],
  },
  {
    slug: 'bmw-x5-coding',
    title: 'X5 (F15 / G05)',
    short: 'X5',
    codes: 'F15, G05',
    years: 'F15 2013–2018 · G05 2018–present',
    headUnits: 'NBT / NBT Evo on the F15, iDrive 7 on the G05',
    genNote:
      'The X5 carries BMW\'s full option list, which means lots of dormant features to unlock: Video in Motion for the rear passengers, digital cluster layouts, air-suspension and tailgate behaviour, camera views and lighting scenes. F15 cars with NBT Evo take CarPlay activation; Japanese-import F15s get the full EU conversion.',
    popular: [
      'Video in Motion — front and rear screens',
      'Apple CarPlay activation (F15 NBT Evo)',
      'Tailgate, air-suspension and Comfort Access behaviour',
      'Surround-view camera tweaks',
      'Digital cluster and sport displays (G05)',
      'Japan-import conversion on F15 imports',
    ],
    faq: {
      q: 'Can rear passengers watch video while I drive after coding?',
      a: 'Yes — Video in Motion unlocks playback on the move, including rear-seat entertainment where fitted. It is one of the most-requested X5 codings; we show it working before you pay.',
    },
    related: ['bmw-x3-coding', 'bmw-g30-coding', 'bmw-7-series-coding'],
  },
  {
    slug: 'bmw-x1-coding',
    title: 'X1 (F48)',
    short: 'X1',
    codes: 'F48',
    years: '2015–2022',
    headUnits: 'Business radio on base cars, NBT Evo (ID5/ID6) on higher specs and LCI',
    genNote:
      'The F48 X1 is one of Ireland\'s most common BMWs, and most leave the factory with the good stuff switched off. NBT Evo cars take full CarPlay activation; every F48 benefits from mirror, window and lighting coding, plus the tailgate and chime tweaks owners ask for daily.',
    popular: [
      'Apple CarPlay activation on NBT Evo builds',
      'Auto-folding mirrors and one-touch windows',
      'Powered tailgate behaviour',
      'Seatbelt chime and disclaimer removal',
      'DRL and welcome-light behaviour',
      'Video in Motion on NBT Evo cars',
    ],
    faq: {
      q: 'Which X1s support CarPlay activation?',
      a: 'F48s with NBT Evo (ID5/ID6) — typically higher-spec and LCI cars. The base Business radio does not support CarPlay, but comfort and lighting coding still applies. Send your year and build and we confirm in minutes.',
    },
    related: ['bmw-x3-coding', 'bmw-f20-coding', 'bmw-g20-coding'],
  },
  {
    slug: 'bmw-m3-m4-coding',
    title: 'M3 / M4 (F80 / F82 / G80 / G82)',
    short: 'M3/M4',
    codes: 'F80, F82, G80, G82',
    years: 'F8x 2014–2019 · G8x 2021–present',
    headUnits: 'NBT / NBT Evo on F8x, iDrive 7/8 on G8x',
    genNote:
      'M cars come for the driver-focused coding: M Laptimer and performance pages, exhaust flap behaviour, M1/M2 button configuration depth, launch-control related settings where supported, plus the usual CarPlay (F8x NBT Evo) and Video in Motion. We are careful and honest here — anything that touches drivetrain safety we discuss first.',
    popular: [
      'M Laptimer and performance pages (where supported)',
      'Sport displays, boost and oil-temp gauges',
      'Exhaust flap behaviour coding',
      'Apple CarPlay activation (F8x NBT Evo)',
      'Video in Motion',
      'Cluster startup sweep and M View layouts',
    ],
    faq: {
      q: 'Can you code the exhaust flaps on my M4?',
      a: 'On F8x and G8x cars the flap behaviour can be adjusted through coding so the car holds the character you want per drive mode. We explain exactly what changes and it is fully reversible.',
    },
    related: ['bmw-f32-coding', 'bmw-g20-coding', 'bmw-f30-coding'],
  },
  {
    slug: 'bmw-7-series-coding',
    title: '7 Series (F01 / G11 / G12)',
    short: '7 Series',
    codes: 'F01, F02, G11, G12',
    years: 'F0x 2008–2015 · G1x 2015–2022',
    headUnits: 'CIC/NBT on F0x, NBT Evo then iDrive 7 on G1x',
    genNote:
      'The 7 Series ships with nearly every module BMW makes, so coding unlocks a long list: rear-seat entertainment and Video in Motion, massage/comfort seat behaviour, soft-close and Comfort Access tweaks, laser/LED light scenes and full CarPlay on NBT Evo cars. Japanese-import 7 Series are frequent and get the complete EU conversion.',
    popular: [
      'Video in Motion including rear-seat screens',
      'Apple CarPlay activation (G11/G12 NBT Evo)',
      'Soft-close, Comfort Access and seat behaviour',
      'Welcome light carpet and lighting scenes',
      'Japan-import conversion (region, FSC, EU maps)',
      'Full ISTA scan — worthwhile on any used 7er',
    ],
    faq: {
      q: 'Is coding worth it on an older F01 730d?',
      a: 'Usually yes — comfort, lighting and chime coding all applies, and a full ISTA scan tells you the honest health of the car\'s many modules. We are straight about what an F01 can and cannot do before you spend anything.',
    },
    related: ['bmw-g30-coding', 'bmw-x5-coding', 'bmw-f10-coding'],
  },
  {
    slug: 'bmw-f-series-coding',
    title: 'F Series (All Models)',
    short: 'F-series BMW',
    codes: 'F10, F15, F20, F25, F30, F31, F32, F34, F36, F48',
    years: '2010\u20132019',
    genNote:
      'The F generation is the sweet spot for BMW coding in Ireland: nearly every comfort, lighting and display behaviour lives in software, and LCI cars with NBT Evo take full Apple CarPlay activation. Whether it is a 1 Series hatch or an X5, the feature set is broadly the same \u2014 hidden features, Video in Motion, digital speed, mirror and window comfort coding, and Japan-import conversions.',
    headUnits: 'CIC and Business on early cars, NBT from ~2013, NBT Evo (ID5/ID6) on LCI builds',
    popular: [
      'Apple CarPlay activation on NBT Evo builds',
      'Video in Motion and full menus while driving',
      'Digital speed and sport displays in the cluster',
      'Auto-folding mirrors, one-touch windows, comfort access tweaks',
      'Welcome lights, ambient lighting and DRL behaviour',
      'Japan-import conversion: region, radio bands, FSC, EU maps',
    ],
    faq: {
      q: 'Which F-series models do you cover?',
      a: 'All of them \u2014 1/2/3/4/5/7 Series and X1\u2013X6 on F chassis. The exact feature list depends on the head unit and build year, so send the model, year and VIN and we confirm what your car supports.',
    },
    related: ['bmw-f30-coding', 'bmw-f10-coding', 'bmw-f20-coding'],
  },
  {
    slug: 'bmw-g-series-coding',
    title: 'G Series (All Models)',
    short: 'G-series BMW',
    codes: 'G01, G05, G11, G20, G21, G30, G31',
    years: '2017 onwards',
    genNote:
      'G-series cars ship with iDrive 7/8 where BMW gates many features behind options and subscriptions \u2014 which makes coding especially rewarding: wireless CarPlay behaviour, extended displays, comfort functions and camera options can often be enabled on the equipment already in the car. We code G bodies in person or remotely over ENET.',
    headUnits: 'iDrive 6 on the earliest builds, iDrive 7 (ID7) on most, iDrive 8 on the newest',
    popular: [
      'Full-screen wireless Apple CarPlay behaviour',
      'Video in Motion on iDrive 7',
      'Extended digital cluster and HUD options',
      'Comfort closing, mirror and lighting behaviour',
      'Camera views and parking assistant options',
      'Sport displays and drive-mode memory',
    ],
    faq: {
      q: 'Is coding safe on a G series still under warranty?',
      a: 'Coding changes settings that already exist in the car and is fully reversible \u2014 we can return everything to factory before a dealer visit. Tell us the build and we will be straight about what is sensible on a warranty car.',
    },
    related: ['bmw-g20-coding', 'bmw-g30-coding', 'bmw-x3-coding'],
  },
];

function buildChassisPage(f: ChassisFacts): ServicePage {
  return {
    slug: f.slug,
    metaTitle: `BMW ${f.title} Coding Ireland | Hidden Features & CarPlay`,
    metaDescription: `BMW ${f.codes} coding in Dublin and across Ireland (${f.years}). ${f.popular[0]}, hidden features, Video in Motion and diagnostics — in person or remote.`,
    serviceName: `BMW ${f.title} Coding`,
    eyebrow: `${f.codes} · ${f.years}`,
    h1: `BMW ${f.title} Coding — Hidden Features, CarPlay & More`,
    heroSub: `Independent coding for the BMW ${f.title} (${f.years}) in Dublin and across Ireland. ${f.headUnits}. In person at the car or our workshop off the N7, or remotely over ENET.`,
    intro: [
      f.genNote,
      `Every job starts with your exact build: send the model year and VIN and we confirm which features your ${f.short} supports before anything is booked. Work is done in person around Dublin and the surrounding counties, at our workshop at Greenogue Business Park (Rathcoole, off the N7), or remotely over ENET anywhere in Ireland. Everything is reversible and you pay on completion, once you have seen it working.`,
    ],
    includedHeading: `Most-requested coding on the ${f.short}`,
    included: f.popular,
    modelsHeading: 'Generation details',
    models: [
      `Chassis: ${f.codes} (${f.years})`,
      `Head units: ${f.headUnits}`,
      'Tooling: ISTA / Rheingold, E-Sys with PSdZData and ENET / OBD',
      'Compatibility confirmed from model, year and VIN before booking',
    ],
    process: [
      { title: 'Send your build', body: `Message the year, spec and VIN of your ${f.short} plus what you want enabled. We reply with what is possible and a price.` },
      { title: 'In person or remote', body: 'We come to the car around Dublin, you visit the workshop off the N7, or we connect remotely over ENET anywhere in Ireland.' },
      { title: 'Code and verify', body: 'We apply the coding and demonstrate each feature working on your car.' },
      { title: 'Pay on completion', body: 'Card or cash once you have seen the result — no deposit.' },
    ],
    faqs: [
      f.faq,
      {
        q: `How much does coding a ${f.short} cost?`,
        a: 'It depends on the features: single items like CarPlay activation start from €120, diagnostics from €80, and multi-feature sessions are priced as a bundle. We confirm the price up front from your build.',
      },
      {
        q: `Can my ${f.short} be coded remotely?`,
        a: 'Most software features, yes — you connect a Windows laptop and an ENET cable to the OBD port and we code over a screen-share session. Hardware retrofits need the car in person.',
      },
      {
        q: 'Is the coding reversible?',
        a: 'Fully. Every change adjusts parameters that already exist in the car, and we can return any setting to factory — for example before a dealer visit.',
      },
    ],
    related: [
      ...f.related.slice(0, 2).map((slug) => ({
        slug,
        label: CHASSIS.find((c) => c.slug === slug)?.title
          ? `BMW ${CHASSIS.find((c) => c.slug === slug)!.title} coding`
          : slug,
      })),
      { slug: 'bmw-coding-list', label: 'the full BMW coding list' },
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
    ],
    waMessage: `Hi — I'd like coding on my BMW ${f.short}. It's a `,
  };
}

export const CHASSIS_PAGES: Record<string, ServicePage> = Object.fromEntries(
  CHASSIS.map((f) => [f.slug, buildChassisPage(f)]),
);

export const CHASSIS_NAV: { slug: string; label: string }[] = CHASSIS.map((f) => ({
  slug: f.slug,
  label: f.title,
}));
