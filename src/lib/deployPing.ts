import { getSupabaseAdmin } from './supabase';
import { sendOwnerMessage } from './telegram';

// Owner, 5 Nov 2026: a Telegram line when a new version of the site is live,
// so he knows when it is worth opening. One message per production build:
// whichever comes first — /api/deploy-ping or the first webhook / visitor
// request this build serves — records the build in app_config and announces
// it. BUILD_SHA / BUILD_NOTE / BUILD_TIME are inlined by next.config.js.
//
// This has sent the line more than once twice (8 and 10 Nov), so it is now
// belt and braces:
//  • the stored value is "<build time>:<commit>", read first and compared in
//    code — the same commit, or a newer build, already there means silence;
//  • the claim is a compare-and-swap on the exact value that was read, so
//    two requests at once cannot both win;
//  • a server instance announces at most once in its life, whatever the
//    database says.

const KEY = 'last_deploy';
const SHA = process.env.BUILD_SHA ?? '';
const NOTE = process.env.BUILD_NOTE ?? '';
const TIME = process.env.BUILD_TIME ?? '';
const STAMP = `${TIME}:${SHA}`;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let announcedHere = false;

export type DeployPing = { result: 'sent' | 'same' | 'skip'; why: string };

export async function announceDeploy(): Promise<DeployPing> {
  if (process.env.VERCEL_ENV !== 'production' || !SHA || !TIME) return { result: 'skip', why: 'not a production build' };
  if (announcedHere) return { result: 'same', why: 'this instance already announced' };
  const sb = getSupabaseAdmin();
  if (!sb) return { result: 'skip', why: 'no database' };

  const cur = await sb.from('app_config').select('value').eq('key', KEY).maybeSingle();
  if (cur.error) return { result: 'skip', why: `read failed: ${cur.error.message}` };
  const stored = (cur.data as { value?: string } | null)?.value;
  if (stored !== undefined) {
    const [storedTime, storedSha] = stored.split(':');
    if (storedSha === SHA) return { result: 'same', why: 'this build is already announced' };
    if (Number(storedTime) >= Number(TIME)) return { result: 'same', why: 'a newer build is already announced' };
    // Claim it: only if the row still holds exactly what was read.
    const upd = await sb.from('app_config').update({ value: STAMP }).eq('key', KEY).eq('value', stored).select('key');
    if (upd.error) return { result: 'skip', why: `claim failed: ${upd.error.message}` };
    if (!upd.data?.length) return { result: 'same', why: 'another request claimed it first' };
  } else {
    const ins = await sb.from('app_config').insert({ key: KEY, value: STAMP });
    if (ins.error) return { result: 'same', why: 'another request claimed it first' };
  }

  announcedHere = true;
  await sendOwnerMessage(
    `🚀 <b>Site updated</b> — the new version is live${NOTE ? `: <i>${esc(NOTE)}</i>` : '.'}\n` +
      `https://www.bmwcoding.ie\n` +
      `<i>Still looks old? Close the page and open it again.</i>`,
    undefined,
    'site',
  );
  return { result: 'sent', why: `previous: ${stored ?? 'none'}` };
}

let checked = false;

/** announceDeploy once per server instance, never throwing — for the hot paths. */
export async function announceDeployOnce(): Promise<void> {
  if (checked) return;
  checked = true;
  await announceDeploy().catch(() => undefined);
}
