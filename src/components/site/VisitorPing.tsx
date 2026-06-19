'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCookieConsent } from '@/lib/useCookieConsent';

const SESSION_KEY = 'bmw_visitor_pinged';

export function VisitorPing() {
  const pathname = usePathname();
  const consent = useCookieConsent();

  useEffect(() => {
    if (consent !== 'accepted') return;
    if (!pathname || pathname.startsWith('/admin')) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');

    const device = /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    let referrer: string | undefined;
    try {
      referrer = document.referrer ? new URL(document.referrer).hostname : undefined;
    } catch {
      referrer = undefined;
    }

    fetch('/api/visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer, device }),
    }).catch(() => {});
  }, [consent, pathname]);

  return null;
}
