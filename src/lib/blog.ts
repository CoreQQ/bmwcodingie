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
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
