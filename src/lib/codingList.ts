// A browsable reference of features we can typically code on BMW F- and
// G-series cars. What's possible on a given car depends on its model, year,
// head unit (NBT / NBT Evo / MGU) and installed hardware — so this is a menu
// of ideas, confirmed per car from the VIN before any work.

export type CodingCategory = {
  key: string;
  title: string;
  note?: string;
  items: string[];
};

export const CODING_LIST: CodingCategory[] = [
  {
    key: 'connectivity',
    title: 'Smartphone & connectivity',
    items: [
      'Apple CarPlay — full activation (wired / wireless where supported)',
      'Android Auto activation (iDrive 7 / MGU where supported)',
      'CarPlay screen mirroring and full-screen layout',
      'BMW Apps, Connected Drive & Remote Services enable',
      'Bluetooth audio & second phone pairing',
      'Wi-Fi hotspot menu enable (where equipped)',
    ],
  },
  {
    key: 'media',
    title: 'Media & video',
    items: [
      'Video in Motion — watch video while driving',
      'Full menu & navigation input while moving',
      'USB / media playback tweaks',
      'DVD / TV tuner activation (where equipped)',
      'Rear-seat entertainment coding (where equipped)',
    ],
  },
  {
    key: 'displays',
    title: 'iDrive & digital displays',
    items: [
      'Sport / M digital instrument displays',
      'Digital speed readout in the cluster',
      'M View / sport gauges (boost, oil temp, power/torque)',
      'Cluster start-up (needle sweep) animation',
      'Boot / start-up logo and welcome screen tweaks',
      'Efficient / Sport / Comfort display styling',
    ],
  },
  {
    key: 'ambient',
    title: 'Ambient & interior lighting',
    items: [
      'Ambient / contour lighting enable and colour options',
      'Welcome / Coming Home light animation',
      'Footwell and door-handle lighting',
      'Reading light and interior light behaviour',
      'Door projector / puddle light coding (where fitted)',
    ],
  },
  {
    key: 'exterior',
    title: 'Exterior lighting',
    items: [
      'Daytime running lights (DRL) brightness & behaviour',
      'Welcome lights / follow-me-home timing',
      'Indicator (one-touch) blink count',
      'Cornering / turning light behaviour',
      'Rear fog and brake-light coding tweaks',
      'Angel eyes / halo behaviour (where equipped)',
    ],
  },
  {
    key: 'comfort',
    title: 'Comfort & convenience',
    items: [
      'Comfort Access (keyless) tweaks',
      'Auto-folding mirrors on lock / unlock',
      'One-touch window open/close from key & door',
      'Auto lock at speed and auto unlock on park',
      'Climate / AC last-state memory',
      'Windscreen wiper and washer behaviour',
      'Seat heating memory and levels',
    ],
  },
  {
    key: 'assist',
    title: 'Driving & assistance',
    items: [
      'Cruise control retrofit / activation',
      'Speed limit display & traffic sign recognition',
      'Start/Stop last-state memory (stays off)',
      'Auto Hold and parking-brake behaviour',
      'Reversing camera / PDC display tweaks',
      'Lane / collision warning coding (where equipped)',
    ],
  },
  {
    key: 'warnings',
    title: 'Warnings, chimes & reminders',
    items: [
      'Seatbelt chime / gong disable',
      'Legal disclaimer screen off at start-up',
      'Service / inspection reminder reset & coding',
      'Fuel and warning chime behaviour',
      'Door-open and key-reminder tweaks',
    ],
  },
  {
    key: 'performance',
    title: 'Performance & diagnostics',
    items: [
      'M Laptimer / performance pages (where supported)',
      'Digital boost & oil-temperature gauges',
      'Full ISTA diagnostics & fault-code read/clear',
      'Written health-check summary',
      'Stage 1 / Stage 2 ECU remap (in person, per engine)',
    ],
  },
  {
    key: 'conversion',
    title: 'Conversions & region',
    items: [
      'Japan → EU conversion (region, bands, language)',
      'Navigation FSC generation & European map install',
      'Language and units (km/h, °C) set-up',
      'ETC mirror & TCB handling on imports',
      'Hidden menus & bespoke coding to your spec',
    ],
  },
];

export const CODING_META = {
  title: 'BMW Coding List | Codeable Features & Hidden Functions — Dublin & Ireland',
  description:
    'A full list of BMW coding options and hidden features we can enable on F- and G-series cars — CarPlay, Android Auto, ambient lighting, sport displays, comfort features, cruise control and more. In Dublin and across Ireland.',
};
