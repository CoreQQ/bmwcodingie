import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Owner diagnostics: is the lead flow drying up, and where? Weekly and daily
// counts of enquiries by channel, new WhatsApp chats and on-site attention.
// Aggregates only — no names, numbers or message text. Guarded by a
// diagnostics key (WHATSAPP_VERIFY_TOKEN or MANYCHAT_SECRET).

const dayOf = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });

/** Monday of the Dublin week containing `day` (YYYY-MM-DD). */
function weekOf(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

function channel(b: { name?: string | null; source?: string | null }): string {
  const name = (b.name ?? '').toLowerCase();
  const src = (b.source ?? '').toLowerCase();
  if (name.startsWith('vin check') || src.includes('vin')) return 'vin_check';
  if (src.includes('ai chat')) return 'site_chat';
  if (src.includes('whatsapp')) return 'whatsapp_ai';
  if (src.includes('telegram') || src.includes('manual') || src.includes('owner')) return 'manual';
  return 'site_form';
}

async function all<T>(q: (from: number, to: number) => PromiseLike<{ data: T[] | null }>, cap = 20000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < cap; from += 1000) {
    const { data } = await q(from, from + 999);
    if (!data?.length) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

export async function GET(req: Request) {
  const key = new URL(req.url).searchParams.get('key') || '';
  const allowed = [process.env.WHATSAPP_VERIFY_TOKEN, process.env.MANYCHAT_SECRET].filter(Boolean);
  if (!key || !allowed.includes(key)) return NextResponse.json({ ok: false }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: 'no db' });

  const since = new Date(Date.now() - 8 * 7 * 86400000).toISOString();
  const [bookings, waMsgs, sections] = await Promise.all([
    all<{ name: string; source: string | null; landing: string | null; service: string; slot_date: string | null; status: string; created_at: string }>(
      (a, b) => sb.from('bookings').select('name, source, landing, service, slot_date, status, created_at').gt('created_at', since).order('created_at').range(a, b),
    ),
    all<{ wa_id: string; via: string; created_at: string }>(
      (a, b) => sb.from('wa_messages').select('wa_id, via, created_at').gt('created_at', since).order('created_at').range(a, b),
    ),
    all<{ path: string; created_at: string }>(
      (a, b) => sb.from('section_time').select('path, created_at').gt('created_at', since).order('created_at').range(a, b),
    ),
  ]);

  // First-ever message per WhatsApp contact inside the window = a new chat.
  const firstSeen = new Map<string, string>();
  for (const m of waMsgs) if (m.via === 'customer' && !firstSeen.has(m.wa_id)) firstSeen.set(m.wa_id, m.created_at);

  type Bucket = {
    leads: number;
    byChannel: Record<string, number>;
    withSlot: number;
    waNewChats: number;
    waCustomerMsgs: number;
    waActiveChats: number;
    attentionRows: number;
  };
  const empty = (): Bucket => ({ leads: 0, byChannel: {}, withSlot: 0, waNewChats: 0, waCustomerMsgs: 0, waActiveChats: 0, attentionRows: 0 });
  const weeks = new Map<string, Bucket>();
  const days = new Map<string, Bucket>();
  const active = new Map<string, Set<string>>();
  const bump = (day: string, f: (b: Bucket) => void) => {
    const w = weekOf(day);
    if (!weeks.has(w)) weeks.set(w, empty());
    if (!days.has(day)) days.set(day, empty());
    f(weeks.get(w)!);
    f(days.get(day)!);
  };

  for (const b of bookings) {
    const ch = channel(b);
    bump(dayOf(b.created_at), (x) => {
      x.leads += 1;
      x.byChannel[ch] = (x.byChannel[ch] ?? 0) + 1;
      if (b.slot_date) x.withSlot += 1;
    });
  }
  for (const [, at] of firstSeen) bump(dayOf(at), (x) => (x.waNewChats += 1));
  for (const m of waMsgs) {
    if (m.via !== 'customer') continue;
    const day = dayOf(m.created_at);
    bump(day, (x) => (x.waCustomerMsgs += 1));
    const w = weekOf(day);
    if (!active.has(w)) active.set(w, new Set());
    active.get(w)!.add(m.wa_id);
  }
  for (const s of sections) bump(dayOf(s.created_at), (x) => (x.attentionRows += 1));
  for (const [w, set] of active) if (weeks.has(w)) weeks.get(w)!.waActiveChats = set.size;

  const thisWeek = weekOf(dayOf(new Date().toISOString()));
  const recent = bookings.filter((b) => weekOf(dayOf(b.created_at)) === thisWeek || Date.now() - new Date(b.created_at).getTime() < 7 * 86400000);
  const tally = (pick: (b: (typeof bookings)[number]) => string) => {
    const m = new Map<string, number>();
    for (const b of recent) m.set(pick(b) || '(none)', (m.get(pick(b) || '(none)') ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  // Pages people actually looked at in the last 7 days (attention rows per path).
  const pathCount = new Map<string, number>();
  for (const s of sections) if (Date.now() - new Date(s.created_at).getTime() < 7 * 86400000) pathCount.set(s.path, (pathCount.get(s.path) ?? 0) + 1);

  return NextResponse.json({
    ok: true,
    note: 'attentionRows = section-visibility pings from consenting browsers (a traffic proxy, not visits).',
    weeks: [...weeks.entries()].sort().map(([week, v]) => ({ week, ...v })),
    days: [...days.entries()].sort().slice(-21).map(([day, v]) => ({ day, ...v })),
    last7days: {
      leadsByLanding: tally((b) => (b.landing ?? '').trim()),
      leadsByService: tally((b) => (b.service ?? '').trim()),
      leadsByChannel: tally((b) => channel(b)),
      topPages: [...pathCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15),
    },
  });
}
