import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { notifyTelegram } from '@/lib/telegram';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  if (isRateLimited(`booking:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests — please try again shortly.' },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid body' }, { status: 400 });
  }

  const name = String(body.name ?? '').trim().slice(0, 120);
  const contact = String(body.contact ?? '').trim().slice(0, 120);
  const bmw_model = String(body.bmw_model ?? '').trim().slice(0, 160);
  const service = String(body.service ?? '').trim().slice(0, 160);
  const message = String(body.message ?? '').trim().slice(0, 2000);

  if (!name || !contact) {
    return NextResponse.json({ ok: false, error: 'Name and contact required' }, { status: 400 });
  }

  const lead = { name, contact, bmw_model, service, message };
  const sb = getSupabaseAdmin();

  // No DB configured yet — accept the lead so the form still works in preview,
  // and still ping Telegram so the enquiry isn't lost.
  if (!sb) {
    console.warn('[booking] Supabase not configured; lead not persisted:', { name, contact });
    await notifyTelegram({ ...lead, persisted: false });
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { error } = await sb.from('bookings').insert(lead);

  if (error) {
    console.error('[booking] insert failed:', error.message);
    // Notify anyway so the lead reaches you even if the DB write failed.
    await notifyTelegram({ ...lead, persisted: false });
    return NextResponse.json({ ok: false, error: 'Could not save' }, { status: 500 });
  }

  // Saved — notify. Telegram failure never affects the visitor's success response.
  await notifyTelegram({ ...lead, persisted: true });
  return NextResponse.json({ ok: true, persisted: true });
}
