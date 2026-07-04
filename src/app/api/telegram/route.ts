import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase';
import {
  answerCallback,
  buildBookingsDay,
  buildBookingsMenu,
  editBookingMessage,
  editMessage,
  isOwner,
  registerBotCommands,
  sendOwnerMessage,
  type BookingRow,
  type Lead,
} from '@/lib/telegram';
import {
  cancelInvoice,
  startInvoice,
  tryHandleInvoiceCallback,
  tryHandleInvoiceText,
} from '@/lib/invoiceFlow';
import { getBusinessStats } from '@/lib/stats';
import { calendarToken } from '@/lib/calendar';
import { REVIEW_TEMPLATES, hasReviewUrl } from '@/lib/reviewTemplates';
import { sendWhatsAppText, normalizeWaNumber, isWhatsAppConfigured } from '@/lib/whatsapp';
import { findClients, formatClient } from '@/lib/crm';
import { CANNED_REPLIES, getReply } from '@/lib/replies';
import type { Booking } from '@/lib/types';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const runtime = 'nodejs';

const WEBHOOK_SECRET = process.env.TG_WEBHOOK_SECRET;

// Telegram needs a 200 even when we ignore an update, otherwise it retries.
const ok = () => NextResponse.json({ ok: true });

export async function GET() {
  return NextResponse.json({ ok: true, hint: 'Telegram webhook endpoint — POST only.' });
}

/** Upcoming (today onward) bookings that still matter — pending or confirmed. */
async function upcomingBookings(sb: SupabaseClient): Promise<BookingRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await sb
    .from('bookings')
    .select('id, name, contact, slot_date, slot_time, status, bmw_model, service, message')
    .not('slot_date', 'is', null)
    .gte('slot_date', today)
    .in('status', ['pending', 'confirmed']);
  return (data ?? []) as BookingRow[];
}

