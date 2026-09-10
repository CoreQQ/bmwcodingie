import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOwnerWithMarkup } from '@/lib/telegram';
import { translateToRussian } from '@/lib/translate';
import { generateWaReply } from '@/lib/waAgent';
import { ensureClient } from '@/lib/crm';
import { isRateLimited } from '@/lib/rateLimit';
import { sendManyChatText } from '@/lib/manychatSend';

export const runtime = 'nodejs';
// ManyChat's External Request gives up quickly — keep the whole turn short.
export const maxDuration = 30;

// ManyChat allows an External Request about ten seconds. Answer later than
// that and it drops our response: the `ai_reply` custom field keeps the
// PREVIOUS run's text and the customer is sent that old message again — the
// "bot repeats itself" bug. So the whole turn runs against a hard budget, and
// we would rather return nothing (and ping Alex) than overshoot it.
const TURN_BUDGET_MS = 9000;

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
  const startedAt = Date.now();
  const left = () => TURN_BUDGET_MS - (Date.now() - startedAt);
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

  // A photo, voice note or sticker is Alex's to answer — guessing from an
  // attachment we cannot even open is how customers get told the wrong price.
  if (phone && !text && !aiReply && !imageUrl) {
    const fallback =
      "Got that 👍 I can't open attachments here, so I'm passing it straight to Alex — " +
      'he will look at it himself and come back to you shortly.';
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
    // The customer has been told Alex is looking, so the assistant must not
    // keep chatting over him until he has had his say.
    const db = getSupabaseAdmin();
    if (db) {
      await db
        .from('wa_chats')
        .upsert({ wa_id: phone, owner_replied_at: new Date().toISOString() })
        .then(() => undefined, () => undefined);
    }
    return NextResponse.json({ ok: true, paused: false, ai_enabled: true, reply: fallback, has_reply: true, memory: priorMemory });
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
  let aiOff = false;
  if (sb) {
    // Track the chat, read the pause flag (owner may have taken over) and the
    // global kill switch in one go — every millisecond spent before the model
    // starts is a millisecond closer to ManyChat's timeout.
    // Remember ManyChat's own subscriber id so replying from Telegram never
    // has to guess it back from a phone field WhatsApp contacts often lack.
    // The column may not exist yet — fall back rather than lose the chat row.
    const chatRow = { wa_id: phone, name: name || null, last_at: new Date().toISOString() };
    const upsertChat = async () => {
      const withId = await sb
        .from('wa_chats')
        .upsert({ ...chatRow, ...(subscriberId ? { mc_id: subscriberId } : {}) })
        .select('paused, owner_replied_at')
        .single();
      if (!withId.error) return withId;
      return sb.from('wa_chats').upsert(chatRow).select('paused, owner_replied_at').single();
    };
    const [{ data: chat }, { data: cfg }] = await Promise.all([
      upsertChat(),
      sb.from('app_config').select('value').eq('key', 'wa_ai_enabled').maybeSingle(),
    ]);
    // Global kill switch: /ai off in Telegram stops every automatic reply
    // instantly, while the mirror to Telegram keeps working.
    if ((cfg as { value?: string } | null)?.value === 'off') aiOff = true;
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
  // The last thing we told this customer — used both to spot ManyChat
  // re-sending an old inbound text and to make sure we never hand it back a
  // reply identical to the one it already delivered.
  let lastAssistant = '';
  if (sb) {
    const { data: prev } = await sb
      .from('wa_messages')
      .select('role, content, created_at')
      .eq('wa_id', phone)
      .order('created_at', { ascending: false })
      .limit(8);
    const rows = (prev ?? []) as { role: string; content: string; created_at: string }[];
    lastAssistant = rows.find((r) => r.role === 'assistant')?.content?.trim() ?? '';
    // users[0] is the message we just stored, so the comparison is strictly
    // against the one BEFORE it — falling back to users[0] would compare the
    // message with itself and silence every first message of a new chat.
    const earlier = rows.filter((r) => r.role === 'user')[1];
    staleDuplicate =
      Boolean(text) &&
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
    return NextResponse.json({
      ok: true,
      duplicate: true,
      paused: true,
      ai_enabled: false,
      reply: '',
      has_reply: false,
      memory: priorMemory,
    });
  }

  // Generate our own reply (ManyChat just delivers it) unless the owner
  // paused this chat or we hit the per-sender cost cap.
  let reply = aiReply;
  let memory = priorMemory;
  let aiError = '';
  let tooSlow = false;
  /** Set when a slow turn is being delivered out-of-band; awaited at the end. */
  let late: Promise<boolean> | null = null;
  if (sb && (text || imageUrl) && !paused && !aiOff && !aiReply) {
    if (isRateLimited(`wa-ai:${phone}`, 20, 60 * 60 * 1000)) {
      reply = '';
    } else {
      try {
        if (isPhone) void ensureClient(sb, `+${phone}`, name || undefined).catch(() => null);
        // Leave room for the Telegram mirror after this — going over budget
        // is what makes ManyChat resend the previous answer.
        const budget = Math.max(1000, left() - 1500);
        const work = generateWaReply(
          sb,
          phone,
          text || 'Photo attached.',
          name || undefined,
          'claude-haiku-4-5-20251001',
          isPhone ? `+${phone}` : `ManyChat ${phone}`,
          imageUrl || undefined,
          priorMemory || undefined,
        );
        const out = await Promise.race([
          work,
          new Promise<null>((r) => setTimeout(() => r(null), budget)),
        ]);
        if (!out) {
          // Too slow for ManyChat to deliver: handing it a late answer makes
          // it resend the previous one. Finish the thought anyway and send it
          // ourselves through the owner flow — a reply a few seconds late
          // beats a real customer sitting in silence.
          tooSlow = true;
          reply = '';
          late = work
            .then(async (done) => {
              if (!done.reply || done.reply.trim() === lastAssistant) return false;
              const sent = await sendManyChatText(phone, done.reply, subscriberId || undefined);
              if (!sent.ok) return false;
              await sb.from('wa_messages').insert({
                msg_id: `mc:${phone}:${Date.now()}:late`,
                wa_id: phone,
                role: 'assistant',
                content: done.reply,
                via: 'ai',
              });
              return true;
            })
            .catch(() => false);
        } else {
          reply = out.reply;
          memory = out.memory;
        }
        // Never hand back the exact text the customer already received.
        if (reply && reply.trim() === lastAssistant) reply = '';
        if (reply) {
          await sb.from('wa_messages').insert({
            msg_id: `mc:${phone}:${Date.now()}:ai`,
            wa_id: phone,
            role: 'assistant',
            content: reply,
            via: 'ai',
          });
        }
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
  const ruLine =
    text && left() > 2000
      ? await translateToRussian(text).then((t) => (t && t !== text ? `\n🇷🇺 ${escapeHtml(t)}` : ''))
      : '';
  const who = isPhone ? `+${phone}` : `ManyChat id ${phone}`;
  const lines = [`💬 <b>WhatsApp (ManyChat)</b> · ${label}<code>${who}</code>`];
  if (imageUrl) lines.push('📷 <i>sent a photo</i>');
  if (text) lines.push(`«${escapeHtml(text)}»${ruLine}`);
  if (reply) lines.push(`🤖 ${escapeHtml(reply)}`);
  if (tooSlow)
    lines.push(
      '🐢 The assistant was too slow for ManyChat — finishing the answer and sending it separately. ' +
        'Keep an eye on the chat in case it does not land.',
    );
  if (aiOff) lines.push('🔇 Auto-replies are OFF (/ai on to re-enable) — answer this one yourself.');
  else if (ownerHandling) lines.push('✋ You are handling this chat — the assistant stays quiet for 6h from your last reply.');
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

  // A slow turn is still being written. Stay in the handler until it has been
  // delivered — ManyChat has already given up on this response, but the
  // customer has not given up on an answer.
  const lateSent = late ? await late : null;
  if (late && !lateSent) {
    await sendOwnerWithMarkup(
      `🐢 <b>Could not deliver the late answer</b> · <code>${who}</code>\nReply to them yourself.`,
      { inline_keyboard: [[{ text: '📋 Number', copy_text: { text: who } }]] },
    ).catch(() => undefined);
  }

  // ManyChat sends `reply` back to the customer; `paused` lets its flow
  // branch when the owner has taken the chat over.
  return NextResponse.json({
    ok: true,
    paused,
    ai_enabled: !paused,
    reply,
    // `has_reply` lets the ManyChat flow branch: send the message only when it
    // is "true", so an empty answer can never fall through to the stale value
    // still sitting in the ai_reply field.
    has_reply: Boolean(reply),
    memory,
    ms: Date.now() - startedAt,
    ...(tooSlow ? { timeout: true, late_sent: Boolean(lateSent) } : {}),
    ...(aiError ? { error: aiError } : {}),
  });
}

export async function GET(req: Request) {
  // Diagnostics: /api/manychat?key=<secret>&debug=<phone> shows exactly what
  // we received and answered for that chat — the only way to tell a ManyChat
  // delivery problem apart from a model problem.
  const url = new URL(req.url);
  const debug = url.searchParams.get('debug');
  const provided = url.searchParams.get('key') || '';
  if (debug && process.env.MANYCHAT_SECRET && provided === process.env.MANYCHAT_SECRET) {
    const sb = getSupabaseAdmin();
    if (!sb) return NextResponse.json({ ok: false, error: 'no db' });
    const waId = debug.replace(/\D/g, '');
    const [{ data }, chat] = await Promise.all([
      sb
        .from('wa_messages')
        .select('role, content, via, created_at')
        .eq('wa_id', waId)
        .order('created_at', { ascending: false })
        .limit(12),
      sb.from('wa_chats').select('mc_id, paused, owner_replied_at, last_at').eq('wa_id', waId).maybeSingle(),
    ]);
    return NextResponse.json({
      ok: true,
      wa_id: waId,
      note: 'newest first — compare with the real WhatsApp thread',
      // Which ManyChat contact we would reply to, and when we last heard from
      // them — the two facts that decide whether an outbound send can work.
      chat: chat.data ?? null,
      messages: (data ?? []) as unknown[],
    });
  }

  return await handleStatus();
}

async function handleStatus() {
  // `db`/`ai` tell us whether this deployment can talk to Supabase and the
  // model; `memory` says whether the conversation tables exist — without them
  // the agent answers every message with no recollection of the last one.
  const sb = getSupabaseAdmin();
  let memory = false;
  // Which migrations have actually been applied. Everything below degrades
  // gracefully without them, but each `false` is a feature quietly not
  // working, so it is worth being able to see them at a glance.
  const schema: Record<string, boolean> = {};
  if (sb) {
    const [msgs, takeover, reminded, models, mcId] = await Promise.all([
      sb.from('wa_messages').select('msg_id').limit(1),
      sb.from('wa_chats').select('owner_replied_at').limit(1),
      sb.from('bookings').select('reminded_at').limit(1),
      sb.from('car_models').select('id').limit(1),
      sb.from('wa_chats').select('mc_id').limit(1),
    ]);
    memory = !msgs.error;
    schema.owner_takeover = !takeover.error;
    schema.reminders = !reminded.error;
    schema.car_models = !models.error;
    schema.manychat_id = !mcId.error;
  }
  return NextResponse.json({
    ok: true,
    hint: 'ManyChat External Request endpoint — POST only.',
    v: 27,
    db: Boolean(sb),
    ai: Boolean(process.env.ANTHROPIC_API_KEY),
    send: Boolean(process.env.MANYCHAT_API_KEY),
    memory,
    schema,
  });
}
