import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { loadTopics } from '@/lib/telegram';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Diagnostics for a review of the site and the assistant (owner, 10 Nov 2026):
// visits and enquiries per day, the state of the Telegram group, and recent
// WhatsApp conversations to read how the assistant actually answered. Guarded
// by the diagnostics key. No phone numbers leave: chats are keyed by a short
// hash, profile names are dropped and long digit runs in messages are masked.

const day = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });
const mask = (s: string) => s.replace(/\+?\d[\d\s-]{7,}\d/g, (m) => (m.replace(/\D/g, '').length >= 9 ? '[number]' : m));
const tally = (rows: string[]) => {
  const out: Record<string, number> = {};
  for (const r of rows) out[r] = (out[r] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort((a, b) => (a[0] < b[0] ? -1 : 1)));
};
const top = (rows: string[], n = 12) =>
  Object.entries(tally(rows))
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);

async function tg(method: string, payload: Record<string, unknown>): Promise<unknown> {
  const token = process.env.TG_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return ((await res.json()) as { result?: unknown; description?: string }) ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key') || '';
  const allowed = [process.env.WHATSAPP_VERIFY_TOKEN, process.env.MANYCHAT_SECRET].filter(Boolean);
  if (!key || !allowed.includes(key)) return NextResponse.json({ ok: false }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: 'no db' });

  const part = url.searchParams.get('part') || 'site';
  const days = Math.min(Number(url.searchParams.get('days')) || 35, 90);
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // part=funnel — the business by week: enquiries, bookings, paid jobs and
  // what was asked for. "Few people lately" is answered here, not by visits.
  if (part === 'funnel') {
    const from = new Date(Date.now() - 120 * 86400000).toISOString();
    const weekOf = (iso: string) => {
      const d = new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Europe/Dublin' }));
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // back to Monday
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    type B = { created_at: string; slot_date: string | null; status: string; service: string | null; source: string | null };
    const bookings: B[] = [];
    for (let page = 0; page < 5; page++) {
      const { data } = await sb.from('bookings').select('created_at, slot_date, status, service, source').gt('created_at', from).order('created_at', { ascending: true }).range(page * 1000, page * 1000 + 999);
      bookings.push(...((data ?? []) as B[]));
      if ((data ?? []).length < 1000) break;
    }
    const { data: pay } = await sb.from('payments').select('created_at, amount, service').gt('created_at', from).order('created_at', { ascending: true }).limit(1000);
    const payments = (pay ?? []) as { created_at: string; amount: number; service: string | null }[];
    const waUsers: { wa_id: string; created_at: string }[] = [];
    for (let page = 0; page < 12; page++) {
      const { data } = await sb.from('wa_messages').select('wa_id, created_at').eq('role', 'user').order('created_at', { ascending: true }).range(page * 1000, page * 1000 + 999);
      waUsers.push(...((data ?? []) as { wa_id: string; created_at: string }[]));
      if ((data ?? []).length < 1000) break;
    }
    const firstSeen = new Map<string, string>();
    for (const m of waUsers) if (!firstSeen.has(m.wa_id)) firstSeen.set(m.wa_id, m.created_at);

    const weeks: Record<string, { enquiries: number; withSlot: number; jobsConfirmed: number; paidJobs: number; paid: number; waNewPeople: number; waActivePeople: number }> = {};
    const w = (k: string) => (weeks[k] ??= { enquiries: 0, withSlot: 0, jobsConfirmed: 0, paidJobs: 0, paid: 0, waNewPeople: 0, waActivePeople: 0 });
    for (const b of bookings) {
      w(weekOf(b.created_at)).enquiries += 1;
      if (b.slot_date) w(weekOf(b.created_at)).withSlot += 1;
      if (b.slot_date && b.status === 'confirmed') w(weekOf(`${b.slot_date}T12:00:00Z`)).jobsConfirmed += 1;
    }
    for (const p of payments) {
      w(weekOf(p.created_at)).paidJobs += 1;
      w(weekOf(p.created_at)).paid += Number(p.amount) || 0;
    }
    for (const at of firstSeen.values()) if (at >= from) w(weekOf(at)).waNewPeople += 1;
    const active = new Map<string, Set<string>>();
    for (const m of waUsers) {
      if (m.created_at < from) continue;
      const k = weekOf(m.created_at);
      if (!active.has(k)) active.set(k, new Set());
      active.get(k)!.add(m.wa_id);
    }
    for (const [k, set] of active) w(k).waActivePeople = set.size;

    const mid = new Date(Date.now() - 30 * 86400000).toISOString();
    const prev = new Date(Date.now() - 60 * 86400000).toISOString();
    const svc = (rows: B[]) => top(rows.map((r) => (r.service || '(not said)').slice(0, 40)), 15);
    return NextResponse.json({
      ok: true,
      waHistoryFrom: waUsers[0]?.created_at ?? null,
      weeks: Object.fromEntries(Object.entries(weeks).sort((a, b) => (a[0] < b[0] ? -1 : 1))),
      statusLast60: top(bookings.filter((b) => b.created_at >= prev).map((b) => `${b.slot_date ? 'slot' : 'enquiry'}:${b.status}`), 12),
      servicesLast30: svc(bookings.filter((b) => b.created_at >= mid)),
      servicesPrev30: svc(bookings.filter((b) => b.created_at < mid && b.created_at >= prev)),
      paymentsByService: top(payments.map((p) => `${(p.service || '?').slice(0, 30)} · €${Math.round(Number(p.amount) || 0)}`), 40),
    });
  }

  if (part === 'site') {
    const [{ data: visits, error: vErr }, { data: leads }] = await Promise.all([
      sb.from('site_visits').select('created_at, path, referrer, source, device, country, is_returning').gt('created_at', since).order('created_at', { ascending: true }).limit(20000),
      sb.from('bookings').select('created_at, source, slot_date, status, landing').gt('created_at', since).order('created_at', { ascending: true }).limit(5000),
    ]);
    const v = (visits ?? []) as { created_at: string; path: string; referrer: string | null; source: string | null; device: string | null; country: string | null; is_returning: boolean }[];
    const l = (leads ?? []) as { created_at: string; source: string | null; slot_date: string | null; status: string; landing: string | null }[];
    const mid = new Date(Date.now() - 14 * 86400000).toISOString();
    const prev = new Date(Date.now() - 28 * 86400000).toISOString();
    const last14 = v.filter((r) => r.created_at >= mid);
    const prev14 = v.filter((r) => r.created_at < mid && r.created_at >= prev);
    const host = (r: string | null) => {
      if (!r) return '(direct)';
      try {
        return new URL(r).hostname.replace(/^www\./, '');
      } catch {
        return r.slice(0, 40);
      }
    };

    const chatId = process.env.TG_CHAT_ID;
    const me = (await tg('getMe', {})) as { result?: { id?: number } } | null;
    const chat = (await tg('getChat', { chat_id: chatId })) as { result?: { is_forum?: boolean; type?: string } } | null;
    const member = me?.result?.id ? ((await tg('getChatMember', { chat_id: chatId, user_id: me.result.id })) as { result?: Record<string, unknown> } | null) : null;

    return NextResponse.json({
      ok: true,
      visitsError: vErr?.message,
      visitsPerDay: tally(v.map((r) => day(r.created_at))),
      newVisitorsPerDay: tally(v.filter((r) => !r.is_returning).map((r) => day(r.created_at))),
      leadsPerDay: tally(l.map((r) => day(r.created_at))),
      leadsBySource: top(l.map((r) => r.source || '(site form)')),
      last14: { total: last14.length, referrers: top(last14.map((r) => host(r.referrer))), sources: top(last14.map((r) => r.source || '(none)')), paths: top(last14.map((r) => r.path)), device: top(last14.map((r) => r.device || '?')), country: top(last14.map((r) => r.country || '?')) },
      prev14: { total: prev14.length, referrers: top(prev14.map((r) => host(r.referrer))), sources: top(prev14.map((r) => r.source || '(none)')), paths: top(prev14.map((r) => r.path)), device: top(prev14.map((r) => r.device || '?')), country: top(prev14.map((r) => r.country || '?')) },
      telegram: {
        chatType: chat?.result?.type,
        isForum: chat?.result?.is_forum ?? false,
        botStatus: member?.result?.status,
        botCanManageTopics: member?.result?.can_manage_topics,
        topics: await loadTopics(true),
      },
    });
  }

  // part=wa — recent conversations, newest chats first. Supabase returns at
  // most 1000 rows per request, so read newest-first in pages.
  type Row = { wa_id: string; role: string; via: string | null; content: string; created_at: string };
  const rows: Row[] = [];
  for (let page = 0; page < 8; page++) {
    const { data } = await sb
      .from('wa_messages')
      .select('wa_id, role, via, content, created_at')
      .gt('created_at', since)
      .order('created_at', { ascending: false })
      .range(page * 1000, page * 1000 + 999);
    const got = (data ?? []) as Row[];
    rows.push(...got);
    if (got.length < 1000) break;
  }
  rows.reverse();
  const perDay: Record<string, { customer: number; ai: number; owner: number }> = {};
  const chats = new Map<string, { at: string; who: string; text: string }[]>();
  for (const m of rows) {
    const who = m.via === 'customer' ? 'C' : m.via === 'owner' ? 'ALEX' : 'AI';
    const d = day(m.created_at);
    perDay[d] ??= { customer: 0, ai: 0, owner: 0 };
    perDay[d][who === 'C' ? 'customer' : who === 'AI' ? 'ai' : 'owner'] += 1;
    const id = crypto.createHash('sha256').update(m.wa_id).digest('hex').slice(0, 6);
    if (!chats.has(id)) chats.set(id, []);
    chats.get(id)!.push({ at: m.created_at.slice(5, 16).replace('T', ' '), who, text: mask(m.content ?? '').slice(0, 900) });
  }
  const from = url.searchParams.get('from') || '';
  const list = [...chats.entries()]
    .map(([id, messages]) => ({ id, messages }))
    // Chats where the assistant spoke, or a customer wrote and nobody answered.
    .filter((c) => c.messages.some((m) => m.who === 'AI') || !c.messages.some((m) => m.who === 'ALEX'))
    .filter((c) => !from || c.messages[c.messages.length - 1].at >= from)
    .sort((a, b) => (a.messages[a.messages.length - 1].at < b.messages[b.messages.length - 1].at ? 1 : -1));
  const offset = Number(url.searchParams.get('offset')) || 0;
  const limit = Math.min(Number(url.searchParams.get('limit')) || 25, 80);
  const { data: cfg } = await sb.from('app_config').select('value').eq('key', 'wa_ai_owner').maybeSingle();
  return NextResponse.json({
    ok: true,
    rows: rows.length,
    assistantSwitch: (cfg as { value?: string } | null)?.value ?? '(unset = on)',
    perDay,
    chats: list.length,
    shown: list.slice(offset, offset + limit),
  });
}
