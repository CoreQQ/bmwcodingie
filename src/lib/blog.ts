// SEO guides — genuinely useful long-form content, not placeholders.
// English only (the primary SEO language), rendered under /blog.

export type BlogSection = { heading: string; paragraphs: string[]; bullets?: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  metaTitle: string;
  description: string;
  date: string; // ISO
  readMinutes: number;
  intro: string[];
  sections: BlogSection[];
  related: { slug: string; label: string }[]; // service pages
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'bmw-apple-carplay-nbt-evo-vs-mgu',
    title: 'BMW Apple CarPlay Activation: NBT Evo vs MGU',
    metaTitle: 'BMW CarPlay Activation: NBT Evo vs MGU Explained | BMW Coding',
    description:
      'Which BMW head units support Apple CarPlay, the difference between NBT Evo and MGU, wireless vs wired, and how activation by coding actually works.',
    date: '2026-07-01',
    readMinutes: 5,
    intro: [
      'The single most common question we get in Dublin is “can my BMW get Apple CarPlay?” The honest answer depends almost entirely on which head unit your car left the factory with — not the badge on the boot. This guide explains the two systems that matter, NBT Evo and MGU, and what activation looks like on each.',
    ],
    sections: [
      {
        heading: 'How to tell which head unit you have',
        paragraphs: [
          'A quick visual check: if your iDrive menu has six large tiles and a flat, card-like look (iDrive 5/6), you are almost certainly on NBT Evo — common in F-series cars from around 2016 and early G-series. If the display is a wide panel with live widgets you can swipe through (iDrive 7), that is MGU, fitted to most G-series cars from 2018–2019 on.',
          'The definitive answer comes from your VIN: the build sheet lists the head unit as an option code. Send us your model, year and VIN and we will confirm it in minutes.',
        ],
      },
      {
        heading: 'NBT Evo (iDrive 5/6): the retrofit-era CarPlay',
        paragraphs: [
          'NBT Evo ID5/ID6 units have the hardware for CarPlay, but BMW shipped many cars with it locked or tied to a ConnectedDrive subscription. Activation by coding enables full CarPlay — including wireless on most builds — with no subscription and no annual renewal.',
          'One catch we always flag: some early ID5 units need a software update before CarPlay can be enabled, which adds time to the job. That is exactly the kind of thing we confirm from your build before quoting.',
        ],
      },
      {
        heading: 'MGU (iDrive 7/8): CarPlay and Android Auto',
        paragraphs: [
          'On MGU cars CarPlay is usually present but sometimes trial-limited, and Android Auto only exists on this generation. Activation unlocks both permanently where the build supports it. Wireless operation is standard here — MGU was designed around it.',
        ],
      },
      {
        heading: 'What activation actually involves',
        paragraphs: [
          'This is coding, not hardware: we connect over ENET (in person around Dublin, or remotely anywhere in Ireland with your laptop and cable), enable the feature set, pair your phone and show it working before you pay. The whole session is typically under an hour.',
        ],
        bullets: [
          'No subscription — activation is permanent for the head unit',
          'Wireless CarPlay on supported NBT Evo and all MGU builds',
          'Android Auto available on MGU (iDrive 7) builds',
          'Reversible, like all coding we do',
        ],
      },
    ],
    related: [
      { slug: 'apple-carplay-activation-dublin', label: 'Apple CarPlay activation in Dublin' },
      { slug: 'bmw-android-auto-activation', label: 'Android Auto activation' },
      { slug: 'remote-bmw-coding-ireland', label: 'Remote coding across Ireland' },
    ],
  },
  {
    slug: 'best-hidden-features-bmw-f30-f32',
    title: 'The Best Hidden Features to Code on a BMW F30, F31 & F32',
    metaTitle: 'Best Hidden Features to Code on BMW F30/F31/F32 | BMW Coding',
    description:
      'The most worthwhile coding options on the BMW 3 and 4 Series (F30, F31, F32, F36): displays, lighting, comfort functions and the ones we recommend skipping.',
    date: '2026-06-24',
    readMinutes: 6,
    intro: [
      'The F30 generation is the sweet spot for BMW coding in Ireland: hugely popular, deeply codable, and old enough that most cars are out of warranty anxiety territory. After coding a lot of these cars around Dublin, here is what actually gets used a year later — and what does not.',
    ],
    sections: [
      {
        heading: 'The ones owners never switch off',
        paragraphs: [
          'Three features come up again and again when customers tell us what stuck.',
        ],
        bullets: [
          'Start/Stop memory — the car remembers you turned auto start/stop off, instead of re-arming it every drive. The most requested single item on this platform.',
          'Digital speed readout in the cluster — a precise km/h number between the dials.',
          'One-touch windows and mirror folding from the key — hold the unlock button and the windows drop, hold lock and the mirrors tuck in.',
        ],
      },
      {
        heading: 'Displays and theatre',
        paragraphs: [
          'Sport displays add power and torque gauges to the iDrive screen; the needle-sweep start-up animation adds a bit of occasion when you hit start. Both are pure software on this platform. Enhanced Bluetooth and office functions are also unlockable on many builds.',
        ],
      },
      {
        heading: 'Lighting behaviour',
        paragraphs: [
          'Welcome light timing, angel-eye brightness as DRLs, fog lights joining the cornering function, triple-blink indicators — all standard coding fare on the F30. If your car has adaptive headlights, there is even more to tune.',
        ],
      },
      {
        heading: 'What we usually talk people out of',
        paragraphs: [
          'Disabling the seatbelt chime is possible, and we will decline politely — it is a safety system. “Sport+ everything at startup” sounds good until the first wet roundabout with traction relaxed. And Video in Motion is genuinely useful for passengers, but we always explain the legal position: it is for passengers, not the driver.',
        ],
      },
      {
        heading: 'How a session works',
        paragraphs: [
          'Most F30 coding sessions run 45–90 minutes depending on the list. We come to the car anywhere around Dublin, Kildare, Wicklow or Meath — or connect remotely if you have a laptop and an ENET cable. Everything is reversible and you pay when you have seen it working.',
        ],
      },
    ],
    related: [
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
      { slug: 'bmw-coding-list', label: 'Full coding list' },
      { slug: 'bmw-retrofits-dublin', label: 'Retrofits (hardware features)' },
    ],
  },
  {
    slug: 'remote-bmw-coding-what-you-need',
    title: 'Remote BMW Coding in Ireland: What You Need Before Booking',
    metaTitle: 'Remote BMW Coding in Ireland — ENET Setup Guide | BMW Coding',
    description:
      'Everything you need for a remote BMW coding session: the right ENET cable, laptop requirements, how the session works and what can and cannot be done remotely.',
    date: '2026-06-17',
    readMinutes: 5,
    intro: [
      'If you are in Cork, Galway, Limerick or anywhere outside our Dublin in-person area, remote coding gets you the same result without anyone driving across the country. Here is exactly what you need and how a session runs, so there are no surprises on the day.',
    ],
    sections: [
      {
        heading: 'The shopping list (it is short)',
        paragraphs: ['Two things, and you probably own one already.'],
        bullets: [
          'A Windows laptop — nothing special, but a real battery is important; a session can take an hour.',
          'An ENET cable — the OBD-to-Ethernet cable made for F/G-series BMWs. Reliable ones cost roughly €15–25. Avoid the very cheapest unbranded ones; a flaky cable is the number-one cause of wasted sessions.',
        ],
      },
      {
        heading: 'How the session actually works',
        paragraphs: [
          'You park somewhere with decent internet (home Wi-Fi reaching the driveway is perfect), plug the ENET cable into the OBD port under the dash, connect it to the laptop, and join a screen-share session with us. We drive the laptop; you keep the car awake and watch the whole thing happen.',
          'Ignition stays on throughout, so we ask for a reasonably charged battery or a maintainer for longer lists — coding with the engine off draws the battery down, and low voltage is the one thing that can genuinely interrupt a session.',
        ],
      },
      {
        heading: 'What works remotely — and what does not',
        paragraphs: [
          'Almost all pure-software work is fine remotely: CarPlay activation, hidden features, comfort functions, display options, many diagnostic reads. What does not work remotely is anything physical — retrofits that need wiring or modules, and a small number of jobs that require specific tooling at the car. We tell you which side of the line your list falls on before you book.',
        ],
      },
      {
        heading: 'Is it safe?',
        paragraphs: [
          'Same tools, same process, same coder — just a longer cable, in effect. Every change is verified working during the session, anything can be reverted, and you pay on completion exactly as if we were sitting in the passenger seat.',
        ],
      },
    ],
    related: [
      { slug: 'remote-bmw-coding-ireland', label: 'Remote BMW coding service' },
      { slug: 'apple-carplay-activation-dublin', label: 'CarPlay activation' },
      { slug: 'bmw-coding-list', label: 'What can be coded' },
    ],
  },
  {
    slug: 'bmw-coding-cost-ireland',
    title: 'How Much Does BMW Coding Cost in Ireland?',
    metaTitle: 'BMW Coding Prices Ireland 2026 | CarPlay, Diagnostics & More | BMW Coding',
    description:
      'Real 2026 prices for BMW coding in Ireland: CarPlay activation from €150, diagnostics from €80, Video in Motion from €60, Japan import conversion from €250 — and what decides the final price.',
    date: '2026-07-04',
    readMinutes: 5,
    intro: [
      'Nobody likes “price on request” for everything, so here is the honest version: what BMW coding actually costs in Ireland in 2026, what is a fixed price and what genuinely depends on the car. All prices below are what we charge — paid on completion, after you have seen the feature working.',
    ],
    sections: [
      {
        heading: 'The fixed prices',
        paragraphs: [
          'Most pure-software jobs have a known price because the work is predictable once we confirm your build supports the feature.',
        ],
        bullets: [
          'Apple CarPlay activation — €150 on NBT Evo, €220 on MGU (no subscription)',
          'Wi-Fi antenna fitted (for wireless CarPlay on some builds) — +€30',
          'iDrive 4 → iDrive 6 upgrade — +€50',
          'Android Auto activation — €200 (iDrive 7 / 8, MGU builds)',
          'Full ISTA diagnostics with written summary — from €80',
          'Video in Motion — from €60',
          'Sport displays / digital cluster layouts — from €60',
          'Comfort pack (mirrors, windows, chimes, lighting) — from €40–50 per item, bundled cheaper',
          'Japan → EU conversion — €250 NBT Evo, €280 MGU (CarPlay included)',
        ],
      },
      {
        heading: 'What moves the price up or down',
        paragraphs: [
          'Three things, mostly. First, the head unit: some early NBT Evo builds need a software update before CarPlay can be enabled, which adds session time. Second, bundling: if we are already connected to the car, each extra feature is cheaper than booking it separately — tell us everything you want in one go. Third, hardware: anything that needs parts (ambient lighting, cruise control retrofit) is quoted as parts + labour + coding, always agreed before we order anything.',
        ],
      },
      {
        heading: 'Remote vs in-person — same price',
        paragraphs: [
          'A remote ENET session costs the same as in-person work because it is the same work. You save nothing by us sitting in the car, and you save travel by connecting a laptop and a €15–20 ENET cable from your own driveway anywhere in Ireland.',
        ],
      },
      {
        heading: 'Why we never ask for money up front',
        paragraphs: [
          'Every job is demonstrated working before you pay — card or cash on completion. If a feature turns out not to be possible on your exact build (it happens; we tell you the probability honestly beforehand), you simply do not pay for it.',
        ],
      },
    ],
    related: [
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
      { slug: 'apple-carplay-activation-dublin', label: 'CarPlay activation' },
      { slug: 'remote-bmw-coding-ireland', label: 'Remote coding across Ireland' },
    ],
  },
  {
    slug: 'video-in-motion-bmw-explained',
    title: 'Video in Motion on a BMW: What It Is and How It Works',
    metaTitle: 'BMW Video in Motion Explained | Unlock Video While Driving | BMW Coding',
    description:
      'What Video in Motion coding actually unlocks on a BMW, which screens and head units it works on, the passenger-safety angle, and what it costs in Ireland.',
    date: '2026-07-05',
    readMinutes: 4,
    intro: [
      'Out of the factory, every BMW blanks video playback and locks large parts of the iDrive menu the moment the car moves. Video in Motion (VIM) coding removes that speed lock. It is one of the most requested codings we do — here is exactly what it changes and what it does not.',
    ],
    sections: [
      {
        heading: 'What VIM unlocks',
        paragraphs: [
          'With VIM coded, video sources keep playing while the car is moving — screen mirroring, USB media, the TV/DVD module where fitted, and rear-seat entertainment screens on cars that have them. It also lifts the motion lock on menus, so a passenger can type a full navigation address instead of fighting the voice assistant on the M50.',
        ],
      },
      {
        heading: 'The honest safety point',
        paragraphs: [
          'VIM exists for passengers. The driver watching video on the move is illegal and dangerous in Ireland as anywhere else — nothing about coding changes that. Where VIM shines is the passenger seat and the back row: kids on a long drive to Cork, a partner following the match, navigation input on the move. Treat it like the passenger feature it is.',
        ],
      },
      {
        heading: 'Which BMWs support it',
        paragraphs: [
          'Practically all F-series and G-series cars: NBT, NBT Evo and MGU (iDrive 4 through 8). The coding differs per platform — older units take a parameter change, MGU cars need the current-generation tooling — but the result is the same. It is fully reversible, like everything we code.',
        ],
      },
      {
        heading: 'Price and how it is done',
        paragraphs: [
          'From €60, done in person around Dublin or remotely over ENET anywhere in Ireland, usually inside half an hour. It bundles well: most people take VIM together with CarPlay activation or a comfort-coding session.',
        ],
      },
    ],
    related: [
      { slug: 'bmw-coding-list', label: 'Full coding list' },
      { slug: 'apple-carplay-activation-dublin', label: 'CarPlay activation' },
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
    ],
  },
  {
    slug: 'japan-import-bmw-checklist-ireland',
    title: 'Buying a Japanese Import BMW in Ireland: The Software Checklist',
    metaTitle: 'Japanese Import BMW Ireland — Software Conversion Checklist | BMW Coding',
    description:
      'What every JDM import BMW needs after landing in Ireland: region change, radio bands, navigation FSC and EU maps, ETC mirror handling and a proper diagnostic scan.',
    date: '2026-07-06',
    readMinutes: 6,
    intro: [
      'Japanese imports are some of the best-value BMWs in Ireland — low mileage, high spec, honest history. But the car lands here still believing it lives in Japan. This is the software checklist we run on every import, in the order that matters.',
    ],
    sections: [
      {
        heading: '1. Region and language',
        paragraphs: [
          'The car\u2019s market region drives everything from units to which features are even visible. A proper conversion sets the region to Europe, switches the interface out of Japanese, and puts the cluster into km/h and °C. Doing this first makes every later step behave correctly.',
        ],
      },
      {
        heading: '2. Radio bands',
        paragraphs: [
          'Japanese FM runs 76–95 MHz; Irish stations broadcast higher. Until the tuner is re-banded, your radio is mostly static with the odd pirate signal. Band conversion is part of the region work — after it, RTÉ and every local station tune normally.',
        ],
      },
      {
        heading: '3. Navigation: FSC and European maps',
        paragraphs: [
          'The import\u2019s navigation carries Japanese maps, useless here. On compatible systems we generate the navigation FSC (the authorisation code tied to your car) and install current European maps, so guidance works from Malin Head to Mizen. On some cars navigation was never activated at all — the same FSC process can switch it on.',
        ],
      },
      {
        heading: '4. The ETC mirror and telematics',
        paragraphs: [
          'Many JDM cars have a toll-collection (ETC) module built into the mirror that has nothing to talk to in Europe and can throw faults. It needs to be handled properly, not just ignored. Japanese telematics (TCB) units similarly deserve a check — a car phoning home to a dead Japanese server is not doing your battery any favours.',
        ],
      },
      {
        heading: '5. A full ISTA scan before you settle in',
        paragraphs: [
          'Imports travel far and sit in compounds. A complete diagnostic scan across every control unit shows the honest state of the car — stored faults, battery registration state, anything the auction sheet did not mention. We include a written summary you can keep with the car\u2019s file.',
        ],
        bullets: [
          'Full conversion (region, bands, nav FSC, EU maps) — €250 NBT Evo, €280 MGU',
          'Navigation FSC + EU maps — quoted per system',
          'ISTA scan with written summary — from €80',
          'All demonstrated working before you pay',
        ],
      },
    ],
    related: [
      { slug: 'japan-import-bmw-conversion-ireland', label: 'Japan import conversion service' },
      { slug: 'bmw-map-updates-fsc-codes', label: 'Map updates & FSC codes' },
      { slug: 'bmw-diagnostics-dublin', label: 'ISTA diagnostics' },
    ],
  },
  {
    slug: 'which-idrive-do-i-have',
    title: 'Which iDrive Do I Have? CIC, NBT, NBT Evo and MGU Explained',
    metaTitle: 'Which BMW iDrive Do I Have? NBT vs NBT Evo vs MGU | BMW Coding',
    description:
      'A two-minute visual guide to identifying your BMW head unit — CIC, NBT, NBT Evo (iDrive 5/6) or MGU (iDrive 7/8) — and what each one can be coded to do.',
    date: '2026-07-07',
    readMinutes: 4,
    intro: [
      'Almost every coding question — CarPlay? Android Auto? maps? — comes down to one thing: which head unit your BMW left the factory with. Model year alone is not reliable, because spec levels overlapped. Here is how to tell in two minutes from the driver\u2019s seat.',
    ],
    sections: [
      {
        heading: 'The quick visual test',
        paragraphs: [
          'Turn the car on and look at the main menu. A column of text entries with a small map window is the CIC era (roughly 2008–2012). A row of flat rectangular tiles is NBT (2012–2016). Six large card-style tiles with smooth animations is NBT Evo, iDrive 5 or 6 (2016 onwards). A widescreen panel of live widgets you swipe sideways is MGU, iDrive 7 (2018–2019 onwards); if the whole thing is one huge curved glass panel, that is iDrive 8.',
        ],
      },
      {
        heading: 'Why it decides what you can code',
        paragraphs: [
          'CarPlay needs NBT Evo or newer — CIC and plain NBT never got the hardware. Android Auto needs MGU. Video in Motion and the comfort/lighting coding work across the whole range. Maps and FSC handling differ per generation. This is why we always ask for your VIN before quoting: the build sheet names the head unit exactly, and it takes us two minutes to check.',
        ],
        bullets: [
          'CIC (≈2008–2012): comfort coding, diagnostics — no CarPlay',
          'NBT (≈2012–2016): VIM, hidden features, maps — no CarPlay',
          'NBT Evo ID5/ID6 (2016+): full CarPlay activation, wireless on most ID6',
          'MGU iDrive 7/8 (2018+): CarPlay + Android Auto, modern coding tooling',
        ],
      },
      {
        heading: 'Still not sure?',
        paragraphs: [
          'Send us a photo of your home screen or just the VIN — we identify the unit and tell you exactly what your car supports and what it costs, before anything is booked. It is the same honest check we run for every job.',
        ],
      },
    ],
    related: [
      { slug: 'apple-carplay-activation-dublin', label: 'CarPlay activation' },
      { slug: 'bmw-android-auto-activation', label: 'Android Auto activation' },
      { slug: 'bmw-coding-list', label: 'Everything codeable, by category' },
    ],
  },
  {
    slug: 'bmw-warning-light-ista-diagnostics',
    title: 'BMW Warning Light On? What a Proper ISTA Scan Actually Tells You',
    metaTitle: 'BMW Warning Light Diagnostics Ireland | ISTA Scan Explained | BMW Coding',
    description:
      'Why a generic OBD reader misses most BMW faults, what dealer-level ISTA diagnostics reads across every control unit, and when a scan saves you real money.',
    date: '2026-07-07',
    readMinutes: 5,
    intro: [
      'A warning light tells you almost nothing by itself. The same yellow engine symbol can mean a loose filler cap or a failing high-pressure fuel pump. The difference between guessing and knowing is what reads the codes — and on a BMW, that difference is bigger than most owners expect.',
    ],
    sections: [
      {
        heading: 'Why the €20 OBD dongle falls short',
        paragraphs: [
          'Generic OBD readers speak the legally-mandated emissions protocol and little else. A modern BMW has dozens of control units — body, chassis, comfort, assistance, infotainment — that a generic tool never sees. That is why a cheap scanner says “no faults” while the car plainly disagrees.',
        ],
      },
      {
        heading: 'What ISTA reads instead',
        paragraphs: [
          'ISTA/Rheingold is the diagnostic platform BMW workshops use. It interrogates every module in the car, distinguishes stored faults from currently-active ones, shows freeze-frame data from the moment a fault set, and runs guided test plans built for your exact model. It is the difference between “a code” and an actual diagnosis.',
        ],
      },
      {
        heading: 'When a scan pays for itself',
        paragraphs: [
          'Before buying a used BMW: a full scan shows accident-era faults, chronically failing modules and battery state — €80 against a five-figure purchase. After a warning light: know whether it is trivial or urgent before booking workshop time. After any coding or retrofit elsewhere: confirm the work left the car clean. We always explain the codes in plain English and put the findings in writing.',
        ],
        bullets: [
          'Full multi-module scan with ISTA — from €80',
          'Stored and pending codes read, explained, and cleared where sensible',
          'Written summary you can act on (or hand to your mechanic)',
          'In person around Dublin; many checks possible remotely over ENET',
        ],
      },
      {
        heading: 'One honest caveat',
        paragraphs: [
          'A scan is a software inspection, not a mechanical one — it will not measure your brake discs. What it does is tell you where to look, before small electrical gremlins become expensive ones.',
        ],
      },
    ],
    related: [
      { slug: 'bmw-diagnostics-dublin', label: 'ISTA diagnostics service' },
      { slug: 'bmw-coding-dublin', label: 'BMW coding in Dublin' },
      { slug: 'japan-import-bmw-conversion-ireland', label: 'Japan import checks' },
    ],
  },
];



export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
