import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Returns the slots that are already taken (confirmed bookings) from today on,
// so the public slot picker can show/disable them. Only date + time window are
// exposed — never any customer data (the bookings table stays unreadable to anon).
export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ taken: [] });

  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await sb
    .from('bookings')
    .select('slot_date, slot_time')
    .eq('status', 'confirmed')
    .not('slot_date', 'is', null)
    .gte('slot_date', today);

  if (error || !data) return NextResponse.json({ taken: [] });

  const taken = data
    .filter((r) => r.slot_date && r.slot_time)
    .map((r) => ({ date: r.slot_date as string, time: r.slot_time as string }));

  return NextResponse.json(
    { taken },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
