import { NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  answerCallback,
  buildBookingsDay,
  buildBookingsMenu,
  editBookingMessage,
  editMessage,
  isOwner,
  registerBotCommands,
  sendOwnerMessage,
  sendOwnerWithMarkup,
  type BookingRow,
  type Lead,
} from '@/lib/telegram';
import {
  cancelInvoice,
  startInvoice,
  tryHandleInvoiceCallback,
  tryHandleInvoiceText,
} from '@/lib/invoiceFlow';
import { getBusinessStats, getHours, getBlockedDates, getSlotDuration } from '@/lib/stats';
import { calendarToken } from '@/lib/calendar';
import { REVIEW_TEMPLATES, hasReviewUrl } from '@/lib/reviewTemplates';
import { sendWhatsAppText, normalizeWaNumber, isWhatsAppConfigured } from '@/lib/whatsapp';
import { answerPendingWaMessage } from '@/lib/waAgent';
import {
  buildAgenda,
  buildLeadCard,
  buildPendingWa,
  markContactHandled,
  markAllWaitingHandled,
  unansweredChats,
  type AgendaLead,
} from '@/lib/agenda';
import { jpAddressMessage } from '@/lib/jpAddress';
import { findClients, formatClient, resolveClient, ensureClient, clientCode } from '@/lib/crm';
import { customWindow, windowsFor, windowsOverlap, windowLabel } from '@/lib/hours';
import { CANNED_REPLIES, getReply } from '@/lib/replies';
import { CHEAT_SHEET, CHEAT_DISCLAIMER, findCheat, formatCheat } from '@/lib/cheatsheet';
import type { Booking } from '@/lib/types';
import { isRateLimited } from '@/lib/rateLimit';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** After "Resume AI": the customer's last message went unanswered while the
 *  assistant stood down, so answer it now and show Alex what was sent. */
function answerPendingInBackground(sb: SupabaseClient, waId: string): void {
  waitUntil(
    (async () => {
      const r = await answerPendingWaMessage(sb, waId);
      if (!r) return;
      const head = `💬 <b>WhatsApp</b> · <code>+${waId}</code>\n«${escapeHtml(r.text.slice(0, 500))}»`;
      if (r.aiError) {
        await sendOwnerMessage(`${head}\n⚠️ <b>The assistant could not answer</b> — reply yourself.\n<code>${escapeHtml(r.aiError.slice(0, 200))}</code>`);
      } else if (!r.reply) {
        await sendOwnerMessage(`${head}\n🤫 The assistant chose not to answer this one — it is yours.`);
      } else if (r.sendError) {
        await sendOwnerWithMarkup(
          `${head}\n❌ <b>WhatsApp refused to send the answer</b> — copy it and send from your phone:\n<pre>${escapeHtml(r.reply.slice(0, 3000))}</pre>\n<code>${escapeHtml(r.sendError.slice(0, 300))}</code>`,
          { inline_keyboard: [[{ text: '📋 Copy answer', copy_text: { text: r.reply.slice(0, 256) } }]] },
        );
      } else {
        await sendOwnerMessage(`${head}\n🤖 ${escapeHtml(r.reply)}`);
      }
    })().catch(() => undefined),
  );
}

