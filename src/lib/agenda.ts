import type { SupabaseClient } from '@supabase/supabase-js';
import type { InlineButton, InlineKeyboard } from '@/lib/telegram';

// The owner's morning view of the business: today, tomorrow, and everyone still
// waiting on him. Lives here rather than in the cron so the bot can rebuild the
// same screen when he navigates back from an enquiry.

export type AgendaLead = {
  id: number;
  name: string;
  contact: string;
  service?: string;
  bmw_model?: string;
  message?: string;
  slot_date?: string | null;
  slot_time?: string | null;
  status?: string;
  created_at?: string;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const dayKey = (offset: number) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

/** People, not rows: the same customer can leave several enquiries behind. */
function collapse(rows: AgendaLead[]): { leads: AgendaLead[]; extras: Map<number, number> } {
  const seen = new Map<string, AgendaLead>();
  const counted = new Map<string, number>();
  for (const b of rows) {
    const phone = (b.contact ?? '').replace(/\D/g, '');
    // Match on the number when we have one, otherwise on the name — the same
    // person can reach us from the website and from WhatsApp.
    const key = phone.length >= 7 ? phone : (b.name ?? '').trim().toLowerCase() || `#${b.id}`;
    if (seen.has(key)) counted.set(key, (counted.get(key) ?? 0) + 1);
    seen.set(key, b); // the newest row knows the most
  }
  const extras = new Map<number, number>();
  for (const [key, lead] of seen) extras.set(lead.id, counted.get(key) ?? 0);
  return { leads: [...seen.values()], extras };
}

/** How long an unanswered enquiry stays on the list before it is considered stale. */
const WAITING_MAX_DAYS = 14;

/**
 * Everyone whose enquiry has been sitting unanswered for over a day. The list
 * used to keep everyone forever — Alex answers on his phone, and nothing told
 * the agenda he had. Now an enquiry leaves it when he replies in WhatsApp
 * (owner echo), uses /wa or "I'll reply", taps "Answered", or after two weeks.
 */
export async function waitingLeads(sb: SupabaseClient): Promise<{ leads: AgendaLead[]; extras: Map<number, number> }> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const staleAt = new Date(Date.now() - WAITING_MAX_DAYS * 86400000).toISOString();
  const { data } = await sb
    .from('bookings')
    .select('id, name, contact, service, bmw_model, message, slot_date, slot_time, status, created_at')
    .eq('status', 'pending')
    .eq('handled', false)
    .lt('created_at', dayAgo)
    .gt('created_at', staleAt)
    .order('created_at', { ascending: true })
    .limit(60);
  const { leads, extras } = collapse((data ?? []) as AgendaLead[]);
  return { leads: leads.slice(0, 10), extras };
}

/** Same person, any format: compare the last 9 digits (drops +353 / 0 prefixes). */
const phoneKey = (s: string) => (s ?? '').replace(/\D/g, '').slice(-9);

/**
 * Mark every open enquiry from this number as handled — Alex has answered
 * them. Matching is done here because stored contacts come in every format
 * ("+353 87…", "087…", "353…"). Returns how many enquiries were cleared.
 */
export async function markContactHandled(sb: SupabaseClient, contact: string): Promise<number> {
  const key = phoneKey(contact);
  if (key.length < 7) return 0;
  const since = new Date(Date.now() - 60 * 86400000).toISOString();
  const { data } = await sb
    .from('bookings')
    .select('id, contact')
    .eq('status', 'pending')
    .eq('handled', false)
    .gt('created_at', since)
    .limit(500);
  const ids = ((data ?? []) as { id: number; contact: string }[]).filter((r) => phoneKey(r.contact) === key).map((r) => r.id);
  if (!ids.length) return 0;
  await sb.from('bookings').update({ handled: true }).in('id', ids);
  return ids.length;
}

/** Clear the whole "waiting" list at once (the agenda's "all answered" button). */
export async function markAllWaitingHandled(sb: SupabaseClient): Promise<number> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await sb
    .from('bookings')
    .select('id')
    .eq('status', 'pending')
    .eq('handled', false)
    .lt('created_at', dayAgo)
    .limit(500);
  const ids = ((data ?? []) as { id: number }[]).map((r) => r.id);
  if (ids.length) await sb.from('bookings').update({ handled: true }).in('id', ids);
  return ids.length;
}

