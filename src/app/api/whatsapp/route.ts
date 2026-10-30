import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  sendWhatsAppText,
  markWhatsAppRead,
  isWhatsAppConfigured,
  whatsAppPhoneId,
  downloadWhatsAppMedia,
  checkWhatsAppKey,
} from '@/lib/whatsapp';
import { sendOwnerWithMarkup } from '@/lib/telegram';
import { translateToRussian } from '@/lib/translate';
import { isRateLimited } from '@/lib/rateLimit';
import { ensureClient } from '@/lib/crm';
import { generateWaReply } from '@/lib/waAgent';
import { markContactHandled } from '@/lib/agenda';

export const runtime = 'nodejs';
export const maxDuration = 60;

// WhatsApp Business Cloud API webhook — Meta's own payload format, whether
// Meta posts here directly or through a coexistence relay (Dualhook's Webhook
// Override sends Meta's events straight to this URL). Every inbound message
// is answered by the shared business brain, mirrored to the owner's Telegram
// and stored in Supabase; the owner's own replies from his phone arrive as
// smb_message_echoes, so the assistant finally knows when to stay quiet.
//
// Meta wants a 200 within seconds and retries otherwise: we acknowledge at
// once and do the real work in waitUntil(), deduplicating on the message id.

const ok = () => NextResponse.json({ ok: true });
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const STAND_DOWN_MS = 6 * 60 * 60 * 1000;

// ── Verification handshake (Meta GETs this once when the webhook is saved) ──
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  // Meta's handshake: echo the challenge when the verify token matches. The
  // webhook URL itself also carries our secret (?key=…), so a matching key is
  // accepted too — a mistyped verify-token field in the provider's dashboard
  // (Dualhook, 16 Oct: HTTP 403) must not block the subscription.
  const key = url.searchParams.get('key') || '';
  const keyOk = Boolean(expected) && key.length === (expected ?? '').length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(expected as string));
  if (mode === 'subscribe' && expected && (token === expected || keyOk)) {
    return new Response(challenge ?? '', { status: 200 });
  }
  if (!mode) {
    // Status check for humans: is traffic flowing, and does the assistant see
    // the owner's own replies (smb_message_echoes)? Counts and times only —
    // no numbers, no message text.
    const sb = getSupabaseAdmin();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const stat = async (via: string, ownerOnly = false) => {
      if (!sb) return { n: 0, last: null as string | null };
      let q = sb
        .from('wa_messages')
        .select('created_at', { count: 'exact' })
        .gt('created_at', since)
        .eq('via', via);
      if (ownerOnly) q = q.like('content', '[Alex]%');
      const { data, count } = await q.order('created_at', { ascending: false }).limit(1);
      return { n: count ?? 0, last: (data?.[0] as { created_at?: string } | undefined)?.created_at ?? null };
    };
    const [owner, customer, ai, key] = await Promise.all([stat('owner', true), stat('customer'), stat('ai'), checkWhatsAppKey()]);
    return NextResponse.json({
      ok: true,
      // Deploy marker: bump it in a redeploy-only commit, then check it here
      // to know the new build (and new env values) are live.
      v: 101,
      hint: 'WhatsApp Cloud API webhook — Meta/Dualhook POST here.',
      configured: isWhatsAppConfigured(),
      base: process.env.WHATSAPP_API_BASE || 'graph.facebook.com',
      verify: Boolean(expected),
      key,
      last24h: {
        owner_replies_seen: owner.n,
        last_owner_reply: owner.last,
        customer_messages: customer.n,
        assistant_replies_delivered: ai.n,
      },
    });
  }
  return new Response('Forbidden', { status: 403 });
}

