import Anthropic from '@anthropic-ai/sdk';
import { clientIp, isRateLimited } from '@/lib/rateLimit';

export const runtime = 'nodejs';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a friendly assistant for BMW Coding IE, an independent BMW coding and retrofit specialist based in Dublin, Ireland. You help customers understand our services and guide them toward booking.

Key facts about us:
- We offer dealer-level BMW coding, diagnostics and retrofits across Dublin, Kildare, Wicklow and Meath
- Services available in person or remotely over ENET (customer needs a laptop + ENET cable)
- We work with F and G series BMWs using ISTA/Rheingold, E-Sys and BimmerCode
- Payment is on completion — no upfront payment required

Our services include:
- Apple CarPlay activation (from €120, wired or wireless on NBT/NBT Evo/MGU)
- Android Auto activation (from €120, iDrive 7/MGU only)
- Video in Motion (from €60)
- Ambient lighting retrofit — OEM contour lighting (price on request)
- Welcome/Coming Home lighting animations (from €50)
- DRL, indicator behaviour, window coding (from €50)
- Cruise control retrofit/activation (price on request)
- Comfort Access & auto mirror folding (from €50)
- Speed limit & traffic sign recognition (from €60)
- Start/Stop memory & seatbelt reminders (from €40)
- Japan → EU conversion / region change (from €150)
- Full ISTA diagnostics with written report (from €80)
- Hidden features & custom coding (price on request)
- Stage 1 / Stage 2 ECU remap (price on request)
- Sport displays & M instrument cluster layouts (from €60)
- BMW Apps, Remote Services, FSC/navigation codes (from €80 / on request)

How to respond:
- Keep answers concise and helpful — 2-4 sentences max unless more detail is genuinely needed
- If a customer asks about a specific service, give the price and a brief what-is-it explanation
- If unsure whether something is possible on their specific car, say "send us the chassis number / model year and we can confirm"
- Always end by suggesting they book via the contact form or WhatsApp
- Do not invent prices or services not listed above
- Be warm and professional — not salesy`;

export async function POST(req: Request) {
  if (isRateLimited(`chat:${clientIp(req)}`, 15, 5 * 60 * 1000)) {
    return new Response('Too many requests — please slow down a little.', { status: 429 });
  }

  let body: { messages?: Array<{ role: string; content: string }> };
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid body', { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m): m is { role: 'user' | 'assistant'; content: string } =>
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0,
  );

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return new Response('Last message must be from user', { status: 400 });
  }

  // Limit history to last 10 messages to keep context manageable
  const trimmed = messages.slice(-10);

  const stream = await client.messages.stream({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    system: SYSTEM_PROMPT,
    messages: trimmed,
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
