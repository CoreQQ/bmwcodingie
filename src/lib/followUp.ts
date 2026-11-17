import type { SupabaseClient } from '@supabase/supabase-js';
import { decideWaReply, storedTurns } from './waAgent';
import { historyForAssistant } from './crm';
import { sendWhatsAppText } from './whatsapp';
import { sendOwnerWithMarkup } from './telegram';
import { bizChatLink } from './phone';

// One follow-up for customers who went quiet (owner, 17 Nov 2026: "people
// stop writing"). Of 160 WhatsApp chats in six weeks, 26 ended after the
// first answer, and most of the rest went silent right after the price or
// the booking link. Nobody wrote to them again.
//
// WhatsApp lets a business write freely only within 24 hours of the
// customer's last message, so this runs every hour (Vercel Pro cron,
// /api/cron/followup): a chat becomes due 10 hours after the customer's last
// message and stays due until 23.5 hours, and it is only acted on between
// 09:00 and 21:00 Irish time — that window always contains a daytime hour.
// The model decides whether a nudge makes sense at all and writes it.
//
// Modes (app_config wa_followup, `/wa followup ask|auto|off`):
//   ask  — default: the draft comes to Telegram with ✅ Send / ✖️ Skip
//   auto — sent straight away, mirrored to the WhatsApp topic
//   off  — nothing
// Each chat gets at most one follow-up per silence: app_config `fu:<wa_id>`
// remembers which customer message it was for.

export type FollowUpMode = 'ask' | 'auto' | 'off';
const MODE_KEY = 'wa_followup';
const stateKey = (waId: string) => `fu:${waId}`;
type FuState = { for: string; state: 'asked' | 'sent' | 'skipped' | 'none'; text?: string };

const HOUR = 3600000;
const DUE_FROM = 10 * HOUR;
const DUE_UNTIL = 23.5 * HOUR;
const WINDOW = 24 * HOUR;
/** Our last message must be at least this old — they may still be reading. */
const OUR_LAST_MIN_AGE = 3 * HOUR;
const MAX_PER_RUN = 8;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const NO_REPLY_NEEDED = /^\[(reaction|system|unsupported)\]/;

export async function followUpMode(sb: SupabaseClient): Promise<FollowUpMode> {
  const { data } = await sb.from('app_config').select('value').eq('key', MODE_KEY).maybeSingle();
  const v = (data as { value?: string } | null)?.value;
  return v === 'auto' || v === 'off' ? v : 'ask';
}

export async function setFollowUpMode(sb: SupabaseClient, mode: FollowUpMode): Promise<void> {
  await sb.from('app_config').upsert({ key: MODE_KEY, value: mode });
}

async function readState(sb: SupabaseClient, waId: string): Promise<FuState | null> {
  const { data } = await sb.from('app_config').select('value').eq('key', stateKey(waId)).maybeSingle();
  try {
    return JSON.parse((data as { value?: string } | null)?.value ?? 'null') as FuState | null;
  } catch {
    return null;
  }
}
const writeState = (sb: SupabaseClient, waId: string, st: FuState) =>
  sb.from('app_config').upsert({ key: stateKey(waId), value: JSON.stringify(st) });

/** Irish hour of the day, 0–23. */
const dublinHour = (d = new Date()) => Number(d.toLocaleString('en-GB', { timeZone: 'Europe/Dublin', hour: '2-digit', hour12: false }));

type Candidate = { waId: string; name: string; customerAt: string; quietHours: number };

