import { NextResponse } from 'next/server';
import { decideWaReply, renderContext, type WaContext, type WaTurn } from '@/lib/waAgent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Dry run of the WhatsApp assistant on made-up conversations (diagnostics
// key). Asks the model exactly as the live flow does, but reads no database,
// sends nothing to WhatsApp or Telegram and saves nothing.

type Case = {
  name: string;
  profileName?: string;
  pastJobs?: string;
  /** Earlier conversation: m = minutes ago. */
  turns?: { m: number; who: 'c' | 'ai' | 'alex'; text: string }[];
  /** The new message(s) being answered. */
  fresh: string[];
  /** A photo sent with the newest message (base64). */
  image?: { media_type: 'image/jpeg' | 'image/png' | 'image/webp'; data: string };
};

export async function POST(req: Request) {
  const key = new URL(req.url).searchParams.get('key') || '';
  const allowed = [process.env.WHATSAPP_VERIFY_TOKEN, process.env.MANYCHAT_SECRET].filter(Boolean);
  if (!key || !allowed.includes(key)) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { cases?: Case[]; show?: boolean } | null;
  const cases = (body?.cases ?? []).slice(0, 8);
  const now = new Date();
  const at = (m: number) => new Date(now.getTime() - m * 60000).toISOString();
  const who = { c: 'customer', ai: 'assistant', alex: 'alex' } as const;

  const results = await Promise.all(
    cases.map(async (c) => {
      const ctx: WaContext = {
        turns: (c.turns ?? []).map((t): WaTurn => ({ at: at(t.m), who: who[t.who], text: t.text })),
        fresh: c.fresh.map((text) => ({ at: now.toISOString(), text })),
        profileName: c.profileName,
        pastJobs: c.pastJobs,
        image: c.image,
        now,
      };
      const t0 = Date.now();
      try {
        const d = await decideWaReply(ctx);
        return { name: c.name, ms: Date.now() - t0, ...d, ...(body?.show ? { input: renderContext(ctx) } : {}) };
      } catch (e) {
        return { name: c.name, ms: Date.now() - t0, error: e instanceof Error ? e.message : String(e) };
      }
    }),
  );
  return NextResponse.json({ ok: true, results });
}
