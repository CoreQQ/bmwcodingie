import { Inbox, Check, RotateCcw, Trash2, Phone } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PageHeading, Card, aBtnGhost, aBtnDanger } from '@/components/admin/ui';
import { ConfirmButton } from '@/components/admin/ConfirmButton';
import { adminGetBookings } from '@/lib/admin-data';
import { toggleBookingHandled, deleteBooking } from '../actions';
import type { Booking } from '@/lib/types';

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fmtSlot(date: string | null, time: string): string {
  if (!date) return '';
  const d = new Date(`${date}T00:00:00`);
  const day = Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString('en-IE', { weekday: 'short', day: '2-digit', month: 'short' });
  return time ? `${day} · ${time}` : day;
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-400',
  confirmed: 'bg-emerald-500/15 text-emerald-400',
  declined: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-white/10 text-muted',
};

export default async function BookingsAdmin() {
  const bookings = await adminGetBookings();
  const newCount = bookings.filter((b) => !b.handled).length;

  return (
    <AdminShell>
      <PageHeading
        title="Bookings"
        sub={
          bookings.length === 0
            ? 'Enquiries from the contact form land here.'
            : `${bookings.length} total · ${newCount} new`
        }
      />

      {bookings.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <Inbox size={28} className="text-faint" />
          <p className="text-sm text-muted">
            No enquiries yet. Requests sent through the booking form on the site will appear here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <BookingRow key={b.id} booking={b} />
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function BookingRow({ booking: b }: { booking: Booking }) {
  return (
    <Card className={`p-4 ${b.handled ? 'opacity-60' : 'border-bmw/40'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-medium text-ink">{b.name || 'No name'}</span>
            {!b.handled && (
              <span className="rounded bg-bmw/15 px-2 py-0.5 text-xs uppercase tracking-wide text-bmw">New</span>
            )}
            {b.slot_date && (
              <span
                className={`rounded px-2 py-0.5 text-xs uppercase tracking-wide ${
                  STATUS_BADGE[b.status] ?? STATUS_BADGE.pending
                }`}
              >
                {b.status}
              </span>
            )}
          </div>
          {b.contact && (
            <a
              href={`tel:${b.contact.replace(/[^\d+]/g, '')}`}
              className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
            >
              <Phone size={13} /> {b.contact}
            </a>
          )}
        </div>
        <span className="shrink-0 text-xs text-faint">{fmtDate(b.created_at)}</span>
      </div>

      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {b.slot_date && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-faint">Requested slot</dt>
            <dd className="text-ink">{fmtSlot(b.slot_date, b.slot_time)}</dd>
          </div>
        )}
        {b.bmw_model && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-faint">BMW model</dt>
            <dd className="text-ink">{b.bmw_model}</dd>
          </div>
        )}
        {b.service && (
          <div>
            <dt className="text-xs uppercase tracking-wide text-faint">Service</dt>
            <dd className="text-ink">{b.service}</dd>
          </div>
        )}
      </dl>

      {b.message && (
        <p className="mt-3 whitespace-pre-wrap rounded-md border border-white/5 bg-graphite-900 p-3 text-sm text-muted">
          {b.message}
        </p>
      )}

      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-white/5 pt-3">
        <form action={toggleBookingHandled}>
          <input type="hidden" name="id" value={b.id} />
          <input type="hidden" name="handled" value={b.handled ? 'false' : 'true'} />
          <button type="submit" className={aBtnGhost}>
            {b.handled ? (
              <>
                <RotateCcw size={14} /> Mark as new
              </>
            ) : (
              <>
                <Check size={14} /> Mark handled
              </>
            )}
          </button>
        </form>
        <form action={deleteBooking}>
          <input type="hidden" name="id" value={b.id} />
          <ConfirmButton className={aBtnDanger} message="Delete this enquiry?">
            <Trash2 size={14} /> Delete
          </ConfirmButton>
        </form>
      </div>
    </Card>
  );
}
