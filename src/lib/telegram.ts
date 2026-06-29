import { translateToRussian } from './translate';

const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const API = `https://api.telegram.org/bot${TG_TOKEN}`;

/** True when both Telegram env vars are present. */
export const telegramConfigured = Boolean(TG_TOKEN && TG_CHAT_ID);

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─── Inline keyboard types (subset of the Telegram Bot API we use) ───
type InlineButton =
  | { text: string; callback_data: string }
  | { text: string; copy_text: { text: string } }
  | { text: string; url: string };
type InlineKeyboard = { inline_keyboard: InlineButton[][] };

/** Low-level call to a Bot API method. Never throws; returns the parsed JSON or null. */
async function tgCall(method: string, payload: Record<string, unknown>): Promise<unknown | null> {
  if (!TG_TOKEN) {
    console.warn('[telegram] TG_TOKEN not set — skipping', method);
    return null;
  }
  try {
    const res = await fetch(`${API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[telegram] ${method} failed:`, res.status, detail);
      return null;
    }
    return await res.json().catch(() => null);
  } catch (e) {
    console.error('[telegram] request error:', e);
    return null;
  }
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
  /** false when the lead could not be written to the database */
  persisted?: boolean;
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

/** Ready-to-paste reply confirming the slot (owner copies → sends to customer). */
export function confirmReply(name: string, slot: string): string {
  const s = slot ? ` — ${slot}` : '';
  return `Hi ${shortName(name)}! Your BMW coding slot${s} is confirmed ✅ See you then. If anything changes or you want to add details, just reply here.`;
}

/** Ready-to-paste reply offering alternatives when the slot is taken. */
export function declineReply(name: string, slot: string): string {
  const s = slot ? ` ${slot}` : ' that time';
  return `Hi ${shortName(name)}, thanks for the request! Unfortunately${s} is no longer free. We'd still love to fit you in — what other day or time suits, and we'll sort it out.`;
}

/** Build the inline keyboard for a slot booking notification. */
function bookingKeyboard(id: number, name: string, slot: string): InlineKeyboard {
  return {
    inline_keyboard: [
      [
        { text: '✅ Confirm', callback_data: `bk:confirm:${id}` },
        { text: '❌ Slot taken', callback_data: `bk:decline:${id}` },
      ],
      [{ text: '📋 Copy confirmation reply', copy_text: { text: confirmReply(name, slot) } }],
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
    `☎️ <b>Contact:</b> ${esc(lead.contact)}`,
  ];
  if (slot) lines.push(`🕒 <b>Requested slot:</b> ${esc(slot)}`);
  if (lead.bmw_model) lines.push(`🚙 <b>BMW:</b> ${esc(lead.bmw_model)}`);
  if (lead.service) lines.push(`🔧 <b>Service:</b> ${esc(lead.service)}`);
  return lines;
}

/** Sends a new-enquiry / booking-request notification to the owner's Telegram chat. */
export async function notifyTelegram(lead: Lead): Promise<boolean> {
  const lines = bookingLines(lead);
  if (lead.message) {
    lines.push(`💬 <b>Message:</b> ${esc(lead.message)}`);
    const translated = await translateToRussian(lead.message);
    if (translated) lines.push(`🇷🇺 <i>${esc(translated)}</i>`);
  }
  if (lead.persisted === false) {
    lines.push('', '⚠️ <i>Not saved to the database — follow up manually.</i>');
  }

  const slot = formatSlot(lead.slot_date, lead.slot_time);
  // Confirm/decline buttons only make sense for a saved slot booking.
  const keyboard =
    lead.id && slot ? bookingKeyboard(lead.id, lead.name, slot) : undefined;
  return sendTelegramMessage(lines.join('\n'), keyboard);
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
  const text = [...bookingLines(lead), '', stamp].join('\n');
  const button: InlineButton =
    outcome === 'confirmed'
      ? { text: '📋 Copy confirmation reply', copy_text: { text: confirmReply(lead.name, slot) } }
      : { text: '📋 Copy "offer other times" reply', copy_text: { text: declineReply(lead.name, slot) } };
  await tgCall('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: [[button]] },
  });
}

export type VisitorPing = {
  path: string;
  referrer?: string;
  device: 'mobile' | 'desktop';
  ip?: string;
  browser?: string;
  os?: string;
  location?: string;
  language?: string;
  isReturning?: boolean;
};

/** Sends a lightweight "someone's on the site" notification. */
export async function notifyVisitor(v: VisitorPing): Promise<boolean> {
  const lines = [
    `${v.isReturning ? '🔁 <b>Returning visitor</b>' : '👀 <b>New visitor on the site</b>'}`,
    '━━━━━━━━━━━━━━━━━━━',
    `📍 <b>Page:</b> ${esc(v.path)}`,
    `🔗 <b>Source:</b> ${esc(v.referrer || 'Direct / unknown')}`,
    `${v.device === 'mobile' ? '📱' : '🖥'} <b>Device:</b> ${v.device === 'mobile' ? 'Mobile' : 'Desktop'}${v.os ? ` (${esc(v.os)})` : ''}`,
  ];
  if (v.browser) lines.push(`🧭 <b>Browser:</b> ${esc(v.browser)}`);
  if (v.location) lines.push(`📌 <b>Location:</b> ${esc(v.location)}`);
  if (v.language) lines.push(`🗣 <b>Language:</b> ${esc(v.language)}`);
  lines.push(`🌐 <b>IP:</b> <code>${esc(v.ip || 'unknown')}</code>`);
  return sendTelegramMessage(lines.join('\n'));
}
