import { CHASSIS_PAGES } from './chassisPages';

// Which service and model pages a gallery photo belongs to, read from the
// owner's own caption ("F36 ID4 to ID6 update + Fullscreen Apple CarPlay +
// 6WB cluster retrofit"). Nothing is inferred beyond the words he wrote.

const SERVICE_RULES: { test: RegExp; slug: string; label: string }[] = [
  { test: /fullscreen/i, slug: 'bmw-fullscreen-carplay', label: 'Fullscreen CarPlay' },
  { test: /carplay/i, slug: 'apple-carplay-activation-dublin', label: 'Apple CarPlay activation' },
  { test: /android/i, slug: 'bmw-android-auto-activation', label: 'Android Auto' },
  { test: /japan/i, slug: 'japan-import-bmw-conversion-ireland', label: 'Japan → EU conversion' },
  { test: /\bmaps?\b/i, slug: 'bmw-map-updates-fsc-codes', label: 'Map updates' },
  { test: /\bid ?[456]\b|idrive update/i, slug: 'bmw-id4-to-id6-upgrade', label: 'iDrive ID4 → ID6' },
  { test: /screen upgrade/i, slug: 'bmw-idrive-upgrade-ireland', label: 'iDrive / screen upgrade' },
  { test: /6wb|digital cluster/i, slug: 'bmw-6wa-to-6wb-retrofit', label: '6WB digital cluster' },
  { test: /camera/i, slug: 'bmw-reverse-camera-retrofit', label: 'Reverse camera' },
  { test: /cruise/i, slug: 'bmw-cruise-control-retrofit', label: 'Cruise control' },
  { test: /diagnos|ista/i, slug: 'bmw-diagnostics-dublin', label: 'Diagnostics' },
];

// Generic "all F-series / all G-series" pages would match every caption.
const GENERIC = new Set(['bmw-f-series-coding', 'bmw-g-series-coding']);

export function projectLinks(caption: string): { slug: string; label: string }[] {
  const out: { slug: string; label: string }[] = [];
  const seen = new Set<string>();
  const add = (slug: string, label: string) => {
    if (!seen.has(slug)) {
      seen.add(slug);
      out.push({ slug, label });
    }
  };
  for (const [slug, page] of Object.entries(CHASSIS_PAGES)) {
    if (GENERIC.has(slug)) continue;
    const codes = page.galleryMatch ?? [];
    if (codes.some((c) => new RegExp(`\\b${c}\\b`, 'i').test(caption))) add(slug, `${page.serviceName.replace(/^BMW /, '')}`);
  }
  for (const r of SERVICE_RULES) if (r.test.test(caption)) add(r.slug, r.label);
  return out;
}

/** The chassis code the caption starts with or mentions, e.g. "F36" — used as the card heading prefix. */
export function chassisCode(caption: string): string | null {
  return caption.match(/\b([EFG]\d{2})\b/i)?.[1]?.toUpperCase() ?? null;
}
