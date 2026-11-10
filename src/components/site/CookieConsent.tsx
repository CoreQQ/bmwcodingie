'use client';

import { useEffect, useState } from 'react';
import { getStoredConsent, setStoredConsent, type ConsentStatus } from '@/lib/useCookieConsent';

export function CookieConsent({
  text,
  necessaryOnly,
  acceptAll,
}: {
  text: string;
  necessaryOnly: string;
  acceptAll: string;
}) {
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
      {/* Compact on a phone: at full size it covered 40% of the first screen
          and the Call / WhatsApp / Book bar. Both choices stay the same size. */}
      <div className="mx-auto flex max-w-edge flex-col items-start gap-2.5 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-4 md:px-8 md:py-5">
        <p className="max-w-2xl text-[12px] leading-snug text-muted md:text-sm md:leading-normal">{text}</p>
        <div className="grid w-full shrink-0 grid-cols-2 gap-2 md:flex md:w-auto md:gap-3">
          <button onClick={() => choose('rejected')} className="btn-ghost min-h-[40px] whitespace-nowrap px-3 py-2 text-[13px] md:min-h-[44px] md:px-6 md:py-3 md:text-sm">
            {necessaryOnly}
          </button>
          <button onClick={() => choose('accepted')} className="btn-primary min-h-[40px] whitespace-nowrap px-3 py-2 text-[13px] md:min-h-[44px] md:px-6 md:py-3 md:text-sm">
            {acceptAll}
          </button>
        </div>
      </div>
    </div>
  );
}
