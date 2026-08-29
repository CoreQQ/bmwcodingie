import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { WHATSAPP_PROMPT } from './assistantPrompt';
import { ensureClient, clientCode } from './crm';
import { notifyTelegram } from './telegram';
import { getHours, getSlotDuration, getBlockedDates } from './stats';
import { windowsFor, windowsOverlap } from './hours';

// Shared brain for the WhatsApp agent. Used by both transports: the direct
// Meta Cloud API webhook (/api/whatsapp) and the ManyChat bridge
// (/api/manychat), so both behave identically — same prompt, same lead
// capture, same Telegram notifications.



/** Download a customer photo for the model to look at. Small, typed, and
 *  never fatal — a broken link just means we answer without the picture. */
async function fetchImage(
  url: string,
): Promise<{ media_type: 'image/jpeg' | 'image/png' | 'image/webp'; data: string } | null> {
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

/** Today's date in Dublin as YYYY-MM-DD (the server clock runs UTC). */
function dublinDay(offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });
}

/** Free (non-overlapping) windows for one day, honouring hours and blocks. */
async function freeWindows(sb: SupabaseClient, day: string): Promise<string[]> {
  const [hours, duration, blocked] = await Promise.all([
    getHours(sb),
    getSlotDuration(sb),
    getBlockedDates(sb),
  ]);
  if (blocked.includes(day)) return [];
  const weekday = new Date(`${day}T12:00:00`).getDay();
  const all = windowsFor(hours, weekday, duration);
  if (!all.length) return [];
  const { data } = await sb
    .from('bookings')
    .select('slot_time')
    .eq('slot_date', day)
    .eq('status', 'confirmed');
  const taken = ((data ?? []) as { slot_time: string }[]).map((r) => r.slot_time).filter(Boolean);
  return all.filter((w) => !taken.some((t) => windowsOverlap(w, t)));
}

/** Human summary of the next few bookable days, for the model to read out. */
async function availabilityText(sb: SupabaseClient, day?: string): Promise<string> {
  const days = day ? [day] : Array.from({ length: 7 }, (_, i) => dublinDay(i + 1));
  const lines: string[] = [];
  for (const d of days) {
    const free = await freeWindows(sb, d);
    const label = new Date(`${d}T12:00:00`).toLocaleDateString('en-IE', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
    lines.push(free.length ? `${label} (${d}): ${free.join(', ')}` : `${label} (${d}): fully booked`);
  }
  const total = (
    await Promise.all(days.map((d) => freeWindows(sb, d)))
  ).reduce((n, w) => n + w.length, 0);
  lines.push(`Total free windows in this range: ${total}.`);
  return lines.join('\n') || 'No bookable days found.';
}

const LEAD_TOOL: Anthropic.Tool = {
  name: 'save_lead',
  description:
    'Record this customer as a lead when they state a concrete service request or booking intent. Call at most once per conversation.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'Customer name if known' },
      bmw_model: { type: 'string', description: 'Car model/year if mentioned' },
      service: { type: 'string', description: 'What they want, short' },
      note: { type: 'string', description: 'Useful context from the chat' },
    },
    required: ['service'],
  },
};


const AVAILABILITY_TOOL: Anthropic.Tool = {
  name: 'check_availability',
  description:
    "Look up the real free time slots. Call this before suggesting any time — never invent availability. Omit 'date' to get the next seven days.",
  input_schema: {
    type: 'object' as const,
    properties: {
      date: { type: 'string', description: 'A single day to check, YYYY-MM-DD' },
    },
  },
};

const BOOK_TOOL: Anthropic.Tool = {
  name: 'book_slot',
  description:
    "Provisionally book a free slot for the customer. Only use a date and time that check_availability returned. The booking is pending until the owner confirms — tell the customer exactly that.",
  input_schema: {
    type: 'object' as const,
    properties: {
      date: { type: 'string', description: 'YYYY-MM-DD' },
      time: { type: 'string', description: 'The window exactly as returned, e.g. "19:00–21:00"' },
      name: { type: 'string', description: 'Customer name' },
      service: { type: 'string', description: 'What is being booked' },
      bmw_model: { type: 'string', description: 'Car model/year if known' },
    },
    required: ['date', 'time', 'name', 'service'],
  },
};

/**
 * Produce the agent's reply for an inbound WhatsApp message, persisting a
 * lead (booking + client + owner notification) when the model captures one.
 * `text` is the message just received; history is read from wa_messages.
 */
