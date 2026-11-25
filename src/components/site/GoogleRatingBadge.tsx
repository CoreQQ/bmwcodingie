import { Star } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getGoogleRating } from '@/lib/googleReviews';

/**
 * "★ 4.9 · 23 reviews on Google" under the hero buttons, linking to the
 * listing. The real numbers from Google (googleReviews.ts) or nothing at all —
 * never a typed-in rating.
 */
export async function GoogleRatingBadge() {
  const g = await getGoogleRating();
  if (!g) return null;
  const t = await getTranslations('GoogleReviews');
  const inner = (
    <>
      <Star size={15} className="fill-[#fbbc04] text-[#fbbc04]" aria-hidden="true" />
      <span className="font-semibold text-ink">{g.rating.toFixed(1)}</span>
      <span className="text-muted">· {t('count', { count: g.count })}</span>
    </>
  );
  return g.mapsUrl ? (
    <a
      href={g.mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3.5 py-1.5 text-sm backdrop-blur hover:border-white/30"
    >
      {inner}
    </a>
  ) : (
    <p className="mt-5 inline-flex items-center gap-1.5 text-sm">{inner}</p>
  );
}
