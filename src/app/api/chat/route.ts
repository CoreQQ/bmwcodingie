import Anthropic from '@anthropic-ai/sdk';
import { clientIp, isRateLimited } from '@/lib/rateLimit';
import { SITE_CHAT_PROMPT } from '@/lib/assistantPrompt';

export const runtime = 'nodejs';

const client = new Anthropic();


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
    system: SITE_CHAT_PROMPT,
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
