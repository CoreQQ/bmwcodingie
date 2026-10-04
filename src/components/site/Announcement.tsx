'use client';

import { useEffect, useState } from 'react';
import { Truck, X } from 'lucide-react';

// Bump when the wording changes so a dismissal never hides a newer notice.
const KEY = 'bmw-notice-mobile-live';

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
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(KEY) !== 'seen') setShow(true);
    } catch {
      setShow(true); // storage blocked — better shown than silently hidden
    }
  }, []);

  // A fixed card would sit on top of whatever the visitor is reading, so it
  // only shows at the top of the page and gets out of the way on scroll.
  useEffect(() => {
    if (!show) return;
    // Lets the home hero make room for the card instead of sliding under it.
    document.documentElement.dataset.notice = '1';
    const onScroll = () => setAtTop(window.scrollY < 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      delete document.documentElement.dataset.notice;
    };
  }, [show]);

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
    <div
      className={`pointer-events-none fixed inset-x-0 top-[76px] z-40 px-3 transition-all duration-300 md:top-[116px] md:px-8 ${
        atTop ? 'opacity-100' : '-translate-y-3 opacity-0'
      }`}
      aria-hidden={!atTop}
    >
      <div className={`${atTop ? 'pointer-events-auto' : ''} mx-auto flex max-w-edge items-start gap-3 rounded-[16px] border border-white/15 bg-[rgba(12,15,20,0.88)] px-4 py-3 shadow-lg backdrop-blur-md md:p-4`}>
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
