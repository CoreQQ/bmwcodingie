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

/** Two-hour booking windows for a weekday under the given hours. */
export function windowsFor(hours: HoursMap, weekday: number): string[] {
  const r = hours[weekday];
  if (!r) return [];
  const out: string[] = [];
  for (let h = r[0]; h + 2 <= r[1]; h += 2) out.push(`${pad(h)}:00–${pad(h + 2)}:00`);
  return out;
}

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
