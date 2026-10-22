import { translateToRussian } from './translate';
import { waLinkFor } from './phone';
import { XMAS, XMAS_ON } from './season';

const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const API = `https://api.telegram.org/bot${TG_TOKEN}`;

/** True when both Telegram env vars are present. */
export const telegramConfigured = Boolean(TG_TOKEN && TG_CHAT_ID);

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Inline keyboard types (subset of the Telegram Bot API we use) ───
export type InlineButton =
  | { text: string; callback_data: string }
  | { text: string; copy_text: { text: string } }
  | { text: string; url: string };
export type InlineKeyboard = { inline_keyboard: InlineButton[][] };

/** Low-level call to a Bot API method. Never throws; returns the parsed JSON or null. */
/** Cut to at most `max` UTF-16 units without splitting an emoji in half —
 *  a half surrogate makes Telegram reject the whole message. */
function clipText(s: string, max: number): string {
  let out = '';
  for (const ch of s) {
    if (out.length + ch.length > max) break;
    out += ch;
  }
  return out;
}

/** copy_text buttons take 1–256 characters; anything else fails the send. */
function sanitizeMarkup(markup: unknown): unknown {
  const kb = (markup as { inline_keyboard?: unknown[][] } | null)?.inline_keyboard;
  if (!Array.isArray(kb)) return markup;
  return {
    ...(markup as object),
    inline_keyboard: kb.map((row) =>
      row.map((b) => {
        const btn = b as { copy_text?: { text?: string } };
        if (!btn.copy_text) return b;
        return { ...btn, copy_text: { text: clipText(btn.copy_text.text || ' ', 256) || ' ' } };
      }),
    ),
  };
}

const warnedOnce = new Set<string>();
function isRateLimitedOnce(key: string): boolean {
  if (warnedOnce.has(key)) return true;
  warnedOnce.add(key);
  return false;
}

async function tgCall(method: string, payload: Record<string, unknown>, attempt = 0): Promise<unknown | null> {
  if (!TG_TOKEN) {
    console.warn('[telegram] TG_TOKEN not set — skipping', method);
    return null;
  }
  const body = payload.reply_markup ? { ...payload, reply_markup: sanitizeMarkup(payload.reply_markup) } : payload;
  try {
    const res = await fetch(`${API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[telegram] ${method} failed:`, res.status, detail);
      if (attempt > 0 || method !== 'sendMessage') return null;
      // A lead notification must arrive even when Telegram objects to how it
      // is dressed: wait out a flood limit, or resend without the buttons,
      // or as plain text if the HTML would not parse.
      if (res.status === 429) {
        const wait = Number((JSON.parse(detail || '{}') as { parameters?: { retry_after?: number } }).parameters?.retry_after) || 5;
        await new Promise((r) => setTimeout(r, Math.min(wait, 35) * 1000));
        return tgCall(method, payload, 1);
      }
      if (res.status === 400) {
        // The group became a supergroup (it happens when the bot is made an
        // admin) and got a new id: deliver there now, and say so loudly —
        // TG_CHAT_ID must be updated or commands from the group are ignored.
        const moved = (JSON.parse(detail || '{}') as { parameters?: { migrate_to_chat_id?: number } }).parameters?.migrate_to_chat_id;
        if (moved && payload.chat_id) {
          const sent = await tgCall(method, { ...payload, chat_id: moved }, 1);
          if (!isRateLimitedOnce(`tg-migrated:${moved}`)) {
            await tgCall('sendMessage', {
              chat_id: moved,
              text: `⚠️ This group got a new id: ${moved}. Put it in TG_CHAT_ID in Vercel and redeploy — until then the bot cannot see commands here.`,
            }, 1);
          }
          return sent;
        }
        if (/parse entities/i.test(detail)) {
          const plain = String(payload.text ?? '').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
          const { parse_mode: _drop, ...rest } = payload;
          return tgCall(method, { ...rest, text: plain }, 1);
        }
        if (payload.reply_markup) {
          const { reply_markup: _drop, ...rest } = payload;
          return tgCall(method, rest, 1);
        }
      }
      return null;
    }
    return await res.json().catch(() => null);
  } catch (e) {
    console.error('[telegram] request error:', e);
    return null;
  }
}

