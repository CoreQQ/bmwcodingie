import { MessageCircle, Wifi } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { PRICE_ITEMS } from '@/lib/pricing';
import { BF, BF_ON, offerPrice } from '@/lib/season';
import { waHref } from '@/lib/waMessage';

// The Black Friday "poster" under the home hero: one loud statement (−10% on
// every job done 27–30 Nov) and one concrete deal (CarPlay at the offer price
// with the Wi-Fi antenna fitted free). Prices come from pricing.ts, so the
// poster can never disagree with the calculator.

const ACCENT = '#ffd23f';

export async function BlackFridayPoster({ whatsapp }: { whatsapp: string }) {
  if (!BF_ON) return null;
  const t = await getTranslations('BlackFriday');
  const carplay = PRICE_ITEMS.find((i) => i.id === 'carplay')?.price;
  const nbt = carplay?.['nbt-evo'] ?? 150;
  const mgu = carplay?.mgu ?? 220;

  return (
    <section id="black-friday" className="relative border-t border-white/5 py-12 md:py-16">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="relative overflow-hidden rounded-[28px] border bg-black" style={{ borderColor: `${ACCENT}66` }}>
          {/* Hazard-tape diagonals: the one decorative move, kept faint. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: `repeating-linear-gradient(135deg, ${ACCENT}0d 0 14px, transparent 14px 28px)` }}
          />
          <div className="relative grid gap-8 p-6 md:grid-cols-12 md:items-center md:gap-10 md:p-10">
            <div className="min-w-0 md:col-span-7">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: ACCENT }}>
                {t('posterDates')}
              </p>
              <h2 className="mt-3 font-display text-[clamp(3rem,11vw,6.2rem)] font-bold uppercase leading-[0.86] tracking-[-0.03em] text-white">
                Black
                <br />
                Friday
                <span className="mt-1 block" style={{ color: ACCENT }}>
                  −{BF.pct}%
                </span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted">{t('posterSub')}</p>
            </div>

            <div className="min-w-0 md:col-span-5">
              <div className="rounded-[22px] border border-white/10 bg-[#111316] p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{t('carplayLabel')}</p>
                <p className="mt-2 flex flex-wrap items-baseline gap-x-3 font-display text-white">
                  <span className="text-6xl font-bold leading-none">€{offerPrice(nbt)}</span>
                  <s className="text-2xl text-faint decoration-2" style={{ textDecorationColor: ACCENT }}>
                    €{nbt}
                  </s>
                </p>
                <p className="mt-2 text-sm text-muted">{t('carplayMgu', { now: offerPrice(mgu), was: mgu })}</p>
                <p className="mt-4 flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-semibold text-black" style={{ background: ACCENT }}>
                  <Wifi size={18} className="shrink-0" aria-hidden="true" />
                  {t('antenna')}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href="#contact" className="btn-primary">
                    {t('book')}
                  </a>
                  <a href={waHref(whatsapp, t('waMessage'))} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                    <MessageCircle size={15} /> {t('whatsapp')}
                  </a>
                </div>
              </div>
              <p className="mt-3 text-[12px] leading-relaxed text-faint">{t('finePrint')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
