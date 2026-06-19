'use client';

import { useEffect, useState } from 'react';
import { getStoredConsent, setStoredConsent, type ConsentStatus } from '@/lib/useCookieConsent';

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<ConsentStatus>('pending');

  useEffect(() => {
    setMounted(true);
    setStatus(getStoredConsent());
  }, []);

  if (!mounted || status !== 'pending') return null;

  function choose(next: 'accepted' | 'rejected') {
    setStoredConsent(next);
    setStatus(next);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-graphite-900/97 backdrop-blur-sm">
      <div className="m-stripe h-[2px] w-full" />
      <div className="mx-auto flex max-w-edge flex-col items-start gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-8">
        <p className="max-w-2xl text-sm text-muted">
          We use cookies for analytics and ad measurement (Meta Pixel, Google Ads) so we can see
          what actually brings in enquiries. Decline and the site works exactly the same.
        </p>
        <div className="flex shrink-0 gap-3">
          <button onClick={() => choose('rejected')} className="btn-ghost whitespace-nowrap">
            Necessary only
          </button>
          <button onClick={() => choose('accepted')} className="btn-primary whitespace-nowrap">
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
