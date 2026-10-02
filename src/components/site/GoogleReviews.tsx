import { Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getGoogleRating } from '@/lib/googleReviews';

function Stars({ rating, size = 15 }: { rating: number; size?: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex gap-0.5" aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= full ? 'fill-bmw text-bmw' : 'text-graphite-500'} />
      ))}
    </div>
  );
}

/**
 * The live Google Maps rating bar with a few of Google's own review picks.
 * Renders nothing until the Places key and Place ID are configured, or if
 * Google does not answer — never a stale or made-up number.
 */
export async function GoogleReviews() {
  const g = await getGoogleRating();
  if (!g) return null;
  const t = await getTranslations('GoogleReviews');
  const shown = g.reviews.slice(0, 6);

  return (
    <section id="google-reviews" className="relative border-t border-white/5 py-14 md:py-20">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="flex flex-col gap-5 border border-white/10 bg-graphite-800/60 p-5 md:flex-row md:items-center md:justify-between md:p-7">
          <div className="flex items-center gap-5">
            <span className="font-display text-6xl leading-none text-ink">{g.rating.toFixed(1)}</span>
            <div>
              <Stars rating={g.rating} size={18} />
              <p className="mt-2 text-sm text-muted">{t('count', { count: g.count })}</p>
            </div>
          </div>
          {g.mapsUrl && (
            <a href={g.mapsUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost justify-center">
              {t('seeAll')}
            </a>
          )}
        </div>

        {shown.length > 0 && (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {shown.map((r, i) => (
              <figure key={i} className="flex flex-col border border-white/10 bg-graphite-800/40 p-5">
                <Stars rating={r.rating} />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  “{r.text.length > 240 ? `${r.text.slice(0, 237).trimEnd()}…` : r.text}”
                </blockquote>
                <figcaption className="mt-4 text-[12px] text-faint">
                  {r.authorUrl ? (
                    <a href={r.authorUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ink">
                      {r.author}
                    </a>
                  ) : (
                    r.author
                  )}
                  {r.when ? ` · ${r.when}` : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        )}

        {/* Google requires its content to be attributed. */}
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-faint">{t('attribution')}</p>
      </div>
    </section>
  );
}
