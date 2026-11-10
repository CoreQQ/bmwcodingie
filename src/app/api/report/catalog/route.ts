import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The service rows shown on /models — and read by the invoice flow and the
// "paid" buttons for a default amount — live in the database. The Mini App
// edits a row's title and price, not its description or translations. When
// the owner changes a price by message (10 Nov 2026: Android Auto → €150),
// this is how that row is brought in step with pricing.ts. Diagnostics key.
//   GET  — the rows as stored.
//   POST — { id, price_label?, description?, translations? } for one row;
//          translations are merged per language. Answers with before / after.
//
// Keep price_label to ONE number ("from €150"): the paid buttons read the
// digits out of it.

type Row = {
  id: number;
  title: string;
  description: string;
  price_label: string;
  visible: boolean;
  translations: Record<string, Record<string, string>> | null;
};
const COLS = 'id, title, description, price_label, visible, translations';

const allowed = (req: Request) => {
  const key = new URL(req.url).searchParams.get('key') || '';
  return !!key && [process.env.WHATSAPP_VERIFY_TOKEN, process.env.MANYCHAT_SECRET].filter(Boolean).includes(key);
};

export async function GET(req: Request) {
  if (!allowed(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: 'no db' });
  const { data, error } = await sb.from('services').select(COLS).order('sort_order', { ascending: true });
  return NextResponse.json({ ok: !error, error: error?.message, rows: data ?? [] });
}

export async function POST(req: Request) {
  if (!allowed(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: 'no db' });
  const body = (await req.json().catch(() => null)) as {
    id?: number;
    price_label?: string;
    description?: string;
    translations?: Record<string, { title?: string; description?: string; price_label?: string }>;
  } | null;
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ ok: false, error: 'id' }, { status: 400 });

  const { data: before, error: readErr } = await sb.from('services').select(COLS).eq('id', id).maybeSingle();
  if (readErr || !before) return NextResponse.json({ ok: false, error: readErr?.message ?? 'not found' }, { status: 404 });
  const row = before as Row;

  const patch: Record<string, unknown> = {};
  if (typeof body?.price_label === 'string' && body.price_label.trim()) patch.price_label = body.price_label.trim().slice(0, 60);
  if (typeof body?.description === 'string' && body.description.trim()) patch.description = body.description.trim().slice(0, 600);
  if (body?.translations && typeof body.translations === 'object') {
    const merged: Record<string, Record<string, string>> = { ...(row.translations ?? {}) };
    for (const [locale, fields] of Object.entries(body.translations)) {
      const next = { ...(merged[locale] ?? {}) };
      for (const k of ['title', 'description', 'price_label'] as const) {
        const v = fields?.[k];
        if (typeof v === 'string' && v.trim()) next[k] = v.trim().slice(0, k === 'description' ? 600 : 160);
      }
      merged[locale] = next;
    }
    patch.translations = merged;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ ok: false, error: 'nothing to change' }, { status: 400 });

  const { data: after, error } = await sb.from('services').update(patch).eq('id', id).select(COLS).maybeSingle();
  if (error) return NextResponse.json({ ok: false, error: error.message, before });
  revalidatePath('/', 'layout');
  return NextResponse.json({ ok: true, before, after });
}
