'use client';

import Script from 'next/script';
import { getStoredConsent, useCookieConsent } from '@/lib/useCookieConsent';

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
const CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;

export function GoogleAdsTag() {
  const consent = useCookieConsent();
  if (!ADS_ID || consent !== 'accepted') return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${ADS_ID}');
        `}
      </Script>
    </>
  );
}

/** Fire a Google Ads conversion. No-ops if the tag isn't configured/loaded. */
export function trackGoogleConversion(value?: number) {
  if (!ADS_ID || !CONVERSION_LABEL || getStoredConsent() !== 'accepted') return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.('event', 'conversion', {
    send_to: `${ADS_ID}/${CONVERSION_LABEL}`,
    ...(value !== undefined ? { value, currency: 'EUR' } : {}),
  });
}
