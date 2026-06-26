'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS } from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <select
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value })}
      aria-label="Language"
      className="border border-white/10 bg-transparent px-2 py-1.5 font-mono text-xs uppercase tracking-widest text-muted outline-none transition-colors hover:border-bmw hover:text-ink"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l} className="bg-graphite-800 text-ink">
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );
}
