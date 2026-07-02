'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Reveal } from './Reveal';

export function Faq() {
  const t = useTranslations('Faq');
  const FAQS = [1, 2, 3, 4, 5, 6].map((i) => ({
    q: t(`q${i}` as Parameters<typeof t>[0]),
    a: t(`a${i}` as Parameters<typeof t>[0]),
  }));
  const [open, setOpen] = useState<number | null>(0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <section className="relative border-t border-white/5 py-20 md:py-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
        }}
      />
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="grid grid-cols-12 gap-x-4 md:gap-x-10 gap-y-10">
          <Reveal className="col-span-12 md:col-span-4">
            <div className="mb-4 flex items-center gap-3">
              <span className="label">{t('eyebrow')}</span>
              <span className="m-stripe h-[2px] w-10" />
            </div>
            <h2 className="text-balance font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.9]">
              {t('heading1')} <br /> {t('heading2')}
            </h2>
          </Reveal>

          <div className="col-span-12 md:col-span-8">
            <ul className="border-t border-white/8">
              {FAQS.map((f, i) => {
                const isOpen = open === i;
                return (
                  <li key={i} className="border-b border-white/8">
                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-lg font-semibold text-ink">{f.q}</span>
                      <Plus
                        size={20}
                        className={`shrink-0 text-bmw transition-transform duration-300 ${
                          isOpen ? 'rotate-45' : ''
                        }`}
                      />
                    </button>
                    <div
                      className="grid transition-all duration-300 ease-out"
                      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                    >
                      <div className="overflow-hidden">
                        <p className="max-w-2xl pb-6 leading-relaxed text-muted">{f.a}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
