// Thin client for the WhatsApp Business Cloud API. Talks either to Meta's
// Graph API directly or to a Graph-compatible relay such as Dualhook
// (WHATSAPP_API_BASE=https://api.dualhook.com/v25.0 with a dh_live_ key in
// WHATSAPP_TOKEN): same paths, same payloads, only host and credential differ.
// Dormant until WHATSAPP_TOKEN + WHATSAPP_PHONE_ID are set.

const DEFAULT_BASE = 'https://graph.facebook.com/v21.0';

function base(): string {
  return (process.env.WHATSAPP_API_BASE || DEFAULT_BASE).replace(/\/+$/, '');
}

function creds() {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  return token && phoneId ? { token, phoneId } : null;
}

export function isWhatsAppConfigured(): boolean {
  return Boolean(creds());
}

/** The phone_number_id we serve — webhooks for any other number are ignored. */
export function whatsAppPhoneId(): string {
  return process.env.WHATSAPP_PHONE_ID || '';
}

async function post(path: string, payload: unknown): Promise<{ ok: boolean; json: unknown; status: number }> {
  const c = creds();
  if (!c) return { ok: false, json: null, status: 0 };
  const res = await fetch(`${base()}/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${c.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  return { ok: res.ok, json, status: res.status };
}

/** Send a plain-text WhatsApp message. `to` is digits only (e.g. 353871234567). */
export async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const c = creds();
  if (!c) return { ok: false, error: 'WhatsApp not configured' };
  try {
    const r = await post(`${c.phoneId}/messages`, {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { body, preview_url: true },
    });
    const json = r.json as {
      messages?: { id: string }[];
      error?: { message?: string; code?: number; error_subcode?: number; error_data?: { details?: string }; fbtrace_id?: string };
    } | null;
    if (!r.ok) {
      // Keep Meta's code, subcode, details and trace id: "permission denied"
      // alone cannot be diagnosed, the subcode and details can.
      const e = json?.error;
      const bits = [
        e?.code !== undefined ? `#${e.code}${e.error_subcode ? `/${e.error_subcode}` : ''}` : `HTTP ${r.status}`,
        e?.message,
        e?.error_data?.details,
        e?.fbtrace_id ? `trace ${e.fbtrace_id}` : '',
        !e ? JSON.stringify(r.json).slice(0, 300) : '',
      ].filter(Boolean);
      return { ok: false, error: bits.join(' — ') };
    }
    return { ok: true, id: json?.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'network error' };
  }
}

/**
 * Blue ticks plus the "typing…" indicator while the assistant writes — the
 * part of WhatsApp's own AI people liked. The indicator clears itself when
 * our reply lands (or after ~25s). Fire-and-forget.
 */
export async function markWhatsAppRead(messageId: string, typing = false): Promise<void> {
  const c = creds();
  if (!c) return;
  try {
    await post(`${c.phoneId}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
      ...(typing ? { typing_indicator: { type: 'text' } } : {}),
    });
  } catch {
    // non-critical
  }
}

/**
 * Download an inbound media item (customer's photo). Two steps like Meta:
 * read the metadata for the URL, then fetch the bytes with the same bearer
 * (Dualhook points the URL at its own /content route, Meta at a CDN URL).
 * Returns a data: URL so the agent's existing image path can fetch it.
 */
export async function downloadWhatsAppMedia(
  mediaId: string,
): Promise<{ dataUrl: string; mime: string } | null> {
  const c = creds();
  if (!c) return null;
  try {
    const headers = { Authorization: `Bearer ${c.token}` };
    const meta = (await fetch(`${base()}/${mediaId}`, { headers }).then((r) => (r.ok ? r.json() : null))) as {
      url?: string;
      mime_type?: string;
    } | null;
    if (!meta?.url) return null;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(meta.url, { headers, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const mime = (res.headers.get('content-type') || meta.mime_type || '').split(';')[0].trim();
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > 4_500_000) return null;
    return { dataUrl: `data:${mime};base64,${buf.toString('base64')}`, mime };
  } catch {
    return null;
  }
}

/** Normalise a phone number to Cloud API wa_id form: digits only, no +. */
export function normalizeWaNumber(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}
