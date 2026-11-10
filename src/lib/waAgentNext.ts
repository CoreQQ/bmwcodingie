import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { WHATSAPP_PROMPT_NEXT as WHATSAPP_PROMPT } from './assistantPromptNext';
import { ensureClient, clientCode, historyForAssistant } from './crm';
import { notifyTelegram, sendOwnerAlert } from './telegram';
import { sendWhatsAppText } from './whatsapp';
import { withOfferNote } from './offerNote';

// The WhatsApp agent's brain. Called by the Cloud API webhook (/api/whatsapp)
// and by "Resume AI" in the bot.
//
// Rebuilt 10 Nov 2026 from three weeks of real chats. One model call returns a
// structured decision — the message for the customer, a note for Alex, whether
// it is urgent, and the lead — instead of free text plus tool calls. That is
// what stops the failures the transcripts showed: the model's notes to itself
// sent to a customer, "Passing this to Alex now" under every message of a
// conversation Alex was already having, a pinned alert for a supplier's
// advert. The conversation goes in as one labelled transcript, so the model
// knows which lines are Alex's own and answers a burst of messages once.

const MODEL = 'claude-opus-5-5';
/** Used when the main model errors or is too slow — never leave a customer with nothing. */
const BACKUP_MODEL = 'claude-sonnet-5-5';

export type WaTurn = { at: string; who: 'customer' | 'assistant' | 'alex'; text: string };

export type WaContext = {
  /** The conversation before the messages being answered, oldest first. */
  turns: WaTurn[];
  /** The customer's new message(s): everything since the last reply. */
  fresh: { at: string; text: string }[];
  profileName?: string;
  /** Our booking records for this number, newest first. */
  pastJobs?: string;
  /** A photo that came with the newest message. */
  image?: { media_type: 'image/jpeg' | 'image/png' | 'image/webp'; data: string } | null;
  now?: Date;
};

export type WaLead = { name: string; bmw_model: string; service: string; note: string };

export type WaDecision = {
  /** The exact message for the customer; '' sends nothing. */
  reply: string;
  /** What Alex needs to do about this customer; '' when nothing. */
  notify_alex: string;
  /** Asked for a person, upset or complaining: loud alert, assistant steps back. */
  urgent: boolean;
  lead: WaLead | null;
};

const DECISION_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string', description: 'The exact WhatsApp message to send to the customer now, or "" to send nothing.' },
    notify_alex: { type: 'string', description: 'One short line in English for Alex about what this customer needs from him, or "".' },
    urgent: { type: 'boolean', description: 'true only when they ask for a person, a call or Alex right now, are upset, or complain.' },
    lead: {
      anyOf: [
        { type: 'null' },
        {
          type: 'object',
          properties: {
            name: { type: 'string', description: 'Customer name if known, else ""' },
            bmw_model: { type: 'string', description: 'Car model and year if known, else ""' },
            service: { type: 'string', description: 'What they want done, short' },
            note: { type: 'string', description: 'The VIN and any useful context, else ""' },
          },
          required: ['name', 'bmw_model', 'service', 'note'],
          additionalProperties: false,
        },
      ],
    },
  },
  required: ['reply', 'notify_alex', 'urgent', 'lead'],
  additionalProperties: false,
};

