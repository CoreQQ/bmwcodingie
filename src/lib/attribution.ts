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
const LANDING_KEY = 'bmw_landing';
const START_KEY = 'bmw_session_start';

/** Parse the current URL and remember where the visitor came from. */
export function captureAttribution() {
  try {
    // Remember the first page the visitor landed on (intent signal) and when
    // this session started, so we can report how long they browsed.
    if (!sessionStorage.getItem(LANDING_KEY)) {
      sessionStorage.setItem(LANDING_KEY, window.location.pathname.slice(0, 120));
    }
    if (!sessionStorage.getItem(START_KEY)) {
      sessionStorage.setItem(START_KEY, String(Date.now()));
    }
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

/** The first page this visitor landed on, e.g. "/apple-carplay-activation-dublin". */
export function getLanding(): string | undefined {
  try {
    return sessionStorage.getItem(LANDING_KEY) || undefined;
  } catch {
    return undefined;
  }
}

/** Seconds since this browsing session started, as a "3m 20s" label. */
export function getTimeOnSite(): string | undefined {
  try {
    const start = Number(sessionStorage.getItem(START_KEY));
    if (!start) return undefined;
    const secs = Math.max(0, Math.round((Date.now() - start) / 1000));
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const rem = secs % 60;
    return rem ? `${m}m ${rem}s` : `${m}m`;
  } catch {
    return undefined;
  }
}
