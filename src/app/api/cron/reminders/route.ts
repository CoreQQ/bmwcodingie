import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOwnerMessage } from '@/lib/telegram';
import type { Booking } from '@/lib/types';

export const runtime = 'nodejs';

// Daily agenda reminder (Vercel cron, 07:00 UTC — see vercel.json). Sends the
// owner today's and tomorrow's slot bookings; stays silent when both are empty.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, skipped: 'no-db' });

  const dayKey = (offset: number) => {
    const d = new Date(Date.now() + offset * 86400000);
    return d.toISOString().slice(0, 10);
  };
  const today = dayKey(0);
  const tomorrow = dayKey(1);

  const { data } = await sb
    .from('bookings')
    .select('*')
    .in('slot_date', [today, tomorrow])
    .in('status', ['pending', 'confirmed'])
    .order('slot_time', { ascending: true });
  const rows = (data ?? []) as Booking[];
  if (!rows.length) return NextResponse.json({ ok: true, skipped: 'empty' });

  const icon = (s: string) => (s === 'confirmed' ? '✅' : '⏳');
  const fmt = (list: Booking[]) =>
    list.map((b) => `  ${icon(b.status)} ${b.slot_time} — ${b.name}${b.service ? ` · ${b.service}` : ''}`);

  const todays = rows.filter((b) => b.slot_date === today);
  const tomorrows = rows.filter((b) => b.slot_date === tomorrow);

  const lines = ['⏰ <b>Daily agenda</b>', '━━━━━━━━━━━━━━━━━━━'];
  lines.push(`<b>Today</b> (${today}):`);
  lines.push(...(todays.length ? fmt(todays) : ['  —']));
  lines.push('', `<b>Tomorrow</b> (${tomorrow}):`);
  lines.push(...(tomorrows.length ? fmt(tomorrows) : ['  —']));

  await sendOwnerMessage(lines.join('\n'));
  return NextResponse.json({ ok: true, sent: true });
}
