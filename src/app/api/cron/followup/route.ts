import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { runFollowUps } from '@/lib/followUp';

export const runtime = 'nodejs';
// Never prerender (see cron/digest): a static copy would run once per deploy.
export const dynamic = 'force-dynamic';
// Up to eight model calls of a few seconds each.
export const maxDuration = 180;

// Hourly (vercel.json — hourly crons need Vercel Pro): one follow-up for
// customers who went quiet, while WhatsApp still allows it. lib/followUp.ts.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const fromCron = secret
    ? req.headers.get('authorization') === `Bearer ${secret}`
    : /vercel-cron/i.test(req.headers.get('user-agent') || '');
  if (!fromCron) return NextResponse.json({ ok: false }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, skipped: 'no-db' });
  const result = await runFollowUps(sb);
  return NextResponse.json({ ok: true, ...result });
}
