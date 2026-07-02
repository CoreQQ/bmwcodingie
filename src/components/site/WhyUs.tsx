import { getTranslations } from 'next-intl/server';
import type { SiteSettings } from '@/lib/types';
import { Reveal } from './Reveal';
import { GlowCard } from './GlowCard';

const TOOLING = ['ISTA / Rheingold', 'E-Sys + PSdZData', 'BimmerCode', 'FA / VO coding', 'ENET / OBD'];

export async function WhyUs({ settings }: { settings: SiteSettings }) {
  const t = await getTranslations('WhyUs');
  const PLATFORMS = [
    { gen: 'F-series', detail: t('platformFSeriesDetail') },
    { gen: 'G-series', detail: t('platformGSeriesDetail') },
  ];
  return (
    <section id="about" className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="grid grid-cols-12 gap-x-4 md:gap-x-10 gap-y-14">
          {/* Left: statement */}
          <div className="col-span-12 lg:col-span-7">
            <div className="mb-4 flex items-center gap-3">
              <span className="label max-w-[140px] break-words">{t('eyebrow')}</span>
              <span className="m-stripe h-[2px] w-10" />
            </div>
            <h2 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">
              {t('heading1')} <br />
              <span className="text-bmw">{t('heading2')}</span>
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">{settings.about_text}</p>

            <div className="mt-10 grid grid-cols-1 gap-px bg-white/8 sm:grid-cols-3">
              <Stat n="F·G" label={t('statGenerations')} accent="text-m-blue" />
              <Stat n="2 ways" label={t('statFormat')} accent="text-m-dark-blue" />
              <Stat n="Live" label={t('statLive')} accent="text-m-red" />
            </div>
          </div>

          {/* Right: tooling + platforms */}
          <div className="col-span-12 lg:col-span-5 lg:pt-16">
            <Reveal>
              <GlowCard className="border border-white/10 bg-graphite-800/50 p-7">
                <h3 className="label mb-5">{t('equipment')}</h3>
                <div className="flex flex-wrap gap-2">
                  {TOOLING.map((tool) => (
                    <span
                      key={tool}
                      className="border border-white/10 px-3 py-1.5 font-mono text-xs text-muted"
                    >
                      {tool}
                    </span>
                  ))}
                </div>

                <h3 className="label mb-4 mt-8">{t('supportedPlatforms')}</h3>
                <ul className="divide-y divide-white/5">
                  {PLATFORMS.map((p) => (
                    <li key={p.gen} className="flex items-baseline justify-between gap-4 py-3">
                      <span className="font-display text-xl tracking-wide text-ink">{p.gen}</span>
                      <span className="text-right text-xs text-muted">{p.detail}</span>
                    </li>
                  ))}
                </ul>
              </GlowCard>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label, accent = 'text-ink' }: { n: string; label: string; accent?: string }) {
  return (
    <GlowCard className="bg-graphite-900 p-5">
      <div className={`font-display text-4xl leading-none ${accent}`}>{n}</div>
      <div className="label mt-2">{label}</div>
    </GlowCard>
  );
}
