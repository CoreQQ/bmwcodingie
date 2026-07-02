import { createHmac, timingSafeEqual } from 'crypto';

// Validates Telegram Mini App initData per the official spec:
// secret_key = HMAC_SHA256(key="WebAppData", msg=bot_token)
// hash       = hex(HMAC_SHA256(key=secret_key, msg=data_check_string))
// Then confirms the user is the configured owner chat.
export function validateMiniAppAuth(initData: string): boolean {
  const token = process.env.TG_TOKEN;
  const owner = process.env.TG_CHAT_ID;
  if (!token || !owner || !initData) return false;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;
  params.delete('hash');

  const checkString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  const computed = createHmac('sha256', secret).update(checkString).digest('hex');
  try {
    if (!timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'))) return false;
  } catch {
    return false;
  }

  // Reject stale auth payloads (protects against replay of a leaked link).
  const authDate = Number(params.get('auth_date') || 0);
  if (!authDate || Date.now() / 1000 - authDate > 24 * 60 * 60) return false;

  try {
    const user = JSON.parse(params.get('user') || '{}') as { id?: number };
    return String(user.id) === String(owner);
  } catch {
    return false;
  }
}
