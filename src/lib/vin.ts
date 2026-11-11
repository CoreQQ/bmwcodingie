// The full VIN, 17 characters (owner, 4 Nov 2026 — it used to be the last 7).
// A VIN never contains I, O or Q, so when people type those they mean 1 and 0.

export const VIN_LENGTH = 17;

export function cleanVin(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .replace(/[OQ]/g, '0')
    .replace(/I/g, '1');
}

export const isFullVin = (vin: string) => vin.length === VIN_LENGTH;

// ─── Tap to copy in Telegram (owner, 11 Nov 2026) ───
// Telegram copies monospace text on a tap, so every VIN in a bot message is
// wrapped in <code>. Done once, where messages leave (telegram.ts), so a VIN
// is copyable wherever it turns up: a customer's WhatsApp text, an enquiry,
// the assistant's note, a lead card.
//
// A VIN here is a 17-character run of letters and digits ending in four
// digits (every BMW serial does) with at least two letters. People type them
// in lower case and with O for 0, so what is shown is the cleaned VIN — the
// one that pastes into a decoder. After the word "VIN:" a shorter run counts
// too (older enquiries carry the last 7).
const VIN_IN_TEXT =
  /(?<![A-Za-z0-9/=_@#-])([A-Za-z0-9]{17})(?![A-Za-z0-9_=/@-])|(\bVIN:\s*)([A-Za-z0-9]{7,16})(?![A-Za-z0-9])/gi;

const looksLikeVin = (token: string) => {
  const v = cleanVin(token);
  return v.length === VIN_LENGTH && /\d{4}$/.test(v) && v.replace(/[^A-Z]/g, '').length >= 2;
};

// Telegram does not allow <code> inside bold, italic and the like, so those
// are closed before a VIN and reopened after it.
const INLINE_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 'ins', 's', 'strike', 'del', 'tg-spoiler', 'span']);
const EMPTY_INLINE = /<(b|strong|i|em|u|ins|s|strike|del|tg-spoiler|span)(?:\s[^<>]*)?>(\s*)<\/\1>/gi;

/** Telegram HTML in, the same HTML out with each VIN inside <code>…</code>. */
export function tapToCopyVins(html: string): string {
  if (!/[A-Za-z0-9]{7}/.test(html)) return html;
  // Leave alone what is already monospace, and never break a link's text.
  let closed = 0;
  let changed = false;
  const open: { name: string; raw: string }[] = [];
  const out = html.replace(/<[^<>]*>|[^<]+/g, (part) => {
    if (part.startsWith('<')) {
      const tag = /^<\s*(\/?)\s*([a-z][a-z0-9-]*)/i.exec(part);
      if (!tag) return part;
      const name = tag[2].toLowerCase();
      if (name === 'code' || name === 'pre' || name === 'a') closed = Math.max(0, closed + (tag[1] ? -1 : 1));
      else if (INLINE_TAGS.has(name)) {
        if (!tag[1]) open.push({ name, raw: part });
        else {
          const at = open.map((o) => o.name).lastIndexOf(name);
          if (at >= 0) open.splice(at, 1);
        }
      }
      return part;
    }
    if (closed) return part;
    const code = (vin: string) => {
      changed = true;
      const before = open.slice().reverse().map((o) => `</${o.name}>`).join('');
      return `${before}<code>${vin}</code>${open.map((o) => o.raw).join('')}`;
    };
    return part.replace(VIN_IN_TEXT, (all, full?: string, label?: string, partial?: string) => {
      if (full) return looksLikeVin(full) ? code(cleanVin(full)) : all;
      if (label && partial && /\d/.test(partial)) return `${label}${code(partial.toUpperCase())}`;
      return all;
    });
  });
  if (!changed) return out;
  // A VIN at the very start or end of a bold run leaves an empty pair behind
  // (pairs inside pairs when the run was bold and italic).
  let clean = out;
  for (let pass = 0; pass < 4; pass++) {
    const next = clean.replace(EMPTY_INLINE, '$2');
    if (next === clean) break;
    clean = next;
  }
  return clean;
}
