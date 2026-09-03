import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOwnerMessage, sendOwnerWithMarkup } from '@/lib/telegram';
import { REVIEW_TEMPLATES, hasReviewUrl } from '@/lib/reviewTemplates';
import type { Booking } from '@/lib/types';
import { sendManyChatText, isManyChatSendConfigured } from '@/lib/manychatSend';

// Uses the shared "short & friendly" template so /review and the daily nudge
// stay consistent.
function reviewAsk(name: string, service: string): string {
  return REVIEW_TEMPLATES[0].build(name, service);
}

export const runtime = 'nodejs';

// IndexNow: tell Bing-family crawlers (which also feed ChatGPT, Copilot and
// DuckDuckGo) that our key pages changed. Free, no auth beyond the key file.
const INDEXNOW_KEY = 'f8a4c1d9e2b7465a9c3d1e8f7b2a6054';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

async function pingIndexNow(): Promise<void> {
  try {
    const { BLOG_POSTS } = await import('@/lib/blog');
    const urls = [
      `${SITE}/`,
      `${SITE}/bmw-coding-ireland`,
      `${SITE}/blog`,
      ...BLOG_POSTS.map((p) => `${SITE}/blog/${p.slug}`),
    ];
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        host: new URL(SITE).host,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
  } catch {
    // best-effort — never fail the cron over it
  }
}

