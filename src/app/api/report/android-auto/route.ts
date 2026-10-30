import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOwnerWithMarkup } from '@/lib/telegram';
import { phoneKey } from '@/lib/crm';
import { normalizePhone } from '@/lib/phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Owner request, 30 Oct 2026: now that Android Auto works on NBT Evo, send
// him one Telegram message listing everyone who asked for Android Auto —
// WhatsApp chats and site enquiries — sorted into "looks like NBT Evo" and
// "system not clear", with a ready message to copy to them. Guarded by the
// diagnostics key; each call sends the message again, so call it once.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

type Person = {
  key: string;
  name: string;
  phone: string; // digits with country code, for wa.me
  first: string; // ISO date of the first ask
  via: Set<string>;
  quote: string;
  texts: string[];
  car: string;
};

const NEWER = /\bG\d{2}\b|idrive\s?[78]|\bmgu\b|\bid\s?[78](?:\.5)?\b/i;
const OLDER = /\bnbt\b|\bevo\b|\bid\s?[56]\b|idrive\s?[56]|\bF\d{2}\b|\b201[5-9]\b/i;

function system(p: Person): 'nbt' | 'newer' | 'unknown' {
  const all = [p.car, ...p.texts].join(' \n ');
  const older = OLDER.test(all);
  const newer = NEWER.test(all);
  if (older && !newer) return 'nbt';
  if (newer && !older) return 'newer';
  return 'unknown';
}