/** What we stored for a WhatsApp chat, oldest first, Irish time. */
async function chatLogText(sb: SupabaseClient, waId: string, limit = 10): Promise<string> {
  const { data } = await sb
    .from('wa_messages')
    .select('role, content, via, created_at')
    .eq('wa_id', waId)
    .order('created_at', { ascending: false })
    .limit(limit);
  const rows = (data ?? []) as { role: string; content: string; via: string | null; created_at: string }[];
  const body = rows
    .reverse()
    .map((r) => {
      const time = new Date(r.created_at).toLocaleString('en-IE', {
        timeZone: 'Europe/Dublin',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
      const who = r.role === 'user' ? '👤' : r.via === 'owner' ? '✋' : '🤖';
      return `${who} <code>${time}</code> ${escapeHtml(r.content.slice(0, 300))}`;
    })
    .join('\n\n');
  return body ? `📖 <b>Chat with +${waId}</b> (oldest first)\n\n${body}` : `Nothing stored for <code>+${waId}</code> yet.`;
}

async function sendPendingWa(sb: SupabaseClient): Promise<void> {
  const { text, keyboard } = buildPendingWa(await unansweredChats(sb));
  await sendOwnerWithMarkup(text, keyboard);
}

/** The assistant's master switch (app_config.wa_ai_owner: 'meta' = off). */
async function aiSwitch(sb: SupabaseClient, want?: 'on' | 'off'): Promise<void> {
  if (!want) {
    const { data } = await sb.from('app_config').select('value').eq('key', 'wa_ai_owner').maybeSingle();
    const on = (data as { value?: string } | null)?.value !== 'meta';
    await sendOwnerMessage(
      on
        ? '🤖 The assistant answers WhatsApp. <code>/wa off all</code> silences it everywhere.'
        : '🔇 The assistant is off for every chat — messages still arrive here and you answer. <code>/wa on all</code> switches it back.',
    );
    return;
  }
  const { error } = await sb.from('app_config').upsert({ key: 'wa_ai_owner', value: want === 'on' ? 'ours' : 'meta' });
  await sendOwnerMessage(
    error
      ? `❌ Could not change it: ${escapeHtml(error.message)}`
      : want === 'off'
        ? '🔇 Assistant off for every chat. Messages still arrive here — you answer. <code>/wa on all</code> switches it back.'
        : '🔊 Assistant on again for every chat (chats you stopped one by one stay stopped).',
  );
}

async function sendCalendarLink(): Promise<void> {
  const url = `${SITE_URL}/api/calendar/${calendarToken()}.ics`;
  const webcal = url.replace(/^https:/, 'webcal:');
  await sendOwnerMessage(
    [
      '📆 <b>Your bookings calendar</b>',
      '━━━━━━━━━━━━━━━━━━━',
      'Subscribe once and confirmed bookings appear in your phone calendar automatically.',
      '',
      `<b>iPhone:</b> tap → <a href="${webcal}">${webcal}</a>`,
      `<b>Any calendar app:</b> add subscription → <code>${url}</code>`,
      '',
      '⚠️ This link is private — anyone with it can see your bookings.',
    ].join('\n'),
  );
}

async function sendBanlist(sb: SupabaseClient): Promise<void> {
  const { data } = await sb.from('clients').select('id, phone_key, name, ban_reason').eq('banned', true).order('id');
  const list = (data ?? []) as { id: number; phone_key: string; name: string | null; ban_reason: string | null }[];
  const lines = ['⛔️ <b>Blacklist</b>', '━━━━━━━━━━━━━━━━━━━'];
  if (!list.length) lines.push('Empty.');
  for (const c of list) {
    lines.push(
      `<code>${clientCode(c.id)}</code> · ${escapeHtml(c.name || '—')} · …${c.phone_key.slice(-6)}${c.ban_reason ? ` — ${escapeHtml(c.ban_reason)}` : ''}`,
    );
  }
  lines.push('', 'Ban: <code>/ban C-007 reason</code> or <code>/ban 0871234567 reason</code> · Unban: <code>/unban C-007</code>');
  await sendOwnerMessage(lines.join('\n'));
}

async function sendCheatIndex(sb: SupabaseClient): Promise<void> {
  const { data: mine } = await sb.from('cheat_notes').select('id, title').order('created_at', { ascending: false }).limit(30);
  const lines = ['🔧 <b>Coding cheat-sheet</b>', CHEAT_DISCLAIMER, '', '<b>Search:</b> <code>/cheat vim</code> · <code>/cheat mirrors</code>', '', '<b>Built-in topics:</b>'];
  lines.push(CHEAT_SHEET.map((e) => `• ${escapeHtml(e.title)}`).join('\n'));
  const list = (mine ?? []) as { id: number; title: string }[];
  if (list.length) {
    lines.push('', '<b>Your notes:</b>');
    for (const n of list) lines.push(`• <code>#${n.id}</code> ${escapeHtml(n.title)}`);
  }
  lines.push('', 'Add: <code>/cheat add Title | details</code> · Remove: <code>/cheat del 5</code>');
  await sendOwnerMessage(lines.join('\n'));
}

async function sendStats(sb: SupabaseClient): Promise<void> {
  const s = await getBusinessStats(sb);
  const lines = [
    '📊 <b>Business stats</b>',
    '━━━━━━━━━━━━━━━━━━━',
    `📥 Enquiries: <b>${s.last7}</b> this week · <b>${s.last30}</b> this month · ${s.total} all time`,
    `📅 Slots: ✅ ${s.confirmedUpcoming} confirmed upcoming · ⏳ ${s.pending} pending`,
  ];
  if (s.paymentsCount > 0) {
    lines.push(`💶 Revenue: <b>€${s.revenue7.toFixed(0)}</b> this week · <b>€${s.revenue30.toFixed(0)}</b> this month`);
  }
  // Section attention: where visitors actually spend their time (7 days).
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const { data: att } = await sb.from('section_time').select('section, seconds').gte('day', weekAgo).limit(5000);
  if (att?.length) {
    const bySec = new Map<string, number>();
    for (const r of att as { section: string; seconds: number }[]) {
      bySec.set(r.section, (bySec.get(r.section) ?? 0) + Number(r.seconds || 0));
    }
    const top = [...bySec].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const fmtT = (v: number) => (v >= 3600 ? `${Math.floor(v / 3600)}h ${Math.round((v % 3600) / 60)}m` : `${Math.round(v / 60)}m`);
    lines.push('', '<b>⏱ Attention by section (7d):</b>');
    for (const [k, v] of top) lines.push(`  ${fmtT(v)} — ${escapeHtml(k)}`);
  }
  if (s.topServices.length) {
    lines.push('', '<b>Most requested:</b>');
    for (const t of s.topServices) lines.push(`  ${t.count} × ${t.service}`);
  }
  if (s.nextBookings.length) {
    lines.push('', '<b>Next confirmed:</b>');
    for (const b of s.nextBookings) lines.push(`  ${b.slot_date} ${b.slot_time} — ${b.name}`);
  }
  await sendOwnerMessage(lines.join('\n'));
}

/** Review-request texts, personalised when a name (or C-code) is given. */
async function sendReviewTemplates(sb: SupabaseClient, rest: string): Promise<void> {
  let name = '';
  let service = '';
  const codeM = /^(c[-\s]?0*\d+)\b\s*([\s\S]*)$/i.exec(rest);
  if (codeM) {
    const c = await resolveClient(sb, codeM[1]);
    name = c?.name || '';
    service = codeM[2].trim();
  } else if (rest.includes(' - ')) {
    const [n, ...svc] = rest.split(' - ');
    name = n.trim();
    service = svc.join(' - ').trim();
  } else {
    const [n = '', ...svcParts] = rest.split(/\s+/);
    name = n;
    service = svcParts.join(' ');
  }
  const lines = [
    '⭐ <b>Review request</b>',
    '━━━━━━━━━━━━━━━━━━━',
    name
      ? `For <b>${escapeHtml(name)}</b>${service ? ` · ${escapeHtml(service)}` : ''} — tap a message to copy it:`
      : 'Tap a message to copy it. Personalise: <code>/review C-007 CarPlay</code> or <code>/review John Smith - CarPlay</code>.',
    '',
  ];
  for (const tpl of REVIEW_TEMPLATES) {
    lines.push(`<b>${tpl.label}</b>`);
    lines.push(`<code>${escapeHtml(tpl.build(name || 'there', service))}</code>`);
    lines.push('');
  }
  if (!hasReviewUrl()) lines.push('⚠️ Set <code>GOOGLE_REVIEW_URL</code> in Vercel so the link is included automatically.');
  await sendOwnerMessage(lines.join('\n'));
}

const TOOLS_KEYBOARD = {
  inline_keyboard: [
    [{ text: '🇯🇵 Japanese address', callback_data: 'tool:jp' }],
    [{ text: '🔧 Coding cheat-sheet', callback_data: 'tool:cheat' }],
    [{ text: '📊 Stats', callback_data: 'tool:stats' }],
    [{ text: '📆 Calendar link', callback_data: 'tool:cal' }],
    [{ text: '⛔️ Blacklist', callback_data: 'tool:ban' }],
  ],
};

const OWNER_USER_ID = process.env.TG_OWNER_ID;

/**
 * Alex swipes left on a WhatsApp message in the group and types: the text
 * goes to that customer. Only replies to the bot's own WhatsApp messages (the
 * mirror, the 🚨 handover alert) count — a reply to a booking card or to
 * anything else is never sent anywhere.
 */
async function trySwipeReply(sb: SupabaseClient, replied: string, body: string): Promise<boolean> {
  const head = replied.split('\n').slice(0, 3).join(' ');
  if (!/WhatsApp|NEEDS YOU/i.test(head)) return false;
  const waId = /\+(\d{8,15})\b/.exec(head)?.[1];
  if (!waId) return false;
  const open = { text: '💬 Open WhatsApp', url: `https://wa.me/${waId}` };
  if (!isWhatsAppConfigured()) {
    await sendOwnerWithMarkup('WhatsApp sending is not connected — answer from your phone.', { inline_keyboard: [[open]] });
    return true;
  }
  const sent = await sendWhatsAppText(waId, body);
  if (sent.ok) {
    await sb
      .from('wa_messages')
      .insert({ msg_id: sent.id || `owner:${waId}:${Date.now()}`, wa_id: waId, role: 'assistant', content: `[Alex] ${body}`, via: 'owner' })
      .then(() => undefined, () => undefined);
    // Alex is talking: the assistant stands down here, as when he replies from his phone.
    await sb.from('wa_chats').upsert({ wa_id: waId, owner_replied_at: new Date().toISOString() }).then(() => undefined, () => undefined);
    await markContactHandled(sb, waId).catch(() => 0);
    await sendOwnerMessage(`✅ Sent to <code>+${waId}</code> · the assistant stays quiet in this chat for 6h.`);
    return true;
  }
  const err = sent.error || 'send failed';
  const outsideWindow = /131047|re-?engagement|24 ?hours?/i.test(err);
  await sendOwnerWithMarkup(
    outsideWindow
      ? `⌛ Not sent: more than 24h since <code>+${waId}</code> last wrote, and WhatsApp only allows templates after that. Send it from your phone:`
      : `❌ Not sent to <code>+${waId}</code>:\n<code>${escapeHtml(err.slice(0, 300))}</code>`,
    { inline_keyboard: [[open], [{ text: '📋 Copy your text', copy_text: { text: body } }]] },
  );
  return true;
}

export const runtime = 'nodejs';
// "Resume AI" drafts and sends a WhatsApp answer after the callback is acknowledged.
export const maxDuration = 60;

const WEBHOOK_SECRET = process.env.TG_WEBHOOK_SECRET;

// Telegram needs a 200 even when we ignore an update, otherwise it retries.
const ok = () => NextResponse.json({ ok: true });

export async function GET() {
  return NextResponse.json({ ok: true, hint: 'Telegram webhook endpoint — POST only.' });
}

/** Upcoming (today onward) bookings that still matter — pending or confirmed. */
async function upcomingBookings(sb: SupabaseClient): Promise<BookingRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await sb
    .from('bookings')
    .select('id, name, contact, slot_date, slot_time, status, bmw_model, service, message')
    .not('slot_date', 'is', null)
    .gte('slot_date', today)
    .in('status', ['pending', 'confirmed']);
  return (data ?? []) as BookingRow[];
}


/** Free (non-overlapping) windows for a date, given confirmed bookings. */
async function freeWindowsFor(sb: SupabaseClient, date: string, excludeId?: number): Promise<string[]> {
  const [hours, duration, { data }] = await Promise.all([
    getHours(sb),
    getSlotDuration(sb),
    sb
      .from('bookings')
      .select('id, slot_time')
      .eq('slot_date', date)
      .eq('status', 'confirmed'),
  ]);
  const busy = ((data ?? []) as { id: number; slot_time: string }[]).filter(
    (b) => b.slot_time && b.id !== excludeId,
  );
  const weekday = new Date(`${date}T00:00:00`).getDay();
  return windowsFor(hours, weekday, duration).filter((w) => !busy.some((b) => windowsOverlap(b.slot_time, w)));
}

/** "Custom time" in the move flow waits here for the time Alex types next. */
const PENDING_MOVE_KEY = 'tg_pending_move';
const PENDING_MOVE_TTL_MS = 15 * 60 * 1000;

const dayShort = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-IE', { weekday: 'short', day: '2-digit', month: 'short' });

/**
 * Put a booking on a new day and time, then show the day and hand Alex the
 * message for the customer. Shared by the hourly buttons and a typed time;
 * a typed time may overlap another job, which is allowed but called out.
 */
async function finishMove(
  sb: SupabaseClient,
  id: number,
  date: string,
  slotTime: string,
  edit?: { chatId: number | string; messageId: number },
): Promise<void> {
  const [{ data: bRow }, { data: sameDay }] = await Promise.all([
    sb.from('bookings').select('name, public_token').eq('id', id).single(),
    sb.from('bookings').select('id, name, slot_time').eq('slot_date', date).eq('status', 'confirmed'),
  ]);
  await sb.from('bookings').update({ slot_date: date, slot_time: slotTime }).eq('id', id);
  const clash = ((sameDay ?? []) as { id: number; name: string; slot_time: string }[]).filter(
    (b) => b.id !== id && b.slot_time && windowsOverlap(b.slot_time, slotTime),
  );
  const [rows, freeWins] = await Promise.all([upcomingBookings(sb), freeWindowsFor(sb, date)]);
  const day = buildBookingsDay(date, rows, freeWins);
  if (edit) await editMessage(edit.chatId, edit.messageId, day.text, day.keyboard);
  else await sendOwnerMessage(day.text, day.keyboard);
  if (!bRow?.name) return;
  const label = dayShort(date);
  const track = bRow.public_token ? ` Track it here: ${SITE_URL}/b/${bRow.public_token}` : '';
  const msgTxt = `Hi ${String(bRow.name).trim().split(/\s+/)[0]}! Quick update — your BMW coding slot is now ${label} · ${slotTime} ✅${track}`;
  const warn = clash.length
    ? `\n⚠️ Overlaps with ${clash.map((c) => `${escapeHtml(c.name)} (${escapeHtml(c.slot_time)})`).join(', ')}`
    : '';
  await sendOwnerMessage(
    `✅ Moved <b>${escapeHtml(String(bRow.name))}</b> → ${label} · ${slotTime}${warn}`,
    { inline_keyboard: [[{ text: '📋 Copy new-time message', copy_text: { text: msgTxt } }]] },
  );
}

export async function POST(req: Request) {
  if (WEBHOOK_SECRET) {
    const got = req.headers.get('x-telegram-bot-api-secret-token');
    if (got !== WEBHOOK_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: {
    update_id?: number;
    message?: {
      text?: string;
      chat: { id: number };
      from?: { id: number };
      reply_to_message?: { text?: string; caption?: string };
    };
    callback_query?: {
      id: string;
      data?: string;
      message?: { message_id: number; chat: { id: number } };
    };
  };
  try {
    update = await req.json();
  } catch {
    return ok();
  }

  // Telegram re-delivers an update when our answer is slow; without this the
  // owner got the same agenda (or the same command reply) twice in a minute.
  if (typeof update.update_id === 'number' && isRateLimited(`tg-update:${update.update_id}`, 1, 15 * 60 * 1000)) {
    return ok();
  }

  const sb = getSupabaseAdmin();

  // ── Owner messages: commands + invoice wizard input ────────────
  const msg = update.message;
  if (msg?.text) {
    let text = msg.text.trim();
    // Reply-keyboard buttons (installed by /setup) arrive as plain text; the
    // old labels stay mapped so a keyboard from before still works.
    const KEYS: Record<string, string> = {
      '⏰ Agenda': '/agenda',
      '📅 Bookings': '/bookings',
      '💰 Paid': '/paid',
      '🧰 Tools': '/tools',
      '💰 Money': '/paid',
      '📊 Stats': '/stats',
      '💶 Paid': '/paid',
    };
    text = KEYS[text] ?? text;
    // Retired commands → where they live now.
    text = text
      .replace(/^\/log\b.*$/s, '/paid')
      .replace(/^\/client\b/, '/find')
      .replace(/^\/ai\s+(on|off)\s*$/i, '/wa $1 all')
      .replace(/^\/ai\s*$/i, '/wa');
    if (!isOwner(msg.chat.id)) return ok();
    if (!sb) {
      await sendOwnerMessage('Database not configured.');
      return ok();
    }

    // A reply (swipe left) to a WhatsApp message goes to that customer.
    const replied = msg.reply_to_message?.text || msg.reply_to_message?.caption || '';
    if (replied && !text.startsWith('/')) {
      if (!OWNER_USER_ID || String(msg.from?.id) === String(OWNER_USER_ID)) {
        if (await trySwipeReply(sb, replied, text)) return ok();
      } else if (/WhatsApp|NEEDS YOU/i.test(replied.split('\n').slice(0, 3).join(' '))) {
        await sendOwnerMessage('⚠️ Not sent — only the owner’s replies go to customers.');
        return ok();
      }
    }

    // A time typed after "✍️ Custom time" in the move flow.
    if (!text.startsWith('/') && /\d/.test(text) && text.length <= 24) {
      const { data: pend } = await sb.from('app_config').select('value').eq('key', PENDING_MOVE_KEY).maybeSingle();
      let p: { id: number; date: string; chatId: number | string; messageId: number; at: number } | null = null;
      try {
        p = JSON.parse((pend as { value?: string } | null)?.value || 'null');
      } catch {
        p = null;
      }
      if (p && Date.now() - p.at < PENDING_MOVE_TTL_MS) {
        const slotTime = customWindow(text, await getSlotDuration(sb));
        if (!slotTime) {
          await sendOwnerMessage('Could not read that time. Try <code>10:30</code> or <code>10:30-12:00</code> — or /cancel.');
          return ok();
        }
        await sb.from('app_config').delete().eq('key', PENDING_MOVE_KEY);
        await finishMove(sb, p.id, p.date, slotTime, { chatId: p.chatId, messageId: p.messageId });
        return ok();
      }
    }

    if (/^\/invoice(@\w+)?\b/.test(text)) {
      await startInvoice(sb, msg.chat.id);
      return ok();
    }
    if (text === '✖️ Cancel' || /^\/cancel(@\w+)?\b/.test(text)) {
      // A waiting "custom time" move is the likelier thing to cancel.
      const { data: pend } = await sb.from('app_config').select('key').eq('key', PENDING_MOVE_KEY).maybeSingle();
      if (pend && text !== '✖️ Cancel') {
        await sb.from('app_config').delete().eq('key', PENDING_MOVE_KEY);
        await sendOwnerMessage('✖️ Move cancelled — the booking keeps its time.');
        return ok();
      }
      await cancelInvoice(sb, msg.chat.id);
      return ok();
    }
    // One box to search everything. Remembering whether a name is a client, a
    // booking or just a WhatsApp chat is not a thing anyone should have to do.
    if (/^\/find(@\w+)?\b/.test(text)) {
      const q = text.replace(/^\/find(@\w+)?\s*/, '').trim();
      if (q.length < 2) {
        await sendOwnerMessage(
          'Search everything: <code>/find miranda</code>, <code>/find 8770</code>, <code>/find japan</code>.',
        );
        return ok();
      }
      const digits = q.replace(/\D/g, '');
      const like = `%${q}%`;
      const [byName, byService, byPhone] = await Promise.all([
        sb
          .from('bookings')
          .select('id, name, contact, service, bmw_model, message, slot_date, slot_time, status, created_at')
          .ilike('name', like)
          .order('created_at', { ascending: false })
          .limit(8),
        sb
          .from('bookings')
          .select('id, name, contact, service, bmw_model, message, slot_date, slot_time, status, created_at')
          .ilike('service', like)
          .order('created_at', { ascending: false })
          .limit(8),
        digits.length >= 3
          ? sb
              .from('bookings')
              .select('id, name, contact, service, bmw_model, message, slot_date, slot_time, status, created_at')
              .ilike('contact', `%${digits}%`)
              .order('created_at', { ascending: false })
              .limit(8)
          : Promise.resolve({ data: [] as unknown[] }),
      ]);
      const merged = new Map<number, AgendaLead>();
      for (const set of [byName.data, byService.data, byPhone.data]) {
        for (const row of (set ?? []) as AgendaLead[]) merged.set(row.id, row);
      }
      const hits = [...merged.values()]
        .sort((a, b) => String(b.created_at ?? '').localeCompare(String(a.created_at ?? '')))
        .slice(0, 8);

      // Clients (with their history and C-code) and WhatsApp chats too —
      // /client used to be a separate command for the same question.
      const safe = q.replace(/[,()%*]/g, ' ').trim();
      const [clients, waChats] = await Promise.all([
        findClients(sb, q).catch(() => []),
        sb
          .from('wa_chats')
          .select('wa_id, name')
          .or(digits.length >= 4 ? `name.ilike.%${safe}%,wa_id.like.%${digits}%` : `name.ilike.%${safe}%`)
          .order('last_at', { ascending: false })
          .limit(5)
          .then((r) => ((r.data ?? []) as { wa_id: string; name: string | null }[]), () => []),
      ]);
      if (!hits.length && !clients.length && !waChats.length) {
        await sendOwnerMessage(`Nothing found for <b>${escapeHtml(q)}</b>.`);
        return ok();
      }
      const icon = (st?: string) =>
        st === 'confirmed' ? '✅' : st === 'cancelled' ? '✖️' : st === 'declined' ? '⛔️' : '⏳';
      const lines = [`🔎 <b>“${escapeHtml(q)}”</b>`];
      if (clients.length) {
        lines.push('', '👥 <b>Clients</b>', clients.slice(0, 3).map((c) => formatClient(c, escapeHtml).join('\n')).join('\n\n'));
      }
      if (waChats.length) {
        lines.push('', '💬 <b>WhatsApp chats</b>');
        for (const c of waChats) lines.push(`• ${escapeHtml(c.name || '—')} · <code>+${c.wa_id}</code>`);
      }
      if (hits.length) {
        lines.push('', '📋 <b>Enquiries & bookings</b>');
        for (const h of hits) {
          const slot = h.slot_date ? ` · ${h.slot_date} ${h.slot_time ?? ''}`.trimEnd() : '';
          lines.push(`${icon(h.status)} ${escapeHtml(h.name)}${h.service ? ` — ${escapeHtml(h.service)}` : ''}${slot}`);
        }
      }
      await sendOwnerWithMarkup(lines.join('\n'), {
        inline_keyboard: [
          ...waChats.map((c) => [{ text: `📖 ${(c.name || `+${c.wa_id}`).slice(0, 26)}`, callback_data: `walog:${c.wa_id}` }]),
          ...hits.map((h) => [{ text: `${icon(h.status)} ${h.name.slice(0, 26)}`, callback_data: `lead:${h.id}` }]),
        ],
      });
      return ok();
    }

    // The same morning screen, on demand — waiting for 07:00 to see who is
    // still owed a reply is no way to run the day.
    if (/^\/agenda(@\w+)?\b/.test(text)) {
      const agenda = await buildAgenda(sb);
      await sendOwnerWithMarkup(
        agenda.empty ? '⏰ <b>Daily agenda</b>\n\nNothing booked and nobody waiting.' : agenda.text,
        agenda.keyboard,
      );
      return ok();
    }
    if (/^\/bookings(@\w+)?\b/.test(text)) {
      const rows = await upcomingBookings(sb);
      const { text: out, keyboard } = buildBookingsMenu(rows);
      await sendOwnerMessage(out, keyboard);
      return ok();
    }
    if (/^\/calendar(@\w+)?\b/.test(text)) {
      await sendCalendarLink();
      return ok();
    }
    if (/^\/tools(@\w+)?\b/.test(text)) {
      await sendOwnerWithMarkup('🧰 <b>Tools</b> — tap one.\nBan someone: <code>/ban C-007 reason</code> · <code>/unban C-007</code>', TOOLS_KEYBOARD);
      return ok();
    }
    if (/^\/wa(@\w+)?\b/.test(text)) {
      const rest = text.replace(/^\/wa(@\w+)?\s*/, '').trim();
      // /wa on its own: what it can do, and whether the assistant is on.
      if (!rest || /^help$/i.test(rest)) {
        const [{ data: cfg }, pending] = await Promise.all([
          sb.from('app_config').select('value').eq('key', 'wa_ai_owner').maybeSingle(),
          unansweredChats(sb).catch(() => []),
        ]);
        const on = (cfg as { value?: string } | null)?.value !== 'meta';
        await sendOwnerWithMarkup(
          [
            `💬 <b>WhatsApp</b> · assistant ${on ? '🟢 on' : '🔴 off for every chat'}`,
            '━━━━━━━━━━━━━━━━━━━',
            '↩️ <b>Reply to any WhatsApp message here</b> (swipe left) and your text goes to that customer.',
            '',
            '<code>/wa pending</code> — who is waiting for a reply',
            '<code>/wa log +353…</code> — the chat as the assistant saw it',
            '<code>/wa stop +353…</code> · <code>/wa start +353…</code> — assistant off / on in one chat',
            '<code>/wa reset +353…</code> — the assistant forgets that chat',
            '<code>/wa +353… text</code> — send a message',
            `<code>/wa ${on ? 'off' : 'on'} all</code> — assistant ${on ? 'off' : 'on'} in every chat`,
          ].join('\n'),
          { inline_keyboard: [[{ text: `⏳ Waiting for a reply (${pending.length})`, callback_data: 'wapend' }]] },
        );
        return ok();
      }
      if (/^(pending|waiting)$/i.test(rest)) {
        await sendPendingWa(sb);
        return ok();
      }
      const all = /^(on|off)\s+all$/i.exec(rest);
      if (all) {
        await aiSwitch(sb, all[1].toLowerCase() as 'on' | 'off');
        return ok();
      }
      const logCmd = /^log\s+(\+?[\d\s()-]{6,})$/i.exec(rest);
      if (logCmd) {
        await sendOwnerMessage(await chatLogText(sb, logCmd[1].replace(/\D/g, '')));
        return ok();
      }

      const ctrl = /^(stop|start|pause|resume|reset|clear|mine)\s+(\+?[\d\s()-]{6,})$/i.exec(rest);
      if (ctrl) {
        const action = ctrl[1].toLowerCase();
        const waId = ctrl[2].replace(/\D/g, '');
        if (action === 'reset' || action === 'clear') {
          await sb.from('wa_messages').delete().eq('wa_id', waId);
          await sb.from('app_config').delete().eq('key', `wa_memory:${waId}`);
          await sendOwnerMessage(`🧹 Conversation with <code>+${waId}</code> wiped — the assistant starts fresh next message.`);
        } else if (action === 'mine') {
          await sb.from('wa_chats').upsert({ wa_id: waId, owner_replied_at: new Date().toISOString() });
          await markContactHandled(sb, waId).catch(() => 0);
          await sendOwnerMessage(`✋ Assistant stands down on <code>+${waId}</code> for 6 hours.`);
        } else {
          const paused = action === 'stop' || action === 'pause';
          await sb.from('wa_chats').upsert(paused ? { wa_id: waId, paused } : { wa_id: waId, paused, owner_replied_at: null });
          const { data: check } = await sb.from('wa_chats').select('paused').eq('wa_id', waId).maybeSingle();
          const now = (check as { paused?: boolean } | null)?.paused;
          await sendOwnerMessage(
            now === paused
              ? `${paused ? '⏸ AI stopped' : '▶️ AI back on'} for <code>+${waId}</code>${paused ? '' : ' — answering their last message now'}.`
              : `⚠️ Could not change it — the chat now reads paused=${String(now)}. Check the number: it must match the one on the message (${waId}).`,
          );
          if (now === paused && !paused) answerPendingInBackground(sb, waId);
        }
        return ok();
      }

      // "/wa +353871234567 your message" — send from here.
      const m = rest.match(/^(\+?[\d\s()-]{7,})\s+([\s\S]+)$/);
      if (!m) {
        await sendOwnerMessage('Not sure what you meant — <code>/wa</code> shows everything it can do.');
        return ok();
      }
      if (!isWhatsAppConfigured()) {
        await sendOwnerMessage('WhatsApp sending is not connected — answer from your phone.');
        return ok();
      }
      const to = normalizeWaNumber(m[1]);
      const body = m[2].trim();
      const sent = await sendWhatsAppText(to, body);
      if (sent.ok) {
        await sb.from('wa_messages').insert({
          msg_id: sent.id || `owner:${to}:${Date.now()}`,
          wa_id: to,
          role: 'assistant',
          content: `[Alex] ${body}`,
          via: 'owner',
        });
        await sb.from('wa_chats').upsert({ wa_id: to, owner_replied_at: new Date().toISOString() }).then(() => undefined, () => undefined);
        const cleared = await markContactHandled(sb, to).catch(() => 0);
        await sendOwnerMessage(`✅ Sent to <code>+${to}</code>${cleared ? ` · ${cleared} enquiry(ies) marked answered` : ''}`);
      } else {
        const outsideWindow = /131047|re-?engagement|24 ?hours?/i.test(sent.error || '');
        await sendOwnerWithMarkup(
          outsideWindow
            ? `⌛ Not sent: more than 24h since <code>+${to}</code> last wrote — WhatsApp only allows templates after that. Send it from your phone.`
            : `❌ Failed: <code>${escapeHtml((sent.error || 'unknown error').slice(0, 300))}</code>`,
          { inline_keyboard: [[{ text: '💬 Open WhatsApp', url: `https://wa.me/${to}` }]] },
        );
      }
      return ok();
    }

    if (/^\/setup(@\w+)?\b/.test(text) || /^\/start(@\w+)?\b/.test(text)) {
      const done = await registerBotCommands();
      await sendOwnerWithMarkup(
        done
          ? '✅ Меню обновлено, кнопки внизу установлены (закрой и открой чат, если не появились).\n↩️ Ответить клиенту в WhatsApp — свайп влево по его сообщению здесь.'
          : '❌ Не удалось обновить меню — попробуй ещё раз через минуту.',
        {
          keyboard: [
            [{ text: '⏰ Agenda' }, { text: '📅 Bookings' }],
            [{ text: '💰 Paid' }, { text: '🧰 Tools' }],
          ],
          resize_keyboard: true,
          is_persistent: true,
        },
      );
      return ok();
    }
    if (/^\/banlist(@\w+)?\b/.test(text)) {
      await sendBanlist(sb);
      return ok();
    }
    if (/^\/ban(@\w+)?\b/.test(text)) {
      const rest = text.replace(/^\/ban(@\w+)?\s*/, '').trim();
      const m = rest.match(/^(\S+)\s*([\s\S]*)$/);
      if (!m) {
        await sendOwnerMessage('Usage: <code>/ban C-007 reason</code> or <code>/ban 0871234567 reason</code>');
        return ok();
      }
      let client = await resolveClient(sb, m[1]);
      // Unknown number → create the record so the ban sticks pre-emptively.
      if (!client && /\d{6,}/.test(m[1].replace(/\D/g, ''))) {
        client = await ensureClient(sb, m[1]);
      }
      if (!client) {
        await sendOwnerMessage(`Client not found for «${escapeHtml(m[1])}». Use a C-code from /client or a phone number.`);
        return ok();
      }
      const reason = m[2].trim() || null;
      const { error } = await sb.from('clients').update({ banned: true, ban_reason: reason }).eq('id', client.id);
      if (error) {
        await sendOwnerMessage(`❌ ${escapeHtml(error.message)} — run the clients migration in Supabase.`);
        return ok();
      }
      await sendOwnerMessage(
        `⛔️ Banned <code>${clientCode(client.id)}</code> · ${escapeHtml(client.name || '—')}${reason ? ` — ${escapeHtml(reason)}` : ''}\nTheir future bookings are auto-declined silently. Undo: <code>/unban ${clientCode(client.id)}</code>`,
      );
      return ok();
    }
    if (/^\/unban(@\w+)?\b/.test(text)) {
      const q = text.replace(/^\/unban(@\w+)?\s*/, '').trim();
      const client = q ? await resolveClient(sb, q) : null;
      if (!client) {
        await sendOwnerMessage('Usage: <code>/unban C-007</code> or <code>/unban 0871234567</code>');
        return ok();
      }
      await sb.from('clients').update({ banned: false, ban_reason: null }).eq('id', client.id);
      await sendOwnerMessage(`✅ Unbanned <code>${clientCode(client.id)}</code> · ${escapeHtml(client.name || '—')}`);
      return ok();
    }
    if (/^\/cheat(@\w+)?\b/.test(text)) {
      const rest = text.replace(/^\/cheat(@\w+)?\s*/, '').trim();

      // /cheat add Title | body text
      const addM = /^add\s+([\s\S]+)$/i.exec(rest);
      if (addM) {
        const [title, ...bodyParts] = addM[1].split('|');
        const body = bodyParts.join('|').trim();
        if (!title.trim() || !body) {
          await sendOwnerMessage('Add a note: <code>/cheat add F30 ambient | FEM_BODY → AMBIENT = aktiv, 11 colours</code>');
          return ok();
        }
        const { error } = await sb
          .from('cheat_notes')
          .insert({ title: title.trim().slice(0, 120), body: body.slice(0, 1000), keywords: title.trim().toLowerCase() });
        if (error) {
          await sendOwnerMessage(`❌ ${escapeHtml(error.message)} — run the cheat_notes migration in Supabase.`);
          return ok();
        }
        await sendOwnerMessage(`✅ Saved to your cheat-sheet: <b>${escapeHtml(title.trim())}</b>`);
        return ok();
      }

      // /cheat del 5
      const delM = /^del(?:ete)?\s+(\d+)$/i.exec(rest);
      if (delM) {
        await sb.from('cheat_notes').delete().eq('id', Number(delM[1]));
        await sendOwnerMessage(`🗑 Deleted note #${delM[1]}.`);
        return ok();
      }

      if (!rest) {
        await sendCheatIndex(sb);
        return ok();
      }

      // Search built-in + custom notes.
      const builtin = findCheat(rest);
      const { data: notesData } = await sb
        .from('cheat_notes')
        .select('id, title, body, keywords')
        .or(`title.ilike.%${rest}%,keywords.ilike.%${rest}%,body.ilike.%${rest}%`)
        .limit(5);
      const notes = (notesData ?? []) as { id: number; title: string; body: string }[];

      if (!builtin.length && !notes.length) {
        await sendOwnerMessage(`No cheat entries for «${escapeHtml(rest)}». See all: /cheat`);
        return ok();
      }
      const blocks: string[] = builtin.map((e) => formatCheat(e, escapeHtml));
      for (const n of notes) {
        blocks.push(`📝 <b>${escapeHtml(n.title)}</b> <code>#${n.id}</code>\n${escapeHtml(n.body)}`);
      }
      await sendOwnerMessage([blocks.join('\n\n'), '', CHEAT_DISCLAIMER].join('\n'));
      return ok();
    }
    if (/^\/reply(@\w+)?\b/.test(text)) {
      const key = text.replace(/^\/reply(@\w+)?\s*/, '').trim().toLowerCase();
      const direct = key ? getReply(key) : undefined;
      if (direct) {
        await sendOwnerMessage(`<b>${direct.label}</b>\n<code>${escapeHtml(direct.text)}</code>`);
        return ok();
      }
      const keyboard = {
        inline_keyboard: [
          ...CANNED_REPLIES.map((r) => [{ text: r.label, callback_data: `rt:${r.key}` }]),
          [{ text: '⭐ Ask for a review', callback_data: 'rv' }],
        ],
      };
      await sendOwnerMessage('📋 <b>Ready replies</b> — pick one, then tap the text to copy:', keyboard);
      return ok();
    }
    if (/^\/paid(@\w+)?\b/.test(text)) {
      const rest = text.replace(/^\/paid(@\w+)?\s*/, '').trim();

      // Fix a mistake: /paid del last  |  /paid del 12
      const del = /^del(?:ete)?\s+(last|\d+)$/i.exec(rest);
      if (del) {
        type PayRow = { id: number; amount: number; client: string | null };
        let row: PayRow | null = null;
        if (del[1].toLowerCase() === 'last') {
          const { data } = await sb
            .from('payments')
            .select('id, amount, client')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          row = (data as PayRow | null) ?? null;
        } else {
          const { data } = await sb
            .from('payments')
            .select('id, amount, client')
            .eq('id', Number(del[1]))
            .maybeSingle();
          row = (data as PayRow | null) ?? null;
        }
        if (!row) {
          await sendOwnerMessage('Nothing to delete — check the id in /paid.');
          return ok();
        }
        await sb.from('payments').delete().eq('id', row.id);
        await sendOwnerMessage(
          `🗑 Deleted payment <code>#${row.id}</code> — €${Number(row.amount).toFixed(0)}${row.client ? ` · ${escapeHtml(row.client)}` : ''}\nRe-add if needed: <code>/paid ${Number(row.amount).toFixed(0)} ${escapeHtml(row.client || '')}</code>`,
        );
        return ok();
      }

      const m = rest.match(/^(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur)?\s*([\s\S]*)$/i);
      if (!rest || !m) {
        // No args → show the money summary.
        const { data: pays } = await sb
          .from('payments')
          .select('id, amount, client, service, created_at, cost, share_pct, share_name')
          .order('created_at', { ascending: false })
          .limit(200);
        const list = (pays ?? []) as { id: number; amount: number; client: string | null; service: string | null; created_at: string; cost?: number | null; share_pct?: number | null; share_name?: string | null }[];
        if (!list.length) {
          await sendOwnerMessage('💶 No payments logged yet.\nRecord one: <code>/paid 120 John CarPlay</code>');
          return ok();
        }
        const since = (d: number) => Date.now() - d * 86400000;
        const shareOf = (x: (typeof list)[number]) =>
          Math.round((Number(x.amount || 0) - Number(x.cost || 0)) * Number(x.share_pct || 0)) / 100;
        const netOf = (x: (typeof list)[number]) =>
          Number(x.amount || 0) - Number(x.cost || 0) - shareOf(x);
        const agg = (ms: number) => {
          const rows = list.filter((x) => new Date(x.created_at).getTime() >= ms);
          return {
            gross: rows.reduce((a, x) => a + Number(x.amount || 0), 0),
            cost: rows.reduce((a, x) => a + Number(x.cost || 0), 0),
            share: rows.reduce((a, x) => a + shareOf(x), 0),
            net: rows.reduce((a, x) => a + netOf(x), 0),
          };
        };
        const w = agg(since(7));
        const mo = agg(since(30));
        const fmtAgg = (a: typeof w) =>
          a.cost || a.share
            ? `€${a.gross.toFixed(0)} − costs €${a.cost.toFixed(0)} − shares €${a.share.toFixed(2)} = <b>net €${a.net.toFixed(2)}</b>`
            : `<b>€${a.gross.toFixed(0)}</b>`;
        // Owed per person this month (settle in cash, then log however you like).
        const owed = new Map<string, number>();
        for (const x of list.filter((y) => new Date(y.created_at).getTime() >= since(30))) {
          const sh = shareOf(x);
          if (sh > 0) {
            const k = (x.share_name || 'partner').trim();
            owed.set(k, (owed.get(k) ?? 0) + sh);
          }
        }
        const lines = [
          '💶 <b>Money</b>',
          '━━━━━━━━━━━━━━━━━━━',
          `Week: ${fmtAgg(w)}`,
          `Month: ${fmtAgg(mo)}`,
          ...(owed.size
            ? ['', '<b>Owed this month:</b>', ...[...owed].map(([k, v]) => `  🤝 ${escapeHtml(k)}: €${v.toFixed(2)}`)]
            : []),
          '',
          '<b>Recent:</b>',
        ];
        for (const x of list.slice(0, 6)) {
          const d = new Date(x.created_at).toLocaleDateString('en-IE', { day: '2-digit', month: 'short' });
          const extra = Number(x.cost || 0) || Number(x.share_pct || 0) ? ` → net €${netOf(x).toFixed(2)}` : '';
          lines.push(`  <code>#${x.id}</code> €${Number(x.amount).toFixed(0)}${extra} — ${escapeHtml([x.client, x.service].filter(Boolean).join(' · ') || '—')} (${d})`);
        }
        lines.push(
          '',
          'Add: <code>/paid 120 C-007 CarPlay</code> or <code>/paid 120 John Smith - CarPlay</code>',
          'With economics: <code>/paid 200 John CarPlay cost 50 FSC share 25 Alex</code>',
          'Undo: <code>/paid del last</code> or <code>/paid del 12</code>',
        );
        await sendOwnerMessage(lines.join('\n'));
        return ok();
      }
      const amount = parseFloat(m[1].replace(',', '.'));
      // Who + what: "C-007 CarPlay" (code → full name), "John Smith - CarPlay"
      // (dash separates a multi-word name), or "John CarPlay" (first word = name).
      let tail = (m[2] || '').trim();
      // Economics tokens anywhere in the text:
      //   cost 50 [note]  → direct expense (FSC code, part)
      //   share 25 [Name] → % of (amount - costs) owed to a partner/referrer
      let cost = 0;
      let costNote = '';
      let sharePct = 0;
      let shareName = '';
      const costM = /\bcost:?\s*(\d+(?:[.,]\d{1,2})?)(?:\s+(\w[\w -]{0,30}?))?(?=\s+share\b|$)/i.exec(tail);
      if (costM) {
        cost = parseFloat(costM[1].replace(',', '.'));
        costNote = (costM[2] || '').trim();
        tail = tail.replace(costM[0], '').trim();
      }
      const shareM = /\bshare:?\s*(\d{1,2})%?(?:\s+(\w[\w -]{0,30}?))?(?=\s+cost\b|$)/i.exec(tail);
      if (shareM) {
        sharePct = Math.min(90, Number(shareM[1]));
        shareName = (shareM[2] || '').trim();
        tail = tail.replace(shareM[0], '').trim();
      }
      let client = '';
      let service = '';
      const codeM = /^(c[-\s]?0*\d+)\b\s*([\s\S]*)$/i.exec(tail);
      if (codeM) {
        const c = await resolveClient(sb, codeM[1]);
        client = c?.name || codeM[1].toUpperCase();
        service = codeM[2].trim();
      } else if (tail.includes(' - ')) {
        const [n, ...svc] = tail.split(' - ');
        client = n.trim();
        service = svc.join(' - ').trim();
      } else {
        const [n = '', ...svc] = tail.split(/\s+/);
        client = n;
        service = svc.join(' ');
      }
      const shareEur = sharePct ? Math.round((amount - cost) * sharePct) / 100 : 0;
      const net = amount - cost - shareEur;
      let { error } = await sb.from('payments').insert({
        amount, client: client || null, service: service || null,
        cost, cost_note: costNote || null, share_pct: sharePct, share_name: shareName || null,
      });
      if (error && (cost || sharePct)) {
        // Economics columns not migrated yet — save the basic row, warn once.
        const basic = await sb.from('payments').insert({ amount, client: client || null, service: service || null });
        error = basic.error;
        if (!error) {
          await sendOwnerMessage('⚠️ Saved without cost/share — run the payments migration in Supabase (see RUNBOOK).');
        }
      }
      if (error) {
        await sendOwnerMessage(`❌ Could not save: ${escapeHtml(error.message)}\n(Run the payments migration in Supabase if you haven't.)`);
        return ok();
      }
      const econ = cost || sharePct
        ? `\n− costs €${cost.toFixed(0)}${costNote ? ` (${escapeHtml(costNote)})` : ''}${sharePct ? ` · − share €${shareEur.toFixed(2)} (${sharePct}%${shareName ? ` → ${escapeHtml(shareName)}` : ''})` : ''}\n= <b>Net €${net.toFixed(2)}</b>`
        : '';
      await sendOwnerMessage(
        `✅ Logged <b>€${amount.toFixed(0)}</b>${client ? ` — ${escapeHtml(client)}` : ''}${service ? ` · ${escapeHtml(service)}` : ''}${econ}\nTotals: /paid · Mistake? <code>/paid del last</code>`,
      );
      return ok();
    }
    if (/^\/review(@\w+)?\b/.test(text)) {
      await sendReviewTemplates(sb, text.replace(/^\/review(@\w+)?\s*/, '').trim());
      return ok();
    }
    // Random but internally consistent Japanese address (real postal code,
    // prefecture, city and town; random block, building and room) — for
    // forms around Japan-import work that insist on a Japanese address.
    if (/^\/(jp|japan|jpaddr)(@\w+)?\b/.test(text)) {
      const { text: body, keyboard } = jpAddressMessage();
      await sendOwnerMessage(body, keyboard as never);
      return ok();
    }
    if (/^\/stats(@\w+)?\b/.test(text)) {
      await sendStats(sb);
      return ok();
    }
    // Otherwise, feed it to an active invoice draft (if any).
    if (await tryHandleInvoiceText(sb, msg.chat.id, text)) return ok();
    return ok();
  }

  // ── Inline button callbacks ────────────────────────────────────
  const cq = update.callback_query;
  if (!cq || !cq.data || !cq.message) return ok();
  if (!isOwner(cq.message.chat.id)) {
    await answerCallback(cq.id);
    return ok();
  }
  if (!sb) {
    await answerCallback(cq.id, 'Database not configured.');
    return ok();
  }

  const chatId = cq.message.chat.id;
  const messageId = cq.message.message_id;

  // ── WhatsApp: who is waiting, handled elsewhere, read a chat ──
  if (cq.data === 'wapend') {
    const { text, keyboard } = buildPendingWa(await unansweredChats(sb));
    await editMessage(chatId, messageId, text, keyboard);
    await answerCallback(cq.id);
    return ok();
  }
  const waDone = /^wadone:(\d{8,15})$/.exec(cq.data);
  if (waDone) {
    // Called them, saw them, sorted it elsewhere: a note in the chat so it
    // leaves the list (and the assistant knows Alex has dealt with it).
    await sb
      .from('wa_messages')
      .insert({ msg_id: `owner:done:${waDone[1]}:${Date.now()}`, wa_id: waDone[1], role: 'assistant', content: '[Alex] (handled outside this chat)', via: 'owner' })
      .then(() => undefined, () => undefined);
    await markContactHandled(sb, waDone[1]).catch(() => 0);
    const { text, keyboard } = buildPendingWa(await unansweredChats(sb));
    await editMessage(chatId, messageId, text, keyboard);
    await answerCallback(cq.id, 'Marked handled ✓');
    return ok();
  }
  const waLog = /^walog:(\d{8,15})$/.exec(cq.data);
  if (waLog) {
    await answerCallback(cq.id);
    await sendOwnerMessage(await chatLogText(sb, waLog[1]));
    return ok();
  }

  // /tools buttons and the review templates from /reply.
  const tool = /^tool:(jp|cheat|stats|cal|ban)$/.exec(cq.data);
  if (tool) {
    await answerCallback(cq.id);
    if (tool[1] === 'jp') {
      const { text, keyboard } = jpAddressMessage();
      await sendOwnerMessage(text, keyboard as never);
    } else if (tool[1] === 'cheat') await sendCheatIndex(sb);
    else if (tool[1] === 'stats') await sendStats(sb);
    else if (tool[1] === 'cal') await sendCalendarLink();
    else await sendBanlist(sb);
    return ok();
  }
  if (cq.data === 'rv') {
    await answerCallback(cq.id);
    await sendReviewTemplates(sb, '');
    return ok();
  }

  // Canned reply pick → send the text as a tap-to-copy block.
  if (cq.data.startsWith('rt:')) {
    const r = getReply(cq.data.slice(3));
    await answerCallback(cq.id);
    if (r) await sendOwnerMessage(`<b>${r.label}</b>\n<code>${escapeHtml(r.text)}</code>`);
    return ok();
  }

  // WhatsApp AI pause/resume per chat.
  if (cq.data.startsWith('wamine:')) {
    const waId = cq.data.slice(7);
    await sb.from('wa_chats').upsert({ wa_id: waId, owner_replied_at: new Date().toISOString() });
    await markContactHandled(sb, waId).catch(() => 0);
    await answerCallback(cq.id, 'Yours for 6 hours');
    await sendOwnerMessage(
      `✋ You have this chat with <code>+${waId}</code>. The assistant will not reply for 6 hours; ` +
        `after that it picks it back up. Hand it back sooner with <code>/wa start +${waId}</code>.`,
    );
    return ok();
  }

  if (cq.data.startsWith('wap:') || cq.data.startsWith('war:')) {
    const waId = cq.data.slice(4);
    const paused = cq.data.startsWith('wap:');
    // Resuming also ends the 6h "Alex is handling it" stand-down — otherwise
    // the button says "resumed" while the assistant keeps sitting it out.
    const { error } = await sb.from('wa_chats').upsert(paused ? { wa_id: waId, paused } : { wa_id: waId, paused, owner_replied_at: null });
    const { data: check } = await sb
      .from('wa_chats')
      .select('paused')
      .eq('wa_id', waId)
      .maybeSingle();
    const applied = (check as { paused?: boolean } | null)?.paused === paused;
    await answerCallback(
      cq.id,
      applied
        ? paused
          ? 'AI paused for this chat'
          : 'AI resumed for this chat'
        : `Failed: ${error?.message ?? 'not saved'}`,
    );
    if (!applied) {
      await sendOwnerMessage(
        `⚠️ Could not ${paused ? 'pause' : 'resume'} the AI for <code>${waId}</code>: ` +
          `${escapeHtml(error?.message ?? 'the row did not change')}. Try <code>/wa ${paused ? 'stop' : 'start'} ${waId}</code>.`,
      );
      return ok();
    }
    await sendOwnerMessage(
      paused
        ? `⏸ AI paused for <code>+${waId}</code> — reply with <code>/wa +${waId} your text</code>`
        : `▶️ AI resumed for <code>+${waId}</code> — answering their last message now.`,
    );
    if (!paused) answerPendingInBackground(sb, waId);
    return ok();
  }

  // Invoice wizard price-choice callbacks.
  if (cq.data.startsWith('inv:')) {
    await tryHandleInvoiceCallback(sb, chatId, messageId, cq.data, (t) => answerCallback(cq.id, t));
    return ok();
  }

  // /jp → "Another one": redraw the same message with a fresh address.
  if (cq.data === 'jp:new') {
    const { text, keyboard } = jpAddressMessage();
    await editMessage(chatId, messageId, text, keyboard as never);
    await answerCallback(cq.id);
    return ok();
  }

  // Back to the date list.
  if (cq.data === 'bklist') {
    const rows = await upcomingBookings(sb);
    const { text, keyboard } = buildBookingsMenu(rows);
    await editMessage(chatId, messageId, text, keyboard);
    await answerCallback(cq.id);
    return ok();
  }

  // Drill into a single date.
  const day = /^bkday:(\d{4}-\d{2}-\d{2})$/.exec(cq.data);
  if (day) {
    const [rows, freeWins] = await Promise.all([upcomingBookings(sb), freeWindowsFor(sb, day[1])]);
    const { text, keyboard } = buildBookingsDay(day[1], rows, freeWins);
    await editMessage(chatId, messageId, text, keyboard);
    await answerCallback(cq.id);
    return ok();
  }

  // Free a slot: marks it cancelled (frees availability) but keeps the
  // customer record. Re-renders the day so the slot drops off the list.
  // The morning agenda is a list of people, and each one opens into a card with
  // everything needed to answer them — a name you cannot tap is just a reminder
  // that you are late.
  if (cq.data === 'agenda') {
    const agenda = await buildAgenda(sb);
    await editMessage(chatId, messageId, agenda.text, agenda.keyboard);
    await answerCallback(cq.id);
    return ok();
  }

  // "All answered": clear the waiting list in one tap and redraw the agenda.
  if (cq.data === 'agclear') {
    const n = await markAllWaitingHandled(sb);
    const agenda = await buildAgenda(sb);
    await editMessage(
      chatId,
      messageId,
      agenda.empty ? '⏰ <b>Daily agenda</b>\n\nNothing booked and nobody waiting.' : agenda.text,
      agenda.keyboard,
    );
    await answerCallback(cq.id, n ? `Cleared ${n} ✓` : 'Nothing to clear');
    return ok();
  }

  // "Answered" on a lead card: this person (every enquiry from the number) is done.
  const leadDone = /^leaddone:(\d+)$/.exec(cq.data);
  if (leadDone) {
    const id = Number(leadDone[1]);
    const { data: row } = await sb.from('bookings').select('contact').eq('id', id).maybeSingle();
    const contact = (row as { contact?: string } | null)?.contact ?? '';
    const n = (await markContactHandled(sb, contact).catch(() => 0)) || 0;
    if (!n) await sb.from('bookings').update({ handled: true }).eq('id', id);
    const agenda = await buildAgenda(sb);
    await editMessage(
      chatId,
      messageId,
      agenda.empty ? '⏰ <b>Daily agenda</b>\n\nNothing booked and nobody waiting.' : agenda.text,
      agenda.keyboard,
    );
    await answerCallback(cq.id, 'Marked answered ✓');
    return ok();
  }

  const leadOpen = /^lead:(\d+)$/.exec(cq.data);
  if (leadOpen) {
    const { data } = await sb
      .from('bookings')
      .select('id, name, contact, service, bmw_model, message, slot_date, slot_time, status, created_at')
      .eq('id', Number(leadOpen[1]))
      .maybeSingle();
    const lead = data as AgendaLead | null;
    if (!lead) {
      await answerCallback(cq.id, 'That enquiry is gone.');
      return ok();
    }
    const card = buildLeadCard(lead);
    await editMessage(chatId, messageId, card.text, card.keyboard);
    await answerCallback(cq.id);
    return ok();
  }

  const leadLog = /^leadlog:(\d+)$/.exec(cq.data);
  if (leadLog) {
    const { data } = await sb
      .from('bookings')
      .select('contact')
      .eq('id', Number(leadLog[1]))
      .maybeSingle();
    const waId = ((data as { contact?: string } | null)?.contact ?? '').replace(/\D/g, '');
    await answerCallback(cq.id);
    await sendOwnerMessage(waId ? await chatLogText(sb, waId) : 'No stored messages for this contact.');
    return ok();
  }

  const free = /^bkfree:(\d+)$/.exec(cq.data);
  if (free) {
    const id = Number(free[1]);
    const { data: row } = await sb.from('bookings').select('slot_date, contact').eq('id', id).single();
    await sb.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    // One tap clears the whole person. Older duplicate enquiries from the same
    // chat would otherwise resurface in tomorrow's agenda, and Alex would be
    // dismissing the same name every morning.
    const contact = (row as { contact?: string } | null)?.contact;
    if (contact) {
      await sb
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('contact', contact)
        .eq('status', 'pending')
        .is('slot_date', null)
        .then(() => undefined, () => undefined);
    }
    await answerCallback(cq.id, 'Slot freed ✓');
    const date = (row?.slot_date as string | null) ?? null;
    if (!date) {
      const agenda = await buildAgenda(sb);
      await editMessage(chatId, messageId, agenda.text, agenda.keyboard);
      return ok();
    }
    if (date) {
      const [rows, freeWins] = await Promise.all([upcomingBookings(sb), freeWindowsFor(sb, date)]);
      const { text, keyboard } = buildBookingsDay(date, rows, freeWins);
      await editMessage(chatId, messageId, text, keyboard);
    }
    return ok();
  }

  // Header row in the day view — just a label, no action.
  if (cq.data.startsWith('bknoop:')) {
    await answerCallback(cq.id);
    return ok();
  }

  // "💶 Paid" on a booking → show quick amount choices.
  const paid = /^bkpaid:(\d+)$/.exec(cq.data);
  if (paid) {
    const id = Number(paid[1]);
    const { data: bRow } = await sb
      .from('bookings')
      .select('name, service')
      .eq('id', id)
      .single();
    if (!bRow) {
      await answerCallback(cq.id, 'Booking not found.');
      return ok();
    }
    // Offer the service's own price (parsed) plus common amounts.
    const amounts = new Set<number>();
    if (bRow.service) {
      const { data: svc } = await sb
        .from('services')
        .select('price_label')
        .eq('title', bRow.service)
        .maybeSingle();
      const p = svc?.price_label ? parseInt(String(svc.price_label).replace(/[^\d]/g, ''), 10) : NaN;
      if (Number.isFinite(p) && p > 0) amounts.add(p);
    }
    [60, 80, 120, 150].forEach((a) => amounts.add(a));
    const sorted = [...amounts].sort((a, b) => a - b);
    const rows: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < sorted.length; i += 3) {
      rows.push(sorted.slice(i, i + 3).map((a) => ({ text: `€${a}`, callback_data: `bkpaidamt:${id}:${a}` })));
    }
    await sendOwnerWithMarkup(
      `💶 Log payment for <b>${escapeHtml(String(bRow.name))}</b>${bRow.service ? ` · ${escapeHtml(String(bRow.service))}` : ''}\nPick an amount, or type <code>/paid 137 ${escapeHtml(String(bRow.name).split(/\s+/)[0])}</code> for a custom one.`,
      { inline_keyboard: rows },
    );
    await answerCallback(cq.id);
    return ok();
  }

  const paidAmt = /^bkpaidamt:(\d+):(\d+)$/.exec(cq.data);
  if (paidAmt) {
    const id = Number(paidAmt[1]);
    const amount = Number(paidAmt[2]);
    const { data: bRow } = await sb.from('bookings').select('name, service').eq('id', id).single();
    const { error } = await sb.from('payments').insert({
      amount,
      client: bRow?.name ?? null,
      service: bRow?.service ?? null,
    });
    if (error) {
      await answerCallback(cq.id, 'Failed — run payments migration.');
      await sendOwnerMessage(`❌ Could not log payment: ${escapeHtml(error.message)}`);
      return ok();
    }
    await answerCallback(cq.id, `Logged €${amount} ✓`);
    await sendOwnerMessage(
      `✅ Logged <b>€${amount}</b> — ${escapeHtml(String(bRow?.name ?? ''))}${bRow?.service ? ` · ${escapeHtml(String(bRow.service))}` : ''}\nTotals: /paid`,
    );
    return ok();
  }

  // Move a booking: pick a day → pick a free window → done.
  const mv = /^bkmv:(\d+)$/.exec(cq.data);
  if (mv) {
    const id = Number(mv[1]);
    const blocked = new Set(await getBlockedDates(sb));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: string[] = [];
    for (let i = 0; days.length < 10 && i < 21; i++) {
      const d = new Date(today.getTime() + i * 86400000).toISOString().slice(0, 10);
      if (!blocked.has(d)) days.push(d);
    }
    const rows: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < days.length; i += 2) {
      rows.push(
        days.slice(i, i + 2).map((d) => ({
          text: new Date(`${d}T00:00:00`).toLocaleDateString('en-IE', { weekday: 'short', day: '2-digit', month: 'short' }),
          callback_data: `bkmvd:${id}:${d}`,
        })),
      );
    }
    rows.push([{ text: '← Back', callback_data: 'bklist' }]);
    await editMessage(chatId, messageId, '🕓 <b>Move booking</b> — pick a new day:', { inline_keyboard: rows });
    await answerCallback(cq.id);
    return ok();
  }

  const mvd = /^bkmvd:(\d+):(\d{4}-\d{2}-\d{2})$/.exec(cq.data);
  if (mvd) {
    const id = Number(mvd[1]);
    const date = mvd[2];
    const wins = await freeWindowsFor(sb, date, id);
    const rows: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < wins.length; i += 2) {
      rows.push(
        wins.slice(i, i + 2).map((w) => ({
          text: w,
          callback_data: `bkmvt:${id}:${date}:${parseInt(w, 10)}`,
        })),
      );
    }
    // Any time he likes, not just the hourly grid (a full day included).
    rows.push([{ text: '✍️ Custom time', callback_data: `bkmvc:${id}:${date}` }]);
    rows.push([{ text: '← Back', callback_data: `bkmv:${id}` }]);
    await editMessage(
      chatId,
      messageId,
      wins.length
        ? `🕓 <b>Move booking</b> — free windows on <b>${date}</b>, or type your own time:`
        : `🕓 <b>Move booking</b> — no free windows on <b>${date}</b>. Type your own time, or go back:`,
      { inline_keyboard: rows },
    );
    await answerCallback(cq.id);
    return ok();
  }

  const mvt = /^bkmvt:(\d+):(\d{4}-\d{2}-\d{2}):(\d{1,2})$/.exec(cq.data);
  if (mvt) {
    const slotTime = windowLabel(Number(mvt[3]), await getSlotDuration(sb));
    await answerCallback(cq.id, 'Moved ✓');
    await finishMove(sb, Number(mvt[1]), mvt[2], slotTime, { chatId, messageId });
    return ok();
  }

  // "Custom time": the next thing Alex types (10:30, 10:30-12:00…) is the new time.
  const mvc = /^bkmvc:(\d+):(\d{4}-\d{2}-\d{2})$/.exec(cq.data);
  if (mvc) {
    const id = Number(mvc[1]);
    const date = mvc[2];
    const { data: bRow } = await sb.from('bookings').select('name').eq('id', id).maybeSingle();
    await sb
      .from('app_config')
      .upsert({ key: PENDING_MOVE_KEY, value: JSON.stringify({ id, date, chatId, messageId, at: Date.now() }) });
    await answerCallback(cq.id);
    await sendOwnerMessage(
      `✍️ Type the new time for <b>${escapeHtml(String((bRow as { name?: string } | null)?.name ?? 'this booking'))}</b> on <b>${dayShort(date)}</b>:\n` +
        '<code>10:30</code> (usual length) or <code>10:30-12:00</code>. /cancel to stop.',
    );
    return ok();
  }

  // Confirm / decline a specific booking.
  const m = /^bk:(confirm|decline):(\d+)$/.exec(cq.data);
  if (!m) {
    await answerCallback(cq.id);
    return ok();
  }
  const status = m[1] === 'confirm' ? 'confirmed' : 'declined';
  const id = Number(m[2]);

  const { data } = await sb.from('bookings').select('*').eq('id', id).single();
  const booking = data as Booking | null;
  if (!booking) {
    await answerCallback(cq.id, 'Booking not found.');
    return ok();
  }

  await sb.from('bookings').update({ status }).eq('id', id);

  // Rebuild the whole card, not a reduced one: after Confirm the source,
  // landing page, address and client code used to disappear from it.
  const extra = booking as Booking & {
    source?: string | null;
    how_heard?: string | null;
    contact_pref?: string | null;
    landing?: string | null;
    visit_type?: string | null;
    visit_address?: string | null;
  };
  const client = await resolveClient(sb, booking.contact).catch(() => null);
  const lead: Lead = {
    name: booking.name,
    contact: booking.contact,
    bmw_model: booking.bmw_model,
    service: booking.service,
    message: booking.message,
    slot_date: booking.slot_date,
    slot_time: booking.slot_time,
    public_token: booking.public_token,
    source: extra.source ?? undefined,
    howHeard: extra.how_heard ?? undefined,
    contactPref: extra.contact_pref ?? undefined,
    landing: extra.landing ?? undefined,
    visitType: extra.visit_type ?? undefined,
    visitAddress: extra.visit_address ?? undefined,
    clientNote: client ? `🆔 <b>Client:</b> ${clientCode(client.id)}` : undefined,
  };
  await editBookingMessage(chatId, messageId, lead, status);
  await answerCallback(cq.id, status === 'confirmed' ? 'Marked as confirmed ✅' : 'Marked as declined ❌');
  return ok();
}
