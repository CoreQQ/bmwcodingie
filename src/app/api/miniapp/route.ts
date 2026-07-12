import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';
import { validateMiniAppAuth } from '@/lib/miniappAuth';
import { getBusinessStats, getSchedule, getBlockedDates, getHours, getSlotDuration } from '@/lib/stats';
import { getCrmClients } from '@/lib/crmData';
import { ensureClient, phoneKey } from '@/lib/crm';
import { REVIEW_URL } from '@/lib/reviewTemplates';

export const runtime = 'nodejs';

// Refresh cached public pages after content edits from the Mini App.
const refreshSite = () => revalidatePath('/', 'layout');

// Backend for the owner's Telegram Mini App. Every call carries initData,
// validated against the bot token and restricted to the owner.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });
  }

  const auth = validateMiniAppAuth(String(body.initData ?? ''));
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: 'unauthorized', reason: auth.reason, userId: auth.userId ?? null },
      { status: 401 },
    );
  }

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: 'no_db' }, { status: 503 });

  const bad = () => NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 });

  switch (String(body.action)) {
    case 'overview': {
      const [schedule, blocked, stats, hours, slotDuration, servicesRes, reviewsRes] = await Promise.all([
        getSchedule(sb, 14),
        getBlockedDates(sb),
        getBusinessStats(sb),
        getHours(sb),
        getSlotDuration(sb),
        sb.from('services').select('id, title, price_label, visible, sort_order').order('sort_order'),
        sb.from('reviews').select('*').order('sort_order'),
      ]);
      return NextResponse.json({
        ok: true,
        schedule,
        blocked,
        stats,
        hours,
        slotDuration,
        services: servicesRes.data ?? [],
        reviews: reviewsRes.data ?? [],
        reviewUrl: REVIEW_URL,
      });
    }

    case 'setStatus': {
      const id = Number(body.id);
      const status = String(body.status);
      if (!id || !['confirmed', 'declined', 'cancelled', 'pending'].includes(status)) return bad();
      await sb.from('bookings').update({ status }).eq('id', id);
      return NextResponse.json({ ok: true });
    }

    case 'reschedule': {
      const id = Number(body.id);
      const slot_date = String(body.slot_date ?? '');
      const slot_time = String(body.slot_time ?? '').slice(0, 40);
      if (!id || !/^\d{4}-\d{2}-\d{2}$/.test(slot_date) || !slot_time) return bad();
      await sb.from('bookings').update({ slot_date, slot_time }).eq('id', id);
      return NextResponse.json({ ok: true });
    }

    case 'toggleBlock': {
      const day = String(body.day ?? '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return bad();
      const { data } = await sb.from('blocked_dates').select('day').eq('day', day).maybeSingle();
      if (data) await sb.from('blocked_dates').delete().eq('day', day);
      else await sb.from('blocked_dates').upsert({ day });
      return NextResponse.json({ ok: true, blocked: !data });
    }

    case 'updateService': {
      const id = Number(body.id);
      if (!id) return bad();
      const patch: Record<string, unknown> = {};
      if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim().slice(0, 160);
      if (typeof body.price_label === 'string') patch.price_label = body.price_label.trim().slice(0, 60);
      if (typeof body.visible === 'boolean') patch.visible = body.visible;
      if (!Object.keys(patch).length) return bad();
      await sb.from('services').update(patch).eq('id', id);
      refreshSite();
      return NextResponse.json({ ok: true });
    }

    case 'addReview': {
      const author = String(body.author ?? '').trim().slice(0, 120);
      const bodyText = String(body.body ?? '').trim().slice(0, 1000);
      if (!author || !bodyText) return bad();
      await sb.from('reviews').insert({
        author,
        body: bodyText,
        car: String(body.car ?? '').trim().slice(0, 120),
        rating: Math.max(1, Math.min(5, Number(body.rating) || 5)),
        visible: true,
        sort_order: 0,
      });
      refreshSite();
      return NextResponse.json({ ok: true });
    }

    case 'updateReview': {
      const id = Number(body.id);
      if (!id) return bad();
      const patch: Record<string, unknown> = {};
      if (typeof body.visible === 'boolean') patch.visible = body.visible;
      if (typeof body.rating === 'number') patch.rating = Math.max(1, Math.min(5, body.rating));
      if (!Object.keys(patch).length) return bad();
      await sb.from('reviews').update(patch).eq('id', id);
      refreshSite();
      return NextResponse.json({ ok: true });
    }

    case 'deleteReview': {
      const id = Number(body.id);
      if (!id) return bad();
      await sb.from('reviews').delete().eq('id', id);
      refreshSite();
      return NextResponse.json({ ok: true });
    }

    case 'clients': {
      const clients = await getCrmClients(sb);
      const q = String(body.q ?? '').trim().toLowerCase();
      const filtered = q
        ? clients.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.contact.replace(/\D/g, '').includes(q.replace(/\D/g, '')) ||
              (c.code && c.code.toLowerCase().includes(q)),
          )
        : clients;
      return NextResponse.json({ ok: true, clients: filtered.slice(0, 100), total: clients.length });
    }

    case 'clientNote': {
      const contact = String(body.contact ?? '');
      const note = String(body.note ?? '').slice(0, 1000);
      const client = await ensureClient(sb, contact);
      if (!client) return bad();
      await sb.from('clients').update({ note: note || null }).eq('id', client.id);
      return NextResponse.json({ ok: true });
    }

    case 'renameClient': {
      const contact = String(body.contact ?? '');
      const name = String(body.name ?? '').trim().slice(0, 120);
      if (!name) return bad();
      const client = await ensureClient(sb, contact, name);
      if (!client) return bad();
      await sb.from('clients').update({ name }).eq('id', client.id);
      return NextResponse.json({ ok: true });
    }

    case 'deleteClient': {
      // Full removal: the client record AND their bookings (matched by the
      // same phone-suffix logic the CRM groups by). Payments stay — they're
      // financial history.
      const contact = String(body.contact ?? '');
      const key = phoneKey(contact);
      if (key.length < 6) return bad();
      const { data: rows } = await sb.from('bookings').select('id, contact').limit(2000);
      const ids = ((rows ?? []) as { id: number; contact: string }[])
        .filter((b) => phoneKey(b.contact) === key)
        .map((b) => b.id);
      if (ids.length) await sb.from('bookings').delete().in('id', ids);
      await sb.from('clients').delete().eq('phone_key', key);
      return NextResponse.json({ ok: true, removedBookings: ids.length });
    }

    case 'setBan': {
      const contact = String(body.contact ?? '');
      const banned = Boolean(body.banned);
      const reason = String(body.reason ?? '').slice(0, 200) || null;
      const client = await ensureClient(sb, contact);
      if (!client) return bad();
      await sb.from('clients').update({ banned, ban_reason: banned ? reason : null }).eq('id', client.id);
      return NextResponse.json({ ok: true });
    }

    case 'setSlotDuration': {
      const d = Number(body.duration);
      if (!Number.isInteger(d) || d < 1 || d > 4) return bad();
      const { error } = await sb.from('app_config').upsert({ key: 'slot_duration_hours', value: String(d) });
      if (error) {
        return NextResponse.json(
          { ok: false, error: 'Run the app_config migration in Supabase first.' },
          { status: 500 },
        );
      }
      return NextResponse.json({ ok: true });
    }

    case 'setHours': {
      const weekday = Number(body.weekday);
      const closed = Boolean(body.closed);
      const open_hour = Math.max(0, Math.min(23, Number(body.open_hour) || 0));
      const close_hour = Math.max(0, Math.min(24, Number(body.close_hour) || 0));
      if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) return bad();
      if (!closed && close_hour - open_hour < 2) return bad(); // need room for one window
      await sb.from('business_hours').upsert({ weekday, open_hour, close_hour, closed });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
  }
}
