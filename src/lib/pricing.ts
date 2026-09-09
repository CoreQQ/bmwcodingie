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
    price: { 'nbt-evo': 170, mgu: 200 },
  },
  {
    id: 'android-auto',
    label: 'Android Auto activation',
    note: 'iDrive 7 / 8 (MGU) only. Just €70 when added to a Japan → EU conversion.',
    price: { 'nbt-evo': null, mgu: 200 },
  },
  {
    id: 'japan',
    label: 'Japan → EU conversion',
    note: 'Region, radio bands, nav FSC, EU maps — CarPlay included in the price.',
    price: { 'nbt-evo': 280, mgu: 330 },
  },
  {
    id: 'idrive-upgrade',
    label: 'iDrive 4 → iDrive 6 upgrade',
    note: 'Together with a Japan → EU conversion it is €250 plus €100 for the flash.',
    price: { 'nbt-evo': 250, mgu: 250 },
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
];

export const CALL_OUT = { base: 30, perKm: 1.5 };

/** Flashing surcharge when the iDrive upgrade rides along with a conversion. */
export const JAPAN_FLASH = 100;
/** Android Auto costs this much when added to a Japan → EU conversion (MGU). */
export const JAPAN_ANDROID_AUTO = 70;

/** The Japan conversion price already contains CarPlay — never charge twice. */
export function isBundledOut(selected: string[], itemId: string, _unit: HeadUnit): boolean {
  return itemId === 'carplay' && selected.includes('japan');
}

/**
 * Price of an item once the rest of the basket is taken into account, or null
 * when nothing changes. Bundles are cheaper because the car is already open and
 * flashed — quoting the standalone price next to a conversion would be wrong.
 */
export function bundledPrice(selected: string[], itemId: string, unit: HeadUnit): number | null {
  if (!selected.includes('japan')) return null;
  if (itemId === 'android-auto' && unit === 'mgu') return JAPAN_ANDROID_AUTO;
  if (itemId === 'idrive-upgrade') return 250 + JAPAN_FLASH;
  return null;
}
