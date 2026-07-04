import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getHours, getSlotDuration } from '@/lib/stats';
import { DEFAULT_HOURS, DEFAULT_SLOT_DURATION } from '@/lib/hours';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Returns the slots that are already taken (confirmed bookings) from today on,
// so the public slot picker can show/disable them. Only date + time window are
// exposed — never any customer data (the bookings table stays unreadable to anon).
export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ taken: [], blocked: [], hours: DEFAULT_HOURS, duration: DEFAULT_SLOT_DURATION });

  const today = new Date().toISOString().slice(0, 10);
  const [{ data, error }, blockedRes, hours, duration] = await Promise.all([
    sb
      .from('bookings')
      .select('slot_date, slot_time')
      .eq('status', 'confirmed')
      .not('slot_date', 'is', null)
      .gte('slot_date', today),
    sb.from('blocked_dates').select('day').gte('day', today),
    getHours(sb),
    getSlotDuration(sb),
  ]);

  const blocked = ((blockedRes.data ?? []) as { day: string }[]).map((r) => r.day);
  if (error || !data) return NextResponse.json({ taken: [], blocked, hours, duration });

  const taken = data
    .filter((r) => r.slot_date && r.slot_time)
    .map((r) => ({ date: r.slot_date as string, time: r.slot_time as string }));

  return NextResponse.json(
    { taken, blocked, hours, duration },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
