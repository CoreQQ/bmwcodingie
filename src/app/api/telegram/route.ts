import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { answerCallback, editBookingMessage, type Lead } from '@/lib/telegram';
import type { Booking } from '@/lib/types';

export const runtime = 'nodejs';

const WEBHOOK_SECRET = process.env.TG_WEBHOOK_SECRET;

// Telegram needs a 200 even when we ignore an update, otherwise it retries.
const ok = () => NextResponse.json({ ok: true });

export async function GET() {
  // Lets you eyeball that the route is deployed; the real work is on POST.
  return NextResponse.json({ ok: true, hint: 'Telegram webhook endpoint — POST only.' });
}

export async function POST(req: Request) {
  // When a secret is configured, only accept calls carrying it (set via setWebhook).
  if (WEBHOOK_SECRET) {
    const got = req.headers.get('x-telegram-bot-api-secret-token');
    if (got !== WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: {
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

  const cq = update.callback_query;
  if (!cq || !cq.data || !cq.message) return ok();

  // Expected: "bk:confirm:<id>" | "bk:decline:<id>"
  const m = /^bk:(confirm|decline):(\d+)$/.exec(cq.data);
  if (!m) {
    await answerCallback(cq.id);
    return ok();
  }
  const action = m[1] as 'confirm' | 'decline';
  const id = Number(m[2]);
  const status = action === 'confirm' ? 'confirmed' : 'declined';

  const sb = getSupabaseAdmin();
  if (!sb) {
    await answerCallback(cq.id, 'Database not configured.');
    return ok();
  }

  // Load the booking so the edited message can re-show its details + reply text.
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
    slot_date: booking.slot_date,
    slot_time: booking.slot_time,
  };

  await editBookingMessage(cq.message.chat.id, cq.message.message_id, lead, status);
  await answerCallback(cq.id, status === 'confirmed' ? 'Marked as confirmed ✅' : 'Marked as declined ❌');
  return ok();
}
