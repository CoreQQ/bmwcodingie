'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

function NavItem({
  href,
  className,
  onClick,
  children,
}: {
  href: string;
  className: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  // Section anchors live on the homepage — prefix them with "/" so the nav
  // works from every page (service landings, blog, find-us, …). On the
  // homepage itself "/#section" still just scrolls.
  const target = href.startsWith('#') ? `/${href}` : href;
  return (
    <Link href={target} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

export function Header() {
  const t = useTranslations('Header');
  const NAV = [
    { href: '#services', label: t('navServices') },
    { href: '#process', label: t('navHowItWorks') },
    { href: '#work', label: t('navWork') },
    { href: '/models', label: t('navCheckModel') },
    { href: '#contact', label: t('navContact') },
  ];
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
      <div className="m-stripe h-[3px] w-full" aria-hidden="true" />

      <div
        className={`transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/5 bg-graphite-900/85 backdrop-blur-xl'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-edge items-center justify-between px-4 py-3 md:px-8 md:py-4">
          {/* Wordmark */}
          <Link href="/" className="group inline-flex items-center">
            <Logo className="h-16 w-auto md:h-20" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-9 md:flex">
            {NAV.map((n) => (
              <NavItem
                key={n.href}
                href={n.href}
                className="nav-link font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:text-ink"
              >
                {n.label}
              </NavItem>
            ))}
            <LanguageSwitcher />
            <Link href="/#contact" className="btn-primary">
              {t('bookNow')}
            </Link>
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

        {/* Mobile drawer — grid-rows trick animates open/close smoothly */}
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden"
          style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <nav
              className={`border-t border-white/5 bg-graphite-900/95 px-5 pb-6 pt-2 backdrop-blur-xl transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
              aria-hidden={!open}
            >
              {NAV.map((n) => (
                <NavItem
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-white/5 py-4 font-mono text-sm uppercase tracking-widest text-muted"
                >
                  {n.label}
                </NavItem>
              ))}
              <LanguageSwitcher mobile />
              <Link
                href="/#contact"
                onClick={() => setOpen(false)}
                className="btn-primary mt-5 w-full"
              >
                {t('bookNow')}
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
