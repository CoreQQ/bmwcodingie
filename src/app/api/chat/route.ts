import Anthropic from '@anthropic-ai/sdk';
import { clientIp, isRateLimited } from '@/lib/rateLimit';
import { isServiceArea } from '@/lib/geo';
import { SITE_CHAT_PROMPT } from '@/lib/assistantPrompt';
import { getSupabaseAdmin } from '@/lib/supabase';
import { notifyTelegram } from '@/lib/telegram';
import { ensureClient, clientCode, phoneKey } from '@/lib/crm';

export const runtime = 'nodejs';

const client = new Anthropic();


export async function POST(req: Request) {
  // The assistant costs money per message — reserve it for the service area.
  if (!isServiceArea(req)) {
    return new Response(
      'Our service covers Ireland — for anything else, email us and we will point you to someone local.',
      { status: 403 },
    );
  }
  if (isRateLimited(`chat:${clientIp(req)}`, 15, 5 * 60 * 1000)) {
    return new Response('Too many requests — please slow down a little.', { status: 429 });
  }

  let body: { messages?: Array<{ role: string; content: string }> };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid body', { status: 400 });
  }

  const messages = (body.messages ?? [])
    .filter(
      (m): m is { role: 'user' | 'assistant'; content: string } =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim().length > 0,
    )
    // Cap each message so oversized payloads can't run up model-token costs.
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return new Response('Last message must be from user', { status: 400 });
  }

  // Limit history to last 10 messages to keep context manageable
  const trimmed = messages.slice(-10);

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SITE_CHAT_PROMPT,
    messages: trimmed,
    tools: [
      {
        name: 'save_lead',
        description:
          "Save the visitor's contact details as a lead so the team follows up. Call exactly once, only when you have both a name and a phone number the visitor actually provided.",
        input_schema: {
          type: 'object' as const,
          properties: {
            name: { type: 'string', description: 'Visitor name as given' },
            phone: { type: 'string', description: 'Phone number as given' },
            bmw_model: { type: 'string', description: 'Car model/year if mentioned' },
            service: { type: 'string', description: 'What they want done, short' },
            note: { type: 'string', description: 'Any useful context from the chat' },
          },
          required: ['name', 'phone'],
        },
      },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      // If the model captured a lead, persist it and notify the owner.
      try {
        const final = await stream.finalMessage();
        const tool = final.content.find(
          (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'save_lead',
        );
        if (tool) {
          const inp = tool.input as {
            name?: string; phone?: string; bmw_model?: string; service?: string; note?: string;
          };
          const name = String(inp.name ?? '').trim().slice(0, 120);
          const phone = String(inp.phone ?? '').trim().slice(0, 120);
          if (name && phoneKey(phone).length >= 7) {
            const bmw_model = String(inp.bmw_model ?? '').trim().slice(0, 160);
            const service = String(inp.service ?? '').trim().slice(0, 160);
            const note = String(inp.note ?? '').trim().slice(0, 1000);
            const sb = getSupabaseAdmin();
            let id: number | undefined;
            let banned = false;
            let code: string | undefined;
            if (sb) {
              const { data } = await sb
                .from('bookings')
                .insert({ name, contact: phone, bmw_model, service, message: note, source: 'AI chat', status: 'pending' })
                .select('id')
                .single();
              id = (data as { id: number } | null)?.id;
              const cl = await ensureClient(sb, phone, name).catch(() => null);
              banned = cl?.banned ?? false;
              code = cl ? clientCode(cl.id) : undefined;
              if (banned && id) await sb.from('bookings').update({ status: 'declined' }).eq('id', id);
            }
            await notifyTelegram({
              name,
              contact: phone,
              bmw_model,
              service,
              message: note,
              slot_date: null,
              slot_time: '',
              source: '🤖 AI chat on site',
              id,
              persisted: Boolean(id),
              clientNote: banned
                ? `⛔️ BLACKLISTED · ${code ?? ''} — auto-declined`
                : code
                  ? `🆔 <b>Client:</b> ${code}`
                  : undefined,
            });
            controller.enqueue(
              encoder.encode(`\n\n✅ Saved — we'll text ${phone} shortly to confirm the details.`),
            );
          } else {
            controller.enqueue(
              encoder.encode(`\n\nHmm, that number looks incomplete — could you double-check it?`),
            );
          }
        }
      } catch {
        // Never break the chat over lead persistence.
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
