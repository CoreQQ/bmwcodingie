import type { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { WHATSAPP_PROMPT } from './assistantPrompt';
import { ensureClient, clientCode } from './crm';
import { notifyTelegram } from './telegram';

// Shared brain for the WhatsApp agent. Used by both transports: the direct
// Meta Cloud API webhook (/api/whatsapp) and the ManyChat bridge
// (/api/manychat), so both behave identically — same prompt, same lead
// capture, same Telegram notifications.

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
  const response = await client.messages.create({
    model,
    max_tokens: 500,
    system: WHATSAPP_PROMPT,
    messages,
    tools: [LEAD_TOOL],
  });

  const toolUse = response.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'save_lead',
  );
  if (toolUse) {
    const inp = toolUse.input as { name?: string; bmw_model?: string; service?: string; note?: string };
    const leadName =
      String(inp.name ?? '').trim().slice(0, 120) || profileName || `WhatsApp +${waId}`;
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
  }

  const reply =
    response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim() ||
    (toolUse ? "Perfect — I've passed your details to the team, we'll confirm shortly. 👍" : '');
  if (!reply) throw new Error('empty AI reply');
  return reply;
}