export async function POST(req: Request) {
  if (WEBHOOK_SECRET) {
    const got = req.headers.get('x-telegram-bot-api-secret-token');
    if (got !== WEBHOOK_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  }

  let update: {
    message?: { text?: string; chat: { id: number } };
    callback_query?: {
      id: string;
      data?: string;
      message?: { message_id: number; chat: { id: number } };
    };
  };
  try {
    update = await req.json();
  } catch {
    return ok();
  }

  const sb = getSupabaseAdmin();

  // ── Owner messages: commands + invoice wizard input ────────────
  const msg = update.message;
  if (msg?.text) {
    const text = msg.text.trim();
    if (!isOwner(msg.chat.id)) return ok();
    if (!sb) {
      await sendOwnerMessage('Database not configured.');
      return ok();
    }

    if (/^\/invoice(@\w+)?\b/.test(text)) {
      await startInvoice(sb, msg.chat.id);
      return ok();
    }
    if (text === '✖️ Cancel' || /^\/cancel(@\w+)?\b/.test(text)) {
      await cancelInvoice(sb, msg.chat.id);
      return ok();
    }
    if (/^\/bookings(@\w+)?\b/.test(text)) {
      const rows = await upcomingBookings(sb);
      const { text: out, keyboard } = buildBookingsMenu(rows);
      await sendOwnerMessage(out, keyboard);
      return ok();
    }
    if (/^\/calendar(@\w+)?\b/.test(text)) {
      const url = `${SITE_URL}/api/calendar/${calendarToken()}.ics`;
      const webcal = url.replace(/^https:/, 'webcal:');
      await sendOwnerMessage(
        [
          '📆 <b>Your bookings calendar</b>',
          '━━━━━━━━━━━━━━━━━━━',
          'Subscribe once and confirmed bookings appear in your phone calendar automatically.',
          '',
          `<b>iPhone:</b> tap → <a href="${webcal}">${webcal}</a>`,
          `<b>Any calendar app:</b> add subscription → <code>${url}</code>`,
          '',
          '⚠️ This link is private — anyone with it can see your bookings.',
        ].join('\n'),
      );
      return ok();
    }
    if (/^\/wa(@\w+)?\b/.test(text)) {
      // "/wa +353871234567 your reply" — manual WhatsApp reply from Telegram.
      if (!isWhatsAppConfigured()) {
        await sendOwnerMessage('⚠️ WhatsApp is not connected yet (set WHATSAPP_TOKEN / WHATSAPP_PHONE_ID).');
        return ok();
      }
      const rest = text.replace(/^\/wa(@\w+)?\s*/, '');
      const m = rest.match(/^(\+?[\d\s()-]{7,})\s+([\s\S]+)$/);
      if (!m) {
        await sendOwnerMessage('Usage: <code>/wa +353871234567 your message</code>');
        return ok();
      }
      const to = normalizeWaNumber(m[1]);
      const body = m[2].trim();
      const sent = await sendWhatsAppText(to, body);
      if (sent.ok) {
        await sb.from('wa_messages').insert({
          msg_id: sent.id || `owner:${Date.now()}`,
          wa_id: to,
          role: 'assistant',
          content: body,
          via: 'owner',
        });
        await sendOwnerMessage(`✅ Sent to <code>+${to}</code>`);
      } else {
        await sendOwnerMessage(`❌ Failed: ${sent.error || 'unknown error'}`);
      }
      return ok();
    }
    if (/^\/setup(@\w+)?\b/.test(text) || /^\/start(@\w+)?\b/.test(text)) {
      const done = await registerBotCommands();
      await sendOwnerMessage(
        done
          ? '✅ Меню команд обновлено. Закрой и открой этот чат — рядом с полем ввода появится кнопка ☰ Меню. Также список выпадает, если набрать «/».'
          : '❌ Не удалось обновить меню — попробуй ещё раз через минуту.',
      );
      return ok();
    }
    if (/^\/client(@\w+)?\b/.test(text)) {
      const q = text.replace(/^\/client(@\w+)?\s*/, '').trim();
      if (q.length < 2) {
        await sendOwnerMessage('Usage: <code>/client John</code> or <code>/client 0871234567</code>');
        return ok();
      }
      const matches = await findClients(sb, q);
      if (!matches.length) {
        await sendOwnerMessage(`No clients found for «${escapeHtml(q)}».`);
        return ok();
      }
      const blocks = matches.map((m) => formatClient(m, escapeHtml).join('\n'));
      await sendOwnerMessage(['👥 <b>Client history</b>', '━━━━━━━━━━━━━━━━━━━', blocks.join('\n\n')].join('\n'));
      return ok();
    }
    if (/^\/reply(@\w+)?\b/.test(text)) {
      const key = text.replace(/^\/reply(@\w+)?\s*/, '').trim().toLowerCase();
      const direct = key ? getReply(key) : undefined;
      if (direct) {
        await sendOwnerMessage(`<b>${direct.label}</b>\n<code>${escapeHtml(direct.text)}</code>`);
        return ok();
      }
      const keyboard = {
        inline_keyboard: CANNED_REPLIES.map((r) => [{ text: r.label, callback_data: `rt:${r.key}` }]),
      };
      await sendOwnerMessage('📋 <b>Ready replies</b> — pick one, then tap the text to copy:', keyboard);
      return ok();
    }
    if (/^\/paid(@\w+)?\b/.test(text)) {
      const rest = text.replace(/^\/paid(@\w+)?\s*/, '').trim();
      const m = rest.match(/^(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur)?\s*(\S+)?\s*([\s\S]*)?$/i);
      if (!rest || !m) {
        // No args → show the money summary.
        const { data: pays } = await sb
          .from('payments')
          .select('amount, client, service, created_at')
          .order('created_at', { ascending: false })
          .limit(200);
        const list = (pays ?? []) as { amount: number; client: string | null; service: string | null; created_at: string }[];
        if (!list.length) {
          await sendOwnerMessage('💶 No payments logged yet.\nRecord one: <code>/paid 120 John CarPlay</code>');
          return ok();
        }
        const since = (d: number) => Date.now() - d * 86400000;
        const sum = (ms: number) =>
          list.filter((x) => new Date(x.created_at).getTime() >= ms).reduce((a, x) => a + Number(x.amount || 0), 0);
        const lines = [
          '💶 <b>Money</b>',
          '━━━━━━━━━━━━━━━━━━━',
          `This week: <b>€${sum(since(7)).toFixed(0)}</b> · This month: <b>€${sum(since(30)).toFixed(0)}</b>`,
          '',
          '<b>Recent:</b>',
        ];
        for (const x of list.slice(0, 6)) {
          const d = new Date(x.created_at).toLocaleDateString('en-IE', { day: '2-digit', month: 'short' });
          lines.push(`  €${Number(x.amount).toFixed(0)} — ${escapeHtml([x.client, x.service].filter(Boolean).join(' · ') || '—')} (${d})`);
        }
        lines.push('', 'Add: <code>/paid 120 John CarPlay</code>');
        await sendOwnerMessage(lines.join('\n'));
        return ok();
      }
      const amount = parseFloat(m[1].replace(',', '.'));
      const client = (m[2] || '').trim();
      const service = (m[3] || '').trim();
      const { error } = await sb.from('payments').insert({ amount, client: client || null, service: service || null });
      if (error) {
        await sendOwnerMessage(`❌ Could not save: ${escapeHtml(error.message)}\n(Run the payments migration in Supabase if you haven't.)`);
        return ok();
      }
      await sendOwnerMessage(
        `✅ Logged <b>€${amount.toFixed(0)}</b>${client ? ` — ${escapeHtml(client)}` : ''}${service ? ` · ${escapeHtml(service)}` : ''}\nSee totals: /paid`,
      );
      return ok();
    }
    if (/^\/review(@\w+)?\b/.test(text)) {
      // Optional "/review Name Service" — first token is the name.
      const rest = text.replace(/^\/review(@\w+)?\s*/, '').trim();
      const [name = '', ...svcParts] = rest.split(/\s+/);
      const service = svcParts.join(' ');
      const lines = [
        '⭐ <b>Review request templates</b>',
        '━━━━━━━━━━━━━━━━━━━',
        name
          ? `For <b>${name}</b>${service ? ` · ${service}` : ''} — tap a message to copy it:`
          : 'Tap a message to copy it. Tip: send <code>/review John 530e CarPlay</code> to personalise.',
        '',
      ];
      for (const tpl of REVIEW_TEMPLATES) {
        lines.push(`<b>${tpl.label}</b>`);
        lines.push(`<code>${escapeHtml(tpl.build(name || 'there', service))}</code>`);
        lines.push('');
      }
      if (!hasReviewUrl()) {
        lines.push('⚠️ Set <code>GOOGLE_REVIEW_URL</code> in Vercel so the link is included automatically.');
      }
      await sendOwnerMessage(lines.join('\n'));
      return ok();
    }
    if (/^\/stats(@\w+)?\b/.test(text)) {
      const s = await getBusinessStats(sb);
      const lines = [
        '📊 <b>Business stats</b>',
        '━━━━━━━━━━━━━━━━━━━',
        `📥 Enquiries: <b>${s.last7}</b> this week · <b>${s.last30}</b> this month · ${s.total} all time`,
        `📅 Slots: ✅ ${s.confirmedUpcoming} confirmed upcoming · ⏳ ${s.pending} pending`,
      ];
      if (s.paymentsCount > 0) {
        lines.push(`💶 Revenue: <b>€${s.revenue7.toFixed(0)}</b> this week · <b>€${s.revenue30.toFixed(0)}</b> this month`);
      }
      if (s.topServices.length) {
        lines.push('', '<b>Most requested:</b>');
        for (const t of s.topServices) lines.push(`  ${t.count} × ${t.service}`);
      }
      if (s.nextBookings.length) {
        lines.push('', '<b>Next confirmed:</b>');
        for (const b of s.nextBookings) lines.push(`  ${b.slot_date} ${b.slot_time} — ${b.name}`);
      }
      await sendOwnerMessage(lines.join('\n'));
      return ok();
    }
    // Otherwise, feed it to an active invoice draft (if any).
    if (await tryHandleInvoiceText(sb, msg.chat.id, text)) return ok();
    return ok();
  }

  // ── Inline button callbacks ────────────────────────────────────
  const cq = update.callback_query;
  if (!cq || !cq.data || !cq.message) return ok();
  if (!isOwner(cq.message.chat.id)) {
    await answerCallback(cq.id);
    return ok();
  }
  if (!sb) {
    await answerCallback(cq.id, 'Database not configured.');
    return ok();
  }

  const chatId = cq.message.chat.id;
  const messageId = cq.message.message_id;

  // Canned reply pick → send the text as a tap-to-copy block.
  if (cq.data.startsWith('rt:')) {
    const r = getReply(cq.data.slice(3));
    await answerCallback(cq.id);
    if (r) await sendOwnerMessage(`<b>${r.label}</b>\n<code>${escapeHtml(r.text)}</code>`);
    return ok();
  }

  // WhatsApp AI pause/resume per chat.
  if (cq.data.startsWith('wap:') || cq.data.startsWith('war:')) {
    const waId = cq.data.slice(4);
    const paused = cq.data.startsWith('wap:');
    await sb.from('wa_chats').upsert({ wa_id: waId, paused });
    await answerCallback(cq.id, paused ? 'AI paused for this chat' : 'AI resumed for this chat');
    await sendOwnerMessage(
      paused
        ? `⏸ AI paused for <code>+${waId}</code> — reply with <code>/wa +${waId} your text</code>`
        : `▶️ AI resumed for <code>+${waId}</code>`,
    );
    return ok();
  }

  // Invoice wizard price-choice callbacks.
  if (cq.data.startsWith('inv:')) {
    await tryHandleInvoiceCallback(sb, chatId, messageId, cq.data, (t) => answerCallback(cq.id, t));
    return ok();
  }

  // Back to the date list.
  if (cq.data === 'bklist') {
    const rows = await upcomingBookings(sb);
    const { text, keyboard } = buildBookingsMenu(rows);
    await editMessage(chatId, messageId, text, keyboard);
    await answerCallback(cq.id);
    return ok();
  }

  // Drill into a single date.
  const day = /^bkday:(\d{4}-\d{2}-\d{2})$/.exec(cq.data);
  if (day) {
    const rows = await upcomingBookings(sb);
    const { text, keyboard } = buildBookingsDay(day[1], rows);
    await editMessage(chatId, messageId, text, keyboard);
    await answerCallback(cq.id);
    return ok();
  }

  // Free a slot: marks it cancelled (frees availability) but keeps the
  // customer record. Re-renders the day so the slot drops off the list.
  const free = /^bkfree:(\d+)$/.exec(cq.data);
  if (free) {
    const id = Number(free[1]);
    const { data: row } = await sb.from('bookings').select('slot_date').eq('id', id).single();
    await sb.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    await answerCallback(cq.id, 'Slot freed ✓');
    const date = (row?.slot_date as string | null) ?? null;
    if (date) {
      const rows = await upcomingBookings(sb);
      const { text, keyboard } = buildBookingsDay(date, rows);
      await editMessage(chatId, messageId, text, keyboard);
    }
    return ok();
  }

  // Confirm / decline a specific booking.
  const m = /^bk:(confirm|decline):(\d+)$/.exec(cq.data);
  if (!m) {
    await answerCallback(cq.id);
    return ok();
  }
  const status = m[1] === 'confirm' ? 'confirmed' : 'declined';
  const id = Number(m[2]);

  const { data } = await sb.from('bookings').select('*').eq('id', id).single();
  const booking = data as Booking | null;
  if (!booking) {
    await answerCallback(cq.id, 'Booking not found.');
    return ok();
  }

  await sb.from('bookings').update({ status }).eq('id', id);

  const lead: Lead = {
    name: booking.name,
    contact: booking.contact,
    bmw_model: booking.bmw_model,
    service: booking.service,
    message: booking.message,
    slot_date: booking.slot_date,
    slot_time: booking.slot_time,
    public_token: booking.public_token,
  };
  await editBookingMessage(chatId, messageId, lead, status);
  await answerCallback(cq.id, status === 'confirmed' ? 'Marked as confirmed ✅' : 'Marked as declined ❌');
  return ok();
}
