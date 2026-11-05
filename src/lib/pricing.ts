// Single source of truth for the published price list. The calculator, the
// AI prompts and the pricing guide must never drift apart — change it here.

export type HeadUnit = 'nbt-evo' | 'mgu' | 'mgu-id8' | 'mgu-id85' | 'unknown';

export const HEAD_UNITS: { id: HeadUnit; label: string; hint: string }[] = [
  // Owner, 2 Nov 2026: NBT Evo 2016–2019, MGU 2020 onwards; no CarPlay before 2016.
  { id: 'nbt-evo', label: 'NBT Evo — iDrive 5 / 6', hint: 'Roughly 2016–2019 cars' },
  { id: 'mgu', label: 'MGU — iDrive 7', hint: 'Roughly 2020 onwards' },
  { id: 'mgu-id8', label: 'MGU — iDrive 8', hint: 'Roughly 2021 onwards — priced per car' },
  { id: 'mgu-id85', label: 'MGU — iDrive 8.5', hint: 'Newest cars — prices start from' },
  { id: 'unknown', label: "I'm not sure", hint: 'We confirm it from your VIN' },
];

export type PriceItem = {
  id: string;
  label: string;
  note?: string;
  /** Price per head unit. null = not available on that system. */
  price: Record<Exclude<HeadUnit, 'unknown'>, number | null>;
  /** Shown as "from €X" rather than a firm price. */
  from?: boolean;
  /** "From" on these head units only (the price is firm on the others). */
  fromOn?: Exclude<HeadUnit, 'unknown'>[];
};

export const PRICE_ITEMS: PriceItem[] = [
  {
    id: 'carplay',
    label: 'Apple CarPlay activation',
    note: 'One-off, no subscription',
    price: { 'nbt-evo': 150, mgu: 220, 'mgu-id8': null, 'mgu-id85': 400 },
  },
  {
    // €300 with CarPlay in it (owner, 1 Nov 2026) — was a €50 add-on.
    id: 'id6',
    label: 'iDrive ID4/ID5 → ID6 update',
    note: 'NBT Evo — Apple CarPlay activation included · +€100 with the Japan → EU conversion',
    price: { 'nbt-evo': 300, mgu: null, 'mgu-id8': null, 'mgu-id85': null },
  },
  {
    id: 'android-auto',
    label: 'Android Auto activation',
    // NBT Evo is new (owner, 30 Oct 2026): native Android Auto on ID6 for €250,
    // with the CarPlay activation it runs on and the Wi-Fi antenna in it (1 Nov).
    note: 'New on NBT Evo — beta, at your own risk, needs ID6 software; CarPlay activation and the Wi-Fi antenna (if needed) included · iDrive 7 · from €400 on iDrive 8.5. iDrive 8 is quoted per car.',
    price: { 'nbt-evo': 250, mgu: 200, 'mgu-id8': null, 'mgu-id85': 400 },
  },
  {
    id: 'japan',
    label: 'Japan → EU conversion',
    note:
      'Region, radio bands, nav FSC, EU maps — CarPlay activation is included at no extra cost. ' +
      'On iDrive 7 everything that can be converted is included. ' +
      'On iDrive 8.5 this covers the language and radio change only.',
    // MGU €300 with everything in it (owner, 1 Nov 2026) — was "from €300".
    price: { 'nbt-evo': 250, mgu: 300, 'mgu-id8': null, 'mgu-id85': 200 },
  },
  {
    // Owner, 1 Nov 2026: not BMW's own apps; he sends the list.
    id: 'apps',
    label: 'Extra apps on iDrive 7',
    note: 'Not BMW’s own apps — Alex sends the list · +€100 with the Japan → EU conversion',
    price: { 'nbt-evo': null, mgu: 200, 'mgu-id8': null, 'mgu-id85': null },
  },
  {
    id: 'cluster-nav',
    label: 'CarPlay / Android Auto navigation in the instrument cluster',
    note: 'iDrive 7 · from €80 together with the Japan → EU conversion or the apps',
    price: { 'nbt-evo': null, mgu: 150, 'mgu-id8': null, 'mgu-id85': null },
  },
  {
    // Owner, 5 Nov 2026: from the key €250, from the app €300.
    id: 'remote-start',
    label: 'Remote engine start',
    note: 'From the key from €250 · from the app from €300 — where the car supports it, confirmed from your VIN',
    price: { 'nbt-evo': 250, mgu: 250, 'mgu-id8': null, 'mgu-id85': null },
    from: true,
  },
  {
    id: 'navigation',
    label: 'Navigation activation',
    note: 'iDrive 8.5 — the full nav retrofit, licences included',
    price: { 'nbt-evo': null, mgu: null, 'mgu-id8': null, 'mgu-id85': 1500 },
  },
  {
    id: 'vim',
    label: 'Video in Motion',
    note: 'Passenger media and full iDrive menus on the move — passenger use only',
    price: { 'nbt-evo': 60, mgu: 60, 'mgu-id8': null, 'mgu-id85': null },
    from: true,
  },
  {
    id: 'hidden',
    label: 'Hidden features session',
    note: 'Digital speed, sport displays, welcome lights, mirror & window comfort…',
    price: { 'nbt-evo': 50, mgu: 50, 'mgu-id8': null, 'mgu-id85': null },
    from: true,
  },
  {
    id: 'comfort',
    label: 'Single comfort tweak',
    note: 'One specific setting',
    price: { 'nbt-evo': 40, mgu: 40, 'mgu-id8': null, 'mgu-id85': null },
    from: true,
  },
  {
    id: 'diagnostics',
    label: 'Full ISTA diagnostics',
    note: 'Dealer-level scan with written summary',
    price: { 'nbt-evo': 80, mgu: 80, 'mgu-id8': null, 'mgu-id85': 80 },
    from: true,
  },
];

