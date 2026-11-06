import {
  ADD_ONS,
  CALL_OUT,
  MIN_JOB,
  PRICE_ITEMS,
  antennaInAndroidAuto,
  comboPrice,
  isBundledOut,
  type HeadUnit,
  type PriceItem,
} from './pricing';
import { BF, BF_ON, BF_SOON, NOV11, NOV11_ON, NOV11_SOON, XMAS, XMAS_ON } from './season';

// Every coding price in one Telegram message (owner, 6 Nov: "all the quotes in
// one place"). Built from pricing.ts — the list the calculator and the agents
// quote from — so it can never disagree with the site. The combinations come
// from the same rules the calculator applies (isBundledOut, comboPrice).

type Unit = Exclude<HeadUnit, 'unknown'>;

const SECTIONS: { unit: Unit; title: string }[] = [
  { unit: 'nbt-evo', title: 'NBT Evo · iDrive 5/6 (≈2016–2019)' },
  { unit: 'mgu', title: 'MGU · iDrive 7 (≈2020+)' },
  { unit: 'mgu-id85', title: 'iDrive 8.5 — the site shows these as “from”; you agree the price' },
];

const eur = (n: number) => `€${n}`;

/** What else the price contains on this system, from the calculator's own rules. */
function inclusions(item: PriceItem, unit: Unit): string[] {
  const out: string[] = [];
  // On 8.5 every figure is a starting point and the Japan job is language and
  // radio only, so nothing is promised as included there.
  if (unit === 'mgu-id85') return out;
  if (item.id !== 'carplay' && isBundledOut([item.id], 'carplay', unit)) out.push('CarPlay included');
  if (antennaInAndroidAuto([item.id], unit)) out.push('Wi-Fi antenna included');
  if (item.id === 'android-auto' && unit === 'nbt-evo') out.push('beta');
  if (item.id === 'remote-start') out.push('from the key · app from €300');
  if (item.id === 'apps') out.push('not BMW’s own');
  return out;
}

function line(item: PriceItem, unit: Unit): string | null {
  const price = item.price[unit];
  if (price === null) return null;
  const from = item.from || item.fromOn?.includes(unit) || unit === 'mgu-id85';
  const extra = inclusions(item, unit);
  return `• ${item.label} — <b>${from ? 'from ' : ''}${eur(price)}</b>${extra.length ? ` · ${extra.join(' · ')}` : ''}`;
}

function offerLines(): string[] {
  const out: string[] = [];
  if (NOV11_ON) out.push(`🛍️ <b>11.11 — today:</b> −${NOV11.pct}% on the work for bookings made today, work done by ${NOV11.doneBy}`);
  else if (NOV11_SOON) out.push(`🛍️ 11.11 — coming: −${NOV11.pct}% on the work for bookings made on 11 Nov, work done by ${NOV11.doneBy}`);
  if (BF_ON) out.push(`🏷️ <b>Black Friday — now:</b> −${BF.pct}% on jobs done ${BF.dates} · Wi-Fi antenna included with CarPlay`);
  else if (BF_SOON) out.push(`🏷️ Black Friday — coming: −${BF.pct}% on jobs done ${BF.dates} · Wi-Fi antenna included with CarPlay`);
  if (XMAS_ON) out.push(`🎄 <b>Christmas — now:</b> −${XMAS.pct}% on the work until ${XMAS.until}`);
  if (out.length && (NOV11_ON || BF_ON || XMAS_ON)) out.push('<i>Prices above are the regular ones; the discount is on the work, never the call-out.</i>');
  return out;
}

export function priceListText(): string {
  const lines: string[] = ['💶 <b>Coding prices — all in one place</b>', '<i>The same list the site calculator and the agent quote from.</i>'];

  for (const { unit, title } of SECTIONS) {
    const items = PRICE_ITEMS.map((i) => line(i, unit)).filter(Boolean) as string[];
    if (items.length) lines.push('', `<b>${title}</b>`, ...items);
  }
  lines.push('', '<b>iDrive 8 / 9</b> — per car, you agree the price (the agent never quotes one)');

  const japanNbt = PRICE_ITEMS.find((i) => i.id === 'japan')?.price['nbt-evo'] ?? 0;
  const japanMgu = PRICE_ITEMS.find((i) => i.id === 'japan')?.price.mgu ?? 0;
  const id6WithJapan = comboPrice(['japan', 'id6'], 'id6', 'nbt-evo')?.amount;
  const appsWithJapan = comboPrice(['japan', 'apps'], 'apps', 'mgu')?.amount;
  const navWithPackage = comboPrice(['japan', 'cluster-nav'], 'cluster-nav', 'mgu')?.amount;
  const navAlone = PRICE_ITEMS.find((i) => i.id === 'cluster-nav')?.price.mgu;
  lines.push('', '<b>Combinations</b>');
  if (id6WithJapan !== undefined) lines.push(`• Japan → EU + ID6 update (NBT Evo) — <b>${eur(japanNbt + id6WithJapan)}</b> (ID6 +${eur(id6WithJapan)})`);
  if (appsWithJapan !== undefined) lines.push(`• Japan → EU + apps (iDrive 7) — <b>${eur(japanMgu + appsWithJapan)}</b> (apps +${eur(appsWithJapan)})`);
  if (navWithPackage !== undefined) lines.push(`• Cluster navigation with Japan or the apps (iDrive 7) — <b>from ${eur(navWithPackage)}</b>${navAlone ? ` (${eur(navAlone)} alone)` : ''}`);
  lines.push('• ID4/ID5 + Android Auto together — <i>not set yet: you confirm</i>');

  lines.push('', '<b>Extras & rules</b>');
  for (const a of ADD_ONS) lines.push(`• ${a.label} — +${eur(a.price)}`);
  lines.push(
    `• Minimum job — <b>${eur(MIN_JOB)}</b> per visit or remote session (small settings combine up to it)`,
    `• Call-out — ${eur(CALL_OUT.base)} around Dublin, then €${CALL_OUT.perKm.toFixed(2)}/km from west Dublin · remote: none`,
    '• Not offered: E-series · headlight faults (TMS coding is fine) · CarPlay on cars before 2016',
  );

  const offers = offerLines();
  if (offers.length) lines.push('', '<b>Offers</b>', ...offers);
  return lines.join('\n');
}

export const PRICE_LIST_KEYBOARD = {
  inline_keyboard: [[{ text: '🧮 Open the price calculator', url: 'https://www.bmwcoding.ie/bmw-coding-price-calculator' }]],
};
