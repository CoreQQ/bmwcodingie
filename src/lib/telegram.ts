const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;

/** True when both Telegram env vars are present. */
export const telegramConfigured = Boolean(TG_TOKEN && TG_CHAT_ID);

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export type Lead = {
  name: string;
  contact: string;
  bmw_model?: string;
  service?: string;
  message?: string;
  /** false when the lead could not be written to the database */
  persisted?: boolean;
};

/** Shared sender — never throws, returns false on any failure. */
async function sendTelegramMessage(text: string): Promise<boolean> {
  if (!telegramConfigured) {
    console.warn('[telegram] TG_TOKEN / TG_CHAT_ID not set — skipping notification');
    return false;
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error('[telegram] sendMessage failed:', res.status, detail);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[telegram] request error:', e);
    return false;
  }
}

/** Sends a new-enquiry notification to the owner's Telegram chat. */
export async function notifyTelegram(lead: Lead): Promise<boolean> {
  const lines = [
    '🚗 <b>New BMW Coding IE enquiry</b>',
    '━━━━━━━━━━━━━━━━━━━',
    `👤 <b>Name:</b> ${esc(lead.name)}`,
    `☎️ <b>Contact:</b> ${esc(lead.contact)}`,
  ];
  if (lead.bmw_model) lines.push(`🚙 <b>BMW:</b> ${esc(lead.bmw_model)}`);
  if (lead.service) lines.push(`🔧 <b>Service:</b> ${esc(lead.service)}`);
  if (lead.message) lines.push(`💬 <b>Message:</b> ${esc(lead.message)}`);
  if (lead.persisted === false) {
    lines.push('', '⚠️ <i>Not saved to the database — follow up manually.</i>');
  }
  return sendTelegramMessage(lines.join('\n'));
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
