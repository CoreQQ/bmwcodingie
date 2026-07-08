import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { parseUserAgent } from '@/lib/parseUserAgent';
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
  const how_heard = String(body.how_heard ?? '').trim().slice(0, 60) || null;
  const contact_pref = String(body.contact_pref ?? '').trim().slice(0, 120) || null;
  const landing = String(body.landing ?? '').trim().slice(0, 120) || null;
  const dwell = String(body.dwell ?? '').trim().slice(0, 20) || undefined;

  // Free context from the request itself — no extra form fields needed.
  const ua = req.headers.get('user-agent') || '';
  const { browser, os } = parseUserAgent(ua);
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
  const device = ua ? `${isMobile ? 'Mobile' : 'Desktop'}${os ? ` · ${os}` : ''}${browser ? ` · ${browser}` : ''}` : undefined;
  const acceptLang = (req.headers.get('accept-language') || '').split(',')[0].trim().slice(0, 20);
  const language = String(body.language ?? '').trim().slice(0, 20) || acceptLang || undefined;

  // Requested slot — optional. slot_date must be a plain YYYY-MM-DD date.
  const rawDate = String(body.slot_date ?? '').trim().slice(0, 10);
  const slot_date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : null;
  const slot_time = String(body.slot_time ?? '').trim().slice(0, 40);

  if (!name || !contact) {
    return NextResponse.json({ ok: false, error: 'Name and contact required' }, { status: 400 });
  }

  const lead = { name, contact, bmw_model, service, message, slot_date, slot_time, source: source ?? undefined, howHeard: how_heard ?? undefined, contactPref: contact_pref ?? undefined, landing: landing ?? undefined, device, language, dwell };
  const sb = getSupabaseAdmin();

  // No DB configured yet — accept the lead so the form still works in preview,
  // and still ping Telegram so the enquiry isn't lost.
  if (!sb) {
    console.warn('[booking] Supabase not configured; lead not persisted:', { name, contact });
    await notifyTelegram({ ...lead, persisted: false });
    return NextResponse.json({ ok: true, persisted: false });
  }

  // Insert and read the new id back so the Telegram confirm/decline buttons
  // can reference this exact booking. Some columns (source, how_heard,
  // contact_pref, landing) are recent additions — if a migration hasn't run,
  // drop the offending column and retry rather than lose a lead.
  const row: Record<string, unknown> = {
    name, contact, bmw_model, service, message, slot_date, slot_time,
    source, how_heard, contact_pref, landing, status: 'pending',
  };
  let data: { id: number; public_token: string } | null = null;
  let error: { message: string } | null = null;
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await sb.from('bookings').insert(row).select('id, public_token').single();
    data = (res.data as { id: number; public_token: string } | null) ?? null;
    error = res.error;
    if (!error) break;
    // PostgREST names the missing column in the error — strip it and retry.
    const missing = /'(\w+)' column|column "?(\w+)"?/i.exec(error.message);
    const col = missing?.[1] || missing?.[2];
    if (col && col in row && col !== 'name' && col !== 'contact') delete row[col];
    else break;
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