/**
 * Register the bot's command menu (the ☰ Menu button next to the input).
 * Called by the owner's /setup command so BotFather isn't needed.
 */
export async function registerBotCommands(): Promise<boolean> {
  // Eight commands, in the order a working day needs them. Everything else
  // (/jp, /cheat, /stats, /calendar, /banlist) sits behind /tools; old names
  // (/client, /log, /review, /ai) still work but are not listed.
  const commands = [
    { command: 'agenda', description: '⏰ Сегодня, завтра и кто ждёт ответа' },
    { command: 'bookings', description: '📅 Записи по дням: подтвердить, перенести, оплата' },
    { command: 'find', description: '🔎 Найти клиента, заявку или чат: имя, номер, услуга' },
    { command: 'paid', description: '💰 Деньги: /paid 120 Имя Услуга · итоги' },
    { command: 'wa', description: '💬 WhatsApp: кто ждёт, ассистент вкл/выкл' },
    { command: 'reply', description: '📋 Готовые ответы и запрос отзыва' },
    { command: 'invoice', description: '🧾 Счёт PDF' },
    { command: 'tools', description: '🧰 Японский адрес, шпаргалка, статистика, календарь, бан-лист' },
  ];
  // Register for private chats, all groups, and (explicitly) the owner's
  // chat/group — groups need their own scope or Telegram won't list commands.
  const set = (await tgCall('setMyCommands', { commands })) as { ok?: boolean } | null;
  await tgCall('setMyCommands', { commands, scope: { type: 'all_group_chats' } });
  if (TG_CHAT_ID) {
    await tgCall('setMyCommands', { commands, scope: { type: 'chat', chat_id: Number(TG_CHAT_ID) || TG_CHAT_ID } });
  }
  // Make the private-chat menu button show the command list too.
  await tgCall('setChatMenuButton', { menu_button: { type: 'commands' } });
  return Boolean(set && set.ok);
}

