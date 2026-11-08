import { getSupabaseAdmin } from './supabase';
import { sendOwnerMessage } from './telegram';

// Owner, 5 Nov 2026: a Telegram line when a new version of the site is live,
// so he knows when it is worth opening. One message per production build:
// whichever comes first — /api/deploy-ping (called once the new version
// answers) or the first webhook / visitor request this build serves — records
// the build in app_config and announces it. BUILD_SHA / BUILD_NOTE /
// BUILD_TIME are inlined by next.config.js.
//
// The stored value is "<build time>:<commit>", and a build only claims it when
// it is NEWER than what is stored. On 8 Nov the old and the new build both
// answered for a while; each saw the other's commit, overwrote it and
// announced itself again — a "Site updated" every few seconds. An older build
// can now never write, so it never announces.

const KEY = 'last_deploy';
const SHA = process.env.BUILD_SHA ?? '';
const NOTE = process.env.BUILD_NOTE ?? '';
const STAMP = `${process.env.BUILD_TIME ?? ''}:${SHA}`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function announceDeploy(): Promise<'sent' | 'same' | 'skip'> {
  if (process.env.VERCEL_ENV !== 'production' || !SHA || !process.env.BUILD_TIME) return 'skip';
  const sb = getSupabaseAdmin();
  if (!sb) return 'skip';
  // Claim the build before telling anyone: only the request whose write
  // moves the row forward sends — not a second cold start of this build,
  // and never an older build.
  const upd = await sb.from('app_config').update({ value: STAMP }).eq('key', KEY).lt('value', STAMP).select('key');
  if (upd.error) return 'skip';
  if (!upd.data?.length) {
    const ins = await sb.from('app_config').insert({ key: KEY, value: STAMP });
    if (ins.error) return 'same'; // already announced, or a newer build is live
  }
  await sendOwnerMessage(
    `🚀 <b>Site updated</b> — the new version is live${NOTE ? `: <i>${esc(NOTE)}</i>` : '.'}\n` +
      `https://www.bmwcoding.ie\n` +
      `<i>Still looks old? Close the page and open it again.</i>`,
    undefined,
    'site',
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