/** "Mon 9 Nov 11:41" in Irish time — lets the model see gaps and who spoke when. */
function stamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d
    .toLocaleString('en-IE', { timeZone: 'Europe/Dublin', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
    .replace(/,/g, '');
}

/** Whether to say hello is decided here, not left to the model: first contact
 *  → greet and say it is the AI assistant; back after a break → "Hi again";
 *  mid-chat → no hello. */
function greetingNote(ctx: WaContext, now: Date): string {
  const firstName = (ctx.profileName || '').trim().split(/\s+/)[0];
  const lastAi = [...ctx.turns].reverse().find((t) => t.who === 'assistant');
  if (!lastAi) {
    const knowsAlex = ctx.turns.some((t) => t.who === 'alex');
    return (
      `GREETING: this is your first message to this customer. Open with a short hello${firstName ? ` using their first name (${firstName})` : ''} ` +
      `and say once that you're the AI assistant for BMW Coding IE${knowsAlex ? ' (they have been talking to Alex himself, so make clear it is the assistant answering)' : ''}, then answer. ` +
      `If your reply is only a short holding line for Alex, skip the introduction.`
    );
  }
  const gap = now.getTime() - new Date(lastAi.at).getTime();
  return gap > 12 * 60 * 60 * 1000
    ? `GREETING: they are coming back after a break. Open with a short "Hi again${firstName ? ` ${firstName}` : ''}!" — no need to introduce yourself again — then answer.`
    : 'GREETING: you are mid-conversation. No hello, just carry on.';
}

/** The whole situation as one labelled text: who the customer is, what was
 *  said and by whom, and what is new. Exported for the test endpoint. */
export function renderContext(ctx: WaContext): string {
  const now = ctx.now ?? new Date();
  const label = { customer: 'Customer', assistant: 'You', alex: 'Alex' } as const;
  const parts: string[] = [];
  const about = [
    ctx.profileName ? `WhatsApp name: ${ctx.profileName} (use the first name; do not ask for it unless it is clearly not a real name)` : '',
    ctx.pastJobs ? `Our booking records for this number (newest first): ${ctx.pastJobs}` : '',
    `Now: ${stamp(now.toISOString())} (Irish time)`,
  ].filter(Boolean);
  parts.push(`CUSTOMER\n${about.join('\n')}`);
  parts.push(
    ctx.turns.length
      ? `CONVERSATION SO FAR (oldest first)\n${ctx.turns.map((t) => `[${stamp(t.at)}] ${label[t.who]}: ${t.text}`).join('\n')}`
      : 'CONVERSATION SO FAR\n(none — this is their first message)',
  );
  parts.push(`NEW — answer this\n${ctx.fresh.map((m) => `[${stamp(m.at)}] Customer: ${m.text}`).join('\n')}`);
  parts.push(greetingNote(ctx, now));
  return parts.join('\n\n');
}

function parseDecision(text: string): WaDecision {
  const raw = JSON.parse(text) as Partial<WaDecision>;
  const lead = raw.lead && typeof raw.lead === 'object' ? raw.lead : null;
  return {
    reply: String(raw.reply ?? '').trim(),
    notify_alex: String(raw.notify_alex ?? '').trim().slice(0, 300),
    urgent: raw.urgent === true,
    lead: lead
      ? {
          name: String(lead.name ?? '').trim().slice(0, 120),
          bmw_model: String(lead.bmw_model ?? '').trim().slice(0, 160),
          service: String(lead.service ?? '').trim().slice(0, 160),
          note: String(lead.note ?? '').trim().slice(0, 1000),
        }
      : null,
  };
}

/**
 * Ask the model what to do. No database, no sending — the test endpoint calls
 * this with made-up conversations. Throws when no usable answer comes back,
 * so the caller can tell Alex the customer got nothing.
 */
export async function decideWaReply(ctx: WaContext): Promise<WaDecision & { model: string; backupReason?: string }> {
  const client = new Anthropic();
  const text = renderContext(ctx);
  const request = {
    // Thinking is always on for these models and counts toward the limit, so
    // this is room for the thinking plus a short message — the prompt keeps
    // replies brief, not the ceiling.
    max_tokens: 4000,
    system: [{ type: 'text' as const, text: WHATSAPP_PROMPT, cache_control: { type: 'ephemeral' as const } }],
    output_config: { effort: 'low' as const, format: { type: 'json_schema' as const, schema: DECISION_SCHEMA } },
  };
  const userContent = (): Anthropic.ContentBlockParam[] => [
    ...(ctx.image ? [{ type: 'image' as const, source: { type: 'base64' as const, media_type: ctx.image.media_type, data: ctx.image.data } }] : []),
    { type: 'text' as const, text },
  ];

  // Capped attempts: uncapped, a slow answer ran until the platform killed the
  // function at 60 seconds — no reply, no error, no warning to Alex.
  let response: { content: { type: string; text?: string }[]; stop_reason: string | null; model: string };
  let backupReason: string | undefined;
  try {
    response = await client.beta.messages.create(
      {
        ...request,
        model: MODEL,
        messages: [{ role: 'user', content: userContent() }],
        // If a safety classifier declines the request, the API re-runs it on
        // the fallback model inside the same call.
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: [{ model: 'claude-opus-5' }],
      },
      { timeout: 25_000, maxRetries: 0 },
    );
  } catch (e) {
    backupReason = e instanceof Error ? e.message : String(e);
    console.warn('[waAgent] main model failed or too slow, using backup:', backupReason);
    response = await client.messages.create(
      { ...request, model: BACKUP_MODEL, messages: [{ role: 'user', content: userContent() }] },
      { timeout: 18_000, maxRetries: 1 },
    );
  }
  if (response.stop_reason === 'refusal') throw new Error('the model declined to answer');
  if (response.stop_reason === 'max_tokens') throw new Error('the answer was cut off');
  const out = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text ?? '')
    .join('')
    .trim();
  if (!out) throw new Error('empty AI reply');
  return { ...parseDecision(out), model: response.model, backupReason };
}

