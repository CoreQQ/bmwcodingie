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
import type { Booking } from '@/lib/types';

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
    .select('id, name, contact, slot_date, slot_time, status')
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
  };
  await editBookingMessage(chatId, messageId, lead, status);
  await answerCallback(cq.id, status === 'confirmed' ? 'Marked as confirmed ✅' : 'Marked as declined ❌');
  return ok();
}
