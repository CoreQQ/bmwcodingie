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
  // A photo of the iDrive screen decides the price, so accept it under any of
  // the names ManyChat might use.
  const rawImage = deepFind(body, [
    'image_url', 'image', 'attachment_url', 'media_url', 'photo', 'photo_url', 'file_url',
    'last_attachment_url', 'cf_photo_url', 'idrive_photo',
  ]);
  const imageUrl = /^https:\/\//.test(rawImage) && !unresolved(rawImage) ? rawImage : '';
  // Facts the agent stored last time. ManyChat holds them per contact, so the
  // bot keeps its memory even before the conversation tables exist.
  const rawMemory = deepFind(body, ['memory', 'bot_memory', 'cf_bot_memory', 'notes']);
  const priorMemory = unresolved(rawMemory) ? '' : rawMemory.slice(0, 400);
  // Optional: the reply ManyChat's AI produced, so we can mirror it too.
  const aiReply = String(body.reply ?? '').trim().slice(0, 4000);

  // A message we cannot read (photo, voice note, sticker) must never end in
  // silence: answer helpfully and make sure the owner sees it.
  if (phone && !text && !aiReply && !imageUrl) {
    const fallback =
      "Got that 👍 I can't open attachments here — could you type it out for me? " +
      'If it is your iDrive screen: tell me the model and year and I will confirm ' +
      'which system you have and the exact price.';
    await sendOwnerWithMarkup(
      `💬 <b>WhatsApp (ManyChat)</b> · ${name ? `${escapeHtml(name)} · ` : ''}<code>${
        isPhone ? `+${phone}` : `ManyChat id ${phone}`
      }</code>\n📎 <i>sent an attachment the bot cannot read (photo / voice / sticker)</i>`,
      {
        inline_keyboard: [[
          { text: '📋 Number', copy_text: { text: isPhone ? `+${phone}` : phone } },
        ]],
      },
    ).catch(() => undefined);
    return NextResponse.json({ ok: true, paused: false, ai_enabled: true, reply: fallback, memory: priorMemory });
  }

  if (!phone || (!text && !aiReply && !imageUrl)) {
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
  let ownerHandling = false;
  if (sb) {
    // Track the chat + read the pause flag (owner may have taken over).
    const { data: chat } = await sb
      .from('wa_chats')
      .upsert({ wa_id: phone, name: name || null, last_at: new Date().toISOString() })
      .select('paused, owner_replied_at')
      .single();
    const row = chat as { paused?: boolean; owner_replied_at?: string | null } | null;
    // The owner is handling this one: stay out of it for six hours, then the
    // assistant picks the conversation back up so nobody is left waiting.
    const takenOver =
      Boolean(row?.owner_replied_at) &&
      Date.now() - new Date(row!.owner_replied_at as string).getTime() < 6 * 60 * 60 * 1000;
    paused = Boolean(row?.paused) || takenOver;
    ownerHandling = takenOver;

    if (text || imageUrl) {
      await sb.from('wa_messages').insert({
        msg_id: `mc:${phone}:${Date.now()}`,
        wa_id: phone,
        role: 'user',
        content: imageUrl ? `[photo] ${text}`.trim() : text,
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

  // ManyChat sometimes re-sends the previous message text (its Last Text Input
  // field does not always refresh), which made the assistant answer the same
  // thing twice while the customer's real message went unanswered. If the text
  // is identical to the last one we stored, do not answer at all — tell Alex.
  let staleDuplicate = false;
  if (sb && text) {
    const { data: prev } = await sb
      .from('wa_messages')
      .select('content, created_at')
      .eq('wa_id', phone)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(2);
    const rows = (prev ?? []) as { content: string; created_at: string }[];
    const earlier = rows[1] ?? rows[0];
    staleDuplicate =
      Boolean(earlier) &&
      earlier.content.trim() === text.trim() &&
      Date.now() - new Date(earlier.created_at).getTime() < 12 * 60 * 60 * 1000;
  }

  if (staleDuplicate) {
    await sendOwnerWithMarkup(
      `⚠️ <b>WhatsApp (ManyChat)</b> · ${name ? `${escapeHtml(name)} · ` : ''}<code>${
        isPhone ? `+${phone}` : phone
      }</code>\nManyChat delivered the same text again — the customer's newest message did not reach us, so the assistant stayed silent. Open WhatsApp and read it yourself.`,
      { inline_keyboard: [[{ text: '📋 Number', copy_text: { text: isPhone ? `+${phone}` : phone } }]] },
    ).catch(() => undefined);
    return NextResponse.json({ ok: true, paused: true, ai_enabled: false, reply: '', memory: priorMemory });
  }

  // Generate our own reply (ManyChat just delivers it) unless the owner
  // paused this chat or we hit the per-sender cost cap.
  let reply = aiReply;
  let memory = priorMemory;
  let aiError = '';
  if (sb && (text || imageUrl) && !paused && !aiReply) {
    if (isRateLimited(`wa-ai:${phone}`, 20, 60 * 60 * 1000)) {
      reply = '';
    } else {
      try {
        if (isPhone) void ensureClient(sb, `+${phone}`, name || undefined).catch(() => null);
        const out = await generateWaReply(
          sb,
          phone,
          text || 'Photo attached.',
          name || undefined,
          'claude-haiku-4-5-20251001',
          isPhone ? `+${phone}` : `ManyChat ${phone}`,
          imageUrl || undefined,
          priorMemory || undefined,
        );
        reply = out.reply;
        memory = out.memory;
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
  if (imageUrl) lines.push('📷 <i>sent a photo</i>');
  if (text) lines.push(`«${escapeHtml(text)}»${ruLine}`);
  if (reply) lines.push(`🤖 ${escapeHtml(reply)}`);
  if (ownerHandling) lines.push('✋ You are handling this chat — the assistant stays quiet for 6h from your last reply.');
  else if (paused) lines.push('⏸ AI paused for this chat — replies handled by you.');
  await sendOwnerWithMarkup(lines.join('\n'), {
    inline_keyboard: [
      [
        { text: paused ? '▶️ Resume AI' : '⏸ Stop AI here', callback_data: `${paused ? 'war' : 'wap'}:${phone}` },
        { text: '✋ I\'ll reply (6h)', callback_data: `wamine:${phone}` },
      ],
      [{ text: '📋 Number', copy_text: { text: who } }],
    ],
  });

  // ManyChat sends `reply` back to the customer; `paused` lets its flow
  // branch when the owner has taken the chat over.
  return NextResponse.json({
    ok: true,
    paused,
    ai_enabled: !paused,
    reply,
    memory,
    ...(aiError ? { error: aiError } : {}),
  });
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
    v: 16,
    db: Boolean(sb),
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    memory,
  });
}
