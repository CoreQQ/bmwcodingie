import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { notifyTelegram } from '@/lib/telegram';
import { clientIp, isRateLimited } from '@/lib/rateLimit';
import { normalizePhone } from '@/lib/phone';
import { cleanVin, isFullVin } from '@/lib/vin';

export const runtime = 'nodejs';

// "Check my BMW": the full VIN, the model and what they want. With a
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
  const vin = cleanVin(String(body.vin ?? '')).slice(0, 17);
  const model = String(body.model ?? '').trim().slice(0, 80);
  const service = String(body.service ?? '').trim().slice(0, 80);
  const phone = normalizePhone(String(body.phone ?? '').slice(0, 40));
  const page = String(body.page ?? '').trim().slice(0, 120);
  // The form asks for all 17; a page cached from before still sends the last 7,
  // and that lead is kept rather than lost.
  if (vin.length < 7) return NextResponse.json({ ok: false, error: 'vin' }, { status: 400 });
  // The form requires a valid number; a request without one is not a lead.
  if (!phone) return NextResponse.json({ ok: false, error: 'phone' }, { status: 400 });

  const message = `VIN check · ${isFullVin(vin) ? 'VIN' : 'part of VIN'}: ${vin}${page ? ` · from ${page}` : ''}`;
  const lead = {
    name: model ? `VIN check · ${model}` : 'VIN check',
    contact: phone,
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
  if (sb) {
    const res = await sb
      .from('bookings')
      .insert({ name: lead.name, contact: phone, bmw_model: model, service, message, status: 'pending' })
      .select('id')
      .single();
    id = (res.data as { id: number } | null)?.id;
  }
  await notifyTelegram({ ...lead, id, persisted: Boolean(id) }).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
