import { NextResponse } from 'next/server';
import { notifyVisitor } from '@/lib/telegram';
import { parseUserAgent } from '@/lib/parseUserAgent';

export const runtime = 'nodejs';

// Best-effort in-memory cooldown per IP — resets when the lambda goes cold,
// which is fine here: the goal is just to avoid obvious refresh-spam.
const lastNotified = new Map<string, number>();
const COOLDOWN_MS = 10 * 60 * 1000;

const PRIVATE_IP = /^(127\.|10\.|192\.168\.|::1$|unknown$)/;

/** Best-effort city/country lookup. Returns undefined on any failure or private IP. */
async function geolocate(ip: string): Promise<string | undefined> {
  if (PRIVATE_IP.test(ip)) return undefined;
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country`, {
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return undefined;
    const data = await res.json();
    if (data.status !== 'success') return undefined;
    return [data.city, data.country].filter(Boolean).join(', ') || undefined;
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
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

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const last = lastNotified.get(ip);
  if (last && Date.now() - last < COOLDOWN_MS) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  lastNotified.set(ip, Date.now());

  const { browser, os } = parseUserAgent(req.headers.get('user-agent') || '');
  const language = req.headers.get('accept-language')?.split(',')[0]?.trim();
  const location = await geolocate(ip);

  await notifyVisitor({ path, referrer, device, ip, browser, os, location, language, isReturning });
  return NextResponse.json({ ok: true });
}