/** Download a customer photo for the model to look at. Small, typed, and
 *  never fatal — a broken link just means we answer without the picture. */
async function fetchImage(url: string): Promise<WaContext['image']> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') || '').split(';')[0].trim();
    const allowed = ['image/jpeg', 'image/png', 'image/webp'] as const;
    const media_type = allowed.find((t) => t === type);
    if (!media_type) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 4_500_000) return null; // keep the request small
    return { media_type, data: buf.toString('base64') };
  } catch {
    return null;
  }
}

/** The loud, pinned alert: the customer asked for Alex or is unhappy. */
async function notifyOwnerHandover(waId: string, name: string | undefined, text: string, reason: string): Promise<void> {
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  await sendOwnerAlert(
    `${name ? `<b>${esc(name)}</b> · ` : ''}<code>+${waId}</code>\n\n` +
      `«${esc(text.slice(0, 600))}»\n\n` +
      `🤖 Why I stepped back: ${esc(reason)}\n` +
      `The assistant stands down here for 6 hours, then answers again if you haven't. <code>/wa stop +${waId}</code> keeps it off for good.`,
    {
      inline_keyboard: [
        [{ text: '💬 Open WhatsApp', url: `https://wa.me/${waId}` }],
        [{ text: '📋 Number', copy_text: { text: `+${waId}` } }],
        [{ text: '▶️ Resume AI here', callback_data: `war:${waId}` }],
      ],
    },
  );
}

/**
 * Hand the chat to Alex: stand the assistant down for six hours (it picks the
 * chat back up after that if he has not — a permanent stop is only ever his
 * own "Stop AI here") and send him the pinned alert with the customer's words.
 */
async function handOverNow(sb: SupabaseClient, waId: string, name: string | undefined, text: string, reason: string): Promise<void> {
  await sb
    .from('wa_chats')
    .upsert({ wa_id: waId, owner_replied_at: new Date().toISOString() })
    .then(() => undefined, () => undefined);
  await notifyOwnerHandover(waId, name, text, reason).catch(() => undefined);
}

/**
 * The open, slot-less enquiry we already have for this customer, if any. One
 * conversation is one enquiry until Alex closes it — the model reports the
 * lead again whenever it learns something new, and that must update the row,
 * not list the same person three times.
 */
async function openLeadFor(
  sb: SupabaseClient,
  contact: string,
): Promise<{ id: number; service?: string; bmw_model?: string; message?: string } | null> {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await sb
    .from('bookings')
    .select('id, service, bmw_model, message')
    .eq('contact', contact)
    .eq('status', 'pending')
    .is('slot_date', null)
    .gt('created_at', since)
    .order('created_at', { ascending: false })
    .limit(1);
  return ((data ?? [])[0] as { id: number; service?: string; bmw_model?: string; message?: string } | undefined) ?? null;
}

async function saveLead(sb: SupabaseClient, waId: string, contact: string, profileName: string | undefined, lead: WaLead): Promise<void> {
  const name = lead.name || profileName || `WhatsApp ${waId}`;
  const open = await openLeadFor(sb, contact).catch(() => null);
  if (open) {
    // Keep whatever we learned, drop nothing we already knew. No second
    // Telegram card: the WhatsApp mirror already shows the conversation.
    await sb
      .from('bookings')
      .update({
        name,
        bmw_model: lead.bmw_model || open.bmw_model || '',
        service: lead.service || open.service || '',
        message: lead.note || open.message || '',
      })
      .eq('id', open.id)
      .then(() => undefined, () => undefined);
    return;
  }
  const note = withOfferNote(lead.note);
  const ins = await sb
    .from('bookings')
    .insert({ name, contact, bmw_model: lead.bmw_model, service: lead.service, message: note, source: 'WhatsApp AI', status: 'pending' })
    .select('id')
    .single();
  const id = (ins.data as { id: number } | null)?.id;
  const cl = contact.startsWith('+') ? await ensureClient(sb, contact, name).catch(() => null) : null;
  // Never lose a lead: Telegram is told even when the row could not be saved.
  await notifyTelegram({
    name,
    contact,
    bmw_model: lead.bmw_model,
    service: lead.service,
    message: note,
    slot_date: null,
    slot_time: '',
    source: '🤖 WhatsApp AI',
    id,
    persisted: Boolean(id),
    clientNote: cl ? `🆔 <b>Client:</b> ${clientCode(cl.id)}` : undefined,
  }).catch(() => undefined);
}

