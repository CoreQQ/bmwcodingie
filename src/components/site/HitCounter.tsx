'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

// Counts every page view without cookies or storage (lib/hits.ts) — the
// consent-gated VisitorPing only sees visitors who accept cookies. Sends the
// path, the referring site's name and the campaign tag; nothing else.
export function HitCounter() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!pathname || /^\/(admin|miniapp)/.test(pathname)) return;
    let ref = '';
    try {
      ref = document.referrer ? new URL(document.referrer).hostname : '';
    } catch {
      ref = '';
    }
    // A visit starts on the first page of a load that came from outside the
    // site; moving between pages afterwards is a page view, not a new visit.
    const landing = first.current && !ref.endsWith('bmwcoding.ie');
    first.current = false;
    let utm = '';
    try {
      utm = new URLSearchParams(window.location.search).get('utm_source') || '';
    } catch {
      utm = '';
    }
    const body = JSON.stringify({ path: pathname, ref: landing ? ref : '', utm: landing ? utm : '', landing });
    try {
      if (!navigator.sendBeacon?.('/api/hit', new Blob([body], { type: 'text/plain' }))) {
        void fetch('/api/hit', { method: 'POST', body, keepalive: true }).catch(() => undefined);
      }
    } catch {
      /* never let counting break the page */
    }
  }, [pathname]);

  return null;
}
