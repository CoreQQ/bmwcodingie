import type { SupabaseClient } from '@supabase/supabase-js';
import { phoneKey, clientCode } from './crm';

// Full-CRM aggregation for the Mini App "Clients" tab. Joins bookings +
// clients + payments by phone key into one row per person, with lifetime
// value, visit counts and history.

export type CrmJob = {
  date: string | null;
  created_at: string;
  service: string | null;
  bmw_model: string | null;
  status: string;
};

export type CrmClient = {
  id: number | null; // client code id (null if no clients-row yet)
  code: string | null;
  name: string;
  contact: string;
  jobs: CrmJob[];
  enquiries: number;
  confirmed: number;
  totalPaid: number;
  lastActivity: string; // ISO
  banned: boolean;
  banReason: string | null;
  note: string | null;
};

type BookingLite = {
  name: string;
  contact: string;
  service: string | null;
  bmw_model: string | null;
  status: string;
  slot_date: string | null;
  created_at: string;
};
type ClientRowFull = {
  id: number;
  phone_key: string;
  name: string | null;
  banned: boolean;
  ban_reason: string | null;
  note: string | null;
};
type PaymentLite = { amount: number; client: string | null; created_at: string };

/** Build the full client list, most-recently-active first. */
export async function getCrmClients(sb: SupabaseClient): Promise<CrmClient[]> {
  const [bookingsRes, clientsRes, paymentsRes] = await Promise.all([
    sb
      .from('bookings')
      .select('name, contact, service, bmw_model, status, slot_date, created_at')
      .order('created_at', { ascending: false })
      .limit(1500),
    sb.from('clients').select('id, phone_key, name, banned, ban_reason, note'),
    sb.from('payments').select('amount, client, created_at').limit(2000),
  ]);

  const bookings = (bookingsRes.data ?? []) as BookingLite[];
  const clientRows = (clientsRes.data ?? []) as ClientRowFull[];
  const payments = (paymentsRes.data ?? []) as PaymentLite[];

  const clientByKey = new Map(clientRows.map((c) => [c.phone_key, c]));

  // Group bookings by phone key.
  const groups = new Map<string, CrmClient>();
  for (const b of bookings) {
    const key = phoneKey(b.contact);
    if (key.length < 6) continue;
    let g = groups.get(key);
    if (!g) {
      const c = clientByKey.get(key);
      g = {
        id: c?.id ?? null,
        code: c ? clientCode(c.id) : null,
        name: c?.name || b.name || '—',
        contact: b.contact,
        jobs: [],
        enquiries: 0,
        confirmed: 0,
        totalPaid: 0,
        lastActivity: b.created_at,
        banned: c?.banned ?? false,
        banReason: c?.ban_reason ?? null,
        note: c?.note ?? null,
      };
      groups.set(key, g);
    }
    g.jobs.push({
      date: b.slot_date,
      created_at: b.created_at,
      service: b.service,
      bmw_model: b.bmw_model,
      status: b.status,
    });
    g.enquiries += 1;
    if (b.status === 'confirmed') g.confirmed += 1;
    if (b.created_at > g.lastActivity) g.lastActivity = b.created_at;
  }

  // Lifetime value: match payments to a client by the name they were logged under.
  const byName = new Map<string, CrmClient>();
  for (const g of groups.values()) byName.set(g.name.trim().toLowerCase(), g);
  for (const p of payments) {
    const g = p.client ? byName.get(p.client.trim().toLowerCase()) : undefined;
    if (g) g.totalPaid += Number(p.amount || 0);
  }

  return [...groups.values()].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));
}
