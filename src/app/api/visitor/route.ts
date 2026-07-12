import { NextResponse } from 'next/server';
import { clientIp, isRateLimited } from '@/lib/rateLimit';
import { notifyVisitor } from '@/lib/telegram';
import { parseUserAgent } from '@/lib/parseUserAgent';

export const runtime = 'nodejs';

// Best-effort in-memory cooldown per IP — resets when the lambda goes cold,
// which is fine here: the goal is just to avoid obvious refresh-spam.
const lastNotified = new Map<string, number>();
const COOLDOWN_MS = 10 * 60 * 1000;

const PRIVATE_IP = /^(127\.|10\.|192\.168\.|::1$|unknown$)/;

type Geo = { country?: string; city?: string; isp?: string };

/** Best-effort country/city/ISP lookup. Returns {} on any failure or private IP. */
async function geolocate(ip: string): Promise<Geo> {
  if (PRIVATE_IP.test(ip)) return {};
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,city,isp`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return {};
    const data = await res.json();
    if (data.status !== 'success') return {};
    return {
      country: data.country || undefined,
      city: data.city || undefined,
      isp: data.isp || undefined,
    };
  } catch {
    return {};
  }
}

export async function POST(req: Request) {
  // One ping per session per visitor is normal — anything chatty is abuse
  // aimed at flooding the owner's Telegram.
  if (isRateLimited(`visit:${clientIp(req)}`, 4, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: true });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const path = String(body.path ?? '/').trim().slice(0, 200);
  const referrer = body.referrer ? String(body.referrer).trim().slice(0, 200) : undefined;
  const device = body.device === 'mobile' ? 'mobile' : 'desktop';
  const isReturning = body.isReturning === true;
  const source = body.source ? String(body.source).trim().slice(0, 160) : undefined;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const last = lastNotified.get(ip);
  if (last && Date.now() - last < COOLDOWN_MS) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  lastNotified.set(ip, Date.now());

  const { browser, os } = parseUserAgent(req.headers.get('user-agent') || '');
  const language = req.headers.get('accept-language')?.split(',')[0]?.trim();
  const { country, city, isp } = await geolocate(ip);

  await notifyVisitor({ path, referrer, device, ip, browser, os, country, city, isp, language, isReturning, source });
  return NextResponse.json({ ok: true });
}
