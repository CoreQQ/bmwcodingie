import type { SupabaseClient } from '@supabase/supabase-js';

// The month's enquiries against the target (owner, 16 Nov 2026: "twice as
// many enquiries in December as in November"). An enquiry is a row in
// bookings, whatever the channel — the same count the weekly numbers use.
// Shown in the evening summary so the pace is visible every day, while
// there is still time to do something about it.

/** Months with a target: this many times the enquiries of the month before. */
const GOALS: Record<string, number> = { '2026-12': 2 };

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export type MonthProgress = {
  month: string;
  /** Enquiries so far this month. */
  count: number;
  day: number;
  daysInMonth: number;
  /** Where the month ends at the current daily rate. */
  pace: number;
  lastMonth: string;
  lastCount: number;
  /** Target for this month, when one is set. */
  target?: number;
  /** A target set for next month, as a multiple of this one. */
  nextTimes?: number;
  nextMonth: string;
};

export async function monthProgress(sb: SupabaseClient, now = new Date()): Promise<MonthProgress | null> {
  // Irish calendar date; month boundaries are taken at midnight UTC, which is
  // Irish midnight in winter and an hour off in summer — fine for a count.
  const [y, m, d] = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' }).split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1)).toISOString();
  const prevStart = new Date(Date.UTC(y, m - 2, 1)).toISOString();
  const count = (from: string, to?: string) => {
    let q = sb.from('bookings').select('id', { count: 'exact', head: true }).gte('created_at', from);
    if (to) q = q.lt('created_at', to);
    return q;
  };
  const [cur, prev] = await Promise.all([count(start), count(prevStart, start)]);
  if (cur.error || prev.error) return null;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const key = (yy: number, mm: number) => `${yy}-${String(mm).padStart(2, '0')}`;
  const next = m === 12 ? { y: y + 1, m: 1 } : { y, m: m + 1 };
  const times = GOALS[key(y, m)];
  const thisCount = cur.count ?? 0;
  const lastCount = prev.count ?? 0;
  return {
    month: MONTHS[m - 1],
    count: thisCount,
    day: d,
    daysInMonth,
    pace: Math.round((thisCount / Math.max(d, 1)) * daysInMonth),
    lastMonth: MONTHS[(m + 10) % 12],
    lastCount,
    target: times ? Math.round(lastCount * times) : undefined,
    nextTimes: GOALS[key(next.y, next.m)],
    nextMonth: MONTHS[next.m - 1],
  };
}

/** The lines for the evening summary (HTML). */
export function goalLines(p: MonthProgress): string[] {
  const lines: string[] = [];
  if (p.target) {
    const left = Math.max(0, p.target - p.count);
    const daysLeft = Math.max(1, p.daysInMonth - p.day);
    lines.push(
      `🎯 <b>${p.month} goal:</b> ${p.count} of ${p.target} enquiries (${p.lastMonth} had ${p.lastCount}) · day ${p.day} of ${p.daysInMonth}`,
      p.count >= p.target
        ? '   Goal reached ✅'
        : `   On pace for ${p.pace}. To get there: ${Math.ceil(left / daysLeft)} a day from here.`,
    );
  } else {
    lines.push(`📈 <b>${p.month} so far:</b> ${p.count} enquiries · on pace for ${p.pace} (${p.lastMonth}: ${p.lastCount})`);
    if (p.nextTimes) lines.push(`   🎯 ${p.nextMonth} goal: ${p.nextTimes}× ${p.month} — about ${Math.round(p.pace * p.nextTimes)} at this pace.`);
  }
  return lines;
}
