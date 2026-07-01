import { NextResponse } from 'next/server';
import { notifyEvent } from '@/lib/telegram';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// Receives client/server render errors from the error boundaries and forwards
// them to Telegram. Rate-limited so a crash loop can't spam the chat.
export async function POST(req: Request) {
  if (isRateLimited(`err:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    /* ignore malformed body */
  }

  const message = String(body.message ?? 'Unknown error').slice(0, 400);
  const path = String(body.path ?? '').slice(0, 200);
  const digest = body.digest ? String(body.digest).slice(0, 80) : '';

  await notifyEvent({
    emoji: '🛑',
    title: 'Server / app error',
    rows: [
      ['Page', path || '—'],
      ['Error', message],
      ['Digest', digest],
      ['IP', clientIp(req)],
    ],
  });

  return NextResponse.json({ ok: true });
}
