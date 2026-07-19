'use client';

import { useEffect } from 'react';

// Measures how long each <section> is actually on screen and beacons the
// totals when the visitor leaves. Anonymous by design: no IP stored, no
// identifiers sent — just "section X was viewed N seconds on path Y".
export function SectionTime() {
  useEffect(() => {
    const secs = new Map<string, number>();
    const visible = new Map<Element, string>();
    const entered = new Map<Element, number>();

    const label = (el: Element, i: number): string => {
      const h = el.querySelector('h2, h1');
      const t = (h?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 36);
      return t || `section-${i}`;
    };

    const sections: Element[] = Array.from(document.querySelectorAll('section'));
    if (!sections.length) return;
    const labels = new Map<Element, string>(sections.map((el, i) => [el, label(el, i)]));

    const io = new IntersectionObserver(
      (entries) => {
        const now = performance.now();
        for (const e of entries) {
          if (e.isIntersecting) {
            visible.set(e.target, labels.get(e.target) || '');
            entered.set(e.target, now);
          } else if (visible.has(e.target)) {
            const from = entered.get(e.target);
            if (from) {
              const key = visible.get(e.target)!;
              secs.set(key, (secs.get(key) ?? 0) + (now - from) / 1000);
            }
            visible.delete(e.target);
            entered.delete(e.target);
          }
        }
      },
      { threshold: 0.4 },
    );
    sections.forEach((el) => io.observe(el));

    let sent = false;
    const flush = () => {
      if (sent) return;
      const now = performance.now();
      for (const [el, key] of visible) {
        const from = entered.get(el);
        if (from) secs.set(key, (secs.get(key) ?? 0) + (now - from) / 1000);
      }
      const payload: Record<string, number> = {};
      for (const [k, v] of secs) if (v >= 2) payload[k] = Math.min(1800, Math.round(v));
      if (!Object.keys(payload).length) return;
      sent = true;
      try {
        navigator.sendBeacon(
          '/api/section-time',
          new Blob([JSON.stringify({ path: location.pathname.slice(0, 120), secs: payload })], {
            type: 'application/json',
          }),
        );
      } catch { /* best-effort */ }
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flush);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    };
  }, []);
  return null;
}
