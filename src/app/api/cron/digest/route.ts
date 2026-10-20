import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOwnerWithMarkup } from '@/lib/telegram';
import { unansweredChats } from '@/lib/agenda';

export const runtime = 'nodejs';
// Never prerender: without CRON_SECRET the handler reads nothing from the
// request, so Next built it as a static page — it ran once per deploy (the
// "duplicate agenda" messages) and the real 08:00 call got the cached copy.
export const dynamic = 'force-dynamic';

// Evening digest (Vercel cron, 21:00 UTC — 21:00 Irish winter time, 22:00 in
// summer; see vercel.json). One message about the last 24 hours instead of a
// Telegram ping per visitor: who came and from where, what they asked, how
// WhatsApp went, the money, and tomorrow.

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Top entries of a tally as "a 5 · b 3 · c 2". */
function top(counts: Map<string, number>, n: number): string {
  return [...counts]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `${esc(k)} ${v}`)
    .join(' · ');
}

function tally(values: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const v of values) if (v) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

/** "google / cpc / carplay" or a referrer URL → "google"; nothing → "direct". */
function cameVia(source: string | null, referrer: string | null): string {
  if (source) return source.split(/[\s/]+/)[0].toLowerCase();
  if (!referrer) return 'direct';
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, '');
    if (host.endsWith('bmwcoding.ie')) return 'direct';
    return host.split('.').slice(-2, -1)[0] || host;
  } catch {
    return 'other';
  }
}

function channel(b: { name?: string | null; source?: string | null }): string {
  const name = (b.name ?? '').toLowerCase();
  const src = (b.source ?? '').toLowerCase();
  if (name.startsWith('vin check') || src.includes('vin')) return 'VIN check';
  if (src.includes('ai chat')) return 'site chat';
  if (src.includes('whatsapp')) return 'WhatsApp';
  if (src.includes('telegram') || src.includes('manual') || src.includes('owner')) return 'added by you';
  return 'site form';
}

export async function GET(req: Request) {
  // Vercel's cron sends "Bearer CRON_SECRET"; without the secret set, at
  // least insist on its user agent so a stranger cannot fire the run.
  const secret = process.env.CRON_SECRET;
  const fromCron = secret
    ? req.headers.get('authorization') === `Bearer ${secret}`
    : /vercel-cron/i.test(req.headers.get('user-agent') || '');
  if (!fromCron) return NextResponse.json({ ok: false }, { status: 401 });
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, skipped: 'no-db' });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });

  const [visits, attention, leads, wa, pays, nextDay, waiting] = await Promise.all([
    sb.from('site_visits').select('path, referrer, source, city, is_returning').gt('created_at', since).limit(5000),
    sb.from('section_time').select('path').gt('created_at', since).limit(20000),
    sb.from('bookings').select('name, source, service').gt('created_at', since).limit(500),
    sb.from('wa_messages').select('wa_id, role, via, content').gt('created_at', since).limit(5000),
    sb.from('payments').select('amount').gt('created_at', since).limit(500),
    sb
      .from('bookings')
      .select('name, service, slot_time, status')
      .eq('slot_date', tomorrow)
      .in('status', ['pending', 'confirmed'])
      .order('slot_time', { ascending: true }),
    unansweredChats(sb).catch(() => []),
  ]);

  const day = new Date().toLocaleDateString('en-IE', { timeZone: 'Europe/Dublin', weekday: 'short', day: 'numeric', month: 'short' });
  const lines = [`🌙 <b>Day summary</b> · ${day}`, '━━━━━━━━━━━━━━━━━━━'];

  // Visitors. Until the site_visits table exists (supabase/schema.sql), the
  // section-attention pings stand in as a rough traffic signal.
  type Visit = { path: string; referrer: string | null; source: string | null; city: string | null; is_returning: boolean };
  if (!visits.error) {
    const v = (visits.data ?? []) as Visit[];
    const back = v.filter((x) => x.is_returning).length;
    lines.push(`👀 <b>Visitors:</b> ${v.length}${back ? ` (${back} returning)` : ''}`);
    if (v.length) {
      lines.push(`   Pages: ${top(tally(v.map((x) => x.path)), 4)}`);
      lines.push(`   Came via: ${top(tally(v.map((x) => cameVia(x.source, x.referrer))), 4)}`);
      const cities = top(tally(v.map((x) => x.city ?? '')), 3);
      if (cities) lines.push(`   From: ${cities}`);
    }
  } else {
    const a = (attention.data ?? []) as { path: string }[];
    lines.push(`👀 <b>Site activity:</b> ${a.length} section views${a.length ? ` · ${top(tally(a.map((x) => x.path)), 4)}` : ''}`);
    lines.push('   <i>Exact visitor counts start once site_visits is created in Supabase.</i>');
  }

  const l = (leads.data ?? []) as { name: string | null; source: string | null; service: string | null }[];
  lines.push('', `📥 <b>Enquiries:</b> ${l.length}${l.length ? ` — ${top(tally(l.map(channel)), 5)}` : ''}`);

  const m = (wa.data ?? []) as { wa_id: string; role: string; via: string | null; content: string }[];
  const fromCustomers = m.filter((x) => x.role === 'user');
  const chats = new Set(fromCustomers.map((x) => x.wa_id)).size;
  const byAi = m.filter((x) => x.via === 'ai').length;
  const byYou = m.filter((x) => x.via === 'owner' && !x.content.startsWith('[Alex] (handled')).length;
  lines.push(`💬 <b>WhatsApp:</b> ${chats} chat${chats === 1 ? '' : 's'} · ${fromCustomers.length} messages in · ${byAi} answered by the assistant · ${byYou} by you`);
  if (waiting.length) lines.push(`⏳ <b>${waiting.length} still waiting for a reply</b>`);

  const p = (pays.data ?? []) as { amount: number }[];
  if (p.length) {
    const sum = p.reduce((a, x) => a + Number(x.amount || 0), 0);
    lines.push(`💶 <b>Money:</b> €${sum.toFixed(0)} (${p.length} payment${p.length === 1 ? '' : 's'})`);
  }

  const t = (nextDay.data ?? []) as { name: string; service: string | null; slot_time: string; status: string }[];
  lines.push('', `📅 <b>Tomorrow:</b> ${t.length ? '' : 'nothing booked'}`);
  for (const b of t.slice(0, 6)) {
    lines.push(`   ${b.status === 'confirmed' ? '✅' : '⏳'} ${esc(b.slot_time)} — ${esc(b.name)}${b.service ? ` · ${esc(b.service)}` : ''}`);
  }

  const buttons = [
    ...(waiting.length ? [[{ text: `⏳ WhatsApp waiting (${waiting.length})`, callback_data: 'wapend' }]] : []),
    [{ text: '⏰ Agenda', callback_data: 'agenda' }],
  ];
  await sendOwnerWithMarkup(lines.join('\n'), { inline_keyboard: buttons });
  return NextResponse.json({ ok: true });
}
