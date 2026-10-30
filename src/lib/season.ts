// Seasonal offers: Black Friday → Cyber Monday, then Christmas.
//
// NEXT_PUBLIC_SEASON ('blackfriday' | 'xmas' | '') is fixed at build time —
// next.config.js derives it from today's Irish date and season-dates.json,
// and a Vercel env var overrides it. Being inlined, the server render and
// the browser always agree (no date checks in a first render — that is how
// hydration breaks). The offer changes when the site is rebuilt on the day.

export type Season = 'blackfriday' | 'xmas' | '';
const RAW = process.env.NEXT_PUBLIC_SEASON;
export const SEASON: Season = RAW === 'blackfriday' || RAW === 'xmas' ? RAW : '';

/** A discount offer is running (either season). */
export const OFFER_ON = SEASON !== '';
/** Christmas look: snow, Santa hat, garland, glow. */
export const XMAS_ON = SEASON === 'xmas';
/** Black Friday look and its CarPlay deal (Wi-Fi antenna included). */
export const BF_ON = SEASON === 'blackfriday';

// localStorage keys of the floating notice (Announcement) — here, not in the
// client component, because the layout's pre-paint script needs the strings.
// Bump a key when the wording changes so a dismissal never hides a newer one.
export const NOTICE_KEY = 'bmw-notice-mobile-live';
export const XMAS_NOTICE_KEY = 'bmw-notice-xmas-2026';
export const BF_NOTICE_KEY = 'bmw-notice-blackfriday-2026';

export const XMAS = {
  pct: 10,
  /** Last day of the offer, as shown to customers. */
  until: '6 January',
  /** Where the Santa hat sits: on the car in the logo, on the logo's "B",
   *  on the hero badge, or nowhere. */
  hat: 'car' as 'car' | 'b' | 'badge' | 'none',
  // The owner's own choices from the Christmas Look Studio (saved 23 Oct).
  snow: 'medium' as 'off' | 'light' | 'medium' | 'heavy',
  garland: true,
  glow: true,
  tag: 'outline' as 'filled' | 'outline',
} as const;

/** Black Friday → Cyber Monday (owner, 25 Oct): 10% off jobs DONE on
 *  27–30 November, and CarPlay activation includes the Wi-Fi antenna in the
 *  price — for every car, not only builds that need it. */
export const BF = {
  pct: 10,
  until: '30 November',
  dates: '27–30 November',
} as const;

/** What the price displays, the calculator, the assistants and the bot say. */
export const OFFER = BF_ON
  ? { name: 'Black Friday', emoji: '🏷️', pct: BF.pct, until: BF.until, accent: '#ffd23f', tag: 'filled' as const, noticeKey: BF_NOTICE_KEY }
  : { name: 'Christmas', emoji: '🎄', pct: XMAS.pct, until: XMAS.until, accent: '#ff5a6a', tag: XMAS.tag, noticeKey: XMAS_NOTICE_KEY };

export const offerPrice = (eur: number): number => Math.round((eur * (100 - OFFER.pct)) / 100);

export type PricePart = { text: string } | { was: number; now: number };

/**
 * "From €150 · €220 on MGU" → text and price pieces, so each whole-euro
 * amount can be shown struck through with the offer price next to it.
 * Amounts with cents (the €1.25/km call-out rate) are left alone.
 */
export function priceParts(text: string): PricePart[] {
  const out: PricePart[] = [];
  const re = /€\s?(\d{1,5})(?![.,]\d)/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index) });
    const was = Number(m[1]);
    out.push({ was, now: offerPrice(was) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
