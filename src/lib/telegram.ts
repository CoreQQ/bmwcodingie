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

/**
 * Sends a new-enquiry notification to the owner's Telegram chat.
 * Never throws — returns false on any failure so the calling route
 * can still respond to the visitor normally.
 */
export async function notifyTelegram(lead: Lead): Promise<boolean> {
  if (!telegramConfigured) {
    console.warn('[telegram] TG_TOKEN / TG_CHAT_ID not set — skipping notification');
    return false;
  }

  const lines = [
    '🚗 <b>New BMW Coding IE enquiry</b>',
    '',
    `<b>Name:</b> ${esc(lead.name)}`,
    `<b>Contact:</b> ${esc(lead.contact)}`,
  ];
  if (lead.bmw_model) lines.push(`<b>BMW:</b> ${esc(lead.bmw_model)}`);
  if (lead.service) lines.push(`<b>Service:</b> ${esc(lead.service)}`);
  if (lead.message) lines.push(`<b>Message:</b> ${esc(lead.message)}`);
  if (lead.persisted === false) {
    lines.push('', '⚠️ <i>Not saved to the database — follow up manually.</i>');
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: lines.join('\n'),
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