type WaMedia = { id: string; mime_type?: string; caption?: string };
type WaMessage = {
  id: string;
  from: string;
  timestamp?: string;
  type: string;
  text?: { body: string };
  image?: WaMedia;
  sticker?: WaMedia;
  audio?: WaMedia;
  video?: WaMedia;
  document?: WaMedia & { filename?: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
  button?: { text?: string };
  /** type 'unsupported': what Meta would not pass through (albums, view-once…). */
  errors?: { code?: number; title?: string; message?: string }[];
  unsupported?: { type?: string };
};
type WaEcho = { id: string; from: string; to: string; timestamp?: string; type: string; text?: { body: string } };
type WaStatus = {
  id: string;
  status: string;
  recipient_id?: string;
  errors?: { code?: number; title?: string; message?: string; error_data?: { details?: string } }[];
};
type WaChange = {
  field?: string;
  value?: {
    metadata?: { phone_number_id?: string };
    messages?: WaMessage[];
    contacts?: { wa_id?: string; profile?: { name?: string } }[];
    statuses?: WaStatus[];
    message_echoes?: WaEcho[];
  };
};
type WaUpdate = { object?: string; entry?: { id?: string; changes?: WaChange[] }[] };

/**
 * Who may post here. With Meta direct we check its HMAC; through Dualhook the
 * signature is made with their app secret, which we never see, so the URL
 * carries our own secret instead (?key=<WHATSAPP_VERIFY_TOKEN>). Either
 * proof is enough; neither means the request is rejected.
 */
function authorised(req: Request, raw: string): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (appSecret) {
    const sig = req.headers.get('x-hub-signature-256') || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(raw).digest('hex');
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  const key = new URL(req.url).searchParams.get('key') || '';
  const token = process.env.WHATSAPP_VERIFY_TOKEN || '';
  return Boolean(token) && key.length === token.length && crypto.timingSafeEqual(Buffer.from(key), Buffer.from(token));
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!authorised(req, raw)) return new Response('Unauthorized', { status: 401 });

  // Dualhook's own management events (account_update, template status…) come
  // with this header. Only the dashboard's Test Ping and anything that smells
  // like trouble reach the owner; the rest is acknowledged quietly.
  const dhEvent = req.headers.get('x-dualhook-event');
  if (dhEvent) {
    const trouble = /disconnect|offboard|health|alert|restrict|ban|violat|review|fail|error|expir|inactiv/i.test(dhEvent + ' ' + raw.slice(0, 2000));
    if (dhEvent === 'test_ping') {
      waitUntil(sendOwnerWithMarkup('✅ <b>Dualhook → site</b>: test ping received. Webhook wiring works.').catch(() => undefined));
    } else if (trouble) {
      waitUntil(
        sendOwnerWithMarkup(
          `⚠️ <b>Dualhook event</b> <code>${esc(dhEvent)}</code>\n<pre>${esc(raw.slice(0, 1200))}</pre>`,
        ).catch(() => undefined),
      );
    }
    return ok();
  }

  let update: WaUpdate;
  try {
    update = JSON.parse(raw);
  } catch {
    return ok();
  }
  if (update.object && update.object !== 'whatsapp_business_account') return ok();

  // Acknowledge now, work after: Meta's retry clock is short, Opus is not.
  waitUntil(handleUpdate(update).catch(() => undefined));
  return ok();
}

async function handleUpdate(update: WaUpdate): Promise<void> {
  const sb = getSupabaseAdmin();
  const ourPhone = whatsAppPhoneId();
  for (const entry of update.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value) continue;
      // A different phone_number_id is either a test number on the account
      // or our own number after a re-onboarding (the id changes with a new
      // WABA). Dropping it silently would lose leads, so the messages are
      // still handled (replies then fail visibly and arrive as "copy answer"),
      // and the owner is told once which id to put in WHATSAPP_PHONE_ID.
      const incomingPhone = value.metadata?.phone_number_id;
      if (ourPhone && incomingPhone && incomingPhone !== ourPhone && value.messages?.length) {
        if (!isRateLimited(`wa-phone-mismatch:${incomingPhone}`, 1, 6 * 60 * 60 * 1000)) {
          await sendOwnerWithMarkup(
            `⚙️ <b>WhatsApp messages arrive for phone_number_id</b> <code>${esc(incomingPhone)}</code>, but the site is set to <code>${esc(ourPhone)}</code>. ` +
              'If you re-connected the number, update WHATSAPP_PHONE_ID (and the API key) in Vercel — until then replies cannot be sent automatically.',
          ).catch(() => undefined);
        }
      }

      const field = change.field || (value.messages ? 'messages' : '');
      if (field === 'smb_message_echoes' || field === 'message_echoes') {
        const echoes = (value as unknown as { message_echoes?: WaEcho[]; smb_message_echoes?: WaEcho[] });
        for (const e of echoes.message_echoes ?? echoes.smb_message_echoes ?? []) {
          await handleOwnerEcho(sb, e, field === 'smb_message_echoes').catch(() => undefined);
        }
        continue;
      }
      if (field === 'messages' || value.messages || value.statuses) {
        for (const st of value.statuses ?? []) await handleStatus(sb, st).catch(() => undefined);
        const names = new Map<string, string>();
        for (const c of value.contacts ?? []) if (c.wa_id && c.profile?.name) names.set(c.wa_id, c.profile.name);
        for (const msg of value.messages ?? []) {
          const name = names.get(msg.from) || value.contacts?.[0]?.profile?.name || '';
          try {
            await handleMessage(sb, msg, name);
          } catch (e) {
            // Never let an error be silent: the customer got nothing.
            const err = e instanceof Error ? e.message : String(e);
            await sendOwnerWithMarkup(
              `⚠️ <b>WhatsApp bot error</b> · <code>+${msg.from}</code>\n<code>${esc(err.slice(0, 300))}</code>\nThe customer got no reply — answer them yourself.`,
              { inline_keyboard: [[{ text: '💬 Open WhatsApp', url: `https://wa.me/${msg.from}` }]] },
            ).catch(() => undefined);
          }
        }
      }
      // history / smb_app_state_sync / account_* : nothing to do, 200 was enough.
    }
  }
}

