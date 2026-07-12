'use client';

import { useEffect, useRef, type ReactNode } from 'react';

// Lightweight scroll parallax: shifts children on scroll at a fraction of the
// scroll speed. rAF-throttled transforms only (no layout), applied after mount
// so SSR HTML never mismatches. Respects prefers-reduced-motion.
export function Parallax({
  speed = 0.15,
  className = '',
  children,
}: {
  /** 0–1: fraction of scroll delta applied. Positive = lags behind (depth). */
  speed?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;
    const host = el.parentElement ?? el;
    const update = () => {
      raf = 0;
      const rect = host.getBoundingClientRect();
      // Distance of the section's centre from the viewport centre.
      const offset = rect.top + rect.height / 2 - window.innerHeight / 2;
      el.style.transform = `translate3d(0, ${(offset * speed).toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  return (
    <div ref={ref} className={`will-change-transform ${className}`}>
      {children}
    </div>
  );
}