/** Shared sender — never throws, returns false on any failure. */
async function sendTelegramMessage(text: string, replyMarkup?: InlineKeyboard): Promise<boolean> {
  if (!telegramConfigured) {
    console.warn('[telegram] TG_TOKEN / TG_CHAT_ID not set — skipping notification');
    return false;
  }
  const ok = await tgCall('sendMessage', {
    chat_id: TG_CHAT_ID,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
  return ok !== null;
}

export type Lead = {
  name: string;
  contact: string;
  bmw_model?: string;
  service?: string;
  message?: string;
  /** Requested slot, when the customer picked one. */
  slot_date?: string | null;
  slot_time?: string;
  /** Database row id — required for the confirm/decline buttons to work. */
  id?: number;
  /** Public tracking token — appended to copy-replies as a status link. */
  public_token?: string;
  /** false when the lead could not be written to the database */
  persisted?: boolean;
  /** Pre-built "repeat customer" line (HTML), added by the booking route. */
  repeatNote?: string;
  /** Pre-built client-code / blacklist line (HTML), added by the booking route. */
  clientNote?: string;
  /** Ad attribution, e.g. "google / cpc / carplay" — set when the visitor came from a campaign. */
  source?: string;
  /** "How did you hear about us" — customer-selected. */
  howHeard?: string;
  /** Where the job happens: 'mobile' (we travel) or 'meet' (Alex names a spot). */
  visitType?: string;
  /** The customer's address or area, when they asked us to come to them. */
  visitAddress?: string;
  /** Preferred contact channel/time, free text. */
  contactPref?: string;
  /** First page the visitor landed on (intent signal). */
  landing?: string;
  /** Device · OS · browser, derived from the request. */
  device?: string;
  /** Browser/accept language. */
  language?: string;
  /** How long the visitor browsed before booking, e.g. "3m 20s". */
  dwell?: string;
};

/** Human-readable slot label, e.g. "Mon, 14 Jul · 14:00–16:00". Returns '' if no slot. */
export function formatSlot(slotDate?: string | null, slotTime?: string): string {
  if (!slotDate) return '';
  const d = new Date(`${slotDate}T00:00:00`);
  const day = Number.isNaN(d.getTime())
    ? slotDate
    : d.toLocaleDateString('en-IE', { weekday: 'short', day: '2-digit', month: 'short' });
  return slotTime ? `${day} · ${slotTime}` : day;
}

/** Trim a customer name to keep copy_text replies within Telegram's 256-char limit. */
function shortName(name: string): string {
  const n = name.trim();
  return n.length > 40 ? `${n.slice(0, 40)}…` : n || 'there';
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

/** Ready-to-paste reply confirming the slot (owner copies → sends to customer). */
export function confirmReply(name: string, slot: string, token?: string, visitType?: string): string {
  const s = slot ? ` — ${slot}` : '';
  const link = token ? ` Track it here: ${SITE}/b/${token}` : '';
  // "Confirmed" alone left customers asking "what arrival?" — say who travels.
  const where =
    visitType === 'mobile'
      ? " I'll come to you — just confirm the address and where the car will be parked."
      : visitType === 'meet'
        ? ' I\'ll send you the exact spot to meet — no call-out fee on this one.'
        : '';
  return `Hi ${shortName(name)}! Your BMW coding slot${s} is confirmed ✅${where}${link}`;
}

/** Ready-to-paste reply offering alternatives when the slot is taken. */
export function declineReply(name: string, slot: string, _token?: string): string {
  const s = slot ? ` ${slot}` : ' that time';
  return `Hi ${shortName(name)}, thanks for the request! Unfortunately${s} is no longer free. We'd still love to fit you in — what other day or time suits, and we'll sort it out.`;
}

/** Build the inline keyboard for a slot booking notification. */
function bookingKeyboard(
  id: number,
  name: string,
  slot: string,
  token?: string,
  visitType?: string,
): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: '✅ Confirm', callback_data: `bk:confirm:${id}` },
        { text: '❌ Slot taken', callback_data: `bk:decline:${id}` },
      ],
      [{ text: '📋 Copy confirmation reply', copy_text: { text: confirmReply(name, slot, token, visitType) } }],
      [{ text: '📋 Copy "offer other times" reply', copy_text: { text: declineReply(name, slot) } }],
    ],
  };
}

/** The lines that describe a booking, shared by the initial message and webhook edits. */
export function bookingLines(lead: Lead): string[] {
  const slot = formatSlot(lead.slot_date, lead.slot_time);
  const lines = [
    slot ? '📅 <b>New booking request</b>' : '🚗 <b>New BMW Coding IE enquiry</b>',
    '━━━━━━━━━━━━━━━━━━━',
    `👤 <b>Name:</b> ${esc(lead.name)}`,
    // A number is a link so one tap opens the chat; anything else stays plain text.
    `☎️ <b>Contact:</b> ${waLinkFor(lead.contact) ? `<a href="${waLinkFor(lead.contact)}">${esc(lead.contact)}</a>` : esc(lead.contact)}`,
  ];
  if (slot) lines.push(`🕒 <b>Requested slot:</b> ${esc(slot)}`);
  // Where matters as much as when: without it nobody knows who is travelling.
  if (lead.visitType === 'mobile') {
    lines.push(`📍 <b>Wants us to come to them</b>${lead.visitAddress ? `: ${esc(lead.visitAddress)}` : ' — no address given, ask'}`);
  } else if (lead.visitType === 'meet') {
    lines.push('📍 <b>They will travel to you</b> — send them the spot when you confirm (no call-out fee)');
  }
  if (lead.bmw_model) lines.push(`🚙 <b>BMW:</b> ${esc(lead.bmw_model)}`);
  if (lead.service) lines.push(`🔧 <b>Service:</b> ${esc(lead.service)}`);
  if (lead.message) lines.push(`💬 <b>Description:</b> ${esc(lead.message)}`);
  if (lead.contactPref) lines.push(`📞 <b>Reach:</b> ${esc(lead.contactPref)}`);
  if (lead.howHeard) lines.push(`👋 <b>Heard via:</b> ${esc(lead.howHeard)}`);
  if (lead.source) lines.push(`📣 <b>Ad source:</b> ${esc(lead.source)}`);
  if (lead.landing) lines.push(`📄 <b>Landed on:</b> ${esc(lead.landing)}`);
  const ctx = [lead.device, lead.language].filter(Boolean).join(' · ');
  if (ctx) lines.push(`🖥 <b>Device:</b> ${esc(ctx)}`);
  if (lead.dwell) lines.push(`⏱ <b>On site:</b> ${esc(lead.dwell)} before booking`);
  if (lead.clientNote) lines.push(lead.clientNote);
  if (lead.repeatNote) lines.push(lead.repeatNote);
  // The site shows them the offer price, so the bill must match it.
  if (XMAS_ON) lines.push(`🎄 <b>Christmas offer:</b> −${XMAS.pct}% on the work (not the call-out), until ${XMAS.until}`);
  return lines;
}

