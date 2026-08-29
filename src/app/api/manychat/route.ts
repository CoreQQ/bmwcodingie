import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOwnerWithMarkup } from '@/lib/telegram';
import { translateToRussian } from '@/lib/translate';
import { generateWaReply } from '@/lib/waAgent';
import { ensureClient } from '@/lib/crm';
import { isRateLimited } from '@/lib/rateLimit';

export const runtime = 'nodejs';
// ManyChat's External Request gives up quickly — keep the whole turn short.
export const maxDuration = 30;

// Bridge for a ManyChat WhatsApp bot: ManyChat calls this via an "External
// Request" on each inbound message. We mirror the chat to the owner's Telegram
// (with RU translation), store it in wa_messages, and report whether the owner
// has paused the AI for this chat so ManyChat can branch on it.
//
// Secured by a shared secret (MANYCHAT_SECRET) sent as ?key= or x-manychat-secret.

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


/**
 * ManyChat can send a flat body or its whole contact object (the "Add Full
 * Contact Data" button), and names the phone differently per channel. Rather
 * than demanding one exact shape, walk the payload and take the first usable
 * value for each field. Placeholder text that was never substituted (no
 * digits in a phone, "{{...}}" or "⟦...⟧" in a text) is ignored.
 */
function deepFind(body: unknown, keys: string[], depth = 0): string {
  if (depth > 4 || !body || typeof body !== 'object') return '';
  const obj = body as Record<string, unknown>;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' || typeof v === 'number') {
      const str = String(v).trim();
      if (str && !/^[{⟦]|[}⟧]$/.test(str)) return str;
    }
  }
  for (const v of Object.values(obj)) {
    if (v && typeof v === 'object') {
      const found = deepFind(v, keys, depth + 1);
      if (found) return found;
    }
  }
  return '';
}

const unresolved = (s: string) => /\{\{|⟦|⟧/.test(s);

export async function POST(req: Request) {
  const secret = process.env.MANYCHAT_SECRET;
  const url = new URL(req.url);
  const provided = req.headers.get('x-manychat-secret') || url.searchParams.get('key') || '';
  if (!secret || provided !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const firstName = deepFind(body, ['first_name', 'name']);
  const lastName = deepFind(body, ['last_name']);
  const name = `${firstName} ${lastName}`.trim().slice(0, 120);
  const rawPhone = deepFind(body, [
    'phone', 'whatsapp', 'wa_id', 'whatsapp_phone', 'contact_phone', 'optin_phone',
  ]).replace(/[^\d]/g, '');
  const subscriberId = deepFind(body, ['user_id', 'subscriber_id', 'id', 'key'])
    .replace(/[^\d]/g, '')
    .slice(0, 24);
  const isPhone = rawPhone.length >= 8;
  const phone = (isPhone ? rawPhone : subscriberId).slice(0, 24);
  const rawText = deepFind(body, ['text', 'message', 'last_input_text', 'last_text_input']);
  const text = unresolved(rawText) ? '' : rawText.trim().slice(0, 4000);
  // Optional: the reply ManyChat's AI produced, so we can mirror it too.
  const aiReply = String(body.reply ?? '').trim().slice(0, 4000);

  if (!phone || (!text && !aiReply)) {
    // Echo what actually arrived — guessing which ManyChat field is empty
    // from the other side is painful.
    return NextResponse.json(
      {
        ok: false,
        error: 'need a phone (or subscriber id) and a text',
        received: { keys: Object.keys(body), phone: rawPhone || null, subscriberId: subscriberId || null, text: text || null },
      },
      { status: 400 },
    );
  }

  const sb = getSupabaseAdmin();
  // Even without a DB we still mirror to Telegram.
  let paused = false;
  if (sb) {
    // Track the chat + read the pause flag (owner may have taken over).
    const { data: chat } = await sb
      .from('wa_chats')
      .upsert({ wa_id: phone, name: name || null, last_at: new Date().toISOString() })
      .select('paused')
      .single();
    paused = Boolean(chat?.paused);

    if (text) {
      await sb.from('wa_messages').insert({
        msg_id: `mc:${phone}:${Date.now()}`,
        wa_id: phone,
        role: 'user',
        content: text,
        via: 'customer',
      });
    }
    if (aiReply) {
      await sb.from('wa_messages').insert({
        msg_id: `mc:${phone}:${Date.now()}:ai`,
        wa_id: phone,
        role: 'assistant',
        content: aiReply,
        via: 'ai',
      });
    }
  }

  // Generate our own reply (ManyChat just delivers it) unless the owner
  // paused this chat or we hit the per-sender cost cap.
  let reply = aiReply;
  let aiError = '';
  if (sb && text && !paused && !aiReply) {
    if (isRateLimited(`wa-ai:${phone}`, 20, 60 * 60 * 1000)) {
      reply = '';
    } else {
      try {
        if (isPhone) void ensureClient(sb, `+${phone}`, name || undefined).catch(() => null);
        reply = await generateWaReply(
          sb,
          phone,
          text,
          name || undefined,
          'claude-haiku-4-5-20251001',
          isPhone ? `+${phone}` : `ManyChat ${phone}`,
        );
        await sb.from('wa_messages').insert({
          msg_id: `mc:${phone}:${Date.now()}:ai`,
          wa_id: phone,
          role: 'assistant',
          content: reply,
          via: 'ai',
        });
      } catch (e) {
        // Surface the reason in the (secret-protected) response — silent
        // empty replies are impossible to debug from the ManyChat side.
        aiError = e instanceof Error ? e.message : String(e);
        reply = ''; // owner still gets the message in Telegram
      }
    }
  }

  // Mirror to the owner's Telegram.
  const label = name ? `${escapeHtml(name)} · ` : '';
  const ruLine = text ? await translateToRussian(text).then((t) => (t && t !== text ? `\n🇷🇺 ${escapeHtml(t)}` : '')) : '';
  const who = isPhone ? `+${phone}` : `ManyChat id ${phone}`;
  const lines = [`💬 <b>WhatsApp (ManyChat)</b> · ${label}<code>${who}</code>`];
  if (text) lines.push(`«${escapeHtml(text)}»${ruLine}`);
  if (reply) lines.push(`🤖 ${escapeHtml(reply)}`);
  if (paused) lines.push('⏸ AI paused for this chat — replies handled by you.');
  await sendOwnerWithMarkup(lines.join('\n'), {
    inline_keyboard: [[
      { text: paused ? '▶️ Resume AI' : '⏸ Stop AI here', callback_data: `${paused ? 'war' : 'wap'}:${phone}` },
      { text: '📋 Number', copy_text: { text: who } },
    ]],
  });

  // ManyChat sends `reply` back to the customer; `paused` lets its flow
  // branch when the owner has taken the chat over.
  return NextResponse.json({ ok: true, paused, ai_enabled: !paused, reply, ...(aiError ? { error: aiError } : {}) });
}

export async function GET() {
  // `db`/`ai` tell us whether this deployment can talk to Supabase and the
  // model; `memory` says whether the conversation tables exist — without them
  // the agent answers every message with no recollection of the last one.
  const sb = getSupabaseAdmin();
  let memory = false;
  if (sb) {
    const { error } = await sb.from('wa_messages').select('msg_id').limit(1);
    memory = !error;
  }
  return NextResponse.json({
    ok: true,
    hint: 'ManyChat External Request endpoint — POST only.',
    v: 5,
    db: Boolean(sb),
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    memory,
  });
}
