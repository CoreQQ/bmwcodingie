import { NextResponse } from 'next/server';
import { announceDeploy } from '@/lib/deployPing';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Called once a new version answers, to send the "site updated" line to
// Telegram straight away. Safe to call by anyone, any number of times: a
// build is announced once (deployPing.ts), so repeats only return 'same'.
export async function GET(req: Request) {
  if (isRateLimited(`deploy:${clientIp(req)}`, 10, 60 * 1000)) {
    return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 });
  }
  const result = await announceDeploy().catch(() => 'skip' as const);
  return NextResponse.json({ ok: true, result, build: (process.env.BUILD_SHA ?? '').slice(0, 7) });
}
