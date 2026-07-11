import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOwnerWithMarkup } from '@/lib/telegram';
import { translateToRussian } from '@/lib/translate';

export const runtime = 'nodejs';

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

  // Mirror to the owner's Telegram.
  const label = name ? `${escapeHtml(name)} · ` : '';
  const ruLine = text ? await translateToRussian(text).then((t) => (t && t !== text ? `\n🇷🇺 ${escapeHtml(t)}` : '')) : '';
  const lines = [`💬 <b>WhatsApp (ManyChat)</b> · ${label}<code>+${phone}</code>`];
  if (text) lines.push(`«${escapeHtml(text)}»${ruLine}`);
  if (aiReply) lines.push(`🤖 ${escapeHtml(aiReply)}`);
  if (paused) lines.push('⏸ AI paused for this chat — replies handled by you.');
  await sendOwnerWithMarkup(lines.join('\n'), {
    inline_keyboard: [[
      { text: paused ? '▶️ Resume AI' : '⏸ Stop AI here', callback_data: `${paused ? 'war' : 'wap'}:${phone}` },
      { text: '📋 Number', copy_text: { text: `+${phone}` } },
    ]],
  });

  // ManyChat reads these fields to decide whether to let its AI answer.
  return NextResponse.json({ ok: true, paused, ai_enabled: !paused });
}

export function GET() {
  return NextResponse.json({ ok: true, hint: 'ManyChat External Request endpoint — POST only.' });
}
