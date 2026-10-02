import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { notifyTelegram } from '@/lib/telegram';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

export const runtime = 'nodejs';

// "Check my BMW": the last 7 of the VIN, the model and what they want. With a
// phone number it becomes a normal enquiry Alex can work from the agenda;
// without one the visitor carries on in WhatsApp and Alex still gets a heads-up
// so the chat that follows has context. Never lose a lead: Telegram is told
// even if the database write fails.
export async function POST(req: Request) {
  if (isRateLimited(`vin:${clientIp(req)}`, 6, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: true, skipped: true });
  }
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const vin = String(body.vin ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(-7);
  const model = String(body.model ?? '').trim().slice(0, 80);
  const service = String(body.service ?? '').trim().slice(0, 80);
  const phone = String(body.phone ?? '').trim().slice(0, 40);
  const page = String(body.page ?? '').trim().slice(0, 120);
  if (vin.length !== 7) return NextResponse.json({ ok: false, error: 'vin' }, { status: 400 });

  const message = `VIN check · last 7: ${vin}${page ? ` · from ${page}` : ''}${phone ? '' : ' · continuing on WhatsApp'}`;
  const lead = {
    name: 'VIN check',
    contact: phone || 'WhatsApp (number arrives with their message)',
    bmw_model: model,
    service,
    message,
    slot_date: null,
    slot_time: '',
    source: '🔎 VIN check',
    landing: page || undefined,
  };

  const sb = getSupabaseAdmin();
  let id: number | undefined;
  if (sb && phone) {
    const res = await sb
      .from('bookings')
      .insert({ name: 'VIN check', contact: phone, bmw_model: model, service, message, status: 'pending' })
      .select('id')
      .single();
    id = (res.data as { id: number } | null)?.id;
  }
  await notifyTelegram({ ...lead, id, persisted: phone ? Boolean(id) : undefined }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
