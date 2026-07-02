import { Ban, CalendarDays, Check, Phone } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { PageHeading, Card, aBtnGhost } from '@/components/admin/ui';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getSchedule, getBlockedDates } from '@/lib/stats';
import { toggleBlockedDay } from '../actions';
import type { Booking } from '@/lib/types';

export const dynamic = 'force-dynamic';

function dayLabel(date: string): string {
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString('en-IE', { weekday: 'long', day: '2-digit', month: 'short' });
}

const STATUS_DOT: Record<string, string> = {
  confirmed: 'bg-emerald-400',
  pending: 'bg-amber-400',
};

export default async function ScheduleAdmin() {
  const sb = getSupabaseAdmin();
  const [schedule, blocked] = sb
    ? await Promise.all([getSchedule(sb, 14), getBlockedDates(sb)])
    : [[], []];
  const blockedSet = new Set(blocked);

  return (
    <AdminShell>
      <PageHeading
        title="Schedule"
        sub="The next two weeks of slot bookings. Block a day to hide it from the public slot picker."
      />

      {!sb && <Card className="p-6 text-sm text-muted">Database not configured.</Card>}

      <div className="space-y-2">
        {schedule.map(({ day, bookings }) => {
          const isBlocked = blockedSet.has(day);
          return (
            <Card key={day} className={`p-4 ${isBlocked ? 'opacity-50' : ''}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CalendarDays size={16} className={isBlocked ? 'text-faint' : 'text-bmw'} />
                  <span className="font-medium text-ink">{dayLabel(day)}</span>
                  {isBlocked && (
                    <span className="rounded bg-red-500/15 px-2 py-0.5 text-xs uppercase tracking-wide text-red-400">
                      Blocked
                    </span>
                  )}
                  {!isBlocked && bookings.length === 0 && (
                    <span className="text-xs text-faint">Free</span>
                  )}
                </div>
                <form action={toggleBlockedDay}>
                  <input type="hidden" name="day" value={day} />
                  <input type="hidden" name="blocked" value={String(isBlocked)} />
                  <button type="submit" className={aBtnGhost}>
                    {isBlocked ? (
                      <>
                        <Check size={14} /> Unblock
                      </>
                    ) : (
                      <>
                        <Ban size={14} /> Block day
                      </>
                    )}
                  </button>
                </form>
              </div>

              {bookings.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                  {bookings.map((b: Booking) => (
                    <li key={b.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[b.status] ?? 'bg-faint'}`} />
                      <span className="font-mono text-xs text-muted">{b.slot_time || '—'}</span>
                      <span className="text-ink">{b.name}</span>
                      {b.service && <span className="text-xs text-faint">· {b.service}</span>}
                      {b.contact && (
                        <a
                          href={`tel:${b.contact.replace(/[^\d+]/g, '')}`}
                          className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
                        >
                          <Phone size={11} /> {b.contact}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </AdminShell>
  );
}
