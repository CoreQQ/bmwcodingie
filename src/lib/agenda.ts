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

/** Everyone whose enquiry has been sitting unanswered for over a day. */
export async function waitingLeads(sb: SupabaseClient): Promise<{ leads: AgendaLead[]; extras: Map<number, number> }> {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await sb
    .from('bookings')
    .select('id, name, contact, service, bmw_model, message, slot_date, slot_time, status, created_at')
    .eq('status', 'pending')
    .lt('created_at', dayAgo)
    .order('created_at', { ascending: true })
    .limit(60);
  const { leads, extras } = collapse((data ?? []) as AgendaLead[]);
  return { leads: leads.slice(0, 10), extras };
}

/** The whole morning message, ready to send or to edit back into. */
export async function buildAgenda(
  sb: SupabaseClient,
): Promise<{ text: string; keyboard?: InlineKeyboard; empty: boolean }> {
  const today = dayKey(0);
  const tomorrow = dayKey(1);

  const [{ data: slotData }, waiting] = await Promise.all([
    sb
      .from('bookings')
      .select('id, name, contact, service, slot_date, slot_time, status')
      .in('slot_date', [today, tomorrow])
      .in('status', ['pending', 'confirmed'])
      .order('slot_time', { ascending: true }),
    waitingLeads(sb),
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

  if (waiting.leads.length) {
    lines.push('', '⚠️ <b>Waiting for your reply over 24h:</b>');
    lines.push('  Tap a name to open it.');
  }

  const keyboard: InlineKeyboard | undefined = waiting.leads.length
    ? {
        inline_keyboard: waiting.leads.map((b) => {
          const more = waiting.extras.get(b.id) ?? 0;
          const label = `⏳ ${b.name.slice(0, 22)}${b.service ? ` · ${b.service.slice(0, 18)}` : ''}${
            more ? ` (+${more})` : ''
          }`;
          return [{ text: label, callback_data: `lead:${b.id}` }];
        }),
      }
    : undefined;

  return {
    text: lines.join('\n'),
    keyboard,
    empty: rows.length === 0 && waiting.leads.length === 0,
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
  buttons.push([{ text: '✖️ Dismiss', callback_data: `bkfree:${b.id}` }]);
  buttons.push([{ text: '← Back to agenda', callback_data: 'agenda' }]);

  return { text: lines.join('\n'), keyboard: { inline_keyboard: buttons } };
}
