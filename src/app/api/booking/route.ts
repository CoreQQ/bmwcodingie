import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function POST(req: Request) {
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

  const sb = getSupabaseAdmin();
  if (!sb) {
    // No DB configured yet — accept the lead so the form still works in preview.
    console.warn('[booking] Supabase not configured; lead not persisted:', { name, contact });
    return NextResponse.json({ ok: true, persisted: false });
  }

  const { error } = await sb
    .from('bookings')
    .insert({ name, contact, bmw_model, service, message });

  if (error) {
    console.error('[booking] insert failed:', error.message);
    return NextResponse.json({ ok: false, error: 'Could not save' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, persisted: true });
}
