'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/attribution';
import { trackMetaEvent } from './MetaPixel';
import { getStoredConsent } from '@/lib/useCookieConsent';

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

// Captures ad attribution on landing and fires contact-intent events when a
// visitor taps WhatsApp or the phone number — the two conversions that happen
// OFF the site and would otherwise be invisible to the ad platforms.
export function Attribution() {
  useEffect(() => {
    captureAttribution();

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a');
      if (!a?.href) return;
      const isWhatsApp = /wa\.me|api\.whatsapp\.com/.test(a.href);
      const isCall = a.href.startsWith('tel:');
      if (!isWhatsApp && !isCall) return;

      if (getStoredConsent() !== 'accepted') return;
      // Google Ads: a lightweight event, importable as a conversion action.
      const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
      if (ADS_ID) gtag?.('event', isWhatsApp ? 'whatsapp_click' : 'call_click');
      // Meta: standard Contact event.
      trackMetaEvent('Contact', { method: isWhatsApp ? 'whatsapp' : 'call' });
    };

    document.addEventListener('click', onClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}
