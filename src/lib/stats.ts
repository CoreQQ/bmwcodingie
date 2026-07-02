import type { SupabaseClient } from '@supabase/supabase-js';
import type { Booking } from './types';

export type BusinessStats = {
  total: number;
  last7: number;
  last30: number;
  pending: number;
  confirmedUpcoming: number;
  topServices: { service: string; count: number }[];
  nextBookings: Booking[];
};

/** Aggregates booking data for the admin dashboard and the bot's /stats. */
export async function getBusinessStats(sb: SupabaseClient): Promise<BusinessStats> {
  const { data } = await sb
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  const bookings = (data ?? []) as Booking[];

  const now = Date.now();
  const days = (n: number) => now - n * 24 * 60 * 60 * 1000;
  const today = new Date().toISOString().slice(0, 10);

  const last7 = bookings.filter((b) => new Date(b.created_at).getTime() >= days(7)).length;
  const last30 = bookings.filter((b) => new Date(b.created_at).getTime() >= days(30)).length;
  const pending = bookings.filter((b) => b.slot_date && b.status === 'pending').length;

  const upcoming = bookings
    .filter((b) => b.slot_date && b.slot_date >= today && b.status === 'confirmed')
    .sort((a, b) => `${a.slot_date}${a.slot_time}`.localeCompare(`${b.slot_date}${b.slot_time}`));

  const counts = new Map<string, number>();
  for (const b of bookings) {
    const s = (b.service || '').trim();
    if (!s) continue;
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  const topServices = [...counts.entries()]
    .map(([service, count]) => ({ service, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total: bookings.length,
    last7,
    last30,
    pending,
    confirmedUpcoming: upcoming.length,
    topServices,
    nextBookings: upcoming.slice(0, 5),
  };
}

/** Bookings grouped per day for the next `daysAhead` days (schedule view). */
export async function getSchedule(
  sb: SupabaseClient,
  daysAhead = 14,
): Promise<{ day: string; bookings: Booking[] }[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = today.toISOString().slice(0, 10);
  const end = new Date(today.getTime() + daysAhead * 86400000).toISOString().slice(0, 10);

  const { data } = await sb
    .from('bookings')
    .select('*')
    .not('slot_date', 'is', null)
    .gte('slot_date', start)
    .lte('slot_date', end)
    .in('status', ['pending', 'confirmed'])
    .order('slot_time', { ascending: true });
  const rows = (data ?? []) as Booking[];

  const out: { day: string; bookings: Booking[] }[] = [];
  for (let i = 0; i <= daysAhead; i++) {
    const d = new Date(today.getTime() + i * 86400000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    out.push({ day: key, bookings: rows.filter((b) => b.slot_date === key) });
  }
  return out;
}

import { DEFAULT_HOURS, type HoursMap } from './hours';

/** Working hours from business_hours, falling back to the built-in defaults. */
export async function getHours(sb: SupabaseClient): Promise<HoursMap> {
  try {
    const { data } = await sb.from('business_hours').select('*');
    const rows = (data ?? []) as { weekday: number; open_hour: number; close_hour: number; closed: boolean }[];
    if (!rows.length) return DEFAULT_HOURS;
    const map: HoursMap = { ...DEFAULT_HOURS };
    for (const r of rows) {
      map[r.weekday] = r.closed ? null : [r.open_hour, r.close_hour];
    }
    return map;
  } catch {
    return DEFAULT_HOURS;
  }
}

export async function getBlockedDates(sb: SupabaseClient): Promise<string[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await sb.from('blocked_dates').select('day').gte('day', today);
  return ((data ?? []) as { day: string }[]).map((r) => r.day);
}
