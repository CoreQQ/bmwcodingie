// Single source of truth for the published price list. The calculator, the
// AI prompts and the pricing guide must never drift apart — change it here.

export type HeadUnit = 'nbt-evo' | 'mgu' | 'unknown';

export const HEAD_UNITS: { id: HeadUnit; label: string; hint: string }[] = [
  { id: 'nbt-evo', label: 'NBT Evo — iDrive 5 / 6', hint: 'Roughly 2013–2018 cars' },
  { id: 'mgu', label: 'MGU — iDrive 7 / 8', hint: 'Roughly 2018 onwards' },
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
    price: { 'nbt-evo': 150, mgu: 220 },
  },
  {
    id: 'android-auto',
    label: 'Android Auto activation',
    note: 'iDrive 7 / 8 only',
    price: { 'nbt-evo': null, mgu: 200 },
  },
  {
    id: 'japan',
    label: 'Japan → EU conversion',
    note: 'Region, radio bands, nav FSC, EU maps. With CarPlay added: €250 on NBT Evo, €300 on MGU.',
    price: { 'nbt-evo': 250, mgu: 280 },
  },
  {
    id: 'vim',
    label: 'Video in Motion',
    note: 'Full menus while driving',
    price: { 'nbt-evo': 60, mgu: 60 },
    from: true,
  },
  {
    id: 'hidden',
    label: 'Hidden features session',
    note: 'Digital speed, sport displays, welcome lights, mirror & window comfort…',
    price: { 'nbt-evo': 50, mgu: 50 },
    from: true,
  },
  {
    id: 'comfort',
    label: 'Single comfort tweak',
    note: 'One specific setting',
    price: { 'nbt-evo': 40, mgu: 40 },
    from: true,
  },
  {
    id: 'diagnostics',
    label: 'Full ISTA diagnostics',
    note: 'Dealer-level scan with written summary',
    price: { 'nbt-evo': 80, mgu: 80 },
    from: true,
  },
];

export const ADD_ONS: { id: string; label: string; note?: string; price: number }[] = [
  { id: 'wifi-antenna', label: 'Wi-Fi antenna fitted', note: 'Needed for wireless CarPlay on some builds', price: 30 },
  { id: 'idrive-upgrade', label: 'iDrive 4 → iDrive 6 upgrade', price: 50 },
];

export const CALL_OUT = { base: 20, perKm: 1.25 };

/** Japan on MGU bundles CarPlay — never charge for both. */
export function isBundledOut(selected: string[], itemId: string, unit: HeadUnit): boolean {
  return unit === 'mgu' && itemId === 'carplay' && selected.includes('japan');
}
