import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { clientIp, isRateLimited } from '@/lib/rateLimit';
import { requestCountry } from '@/lib/geo';
import { recordHit, sourceOf } from '@/lib/hits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A page view from HitCounter (lib/hits.ts). No cookies, nothing stored about
// the person: the IP is only used here to stop one browser flooding the count.
const BOTS = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python|monitor/i;

export async function POST(req: Request) {
  const ua = req.headers.get('user-agent') || '';
  if (!ua || BOTS.test(ua)) return new NextResponse(null, { status: 204 });
  if (isRateLimited(`hit:${clientIp(req)}`, 60, 10 * 60 * 1000)) return new NextResponse(null, { status: 204 });
  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 204 });
  }
  const path = String(body.path ?? '/').split('?')[0].slice(0, 120) || '/';
  if (/^\/(admin|miniapp|api|b\/)/.test(path)) return new NextResponse(null, { status: 204 });
  const ref = String(body.ref ?? '').slice(0, 120);
  const utm = String(body.utm ?? '').slice(0, 60);
  const sb = getSupabaseAdmin();
  if (sb) {
    await recordHit(sb, {
      path,
      landing: body.landing === true,
      source: sourceOf(ref, utm),
      device: /Mobi|Android|iPhone/i.test(ua) ? 'mobile' : 'desktop',
      country: requestCountry(req),
    }).catch(() => undefined);
  }
  return new NextResponse(null, { status: 204 });
}
