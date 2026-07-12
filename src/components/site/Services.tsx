import { getTranslations } from 'next-intl/server';
import type { CategoryWithServices } from '@/lib/types';
import { Reveal } from './Reveal';
import { Parallax } from './Parallax';
import { ServiceRows } from './ServiceRows';

export async function Services({ catalog }: { catalog: CategoryWithServices[] }) {
  const t = await getTranslations('Services');
  return (
    <section id="services" className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="mb-16 grid grid-cols-12 items-end gap-6">
          <div className="col-span-12 md:col-span-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="label">{t('eyebrow')}</span>
              <span className="m-stripe h-[2px] w-10" />
            </div>
            <Parallax speed={-0.07}><h2 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">
              {t('heading')}
            </h2></Parallax>
          </div>
          <p className="col-span-12 text-muted md:col-span-4 md:text-right">
            {t('intro')}
          </p>
        </div>

        <div className="space-y-12 md:space-y-16">
          {catalog.map((cat, ci) => (
            <div key={cat.id} className="grid grid-cols-12 gap-x-4 md:gap-x-8 gap-y-6">
              {/* Sticky category header (left rail) */}
              <div className="col-span-12 md:col-span-4">
                    <div className="md:sticky md:top-28">
                      <span className="font-display text-4xl md:text-6xl text-graphite-500">
                        {String(ci + 1).padStart(2, '0')}
                      </span>
                      <h3 className="mt-1 font-display text-2xl md:text-3xl leading-none tracking-wide text-ink">
                        {cat.name}
                      </h3>
                  <div className="m-stripe mt-4 h-[2px] w-16" />
                </div>
              </div>

              {/* Service rows (top 3 visible, rest expandable) */}
              <div className="col-span-12 md:col-span-8">
                <Reveal>
                  <ServiceRows
                    services={cat.services}
                    remoteOkLabel={t('remoteOk')}
                    showAllLabel={t('showAll')}
                    showLessLabel={t('showLess')}
                  />
                </Reveal>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-14 max-w-xl text-sm text-faint">{t('footnote')}</p>
      </div>
    </section>
  );
}
