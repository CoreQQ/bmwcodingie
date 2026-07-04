import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { notifyTelegram } from '@/lib/telegram';
import { repeatCustomerNote } from '@/lib/crm';
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

  // Requested slot — optional. slot_date must be a plain YYYY-MM-DD date.
  const rawDate = String(body.slot_date ?? '').trim().slice(0, 10);
  const slot_date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
  const slot_time = String(body.slot_time ?? '').trim().slice(0, 40);

  if (!name || !contact) {
    return NextResponse.json({ ok: false, error: 'Name and contact required' }, { status: 400 });
  }

  const lead = { name, contact, bmw_model, service, message, slot_date, slot_time };
  const sb = getSupabaseAdmin();

  // No DB configured yet — accept the lead so the form still works in preview,
  // and still ping Telegram so the enquiry isn't lost.
  if (!sb) {
    console.warn('[booking] Supabase not configured; lead not persisted:', { name, contact });
    await notifyTelegram({ ...lead, persisted: false });
    return NextResponse.json({ ok: true, persisted: false });
  }

  // Insert and read the new id back so the Telegram confirm/decline buttons
  // can reference this exact booking.
  const { data, error } = await sb
    .from('bookings')
    .insert({ ...lead, status: 'pending' })
    .select('id, public_token')
    .single();

  if (error || !data) {
    console.error('[booking] insert failed:', error?.message);
    // Notify anyway so the lead reaches you even if the DB write failed.
    await notifyTelegram({ ...lead, persisted: false });
    return NextResponse.json({ ok: false, error: 'Could not save' }, { status: 500 });
  }

  // Saved — notify. Telegram failure never affects the visitor's success response.
  const token = (data.public_token as string) || undefined;
  const repeatNote = await repeatCustomerNote(sb, contact, data.id as number).catch(() => null);
  await notifyTelegram({
    ...lead,
    id: data.id as number,
    public_token: token,
    persisted: true,
    repeatNote: repeatNote ?? undefined,
  });
  return NextResponse.json({ ok: true, persisted: true, token });
}
