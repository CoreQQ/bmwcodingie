import { NextResponse } from 'next/server';
import { notifyEvent } from '@/lib/telegram';
import { clientIp, isRateLimited } from '@/lib/rateLimit';
import { isServiceArea, requestCountry } from '@/lib/geo';

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
  const ua = (req.headers.get('user-agent') || '').slice(0, 160);

  // Crawlers and scrapers — mostly from overseas data centres — run odd or
  // headless browsers that rewrite a page's <head> before it loads, and React
  // then fails to hydrate it ("reading 'itemProp'" from a Tencent Cloud IP was
  // the first to ping Alex). The page works for real visitors, so those
  // reports are logged and dropped instead of waking him. Anything from the
  // service area, or from a normal browser, still comes through.
  const botLike = /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|python|curl|wget|go-http|java\//i.test(ua) || !ua;
  if (botLike || !isServiceArea(req)) {
    console.warn('[error-report] dropped non-customer error', { path, message, country: requestCountry(req), ua });
    return NextResponse.json({ ok: true, skipped: 'non-customer' });
  }

  await notifyEvent({
    emoji: '🛑',
    title: 'Server / app error',
    rows: [
      ['Page', path || '—'],
      ['Error', message],
      ['Digest', digest],
      ['IP', clientIp(req)],
      ['Country', requestCountry(req) || '—'],
      ['Browser', ua || '—'],
    ],
  });

  return NextResponse.json({ ok: true });
}
