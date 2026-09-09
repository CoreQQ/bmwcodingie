'use client';

import { useEffect, useState } from 'react';
import { Phone, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { DEFAULT_HOURS, type HoursMap } from '@/lib/hours';

/** Dublin weekday + hour, wherever the visitor happens to be. */
function dublinNow(): { weekday: number; hour: number } {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Dublin' }));
  return { weekday: d.getDay(), hour: d.getHours() };
}

/** When the workshop opens next, or null if the hours map is empty. */
function nextOpening(hours: HoursMap): { days: number; hour: number } | null {
  const { weekday, hour } = dublinNow();
  for (let i = 0; i < 8; i++) {
    const range = hours[(weekday + i) % 7];
    if (!range) continue;
    if (i === 0 && hour >= range[0]) continue;
    return { days: i, hour: range[0] };
  }
  return null;
}

/**
 * A phone that rings out at 2am costs a customer for good: they assume nobody
 * is there and go elsewhere. Outside opening hours a call is intercepted and
 * the visitor is pointed at WhatsApp, which we answer either way.
 */
export function CallHours({ whatsapp }: { whatsapp: string }) {
  const t = useTranslations('CallHours');
  const locale = useLocale();
  const [hours, setHours] = useState<HoursMap>(DEFAULT_HOURS);
  const [open, setOpen] = useState(false);
  const [href, setHref] = useState('');

  // Live hours, so changing them in the Mini App also changes this.
  useEffect(() => {
    let alive = true;
    fetch('/api/slots')
      .then((r) => r.json())
      .then((d: { hours?: HoursMap }) => {
        if (alive && d.hours && typeof d.hours === 'object') setHours(d.hours);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a');
      if (!a?.href?.startsWith('tel:')) return;
      const { weekday, hour } = dublinNow();
      const range = hours[weekday];
      if (range && hour >= range[0] && hour < range[1]) return; // open — let it ring
      e.preventDefault();
      setHref(a.href);
      setOpen(true);
    };
    document.addEventListener('click', onClick, { capture: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, [hours]);

  if (!open) return null;

  const next = nextOpening(hours);
  const time = next ? `${String(next.hour).padStart(2, '0')}:00` : '';
  const day = next
    ? new Date(Date.now() + next.days * 86400000).toLocaleDateString(locale, { weekday: 'long' })
    : '';
  const digits = whatsapp.replace(/\D/g, '');
  const wa = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent('Hi — I tried to call. Could you help with BMW coding?')}`
    : '/#contact';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-sm border border-white/10 bg-graphite-900 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-bmw" />
            <span className="label">{t('title')}</span>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label={t('close')}>
            <X size={16} className="text-faint hover:text-ink" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted">{t('body')}</p>
        {next && (
          <p className="mt-2 text-[11px] text-faint">
            {next.days === 0 ? t('opensToday', { time }) : t('opensOn', { day, time })}
          </p>
        )}

        <a href={wa} className="btn-primary mt-4 w-full justify-center" onClick={() => setOpen(false)}>
          {t('whatsapp')}
        </a>
        <a href={href} className="btn-ghost mt-2 w-full justify-center" onClick={() => setOpen(false)}>
          {t('callAnyway')}
        </a>
      </div>
    </div>
  );
}
