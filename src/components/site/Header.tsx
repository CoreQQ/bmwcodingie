'use client';

import { useEffect, useState } from 'react';
import { Logo } from './Logo';

const NAV = [
  { href: '#services', label: 'Services' },
  { href: '#work', label: 'Work' },
  { href: '#process', label: 'How it works' },
  { href: '#contact', label: 'Contact' },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {/* top hairline M-stripe */}
      <div className="m-stripe m-stripe-anim h-[3px] w-full" aria-hidden="true" />

      <div
        className={`transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/5 bg-graphite-900/85 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-edge items-center justify-between px-4 py-3 md:px-8 md:py-4">
          {/* Wordmark */}
          <a href="#top" className="group inline-flex items-center">
            <Logo className="h-16 w-auto md:h-20" />
          </a>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-9 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="nav-link font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink"
              >
                {n.label}
              </a>
            ))}
            <a href="#contact" className="btn-primary">
              Book now
            </a>
          </nav>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
            aria-label="Menu"
            aria-expanded={open}
          >
            <span
              className={`h-[2px] w-6 bg-ink transition-transform ${open ? 'translate-y-[7px] rotate-45' : ''}`}
            />
            <span className={`h-[2px] w-6 bg-ink transition-opacity ${open ? 'opacity-0' : ''}`} />
            <span
              className={`h-[2px] w-6 bg-ink transition-transform ${open ? '-translate-y-[7px] -rotate-45' : ''}`}
            />
          </button>
        </div>

        {/* Mobile drawer */}
        {open && (
          <nav className="border-t border-white/5 bg-graphite-900/95 px-5 pb-6 pt-2 backdrop-blur-xl md:hidden">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="block border-b border-white/5 py-4 font-mono text-sm uppercase tracking-widest text-muted"
              >
                {n.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="btn-primary mt-5 w-full"
            >
              Book now
            </a>
          </nav>
        )}
      </div>
    </header>
  );
}
