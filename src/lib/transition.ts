// The Greenogue workshop is gone: the business is mobile now. We come to the
// customer, or work remotely over ENET. Everything that mentions an address or
// a "come to us" option checks here, so there is one place to change if a unit
// is ever taken again.

/** First day with no workshop. Dublin date, ISO. */
export const MOBILE_ONLY_FROM = '2026-09-20';

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
