// The workshop lease at Greenogue ends on 30 September 2026. From the 1st the
// business is mobile-first: we come to the customer, or work remotely over
// ENET. Everything that mentions an address or a "come to us" option checks
// here, so the switch happens on its own rather than needing a deploy on the
// day.

/** First day with no workshop. Dublin date, ISO. */
export const MOBILE_ONLY_FROM = '2026-10-01';

/** Today in Dublin as YYYY-MM-DD (server-side only — never in a client render). */
export function dublinToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Dublin' });
}

/** True once the workshop is gone. */
export function isMobileOnly(): boolean {
  return dublinToday() >= MOBILE_ONLY_FROM;
}

/** Human date for the announcement, e.g. "1 October". */
export function mobileFromLabel(locale = 'en-IE'): string {
  return new Date(`${MOBILE_ONLY_FROM}T12:00:00`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
  });
}
