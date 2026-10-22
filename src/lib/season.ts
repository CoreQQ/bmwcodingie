// Christmas offer: 10% off all work (not the call-out fee).
//
// Off unless NEXT_PUBLIC_SEASON=xmas. The variable is inlined at build time,
// so the server render and the browser always agree (no date checks in a
// first render — that is how hydration breaks). Set it for Preview to review
// the look, for Production to launch, and remove it after `until`.

export const XMAS_ON = process.env.NEXT_PUBLIC_SEASON === 'xmas';

// localStorage keys of the floating notice (Announcement) — here, not in the
// client component, because the layout's pre-paint script needs the strings.
// Bump a key when the wording changes so a dismissal never hides a newer one.
export const NOTICE_KEY = 'bmw-notice-mobile-live';
export const XMAS_NOTICE_KEY = 'bmw-notice-xmas-2026';

export const XMAS = {
  pct: 10,
  /** Last day of the offer, as shown to customers. */
  until: '6 January',
  /** Where the Santa hat sits: on the car in the logo, on the logo's "B",
   *  on the hero badge, or nowhere. */
  hat: 'car' as 'car' | 'b' | 'badge' | 'none',
} as const;

export const xmasPrice = (eur: number): number => Math.round((eur * (100 - XMAS.pct)) / 100);

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
    out.push({ was, now: xmasPrice(was) });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