/** bookingLines plus a Russian translation of the customer's message. Shared by the
 *  initial notification and the post-confirm/decline edit so details are never lost. */
async function bookingDetailLines(lead: Lead): Promise<string[]> {
  const lines = bookingLines(lead);
  if (lead.message) {
    const translated = await translateToRussian(lead.message);
    if (translated) lines.push(`🇷🇺 <i>${esc(translated)}</i>`);
  }
  return lines;
}

/** Sends a new-enquiry / booking-request notification to the owner's Telegram chat. */
export async function notifyTelegram(lead: Lead): Promise<boolean> {
  const lines = await bookingDetailLines(lead);
  if (lead.persisted === false) {
    lines.push('', '⚠️ <i>Not saved to the database — follow up manually.</i>');
  }

  const slot = formatSlot(lead.slot_date, lead.slot_time);
  // Confirm/decline buttons only make sense for a saved slot booking; the
  // WhatsApp button goes on every lead that came with a number.
  const rows: InlineButton[][] = [];
  const wa = waLinkFor(lead.contact);
  if (wa) rows.push([{ text: '💬 Open in WhatsApp', url: wa }]);
  if (lead.id && slot) rows.push(...bookingKeyboard(lead.id, lead.name, slot, lead.public_token, lead.visitType).inline_keyboard);
  return sendTelegramMessage(lines.join('\n'), rows.length ? { inline_keyboard: rows } : undefined);
}

// ─── Webhook helpers (used by /api/telegram) ───

/** Pop the loading spinner on the tapped inline button, with an optional toast. */
export async function answerCallback(callbackQueryId: string, text?: string): Promise<void> {
  await tgCall('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...(text ? { text, show_alert: false } : {}),
  });
}

/** Rewrite a booking message after confirm/decline: stamp the outcome and leave just
 *  the relevant copy-reply button. */
export async function editBookingMessage(
  chatId: number | string,
  messageId: number,
  lead: Lead,
  outcome: 'confirmed' | 'declined',
): Promise<void> {
  const slot = formatSlot(lead.slot_date, lead.slot_time);
  const stamp =
    outcome === 'confirmed'
      ? '✅ <b>CONFIRMED</b>'
      : '❌ <b>DECLINED — slot taken</b>';
  const text = [...(await bookingDetailLines(lead)), '', stamp].join('\n');
  const button: InlineButton =
    outcome === 'confirmed'
      ? { text: '📋 Copy confirmation reply', copy_text: { text: confirmReply(lead.name, slot, lead.public_token, lead.visitType) } }
      : { text: '📋 Copy "offer other times" reply', copy_text: { text: declineReply(lead.name, slot) } };
  const wa = waLinkFor(lead.contact);
  await tgCall('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: wa ? [[{ text: '💬 Open in WhatsApp', url: wa }], [button]] : [[button]] },
  });
}

// ─── /bookings browser (command + date drill-down) ───

