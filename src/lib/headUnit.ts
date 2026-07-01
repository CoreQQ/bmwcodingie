// Estimates the likely BMW head unit from the model year (and series where it
// helps). This is a best-effort guess from generation timelines — the exact
// unit depends on the car's SA option codes, so it's always shown as "likely"
// and meant to be confirmed on the car.

/** Returns a short head-unit label, or '' if the year is unknown. */
export function estimateHeadUnit(yearStr: string, series = ''): string {
  const year = Number(yearStr);
  if (!Number.isFinite(year) || year < 1990) return '';

  // Newer standalone-G models went MGU early; otherwise fall back to year bands.
  const gEra = /\b(G\d|8-?series|i4|iX|i7)\b/i.test(series);

  if (year >= 2022) return 'MGU · iDrive 8';
  if (year >= 2020) return 'MGU · iDrive 7';
  if (year >= 2018) return gEra ? 'MGU · iDrive 7' : 'NBT Evo or MGU';
  if (year >= 2016) return 'NBT Evo (ID5/ID6)';
  if (year >= 2013) return 'NBT';
  if (year >= 2010) return 'CIC or NBT';
  return 'CIC / CCC (older)';
}
