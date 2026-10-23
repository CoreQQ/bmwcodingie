// Working-hours model shared by the public slot picker (via /api/slots) and
// the owner's Mini App editor. Pure helpers only — DB access lives in stats.ts.

export type HoursMap = Record<number, [number, number] | null>;

// Fallback when the business_hours table is missing/empty:
// weekdays 19:00–23:00, weekends 11:00–23:00.
export const DEFAULT_HOURS: HoursMap = {
  0: [11, 23],
  1: [19, 23],
  2: [19, 23],
  3: [19, 23],
  4: [19, 23],
  5: [19, 23],
  6: [11, 23],
};

const pad = (n: number) => String(n).padStart(2, '0');

export const DEFAULT_SLOT_DURATION = 2;

/** Booking windows starting every hour (11:00–13:00, 12:00–14:00, …).
 *  `duration` is the window length in hours — owner-configurable. */
export function windowsFor(hours: HoursMap, weekday: number, duration = DEFAULT_SLOT_DURATION): string[] {
  const r = hours[weekday];
  if (!r) return [];
  const out: string[] = [];
  for (let h = r[0]; h + duration <= r[1]; h += 1) out.push(windowLabel(h, duration));
  return out;
}

/** Parse "11:00–13:00" (en dash, em dash or hyphen) into start/end hours.
 *  Minutes count (10:30 → 10.5): the owner can now set his own times, and
 *  11:30–13:30 must clash with 13:00–15:00. */
export function parseWindow(w: string): [number, number] | null {
  const m = /^(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})$/.exec(w.trim());
  return m ? [Number(m[1]) + Number(m[2]) / 60, Number(m[3]) + Number(m[4]) / 60] : null;
}

/**
 * A time the owner typed → a window label. "10:30" (lasts the usual slot
 * length), "10:30-12:00", "10.30 12", "1030–1200", "18" — null when it does
 * not read as a time of day, or ends after midnight.
 */
export function customWindow(input: string, duration = DEFAULT_SLOT_DURATION): string | null {
  const m = /^(\d{1,2})(?:[:.h]?(\d{2}))?\s*(?:(?:[–—-]|to|до)\s*)?(?:(\d{1,2})(?:[:.h]?(\d{2}))?)?$/i.exec(
    input.trim().replace(/\s+/g, ' '),
  );
  if (!m) return null;
  const start = Number(m[1]) * 60 + Number(m[2] ?? 0);
  // No end given: the usual slot length, cut at midnight ("23:00" → 23:00–24:00).
  const end = m[3] !== undefined ? Number(m[3]) * 60 + Number(m[4] ?? 0) : Math.min(start + duration * 60, 24 * 60);
  if (Number(m[2] ?? 0) > 59 || Number(m[4] ?? 0) > 59) return null;
  if (start >= 24 * 60 || end > 24 * 60 || end <= start) return null;
  const hm = (v: number) => `${pad(Math.floor(v / 60))}:${pad(v % 60)}`;
  return `${hm(start)}–${hm(end)}`;
}

/** True when two booking windows overlap in time (e.g. 11–13 vs 12–14). */
export function windowsOverlap(a: string, b: string): boolean {
  const pa = parseWindow(a);
  const pb = parseWindow(b);
  if (!pa || !pb) return a.trim() === b.trim(); // unparseable → exact match only
  return pa[0] < pb[1] && pb[0] < pa[1];
}

/** Build the window label for a start hour, e.g. 12 → "12:00–14:00". */
export function windowLabel(startHour: number, duration = DEFAULT_SLOT_DURATION): string {
  return `${pad(startHour)}:00–${pad(startHour + duration)}:00`;
}

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
