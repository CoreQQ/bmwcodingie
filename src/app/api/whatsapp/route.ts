import crypto from 'crypto';
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseAdmin } from '@/lib/supabase';
import { WHATSAPP_PROMPT } from '@/lib/assistantPrompt';
import { sendWhatsAppText, markWhatsAppRead, isWhatsAppConfigured } from '@/lib/whatsapp';
import { sendOwnerWithMarkup } from '@/lib/telegram';
import { translateToRussian } from '@/lib/translate';
import { isRateLimited } from '@/lib/rateLimit';
import { ensureClient } from '@/lib/crm';
import { generateWaReply } from '@/lib/waAgent';

export const runtime = 'nodejs';
export const maxDuration = 60;

// AI auto-responder for the business WhatsApp number (official Cloud API).
// Every inbound message is answered by Claude with the shared business brain,
// mirrored to the owner's Telegram (with a pause button per chat), and stored
// in Supabase so the model sees the conversation history.

const ok = () => NextResponse.json({ ok: true });

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Webhook verification handshake (Meta calls this once on setup) ──
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge ?? '', { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

type WaMessage = {
  id: string;
  from: string;
  type: string;
  text?: { body: string };
};

export async function POST(req: Request) {
  const raw = await req.text();

  // Optional signature check (set WHATSAPP_APP_SECRET to enable).
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const sig = req.headers.get('x-hub-signature-256') || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(raw).digest('hex');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return new Response('Bad signature', { status: 401 });
    }
  }

  if (!isWhatsAppConfigured()) return ok();

  let update: {
    entry?: { changes?: { value?: { messages?: WaMessage[]; contacts?: { profile?: { name?: string } }[] } }[] }[];
  };
  try {
    update = JSON.parse(raw);
  } catch {
    return ok();
  }

  const sb = getSupabaseAdmin();
  if (!sb) return ok();

  for (const entry of update.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages?.length) continue; // delivery/read statuses etc.
      const name = value.contacts?.[0]?.profile?.name || '';

      for (const msg of value.messages) {
        try {
          await handleMessage(sb, msg, name);
        } catch (e) {
          // Never fail the webhook — Meta retries aggressively. Tell the owner.
          const err = e instanceof Error ? e.message : String(e);
          await sendOwnerWithMarkup(
            `⚠️ WhatsApp bot error for <code>+${msg.from}</code>: ${escapeHtml(err)}\nReply manually: <code>/wa +${msg.from} your text</code>`,
          );
        }
      }
    }
  }
  return ok();
}

async function handleMessage(
  sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  msg: WaMessage,
  name: string,
) {
  const waId = msg.from;
  const label = name ? `${name} · ` : '';

  // Non-text messages: mirror to the owner, no AI attempt.
  if (msg.type !== 'text' || !msg.text?.body) {
    await sendOwnerWithMarkup(
      `💬 <b>WhatsApp</b> · ${escapeHtml(label)}<code>+${waId}</code>\n📎 Sent a ${msg.type} message — open WhatsApp to view. AI didn't reply.`,
      { inline_keyboard: [[{ text: '📋 Copy number', copy_text: { text: `+${waId}` } }]] },
    );
    return;
  }

  const text = msg.text.body.trim();

  // Dedupe: Meta retries webhooks; msg_id is the primary key.
  const { error: insErr } = await sb
    .from('wa_messages')
    .insert({ msg_id: msg.id, wa_id: waId, role: 'user', content: text, via: 'customer' });
  if (insErr?.code === '23505') return; // already processed

  void markWhatsAppRead(msg.id);

  // Every WhatsApp contact becomes a CRM client automatically — the number
  // is verified by WhatsApp itself, the profile name fills the card.
  void ensureClient(sb, `+${waId}`, name || undefined).catch(() => null);

  // Chat state (pause flag + name for the owner's view).
  const { data: chat } = await sb
    .from('wa_chats')
    .upsert({ wa_id: waId, name: name || null, last_at: new Date().toISOString() })
    .select('paused')
    .single();

  const ruLine = await translateToRussian(text).then((t) => (t && t !== text ? `\n🇷🇺 ${t}` : ''));

  if (chat?.paused) {
    await sendOwnerWithMarkup(
      `💬 <b>WhatsApp</b> · ${escapeHtml(label)}<code>+${waId}</code>\n«${escapeHtml(text)}»${escapeHtml(ruLine)}\n\n⏸ AI is paused for this chat — reply yourself:\n<code>/wa +${waId} </code>`,
      {
        inline_keyboard: [[
          { text: '▶️ Resume AI here', callback_data: `war:${waId}` },
          { text: '📋 Number', copy_text: { text: `+${waId}` } },
        ]],
      },
    );
    return;
  }

  // Cost cap: at most 20 AI replies per sender per hour; beyond that we
  // mirror to the owner without answering.
  if (isRateLimited(`wa-ai:${waId}`, 20, 60 * 60 * 1000)) {
    await sendOwnerWithMarkup(
      `💬 <b>WhatsApp</b> · ${escapeHtml(label)}<code>+${waId}</code>\n«${escapeHtml(text)}»${escapeHtml(ruLine)}\n\n🤖 Rate limit hit for this chat this hour — reply yourself: <code>/wa +${waId} </code>`,
      { inline_keyboard: [[{ text: '📋 Number', copy_text: { text: `+${waId}` } }]] },
    );
    return;
  }

  const { reply } = await generateWaReply(sb, waId, text, name);

  const sent = await sendWhatsAppText(waId, reply);
  if (!sent.ok) throw new Error(sent.error || 'send failed');

  await sb.from('wa_messages').insert({
    msg_id: sent.id || `out:${msg.id}`,
    wa_id: waId,
    role: 'assistant',
    content: reply,
    via: 'ai',
  });

  await sendOwnerWithMarkup(
    `💬 <b>WhatsApp</b> · ${escapeHtml(label)}<code>+${waId}</code>\n«${escapeHtml(text)}»${escapeHtml(ruLine)}\n\n🤖 ${escapeHtml(reply)}`,
    {
      inline_keyboard: [[
        { text: '⏸ Stop AI here', callback_data: `wap:${waId}` },
        { text: '📋 Number', copy_text: { text: `+${waId}` } },
      ]],
    },
  );
}