// Daily agenda reminder (Vercel cron, 07:00 UTC — see vercel.json). Sends the
// owner today's and tomorrow's slot bookings; stays silent when both are empty.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, skipped: 'no-db' });

  const dayKey = (offset: number) => {
    const d = new Date(Date.now() + offset * 86400000);
    return d.toISOString().slice(0, 10);
  };
  const today = dayKey(0);
  const tomorrow = dayKey(1);

  const { data } = await sb
    .from('bookings')
    .select('*')
    .in('slot_date', [today, tomorrow])
    .in('status', ['pending', 'confirmed'])
    .order('slot_time', { ascending: true });
  const rows = (data ?? []) as Booking[];

  // Stale requests: pending for over 24h — easy to lose, costly to ignore.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: staleData } = await sb
    .from('bookings')
    .select('id, name, service, slot_date, slot_time, created_at')
    .eq('status', 'pending')
    .lt('created_at', dayAgo)
    .order('created_at', { ascending: true })
    .limit(10);
  const stale = (staleData ?? []) as Booking[];

  const icon = (s: string) => (s === 'confirmed' ? '✅' : '⏳');
  const fmt = (list: Booking[]) =>
    list.map((b) => `  ${icon(b.status)} ${b.slot_time} — ${b.name}${b.service ? ` · ${b.service}` : ''}`);

  const todays = rows.filter((b) => b.slot_date === today);
  const tomorrows = rows.filter((b) => b.slot_date === tomorrow);

  if (rows.length || stale.length) {
    const lines = ['⏰ <b>Daily agenda</b>', '━━━━━━━━━━━━━━━━━━━'];
    lines.push(`<b>Today</b> (${today}):`);
    lines.push(...(todays.length ? fmt(todays) : ['  —']));
    lines.push('', `<b>Tomorrow</b> (${tomorrow}):`);
    lines.push(...(tomorrows.length ? fmt(tomorrows) : ['  —']));
    if (stale.length) {
      lines.push('', `⚠️ <b>Waiting for your reply over 24h:</b>`);
      for (const b of stale) {
        const slot = b.slot_date ? ` · ${b.slot_date} ${b.slot_time ?? ''}`.trimEnd() : '';
        lines.push(`  ⏳ ${b.name}${b.service ? ` — ${b.service}` : ''}${slot}`);
      }
      lines.push('  Slot requests: /bookings · No-slot enquiries: buttons below');
    }
    // Dismiss buttons work for ANY stale booking — including no-slot enquiries
    // that /bookings (upcoming slots only) never shows.
    const keyboard = stale.length
      ? {
          inline_keyboard: stale.slice(0, 10).map((b) => [
            { text: `✖️ Dismiss ${b.name.slice(0, 24)}`, callback_data: `bkfree:${b.id}` },
          ]),
        }
      : undefined;
    await sendOwnerWithMarkup(lines.join('\n'), keyboard);
  }


  // ── Appointment reminders ─────────────────────────────────────────
  // Sent the morning before, so the customer always gets 12+ hours' notice and
  // nobody is messaged between 20:00 and 08:00 Dublin time.
  const dublinHour = Number(
    new Date().toLocaleString('en-GB', { timeZone: 'Europe/Dublin', hour: '2-digit', hour12: false }),
  );
  const quietHours = dublinHour < 8 || dublinHour >= 20;

  if (!quietHours) {
    const { data: soon } = await sb
      .from('bookings')
      .select('id, name, contact, service, slot_date, slot_time, reminded_at')
      .eq('slot_date', tomorrow)
      .eq('status', 'confirmed');
    const due = ((soon ?? []) as (Booking & { reminded_at?: string | null })[]).filter(
      (b) => !b.reminded_at && b.contact,
    );

    const unsent: (Booking & { reminded_at?: string | null })[] = [];
    for (const b of due) {
      const first = (b.name || '').split(/\s+/)[0] || 'there';
      const msg =
        `Hi ${first} 👋 Reminder: your BMW is booked in tomorrow, ${b.slot_date} at ${b.slot_time}` +
        `${b.service ? ` for ${b.service}` : ''}.\n\n` +
        `We're at Grants View, Greenogue Business Park, Rathcoole — don't follow the sat-nav pin, ` +
        `use ${SITE}/find-us (look for the big ORANGE GATES, drive through and keep RIGHT to the end).\n\n` +
        `If anything changed, just reply here and we'll sort it.`;

      const phone = b.contact.replace(/\D/g, '');
      const sent = phone ? await sendManyChatText(phone, msg) : false;
      if (sent) {
        await sb.from('bookings').update({ reminded_at: new Date().toISOString() }).eq('id', b.id);
      } else {
        unsent.push(b);
      }
    }

    if (unsent.length) {
      // No ManyChat key (or the send failed): hand the owner a ready message
      // to tap, copy and paste — the reminder still happens.
      await sendOwnerWithMarkup(
        `🔔 <b>Remind tomorrow's customers</b>${
          isManyChatSendConfigured() ? ' (auto-send failed — do it by hand)' : ''
        }\n${unsent
          .map((b) => `  • ${b.name} · ${b.slot_time}${b.service ? ` · ${b.service}` : ''}`)
          .join('\n')}`,
        {
          inline_keyboard: unsent.slice(0, 6).map((b) => [
            {
              text: `📋 Reminder for ${(b.name || '').split(/\s+/)[0]}`,
              copy_text: {
                text:
                  `Hi ${(b.name || '').split(/\s+/)[0] || 'there'} 👋 Reminder: your BMW is booked in tomorrow, ` +
                  `${b.slot_date} at ${b.slot_time}${b.service ? ` for ${b.service}` : ''}. ` +
                  `We're at Grants View, Greenogue Business Park, Rathcoole — don't follow the sat-nav pin, use ` +
                  `${SITE}/find-us (big ORANGE GATES, drive through, keep RIGHT to the end). ` +
                  `If anything changed, just reply here.`,
              },
            },
          ]),
        },
      );
    }
  }

  // Review nudge: yesterday's confirmed jobs, one copy-button per client.
  if (hasReviewUrl()) {
    const yesterday = dayKey(-1);
    const { data: done } = await sb
      .from('bookings')
      .select('name, service')
      .eq('slot_date', yesterday)
      .eq('status', 'confirmed');
    const jobs = (done ?? []) as { name: string; service: string }[];
    if (jobs.length) {
      await sendOwnerWithMarkup(
        '⭐ <b>Yesterday\'s jobs</b> — tap to copy a review request, paste it to the client:',
        {
          inline_keyboard: jobs.slice(0, 6).map((j) => [
            { text: `📋 Ask ${j.name.split(' ')[0]} for a review`, copy_text: { text: reviewAsk(j.name, j.service) } },
          ]),
        },
      );
    }
  }

  await pingIndexNow();

  return NextResponse.json({ ok: true, sent: true });
}
