/** Rough check: is the text already mostly Cyrillic (Russian/Ukrainian)? */
function isMostlyCyrillic(text: string): boolean {
  const letters = text.match(/[a-zA-Zа-яА-ЯёЁ]/g) ?? [];
  if (letters.length === 0) return false;
  const cyrillic = text.match(/[а-яА-ЯёЁ]/g) ?? [];
  return cyrillic.length / letters.length > 0.5;
}

/**
 * Translates a customer message to Russian for the Telegram notification.
 *
 * Uses the free, key-less Google Translate web endpoint. Never throws —
 * returns null if translation isn't needed (already Cyrillic / empty) or
 * the request fails, so a booking notification always goes out.
 */
export async function translateToRussian(text: string): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed || isMostlyCyrillic(trimmed)) return null;

  try {
    const url =
      'https://translate.googleapis.com/translate_a/single' +
      '?client=gtx&sl=auto&tl=ru&dt=t&q=' +
      encodeURIComponent(trimmed);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal }).finally(() =>
      clearTimeout(timeout),
    );
    if (!res.ok) {
      console.error('[translate] request failed:', res.status);
      return null;
    }

    // Response shape: [[["перевод","original",...], ...], ...]
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const out = (data[0] as unknown[])
      .map((seg) => (Array.isArray(seg) ? String(seg[0] ?? '') : ''))
      .join('')
      .trim();

    if (!out || out.toLowerCase() === trimmed.toLowerCase()) return null;
    return out;
  } catch (e) {
    console.error('[translate] request error:', e);
    return null;
  }
}
