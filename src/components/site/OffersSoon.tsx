import { CalendarClock, MessageCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { BF, BF_SOON, NOV11, NOV11_SOON } from '@/lib/season';
import { waHref } from '@/lib/waMessage';

// "Coming soon" cards for the offers ahead (owner, 5 Nov: people should see
// them before they start). Teasers only: prices elsewhere stay regular until
// the day, and the dates sit in small print under each card.

const NOV11_ACCENT = '#ff7a1a';
const BF_ACCENT = '#ffd23f';

function SoonChip({ label, accent }: { label: string; accent: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 self-start rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em]"
      style={{ borderColor: `${accent}80`, color: accent }}
    >
      <CalendarClock size={12} aria-hidden="true" /> {label}
    </span>
  );
}

export async function OffersSoon({ whatsapp }: { whatsapp: string }) {
  if (!NOV11_SOON && !BF_SOON) return null;
  const t = await getTranslations('OffersSoon');

  return (
    <section id="offers-soon" className="relative border-t border-white/5 py-12 md:py-16">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className={`grid gap-4 ${NOV11_SOON && BF_SOON ? 'md:grid-cols-2' : ''}`}>
          {NOV11_SOON && (
            <article className="relative flex flex-col overflow-hidden rounded-[24px] border bg-black p-6 md:p-8" style={{ borderColor: `${NOV11_ACCENT}55` }}>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ background: `radial-gradient(70% 70% at 0% 0%, ${NOV11_ACCENT}26, transparent 70%)` }}
              />
              <div className="relative flex flex-1 flex-col">
                <SoonChip label={t('label')} accent={NOV11_ACCENT} />
                {/* Sizes on the spans: globals.css caps every h3/h2.font-display. */}
                <h3 className="mt-4 font-display font-bold tracking-[-0.03em] text-white">
                  <span className="block text-[clamp(3.6rem,16vw,5.6rem)] leading-[0.86]">11.11</span>
                  <span className="mt-1 block text-[clamp(2.2rem,9vw,3.4rem)] leading-[0.9]" style={{ color: NOV11_ACCENT }}>
                    −{NOV11.pct}%
                  </span>
                </h3>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">{t('nov11Body')}</p>
                <div className="mt-auto pt-6">
                  <a href={waHref(whatsapp, t('nov11Wa'))} target="_blank" rel="noopener noreferrer" className="btn-ghost">
                    <MessageCircle size={15} /> {t('nov11Cta')}
                  </a>
                  <p className="mt-3 text-[10px] leading-snug text-faint">{t('nov11Fine')}</p>
                </div>
              </div>
            </article>
          )}

          {BF_SOON && (
            <article className="relative flex flex-col overflow-hidden rounded-[24px] border bg-black p-6 md:p-8" style={{ borderColor: `${BF_ACCENT}55` }}>
              {/* Hazard-tape diagonals, as on the Black Friday poster. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{ backgroundImage: `repeating-linear-gradient(135deg, ${BF_ACCENT}0d 0 14px, transparent 14px 28px)` }}
              />
              <div className="relative flex flex-1 flex-col">
                <SoonChip label={t('label')} accent={BF_ACCENT} />
                <h3 className="mt-4 font-display font-bold uppercase tracking-[-0.03em] text-white">
                  <span className="block text-[clamp(2.6rem,12vw,4.4rem)] leading-[0.86]">Black Friday</span>
                  <span className="mt-1 block text-[clamp(2.2rem,9vw,3.4rem)] leading-[0.9]" style={{ color: BF_ACCENT }}>
                    −{BF.pct}%
                  </span>
                </h3>
                <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">{t('bfBody')}</p>
                <div className="mt-auto pt-6">
                  <a href="#contact" className="btn-primary">
                    {t('bfCta')}
                  </a>
                  <p className="mt-3 text-[10px] leading-snug text-faint">{t('bfFine')}</p>
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </section>
  );
}
