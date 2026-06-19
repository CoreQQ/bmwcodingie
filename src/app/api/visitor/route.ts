import { NextResponse } from 'next/server';
import { notifyVisitor } from '@/lib/telegram';

export const runtime = 'nodejs';

// Best-effort in-memory cooldown per IP — resets when the lambda goes cold,
// which is fine here: the goal is just to avoid obvious refresh-spam.
const lastNotified = new Map<string, number>();
const COOLDOWN_MS = 10 * 60 * 1000;

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

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const last = lastNotified.get(ip);
  if (last && Date.now() - last < COOLDOWN_MS) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  lastNotified.set(ip, Date.now());

  await notifyVisitor({ path, referrer, device });
  return NextResponse.json({ ok: true });
}
