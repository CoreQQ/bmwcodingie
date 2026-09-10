'use client';

import { useEffect, useState } from 'react';
import { Truck, X } from 'lucide-react';

// Bump when the wording changes so a dismissal never hides a newer notice.
const KEY = 'bmw-notice-mobile-2026-10';

/**
 * Site-wide notice about the move to a mobile-first service. Sits under the
 * fixed header as a floating card rather than a top bar, so no page's spacing
 * has to change, and it can be dismissed for good.
 */
export function Announcement({
  title,
  body,
  cta,
  href,
  dismissLabel,
}: {
  title: string;
  body: string;
  cta: string;
  href: string;
  dismissLabel: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== 'seen') setShow(true);
    } catch {
      setShow(true); // storage blocked — better shown than silently hidden
    }
  }, []);

  if (!show) return null;

  const close = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, 'seen');
    } catch {
      /* nothing to do */
    }
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[68px] z-40 px-3 md:top-[84px] md:px-8">
      <div className="pointer-events-auto mx-auto flex max-w-edge items-start gap-3 border border-bmw/40 bg-graphite-900/95 px-3 py-2.5 shadow-lg backdrop-blur md:p-4">
        <Truck size={18} className="mt-0.5 shrink-0 text-bmw" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug text-ink md:text-sm">{title}</p>
          {/* On a phone the full paragraph would bury the page's own headline,
              so the detail lives one tap away instead. */}
          <p className="mt-1 hidden text-[13px] leading-relaxed text-muted md:block">{body}</p>
          <a href={href} className="mt-1 inline-block text-[12px] font-semibold text-bmw hover:underline md:mt-2">
            {cta} →
          </a>
        </div>
        <button type="button" onClick={close} aria-label={dismissLabel} className="shrink-0">
          <X size={16} className="text-faint hover:text-ink" />
        </button>
      </div>
    </div>
  );
}
