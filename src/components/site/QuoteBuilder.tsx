'use client';

import { useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CategoryWithServices } from '@/lib/types';

function parsePrice(label: string): number | null {
  const m = label.match(/€\s?(\d+)/);
  return m ? Number(m[1]) : null;
}

export function QuoteBuilder({ catalog }: { catalog: CategoryWithServices[] }) {
  const t = useTranslations('QuoteBuilder');
  const allServices = useMemo(() => catalog.flatMap((c) => c.services), [catalog]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const chosen = allServices.filter((s) => selected.has(s.id));
  const total = chosen.reduce((sum, s) => sum + (parsePrice(s.price_label) ?? 0), 0);
  const hasCustom = chosen.some((s) => parsePrice(s.price_label) === null);

  function sendToBooking() {
    const titles = chosen.map((s) => s.title);
    const message = `I'd like a quote for: ${titles.join(', ')}.${
      hasCustom ? ' Some of these are priced on request — please confirm.' : ''
    }`;
    window.dispatchEvent(
      new CustomEvent('quote:apply', {
        detail: {
          service: chosen.length === 1 ? chosen[0].title : 'Multiple — see message',
          message,
        },
      }),
    );
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section id="quote" className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="mb-12 flex items-center gap-3">
          <span className="label">{t('eyebrow')}</span>
          <span className="m-stripe h-[2px] w-10" />
        </div>

        <div className="grid grid-cols-12 gap-x-4 md:gap-x-10 gap-y-10">
          <div className="col-span-12 lg:col-span-5">
            <h2 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.9]">
              {t('heading1')} <br /> {t('heading2')}
            </h2>
            <p className="mt-6 max-w-md text-muted">{t('intro')}</p>

            <div className="mt-9 border border-white/10 bg-graphite-800">
              <div className="m-stripe h-1 w-full" />
              <div className="p-6">
                <p className="label">{t('estimatedTotal')}</p>
                <p className="mt-2 font-display text-5xl text-bmw">
                  {chosen.length === 0 ? '€0' : `from €${total}`}
                </p>
                {hasCustom && (
                  <p className="mt-2 text-xs text-faint">{t('customNote')}</p>
                )}
                <button
                  onClick={sendToBooking}
                  disabled={chosen.length === 0}
                  className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 disabled:opacity-40"
                >
                  <Sparkles size={16} /> {t('sendToBooking')}
                </button>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7">
            <div className="max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
              {allServices.map((s) => {
                const isSelected = selected.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center justify-between gap-4 border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? 'border-bmw bg-bmw/10'
                        : 'border-white/8 hover:border-white/20'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center border ${
                          isSelected ? 'border-bmw bg-bmw' : 'border-white/20'
                        }`}
                      >
                        {isSelected && <Check size={12} className="text-white" />}
                      </span>
                      <span className="text-sm text-ink">{s.title}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted">{s.price_label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