/** The owner typed in WhatsApp himself: he has the chat, store what he said. */
async function handleOwnerEcho(sb: SupabaseClient | null, e: WaEcho, fromPhone: boolean): Promise<void> {
  if (!sb || !e.to) return;
  const waId = e.to;
  const body = e.type === 'text' ? e.text?.body?.trim() ?? '' : `[${e.type}]`;
  // Dedupe on the WAMID; our own API sends arrive here too (message_echoes)
  // and are already stored under the id the send returned.
  const { error } = await sb
    .from('wa_messages')
    .insert({ msg_id: e.id, wa_id: waId, role: 'assistant', content: fromPhone ? `[Alex] ${body}` : body, via: 'owner' });
  if (error?.code === '23505') return;
  if (!fromPhone) return;
  // Alex is talking: the assistant stands down for six hours from his last word.
  await sb
    .from('wa_chats')
    .upsert({ wa_id: waId, owner_replied_at: new Date().toISOString(), last_at: new Date().toISOString() })
    .then(() => undefined, () => undefined);
  // ...and whatever this customer asked is answered: off the agenda's waiting list.
  await markContactHandled(sb, waId).catch(() => 0);
}

/** Delivery statuses: only failures matter, and they must reach the owner. */
async function handleStatus(sb: SupabaseClient | null, st: WaStatus): Promise<void> {
  if (st.status !== 'failed') return;
  const to = st.recipient_id || '';
  const why = (st.errors ?? [])
    .map((er) => [er.code, er.title, er.error_data?.details || er.message].filter(Boolean).join(' · '))
    .join('\n');
  let text = '';
  if (sb && st.id) {
    const { data } = await sb.from('wa_messages').select('content').eq('msg_id', st.id).maybeSingle();
    text = (data as { content?: string } | null)?.content ?? '';
  }
  await sendOwnerWithMarkup(
    `❌ <b>WhatsApp could not deliver</b>${to ? ` · <code>+${to}</code>` : ''}\n<code>${esc(why || 'no reason given')}</code>${
      text ? `\n\nThe message:\n<pre>${esc(text.slice(0, 1500))}</pre>` : ''
    }`,
    to ? { inline_keyboard: [[{ text: '💬 Open WhatsApp', url: `https://wa.me/${to}` }]] } : undefined,
  );
}

function describe(msg: WaMessage): string {
  switch (msg.type) {
    case 'image': return 'a photo';
    case 'sticker': return 'a sticker';
    case 'audio': return 'a voice note';
    case 'video': return 'a video';
    case 'document': return `a document${msg.document?.filename ? ` (${msg.document.filename})` : ''}`;
    case 'location': return 'a location';
    case 'contacts': return 'a contact card';
    default: return `a ${msg.type} message`;
  }
}

