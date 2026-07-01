'use client';

import { useEffect, useState } from 'react';
import { Logo } from './Logo';

const REVEAL_MS = 900;
const HOLD_MS = 250;
const COLLAPSE_MS = 500;
const SESSION_KEY = 'bmw_preloaded';

export function Preloader() {
  const [anim, setAnim] = useState(false);
  const [collapse, setCollapse] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setHidden(true);
      return;
    }
    // Only play once per browser session.
    if (sessionStorage.getItem(SESSION_KEY)) {
      setHidden(true);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, '1');

    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => setAnim(true)); // start the logo unwrap
    const collapseTimer = window.setTimeout(() => {
      setCollapse(true); // collapse the overlay
      document.body.style.overflow = '';
    }, REVEAL_MS + HOLD_MS);
    const hideTimer = window.setTimeout(() => setHidden(true), REVEAL_MS + HOLD_MS + COLLAPSE_MS);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(collapseTimer);
      window.clearTimeout(hideTimer);
      document.body.style.overflow = '';
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      aria-hidden="true"
      className={`preloader fixed inset-x-0 top-0 z-[100] flex items-center justify-center overflow-hidden bg-graphite-900 transition-[height] duration-[500ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        collapse ? 'h-0' : 'h-[100dvh]'
      }`}
    >
      <div className={`preloader-logo ${anim ? 'is-anim' : ''}`}>
        <Logo className="h-16 w-auto md:h-24" />
      </div>

      {/* If JS is disabled, never trap the visitor behind the overlay. */}
      <noscript>
        <style>{`.preloader{display:none!important}`}</style>
      </noscript>
    </div>
  );
}
