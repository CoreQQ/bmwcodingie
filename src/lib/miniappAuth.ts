import { createHmac, timingSafeEqual } from 'crypto';

export type MiniAppAuthResult =
  | { ok: true; userId: number }
  | { ok: false; reason: 'no_data' | 'bad_hash' | 'stale' | 'not_owner'; userId?: number };

// Validates Telegram Mini App initData per the official spec:
// secret_key = HMAC_SHA256(key="WebAppData", msg=bot_token)
// hash       = hex(HMAC_SHA256(key=secret_key, msg=data_check_string))
// The owner is TG_OWNER_ID if set (personal user id), otherwise TG_CHAT_ID —
// they differ when notifications go to a group/channel.
export function validateMiniAppAuth(initData: string): MiniAppAuthResult {
  const token = process.env.TG_TOKEN;
  const owner = process.env.TG_OWNER_ID || process.env.TG_CHAT_ID;
  if (!token || !owner || !initData) return { ok: false, reason: 'no_data' };

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return { ok: false, reason: 'no_data' };
  params.delete('hash');

  const checkString = [...params.entries()]
    .map(([k, v]) => `${k}=${v}`)
    .sort()
    .join('\n');

  const secret = createHmac('sha256', 'WebAppData').update(token).digest();
  const computed = createHmac('sha256', secret).update(checkString).digest('hex');
  try {
    if (!timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'))) {
      return { ok: false, reason: 'bad_hash' };
    }
  } catch {
    return { ok: false, reason: 'bad_hash' };
  }

  // Reject stale auth payloads (protects against replay of a leaked link).
  const authDate = Number(params.get('auth_date') || 0);
  if (!authDate || Date.now() / 1000 - authDate > 24 * 60 * 60) {
    return { ok: false, reason: 'stale' };
  }

  let userId: number | undefined;
  try {
    userId = (JSON.parse(params.get('user') || '{}') as { id?: number }).id;
  } catch {
    /* fallthrough */
  }
  if (!userId || String(userId) !== String(owner)) {
    return { ok: false, reason: 'not_owner', userId };
  }
  return { ok: true, userId };
}
