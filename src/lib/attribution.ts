'use client';

// First-touch ad attribution: capture utm_* / gclid / fbclid from the landing
// URL and keep a compact "google / cpc / summer-sale" string so the booking
// that follows can be credited to the right channel.
//
// sessionStorage always (works within the visit, no persistence concerns);
// localStorage only after cookie consent, so attribution survives a return
// visit for consenting users.

import { getStoredConsent } from './useCookieConsent';

const KEY = 'bmw_attr';

/** Parse the current URL and remember where the visitor came from. */
export function captureAttribution() {
  try {
    const p = new URLSearchParams(window.location.search);
    let label = [p.get('utm_source'), p.get('utm_medium'), p.get('utm_campaign')]
      .filter(Boolean)
      .join(' / ');
    if (!label && p.get('gclid')) label = 'google ads (gclid)';
    if (!label && p.get('fbclid')) label = 'facebook (fbclid)';
    if (!label) return;
    label = label.slice(0, 160);

    // First touch wins — don't let a later direct visit overwrite the ad click.
    if (!sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, label);
    if (getStoredConsent() === 'accepted' && !localStorage.getItem(KEY)) {
      localStorage.setItem(KEY, label);
    }
  } catch {
    // storage unavailable — attribution is best-effort
  }
}

/** The stored attribution label, or undefined for direct/organic visits. */
export function getAttribution(): string | undefined {
  try {
    return sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || undefined;
  } catch {
    return undefined;
  }
}
