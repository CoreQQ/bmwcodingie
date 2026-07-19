import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { clientIp, isRateLimited } from '@/lib/rateLimit';
import { isServiceArea } from '@/lib/geo';

export const runtime = 'nodejs';

// Sink for anonymous section-attention beacons. Nothing identifying is
// stored — not even the IP (it's only used for rate limiting in memory).
export async function POST(req: Request) {
  if (isRateLimited(`sect:${clientIp(req)}`, 10, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: true });
  }
  if (!isServiceArea(req)) return NextResponse.json({ ok: true });

  let body: { path?: unknown; secs?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const path = String(body.path ?? '/').slice(0, 120);
  const secs = body.secs && typeof body.secs === 'object' ? (body.secs as Record<string, unknown>) : {};
  const rows = Object.entries(secs)
    .slice(0, 20)
    .map(([section, s]) => ({
      path,
      section: String(section).slice(0, 40),
      seconds: Math.max(0, Math.min(1800, Number(s) || 0)),
    }))
    .filter((r) => r.seconds >= 2);
  if (!rows.length) return NextResponse.json({ ok: true });

  const sb = getSupabaseAdmin();
  if (sb) await sb.from('section_time').insert(rows).then(() => undefined, () => undefined);
  return NextResponse.json({ ok: true });
}
