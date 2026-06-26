'use client';

import { Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing, LOCALE_LABELS } from '@/i18n/routing';

export function LanguageSwitcher({ mobile = false }: { mobile?: boolean }) {
  const t = useTranslations('Header');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const select = (
    <select
      value={locale}
      onChange={(e) => router.replace(pathname, { locale: e.target.value })}
      aria-label="Language"
      className={
        mobile
          ? 'bg-transparent font-mono text-sm uppercase tracking-widest text-ink outline-none'
          : 'border border-white/10 bg-transparent px-2 py-1.5 font-mono text-xs uppercase tracking-widest text-muted outline-none transition-colors hover:border-bmw hover:text-ink'
      }
    >
      {routing.locales.map((l) => (
        <option key={l} value={l} className="bg-graphite-800 text-ink">
          {LOCALE_LABELS[l]}
        </option>
      ))}
    </select>
  );

  if (!mobile) return select;

  return (
    <div className="flex items-center justify-between border-b border-white/5 py-4">
      <span className="flex items-center gap-2 font-mono text-sm uppercase tracking-widest text-muted">
        <Globe size={15} className="text-faint" /> {t('language')}
      </span>
      {select}
    </div>
  );
}
