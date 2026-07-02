import { getSupabaseAdmin } from '@/lib/supabase';
import { buildIcs, calendarToken } from '@/lib/calendar';
import type { Booking } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Private iCalendar feed of confirmed bookings — subscribe from the phone's
// calendar app. The token is derived from the admin secret; treat the URL as
// a password.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (token.replace(/\.ics$/, '') !== calendarToken()) {
    return new Response('Not found', { status: 404 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) return new Response('No database', { status: 503 });

  const from = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const { data } = await sb
    .from('bookings')
    .select('*')
    .eq('status', 'confirmed')
    .not('slot_date', 'is', null)
    .gte('slot_date', from)
    .order('slot_date', { ascending: true });

  return new Response(buildIcs((data ?? []) as Booking[]), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
