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
  // ManyChat's sending API talks to Messenger, not WhatsApp: it refuses with
  // "message tags are no longer supported for Facebook Messenger" and reports
  // a last-interaction age from that channel, even seconds after the customer
  // wrote on WhatsApp. The way through is ManyChat's own flow — park the text
  // in a custom field, then run a one-step flow that sends it.
  if (process.env.MANYCHAT_OWNER_FLOW_NS) {
    const field = await mc<{ status?: string }>('/fb/subscriber/setCustomFieldByName', {
      method: 'POST',
      body: JSON.stringify({
        subscriber_id: id,
        field_name: process.env.MANYCHAT_OWNER_FIELD || 'owner_msg',
        field_value: text,
      }),
    });
    if (field.error) return { ok: false, error: `could not store the text: ${field.error}` };
    const run = await mc<{ status?: string }>('/fb/sending/sendFlow', {
      method: 'POST',
      body: JSON.stringify({ subscriber_id: id, flow_ns: process.env.MANYCHAT_OWNER_FLOW_NS }),
    });
    if (run.data?.status === 'success') return { ok: true };
    return { ok: false, error: run.error || `ManyChat replied: ${JSON.stringify(run.data).slice(0, 200)}` };
  }

  const { data, error } = await mc<{ status?: string }>('/fb/sending/sendContent', {
    method: 'POST',
    body: JSON.stringify({
      subscriber_id: id,
      data: { version: 'v2', content: { messages: [{ type: 'text', text }] } },
    }),
  });
  if (data?.status === 'success') return { ok: true };
  // WhatsApp only allows free-form messages for 24 hours after the customer's
  // last one. Outside that window ManyChat refuses with code 3011, and no
  // wording of ours changes that — say so plainly instead of quoting an API.
  const hours = /over (\d+)h ago/.exec(error)?.[1];
  if (/\b3011\b/.test(error) || /Facebook Messenger/i.test(error) || hours) {
    return {
      ok: false,
      error:
        "ManyChat's API only sends to Messenger, not WhatsApp" +
        (hours ? ` (it is quoting a Messenger interaction ${hours}h old)` : '') +
        '. Set MANYCHAT_OWNER_FLOW_NS to a one-step flow that sends owner_msg, and this works.',
    };
  }
  return { ok: false, error: error || `ManyChat replied: ${JSON.stringify(data).slice(0, 200)}` };
}
