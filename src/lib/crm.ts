import type { SupabaseClient } from '@supabase/supabase-js';
import type { Booking } from './types';

// Lightweight CRM helpers: recognise returning customers by phone number and
// pull a client's full history. Phone formats vary (+353 87…, 087…, spaces,
// dashes), so matching uses the last digits of the number.

/** Digits-only suffix used to compare phone numbers across formats. */
export function phoneKey(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.slice(-9); // Irish numbers: last 9 digits are the stable part
}

/** True when two contact strings look like the same phone number. */
function samePhone(a: string, b: string): boolean {
  const ka = phoneKey(a);
  const kb = phoneKey(b);
  return ka.length >= 6 && ka === kb;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? ` ${d.getFullYear()}` : ''}`;
}

async function recentBookings(sb: SupabaseClient, limit = 600): Promise<Booking[]> {
  const { data } = await sb
    .from('bookings')
    .select('id, name, contact, bmw_model, service, message, slot_date, slot_time, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as Booking[];
}

/**
 * One-line note for a new booking when the customer has been here before,
 * e.g. "🔁 Repeat customer · 2 previous: CarPlay activation (12 Mar), ISTA diagnostics (3 May)".
 * Returns null for first-time customers.
 */
export async function repeatCustomerNote(
  sb: SupabaseClient,
  contact: string,
  excludeId?: number,
): Promise<string | null> {
  if (phoneKey(contact).length < 6) return null;
  const all = await recentBookings(sb);
  const previous = all.filter((b) => b.id !== excludeId && samePhone(b.contact, contact));
  if (!previous.length) return null;
  const jobs = previous
    .slice(0, 3)
    .map((b) => `${(b.service || 'enquiry').trim()} (${shortDate(b.slot_date || b.created_at)})`)
    .join(', ');
  const more = previous.length > 3 ? ` +${previous.length - 3} more` : '';
  return `🔁 <b>Repeat customer</b> · ${previous.length} previous: ${jobs}${more}`;
}

export type ClientRow = {
  id: number;
  phone_key: string;
  name: string | null;
  banned: boolean;
  ban_reason: string | null;
};

/** Human-facing permanent client code, e.g. C-007. */
export function clientCode(id: number): string {
  return `C-${String(id).padStart(3, '0')}`;
}

/**
 * Get-or-create the client row for a contact. Returns null when the contact
 * has no usable phone digits or the clients table doesn't exist yet.
 */
export async function ensureClient(
  sb: SupabaseClient,
  contact: string,
  name?: string,
): Promise<ClientRow | null> {
  const key = phoneKey(contact);
  if (key.length < 6) return null;
  await sb
    .from('clients')
    .upsert({ phone_key: key, name: name?.trim() || null }, { onConflict: 'phone_key', ignoreDuplicates: true });
  const { data } = await sb.from('clients').select('*').eq('phone_key', key).maybeSingle();
  return (data as ClientRow) ?? null;
}

/** Resolve "C-7" / "c007" / a phone number to a client row. */
export async function resolveClient(sb: SupabaseClient, query: string): Promise<ClientRow | null> {
  const code = /^c[-\s]?0*(\d+)$/i.exec(query.trim());
  if (code) {
    const { data } = await sb.from('clients').select('*').eq('id', Number(code[1])).maybeSingle();
    return (data as ClientRow) ?? null;
  }
  const key = phoneKey(query);
  if (key.length >= 6) {
    const { data } = await sb.from('clients').select('*').eq('phone_key', key).maybeSingle();
    return (data as ClientRow) ?? null;
  }
  return null;
}

export type ClientMatch = { contact: string; name: string; jobs: Booking[]; client?: ClientRow | null };

/**
 * Search the client base by phone number fragment or name. Groups results by
 * phone so one person = one entry with their full history.
 */
export async function findClients(sb: SupabaseClient, query: string): Promise<ClientMatch[]> {
  const all = await recentBookings(sb);
  const qDigits = query.replace(/\D/g, '');
  const qName = query.trim().toLowerCase();

  const hits = all.filter((b) => {
    if (qDigits.length >= 4) {
      const digits = b.contact.replace(/\D/g, '');
      if (digits.includes(qDigits)) return true;
    }
    return qName.length >= 2 && b.name.toLowerCase().includes(qName);
  });

  const groups = new Map<string, ClientMatch>();
  for (const b of hits) {
    const key = phoneKey(b.contact) || b.name.toLowerCase();
    const g = groups.get(key);
    if (g) g.jobs.push(b);
    else groups.set(key, { contact: b.contact, name: b.name, jobs: [b] });
  }
  const matches = [...groups.values()].slice(0, 5);
  // Attach (and lazily create) the permanent client record for each match.
  for (const m of matches) {
    m.client = await ensureClient(sb, m.contact, m.name).catch(() => null);
  }
  return matches;
}

const STATUS_ICON: Record<string, string> = {
  confirmed: '✅',
  pending: '⏳',
  declined: '❌',
  cancelled: '🚫',
};

/** HTML lines describing one client's history for Telegram. */
export function formatClient(match: ClientMatch, esc: (s: string) => string): string[] {
  const code = match.client ? ` · 🆔 <code>${clientCode(match.client.id)}</code>` : '';
  const ban = match.client?.banned
    ? ` · ⛔️ BANNED${match.client.ban_reason ? ` (${esc(match.client.ban_reason)})` : ''}`
    : '';
  const lines = [
    `👤 <b>${esc(match.name)}</b> · <code>${esc(match.contact)}</code>${code} · ${match.jobs.length} job${match.jobs.length === 1 ? '' : 's'}${ban}`,
  ];
  for (const b of match.jobs.slice(0, 8)) {
    const icon = STATUS_ICON[b.status] ?? '·';
    const what = [b.service, b.bmw_model].filter(Boolean).join(' · ');
    lines.push(`  ${icon} ${shortDate(b.slot_date || b.created_at)} — ${esc(what || 'enquiry')}`);
  }
  if (match.jobs.length > 8) lines.push(`  …and ${match.jobs.length - 8} more`);
  return lines;
}