/**
 * The assistant's answer to what the customer just sent: reads the chat,
 * asks the model, saves the lead and raises the alert when it is urgent.
 * `reply` may be empty — some messages are Alex's, or need no answer.
 */
export async function generateWaReply(
  sb: SupabaseClient,
  waId: string,
  text: string,
  profileName?: string,
  /** How the customer is addressed in the CRM — a +number, or an id label
   *  when the transport gives us no phone (then no client record is made). */
  contact = `+${waId}`,
  /** Photo the customer just sent (e.g. their iDrive home screen). */
  imageUrl?: string,
): Promise<{ reply: string; notify: string; urgent: boolean }> {
  const [{ data: history }, pastJobs, image] = await Promise.all([
    sb.from('wa_messages').select('role, content, via, created_at').eq('wa_id', waId).order('created_at', { ascending: false }).limit(30),
    /^\+?\d{8,15}$/.test(contact) ? historyForAssistant(sb, contact).catch(() => '') : Promise.resolve(''),
    imageUrl ? fetchImage(imageUrl) : Promise.resolve(null),
  ]);
  const rows = ((history ?? []) as { role: string; content: string; via?: string | null; created_at: string }[])
    .filter((m) => m.content?.trim())
    .reverse();

  // Everything the customer sent since the last reply is answered together.
  let split = rows.length;
  while (split > 0 && rows[split - 1].role === 'user') split -= 1;
  const fresh = rows.slice(split).map((m) => ({ at: m.created_at, text: m.content }));
  if (!fresh.length) fresh.push({ at: new Date().toISOString(), text });
  const turns: WaTurn[] = rows.slice(0, split).map((m) => ({
    at: m.created_at,
    who: m.role === 'user' ? 'customer' : m.via === 'owner' ? 'alex' : 'assistant',
    text: m.content.replace(/^\[Alex\]\s*/, ''),
  }));

  const decision = await decideWaReply({ turns, fresh, profileName, pastJobs: pastJobs || undefined, image });

  if (decision.lead?.service) await saveLead(sb, waId, contact, profileName, decision.lead).catch(() => undefined);
  if (decision.urgent) {
    await handOverNow(sb, waId, profileName, fresh.map((m) => m.text).join('\n'), decision.notify_alex || 'The customer asked for you');
  }
  return { reply: decision.reply, notify: decision.notify_alex, urgent: decision.urgent };
}

const SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** "Resume AI" on a chat the assistant sat out: answer the customer's last
 *  message now rather than waiting for their next one. Only when that message
 *  is still the newest in the chat (nobody has answered it) and inside
 *  WhatsApp's 24h window, where a free-form reply is allowed. */
export async function answerPendingWaMessage(
  sb: SupabaseClient,
  waId: string,
): Promise<{ text: string; reply: string; sendError?: string; aiError?: string; notify?: string } | null> {
  const [{ data: recent }, { data: chat }] = await Promise.all([
    sb.from('wa_messages').select('role, content, created_at').eq('wa_id', waId).order('created_at', { ascending: false }).limit(6),
    sb.from('wa_chats').select('name').eq('wa_id', waId).maybeSingle(),
  ]);
  // A 👍 reaction after their question is not what needs answering.
  const row = ((recent ?? []) as { role?: string; content?: string; created_at?: string }[]).find(
    (m) => !/^\[(reaction|system|unsupported)\]/.test(m.content ?? ''),
  );
  if (!row || row.role !== 'user' || !row.content || !row.created_at) return null;
  if (Date.now() - new Date(row.created_at).getTime() > SERVICE_WINDOW_MS) return null;
  const text = row.content;
  const name = (chat as { name?: string | null } | null)?.name || undefined;
  let reply = '';
  let notify: string | undefined;
  try {
    const out = await generateWaReply(sb, waId, text, name, `+${waId}`);
    reply = out.reply.trim();
    notify = out.notify || undefined;
  } catch (e) {
    return { text, reply: '', aiError: e instanceof Error ? e.message : String(e) };
  }
  if (!reply) return { text, reply, notify };
  const sent = await sendWhatsAppText(waId, reply);
  if (!sent.ok) return { text, reply, sendError: sent.error || 'send failed', notify };
  await sb.from('wa_messages').insert({ msg_id: sent.id || `out:resume:${waId}:${Date.now()}`, wa_id: waId, role: 'assistant', content: reply, via: 'ai' });
  return { text, reply, notify };
}