/** Chats where we spoke last and the customer has been quiet long enough. */
async function quietChats(sb: SupabaseClient, now: number): Promise<Candidate[]> {
  const since = new Date(now - 26 * HOUR).toISOString();
  const { data } = await sb
    .from('wa_messages')
    .select('wa_id, role, via, content, created_at')
    .gt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(4000);
  const rows = (data ?? []) as { wa_id: string; role: string; via: string | null; content: string; created_at: string }[];
  const byChat = new Map<string, typeof rows>();
  for (const r of rows) {
    if (NO_REPLY_NEEDED.test(r.content ?? '')) continue;
    if (!byChat.has(r.wa_id)) byChat.set(r.wa_id, []);
    byChat.get(r.wa_id)!.push(r); // newest first
  }
  const out: Candidate[] = [];
  for (const [waId, msgs] of byChat) {
    if (!/^\d{8,15}$/.test(waId)) continue;
    const last = msgs[0];
    if (last.role === 'user') continue; // they are waiting on us — /wa pending covers that
    const lastCustomer = msgs.find((m) => m.role === 'user');
    if (!lastCustomer) continue;
    const quiet = now - new Date(lastCustomer.created_at).getTime();
    if (quiet < DUE_FROM || quiet > DUE_UNTIL) continue;
    if (now - new Date(last.created_at).getTime() < OUR_LAST_MIN_AGE) continue;
    out.push({ waId, name: '', customerAt: lastCustomer.created_at, quietHours: quiet / HOUR });
  }
  if (!out.length) return out;

  // Not when the assistant is off for the chat, Alex is handling it, or a
  // job is already in the diary for this number.
  const ids = out.map((c) => c.waId);
  const [{ data: chats }, { data: booked }] = await Promise.all([
    sb.from('wa_chats').select('*').in('wa_id', ids),
    sb
      .from('bookings')
      .select('contact, slot_date, status')
      .gte('slot_date', new Date(now).toISOString().slice(0, 10))
      .in('status', ['pending', 'confirmed'])
      .limit(500),
  ]);
  const chatRow = new Map(((chats ?? []) as { wa_id: string; name?: string | null; paused?: boolean; owner_replied_at?: string | null }[]).map((c) => [c.wa_id, c]));
  const tail = (s: string) => (s ?? '').replace(/\D/g, '').slice(-9);
  const bookedKeys = new Set(((booked ?? []) as { contact: string }[]).map((b) => tail(b.contact)));
  return out
    .filter((c) => {
      const row = chatRow.get(c.waId);
      if (row?.paused) return false;
      if (row?.owner_replied_at && now - new Date(row.owner_replied_at).getTime() < 6 * HOUR) return false;
      return !bookedKeys.has(tail(c.waId));
    })
    .map((c) => ({ ...c, name: chatRow.get(c.waId)?.name ?? '' }))
    .sort((a, b) => b.quietHours - a.quietHours);
}

/** The model's follow-up for this chat, or '' when none is right. */
async function draft(sb: SupabaseClient, c: Candidate): Promise<string> {
  const [turns, pastJobs] = await Promise.all([
    storedTurns(sb, c.waId, 30),
    historyForAssistant(sb, `+${c.waId}`).catch(() => ''),
  ]);
  if (!turns.length) return '';
  const d = await decideWaReply({ turns, fresh: [], profileName: c.name || undefined, pastJobs: pastJobs || undefined, followUp: { quietHours: c.quietHours } });
  return d.reply.trim().slice(0, 700);
}

async function sendNow(sb: SupabaseClient, waId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const sent = await sendWhatsAppText(waId, text);
  if (sent.ok) {
    await sb.from('wa_messages').insert({ msg_id: sent.id || `followup:${waId}:${Date.now()}`, wa_id: waId, role: 'assistant', content: text, via: 'ai' });
  }
  return { ok: sent.ok, error: sent.error };
}

function card(c: { waId: string; name: string; quietHours: number }, text: string, head: string) {
  const left = Math.max(0, 24 - c.quietHours);
  return (
    `${head} · ${c.name ? `<b>${esc(c.name)}</b> · ` : ''}<code>+${c.waId}</code>\n` +
    `Quiet for ${Math.round(c.quietHours)}h after our last message · WhatsApp lets us write for ${left < 1 ? 'under an hour' : `about ${Math.floor(left)}h`} more.\n` +
    `<blockquote>${esc(text)}</blockquote>`
  );
}

