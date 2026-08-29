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

  const name = String(body.name ?? '').trim().slice(0, 120);
  const phone = String(body.phone ?? body.whatsapp ?? '').replace(/[^\d]/g, '').slice(0, 20);
  const text = String(body.text ?? body.message ?? '').trim().slice(0, 4000);
  // Optional: the reply ManyChat's AI produced, so we can mirror it too.
  const aiReply = String(body.reply ?? '').trim().slice(0, 4000);

  if (!phone || (!text && !aiReply)) {
    return NextResponse.json({ ok: false, error: 'phone and text required' }, { status: 400 });
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
        void ensureClient(sb, `+${phone}`, name || undefined).catch(() => null);
        reply = await generateWaReply(sb, phone, text, name || undefined, 'claude-haiku-4-5-20251001');
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
  const lines = [`💬 <b>WhatsApp (ManyChat)</b> · ${label}<code>+${phone}</code>`];
  if (text) lines.push(`«${escapeHtml(text)}»${ruLine}`);
  if (reply) lines.push(`🤖 ${escapeHtml(reply)}`);
  if (paused) lines.push('⏸ AI paused for this chat — replies handled by you.');
  await sendOwnerWithMarkup(lines.join('\n'), {
    inline_keyboard: [[
      { text: paused ? '▶️ Resume AI' : '⏸ Stop AI here', callback_data: `${paused ? 'war' : 'wap'}:${phone}` },
      { text: '📋 Number', copy_text: { text: `+${phone}` } },
    ]],
  });

  // ManyChat sends `reply` back to the customer; `paused` lets its flow
  // branch when the owner has taken the chat over.
  return NextResponse.json({ ok: true, paused, ai_enabled: !paused, reply, ...(aiError ? { error: aiError } : {}) });
}

export function GET() {
  // `db` tells us whether the service-role key reached this deployment —
  // without it the bridge can only mirror, never answer.
  return NextResponse.json({
    ok: true,
    hint: 'ManyChat External Request endpoint — POST only.',
    v: 2,
    db: Boolean(getSupabaseAdmin()),
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
  });
}