/** True when the chat is the configured owner chat — gates the /bookings command. */
export function isOwner(chatId: number | string): boolean {
  return Boolean(TG_CHAT_ID) && String(chatId) === String(TG_CHAT_ID);
}

const STATUS_ICON: Record<string, string> = { confirmed: '✅', pending: '⏳', declined: '❌' };

export type BookingRow = {
  id: number;
  name: string;
  contact: string;
  slot_date: string | null;
  slot_time: string;
  status: string;
  bmw_model?: string;
  service?: string;
  message?: string;
};

function dayLabel(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString('en-IE', { weekday: 'short', day: '2-digit', month: 'short' });
}

/** Top-level /bookings view: totals + one button per upcoming date with counts. */
export function buildBookingsMenu(rows: BookingRow[]): { text: string; keyboard: InlineKeyboard } {
  const active = rows.filter(
    (r) => r.slot_date && (r.status === 'pending' || r.status === 'confirmed'),
  );
  const confirmed = active.filter((r) => r.status === 'confirmed').length;
  const pending = active.filter((r) => r.status === 'pending').length;

  const byDate = new Map<string, BookingRow[]>();
  for (const r of active) {
    const k = r.slot_date as string;
    const arr = byDate.get(k);
    if (arr) arr.push(r);
    else byDate.set(k, [r]);
  }
  const dates = [...byDate.keys()].sort();

  const text = [
    '📋 <b>Upcoming bookings</b>',
    '━━━━━━━━━━━━━━━━━━━',
    `✅ ${confirmed} confirmed · ⏳ ${pending} pending`,
    dates.length ? 'Pick a date:' : 'No upcoming bookings yet.',
  ].join('\n');

  const keyboard: InlineKeyboard = {
    inline_keyboard: dates.slice(0, 30).map((d) => {
      const list = byDate.get(d)!;
      const c = list.filter((x) => x.status === 'confirmed').length;
      const p = list.filter((x) => x.status === 'pending').length;
      return [{ text: `${dayLabel(d)} · ✅${c} ⏳${p}`, callback_data: `bkday:${d}` }];
    }),
  };
  return { text, keyboard };
}

/** Drill-down for one date: each slot with customer + status, plus a back button. */
export function buildBookingsDay(
  date: string,
  rows: BookingRow[],
  freeWindows?: string[],
): { text: string; keyboard: InlineKeyboard } {
  const list = rows
    .filter((r) => r.slot_date === date && (r.status === 'pending' || r.status === 'confirmed'))
    .sort((a, b) => a.slot_time.localeCompare(b.slot_time));

  const lines = [
    `📅 <b>${esc(dayLabel(date))}</b> — ${list.length} booking${list.length === 1 ? '' : 's'}`,
    '━━━━━━━━━━━━━━━━━━━',
  ];
  if (!list.length) lines.push('No bookings for this day.');
  for (const r of list) {
    const icon = STATUS_ICON[r.status] ?? '⏳';
    lines.push(`${icon} <b>${esc(r.slot_time)}</b> · ${esc(r.name)} · ${esc(r.contact)}`);
    if (r.bmw_model) lines.push(`   🚙 ${esc(r.bmw_model)}`);
    if (r.service) lines.push(`   🔧 ${esc(r.service)}`);
    if (r.message) lines.push(`   💬 ${esc(r.message)}`);
  }

  if (freeWindows) {
    lines.push('');
    lines.push(
      freeWindows.length
        ? `🕐 <b>Free:</b> ${freeWindows.map(esc).join(' · ')}`
        : '🕐 No free windows left this day.',
    );
  }

  const buttons: InlineButton[][] = [];
  for (const r of list) {
    buttons.push([{ text: `— ${r.slot_time} · ${r.name} —`, callback_data: `bknoop:${r.id}` }]);
    buttons.push([
      { text: '💶 Paid', callback_data: `bkpaid:${r.id}` },
      { text: '🕓 Move', callback_data: `bkmv:${r.id}` },
      { text: '🗑 Free', callback_data: `bkfree:${r.id}` },
    ]);
  }
  buttons.push([{ text: '← Back to dates', callback_data: 'bklist' }]);

  return { text: lines.join('\n'), keyboard: { inline_keyboard: buttons } };
}

