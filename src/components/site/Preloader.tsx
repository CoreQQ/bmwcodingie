'use client';

import { useEffect, useState } from 'react';
import { Logo } from './Logo';

const FILL_DURATION = 900;
const PAUSE_AFTER_FILL = 150;
const SLIDE_DURATION = 750;

export function Preloader() {
  const [filled, setFilled] = useState(false);
  const [slideUp, setSlideUp] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Honour reduced-motion: skip the loader entirely.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHidden(true);
      return;
    }

    document.body.style.overflow = 'hidden';

    const raf = requestAnimationFrame(() => setFilled(true));
    const slideTimer = window.setTimeout(() => {
      setSlideUp(true);
      document.body.style.overflow = '';
    }, FILL_DURATION + PAUSE_AFTER_FILL);
    const hideTimer = window.setTimeout(
      () => setHidden(true),
      FILL_DURATION + PAUSE_AFTER_FILL + SLIDE_DURATION,
    );

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(slideTimer);
      window.clearTimeout(hideTimer);
      document.body.style.overflow = '';
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden="true"
      className={`preloader fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-graphite-900 transition-transform duration-[750ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        slideUp ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="relative flex flex-col items-center gap-7">
        <Logo className="h-14 w-auto" />
        <div className="h-[3px] w-[min(60vw,280px)] overflow-hidden bg-graphite-600">
          <div
            className="m-stripe h-full transition-[width] duration-[900ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
            style={{ width: filled ? '100%' : '0%' }}
          />
        </div>
      </div>

      {/* If JS is disabled, never trap the visitor behind the overlay. */}
      <noscript>
        <style>{`.preloader{display:none!important}`}</style>
      </noscript>
    </div>
  );
}
