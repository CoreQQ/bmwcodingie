import type { SupabaseClient } from '@supabase/supabase-js';

// Every visit, counted without cookies (owner, 20 Nov 2026: "people stopped
// coming to the site"). site_visits only sees visitors who accept cookies —
// about 20 a day — so a quiet day there may be a consent dip, not a traffic
// one. These counters see everyone whose browser runs the page, and store
// nothing personal: no IP, no id, nothing on the visitor's device. One JSON
// row per Irish day in app_config (`hits:YYYY-MM-DD`), so no migration.
//
//   pv    page views
//   land  visits — page views that arrived from outside the site
//   src   where visits came from (google, direct, facebook, …)
//   path  where visits landed (top 60, the rest under "other")
//   dev   mobile / desktop · cty  country code

export type DayHits = {
  pv: number;
  land: number;
  src: Record<string, number>;
  path: Record<string, number>;
  dev: Record<string, number>;
  cty: Record<string, number>;
};

export const emptyDay = (): DayHits => ({ pv: 0, land: 0, src: {}, path: {}, dev: {}, cty: {} });
const key = (day: string) => `hits:${day}`;
export const dublinDay = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });

const bump = (m: Record<string, number>, k: string, cap = 60) => {
  const name = k in m || Object.keys(m).length < cap ? k : 'other';
  m[name] = (m[name] ?? 0) + 1;
};

/** "www.google.ie" → "google"; our own site / nothing → "direct". */
export function sourceOf(ref: string, utm: string): string {
  if (utm) return utm.toLowerCase().split(/[\s/]+/)[0].slice(0, 30);
  if (!ref) return 'direct';
  const host = ref.toLowerCase().replace(/^www\./, '');
  if (host.endsWith('bmwcoding.ie')) return 'direct';
  if (/(^|\.)google\./.test(host)) return 'google';
  if (/bing\.|duckduckgo|yahoo|ecosia|brave/.test(host)) return 'other search';
  if (/chatgpt|openai|perplexity|claude|copilot|gemini/.test(host)) return 'ai chat';
  if (/facebook|fb\.|instagram|l\.wl\.co|whatsapp|t\.co|tiktok|reddit/.test(host)) return 'social';
  return host.split('.').slice(-2, -1)[0] || host;
}

/** Add one hit to today's row. Compare-and-swap so two at once both count. */
export async function recordHit(
  sb: SupabaseClient,
  hit: { path: string; landing: boolean; source: string; device: string; country: string },
): Promise<void> {
  const k = key(dublinDay());
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data } = await sb.from('app_config').select('value').eq('key', k).maybeSingle();
    const stored = (data as { value?: string } | null)?.value;
    let day: DayHits;
    try {
      day = { ...emptyDay(), ...(stored ? (JSON.parse(stored) as DayHits) : {}) };
    } catch {
      day = emptyDay();
    }
    day.pv += 1;
    if (hit.landing) {
      day.land += 1;
      bump(day.src, hit.source);
      bump(day.path, hit.path);
      bump(day.dev, hit.device, 5);
      bump(day.cty, hit.country || '?', 30);
    }
    const value = JSON.stringify(day);
    if (stored === undefined) {
      const ins = await sb.from('app_config').insert({ key: k, value });
      if (!ins.error) return;
    } else {
      const upd = await sb.from('app_config').update({ value }).eq('key', k).eq('value', stored).select('key');
      if (!upd.error && upd.data?.length) return;
    }
  }
}

/** The last `days` Irish days, oldest first (missing days are empty). */
export async function readHits(sb: SupabaseClient, days: number): Promise<{ day: string; hits: DayHits }[]> {
  const list: string[] = [];
  for (let i = days - 1; i >= 0; i--) list.push(dublinDay(new Date(Date.now() - i * 86400000)));
  const { data } = await sb.from('app_config').select('key, value').in('key', list.map(key));
  const rows = new Map(((data ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value]));
  return list.map((day) => {
    try {
      return { day, hits: { ...emptyDay(), ...(JSON.parse(rows.get(key(day)) ?? 'null') ?? {}) } as DayHits };
    } catch {
      return { day, hits: emptyDay() };
    }
  });
}
