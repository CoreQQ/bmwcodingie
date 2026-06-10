'use client';

import { useEffect, useState } from 'react';

export function Preloader() {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Honour reduced-motion: skip the loader entirely.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHidden(true);
      return;
    }

    document.body.style.overflow = 'hidden';

    const DURATION = 1500;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min((now - start) / DURATION, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setCount(Math.round(eased * 100));
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDone(true); // start slide-up
        document.body.style.overflow = '';
        window.setTimeout(() => setHidden(true), 750);
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = '';
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden="true"
      className={`preloader fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-graphite-900 transition-transform duration-[750ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        done ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="blueprint absolute inset-0 opacity-40" />
      <div className="absolute inset-0 hero-glow opacity-70" />

      <div className="relative flex flex-col items-center gap-6">
        <span className="label text-faint">BMW Coding IE</span>
        <span className="font-display text-[clamp(4rem,18vw,11rem)] leading-none tracking-tight text-ink tabular-nums">
          {String(count).padStart(2, '0')}
        </span>
        <div className="h-[3px] w-[min(70vw,420px)] overflow-hidden bg-graphite-600">
          <div className="m-stripe h-full" style={{ width: `${count}%` }} />
        </div>
      </div>

      {/* If JS is disabled, never trap the visitor behind the overlay. */}
      <noscript>
        <style>{`.preloader{display:none!important}`}</style>
      </noscript>
    </div>
  );
}
