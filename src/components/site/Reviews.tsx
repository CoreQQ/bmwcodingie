import { Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Review } from '@/lib/types';
import { Reveal } from './Reveal';

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, rating));
  return (
    <div className="flex gap-0.5" aria-label={`${r} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={15}
          className={i <= r ? 'fill-bmw text-bmw' : 'text-graphite-500'}
        />
      ))}
    </div>
  );
}

export async function Reviews({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;
  const t = await getTranslations('Reviews');

  const avg = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;

  return (
    <section id="reviews" className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <Reveal className="mb-12 grid grid-cols-12 items-end gap-6">
          <div className="col-span-12 md:col-span-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="label">{t('eyebrow')}</span>
              <span className="m-stripe h-[2px] w-10" />
            </div>
            <h2 className="text-balance font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.9]">{t('heading')}</h2>
          </div>
          <div className="col-span-12 md:col-span-4 md:text-right">
            <div className="flex items-center gap-3 md:justify-end">
              <Stars rating={Math.round(avg)} />
              <span className="font-display text-2xl text-ink">{avg.toFixed(1)}</span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {t('count', { n: reviews.length })}
            </p>
          </div>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="flex flex-col border border-white/8 bg-graphite-800/40 p-5">
              <Stars rating={r.rating} />
              <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                “{r.body}”
              </blockquote>
              <figcaption className="mt-4 border-t border-white/5 pt-3">
                <span className="block text-sm font-semibold text-ink">{r.author}</span>
                {r.car && (
                  <span className="font-mono text-[11px] uppercase tracking-wider text-faint">{r.car}</span>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
