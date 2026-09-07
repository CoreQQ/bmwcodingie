// Outbound WhatsApp messages through ManyChat. Optional: without an API key
// the caller falls back to handing the owner a ready-to-send message.

const API = 'https://api.manychat.com';

export function isManyChatSendConfigured(): boolean {
  return Boolean(process.env.MANYCHAT_API_KEY);
}

export type SendResult = { ok: boolean; error?: string };

/** Raw call. Returns the parsed body and, on failure, why it failed — a
 *  silent `false` here is impossible to act on from a phone. */
async function mc<T>(path: string, init: RequestInit): Promise<{ data: T | null; error: string }> {
  const key = process.env.MANYCHAT_API_KEY;
  if (!key) return { data: null, error: 'MANYCHAT_API_KEY is not set' };
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    const body = await res.text();
    if (!res.ok) return { data: null, error: `${res.status} ${body.slice(0, 200)}` };
    try {
      return { data: JSON.parse(body) as T, error: '' };
    } catch {
      return { data: null, error: `unreadable response: ${body.slice(0, 120)}` };
    }
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Find the ManyChat subscriber id for a phone number (digits only).
 *
 * Contacts that arrived over WhatsApp often have an empty Phone field and only
 * a WhatsApp ID, so looking up one system field is not enough — try each shape
 * ManyChat might have stored, and report what it said when none match.
 */
async function findSubscriber(phone: string): Promise<{ id: string; error: string }> {
  // findBySystemField accepts only `phone` or `email`, so a WhatsApp contact
  // with an empty Phone field simply cannot be found this way — try both
  // number shapes, then say plainly that the id is what is missing.
  const attempts = [`phone=%2B${phone}`, `phone=${phone}`];
  let lastError =
    'ManyChat has no contact with this phone number (WhatsApp contacts often have an empty Phone field). ' +
    'Ask them to send one message first — we store their ManyChat id and reply straight to it.';
  for (const query of attempts) {
    const { data, error } = await mc<{ data?: { id?: string | number }[] | { id?: string | number } }>(
      `/fb/subscriber/findBySystemField?${query}`,
      { method: 'GET' },
    );
    if (error) {
      lastError = error;
      continue;
    }
    const d = data?.data;
    const first = Array.isArray(d) ? d[0] : d;
    if (first?.id) return { id: String(first.id), error: '' };
  }
  return { id: '', error: lastError };
}

/**
 * Send a plain WhatsApp message to a customer. Never throws; on failure it
 * returns the reason so the owner is told what to fix.
 *
 * `subscriberId` is the id ManyChat sent us with the inbound message — when we
 * have it stored, no lookup is needed at all.
 */
export async function sendManyChatText(
  phone: string,
  text: string,
  subscriberId?: string,
): Promise<SendResult> {
  if (!isManyChatSendConfigured()) return { ok: false, error: 'MANYCHAT_API_KEY is not set' };
  let id = subscriberId?.trim() ?? '';
  if (!id) {
    const found = await findSubscriber(phone);
    if (!found.id) return { ok: false, error: found.error };
    id = found.id;
  }
  // ManyChat dropped message tags, and routes WhatsApp through its own path on
  // some accounts — try the shapes it accepts and keep every refusal, so a
  // failure names what was actually wrong instead of the last thing tried.
  const payload = JSON.stringify({
    subscriber_id: id,
    data: { version: 'v2', content: { messages: [{ type: 'text', text }] } },
  });
  const endpoints = ['/fb/sending/sendContent', '/whatsapp/sending/sendContent'];
  const refusals: string[] = [];
  for (const endpoint of endpoints) {
    const { data, error } = await mc<{ status?: string }>(endpoint, { method: 'POST', body: payload });
    if (data?.status === 'success') return { ok: true };
    refusals.push(`${endpoint}: ${error || JSON.stringify(data).slice(0, 160)}`);
  }
  return { ok: false, error: refusals.join('\n') };
}
