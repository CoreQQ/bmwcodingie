import SEASON_DATES from './season-dates.json';
import { NOV11 } from './season';

/**
 * 11.11 is a booking-day offer: whoever books on 11 November gets the
 * discount on work done any day up to 26 November. By the time the job is
 * done the day is long gone (and the site no longer shows the offer), so a
 * booking made that day carries a note of it — in the database and in the
 * Telegram card. Checked against the real date, not the build's season, so
 * it holds even if the redeploy on the day is late.
 */
export function withOfferNote(message: string, now = new Date()): string {
  const today = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });
  const [from, to] = SEASON_DATES.nov11;
  if (today < from || today > to) return message;
  const note = `🛍️ 11.11 offer: booked on 11 Nov — ${NOV11.pct}% off the work (not the call-out) if done by ${NOV11.doneBy}`;
  return message ? `${message}\n${note}` : note;
}
