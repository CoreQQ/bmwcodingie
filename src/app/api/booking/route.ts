import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { notifyTelegram } from '@/lib/telegram';
import { repeatCustomerNote, ensureClient, clientCode } from '@/lib/crm';
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
  const source = String(body.source ?? '').trim().slice(0, 160) || null;

  // Requested slot — optional. slot_date must be a plain YYYY-MM-DD date.
  const rawDate = String(body.slot_date ?? '').trim().slice(0, 10);
  const slot_date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
  const slot_time = String(body.slot_time ?? '').trim().slice(0, 40);

  if (!name || !contact) {
    return NextResponse.json({ ok: false, error: 'Name and contact required' }, { status: 400 });
  }

  const lead = { name, contact, bmw_model, service, message, slot_date, slot_time, source: source ?? undefined };
  const sb = getSupabaseAdmin();

  // No DB configured yet — accept the lead so the form still works in preview,
  // and still ping Telegram so the enquiry isn't lost.
  if (!sb) {
    console.warn('[booking] Supabase not configured; lead not persisted:', { name, contact });
    await notifyTelegram({ ...lead, persisted: false });
    return NextResponse.json({ ok: true, persisted: false });
  }

  // Insert and read the new id back so the Telegram confirm/decline buttons
  // can reference this exact booking. The source column is a recent addition —
  // if its migration hasn't run yet, retry without it rather than lose a lead.
  const row = { name, contact, bmw_model, service, message, slot_date, slot_time, source, status: 'pending' };
  let { data, error } = await sb.from('bookings').insert(row).select('id, public_token').single();
  if (error && /source/i.test(error.message)) {
    const { source: _dropped, ...withoutSource } = row;
    ({ data, error } = await sb.from('bookings').insert(withoutSource).select('id, public_token').single());
  }

  if (error || !data) {
    console.error('[booking] insert failed:', error?.message);
    // Notify anyway so the lead reaches you even if the DB write failed.
    await notifyTelegram({ ...lead, persisted: false });
    return NextResponse.json({ ok: false, error: 'Could not save' }, { status: 500 });
  }

  // Saved — notify. Telegram failure never affects the visitor's success response.
  const token = (data.public_token as string) || undefined;
  const [repeatNote, client] = await Promise.all([
    repeatCustomerNote(sb, contact, data.id as number).catch(() => null),
    ensureClient(sb, contact, name).catch(() => null),
  ]);

  // Blacklisted client: auto-decline so no slot is held, but the visitor
  // still sees a normal success — no hint that they're blocked.
  if (client?.banned) {
    await sb.from('bookings').update({ status: 'declined' }).eq('id', data.id);
    await notifyTelegram({
      ...lead,
      id: data.id as number,
      public_token: token,
      persisted: true,
      clientNote: `⛔️ <b>BLACKLISTED</b> · ${clientCode(client.id)}${client.ban_reason ? ` · ${client.ban_reason}` : ''} — auto-declined, slot not held`,
      repeatNote: repeatNote ?? undefined,
    });
    return NextResponse.json({ ok: true, persisted: true, token });
  }

  await notifyTelegram({
    ...lead,
    id: data.id as number,
    public_token: token,
    persisted: true,
    clientNote: client ? `🆔 <b>Client:</b> ${clientCode(client.id)}` : undefined,
    repeatNote: repeatNote ?? undefined,
  });
  return NextResponse.json({ ok: true, persisted: true, token });
}
