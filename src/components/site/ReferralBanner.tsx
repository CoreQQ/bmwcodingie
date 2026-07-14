import { Gift } from 'lucide-react';
import { useTranslations } from 'next-intl';

// Referral promo: send a friend (€80+ job) → get 10% of their bill in cash.
export function ReferralBanner() {
  const t = useTranslations('Referral');
  return (
    <section className="relative border-t border-white/5">
      <div className="mx-auto max-w-edge px-5 py-14 md:px-8 md:py-16">
        <div className="relative overflow-hidden border border-bmw/30 bg-gradient-to-br from-bmw/15 via-graphite-800/80 to-graphite-900 p-6 md:p-10">
          <div className="m-stripe absolute left-0 top-0 h-full w-[3px]" />
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-bmw/40 bg-bmw/10">
                <Gift size={22} className="text-bmw" />
              </span>
              <div>
                <p className="label mb-2 text-bmw">{t('eyebrow')}</p>
                <h2 className="font-display text-3xl leading-none md:text-5xl">{t('heading')}</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t('text')}</p>
              </div>
            </div>
            <div className="shrink-0 border border-white/10 bg-graphite-900/80 px-6 py-5 text-center">
              <p className="font-display text-5xl leading-none text-bmw md:text-6xl">10%</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-faint">{t('badge')}</p>
            </div>
          </div>
          <p className="mt-6 text-[11px] leading-relaxed text-faint">{t('terms')}</p>
        </div>
      </div>
    </section>
  );
}
