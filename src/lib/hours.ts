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

/** Two-hour booking windows starting every hour (11:00–13:00, 12:00–14:00, …). */
export function windowsFor(hours: HoursMap, weekday: number): string[] {
  const r = hours[weekday];
  if (!r) return [];
  const out: string[] = [];
  for (let h = r[0]; h + 2 <= r[1]; h += 1) out.push(`${pad(h)}:00–${pad(h + 2)}:00`);
  return out;
}

/** Parse "11:00–13:00" (en dash, em dash or hyphen) into start/end hours. */
export function parseWindow(w: string): [number, number] | null {
  const m = /^(\d{1,2}):\d{2}\s*[–—-]\s*(\d{1,2}):\d{2}$/.exec(w.trim());
  return m ? [Number(m[1]), Number(m[2])] : null;
}

/** True when two booking windows overlap in time (e.g. 11–13 vs 12–14). */
export function windowsOverlap(a: string, b: string): boolean {
  const pa = parseWindow(a);
  const pb = parseWindow(b);
  if (!pa || !pb) return a.trim() === b.trim(); // unparseable → exact match only
  return pa[0] < pb[1] && pb[0] < pa[1];
}

/** Build the window label for a start hour, e.g. 12 → "12:00–14:00". */
export function windowLabel(startHour: number): string {
  return `${pad(startHour)}:00–${pad(startHour + 2)}:00`;
}

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
