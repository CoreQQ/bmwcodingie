'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Re-fetches the server component on an interval and when the tab regains
// focus — the booking-status page updates live as the owner confirms.
export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') router.refresh();
    };
    const t = window.setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [router, intervalMs]);
  return null;
}
