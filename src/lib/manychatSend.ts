// Outbound WhatsApp messages through ManyChat. Optional: without an API key
// the caller falls back to handing the owner a ready-to-send message.

const API = 'https://api.manychat.com';

export function isManyChatSendConfigured(): boolean {
  return Boolean(process.env.MANYCHAT_API_KEY);
}

async function mc<T>(path: string, init: RequestInit): Promise<T | null> {
  const key = process.env.MANYCHAT_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Find the ManyChat subscriber id for a phone number (digits only). */
async function findSubscriber(phone: string): Promise<string | null> {
  const data = await mc<{ data?: { id?: string | number }[] | { id?: string | number } }>(
    `/fb/subscriber/findBySystemField?phone=%2B${encodeURIComponent(phone)}`,
    { method: 'GET' },
  );
  const d = data?.data;
  const first = Array.isArray(d) ? d[0] : d;
  return first?.id ? String(first.id) : null;
}

/**
 * Send a plain WhatsApp message to a customer. Returns false when ManyChat is
 * not configured or the send failed — never throws.
 */
export async function sendManyChatText(phone: string, text: string): Promise<boolean> {
  if (!isManyChatSendConfigured()) return false;
  const subscriberId = await findSubscriber(phone);
  if (!subscriberId) return false;
  const sent = await mc<{ status?: string }>('/fb/sending/sendContent', {
    method: 'POST',
    body: JSON.stringify({
      subscriber_id: subscriberId,
      data: { version: 'v2', content: { messages: [{ type: 'text', text }] } },
      message_tag: 'ACCOUNT_UPDATE',
    }),
  });
  return sent?.status === 'success';
}