export async function generateWaReply(
  sb: SupabaseClient,
  waId: string,
  text: string,
  profileName?: string,
  /** Fast model for transports that time out quickly (ManyChat waits seconds). */
  model = 'claude-opus-4-8',
  /** How the customer is addressed in the CRM — a +number, or an id label
   *  when the transport gives us no phone (then no client record is made). */
  contact = `+${waId}`,
  /** Photo the customer just sent (e.g. their iDrive home screen). */
  imageUrl?: string,
): Promise<string> {
  const { data: history } = await sb
    .from('wa_messages')
    .select('role, content')
    .eq('wa_id', waId)
    .order('created_at', { ascending: true })
    .limit(14);

  const messages = ((history ?? []) as { role: string; content: string }[])
    .filter((m) => m.content?.trim())
    .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    messages.push({ role: 'user', content: text });
  }

  const client = new Anthropic();
  const convo: Anthropic.MessageParam[] = messages.map((m) => ({ role: m.role, content: m.content }));

  // A photo (usually the iDrive home screen) goes in with the latest message —
  // identifying the head unit from the UI is what decides the price.
  if (imageUrl) {
    const img = await fetchImage(imageUrl);
    if (img) {
      const last = convo[convo.length - 1];
      const caption = typeof last?.content === 'string' ? last.content : text;
      convo[convo.length - 1] = {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: img.media_type, data: img.data } },
          { type: 'text', text: caption || 'Photo from the customer.' },
        ],
      };
    }
  }

  // Save a lead / book a slot / read the diary. The model may need two or
  // three turns (check availability → offer times → book), so loop instead of
  // handling a single tool call.
  let reply = '';
  let usedTool = false;

  for (let round = 0; round < 4; round++) {
    const response: Anthropic.Message = await client.messages.create({
      model,
      max_tokens: 600,
      system: WHATSAPP_PROMPT,
      messages: convo,
      tools: [LEAD_TOOL, AVAILABILITY_TOOL, BOOK_TOOL],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    if (text) reply = text;

    const calls = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    if (!calls.length) break;
    usedTool = true;

    convo.push({ role: 'assistant', content: response.content });
    const results: Anthropic.ToolResultBlockParam[] = [];

    for (const call of calls) {
      let result = 'done';

      if (call.name === 'check_availability') {
        const { date } = call.input as { date?: string };
        const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
        result = await availabilityText(sb, day);
      }

      if (call.name === 'book_slot') {
        const inp = call.input as {
          date?: string; time?: string; name?: string; service?: string; bmw_model?: string;
        };
        const day = String(inp.date ?? '');
        const time = String(inp.time ?? '').trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
          result = 'Rejected: date must be YYYY-MM-DD.';
        } else if (day <= dublinDay(0)) {
          result = 'Rejected: that day is in the past — offer a future date.';
        } else {
          const free = await freeWindows(sb, day);
          if (!free.includes(time)) {
            result = free.length
              ? `Rejected: "${time}" is not free. Free that day: ${free.join(', ')}.`
              : `Rejected: nothing free on ${day}.`;
          } else {
            const bookName =
              String(inp.name ?? '').trim().slice(0, 120) || profileName || `WhatsApp ${waId}`;
            const service = String(inp.service ?? '').trim().slice(0, 160);
            const bmw_model = String(inp.bmw_model ?? '').trim().slice(0, 160);
            const isPhone = contact.startsWith('+');
            const cl = isPhone ? await ensureClient(sb, contact, bookName).catch(() => null) : null;
            const ins = await sb
              .from('bookings')
              .insert({
                name: bookName,
                contact,
                bmw_model,
                service,
                message: '',
                slot_date: day,
                slot_time: time,
                source: 'WhatsApp AI',
                status: cl?.banned ? 'declined' : 'pending',
              })
              .select('id')
              .single();
            const id = (ins.data as { id: number } | null)?.id;
            await notifyTelegram({
              name: bookName,
              contact,
              bmw_model,
              service,
              message: '',
              slot_date: day,
              slot_time: time,
              source: '🤖 WhatsApp AI — slot requested',
              id,
              persisted: Boolean(id),
              clientNote: cl?.banned
                ? `⛔️ <b>BLACKLISTED</b> · ${clientCode(cl.id)} — auto-declined`
                : cl
                  ? `🆔 <b>Client:</b> ${clientCode(cl.id)}`
                  : undefined,
            }).catch(() => undefined);
            result = `Booked provisionally: ${day} ${time}. Tell the customer it is pending until Alex confirms, and that he will message shortly.`;
          }
        }
      }

      if (call.name === 'save_lead') {
        const inp = call.input as { name?: string; bmw_model?: string; service?: string; note?: string };
        const leadName =
          String(inp.name ?? '').trim().slice(0, 120) || profileName || `WhatsApp ${waId}`;
        const bmw_model = String(inp.bmw_model ?? '').trim().slice(0, 160);
        const service = String(inp.service ?? '').trim().slice(0, 160);
        const note = String(inp.note ?? '').trim().slice(0, 1000);
        const isPhone = contact.startsWith('+');
        const ins = await sb
          .from('bookings')
          .insert({
            name: leadName,
            contact,
            bmw_model,
            service,
            message: note,
            source: 'WhatsApp AI',
            status: 'pending',
          })
          .select('id')
          .single();
        const id = (ins.data as { id: number } | null)?.id;
        const cl = isPhone ? await ensureClient(sb, contact, leadName).catch(() => null) : null;
        await notifyTelegram({
          name: leadName,
          contact,
          bmw_model,
          service,
          message: note,
          slot_date: null,
          slot_time: '',
          source: '🤖 WhatsApp AI',
          id,
          persisted: Boolean(id),
          clientNote: cl ? `🆔 <b>Client:</b> ${clientCode(cl.id)}` : undefined,
        }).catch(() => undefined);
        result = 'Lead saved — the team has the details.';
      }

      results.push({ type: 'tool_result', tool_use_id: call.id, content: result });
    }

    convo.push({ role: 'user', content: results });
  }

  if (!reply && usedTool) {
    reply = "Perfect — I've passed your details to the team, we'll confirm shortly. 👍";
  }
  if (!reply) throw new Error('empty AI reply');
  return reply;
}
