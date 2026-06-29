import type { SupabaseClient } from '@supabase/supabase-js';
import { buildInvoicePdf, parsePrice, type InvoiceItem } from './invoice';
import { editMessage, sendOwnerDocument, sendOwnerWithMarkup } from './telegram';
import { DEFAULT_SETTINGS } from './defaults';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bmwcoding.ie';

type Draft = {
  chat_id: number;
  step: string;
  client: string;
  pending_service: string;
  items: InvoiceItem[];
};

// Reply keyboards (button text comes back as a normal message we match on).
const KB_CLIENT = { keyboard: [[{ text: 'Skip' }], [{ text: '✖️ Cancel' }]], resize_keyboard: true };
const KB_ITEMS = {
  keyboard: [[{ text: '✅ Create invoice' }], [{ text: '✖️ Cancel' }]],
  resize_keyboard: true,
};
const KB_REMOVE = { remove_keyboard: true };

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function pad(n: number) {
  return String(n).padStart(2, '0');
}
function parseMoney(text: string): number | null {
  const m = text.replace(',', '.').match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Math.round(Number(m[1]));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

async function getDraft(sb: SupabaseClient, chatId: number): Promise<Draft | null> {
  const { data } = await sb.from('invoice_drafts').select('*').eq('chat_id', chatId).single();
  return (data as Draft) ?? null;
}
async function saveDraft(sb: SupabaseClient, chatId: number, patch: Partial<Draft>) {
  await sb
    .from('invoice_drafts')
    .upsert({ chat_id: chatId, ...patch, updated_at: new Date().toISOString() });
}
async function clearDraft(sb: SupabaseClient, chatId: number) {
  await sb.from('invoice_drafts').delete().eq('chat_id', chatId);
}

/** Match a typed service against the live catalog and pull its site price. */
async function lookupSitePrice(
  sb: SupabaseClient,
  text: string,
): Promise<{ title: string; price: number } | null> {
  const { data } = await sb.from('services').select('title, price_label').eq('visible', true);
  const rows = (data ?? []) as { title: string; price_label: string }[];
  const q = text.trim().toLowerCase();
  const hit =
    rows.find((r) => r.title.toLowerCase() === q) ||
    rows.find((r) => r.title.toLowerCase().includes(q)) ||
    rows.find((r) => q.includes(r.title.toLowerCase()));
  if (!hit) return null;
  const price = parsePrice(hit.price_label);
  return price == null ? null : { title: hit.title, price };
}

export async function startInvoice(sb: SupabaseClient, chatId: number) {
  await saveDraft(sb, chatId, { step: 'await_client', client: '', pending_service: '', items: [] });
  await sendOwnerWithMarkup(
    '🧾 <b>New invoice</b>\nWho is it for? Send the client&#39;s name (or tap <b>Skip</b>).',
    KB_CLIENT,
  );
}

export async function cancelInvoice(sb: SupabaseClient, chatId: number) {
  await clearDraft(sb, chatId);
  await sendOwnerWithMarkup('Invoice cancelled.', KB_REMOVE);
}

async function finalize(sb: SupabaseClient, chatId: number, draft: Draft) {
  if (!draft.items.length) {
    await sendOwnerWithMarkup('Add at least one service first.', KB_ITEMS);
    return;
  }
  const { data } = await sb.from('site_settings').select('phone, email').eq('id', 1).single();
  const phone = (data?.phone as string) || DEFAULT_SETTINGS.phone;
  const email = (data?.email as string) || DEFAULT_SETTINGS.email;

  const now = new Date();
  const number = `INV-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const date = now.toLocaleDateString('en-IE', { day: '2-digit', month: 'short', year: 'numeric' });

  const bytes = await buildInvoicePdf({
    number,
    date,
    client: draft.client,
    items: draft.items,
    business: { name: 'BMW Coding', phone, email, website: SITE_URL.replace(/^https?:\/\//, '') },
  });
  const total = draft.items.reduce((s, i) => s + i.price, 0);
  await sendOwnerDocument(bytes, `${number}.pdf`, `🧾 ${number} · €${total}`);
  await clearDraft(sb, chatId);
  await sendOwnerWithMarkup('Invoice ready ✅', KB_REMOVE);
}

/** Handle a free-text message while an invoice draft is active. Returns true if consumed. */
export async function tryHandleInvoiceText(
  sb: SupabaseClient,
  chatId: number,
  text: string,
): Promise<boolean> {
  const draft = await getDraft(sb, chatId);
  if (!draft || !draft.step) return false;

  if (text === '✅ Create invoice') {
    await finalize(sb, chatId, draft);
    return true;
  }

  if (draft.step === 'await_client') {
    const client = text === 'Skip' ? '' : text.slice(0, 120);
    await saveDraft(sb, chatId, { step: 'await_service', client });
    await sendOwnerWithMarkup(
      `Client: <b>${esc(client || '—')}</b>\nNow send a service name (e.g. <i>ISTA Diagnostics</i>).`,
      KB_ITEMS,
    );
    return true;
  }

  if (draft.step === 'await_service') {
    const match = await lookupSitePrice(sb, text);
    if (match) {
      await saveDraft(sb, chatId, { step: 'await_price_choice', pending_service: match.title });
      await sendOwnerWithMarkup(`<b>${esc(match.title)}</b> — choose a price:`, {
        inline_keyboard: [
          [{ text: `Use €${match.price} (site price)`, callback_data: `inv:site:${match.price}` }],
          [{ text: 'Enter custom price', callback_data: 'inv:custom' }],
        ],
      });
    } else {
      await saveDraft(sb, chatId, { step: 'await_price', pending_service: text.slice(0, 120) });
      await sendOwnerWithMarkup(`Send the price for <b>${esc(text)}</b> in € (e.g. 120).`, KB_ITEMS);
    }
    return true;
  }

  if (draft.step === 'await_price' || draft.step === 'await_price_choice') {
    const price = parseMoney(text);
    if (price == null) {
      await sendOwnerWithMarkup('Please send a number, e.g. 120.', KB_ITEMS);
      return true;
    }
    const items = [...draft.items, { service: draft.pending_service, price }];
    await saveDraft(sb, chatId, { step: 'await_service', pending_service: '', items });
    await sendOwnerWithMarkup(
      `Added <b>${esc(draft.pending_service)}</b> — €${price}.\nSend another service, or tap ✅ Create invoice.`,
      KB_ITEMS,
    );
    return true;
  }

  return false;
}

/** Handle an inline callback (price choice). Returns true if consumed. */
export async function tryHandleInvoiceCallback(
  sb: SupabaseClient,
  chatId: number,
  messageId: number,
  data: string,
  answer: (text?: string) => Promise<void>,
): Promise<boolean> {
  if (!data.startsWith('inv:')) return false;
  const draft = await getDraft(sb, chatId);
  if (!draft) {
    await answer('Start with /invoice');
    return true;
  }

  if (data.startsWith('inv:site:')) {
    const price = Number(data.slice('inv:site:'.length));
    const items = [...draft.items, { service: draft.pending_service, price }];
    await saveDraft(sb, chatId, { step: 'await_service', pending_service: '', items });
    await editMessage(chatId, messageId, `✅ Added <b>${esc(draft.pending_service)}</b> — €${price}.`, {
      inline_keyboard: [],
    });
    await answer('Added');
    await sendOwnerWithMarkup('Send another service, or tap ✅ Create invoice.', KB_ITEMS);
    return true;
  }

  if (data === 'inv:custom') {
    await saveDraft(sb, chatId, { step: 'await_price' });
    await editMessage(
      chatId,
      messageId,
      `Send the price for <b>${esc(draft.pending_service)}</b> in € (e.g. 120).`,
      { inline_keyboard: [] },
    );
    await answer();
    return true;
  }

  await answer();
  return true;
}
