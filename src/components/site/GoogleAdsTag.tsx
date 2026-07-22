'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useCookieConsent } from '@/lib/useCookieConsent';

// Public measurement id (visible in any page source) — baked in so the tag
// works without env config; env var still wins if set.
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-17881862993';
const CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;

// Google Consent Mode v2: the tag loads for everyone with all storage DENIED
// by default (cookieless pings only — GDPR-safe, and Google's tag scanner can
// verify the installation). When the visitor accepts cookies, consent is
// updated and full conversion measurement kicks in.
export function GoogleAdsTag() {
  const consent = useCookieConsent();

  useEffect(() => {
    if (consent !== 'accepted') return;
    const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    gtag?.('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
    });
  }, [consent]);

  if (!ADS_ID) return null;

  return (
    <>
      <Script id="google-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied'
          });
          gtag('js', new Date());
          gtag('config', '${ADS_ID}');
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}

/** Fire a Google Ads conversion (modeled cookielessly pre-consent). */
export function trackGoogleConversion(value?: number) {
  if (!ADS_ID || !CONVERSION_LABEL) return;
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  gtag?.('event', 'conversion', {
    send_to: `${ADS_ID}/${CONVERSION_LABEL}`,
    ...(value !== undefined ? { value, currency: 'EUR' } : {}),
  });
}
