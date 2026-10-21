import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendOwnerMessage, sendOwnerWithMarkup } from '@/lib/telegram';
import { REVIEW_TEMPLATES, hasReviewUrl } from '@/lib/reviewTemplates';
import type { Booking } from '@/lib/types';
import { buildAgenda } from '@/lib/agenda';
import { sendWhatsAppText, sendWhatsAppTemplate, isWhatsAppConfigured } from '@/lib/whatsapp';
import { phoneKey } from '@/lib/crm';
import { normalizePhone } from '@/lib/phone';

// Utility template on the WhatsApp account (submitted 21 Oct 2026, id
// 2125231011455361): "Hi {{1}}, a reminder that your BMW is booked in for
// {{2}} at {{3}}. {{4}} If anything has changed, just reply here."
const REMINDER_TEMPLATE = 'appointment_reminder';

// Uses the shared "short & friendly" template so /review and the daily nudge
// stay consistent.
function reviewAsk(name: string, service: string): string {
  return REVIEW_TEMPLATES[0].build(name, service);
}

/**
 * Where tomorrow happens, in the customer's words. The service is mobile-only
 * since 20 Sep 2026: this used to send everyone to the old Greenogue unit
 * ("look for the orange gates") — a customer following it would have driven
 * to an empty yard.
 */
function whereLine(visitType?: string | null, visitAddress?: string | null): string {
  if (visitType === 'mobile') {
    return visitAddress ? `Alex will come to you at ${visitAddress}.` : 'Alex will come to you — reply with the address if you have not sent it yet.';
  }
  if (visitType === 'meet') return 'Alex will message you the meeting spot today.';
  return 'Alex will confirm where to meet (or how to connect for remote coding) here on WhatsApp.';
}

export const runtime = 'nodejs';
// Never prerender: without CRON_SECRET the handler reads nothing from the
// request, so Next built it as a static page — it ran once per deploy (the
// "duplicate agenda" messages) and the real 08:00 call got the cached copy.
export const dynamic = 'force-dynamic';

// IndexNow: tell Bing-family crawlers (which also feed ChatGPT, Copilot and
// DuckDuckGo) that our key pages changed. Free, no auth beyond the key file.
const INDEXNOW_KEY = 'f8a4c1d9e2b7465a9c3d1e8f7b2a6054';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

