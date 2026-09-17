// Single source of truth for the published price list. The calculator, the
// AI prompts and the pricing guide must never drift apart — change it here.

export type HeadUnit = 'nbt-evo' | 'mgu' | 'mgu-id8' | 'mgu-id85' | 'unknown';

export const HEAD_UNITS: { id: HeadUnit; label: string; hint: string }[] = [
  { id: 'nbt-evo', label: 'NBT Evo — iDrive 5 / 6', hint: 'Roughly 2013–2018 cars' },
  { id: 'mgu', label: 'MGU — iDrive 7', hint: 'Roughly 2018–2021' },
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
};

export const PRICE_ITEMS: PriceItem[] = [
  {
    id: 'carplay',
    label: 'Apple CarPlay activation',
    note: 'One-off, no subscription',
    price: { 'nbt-evo': 150, mgu: 220, 'mgu-id8': null, 'mgu-id85': 400 },
  },
  {
    id: 'android-auto',
    label: 'Android Auto activation',
    note: 'MGU only — iDrive 7, or from €400 on iDrive 8.5. iDrive 8 is quoted per car.',
    price: { 'nbt-evo': null, mgu: 200, 'mgu-id8': null, 'mgu-id85': 400 },
  },
  {
    id: 'japan',
    label: 'Japan → EU conversion',
    note:
      'Region, radio bands, nav FSC, EU maps — CarPlay activation is included at no extra cost. ' +
      'On iDrive 8.5 this covers the language and radio change only.',
    price: { 'nbt-evo': 250, mgu: 280, 'mgu-id8': null, 'mgu-id85': 200 },
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
    note: 'Full menus while driving',
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
  { id: 'idrive-upgrade', label: 'iDrive 4 → iDrive 6 upgrade', price: 50 },
];

export const CALL_OUT = { base: 20, perKm: 1.25 };

/**
 * Systems where nothing is a fixed figure. On iDrive 8.5 the work depends on
 * the software version in front of us, so every number is a starting point and
 * must be shown as one.
 */
export const FROM_UNITS: HeadUnit[] = ['mgu-id85'];
export const isFromUnit = (unit: HeadUnit) => FROM_UNITS.includes(unit);

/** The conversion price already contains CarPlay — never charge for both. */
export function isBundledOut(selected: string[], itemId: string, _unit: HeadUnit): boolean {
  return itemId === 'carplay' && selected.includes('japan');
}
