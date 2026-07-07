// Coding cheat-sheet — a private technician reference surfaced in the bot via
// /cheat. Each entry lists, per platform, the module + parameter path + the
// value to set. Values are build/CAFD-specific: this is a memory-jogger, NOT a
// substitute for reading the actual FDL in the car. Always confirm before write.
//
// Seeded with widely-used entries; the owner grows it with /cheat add, stored
// in the cheat_notes table.

export type CheatLine = {
  platform: string; // e.g. "F-series FEM/BDC", "NBT Evo", "MGU (iDrive 7)"
  module: string; // ECU / CAFD, e.g. "FEM_BODY", "HU_NBT2"
  path: string; // parameter / function name
  value: string; // value to set
  note?: string;
};

export type CheatEntry = {
  key: string;
  title: string;
  keywords: string[]; // lowercase search terms
  lines: CheatLine[];
  note?: string;
};

export const CHEAT_DISCLAIMER =
  '⚠️ Values are build/CAFD-specific — read the live FDL first, never guess. Reference only.';

export const CHEAT_SHEET: CheatEntry[] = [
  {
    key: 'carplay',
    title: 'Apple CarPlay activation',
    keywords: ['carplay', 'apple', 'car play', 'smartphone'],
    lines: [
      {
        platform: 'NBT Evo (ID5/ID6)',
        module: 'HU_NBT2',
        path: 'FDL: APPLE_CARPLAY / SMARTPHONE_INTEGRATION',
        value: 'aktiv / ON',
        note: 'Also enable WIFI-related params; full-screen needs the "APPS" FSC. Some early ID5 need a SW update first.',
      },
      {
        platform: 'MGU (iDrive 7/8)',
        module: 'HU_MGU',
        path: 'CARPLAY / ANDROID_AUTO enable',
        value: 'aktiv',
        note: 'CarPlay usually present but trial-limited — make permanent. Wireless is standard.',
      },
    ],
    note: 'Confirm head unit from VIN first. CIC / plain NBT do NOT support native CarPlay.',
  },
  {
    key: 'vim',
    title: 'Video in Motion (VIM)',
    keywords: ['vim', 'video', 'motion', 'video in motion', 'tv'],
    lines: [
      {
        platform: 'NBT / NBT Evo',
        module: 'HU_NBT / HU_NBT2',
        path: 'FDL: VIM / speed-lock parameter',
        value: 'set speed lock to 0 / codierindex',
        note: 'Enables playback + full menu/nav input while moving.',
      },
      {
        platform: 'MGU (iDrive 7/8)',
        module: 'HU_MGU',
        path: 'Video-in-motion function',
        value: 'aktiv',
        note: 'Current-gen tooling required.',
      },
    ],
    note: 'Passenger/rear feature only — driver use is illegal. Fully reversible.',
  },
  {
    key: 'digital-speed',
    title: 'Digital speed in cluster',
    keywords: ['digital speed', 'speed', 'kombi', 'cluster', 'mph'],
    lines: [
      {
        platform: 'F-series (6WA/6WB KOMBI)',
        module: 'KOMBI',
        path: 'FDL: digital speed / DSC-style readout',
        value: 'aktiv',
        note: 'On 6WB it lives in the sport/M display layout.',
      },
      {
        platform: 'G-series',
        module: 'KOMBI / BDC',
        path: 'Digital speed display',
        value: 'aktiv',
      },
    ],
  },
  {
    key: 'sport-displays',
    title: 'Sport / M displays + needle sweep',
    keywords: ['sport', 'm view', 'gauges', 'needle', 'sweep', 'boost', 'oil temp'],
    lines: [
      {
        platform: 'F-series',
        module: 'KOMBI / HU',
        path: 'FDL: sport displays (power/torque, oil temp), START_STOP needle sweep',
        value: 'aktiv',
        note: 'M View pages appear under the trip/sport menu.',
      },
    ],
  },
  {
    key: 'folding-mirrors',
    title: 'Auto-folding mirrors on lock',
    keywords: ['mirror', 'mirrors', 'fold', 'folding', 'anklappen'],
    lines: [
      {
        platform: 'F-series FEM/BDC',
        module: 'FEM_BODY / BDC_BODY',
        path: 'FDL: SPIEGEL_ANKLAPPEN + EF_SPIEGEL',
        value: 'aktiv',
        note: 'Fold on lock / unfold on unlock. Some need the retract enabled in the door modules too.',
      },
      {
        platform: 'F-series FRM (pre-FEM)',
        module: 'FRM',
        path: 'Mirror fold parameter',
        value: 'aktiv',
      },
    ],
  },
  {
    key: 'seatbelt-gong',
    title: 'Seatbelt chime / gong off',
    keywords: ['seatbelt', 'belt', 'gong', 'chime', 'sbr', 'beep'],
    lines: [
      {
        platform: 'F-series FEM/BDC',
        module: 'FEM_BODY / BDC_BODY',
        path: 'FDL: BELT_WARNING_DRIVER / _PASSENGER',
        value: 'nicht_aktiv',
      },
      {
        platform: 'Older (KOMBI)',
        module: 'KOMBI',
        path: 'SBR / belt warning',
        value: 'nicht_aktiv',
      },
    ],
    note: 'Customer request only — safety feature. Reversible.',
  },
  {
    key: 'legal-disclaimer',
    title: 'Legal disclaimer screen off at start',
    keywords: ['legal', 'disclaimer', 'warning', 'startup', 'idrive warning', 'bestätigung'],
    lines: [
      {
        platform: 'NBT / NBT Evo',
        module: 'HU_NBT / HU_NBT2',
        path: 'FDL: legal notice / confirmation screen',
        value: 'nicht_aktiv / kein_hinweis',
      },
      {
        platform: 'MGU',
        module: 'HU_MGU',
        path: 'Startup disclaimer',
        value: 'off',
      },
    ],
  },
  {
    key: 'drl',
    title: 'Daytime running lights (DRL/TFL)',
    keywords: ['drl', 'tfl', 'daytime', 'running lights', 'angel eyes brightness'],
    lines: [
      {
        platform: 'F-series FEM/BDC',
        module: 'FEM_BODY / BDC_BODY',
        path: 'FDL: TFL (enable), TFL_MODE (brightness)',
        value: 'aktiv / brightness value',
        note: 'Separate params control front vs indicator DRL behaviour.',
      },
      {
        platform: 'F-series FRM',
        module: 'FRM',
        path: 'TFL / angel-eye brightness',
        value: 'aktiv',
      },
    ],
  },
  {
    key: 'welcome-light',
    title: 'Welcome / Coming-Home lighting',
    keywords: ['welcome', 'coming home', 'follow me home', 'carpet light', 'puddle'],
    lines: [
      {
        platform: 'F-series FEM/BDC',
        module: 'FEM_BODY / BDC_BODY',
        path: 'FDL: WELCOME_LIGHT, KOMFORT lighting, follow-me-home timing',
        value: 'aktiv / timing value',
      },
    ],
  },
  {
    key: 'comfort-access',
    title: 'Comfort Access tweaks',
    keywords: ['comfort access', 'keyless', 'kessy', 'wave', 'tailgate kick'],
    lines: [
      {
        platform: 'F-series FEM/BDC',
        module: 'FEM_BODY / BDC_BODY',
        path: 'FDL: Comfort Access params, boot open/close behaviour',
        value: 'aktiv',
        note: 'Hardware antennas must be present for full CA.',
      },
    ],
  },
  {
    key: 'one-touch-windows',
    title: 'One-touch windows from key/door',
    keywords: ['window', 'windows', 'one touch', 'global close', 'komfortöffnung'],
    lines: [
      {
        platform: 'F-series FEM/BDC',
        module: 'FEM_BODY / BDC_BODY',
        path: 'FDL: comfort open/close from key + door lock',
        value: 'aktiv',
      },
    ],
  },
  {
    key: 'startstop-memory',
    title: 'Auto Start/Stop last-state memory',
    keywords: ['start stop', 'start/stop', 'msa', 'auto start stop', 'memory'],
    lines: [
      {
        platform: 'F-series',
        module: 'FEM_BODY / KOMBI (per model)',
        path: 'MSA default / power-on state',
        value: 'last state / default off',
        note: 'Remembers the button state across restarts (stays off).',
      },
    ],
  },
  {
    key: 'japan-eu',
    title: 'Japan → EU conversion',
    keywords: ['japan', 'jdm', 'import', 'region', 'eu conversion', 'bands', 'fsc', 'etc mirror'],
    lines: [
      {
        platform: 'NBT / NBT Evo / MGU',
        module: 'HU + VO coding',
        path: 'Region → Europe, radio bands, language; nav FSC + EU maps',
        value: 'ECE / Europe',
        note: 'Handle ETC mirror module + TCB. Run full ISTA scan after.',
      },
    ],
    note: 'FM band JP 76–95MHz → EU. Confirm system supports EU maps before quoting.',
  },
];

export function findCheat(query: string): CheatEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return CHEAT_SHEET.filter(
    (e) =>
      e.key.includes(q) ||
      e.title.toLowerCase().includes(q) ||
      e.keywords.some((k) => k.includes(q) || q.includes(k)),
  );
}

/** Render one entry as Telegram HTML. `esc` escapes user-facing text. */
export function formatCheat(e: CheatEntry, esc: (s: string) => string): string {
  const lines = [`🔧 <b>${esc(e.title)}</b>`];
  for (const l of e.lines) {
    lines.push('');
    lines.push(`<b>${esc(l.platform)}</b>`);
    lines.push(`  📦 <code>${esc(l.module)}</code>`);
    lines.push(`  ↳ ${esc(l.path)}`);
    lines.push(`  = <b>${esc(l.value)}</b>`);
    if (l.note) lines.push(`  <i>${esc(l.note)}</i>`);
  }
  if (e.note) {
    lines.push('');
    lines.push(`ℹ️ <i>${esc(e.note)}</i>`);
  }
  return lines.join('\n');
}
