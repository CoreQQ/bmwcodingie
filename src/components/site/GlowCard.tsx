'use client';

import { useRef, type ReactNode } from 'react';

// Wraps content in a container whose border area glows around the cursor
// (see .glow-card in globals.css). Works inside server components.
export function GlowCard({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'figure';
}) {
  const ref = useRef<HTMLElement | null>(null);

  function onMove(e: React.MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }

  const Comp = Tag as 'div';
  return (
    <Comp ref={ref as React.Ref<HTMLDivElement>} onMouseMove={onMove} className={`glow-card ${className}`}>
      {children}
    </Comp>
  );
}
