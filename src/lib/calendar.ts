import { createHash } from 'crypto';
import type { Booking } from './types';

// Stable secret token for the private calendar feed, derived from the admin
// session secret — no extra env var to configure.
export function calendarToken(): string {
  const secret = process.env.ADMIN_SESSION_SECRET || 'dev-secret';
  return createHash('sha256').update(`${secret}:calendar-feed`).digest('hex').slice(0, 32);
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// Minimal Europe/Dublin timezone definition so local times render correctly.
const VTIMEZONE = `BEGIN:VTIMEZONE
TZID:Europe/Dublin
BEGIN:DAYLIGHT
TZOFFSETFROM:+0000
TZOFFSETTO:+0100
TZNAME:IST
DTSTART:19700329T010000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0100
TZOFFSETTO:+0000
TZNAME:GMT
DTSTART:19701025T020000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE`;

/** Builds an iCalendar document from confirmed slot bookings. */
export function buildIcs(bookings: Booking[]): string {
  const events = bookings
    .filter((b) => b.slot_date)
    .map((b) => {
      const day = (b.slot_date as string).replace(/-/g, '');
      const m = /^(\d{2}):(\d{2})[–—-](\d{2}):(\d{2})$/.exec(b.slot_time || '');
      const [h1, m1, h2, m2] = m ? [m[1], m[2], m[3], m[4]] : ['09', '00', '10', '00'];
      const title = `BMW Coding — ${b.name}${b.service ? ` · ${b.service}` : ''}`;
      const descParts = [
        b.bmw_model && `Car: ${b.bmw_model}`,
        b.contact && `Contact: ${b.contact}`,
        b.message && `Notes: ${b.message}`,
      ].filter(Boolean) as string[];
      return [
        'BEGIN:VEVENT',
        `UID:booking-${b.id}@bmwcoding.ie`,
        `DTSTART;TZID=Europe/Dublin:${day}T${h1}${m1}00`,
        `DTEND;TZID=Europe/Dublin:${day}T${h2}${m2}00`,
        `SUMMARY:${esc(title)}`,
        descParts.length ? `DESCRIPTION:${esc(descParts.join('\n'))}` : '',
        'END:VEVENT',
      ]
        .filter(Boolean)
        .join('\r\n');
    });

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BMW Coding IE//Bookings//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:BMW Coding — Bookings',
    'X-WR-TIMEZONE:Europe/Dublin',
    VTIMEZONE,
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}
