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

// Owner diagnostics: where visitors actually spend their attention, and which
// pages turn into enquiries. Aggregates only — no names, no numbers, no IPs.
// Guarded by the shared diagnostics key.
export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key') || '';
  if (!process.env.MANYCHAT_SECRET || key !== process.env.MANYCHAT_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: 'no db' });

  const since = new Date(Date.now() - 60 * 86400000).toISOString();
  const [sect, book] = await Promise.all([
    sb.from('section_time').select('path, section, seconds').gt('created_at', since).limit(20000),
    sb.from('bookings').select('landing, how_heard, source, status, slot_date, created_at').gt('created_at', since).limit(5000),
  ]);

  const bySection = new Map<string, { views: number; secs: number }>();
  for (const r of (sect.data ?? []) as { path: string; section: string; seconds: number }[]) {
    const k = `${r.path} :: ${r.section}`;
    const v = bySection.get(k) ?? { views: 0, secs: 0 };
    v.views += 1;
    v.secs += Number(r.seconds) || 0;
    bySection.set(k, v);
  }
  const sections = [...bySection.entries()]
    .map(([k, v]) => ({ where: k, views: v.views, totalSecs: Math.round(v.secs), avgSecs: Math.round(v.secs / v.views) }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 80);

  const count = (field: 'landing' | 'how_heard' | 'source' | 'status') => {
    const m = new Map<string, number>();
    for (const b of (book.data ?? []) as Record<string, string | null>[]) {
      const k = (b[field] ?? '').trim() || '(none)';
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
  };
  const rows = (book.data ?? []) as { slot_date: string | null }[];

  return NextResponse.json({
    ok: true,
    windowDays: 60,
    sectionRows: (sect.data ?? []).length,
    sections,
    bookings: {
      total: rows.length,
      withSlot: rows.filter((r) => r.slot_date).length,
      byLanding: count('landing'),
      byHeard: count('how_heard'),
      bySource: count('source'),
      byStatus: count('status'),
    },
  });
}
