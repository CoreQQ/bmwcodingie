import { ArrowDown, MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { SiteSettings } from '@/lib/types';
import { waLink } from '@/lib/data';
import { HeroSpotlight } from './HeroSpotlight';
import { Parallax } from './Parallax';
import { GlowCard } from './GlowCard';

export async function Hero({ settings }: { settings: SiteSettings }) {
  const t = await getTranslations('Hero');
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Background: real workshop shot (duotone-dimmed) + blueprint grid +
          atmospheric blue glow + pointer spotlight. */}
      <div className="absolute inset-0 -z-10">
        <Parallax speed={0.32} className="absolute -inset-y-[18%] inset-x-0">
          <picture>
            <source media="(max-width: 640px)" srcSet="/hero-bg-mobile.jpg" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hero-bg.jpg"
              alt=""
              aria-hidden="true"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-45"
            />
          </picture>
        </Parallax>
        <div className="absolute inset-0 bg-gradient-to-r from-graphite-900/95 via-graphite-900/70 to-graphite-900/40" />
        <div className="blueprint absolute inset-0 opacity-40" />
        <div className="absolute inset-0 hero-glow" />
        <HeroSpotlight />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-graphite-900 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-graphite-900/80 to-transparent" />
      </div>

      <div className="mx-auto max-w-edge px-5 pb-16 pt-20 sm:pt-28 md:px-8 md:pb-28 md:pt-44">
        <div className="grid grid-cols-12 gap-y-12 md:gap-x-10">
          {/* Headline block — drifts against the bg for real depth */}
          <div className="col-span-12 lg:col-span-8">
            <Parallax speed={-0.06}>
            <div className="mb-7 flex items-center gap-3 reveal is-in">
              <span className="m-stripe h-[3px] w-12" />
              <span className="label text-muted">{t('eyebrow')}</span>
            </div>

            <h1 className="font-display text-[clamp(2.2rem,10vw,6.5rem)] leading-[0.86] tracking-tight">
              <span className="block animate-fade-up opacity-0" style={{ animationDelay: '0.05s' }}>
                {t('headline1')}
              </span>
              <span
                className="block animate-fade-up opacity-0"
                style={{ animationDelay: '0.13s' }}
              >
                <span className="text-bmw">{t('headline2')}</span>
              </span>
              <span
                className="block text-muted animate-fade-up opacity-0"
                style={{ animationDelay: '0.21s' }}
              >
                {t('headline3')}
              </span>
            </h1>

            <p
              className="mt-8 max-w-xl text-lg leading-relaxed text-muted animate-fade-up opacity-0"
              style={{ animationDelay: '0.3s' }}
            >
              {settings.hero_subtitle}
            </p>

            <div
              className="mt-10 flex flex-wrap items-center gap-4 animate-fade-up opacity-0"
              style={{ animationDelay: '0.38s' }}
            >
              <a href="#contact" className="btn-primary">
                {t('bookNow')}
              </a>
              <a href="#services" className="btn-ghost">
                {t('viewServices')}
              </a>
            </div>

            <a
              href="#services"
              className="mt-8 sm:mt-14 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-faint transition-colors hover:text-ink"
            >
              <ArrowDown size={14} className="animate-bounce" /> {t('scroll')}
            </a>
            </Parallax>
          </div>

          {/* Spec readout card — offset right */}
          <div className="col-span-12 lg:col-span-4 lg:pt-24">
            <GlowCard className="border border-white/10 bg-graphite-800">
              <div className="m-stripe h-1 w-full" />
              <div className="space-y-0 divide-y divide-white/5">
                <SpecRow k={t('specFormat')} v={t('specFormatValue')} />
                <SpecRow k={t('specCoverage')} v={t('specCoverageValue')} />
                <SpecRow k={t('specTooling')} v={t('specToolingValue')} />
                <SpecRow k={t('specPlatforms')} v={t('specPlatformsValue')} />
                <SpecRow k={t('specPayment')} v={t('specPaymentValue')} />
              </div>
              <div className="flex items-start gap-2 border-t border-white/10 px-5 py-4 text-sm text-muted">
                <MapPin size={15} className="mt-0.5 shrink-0 text-bmw" />
                <span>{settings.service_area}</span>
              </div>
            </GlowCard>

            <a
              href={waLink(settings.whatsapp, 'Hi — I have a BMW and I need coding.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block border border-white/10 px-5 py-3 text-center font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-bmw hover:text-ink"
            >
              {t('whatsappCta')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
      <span className="label">{k}</span>
      <span className="text-right text-sm text-ink">{v}</span>
    </div>
  );
}