/** The hourly run. Returns what happened, for the cron's JSON. */
export async function runFollowUps(sb: SupabaseClient, now = Date.now()): Promise<{ mode: FollowUpMode; due: number; drafted: number; sent: number; asked: number; hour: number }> {
  const mode = await followUpMode(sb);
  const hour = dublinHour(new Date(now));
  const result = { mode, due: 0, drafted: 0, sent: 0, asked: 0, hour };
  if (mode === 'off' || hour < 9 || hour >= 21) return result;
  const { data: cfg } = await sb.from('app_config').select('value').eq('key', 'wa_ai_owner').maybeSingle();
  if ((cfg as { value?: string } | null)?.value === 'meta') return result; // assistant switched off everywhere

  const due = await quietChats(sb, now);
  result.due = due.length;
  for (const c of due.slice(0, MAX_PER_RUN)) {
    const st = await readState(sb, c.waId);
    if (st?.for === c.customerAt) continue; // already handled this silence
    let text = '';
    try {
      text = await draft(sb, c);
    } catch {
      continue; // try again next hour
    }
    if (!text) {
      await writeState(sb, c.waId, { for: c.customerAt, state: 'none' });
      continue;
    }
    result.drafted += 1;
    if (mode === 'auto') {
      const r = await sendNow(sb, c.waId, text);
      await writeState(sb, c.waId, { for: c.customerAt, state: r.ok ? 'sent' : 'asked', text });
      if (r.ok) result.sent += 1;
      await sendOwnerWithMarkup(
        card(c, text, r.ok ? '🔁 <b>Follow-up sent</b>' : `❌ <b>Follow-up not sent</b> (${esc((r.error || '').slice(0, 120))})`),
        { inline_keyboard: [[{ text: '💬 Open chat', url: bizChatLink(c.waId) }]] },
        'whatsapp',
      );
    } else {
      await writeState(sb, c.waId, { for: c.customerAt, state: 'asked', text });
      result.asked += 1;
      await sendOwnerWithMarkup(
        card(c, text, '🔁 <b>Went quiet — send this follow-up?</b>'),
        {
          inline_keyboard: [
            [
              { text: '✅ Send', callback_data: `fus:${c.waId}` },
              { text: '✖️ Skip', callback_data: `fux:${c.waId}` },
            ],
            [{ text: '💬 Open chat', url: bizChatLink(c.waId) }],
          ],
        },
        'whatsapp',
      );
    }
  }
  return result;
}

/** ✅ Send on a follow-up card. Checks the chat has not moved on first. */
export async function sendAskedFollowUp(sb: SupabaseClient, waId: string): Promise<{ ok: boolean; why: string; text?: string }> {
  const st = await readState(sb, waId);
  if (!st?.text || st.state !== 'asked') return { ok: false, why: st?.state === 'sent' ? 'Already sent' : 'Nothing to send' };
  const { data } = await sb.from('wa_messages').select('role, created_at').eq('wa_id', waId).eq('role', 'user').order('created_at', { ascending: false }).limit(1);
  const lastCustomer = (data as { created_at: string }[] | null)?.[0]?.created_at;
  if (lastCustomer && lastCustomer !== st.for) return { ok: false, why: 'They wrote again — no follow-up needed' };
  if (!lastCustomer || Date.now() - new Date(lastCustomer).getTime() > WINDOW) return { ok: false, why: 'Over 24h — WhatsApp no longer allows it' };
  const r = await sendNow(sb, waId, st.text);
  if (!r.ok) return { ok: false, why: `Not sent: ${(r.error || '').slice(0, 80)}` };
  await writeState(sb, waId, { ...st, state: 'sent' });
  return { ok: true, why: 'Sent ✓', text: st.text };
}

export async function skipFollowUp(sb: SupabaseClient, waId: string): Promise<void> {
  const st = await readState(sb, waId);
  if (st) await writeState(sb, waId, { ...st, state: 'skipped' });
}
