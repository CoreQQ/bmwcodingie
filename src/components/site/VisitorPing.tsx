'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useCookieConsent } from '@/lib/useCookieConsent';

const SESSION_KEY = 'bmw_visitor_pinged';
const RETURNING_KEY = 'bmw_visitor_seen';

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

    const isReturning = localStorage.getItem(RETURNING_KEY) === '1';
    localStorage.setItem(RETURNING_KEY, '1');

    fetch('/api/visitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, referrer, device, isReturning }),
    }).catch(() => {});
  }, [consent, pathname]);

  return null;
}