function carHint(text: string): string {
  const chassis = text.match(/\b([EFG]\d{2})\b/i)?.[1]?.toUpperCase() ?? '';
  const year = text.match(/\b(20[012]\d)\b/)?.[1] ?? '';
  return [chassis, year].filter(Boolean).join(' ');
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key') || '';
  const allowed = [process.env.WHATSAPP_VERIFY_TOKEN, process.env.MANYCHAT_SECRET].filter(Boolean);
  if (!key || !allowed.includes(key)) return NextResponse.json({ ok: false }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: 'no db' });

  const [{ data: waHits }, { data: bookings }] = await Promise.all([
    sb.from('wa_messages').select('wa_id, content, created_at').eq('role', 'user').ilike('content', '%android%').order('created_at', { ascending: true }).limit(2000),
    sb
      .from('bookings')
      .select('name, contact, bmw_model, service, message, source, created_at')
      .or('service.ilike.%android%,message.ilike.%android%')
      .order('created_at', { ascending: true })
      .limit(1000),
  ]);

  const people = new Map<string, Person>();
  const touch = (k: string, init: () => Person) => {
    if (!people.has(k)) people.set(k, init());
    return people.get(k)!;
  };

  const waIds = [...new Set(((waHits ?? []) as { wa_id: string }[]).map((m) => m.wa_id))];
  const [{ data: chats }, { data: convo }] = waIds.length
    ? await Promise.all([
        sb.from('wa_chats').select('wa_id, name').in('wa_id', waIds),
        sb.from('wa_messages').select('wa_id, role, content').in('wa_id', waIds).limit(8000),
      ])
    : [{ data: [] }, { data: [] }];
  const names = new Map(((chats ?? []) as { wa_id: string; name: string | null }[]).map((c) => [c.wa_id, c.name ?? '']));
  const allText = new Map<string, string[]>();
  for (const m of (convo ?? []) as { wa_id: string; role: string; content: string }[]) {
    if (!allText.has(m.wa_id)) allText.set(m.wa_id, []);
    allText.get(m.wa_id)!.push(m.content ?? '');
  }

  for (const m of (waHits ?? []) as { wa_id: string; content: string; created_at: string }[]) {
    const k = phoneKey(m.wa_id) || m.wa_id;
    const p = touch(k, () => ({
      key: k,
      name: names.get(m.wa_id) || '',
      phone: m.wa_id.replace(/\D/g, ''),
      first: m.created_at,
      via: new Set(),
      quote: m.content,
      texts: allText.get(m.wa_id) ?? [m.content],
      car: '',
    }));
    p.via.add('WhatsApp');
  }

  for (const b of (bookings ?? []) as { name: string; contact: string; bmw_model: string | null; service: string | null; message: string | null; source: string | null; created_at: string }[]) {
    const e164 = normalizePhone(b.contact ?? '');
    const k = phoneKey(b.contact ?? '') || `name:${(b.name ?? '').toLowerCase()}`;
    const p = touch(k, () => ({
      key: k,
      name: b.name ?? '',
      phone: e164 ? e164.slice(1) : '',
      first: b.created_at,
      via: new Set(),
      quote: [b.service, b.message].filter(Boolean).join(' — '),
      texts: [],
      car: '',
    }));
    if (!p.name) p.name = b.name ?? '';
    if (!p.phone && e164) p.phone = e164.slice(1);
    if (b.bmw_model) p.car = p.car || b.bmw_model;
    p.texts.push([b.bmw_model, b.service, b.message].filter(Boolean).join(' '));
    p.via.add((b.source ?? '').toLowerCase().includes('whatsapp') ? 'WhatsApp' : 'site');
  }

  const list = [...people.values()].map((p) => ({ ...p, sys: system(p), hint: p.car || carHint(p.texts.join(' ')) }));
  const nbt = list.filter((p) => p.sys === 'nbt');
  const unknown = list.filter((p) => p.sys === 'unknown');
  const newer = list.filter((p) => p.sys === 'newer');

  const day = (iso: string) => new Date(iso).toLocaleDateString('en-IE', { timeZone: 'Europe/Dublin', day: 'numeric', month: 'short' });
  const line = (p: (typeof list)[number], i: number) => {
    const who = p.phone ? `<a href="https://wa.me/${p.phone}">+${p.phone}</a>` : '—';
    const quote = p.quote.replace(/\s+/g, ' ').slice(0, 90);
    return (
      `${i + 1}. <b>${esc(p.name || 'No name')}</b> · ${who} · ${day(p.first)} · ${[...p.via].join(', ')}` +
      `\n    ${p.hint ? `🚙 ${esc(p.hint)} · ` : ''}«${esc(quote)}${p.quote.length > 90 ? '…' : ''}»`
    );
  };

  const head = [
    '📋 <b>Android Auto on NBT Evo — who asked</b>',
    `${list.length} people asked about Android Auto: <b>${nbt.length}</b> look like NBT Evo, <b>${unknown.length}</b> need a check` +
      (newer.length ? `, ${newer.length} on iDrive 7+ left out (they could always have it).` : '.'),
  ];
  const parts: string[] = [];
  if (nbt.length) parts.push('', '✅ <b>Looks like NBT Evo</b> (F-series / iDrive 6)', ...nbt.map(line));
  if (unknown.length) parts.push('', '❓ <b>System not clear — check the VIN</b>', ...unknown.map(line));
  if (!list.length) parts.push('', 'Nobody has asked about Android Auto in the stored chats and enquiries.');

  // Telegram caps a message at 4096 characters: keep whole lines, say what was cut.
  let text = head.join('\n');
  let shown = 0;
  const total = parts.filter((l) => /^\d+\./.test(l)).length;
  for (const l of parts) {
    if ((text + '\n' + l).length > 3900) break;
    text += '\n' + l;
    if (/^\d+\./.test(l)) shown += 1;
  }
  if (shown < total) text += `\n\n…and ${total - shown} more.`;

  const outreach =
    "Hi! Good news: Android Auto now works on NBT Evo (iDrive 6) BMWs. It's €250, still in beta (done at your own risk), and you only pay if you see it working. Want me to check your car? Send me the last 7 of your VIN.";
  const sent = await sendOwnerWithMarkup(text, {
    inline_keyboard: [[{ text: '📋 Copy message for them', copy_text: { text: outreach } }]],
  });

  return NextResponse.json({ ok: true, sent, total: list.length, nbt: nbt.length, unknown: unknown.length, newer: newer.length, shown });
}