// ── WhatsApp chats nobody has answered ─────────────────────────────
// The customer spoke last and neither the assistant nor Alex (from his phone,
// a swipe-reply or /wa) has answered since. This is the list that would have
// caught everyone left hanging while sending was broken (14–20 Oct).

export type PendingChat = { waId: string; name: string; text: string; at: string };

/** Messages that need no answer: a 👍 reaction, a system notice. */
const NO_REPLY_NEEDED = /^\[(reaction|system|unsupported)\]/;
const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function unansweredChats(sb: SupabaseClient, days = 7): Promise<PendingChat[]> {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const { data } = await sb
    .from('wa_messages')
    .select('wa_id, role, content, created_at')
    .gt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(4000);
  const last = new Map<string, { role: string; content: string; created_at: string }>();
  for (const m of (data ?? []) as { wa_id: string; role: string; content: string; created_at: string }[]) {
    if (last.has(m.wa_id) || NO_REPLY_NEEDED.test(m.content ?? '')) continue;
    last.set(m.wa_id, m);
  }
  const waiting = [...last].filter(([id, m]) => m.role === 'user' && /^\d{8,15}$/.test(id));
  if (!waiting.length) return [];
  const { data: chats } = await sb.from('wa_chats').select('wa_id, name').in('wa_id', waiting.map(([id]) => id));
  const names = new Map(((chats ?? []) as { wa_id: string; name: string | null }[]).map((c) => [c.wa_id, c.name ?? '']));
  // Longest wait first.
  return waiting
    .map(([waId, m]) => ({ waId, name: names.get(waId) || '', text: m.content, at: m.created_at }))
    .sort((a, b) => a.at.localeCompare(b.at));
}

