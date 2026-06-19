'use client';

import { useEffect, useState } from 'react';

export type ConsentStatus = 'pending' | 'accepted' | 'rejected';

const KEY = 'bmw_cookie_consent';

export function getStoredConsent(): ConsentStatus {
  if (typeof window === 'undefined') return 'pending';
  const v = window.localStorage.getItem(KEY);
  return v === 'accepted' || v === 'rejected' ? v : 'pending';
}

export function setStoredConsent(status: 'accepted' | 'rejected') {
  window.localStorage.setItem(KEY, status);
  window.dispatchEvent(new CustomEvent('cookieconsent', { detail: status }));
}

/** Reactive read of consent status — updates live when the banner is answered. */
export function useCookieConsent(): ConsentStatus {
  const [status, setStatus] = useState<ConsentStatus>('pending');

  useEffect(() => {
    setStatus(getStoredConsent());
    const onChange = (e: Event) => {
      setStatus((e as CustomEvent<ConsentStatus>).detail);
    };
    window.addEventListener('cookieconsent', onChange);
    return () => window.removeEventListener('cookieconsent', onChange);
  }, []);

  return status;
}
