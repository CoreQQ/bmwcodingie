// Thin client for the official WhatsApp Business Cloud API (Meta Graph API).
// Dormant until WHATSAPP_TOKEN + WHATSAPP_PHONE_ID are set — same pattern as
// the review machine, so the code ships now and lights up after Meta setup.

const GRAPH = 'https://graph.facebook.com/v21.0';

function creds() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  return token && phoneId ? { token, phoneId } : null;
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(creds());
}

/** Send a plain-text WhatsApp message. `to` is digits only (e.g. 353871234567). */
export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const c = creds();
  if (!c) return { ok: false, error: 'WhatsApp not configured' };
  try {
    const res = await fetch(`${GRAPH}/${c.phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body, preview_url: true },
      }),
    });
    const json = (await res.json().catch(() => null)) as {
      messages?: { id: string }[];
      error?: { message?: string };
    } | null;
    if (!res.ok) return { ok: false, error: json?.error?.message || `HTTP ${res.status}` };
    return { ok: true, id: json?.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' };
  }
}

/** Mark an inbound message as read (blue ticks). Fire-and-forget. */
export async function markWhatsAppRead(messageId: string): Promise<void> {
  const c = creds();
  if (!c) return;
  try {
    await fetch(`${GRAPH}/${c.phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', status: 'read', message_id: messageId }),
    });
  } catch {
    // non-critical
  }
}

/** Normalise a phone number to Cloud API wa_id form: digits only, no +. */
export function normalizeWaNumber(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}
