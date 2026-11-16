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
  // Nov 2026: written for the searches nothing on the site answered —
  // "define coding bmw", "what is bmw coding", "bimmercode ireland / near me".
  {
    slug: "what-is-bmw-coding",
    title: "What Is BMW Coding? A Plain Guide for Irish Owners",
    metaTitle: "What Is BMW Coding? Meaning, Cost & What It Changes",
    description: "BMW coding explained in plain English: what it changes, how it differs from programming and retrofits, what it costs in Ireland and whether it is reversible.",
    date: "2026-11-16",
    readMinutes: 6,
    intro: [
      "A modern BMW leaves the factory with far more software in it than the owner ever sees. The same control units go into cars for every market and every trim level, and a long list of settings decides which functions are switched on in yours. BMW coding is the job of changing those settings.",
      "This guide explains what coding is and is not, how it differs from programming and from a retrofit, what can realistically be changed, and what it costs in Ireland. It is written by the people who do it every day around Dublin, so the prices are the ones we actually charge.",
    ],
    sections: [
      {
        heading: "BMW coding, defined",
        paragraphs: [
          "Every function in the car — lights, locks, mirrors, the instrument cluster, iDrive — is run by a control unit, and each control unit holds a table of options. Coding means connecting to the car through the OBD port and changing those options: switching a function on, switching one off, or changing how it behaves.",
          "Nothing is added to the car and nothing is replaced. If the mirrors can fold electrically, coding can make them fold when you lock the car. If the cluster can show a digital speed, coding can switch that display on. The ability was already there; the factory setting simply left it off for your market or your spec.",
        ],
      },
      {
        heading: "Coding, programming, activation and retrofits — four different jobs",
        paragraphs: [
          "People use “coding” for all of these, and a specialist does all four, but they are not the same work and they are not priced the same.",
        ],
        bullets: [
          "Coding — changing options that already exist. Folding mirrors on lock, digital speed, welcome lights, Start/Stop memory.",
          "Programming (flashing) — installing a newer software version on a control unit. Updating an iDrive from ID4 to ID6 is programming.",
          "Activation — unlocking a function with a code tied to your car. Apple CarPlay and navigation maps work this way.",
          "Retrofit — fitting hardware the car did not have (a reversing camera, cruise control buttons, ambient lighting) and then coding the car to use it.",
        ],
      },
      {
        heading: "What can be coded on a BMW",
        paragraphs: [
          "On F-Series and G-Series cars the usual requests fall into a few groups. What your own car can have depends on its build, which is why everything starts with the VIN.",
        ],
        bullets: [
          "Comfort: mirrors folding on lock, windows and roof from the key, seatbelt chimes, Start/Stop memory",
          "Lighting: welcome and coming-home lights, daytime running light behaviour, indicator blink count",
          "Displays: digital speed, sport displays, cluster layouts, speed limit information where the car has the camera",
          "Multimedia: Video in Motion for passengers, fullscreen CarPlay, iDrive menu options",
          "Bigger jobs on the same connection: Apple CarPlay activation, Android Auto, Japan to EU conversion, iDrive updates, map updates",
        ],
      },
      {
        heading: "What coding cannot do",
        paragraphs: [
          "Coding cannot create hardware. Heated seats need the heating elements, a reversing camera needs a camera, adaptive cruise needs the radar. Where the parts are missing the job becomes a retrofit, with parts and fitting.",
          "It also cannot get around the car’s generation. Apple CarPlay cannot be activated on BMWs built before 2016, because the head unit does not support it. An honest specialist tells you this from the VIN before you book, not when the car is already connected.",
        ],
      },
      {
        heading: "Is it safe and reversible? What about warranty?",
        paragraphs: [
          "Coding changes values that BMW’s own software provides for, so it is reversible: any setting can be returned to the factory value, for example before a dealer visit. We tell you up front if a particular request is one a dealer is likely to notice.",
          "The risk is in how it is done, not in the idea. A stable power supply, the right data for your exact car and a backup before anything is written are what separate a routine job from a control unit that needs recovering. Video in Motion is for passengers; the driver should not be watching a screen.",
        ],
      },
      {
        heading: "What BMW coding costs in Ireland",
        paragraphs: [
          "Software jobs have known prices once the build is confirmed. These are ours in 2026, paid on completion once you have seen the result.",
        ],
        bullets: [
          "A coding visit or remote session — from €80; single settings are from €40 each and are combined into one job",
          "Apple CarPlay activation — €150 on NBT Evo (most 2016–2019 cars), €220 on iDrive 7",
          "Japan to EU conversion — €250 on NBT Evo, €300 on iDrive 7, Apple CarPlay included",
          "Full ISTA diagnostics with a written summary — from €80",
          "Call-out — €20 around Dublin, then €1.25 per km; none for remote coding",
        ],
      },
      {
        heading: "How it is done",
        paragraphs: [
          "There are two ways. In person, we come to the car at your home or workplace around Dublin, Kildare, Wicklow and Meath. Remotely, anywhere in Ireland, you connect a Windows laptop to the car with an ENET cable and we do the work over a screen-share session. It is the same job at the same price.",
          "Most sessions take between thirty minutes and a couple of hours. The tools are BMW’s own — ISTA for diagnostics and E-Sys for coding — which is what lets a specialist do the activation, programming and conversion work that phone apps cannot.",
        ],
      },
    ],
    related: [
      { slug: "bmw-coding-dublin", label: "BMW coding in Dublin" },
      { slug: "bmw-coding-list", label: "The full BMW coding list" },
      { slug: "bmw-coding-price-calculator", label: "Price calculator" },
      { slug: "remote-bmw-coding-ireland", label: "Remote coding across Ireland" },
    ],
  },
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
          'On MGU cars CarPlay is usually present but sometimes trial-limited, and Android Auto is built for this generation (we can now also add it natively to NBT Evo with ID6, from €150). Activation unlocks both permanently where the build supports it. Wireless operation is standard here — MGU was designed around it.',
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
          'iDrive ID4/ID5 → ID6 update — €300 with Apple CarPlay activation included (+€100 with a Japan → EU conversion)',
          'Android Auto activation — €200 on iDrive 7 (MGU), new: €150 on NBT Evo with ID6 (without CarPlay activation and antenna; €250 with both) — iDrive 8 quoted per car',
          'Full ISTA diagnostics with written summary — from €80',
          'Video in Motion — from €60',
          'Sport displays / digital cluster layouts — from €60',
          'Comfort pack (mirrors, windows, chimes, lighting) — from €40–50 per item, bundled cheaper',
          'Japan → EU conversion — €250 NBT Evo, €300 MGU with everything convertible included, CarPlay included on both (Android Auto separate: €150 NBT Evo ID6, €200 MGU)',
          'Minimum job — €80 per visit or remote session; the smaller settings above are combined into one job',
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
    metaTitle: 'BMW Video in Motion Explained | Passenger Media on the Move | BMW Coding',
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
          'For passenger use only. The driver must always comply with local road safety laws. VIM exists for passengers. The driver watching video on the move is illegal and dangerous in Ireland as anywhere else — nothing about coding changes that. Where VIM shines is the passenger seat and the back row: kids on a long drive to Cork, a partner following the match, navigation input on the move. Treat it like the passenger feature it is.',
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
          'From €60, done in person around Dublin or remotely over ENET anywhere in Ireland, usually inside half an hour. The minimum job is €80, so most people take VIM together with CarPlay activation or a couple of comfort settings.',
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
          'The import\u2019s navigation carries Japanese maps, useless here. On compatible systems we apply the navigation FSC (the authorisation code tied to your car) and install current European maps, so guidance works from Malin Head to Mizen. On some cars navigation was never activated at all — the same FSC process can switch it on.',
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
          'Full conversion (region, bands, nav FSC, EU maps) — €250 NBT Evo, €300 MGU with CarPlay included',
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
          'CarPlay needs NBT Evo or newer — CIC and plain NBT never got the hardware. Android Auto is native on MGU, and we can now add it to NBT Evo with ID6 software. Video in Motion and the comfort/lighting coding work across the whole range. Maps and FSC handling differ per generation. This is why we always ask for your VIN before quoting: the build sheet names the head unit exactly, and it takes us two minutes to check.',
        ],
        bullets: [
          'CIC (≈2008–2012): comfort coding, diagnostics — no CarPlay',
          'NBT (≈2012–2016): VIM, hidden features, maps — no CarPlay',
          'NBT Evo ID5/ID6 (≈2016–2019): full CarPlay activation, wireless on most ID6',
          'MGU iDrive 7/8 (≈2020+): CarPlay + Android Auto, modern coding tooling',
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
  {
    slug: 'bmw-6wa-vs-6wb-digital-cluster',
    title: 'BMW 6WA vs 6WB: What the Digital Cluster Retrofit Actually Changes',
    metaTitle: 'BMW 6WA vs 6WB Explained | Digital Cluster Retrofit Guide',
    description:
      'What the BMW option codes 6WA and 6WB mean, which F-series cars can take the full digital cluster, how mileage is handled, and what a retrofit involves.',
    date: '2026-10-04',
    readMinutes: 5,
    intro: [
      'Owners ask us about “the digital dash” more than almost any other retrofit. The two option codes behind it are 6WA and 6WB, and the difference is bigger than it looks in photos. This guide explains what each one is, which cars can be converted, and the questions we ask before quoting.',
    ],
    sections: [
      {
        heading: 'What 6WA and 6WB mean',
        paragraphs: [
          '6WA is the “Extended Instrument Cluster” most F-series cars left the factory with: real needles for speed and revs, with a small display between them for trip data, navigation arrows and media. 6WB is the “Multifunctional Instrument Display” — a full TFT screen behind the same hood, drawn entirely in software.',
          'On 6WB the layout changes with the drive mode: a blue-accented Comfort theme, a red Sport theme with a larger rev counter, and an Eco Pro theme that shows efficiency instead of revs. Navigation and media information get far more room than the little 6WA window allows.',
        ],
      },
      {
        heading: 'Which cars can take 6WB',
        paragraphs: [
          'The retrofit is most common on the F-series 1, 2, 3 and 4 Series — F20/F21, F22, F30/F31/F34, F32/F33/F36 — and the M3/M4 built on them. Whether a specific car qualifies depends on its build date and what else is fitted, so the first thing we do is read the VIN rather than promise anything from the model name.',
          'Some other F-series models can be done with extra parts or wiring, and some are simply not worth it. If your car is one of those, we tell you up front.',
        ],
      },
      {
        heading: 'Mileage — the question everyone should ask',
        paragraphs: [
          'A replacement cluster carries a mileage value, and your car’s mileage is also stored elsewhere in the vehicle. The two must agree, and the cluster must not show more than the car has done. Anyone who tells you the odometer can be “set to whatever you like” is describing something illegal and we do not do it.',
          'In practice this means sourcing a cluster with less mileage than your car, or a new one, and letting the car’s own value take over. We help you choose a suitable unit before anything is ordered.',
        ],
      },
      {
        heading: 'What the retrofit involves',
        paragraphs: [
          'It is physical work plus coding: the 6WB cluster is fitted, the vehicle order is updated so the car knows it has a digital display, the cluster is coded, and the rest of the system is checked for faults. It is done as a mobile visit — there is no remote version of this job.',
        ],
        bullets: [
          'Fitting the 6WB cluster in place of the 6WA unit',
          'Vehicle order and cluster coding',
          'Comfort / Sport / Eco Pro layouts working',
          'Fault memory checked and cleared afterwards',
        ],
      },
      {
        heading: 'How much it costs',
        paragraphs: [
          'The cluster itself is the biggest variable, and prices for used and new units move around. That is why we quote per car after a VIN check rather than printing one number: you get a fixed price for the work before anything is bought.',
        ],
      },
    ],
    related: [
      { slug: 'bmw-6wa-to-6wb-retrofit', label: '6WA → 6WB retrofit service' },
      { slug: 'bmw-f30-coding', label: 'F30 coding & upgrades' },
      { slug: 'bmw-retrofits-dublin', label: 'All BMW retrofits' },
    ],
  },
  {
    slug: 'bmw-id4-to-id6-upgrade-explained',
    title: 'BMW ID4 to ID6 Upgrade Explained',
    metaTitle: 'BMW ID4 to ID6 Upgrade Explained | NBT Evo Software Guide',
    description:
      'ID4, ID5 and ID6 are software versions of the same NBT Evo head unit. How to tell which one you have, what the ID6 update changes, why it matters for CarPlay, and which cars cannot be updated.',
    date: '2026-10-04',
    readMinutes: 4,
    intro: [
      'If your BMW has the older list-style iDrive menu but a 2016-or-later build date, there is a good chance it is an NBT Evo car running ID4 or ID5 software. The same hardware can run ID6 — the tile-based interface most people picture when they think of a modern iDrive — and the update is often what stands between you and CarPlay.',
    ],
    sections: [
      {
        heading: 'ID4, ID5, ID6: versions, not head units',
        paragraphs: [
          'BMW’s NBT Evo head unit shipped with several software generations. ID4 looks like the older NBT system: a vertical list menu and a plain layout. ID5 added a cleaner design, and ID6 brought the home screen of live tiles that you can rearrange. All three run on NBT Evo hardware — which is exactly why the update is possible.',
          'The confusion comes from the original NBT (non-Evo) unit, fitted to many 2013–2016 cars. It also runs ID4-style menus but it is different hardware, and it cannot be updated to ID6. The VIN settles which one you have.',
        ],
      },
      {
        heading: 'What the update changes',
        paragraphs: [
          'Visually, you get the ID6 tile home screen and the newer menus. Functionally, the update brings the software level that CarPlay activation needs on most NBT Evo cars: ID4 cars generally cannot have CarPlay enabled until they are on ID6, and some ID5 cars need it too.',
        ],
        bullets: [
          'ID6 live-tile home screen and newer menus',
          'The software level needed for CarPlay on most NBT Evo cars',
          'Done on your existing head unit — no new hardware',
          'Settings and existing coding checked afterwards',
        ],
      },
      {
        heading: 'How it is done',
        paragraphs: [
          'The update is applied with dealer-level tools over an ENET connection, either remotely with your own Windows laptop or at your car around Dublin. It takes a while, so the car needs a stable battery supply during the session — we send a short checklist beforehand.',
          'The update is €300 and Apple CarPlay activation is included in that price — both are done in the same session. With a Japan → EU conversion the update is +€100.',
        ],
      },
      {
        heading: 'Cars that cannot be updated',
        paragraphs: [
          'NBT (non-Evo), CIC and EntryNav units are different hardware. They can still have hidden features, navigation maps and diagnostics done, but ID6 and native CarPlay are not available without a head unit change — which is a much bigger job and not always worth it. We would rather say that clearly than book work that will not deliver.',
        ],
      },
    ],
    related: [
      { slug: 'bmw-id4-to-id6-upgrade', label: 'ID4 → ID6 upgrade service' },
      { slug: 'bmw-carplay-activation-ireland', label: 'CarPlay activation across Ireland' },
      { slug: 'bmw-idrive-upgrade-ireland', label: 'All iDrive upgrade options' },
    ],
  },
  {
    slug: 'what-can-be-coded-on-bmw-g20',
    title: 'What Can Be Coded on a BMW G20 3 Series?',
    metaTitle: 'BMW G20 Coding: What Can Be Enabled | 3 Series 2019+ Guide',
    description:
      'A practical list of what coding can enable on the G20/G21 3 Series: CarPlay and Android Auto, iDrive 7 display tweaks, comfort functions, lighting — and what iDrive 8 changes.',
    date: '2026-10-04',
    readMinutes: 5,
    intro: [
      'The G20 is the first 3 Series built around iDrive 7, and it responds well to coding: a lot of what the car can do is simply switched off for the Irish market or tied to an option it never had. Here is what we are asked for most on G20 and G21 cars, and what is realistic.',
    ],
    sections: [
      {
        heading: 'Phone integration',
        paragraphs: [
          'Most G20s have the hardware for both Apple CarPlay and Android Auto. Where CarPlay is missing or ran out as a trial, activation is €220 on iDrive 7 and permanent. Android Auto is €200 on the same system (and we now add it to older NBT Evo cars with ID6 too, from €150).',
          'Late G20 LCI cars moved to iDrive 8, where the software version decides what can be done; those are checked and priced per car.',
        ],
      },
      {
        heading: 'Display and iDrive tweaks',
        paragraphs: [
          'Popular on iDrive 7: the Sport display layouts in the digital cluster, digital speed readout, the M-style start-up animation, and video playback for passengers while moving (passenger use only — the driver must always comply with road safety law). Most of these are coded in minutes.',
        ],
        bullets: [
          'Sport and M display layouts in the Live Cockpit cluster',
          'Video in motion for passengers (passenger use only)',
          'Start-up animation and menu tweaks',
          'Speed-limit display behaviour where the car has the camera',
        ],
      },
      {
        heading: 'Comfort and lighting',
        paragraphs: [
          'Auto-folding mirrors on lock, one-touch comfort closing of the windows and sunroof from the key, welcome light behaviour, ambient lighting options, and auto Start/Stop memory so the car remembers your last choice. Daytime running light and indicator behaviour can be adjusted within what the lighting module supports.',
        ],
      },
      {
        heading: 'What coding cannot do',
        paragraphs: [
          'Coding switches on functions the car already has the hardware for. It will not add a head-up display, a camera or a cluster the car was never built with — those are retrofits with parts and wiring. Options that depend on a server subscription are also outside what coding changes.',
          'Japanese-import G20s are a separate case: the radio band, language and navigation region need a proper conversion (€300 on iDrive 7, CarPlay included).',
        ],
      },
      {
        heading: 'Remote or in person',
        paragraphs: [
          'Nearly all of the above can be done remotely anywhere in Ireland with a Windows laptop and an ENET cable, or at your car around Dublin. Everything is reversible and shown working before you pay.',
        ],
      },
    ],
    related: [
      { slug: 'bmw-g20-coding', label: 'G20 coding & upgrades' },
      { slug: 'bmw-android-auto-activation', label: 'Android Auto activation' },
      { slug: 'bmw-coding-list', label: 'Full coding list' },
    ],
  },
  {
    slug: 'bmw-fullscreen-carplay-explained',
    title: 'BMW Fullscreen CarPlay Explained',
    metaTitle: 'BMW Fullscreen CarPlay Explained | Widescreen iDrive Guide',
    description:
      'Why CarPlay runs in a small window on many BMW widescreen displays, which NBT Evo cars can switch it to fullscreen, what iDrive 7 does differently, and how it is enabled.',
    date: '2026-10-04',
    readMinutes: 4,
    intro: [
      'A common complaint from owners of F-series cars with the 10.25" display: CarPlay works, but it sits in a box with a strip of BMW information beside it, and the map looks small on a big screen. On many of these cars the layout can be changed so CarPlay uses the full width. Here is how it works and where it applies.',
    ],
    sections: [
      {
        heading: 'Why CarPlay is boxed in',
        paragraphs: [
          'BMW’s widescreen displays are wide and short. On NBT Evo the default CarPlay view keeps a BMW panel at the side, so CarPlay is drawn in a near-square window. It was a design choice, not a hardware limit — the screen can show CarPlay edge to edge.',
        ],
      },
      {
        heading: 'Where fullscreen is possible',
        paragraphs: [
          'The fullscreen layout applies to NBT Evo cars with the 10.25" widescreen — typically F-series models from around 2016 to 2019 and the earliest G-series cars with iDrive 6. The software level matters: some ID5 cars need the ID6 update (€300, CarPlay activation included) before the layout can be enabled.',
          'Cars with the 6.5" or 8.8" screens already give most of the display to CarPlay, so there is little to gain. On iDrive 7 (MGU) CarPlay is already shown large and the split-screen options vary by software version.',
        ],
        bullets: [
          'NBT Evo with the 10.25" widescreen — yes, on supported software',
          'ID5 software may need the ID6 update first',
          'Smaller 6.5" / 8.8" screens — little benefit',
          'iDrive 7 — already large; checked per version',
        ],
      },
      {
        heading: 'How it is enabled',
        paragraphs: [
          'It is coding, done either together with CarPlay activation (from €150 on NBT Evo) or on a car that already has CarPlay. Remote over ENET anywhere in Ireland, or at your car around Dublin. We test it with your iPhone before the session ends.',
          'The only thing we need first is your full VIN (17 characters), which tells us the head unit, the screen and the software level — and whether fullscreen is possible on your build at all.',
        ],
      },
    ],
    related: [
      { slug: 'bmw-fullscreen-carplay', label: 'Fullscreen CarPlay service' },
      { slug: 'bmw-carplay-activation-ireland', label: 'CarPlay activation across Ireland' },
      { slug: 'bmw-id4-to-id6-upgrade', label: 'ID4 → ID6 update' },
    ],
  },
  {
    slug: 'does-my-bmw-support-apple-carplay',
    title: 'Does My BMW Support Apple CarPlay? Check by Year and iDrive',
    metaTitle: 'Does My BMW Support Apple CarPlay? Year & iDrive Guide (Ireland)',
    description:
      'A quick way to tell whether your BMW can have Apple CarPlay: the model year, the look of the iDrive screen and the head unit behind it — plus what activation costs in Ireland.',
    date: '2026-10-15',
    readMinutes: 5,
    intro: [
      'Short version: BMWs built from 2016 with iDrive 6 (NBT Evo) or anything newer can almost always have Apple CarPlay. On BMWs built before 2016 it cannot be activated. From 2016 the head unit decides, and two 2016 cars can have different ones — here is how to tell what you have in under a minute.',
    ],
    sections: [
      {
        heading: 'Quick answer by year',
        paragraphs: [
          'These are the typical cases; the VIN confirms yours.',
        ],
        bullets: [
          '2020 and newer (iDrive 7 / 8, the wide curved-style display): CarPlay is supported, often fitted from the factory. If it is missing or a trial expired, it can be activated — €220 on iDrive 7, iDrive 8 priced per car.',
          '2016–2019 with the tile home screen (iDrive 6 / NBT Evo): supported. Many cars shipped with it locked or on a subscription; activation by coding is €150, permanent, wireless on most ID6 builds.',
          '2016–2017 with a list-style menu on a newer car: possibly NBT Evo running old ID4/ID5 software — the update to ID6 (€300, CarPlay activation included) usually makes CarPlay possible.',
          'Built before 2016 (NBT with the iDrive 4/5 look, or CIC): CarPlay cannot be activated. Hidden features, navigation and diagnostics still apply.',
        ],
      },
      {
        heading: 'Check the screen, not the badge',
        paragraphs: [
          'Turn the car on and look at the home screen. A grid of large tiles you can rearrange is iDrive 6 (NBT Evo) — CarPlay territory. A wide screen with swipeable widgets and a curved look is iDrive 7 or 8 — also fine. A vertical list of menu items (CD/Multimedia, Radio, Telephone, Navigation…) on a dark background is the older NBT or CIC family — generally no CarPlay.',
          'Still not sure? Your full VIN (17 characters) tells us the exact head unit and software level in a minute, which is why every job we do starts there.',
        ],
      },
      {
        heading: 'Three situations that confuse people',
        paragraphs: [
          'A car that had CarPlay and lost it. BMW sold CarPlay as a yearly ConnectedDrive subscription on many 2017–2019 cars; when it lapsed, the icon disappeared. Activation brings it back permanently — no subscription.',
          'A Japanese import. The hardware is the same, but the car’s services were set up for Japan. A Japan → EU conversion (from €250) fixes the radio, language and navigation, and CarPlay is included where the head unit supports it.',
          'A base-spec car with the small screen. Early 1 Series and X1 with the basic radio have no head unit that can run CarPlay; the same car in higher spec does. Only the VIN tells which one yours is.',
        ],
      },
      {
        heading: 'Wired or wireless?',
        paragraphs: [
          'iDrive 7 and 8 cars are wireless by design. On NBT Evo, wireless works on most ID6 builds and needs the Wi-Fi antenna, which some cars have and some do not (fitting one is €30). Wired-only is the fallback where the build does not support wireless — we tell you which before booking.',
        ],
      },
      {
        heading: 'What it costs and how it is done',
        paragraphs: [
          'Activation is coding, not parts: €150 on NBT Evo, €220 on iDrive 7, one-off. It takes under an hour, remotely anywhere in Ireland with a Windows laptop and an ENET cable, or at your car around Dublin. We pair your iPhone and show CarPlay working before you pay.',
        ],
        bullets: [
          'NBT Evo (iDrive 6) — €150; on ID4/ID5 software the ID6 update with CarPlay included is €300',
          'iDrive 7 (MGU) — €220; Android Auto €200 on the same system (and now from €150 on NBT Evo ID6)',
          'iDrive 8 / 8.5 — checked and priced per car',
          'No subscription, reversible like all coding',
        ],
      },
    ],
    related: [
      { slug: 'bmw-carplay-activation-ireland', label: 'CarPlay activation across Ireland' },
      { slug: 'bmw-id4-to-id6-upgrade', label: 'ID4 → ID6 update' },
      { slug: 'blog/which-idrive-do-i-have', label: 'Which iDrive do I have?' },
    ],
  },
  {
    slug: "bimmercode-vs-bmw-coding-specialist-ireland",
    title: "BimmerCode or a BMW Coding Specialist? What Each Can Do",
    metaTitle: "BimmerCode in Ireland: App vs BMW Coding Specialist",
    description: "What an app such as BimmerCode can change on your BMW, where it stops (CarPlay, maps, Japanese imports, iDrive updates) and when to use a specialist.",
    date: "2026-11-16",
    readMinutes: 5,
    intro: [
      "If you have searched for BMW coding you have met BimmerCode: a phone app that, with an OBD adapter, lets an owner change settings on their own car. People ask us about it every week — sometimes before booking, sometimes after trying it. Here is a fair account of what an app does well, where it stops, and when it makes more sense to have a specialist do the job.",
    ],
    sections: [
      {
        heading: "What a coding app is",
        paragraphs: [
          "BimmerCode and similar apps run on your phone and talk to the car through an adapter in the OBD port. You pick a control unit, change an option from a list and write it back. There is no service to book and nobody to meet: it is a tool, and you are the one doing the coding. The app and a supported adapter are bought once; the developer’s site lists the current price and which adapters work with which cars.",
        ],
      },
      {
        heading: "What an app does well",
        paragraphs: [
          "For the simple comfort and display settings, an app is a reasonable way to go if you are comfortable doing it yourself.",
        ],
        bullets: [
          "Mirrors folding when the car is locked",
          "Start/Stop remembering its last setting",
          "Seatbelt and door chimes",
          "Welcome lights and daytime running light behaviour",
          "Digital speed and some display options in the cluster",
        ],
      },
      {
        heading: "Where an app stops",
        paragraphs: [
          "The jobs most people actually contact us about are not option changes at all, and an app is not built for them.",
        ],
        bullets: [
          "Apple CarPlay and Android Auto activation — these need an activation for your specific car, not a setting",
          "Navigation maps and map updates — new map data plus the code that makes the car accept it",
          "Japanese import conversion — region, language, radio band and navigation all have to change together",
          "iDrive software updates such as ID4 to ID6 — this is programming, done with BMW’s own tools",
          "Retrofits — after new hardware is fitted, the car’s build has to be changed so every module knows about it",
          "Diagnostics — reading a fault is easy; knowing what it means on your car is what ISTA is for",
        ],
      },
      {
        heading: "The risks of doing it yourself",
        paragraphs: [
          "The basic lists are hard to get wrong. Expert mode is different: it exposes raw values, and a wrong one — or a battery that sags while a module is being written — can leave a control unit that will not respond until it is recovered. Take a backup before every change, keep the car on a charger for anything longer than a quick toggle, and change one thing at a time so you know what did what.",
        ],
      },
      {
        heading: "Which one makes sense for you",
        paragraphs: [
          "If you want two or three comfort settings and you enjoy this kind of thing, an app will pay for itself. If you want CarPlay, a Japanese import sorted, an iDrive update or a retrofit — or you simply do not want the risk on your own car — that is specialist work.",
          "A visit or remote session with us starts at €80 and the small settings are combined into that one job, so it often costs less than people expect to have everything done at once, shown working, and reversible.",
        ],
      },
      {
        heading: "“BimmerCode near me” in Ireland",
        paragraphs: [
          "There is no BimmerCode shop to visit — it is an app. People who search for it near them are usually looking for someone to do the coding for them, and that part we can help with: we come to the car around Dublin and the surrounding counties, and code remotely over an ENET cable anywhere in Ireland.",
        ],
      },
    ],
    related: [
      { slug: "bmw-coding-dublin", label: "BMW coding in Dublin" },
      { slug: "apple-carplay-activation-dublin", label: "Apple CarPlay activation" },
      { slug: "bmw-coding-list", label: "The full BMW coding list" },
      { slug: "blog/what-is-bmw-coding", label: "What is BMW coding?" },
    ],
  },
];



export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