/** Send a fresh message to the owner chat (used by the /bookings command). */
export async function sendOwnerMessage(text: string, keyboard?: InlineKeyboard): Promise<boolean> {
  return sendTelegramMessage(text, keyboard);
}

/** Send a message to the owner chat with any reply_markup (inline keyboard,
 *  reply keyboard, or { remove_keyboard: true }). */
export async function sendOwnerWithMarkup(text: string, replyMarkup?: object): Promise<boolean> {
  if (!telegramConfigured) {
    console.warn('[telegram] not configured — skipping message');
    return false;
  }
  const ok = await tgCall('sendMessage', {
    chat_id: TG_CHAT_ID,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
  return ok !== null;
}

/**
 * A message the owner must not scroll past: loud banner, notification forced
 * on, and pinned in the group so it sits at the top until he deals with it.
 * Used when the assistant gives up and calls him in.
 */
export async function sendOwnerAlert(body: string, replyMarkup?: object): Promise<void> {
  if (!telegramConfigured) return;
  const banner = '🚨🚨🚨 <b>ALEX — THIS ONE NEEDS YOU</b> 🚨🚨🚨';
  const res = (await tgCall('sendMessage', {
    chat_id: TG_CHAT_ID,
    text: `${banner}\n${'─'.repeat(18)}\n${body}`,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    disable_notification: false,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  })) as { result?: { message_id?: number } } | null;

  // Pinning needs admin rights in the group. If it is not allowed the message
  // is still sent and still loud — never let a failed pin swallow the alert.
  const messageId = res?.result?.message_id;
  if (messageId) {
    await tgCall('pinChatMessage', {
      chat_id: TG_CHAT_ID,
      message_id: messageId,
      disable_notification: false,
    }).catch(() => null);
  }
}

/** Upload a generated PDF (or any bytes) to the owner chat. */
export async function sendOwnerDocument(
  bytes: Uint8Array,
  filename: string,
  caption?: string,
): Promise<boolean> {
  if (!TG_TOKEN || !TG_CHAT_ID) {
    console.warn('[telegram] not configured — skipping document');
    return false;
  }
  try {
    const form = new FormData();
    form.append('chat_id', String(TG_CHAT_ID));
    if (caption) form.append('caption', caption);
    form.append('document', new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }), filename);
    const res = await fetch(`${API}/sendDocument`, { method: 'POST', body: form });
    if (!res.ok) {
      console.error('[telegram] sendDocument failed:', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (e) {
    console.error('[telegram] sendDocument error:', e);
    return false;
  }
}

/** Replace a message in place (used by the date drill-down / back navigation). */
export async function editMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  /** Omit to strip the keyboard — a screen with nothing left to tap. */
  keyboard?: InlineKeyboard,
): Promise<void> {
  await tgCall('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: keyboard,
  });
}

/** Current date+time in Dublin, e.g. "01 Jul 2026, 09:18". */
function dublinTime(): string {
  try {
    return new Date().toLocaleString('en-IE', {
      timeZone: 'Europe/Dublin',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return new Date().toISOString();
  }
}

/** Generic event notification (admin login, server error, file upload, …). */
export async function notifyEvent(opts: {
  emoji: string;
  title: string;
  rows?: [string, string][];
  note?: string;
}): Promise<boolean> {
  const lines = [
    `${opts.emoji} <b>${esc(opts.title)}</b>`,
    '━━━━━━━━━━━━━━━━━━━',
    `🕒 <b>Time:</b> ${esc(dublinTime())}`,
  ];
  for (const [k, val] of opts.rows ?? []) {
    if (val) lines.push(`<b>${esc(k)}:</b> ${esc(val)}`);
  }
  if (opts.note) lines.push('', `<i>${esc(opts.note)}</i>`);
  return sendTelegramMessage(lines.join('\n'));
}
