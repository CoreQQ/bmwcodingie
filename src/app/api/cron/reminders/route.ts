import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOwnerMessage, sendOwnerWithMarkup } from '@/lib/telegram';
import { REVIEW_TEMPLATES, hasReviewUrl } from '@/lib/reviewTemplates';
import type { Booking } from '@/lib/types';

// Uses the shared "short & friendly" template so /review and the daily nudge
// stay consistent.
function reviewAsk(name: string, service: string): string {
  return REVIEW_TEMPLATES[0].build(name, service);
}

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

  // Stale requests: pending for over 24h — easy to lose, costly to ignore.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: staleData } = await sb
    .from('bookings')
    .select('name, service, slot_date, slot_time, created_at')
    .eq('status', 'pending')
    .lt('created_at', dayAgo)
    .order('created_at', { ascending: true })
    .limit(10);
  const stale = (staleData ?? []) as Booking[];

  const icon = (s: string) => (s === 'confirmed' ? '✅' : '⏳');
  const fmt = (list: Booking[]) =>
    list.map((b) => `  ${icon(b.status)} ${b.slot_time} — ${b.name}${b.service ? ` · ${b.service}` : ''}`);

  const todays = rows.filter((b) => b.slot_date === today);
  const tomorrows = rows.filter((b) => b.slot_date === tomorrow);

  if (rows.length || stale.length) {
    const lines = ['⏰ <b>Daily agenda</b>', '━━━━━━━━━━━━━━━━━━━'];
    lines.push(`<b>Today</b> (${today}):`);
    lines.push(...(todays.length ? fmt(todays) : ['  —']));
    lines.push('', `<b>Tomorrow</b> (${tomorrow}):`);
    lines.push(...(tomorrows.length ? fmt(tomorrows) : ['  —']));
    if (stale.length) {
      lines.push('', `⚠️ <b>Waiting for your reply over 24h:</b>`);
      for (const b of stale) {
        const slot = b.slot_date ? ` · ${b.slot_date} ${b.slot_time ?? ''}`.trimEnd() : '';
        lines.push(`  ⏳ ${b.name}${b.service ? ` — ${b.service}` : ''}${slot}`);
      }
      lines.push('  → /bookings to confirm or free them');
    }
    await sendOwnerMessage(lines.join('\n'));
  }

  // Review nudge: yesterday's confirmed jobs, one copy-button per client.
  if (hasReviewUrl()) {
    const yesterday = dayKey(-1);
    const { data: done } = await sb
      .from('bookings')
      .select('name, service')
      .eq('slot_date', yesterday)
      .eq('status', 'confirmed');
    const jobs = (done ?? []) as { name: string; service: string }[];
    if (jobs.length) {
      await sendOwnerWithMarkup(
        '⭐ <b>Yesterday\'s jobs</b> — tap to copy a review request, paste it to the client:',
        {
          inline_keyboard: jobs.slice(0, 6).map((j) => [
            { text: `📋 Ask ${j.name.split(' ')[0]} for a review`, copy_text: { text: reviewAsk(j.name, j.service) } },
          ]),
        },
      );
    }
  }

  return NextResponse.json({ ok: true, sent: true });
}
