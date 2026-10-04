// The text a WhatsApp chat opens with, chosen by the page the visitor is on,
// so the first message already says what they came for.

const DEFAULT_MESSAGE = 'Hi, I would like to check what coding/retrofit options are available for my BMW.';

const BY_PAGE: [RegExp, string][] = [
  [/japan/, "Hi, I'm interested in Japan to EU conversion for my BMW."],
  [/carplay/, 'Hi, I would like to check Apple CarPlay compatibility for my BMW.'],
  [/android-auto/, 'Hi, I would like to check Android Auto for my BMW.'],
  [/6wa|6wb|cluster/, "Hi, I'm interested in the 6WA to 6WB digital cluster retrofit for my BMW."],
  [/id4|id6|idrive/, "Hi, I'm interested in an iDrive upgrade for my BMW."],
  [/map|fsc/, "Hi, I'd like a navigation map update / FSC code for my BMW."],
  [/diagnostic/, "Hi, I'd like a diagnostic check on my BMW."],
  [/retrofit|camera|ambient|cruise/, "Hi, I'm interested in a retrofit for my BMW."],
  [/remote/, "Hi, I'm interested in remote coding for my BMW."],
];

/** Opening message for a WhatsApp chat started from `path`. */
export function waMessageFor(path: string): string {
  const p = path.toLowerCase();
  for (const [re, text] of BY_PAGE) if (re.test(p)) return text;
  return DEFAULT_MESSAGE;
}

export function waHref(whatsapp: string, text: string): string {
  const digits = whatsapp.replace(/\D/g, '');
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}` : '/#contact';
}

export { DEFAULT_MESSAGE as WA_DEFAULT_MESSAGE };

/** wa.me link with an optional pre-filled text; '#' when no number is set. */
export function waLink(whatsapp: string, text?: string): string {
  const digits = whatsapp.replace(/[^\d]/g, '');
  if (!digits) return '#';
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${q}`;
}
