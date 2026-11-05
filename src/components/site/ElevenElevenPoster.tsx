import { MessageCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PRICE_ITEMS } from '@/lib/pricing';
import { NOV11, NOV11_ON, offerPrice } from '@/lib/season';
import { waHref } from '@/lib/waMessage';

// The 11.11 poster under the home hero (owner, 5 Nov): one day to book, 10%
// off the work, the job done any day until 26 November. Three real jobs at
// the offer price make the number concrete; they come from pricing.ts, so the
// poster can never disagree with the calculator.

const ACCENT = '#ff7a1a';

export async function ElevenElevenPoster({ whatsapp }: { whatsapp: string }) {
  if (!NOV11_ON) return null;
  const t = await getTranslations('ElevenEleven');
  const nbt = (id: string, fallback: number) => PRICE_ITEMS.find((i) => i.id === id)?.price['nbt-evo'] ?? fallback;
  const examples = [
    { label: t('exCarplay'), was: nbt('carplay', 150) },
    { label: t('exJapan'), was: nbt('japan', 250) },
    { label: t('exId6'), was: nbt('id6', 300) },
  ];

  return (
    <section id="eleven-eleven" className="relative border-t border-white/5 py-12 md:py-16">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="relative overflow-hidden rounded-[28px] border bg-black" style={{ borderColor: `${ACCENT}66` }}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: `radial-gradient(55% 70% at 0% 0%, ${ACCENT}2e, transparent 70%)` }}
          />
          <div className="relative grid gap-8 p-6 md:grid-cols-12 md:items-center md:gap-10 md:p-10">
            <div className="min-w-0 md:col-span-7">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                {t('posterDates')}
              </p>
              {/* The size sits on the inner span: globals.css caps every h2.font-display. */}
              <h2 className="mt-3 font-display font-bold tracking-[-0.03em] text-white">
                <span className="block text-[clamp(4.4rem,22vw,9rem)] leading-[0.86]">11.11</span>
                <span className="mt-1 block text-[clamp(2.6rem,12vw,5rem)] leading-[0.9]" style={{ color: ACCENT }}>
                  −{NOV11.pct}%
                </span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted">{t('posterSub')}</p>
            </div>

            <div className="min-w-0 md:col-span-5">
              <div className="rounded-[22px] border border-white/10 bg-[#111316] p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{t('examplesLabel')}</p>
                <ul className="mt-3 divide-y divide-white/10">
                  {examples.map((e) => (
                    <li key={e.label} className="flex items-baseline justify-between gap-3 py-2.5">
                      <span className="min-w-0 text-sm text-ink">{e.label}</span>
                      <span className="shrink-0 whitespace-nowrap font-display text-white">
                        <s className="mr-2 text-sm text-faint decoration-2" style={{ textDecorationColor: ACCENT }}>
                          €{e.was}
                        </s>
                        <span className="text-2xl font-bold">€{offerPrice(e.was)}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href="#contact" className="btn-primary">
                    {t('book')}
                  </a>
                  <a href={waHref(whatsapp, t('waMessage'))} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                    <MessageCircle size={15} /> {t('whatsapp')}
                  </a>
                </div>
              </div>
              <p className="mt-3 text-[10px] leading-snug text-faint">{t('finePrint')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
