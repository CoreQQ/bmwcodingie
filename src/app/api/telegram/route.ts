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
  sendOwnerWithMarkup,
  type BookingRow,
  type Lead,
} from '@/lib/telegram';
import {
  cancelInvoice,
  startInvoice,
  tryHandleInvoiceCallback,
  tryHandleInvoiceText,
} from '@/lib/invoiceFlow';
import { getBusinessStats, getHours, getBlockedDates, getSlotDuration } from '@/lib/stats';
import { calendarToken } from '@/lib/calendar';
import { REVIEW_TEMPLATES, hasReviewUrl } from '@/lib/reviewTemplates';
import { sendWhatsAppText, normalizeWaNumber, isWhatsAppConfigured } from '@/lib/whatsapp';
import { findClients, formatClient, resolveClient, ensureClient, clientCode } from '@/lib/crm';
import { windowsFor, windowsOverlap, windowLabel } from '@/lib/hours';
import { CANNED_REPLIES, getReply } from '@/lib/replies';
import { CHEAT_SHEET, CHEAT_DISCLAIMER, findCheat, formatCheat } from '@/lib/cheatsheet';
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


/** Free (non-overlapping) windows for a date, given confirmed bookings. */
async function freeWindowsFor(sb: SupabaseClient, date: string, excludeId?: number): Promise<string[]> {
  const [hours, duration, { data }] = await Promise.all([
    getHours(sb),
    getSlotDuration(sb),
    sb
      .from('bookings')
      .select('id, slot_time')
      .eq('slot_date', date)
      .eq('status', 'confirmed'),
  ]);
  const busy = ((data ?? []) as { id: number; slot_time: string }[]).filter(
    (b) => b.slot_time && b.id !== excludeId,
  );
  const weekday = new Date(`${date}T00:00:00`).getDay();
  return windowsFor(hours, weekday, duration).filter((w) => !busy.some((b) => windowsOverlap(b.slot_time, w)));
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
    let text = msg.text.trim();
    if (text === '💰 Money') text = '/paid';
    else if (text === '📅 Bookings') text = '/bookings';
    else if (text === '📊 Stats') text = '/stats';
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
      await sendOwnerWithMarkup(
        done
          ? '✅ Меню команд обновлено, быстрые кнопки внизу установлены. Закрой и открой чат, если клавиатура не появилась.'
          : '❌ Не удалось обновить меню — попробуй ещё раз через минуту.',
        {
          keyboard: [
            [{ text: '💶 Paid' }, { text: '📅 Bookings' }],
            [{ text: '💰 Money' }, { text: '📊 Stats' }],
          ],
          resize_keyboard: true,
          is_persistent: true,
        },
      );
      return ok();
    }
    // Persistent reply-keyboard shortcuts (installed by /setup).
    if (text === '💶 Paid') {
      const amounts = [40, 60, 80, 100, 120, 150, 200, 250];
      await sendOwnerWithMarkup('💶 <b>Log a payment</b> — tap the amount:', {
        inline_keyboard: [
          amounts.slice(0, 4).map((a) => ({ text: `€${a}`, callback_data: `paidq:${a}` })),
          amounts.slice(4).map((a) => ({ text: `€${a}`, callback_data: `paidq:${a}` })),
          [{ text: '✍️ Other / with details', callback_data: 'paidq:custom' }],
        ],
      });
      return ok();
    }
    if (/^\/banlist(@\w+)?\b/.test(text)) {
      const { data } = await sb
        .from('clients')
        .select('id, phone_key, name, ban_reason')
        .eq('banned', true)
        .order('id');
      const list = (data ?? []) as { id: number; phone_key: string; name: string | null; ban_reason: string | null }[];
      if (!list.length) {
        await sendOwnerMessage('📵 Blacklist is empty.');
        return ok();
      }
      const lines = ['⛔️ <b>Blacklist</b>', '━━━━━━━━━━━━━━━━━━━'];
      for (const c of list) {
        lines.push(
          `<code>${clientCode(c.id)}</code> · ${escapeHtml(c.name || '—')} · …${c.phone_key.slice(-6)}${c.ban_reason ? ` — ${escapeHtml(c.ban_reason)}` : ''}`,
        );
      }
      lines.push('', 'Unban: <code>/unban C-001</code>');
      await sendOwnerMessage(lines.join('\n'));
      return ok();
    }
    if (/^\/ban(@\w+)?\b/.test(text)) {
      const rest = text.replace(/^\/ban(@\w+)?\s*/, '').trim();
      const m = rest.match(/^(\S+)\s*([\s\S]*)$/);
      if (!m) {
        await sendOwnerMessage('Usage: <code>/ban C-007 reason</code> or <code>/ban 0871234567 reason</code>');
        return ok();
      }
      let client = await resolveClient(sb, m[1]);
      // Unknown number → create the record so the ban sticks pre-emptively.
      if (!client && /\d{6,}/.test(m[1].replace(/\D/g, ''))) {
        client = await ensureClient(sb, m[1]);
      }
      if (!client) {
        await sendOwnerMessage(`Client not found for «${escapeHtml(m[1])}». Use a C-code from /client or a phone number.`);
        return ok();
      }
      const reason = m[2].trim() || null;
      const { error } = await sb.from('clients').update({ banned: true, ban_reason: reason }).eq('id', client.id);
      if (error) {
        await sendOwnerMessage(`❌ ${escapeHtml(error.message)} — run the clients migration in Supabase.`);
        return ok();
      }
      await sendOwnerMessage(
        `⛔️ Banned <code>${clientCode(client.id)}</code> · ${escapeHtml(client.name || '—')}${reason ? ` — ${escapeHtml(reason)}` : ''}\nTheir future bookings are auto-declined silently. Undo: <code>/unban ${clientCode(client.id)}</code>`,
      );
      return ok();
    }
    if (/^\/unban(@\w+)?\b/.test(text)) {
      const q = text.replace(/^\/unban(@\w+)?\s*/, '').trim();
      const client = q ? await resolveClient(sb, q) : null;
      if (!client) {
        await sendOwnerMessage('Usage: <code>/unban C-007</code> or <code>/unban 0871234567</code>');
        return ok();
      }
      await sb.from('clients').update({ banned: false, ban_reason: null }).eq('id', client.id);
      await sendOwnerMessage(`✅ Unbanned <code>${clientCode(client.id)}</code> · ${escapeHtml(client.name || '—')}`);
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
    if (/^\/cheat(@\w+)?\b/.test(text)) {
      const rest = text.replace(/^\/cheat(@\w+)?\s*/, '').trim();

      // /cheat add Title | body text
      const addM = /^add\s+([\s\S]+)$/i.exec(rest);
      if (addM) {
        const [title, ...bodyParts] = addM[1].split('|');
        const body = bodyParts.join('|').trim();
        if (!title.trim() || !body) {
          await sendOwnerMessage('Add a note: <code>/cheat add F30 ambient | FEM_BODY → AMBIENT = aktiv, 11 colours</code>');
          return ok();
        }
        const { error } = await sb
          .from('cheat_notes')
          .insert({ title: title.trim().slice(0, 120), body: body.slice(0, 1000), keywords: title.trim().toLowerCase() });
        if (error) {
          await sendOwnerMessage(`❌ ${escapeHtml(error.message)} — run the cheat_notes migration in Supabase.`);
          return ok();
        }
        await sendOwnerMessage(`✅ Saved to your cheat-sheet: <b>${escapeHtml(title.trim())}</b>`);
        return ok();
      }

      // /cheat del 5
      const delM = /^del(?:ete)?\s+(\d+)$/i.exec(rest);
      if (delM) {
        await sb.from('cheat_notes').delete().eq('id', Number(delM[1]));
        await sendOwnerMessage(`🗑 Deleted note #${delM[1]}.`);
        return ok();
      }

      // No query → list categories + own notes.
      if (!rest) {
        const { data: mine } = await sb
          .from('cheat_notes')
          .select('id, title')
          .order('created_at', { ascending: false })
          .limit(30);
        const lines = ['🔧 <b>Coding cheat-sheet</b>', CHEAT_DISCLAIMER, '', '<b>Search:</b> <code>/cheat vim</code> · <code>/cheat mirrors</code>', '', '<b>Built-in topics:</b>'];
        lines.push(CHEAT_SHEET.map((e) => `• ${escapeHtml(e.title)}`).join('\n'));
        const list = (mine ?? []) as { id: number; title: string }[];
        if (list.length) {
          lines.push('', '<b>Your notes:</b>');
          for (const n of list) lines.push(`• <code>#${n.id}</code> ${escapeHtml(n.title)}`);
        }
        lines.push('', 'Add: <code>/cheat add Title | details</code> · Remove: <code>/cheat del 5</code>');
        await sendOwnerMessage(lines.join('\n'));
        return ok();
      }

      // Search built-in + custom notes.
      const builtin = findCheat(rest);
      const { data: notesData } = await sb
        .from('cheat_notes')
        .select('id, title, body, keywords')
        .or(`title.ilike.%${rest}%,keywords.ilike.%${rest}%,body.ilike.%${rest}%`)
        .limit(5);
      const notes = (notesData ?? []) as { id: number; title: string; body: string }[];

      if (!builtin.length && !notes.length) {
        await sendOwnerMessage(`No cheat entries for «${escapeHtml(rest)}». See all: /cheat`);
        return ok();
      }
      const blocks: string[] = builtin.map((e) => formatCheat(e, escapeHtml));
      for (const n of notes) {
        blocks.push(`📝 <b>${escapeHtml(n.title)}</b> <code>#${n.id}</code>\n${escapeHtml(n.body)}`);
      }
      await sendOwnerMessage([blocks.join('\n\n'), '', CHEAT_DISCLAIMER].join('\n'));
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

      // Fix a mistake: /paid del last  |  /paid del 12
      const del = /^del(?:ete)?\s+(last|\d+)$/i.exec(rest);
      if (del) {
        type PayRow = { id: number; amount: number; client: string | null };
        let row: PayRow | null = null;
        if (del[1].toLowerCase() === 'last') {
          const { data } = await sb
            .from('payments')
            .select('id, amount, client')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          row = (data as PayRow | null) ?? null;
        } else {
          const { data } = await sb
            .from('payments')
            .select('id, amount, client')
            .eq('id', Number(del[1]))
            .maybeSingle();
          row = (data as PayRow | null) ?? null;
        }
        if (!row) {
          await sendOwnerMessage('Nothing to delete — check the id in /paid.');
          return ok();
        }
        await sb.from('payments').delete().eq('id', row.id);
        await sendOwnerMessage(
          `🗑 Deleted payment <code>#${row.id}</code> — €${Number(row.amount).toFixed(0)}${row.client ? ` · ${escapeHtml(row.client)}` : ''}\nRe-add if needed: <code>/paid ${Number(row.amount).toFixed(0)} ${escapeHtml(row.client || '')}</code>`,
        );
        return ok();
      }

      const m = rest.match(/^(\d+(?:[.,]\d{1,2})?)\s*(?:€|eur)?\s*([\s\S]*)$/i);
      if (!rest || !m) {
        // No args → show the money summary.
        const { data: pays } = await sb
          .from('payments')
          .select('id, amount, client, service, created_at, cost, share_pct, share_name')
          .order('created_at', { ascending: false })
          .limit(200);
        const list = (pays ?? []) as { id: number; amount: number; client: string | null; service: string | null; created_at: string; cost?: number | null; share_pct?: number | null; share_name?: string | null }[];
        if (!list.length) {
          await sendOwnerMessage('💶 No payments logged yet.\nRecord one: <code>/paid 120 John CarPlay</code>');
          return ok();
        }
        const since = (d: number) => Date.now() - d * 86400000;
        const shareOf = (x: (typeof list)[number]) =>
          Math.round((Number(x.amount || 0) - Number(x.cost || 0)) * Number(x.share_pct || 0)) / 100;
        const netOf = (x: (typeof list)[number]) =>
          Number(x.amount || 0) - Number(x.cost || 0) - shareOf(x);
        const agg = (ms: number) => {
          const rows = list.filter((x) => new Date(x.created_at).getTime() >= ms);
          return {
            gross: rows.reduce((a, x) => a + Number(x.amount || 0), 0),
            cost: rows.reduce((a, x) => a + Number(x.cost || 0), 0),
            share: rows.reduce((a, x) => a + shareOf(x), 0),
            net: rows.reduce((a, x) => a + netOf(x), 0),
          };
        };
        const w = agg(since(7));
        const mo = agg(since(30));
        const fmtAgg = (a: typeof w) =>
          a.cost || a.share
            ? `€${a.gross.toFixed(0)} − costs €${a.cost.toFixed(0)} − shares €${a.share.toFixed(2)} = <b>net €${a.net.toFixed(2)}</b>`
            : `<b>€${a.gross.toFixed(0)}</b>`;
        // Owed per person this month (settle in cash, then log however you like).
        const owed = new Map<string, number>();
        for (const x of list.filter((y) => new Date(y.created_at).getTime() >= since(30))) {
          const sh = shareOf(x);
          if (sh > 0) {
            const k = (x.share_name || 'partner').trim();
            owed.set(k, (owed.get(k) ?? 0) + sh);
          }
        }
        const lines = [
          '💶 <b>Money</b>',
          '━━━━━━━━━━━━━━━━━━━',
          `Week: ${fmtAgg(w)}`,
          `Month: ${fmtAgg(mo)}`,
          ...(owed.size
            ? ['', '<b>Owed this month:</b>', ...[...owed].map(([k, v]) => `  🤝 ${escapeHtml(k)}: €${v.toFixed(2)}`)]
            : []),
          '',
          '<b>Recent:</b>',
        ];
        for (const x of list.slice(0, 6)) {
          const d = new Date(x.created_at).toLocaleDateString('en-IE', { day: '2-digit', month: 'short' });
          const extra = Number(x.cost || 0) || Number(x.share_pct || 0) ? ` → net €${netOf(x).toFixed(2)}` : '';
          lines.push(`  <code>#${x.id}</code> €${Number(x.amount).toFixed(0)}${extra} — ${escapeHtml([x.client, x.service].filter(Boolean).join(' · ') || '—')} (${d})`);
        }
        lines.push(
          '',
          'Add: <code>/paid 120 C-007 CarPlay</code> or <code>/paid 120 John Smith - CarPlay</code>',
          'With economics: <code>/paid 200 John CarPlay cost 50 FSC share 25 Alex</code>',
          'Undo: <code>/paid del last</code> or <code>/paid del 12</code>',
        );
        await sendOwnerMessage(lines.join('\n'));
        return ok();
      }
      const amount = parseFloat(m[1].replace(',', '.'));
      // Who + what: "C-007 CarPlay" (code → full name), "John Smith - CarPlay"
      // (dash separates a multi-word name), or "John CarPlay" (first word = name).
      let tail = (m[2] || '').trim();
      // Economics tokens anywhere in the text:
      //   cost 50 [note]  → direct expense (FSC code, part)
      //   share 25 [Name] → % of (amount - costs) owed to a partner/referrer
      let cost = 0;
      let costNote = '';
      let sharePct = 0;
      let shareName = '';
      const costM = /\bcost:?\s*(\d+(?:[.,]\d{1,2})?)(?:\s+(\w[\w -]{0,30}?))?(?=\s+share\b|$)/i.exec(tail);
      if (costM) {
        cost = parseFloat(costM[1].replace(',', '.'));
        costNote = (costM[2] || '').trim();
        tail = tail.replace(costM[0], '').trim();
      }
      const shareM = /\bshare:?\s*(\d{1,2})%?(?:\s+(\w[\w -]{0,30}?))?(?=\s+cost\b|$)/i.exec(tail);
      if (shareM) {
        sharePct = Math.min(90, Number(shareM[1]));
        shareName = (shareM[2] || '').trim();
        tail = tail.replace(shareM[0], '').trim();
      }
      let client = '';
      let service = '';
      const codeM = /^(c[-\s]?0*\d+)\b\s*([\s\S]*)$/i.exec(tail);
      if (codeM) {
        const c = await resolveClient(sb, codeM[1]);
        client = c?.name || codeM[1].toUpperCase();
        service = codeM[2].trim();
      } else if (tail.includes(' - ')) {
        const [n, ...svc] = tail.split(' - ');
        client = n.trim();
        service = svc.join(' - ').trim();
      } else {
        const [n = '', ...svc] = tail.split(/\s+/);
        client = n;
        service = svc.join(' ');
      }
      const shareEur = sharePct ? Math.round((amount - cost) * sharePct) / 100 : 0;
      const net = amount - cost - shareEur;
      let { error } = await sb.from('payments').insert({
        amount, client: client || null, service: service || null,
        cost, cost_note: costNote || null, share_pct: sharePct, share_name: shareName || null,
      });
      if (error && (cost || sharePct)) {
        // Economics columns not migrated yet — save the basic row, warn once.
        const basic = await sb.from('payments').insert({ amount, client: client || null, service: service || null });
        error = basic.error;
        if (!error) {
          await sendOwnerMessage('⚠️ Saved without cost/share — run the payments migration in Supabase (see RUNBOOK).');
        }
      }
      if (error) {
        await sendOwnerMessage(`❌ Could not save: ${escapeHtml(error.message)}\n(Run the payments migration in Supabase if you haven't.)`);
        return ok();
      }
      const econ = cost || sharePct
        ? `\n− costs €${cost.toFixed(0)}${costNote ? ` (${escapeHtml(costNote)})` : ''}${sharePct ? ` · − share €${shareEur.toFixed(2)} (${sharePct}%${shareName ? ` → ${escapeHtml(shareName)}` : ''})` : ''}\n= <b>Net €${net.toFixed(2)}</b>`
        : '';
      await sendOwnerMessage(
        `✅ Logged <b>€${amount.toFixed(0)}</b>${client ? ` — ${escapeHtml(client)}` : ''}${service ? ` · ${escapeHtml(service)}` : ''}${econ}\nTotals: /paid · Mistake? <code>/paid del last</code>`,
      );
      return ok();
    }
    if (/^\/review(@\w+)?\b/.test(text)) {
      // Optional "/review Name Service" — first token is the name.
      const rest = text.replace(/^\/review(@\w+)?\s*/, '').trim();
      let name = '';
      let service = '';
      const codeM = /^(c[-\s]?0*\d+)\b\s*([\s\S]*)$/i.exec(rest);
      if (codeM) {
        const c = await resolveClient(sb, codeM[1]);
        name = c?.name || '';
        service = codeM[2].trim();
      } else if (rest.includes(' - ')) {
        const [n, ...svc] = rest.split(' - ');
        name = n.trim();
        service = svc.join(' - ').trim();
      } else {
        const [n = '', ...svcParts] = rest.split(/\s+/);
        name = n;
        service = svcParts.join(' ');
      }
      const lines = [
        '⭐ <b>Review request templates</b>',
        '━━━━━━━━━━━━━━━━━━━',
        name
          ? `For <b>${name}</b>${service ? ` · ${service}` : ''} — tap a message to copy it:`
          : 'Tap a message to copy it. Personalise: <code>/review C-007 CarPlay</code> or <code>/review John Smith - CarPlay</code>.',
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
      // Section attention: where visitors actually spend their time (7 days).
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
      const { data: att } = await sb
        .from('section_time')
        .select('section, seconds')
        .gte('day', weekAgo)
        .limit(5000);
      if (att?.length) {
        const bySec = new Map<string, number>();
        for (const r of att as { section: string; seconds: number }[]) {
          bySec.set(r.section, (bySec.get(r.section) ?? 0) + Number(r.seconds || 0));
        }
        const top = [...bySec].sort((a, b) => b[1] - a[1]).slice(0, 8);
        const fmtT = (v: number) =>
          v >= 3600 ? `${Math.floor(v / 3600)}h ${Math.round((v % 3600) / 60)}m` : `${Math.round(v / 60)}m`;
        lines.push('', '<b>⏱ Attention by section (7d):</b>');
        for (const [k, v] of top) lines.push(`  ${fmtT(v)} — ${escapeHtml(k)}`);
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
  if (cq.data.startsWith('paidq:')) {
    const v = cq.data.slice(6);
    if (v === 'custom') {
      await answerCallback(cq.id, 'Type it in the field below');
      await sendOwnerMessage(
        'Type: <code>/paid 120 John CarPlay</code>\nFull economics: <code>/paid 200 John CarPlay cost 50 FSC share 25 Alex</code>',
      );
      return ok();
    }
    const amount = Number(v);
    if (amount > 0) {
      const { error } = await sb.from('payments').insert({ amount });
      if (error) {
        await answerCallback(cq.id, 'Failed — run the payments migration');
      } else {
        await answerCallback(cq.id, `Logged €${amount}`);
        await sendOwnerMessage(
          `✅ Logged <b>€${amount}</b>\nAdd client/costs? <code>/paid del last</code> then retype, e.g. <code>/paid ${amount} John CarPlay cost 50 FSC</code>\nTotals: 💰 Money`,
        );
      }
    }
    return ok();
  }
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
    const [rows, freeWins] = await Promise.all([upcomingBookings(sb), freeWindowsFor(sb, day[1])]);
    const { text, keyboard } = buildBookingsDay(day[1], rows, freeWins);
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
      const [rows, freeWins] = await Promise.all([upcomingBookings(sb), freeWindowsFor(sb, date)]);
      const { text, keyboard } = buildBookingsDay(date, rows, freeWins);
      await editMessage(chatId, messageId, text, keyboard);
    }
    return ok();
  }

  // Header row in the day view — just a label, no action.
  if (cq.data.startsWith('bknoop:')) {
    await answerCallback(cq.id);
    return ok();
  }

  // "💶 Paid" on a booking → show quick amount choices.
  const paid = /^bkpaid:(\d+)$/.exec(cq.data);
  if (paid) {
    const id = Number(paid[1]);
    const { data: bRow } = await sb
      .from('bookings')
      .select('name, service')
      .eq('id', id)
      .single();
    if (!bRow) {
      await answerCallback(cq.id, 'Booking not found.');
      return ok();
    }
    // Offer the service's own price (parsed) plus common amounts.
    const amounts = new Set<number>();
    if (bRow.service) {
      const { data: svc } = await sb
        .from('services')
        .select('price_label')
        .eq('title', bRow.service)
        .maybeSingle();
      const p = svc?.price_label ? parseInt(String(svc.price_label).replace(/[^\d]/g, ''), 10) : NaN;
      if (Number.isFinite(p) && p > 0) amounts.add(p);
    }
    [60, 80, 120, 150].forEach((a) => amounts.add(a));
    const sorted = [...amounts].sort((a, b) => a - b);
    const rows: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < sorted.length; i += 3) {
      rows.push(sorted.slice(i, i + 3).map((a) => ({ text: `€${a}`, callback_data: `bkpaidamt:${id}:${a}` })));
    }
    await sendOwnerWithMarkup(
      `💶 Log payment for <b>${escapeHtml(String(bRow.name))}</b>${bRow.service ? ` · ${escapeHtml(String(bRow.service))}` : ''}\nPick an amount, or type <code>/paid 137 ${escapeHtml(String(bRow.name).split(/\s+/)[0])}</code> for a custom one.`,
      { inline_keyboard: rows },
    );
    await answerCallback(cq.id);
    return ok();
  }

  const paidAmt = /^bkpaidamt:(\d+):(\d+)$/.exec(cq.data);
  if (paidAmt) {
    const id = Number(paidAmt[1]);
    const amount = Number(paidAmt[2]);
    const { data: bRow } = await sb.from('bookings').select('name, service').eq('id', id).single();
    const { error } = await sb.from('payments').insert({
      amount,
      client: bRow?.name ?? null,
      service: bRow?.service ?? null,
    });
    if (error) {
      await answerCallback(cq.id, 'Failed — run payments migration.');
      await sendOwnerMessage(`❌ Could not log payment: ${escapeHtml(error.message)}`);
      return ok();
    }
    await answerCallback(cq.id, `Logged €${amount} ✓`);
    await sendOwnerMessage(
      `✅ Logged <b>€${amount}</b> — ${escapeHtml(String(bRow?.name ?? ''))}${bRow?.service ? ` · ${escapeHtml(String(bRow.service))}` : ''}\nTotals: /paid`,
    );
    return ok();
  }

  // Move a booking: pick a day → pick a free window → done.
  const mv = /^bkmv:(\d+)$/.exec(cq.data);
  if (mv) {
    const id = Number(mv[1]);
    const blocked = new Set(await getBlockedDates(sb));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days: string[] = [];
    for (let i = 0; days.length < 10 && i < 21; i++) {
      const d = new Date(today.getTime() + i * 86400000).toISOString().slice(0, 10);
      if (!blocked.has(d)) days.push(d);
    }
    const rows: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < days.length; i += 2) {
      rows.push(
        days.slice(i, i + 2).map((d) => ({
          text: new Date(`${d}T00:00:00`).toLocaleDateString('en-IE', { weekday: 'short', day: '2-digit', month: 'short' }),
          callback_data: `bkmvd:${id}:${d}`,
        })),
      );
    }
    rows.push([{ text: '← Back', callback_data: 'bklist' }]);
    await editMessage(chatId, messageId, '🕓 <b>Move booking</b> — pick a new day:', { inline_keyboard: rows });
    await answerCallback(cq.id);
    return ok();
  }

  const mvd = /^bkmvd:(\d+):(\d{4}-\d{2}-\d{2})$/.exec(cq.data);
  if (mvd) {
    const id = Number(mvd[1]);
    const date = mvd[2];
    const wins = await freeWindowsFor(sb, date, id);
    if (!wins.length) {
      await answerCallback(cq.id, 'No free windows that day — pick another.');
      return ok();
    }
    const rows: { text: string; callback_data: string }[][] = [];
    for (let i = 0; i < wins.length; i += 2) {
      rows.push(
        wins.slice(i, i + 2).map((w) => ({
          text: w,
          callback_data: `bkmvt:${id}:${date}:${parseInt(w, 10)}`,
        })),
      );
    }
    rows.push([{ text: '← Back', callback_data: `bkmv:${id}` }]);
    await editMessage(
      chatId,
      messageId,
      `🕓 <b>Move booking</b> — free windows on <b>${date}</b>:`,
      { inline_keyboard: rows },
    );
    await answerCallback(cq.id);
    return ok();
  }

  const mvt = /^bkmvt:(\d+):(\d{4}-\d{2}-\d{2}):(\d{1,2})$/.exec(cq.data);
  if (mvt) {
    const id = Number(mvt[1]);
    const date = mvt[2];
    const slotTime = windowLabel(Number(mvt[3]), await getSlotDuration(sb));
    const { data: bRow } = await sb
      .from('bookings')
      .select('name, public_token, slot_date, slot_time')
      .eq('id', id)
      .single();
    await sb.from('bookings').update({ slot_date: date, slot_time: slotTime }).eq('id', id);
    await answerCallback(cq.id, 'Moved ✓');
    const [rows, freeWins] = await Promise.all([upcomingBookings(sb), freeWindowsFor(sb, date)]);
    const { text, keyboard } = buildBookingsDay(date, rows, freeWins);
    await editMessage(chatId, messageId, text, keyboard);
    if (bRow?.name) {
      const label = new Date(`${date}T00:00:00`).toLocaleDateString('en-IE', { weekday: 'short', day: '2-digit', month: 'short' });
      const track = bRow.public_token ? ` Track it here: ${SITE_URL}/b/${bRow.public_token}` : '';
      const msgTxt = `Hi ${String(bRow.name).trim().split(/\s+/)[0]}! Quick update — your BMW coding slot is now ${label} · ${slotTime} ✅${track}`;
      await sendOwnerMessage(
        `✅ Moved <b>${escapeHtml(String(bRow.name))}</b> → ${label} · ${slotTime}`,
        { inline_keyboard: [[{ text: '📋 Copy new-time message', copy_text: { text: msgTxt.slice(0, 256) } }]] } as never,
      );
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
