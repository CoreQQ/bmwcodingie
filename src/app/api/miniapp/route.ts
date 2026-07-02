import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { validateMiniAppAuth } from '@/lib/miniappAuth';
import { getBusinessStats, getSchedule, getBlockedDates } from '@/lib/stats';

export const runtime = 'nodejs';

// Backend for the owner's Telegram Mini App. Every call carries initData,
// validated against the bot token and restricted to the owner chat.
export async function POST(req: Request) {
  let body: { initData?: string; action?: string; id?: number; status?: string; day?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  if (!validateMiniAppAuth(String(body.initData ?? ''))) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 503 });

  switch (body.action) {
    case 'overview': {
      const [schedule, blocked, stats] = await Promise.all([
        getSchedule(sb, 14),
        getBlockedDates(sb),
        getBusinessStats(sb),
      ]);
      return NextResponse.json({ ok: true, schedule, blocked, stats });
    }

    case 'setStatus': {
      const id = Number(body.id);
      const status = String(body.status);
      if (!id || !['confirmed', 'declined', 'cancelled', 'pending'].includes(status)) {
        return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
      }
      await sb.from('bookings').update({ status }).eq('id', id);
      return NextResponse.json({ ok: true });
    }

    case 'toggleBlock': {
      const day = String(body.day ?? '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
        return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
      }
      const { data } = await sb.from('blocked_dates').select('day').eq('day', day).maybeSingle();
      if (data) await sb.from('blocked_dates').delete().eq('day', day);
      else await sb.from('blocked_dates').upsert({ day });
      return NextResponse.json({ ok: true, blocked: !data });
    }

    default:
      return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
  }
}
