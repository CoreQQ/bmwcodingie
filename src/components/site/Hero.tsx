import { Check, MessageCircle, ScanSearch } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { SiteSettings } from '@/lib/types';
import { WA_DEFAULT_MESSAGE, waHref } from '@/lib/waMessage';
import { HeroSpotlight } from './HeroSpotlight';
import { Parallax } from './Parallax';

// First screen per the owner's brief: what we do, the services in one line,
// two actions (check your BMW, or WhatsApp), and four reasons to trust it.
// Prices start two blocks down, on the service cards.
export async function Hero({ settings }: { settings: SiteSettings }) {
  const t = await getTranslations('Hero');
  const benefits = [t('benefit1'), t('benefit2'), t('benefit3'), t('benefit4')];

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Parallax speed={0.24} className="absolute -inset-y-[14%] inset-x-0">
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
        <div className="absolute inset-0 bg-gradient-to-r from-graphite-900/95 via-graphite-900/75 to-graphite-900/40" />
        <div className="blueprint absolute inset-0 opacity-40" />
        <div className="absolute inset-0 hero-glow" />
        <HeroSpotlight />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-graphite-900 to-transparent" />
      </div>

      <div className="mx-auto max-w-edge px-5 pb-14 pt-24 sm:pt-28 md:px-8 md:pb-24 md:pt-40">
        <div className="max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="m-stripe h-[3px] w-12" />
            <span className="label text-muted">{t('eyebrow')}</span>
          </div>

          <h1 className="font-display text-[clamp(2.4rem,9vw,5.8rem)] leading-[0.9] tracking-tight">
            <span className="block">{t('title1')}</span>
            <span className="block text-bmw">{t('title2')}</span>
          </h1>

          <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.18em] text-ink sm:text-sm">
            {t('servicesLine')}
          </p>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{t('lead')}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#vin-check" className="btn-primary inline-flex items-center gap-2">
              <ScanSearch size={16} /> {t('ctaCheck')}
            </a>
            <a
              href={waHref(settings.whatsapp, WA_DEFAULT_MESSAGE)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost inline-flex items-center gap-2"
            >
              <MessageCircle size={16} /> {t('ctaWhatsapp')}
            </a>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:flex-wrap">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm text-ink">
                <Check size={15} className="shrink-0 text-bmw" /> {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
