'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS } from '@/i18n/routing';

export function LanguageSwitcher({ mobile = false }: { mobile?: boolean }) {
  const t = useTranslations('Header');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close the desktop dropdown on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Mobile (drawer): native select works best on touch.
  if (mobile) {
    return (
      <div className="flex items-center justify-between border-b border-white/5 py-4">
        <span className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-muted">
          <Globe size={15} className="text-faint" /> {t('language')}
        </span>
        <select
          value={locale}
          onChange={(e) => router.replace(pathname, { locale: e.target.value })}
          aria-label="Language"
          className="bg-transparent font-mono text-sm uppercase tracking-widest text-ink outline-none"
        >
          {routing.locales.map((l) => (
            <option key={l} value={l} className="bg-graphite-800 text-ink">
              {LOCALE_LABELS[l]}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Desktop: custom dropdown styled like the rest of the header.
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 border border-white/10 px-2.5 py-1.5 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-bmw hover:text-ink"
      >
        {LOCALE_LABELS[locale as keyof typeof LOCALE_LABELS] ?? locale}
        <ChevronDown size={12} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 top-full z-50 mt-2 min-w-[9rem] border border-white/10 bg-graphite-800 py-1 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.8)]"
        >
          {routing.locales.map((l) => {
            const active = l === locale;
            return (
              <li key={l} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    if (!active) router.replace(pathname, { locale: l });
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left font-mono text-xs uppercase tracking-widest transition-colors ${
                    active ? 'text-ink' : 'text-muted hover:bg-white/5 hover:text-ink'
                  }`}
                >
                  {LOCALE_LABELS[l]}
                  {active && <Check size={12} className="text-bmw" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