async function pingIndexNow(): Promise<void> {
  try {
    const [{ BLOG_POSTS }, { ALL_SERVICE_SLUGS }, { DYNAMIC_LANDING_SLUGS }] = await Promise.all([
      import('@/lib/blog'),
      import('@/lib/servicePages'),
      import('@/lib/landings'),
    ]);
    // Every canonical page, not just the home page and blog: the service and
    // model pages are the ones that bring enquiries.
    const urls = [
      `${SITE}/`,
      `${SITE}/bmw-coding-ireland`,
      `${SITE}/blog`,
      ...ALL_SERVICE_SLUGS.map((s) => `${SITE}/${s}`),
      ...DYNAMIC_LANDING_SLUGS.map((s) => `${SITE}/${s}`),
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

// Morning run (Vercel cron, 08:00 UTC = 09:00 Irish summer time, 08:00 winter —
// see vercel.json): the agenda, tomorrow's customer reminders, review nudges.
export async function GET(req: Request) {
  // Vercel's cron sends "Bearer CRON_SECRET"; without the secret set, at
  // least insist on its user agent so a stranger cannot fire the run.
  const secret = process.env.CRON_SECRET;
  const fromCron = secret
    ? req.headers.get('authorization') === `Bearer ${secret}`
    : /vercel-cron/i.test(req.headers.get('user-agent') || '');
  if (!fromCron) return NextResponse.json({ ok: false }, { status: 401 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: true, skipped: 'no-db' });

  const dayKey = (offset: number) =>
    new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  const tomorrow = dayKey(1);

  // The morning view lives in lib/agenda so the bot can rebuild the same
  // screen when the owner navigates back out of an enquiry.
  const agenda = await buildAgenda(sb);
  if (!agenda.empty) await sendOwnerWithMarkup(agenda.text, agenda.keyboard);

  // ── Appointment reminders ─────────────────────────────────────────
  // Sent the morning before, so the customer always gets 12+ hours' notice and
  // nobody is messaged between 20:00 and 08:00 Dublin time.
  const dublinHour = Number(
    new Date().toLocaleString('en-GB', { timeZone: 'Europe/Dublin', hour: '2-digit', hour12: false }),
  );
  const quietHours = dublinHour < 8 || dublinHour >= 20;

  if (!quietHours) {
    // visit_type / visit_address are newer columns: fall back if the
    // migration has not run, rather than skip everyone's reminder.
    const withVisit = await sb
      .from('bookings')
      .select('id, name, contact, service, slot_date, slot_time, reminded_at, visit_type, visit_address')
      .eq('slot_date', tomorrow)
      .eq('status', 'confirmed');
    const { data: soon } = withVisit.error
      ? await sb
          .from('bookings')
          .select('id, name, contact, service, slot_date, slot_time, reminded_at')
          .eq('slot_date', tomorrow)
          .eq('status', 'confirmed')
      : withVisit;
    type Due = Booking & { reminded_at?: string | null; visit_type?: string | null; visit_address?: string | null };
    const due = ((soon ?? []) as Due[]).filter(
      (b) => !b.reminded_at && b.contact,
    );

    // Customers who wrote to us on WhatsApp in the last 24h, by phone key.
    const recentWa = new Map<string, string>();
    if (due.length && isWhatsAppConfigured()) {
      const { data: recent } = await sb
        .from('wa_messages')
        .select('wa_id')
        .eq('role', 'user')
        .gt('created_at', new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString())
        .limit(2000);
      for (const r of (recent ?? []) as { wa_id: string }[]) recentWa.set(phoneKey(r.wa_id), r.wa_id);
    }

    const unsent: Due[] = [];
    for (const b of due) {
      const first = (b.name || '').split(/\s+/)[0] || 'there';
      const msg =
        `Hi ${first} 👋 Reminder: your BMW is booked in tomorrow, ${b.slot_date} at ${b.slot_time}` +
        `${b.service ? ` for ${b.service}` : ''}.\n\n` +
        `${whereLine(b.visit_type, b.visit_address)}\n\n` +
        `If anything changed, just reply here and we'll sort it.`;

      // WhatsApp only lets a business write freely within 24h of the
      // customer's last message. Everyone else gets the approved
      // appointment_reminder template; if that fails too (not approved yet,
      // no payment method on the account) Alex gets a ready-to-paste text.
      const waId = recentWa.get(phoneKey(b.contact));
      let sent = false;
      let sentTo = '';
      let content = msg;
      if (waId) {
        sent = (await sendWhatsAppText(waId, msg)).ok;
        sentTo = waId;
      } else if (isWhatsAppConfigured()) {
        const to = normalizePhone(b.contact)?.slice(1) ?? '';
        if (to) {
          const day = new Date(`${b.slot_date}T12:00:00Z`).toLocaleDateString('en-IE', {
            timeZone: 'Europe/Dublin',
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          });
          const params = [first, `tomorrow, ${day}`, b.slot_time || 'the agreed time', whereLine(b.visit_type, b.visit_address)];
          sent = (await sendWhatsAppTemplate(to, REMINDER_TEMPLATE, 'en', params)).ok;
          sentTo = to;
          content = `Hi ${params[0]}, a reminder that your BMW is booked in for ${params[1]} at ${params[2]}. ${params[3]} If anything has changed, just reply here.`;
        }
      }
      if (sent && sentTo) {
        await sb.from('wa_messages').insert({ msg_id: `reminder:${b.id}`, wa_id: sentTo, role: 'assistant', content, via: 'ai' }).then(() => undefined, () => undefined);
      }
      if (sent) {
        await sb.from('bookings').update({ reminded_at: new Date().toISOString() }).eq('id', b.id);
      } else {
        unsent.push(b);
      }
    }

    if (unsent.length) {
      // Not sendable from here (no recent WhatsApp chat, or the send failed):
      // hand the owner a ready message to tap, copy and paste.
      await sendOwnerWithMarkup(
        `🔔 <b>Remind tomorrow's customers</b> — tap to copy, send from your phone:\n${unsent
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
                  `${whereLine(b.visit_type, b.visit_address)} If anything changed, just reply here.`,
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
