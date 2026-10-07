// One phone rule for the site forms and their API routes. Irish numbers are
// the common case (08x mobiles, 01 Dublin landlines); anything else must
// come with a country code. Output is E.164 so wa.me links and Telegram
// buttons can be built from it without guessing.

const IE = '+353';

/** Normalise what a person typed into E.164, or null if it cannot be a phone number. */
export function normalizePhone(raw: string): string | null {
  let s = raw.trim().replace(/[\s().\- ]/g, '');
  if (!s) return null;
  if (s.startsWith('00')) s = `+${s.slice(2)}`;
  if (/^0[1-9]\d{6,9}$/.test(s)) s = `${IE}${s.slice(1)}`; // 087 123 4567 → +353 87 123 4567
  else if (/^353\d{7,10}$/.test(s)) s = `+${s}`; // 353 87 … without the plus
  else if (/^8\d{8}$/.test(s)) s = `${IE}${s}`; // 87 123 4567 (dropped the 0)
  if (!/^\+[1-9]\d{7,14}$/.test(s)) return null;
  return s;
}

export function isValidPhone(raw: string): boolean {
  return normalizePhone(raw) !== null;
}

/** wa.me link for a phone in any accepted format; null when it is not a phone. */
export function waLinkFor(raw: string, text?: string): string | null {
  const p = normalizePhone(raw);
  if (!p) return null;
  return `https://wa.me/${p.slice(1)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