async function handleMessage(sb: SupabaseClient | null, msg: WaMessage, name: string): Promise<void> {
  const waId = msg.from;
  const label = name ? `${esc(name)} · ` : '';
  const who = `+${waId}`;
  const numberRow = [{ text: '💬 Open WhatsApp', url: `https://wa.me/${waId}` }, { text: '📋 Number', copy_text: { text: who } }];

  // What did they say? Text, a tapped button, or a photo with a caption.
  let text =
    msg.text?.body?.trim() ||
    msg.interactive?.button_reply?.title ||
    msg.interactive?.list_reply?.title ||
    msg.button?.text ||
    '';
  // A photo sent "as a file" (document) is still a photo the model can read —
  // as long as it is a format it accepts (iPhone HEIC files are not).
  const docImage =
    msg.type === 'document' && /^image\/(jpeg|png|webp)$/i.test(msg.document?.mime_type ?? '') ? msg.document : undefined;
  const photo = msg.type === 'image' ? msg.image : docImage;
  if (photo?.caption) text = text || photo.caption.trim();

  if (!sb) {
    // No database: still never lose the lead.
    await sendOwnerWithMarkup(`💬 <b>WhatsApp</b> · ${label}<code>${who}</code>\n«${esc(text || describe(msg))}»\n⚠️ Database not configured — reply yourself.`, {
      inline_keyboard: [numberRow],
    });
    return;
  }

  // Dedupe: Meta retries webhooks; the WAMID is the primary key.
  const stored = text || (photo ? '[photo]' : `[${msg.type}]`);
  const { error: insErr } = await sb
    .from('wa_messages')
    .insert({ msg_id: msg.id, wa_id: waId, role: 'user', content: photo && text ? `[photo] ${text}` : stored, via: 'customer' });
  if (insErr?.code === '23505') return;

  void ensureClient(sb, who, name || undefined).catch(() => null);

  // Chat state and the global switch in one go.
  const now = new Date().toISOString();
  const [{ data: chat }, { data: cfg }] = await Promise.all([
    sb.from('wa_chats').upsert({ wa_id: waId, name: name || null, last_at: now }).select('paused, owner_replied_at').single(),
    sb.from('app_config').select('value').eq('key', 'wa_ai_owner').maybeSingle(),
  ]);
  const aiOff = (cfg as { value?: string } | null)?.value === 'meta';
  const row = chat as { paused?: boolean; owner_replied_at?: string | null } | null;
  const ownerHandling = Boolean(row?.owner_replied_at) && Date.now() - new Date(row!.owner_replied_at as string).getTime() < STAND_DOWN_MS;
  const paused = Boolean(row?.paused) || ownerHandling;

  const ruLine = text ? await translateToRussian(text).then((t) => (t && t !== text ? `\n🇷🇺 ${esc(t)}` : '')) : '';
  const head = `💬 <b>WhatsApp</b> · ${label}<code>${who}</code>`;
  const controls = [
    { text: paused ? '▶️ Resume AI' : '⏸ Stop AI here', callback_data: `${paused ? 'war' : 'wap'}:${waId}` },
    { text: "✋ I'll reply (6h)", callback_data: `wamine:${waId}` },
  ];

  // Something WhatsApp will not hand to the API at all — most often several
  // photos sent at once (an album, 21 Oct: two iDrive screens arrived as one
  // "unsupported" message with no images). Ask for them one at a time and
  // keep the chat with the assistant: it reads single photos fine.
  if (msg.type === 'unsupported') {
    if (!paused && !aiOff) {
      const line =
        "Sorry — that one didn't come through to me: WhatsApp doesn't pass photo albums to the assistant. Could you send the photos again one at a time? Then I can read them straight away 👍";
      const sent = await sendWhatsAppText(waId, line);
      if (sent.ok) await sb.from('wa_messages').insert({ msg_id: sent.id || `out:${msg.id}`, wa_id: waId, role: 'assistant', content: line, via: 'ai' });
    }
    const why = msg.errors?.[0]?.title || msg.errors?.[0]?.message || msg.unsupported?.type || 'unsupported';
    await sendOwnerWithMarkup(
      `${head}\n📎 <i>sent something WhatsApp does not pass to the assistant (${esc(why)} — usually several photos at once). ${
        !paused && !aiOff ? 'It asked them to resend one photo at a time.' : 'Open WhatsApp to see it.'
      }</i>`,
      { inline_keyboard: [controls, numberRow] },
    );
    return;
  }

  // Attachments the assistant cannot read (voice, sticker, video, document):
  // tell the customer Alex will look, hand the chat to him, mirror it.
  const unreadable = msg.type !== 'text' && !photo && !text;
  if (unreadable) {
    if (!paused && !aiOff) {
      const line =
        "Got that 👍 I can't open attachments here, so I'm passing it straight to Alex — he will look at it himself and come back to you shortly.";
      const sent = await sendWhatsAppText(waId, line);
      if (sent.ok) await sb.from('wa_messages').insert({ msg_id: sent.id || `out:${msg.id}`, wa_id: waId, role: 'assistant', content: line, via: 'ai' });
      await sb.from('wa_chats').upsert({ wa_id: waId, owner_replied_at: now }).then(() => undefined, () => undefined);
    }
    await sendOwnerWithMarkup(`${head}\n📎 <i>sent ${describe(msg)} — open WhatsApp to see it. The assistant told them you'll look.</i>`, {
      inline_keyboard: [controls, numberRow],
    });
    return;
  }

  // Blue ticks and "typing…" the moment we start, like a person would.
  if (!paused && !aiOff) void markWhatsAppRead(msg.id, true);
  else void markWhatsAppRead(msg.id);

  let reply = '';
  let aiError = '';
  let skipped = '';
  let askedTime = '';
  if (aiOff) skipped = '🔇 The assistant is off for every chat — <code>/wa on all</code> switches it back.';
  else if (ownerHandling) skipped = '✋ You are handling this chat — the assistant stays quiet for 6h from your last reply.';
  else if (paused) skipped = '⏸ AI paused for this chat — replies handled by you.';
  else if (isRateLimited(`wa-ai:${waId}`, 20, 60 * 60 * 1000)) skipped = '🤖 Hourly limit for this chat reached — reply yourself.';
  else {
    try {
      // A photo goes to the model as an image (their iDrive screen, a dash
      // warning); fetched here because the media URL needs our bearer token.
      let imageUrl: string | undefined;
      if (photo?.id) imageUrl = (await downloadWhatsAppMedia(photo.id))?.dataUrl;
      const out = await generateWaReply(sb, waId, text || 'Photo attached.', name || undefined, 'claude-opus-5', who, imageUrl);
      reply = out.reply.trim();
      askedTime = out.askedTime ?? '';
    } catch (e) {
      aiError = e instanceof Error ? e.message : String(e);
    }
  }

  // If WhatsApp refuses the send, the answer is not wasted: Alex gets it
  // ready to copy and paste from his phone.
  let sendError = '';
  if (reply) {
    const sent = await sendWhatsAppText(waId, reply);
    if (sent.ok) {
      await sb.from('wa_messages').insert({ msg_id: sent.id || `out:${msg.id}`, wa_id: waId, role: 'assistant', content: reply, via: 'ai' });
    } else {
      sendError = sent.error || 'send failed';
    }
  }

  // Mirror to the owner.
  const lines = [head];
  if (photo) lines.push('📷 <i>sent a photo</i>');
  if (text) lines.push(`«${esc(text)}»${ruLine}`);
  if (reply && !sendError) lines.push(`🤖 ${esc(reply)}`);
  if (sendError)
    lines.push(
      `❌ <b>WhatsApp refused to send the answer</b> — the customer got nothing. Copy it and send from your phone:\n<pre>${esc(reply.slice(0, 3000))}</pre>\n<code>${esc(sendError.slice(0, 300))}</code>`,
    );
  if (!reply && !aiError && !skipped && text && /\balex\b/i.test(text))
    lines.push("👋 They're talking to you by name — the assistant stayed quiet and stands down for 6h.");
  else if (!reply && !aiError && !skipped) lines.push('🤫 The assistant chose not to answer this one — it is yours.');
  if (aiError) lines.push(`⚠️ <b>The assistant could not answer</b> — the customer got no reply. Answer them yourself.\n<code>${esc(aiError.slice(0, 200))}</code>`);
  if (skipped) lines.push(skipped);
  if (askedTime) lines.push(`⏰ <b>Asked for a specific time: ${esc(askedTime)}</b> — the assistant told them you confirm times yourself.`);
  const copyRow = sendError ? [[{ text: '📋 Copy answer', copy_text: { text: reply.slice(0, 256) } }]] : [];
  await sendOwnerWithMarkup(lines.join('\n'), { inline_keyboard: [...copyRow, controls, numberRow] });
}
