import { getSupabaseAdmin } from './supabase';
import { sendOwnerMessage } from './telegram';

// Owner, 5 Nov 2026: a Telegram line when a new version of the site is live,
// so he knows when it is worth opening. One message per production build:
// whichever comes first — /api/deploy-ping (called once the new version
// answers) or the first webhook / visitor request this build serves — records
// the build's commit in app_config and announces it. BUILD_SHA / BUILD_NOTE
// are inlined by next.config.js.

const KEY = 'last_deploy_sha';
const SHA = process.env.BUILD_SHA ?? '';
const NOTE = process.env.BUILD_NOTE ?? '';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function announceDeploy(): Promise<'sent' | 'same' | 'skip'> {
  if (process.env.VERCEL_ENV !== 'production' || !SHA) return 'skip';
  const sb = getSupabaseAdmin();
  if (!sb) return 'skip';
  // Claim the build before telling anyone, so two cold starts at once cannot
  // both announce it: only the request whose write changes the row sends.
  const upd = await sb.from('app_config').update({ value: SHA }).eq('key', KEY).neq('value', SHA).select('key');
  if (upd.error) return 'skip';
  if (!upd.data?.length) {
    const ins = await sb.from('app_config').insert({ key: KEY, value: SHA });
    if (ins.error) return 'same'; // the row exists and already holds this build
  }
  await sendOwnerMessage(
    `🚀 <b>Site updated</b> — the new version is live${NOTE ? `: <i>${esc(NOTE)}</i>` : '.'}\n` +
      `https://www.bmwcoding.ie\n` +
      `<i>Still looks old? Close the page and open it again.</i>`,
  );
  return 'sent';
}

let checked = false;

/** announceDeploy once per server instance, never throwing — for the hot paths. */
export async function announceDeployOnce(): Promise<void> {
  if (checked) return;
  checked = true;
  await announceDeploy().catch(() => undefined);
}
