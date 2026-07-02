'use client';

import { useEffect, useRef } from 'react';

// A soft radial glow that follows the pointer across the hero. Desktop-only
// (pointer: fine); writes styles directly via rAF so mousemove never
// re-renders React.
export function HeroSpotlight() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia('(pointer: fine)').matches) return;
    const host = el.parentElement;
    if (!host) return;

    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = host.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) return;
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.opacity = '1';
        el.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(46,155,230,0.09), transparent 70%)`;
      });
    };
    const onLeave = () => {
      el.style.opacity = '0';
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    host.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      host.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
    />
  );
}
