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

// ─── The owner's own buttons (bot, Mini App) ───
// A wa.me link opens whichever WhatsApp the phone prefers, and on a phone with
// both apps that is the personal one, not WhatsApp Business where the
// customers are (owner, 11 Nov 2026). These go through /api/w/<number>, a
// small page that opens the chat in WhatsApp Business and keeps the ordinary
// link one tap away. Customer-facing links stay wa.me — it is their phone.
const OWNER_SITE = 'https://www.bmwcoding.ie';

/** Link that opens the chat with this number in WhatsApp Business. */
export function bizChatLink(phone: string, text?: string): string {
  return `${OWNER_SITE}/api/w/${phone.replace(/\D/g, '')}${text ? `?t=${encodeURIComponent(text)}` : ''}`;
}

/** bizChatLink for a phone in any accepted format; null when it is not a phone. */
export function bizChatLinkFor(raw: string, text?: string): string | null {
  const p = normalizePhone(raw);
  return p ? bizChatLink(p, text) : null;
}