export const ADD_ONS: { id: string; label: string; note?: string; price: number }[] = [
  { id: 'wifi-antenna', label: 'Wi-Fi antenna fitted', note: 'Needed for wireless CarPlay on some builds', price: 30 },
];

export const CALL_OUT = { base: 20, perKm: 1.25 };

/**
 * The smallest job, visit or remote session (owner's decision, 21 Oct 2026):
 * single settings keep their own prices but are combined up to at least this.
 * The call-out fee comes on top. "BMW coding from €80" on the site means this.
 */
export const MIN_JOB = 80;

/**
 * Systems where nothing is a fixed figure. On iDrive 8.5 the work depends on
 * the software version in front of us, so every number is a starting point and
 * must be shown as one.
 */
export const FROM_UNITS: HeadUnit[] = ['mgu-id85'];
export const isFromUnit = (unit: HeadUnit) => FROM_UNITS.includes(unit);

const onNbtEvo = (unit: HeadUnit) => unit === 'nbt-evo' || unit === 'unknown';

/** CarPlay is already in the Japan conversion, the ID6 update and, on NBT
 *  Evo, Android Auto (which runs on it) — never charge for it twice. */
export function isBundledOut(selected: string[], itemId: string, unit: HeadUnit): boolean {
  if (itemId !== 'carplay') return false;
  if (selected.includes('japan')) return true;
  return onNbtEvo(unit) && (selected.includes('id6') || selected.includes('android-auto'));
}

/** Android Auto on NBT Evo includes the Wi-Fi antenna when the car needs one. */
export const antennaInAndroidAuto = (selected: string[], unit: HeadUnit) =>
  selected.includes('android-auto') && onNbtEvo(unit);

/**
 * What an item costs next to the rest of the job (owner, 1 Nov 2026): the ID6
 * update is +€100 on top of the Japan conversion (€350 together); on iDrive 7
 * the apps are +€100 with the conversion, and the cluster navigation is from
 * €80 with the conversion or the apps (€150 on its own).
 */
export function comboPrice(
  selected: string[],
  itemId: string,
  unit: HeadUnit,
): { amount: number; with: string; from?: boolean } | undefined {
  const japan = selected.includes('japan');
  if (itemId === 'id6' && japan && onNbtEvo(unit)) return { amount: 100, with: 'with the Japan conversion' };
  if (unit !== 'mgu') return undefined;
  if (itemId === 'apps' && japan) return { amount: 100, with: 'with the Japan conversion' };
  if (itemId === 'cluster-nav' && (japan || selected.includes('apps')))
    return { amount: 80, with: japan ? 'with the Japan conversion' : 'with the apps', from: true };
  return undefined;
}
