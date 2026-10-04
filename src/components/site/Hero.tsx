import { Check, MessageCircle, ScanSearch } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { SiteSettings } from '@/lib/types';
import { WA_DEFAULT_MESSAGE, waHref } from '@/lib/waMessage';

// First screen per the owner's brief: what we do, the services in one line,
// two actions (check your BMW, or WhatsApp), and four reasons to trust it.
// Prices start two blocks down, on the service cards.
export async function Hero({ settings }: { settings: SiteSettings }) {
  const t = await getTranslations('Hero');
  const benefits = [t('benefit1'), t('benefit2'), t('benefit3'), t('benefit4')];

  return (
    <section id="top" className="relative overflow-hidden">
      {/* No background of its own: the site-wide photo shows through, which
          is the whole point of the glass direction. */}
      <div className="mx-auto max-w-edge px-5 pb-14 pt-24 sm:pt-28 md:px-8 md:pb-24 md:pt-40">
        <div className="max-w-3xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="m-stripe h-[3px] w-12" />
            <span className="label text-muted">{t('eyebrow')}</span>
          </div>

          <h1 className="font-display text-[clamp(2.1rem,7.4vw,4.4rem)]">
            <span className="block">{t('title1')}</span>
            <span className="block text-[#9cc7ff]">{t('title2')}</span>
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