function ago(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  return h < 1 ? 'just now' : h < 48 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

/** The "who is waiting on WhatsApp" screen, one row of buttons per person. */
export function buildPendingWa(list: PendingChat[]): { text: string; keyboard: InlineKeyboard } {
  if (!list.length) {
    return {
      text: '✅ <b>WhatsApp</b> — nobody is waiting for a reply.',
      keyboard: { inline_keyboard: [[{ text: '← Agenda', callback_data: 'agenda' }]] },
    };
  }
  const shown = list.slice(0, 10);
  const lines = [`⏳ <b>WhatsApp — waiting for a reply</b> (${list.length})`, '━━━━━━━━━━━━━━━━━━━'];
  for (const c of shown) {
    lines.push(`<b>${esc(c.name || 'No name')}</b> · <code>+${c.waId}</code> · ${ago(c.at)}`);
    lines.push(`  «${esc(c.text.slice(0, 120))}${c.text.length > 120 ? '…' : ''}»`);
  }
  if (list.length > shown.length) lines.push(`…and ${list.length - shown.length} more.`);
  lines.push(
    '',
    '🤖 the assistant answers now (only within 24h of their message) · 💬 open the chat · ✅ you dealt with it another way',
  );
  const buttons: InlineButton[][] = shown.map((c) => {
    const first = (c.name || `+${c.waId}`).split(/\s+/)[0].slice(0, 14);
    const row: InlineButton[] = [];
    if (Date.now() - new Date(c.at).getTime() < SERVICE_WINDOW_MS) row.push({ text: `🤖 ${first}`, callback_data: `war:${c.waId}` });
    row.push({ text: `💬 ${first}`, url: `https://wa.me/${c.waId}` });
    row.push({ text: '✅', callback_data: `wadone:${c.waId}` });
    return row;
  });
  buttons.push([{ text: '← Agenda', callback_data: 'agenda' }]);
  return { text: lines.join('\n'), keyboard: { inline_keyboard: buttons } };
}

/** The whole morning message, ready to send or to edit back into. */
export async function buildAgenda(
  sb: SupabaseClient,
): Promise<{ text: string; keyboard?: InlineKeyboard; empty: boolean }> {
  const today = dayKey(0);
  const tomorrow = dayKey(1);

  const [{ data: slotData }, waiting, waPending] = await Promise.all([
    sb
      .from('bookings')
      .select('id, name, contact, service, slot_date, slot_time, status')
      .in('slot_date', [today, tomorrow])
      .in('status', ['pending', 'confirmed'])
      .order('slot_time', { ascending: true }),
    waitingLeads(sb),
    unansweredChats(sb).catch(() => [] as PendingChat[]),
  ]);
  const rows = (slotData ?? []) as AgendaLead[];

  const icon = (s?: string) => (s === 'confirmed' ? '✅' : '⏳');
  const fmt = (list: AgendaLead[]) =>
    list.map(
      (b) => `  ${icon(b.status)} ${b.slot_time} — ${esc(b.name)}${b.service ? ` · ${esc(b.service)}` : ''}`,
    );

  const todays = rows.filter((b) => b.slot_date === today);
  const tomorrows = rows.filter((b) => b.slot_date === tomorrow);

  const lines = ['⏰ <b>Daily agenda</b>', '━━━━━━━━━━━━━━━━━━━'];
  lines.push(`<b>Today</b> (${today}):`);
  lines.push(...(todays.length ? fmt(todays) : ['  —']));
  lines.push('', `<b>Tomorrow</b> (${tomorrow}):`);
  lines.push(...(tomorrows.length ? fmt(tomorrows) : ['  —']));

  if (waPending.length) {
    lines.push('', `💬 <b>WhatsApp:</b> ${waPending.length} ${waPending.length === 1 ? 'person is' : 'people are'} waiting for a reply.`);
  }
  if (waiting.leads.length) {
    lines.push('', '⚠️ <b>Enquiries waiting for your reply over 24h:</b>');
    lines.push('  Tap a name to open it.');
  }

  const buttons: InlineButton[][] = [];
  if (waPending.length) buttons.push([{ text: `⏳ WhatsApp waiting (${waPending.length})`, callback_data: 'wapend' }]);
  if (waiting.leads.length) {
    for (const b of waiting.leads) {
      const more = waiting.extras.get(b.id) ?? 0;
      const label = `⏳ ${b.name.slice(0, 22)}${b.service ? ` · ${b.service.slice(0, 18)}` : ''}${more ? ` (+${more})` : ''}`;
      buttons.push([{ text: label, callback_data: `lead:${b.id}` }]);
    }
    buttons.push([{ text: '🧹 All answered — clear the list', callback_data: 'agclear' }]);
  }

  return {
    text: lines.join('\n'),
    keyboard: buttons.length ? { inline_keyboard: buttons } : undefined,
    empty: rows.length === 0 && waiting.leads.length === 0 && waPending.length === 0,
  };
}

/** One enquiry in full, with everything needed to act on it. */
export function buildLeadCard(b: AgendaLead): { text: string; keyboard: InlineKeyboard } {
  const phone = (b.contact ?? '').replace(/[^\d+]/g, '');
  const waiting = b.created_at
    ? Math.floor((Date.now() - new Date(b.created_at).getTime()) / 3600000)
    : null;

  const lines = [`⏳ <b>${esc(b.name)}</b>`, '━━━━━━━━━━━━━━━━━━━'];
  lines.push(`📞 <code>${esc(b.contact ?? '')}</code>`);
  if (b.bmw_model) lines.push(`🚙 ${esc(b.bmw_model)}`);
  if (b.service) lines.push(`🔧 ${esc(b.service)}`);
  if (b.slot_date) lines.push(`📅 ${esc(b.slot_date)} ${esc(b.slot_time ?? '')}`.trimEnd());
  if (b.message) lines.push(`💬 ${esc(b.message)}`);
  if (waiting !== null) {
    lines.push('', `Waiting <b>${waiting}h</b> for a reply.`);
  }

  const buttons: InlineButton[][] = [];
  if (phone) {
    buttons.push([
      { text: '📋 Number', copy_text: { text: phone } },
      { text: '💬 WhatsApp', url: `https://wa.me/${phone.replace(/\D/g, '')}` },
    ]);
    buttons.push([{ text: '📖 Read the chat', callback_data: `leadlog:${b.id}` }]);
  }
  buttons.push([
    { text: '✅ Answered', callback_data: `leaddone:${b.id}` },
    { text: '✖️ Dismiss', callback_data: `bkfree:${b.id}` },
  ]);
  buttons.push([{ text: '← Back to agenda', callback_data: 'agenda' }]);

  return { text: lines.join('\n'), keyboard: { inline_keyboard: buttons } };
}
