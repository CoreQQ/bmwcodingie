import { ArrowRight, Check, MessageCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BLOG_POSTS } from '@/lib/blog';
import { waHref, waMessageFor } from '@/lib/waMessage';
import { FeatureCarousel, type FeatureSlide } from './FeatureCarousel';

// The homepage blocks from the owner's brief, in one file because they share
// the same shape: an eyebrow, a heading and a grid. Every card ends in one of
// the three actions the site exists for — WhatsApp, the VIN check or booking.

function SectionHead({ eyebrow, heading, intro }: { eyebrow: string; heading: string; intro?: string }) {
  return (
    <div className="mb-10 max-w-3xl">
      <div className="mb-4 flex items-center gap-3">
        <span className="label">{eyebrow}</span>
        <span className="m-stripe h-[2px] w-10" />
      </div>
      <h2 className="text-balance font-display text-[clamp(2.2rem,6vw,4.4rem)] leading-[0.92]">{heading}</h2>
      {intro && <p className="mt-4 text-muted">{intro}</p>}
    </div>
  );
}

const POPULAR = [
  { key: 'carplay', href: '/apple-carplay-activation-dublin', wa: '/carplay', priced: true },
  { key: 'japan', href: '/japan-import-bmw-conversion-ireland', wa: '/japan', priced: true },
  { key: 'coding', href: '/bmw-coding-dublin', wa: '/', priced: true },
  { key: 'idrive', href: '/bmw-id4-to-id6-upgrade', wa: '/idrive', priced: false },
  { key: 'cluster', href: '/bmw-6wa-to-6wb-retrofit', wa: '/6wb', priced: false },
  { key: 'diagnostics', href: '/bmw-diagnostics-dublin', wa: '/diagnostics', priced: false },
] as const;

export async function PopularServices({ whatsapp }: { whatsapp: string }) {
  const t = await getTranslations('Popular');
  return (
    <section id="services" className="relative border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <SectionHead eyebrow={t('eyebrow')} heading={t('heading')} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR.map((s) => {
            const price = s.priced ? t(`${s.key}Price`) : '';
            return (
              <article key={s.key} className="flex flex-col border border-white/10 bg-graphite-800/50 p-6">
                <h3 className="font-display text-2xl leading-tight text-ink">{t(`${s.key}Title`)}</h3>
                <p className="mt-2 flex-1 text-sm text-muted">{t(`${s.key}Desc`)}</p>
                {price && <p className="mt-4 font-mono text-lg text-bmw">{price}</p>}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link href={s.href} className="btn-ghost justify-center text-[11px]">
                    {t('moreInfo')}
                  </Link>
                  <a
                    href={waHref(whatsapp, waMessageFor(s.wa))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary justify-center text-[11px]"
                  >
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-muted">
          {t('allPrices')}{' '}
          <Link href="/bmw-coding-price-calculator" className="text-bmw hover:underline">
            {t('calculator')} →
          </Link>
        </p>
      </div>
    </section>
  );
}

/** The big featured block, now a carousel of the main services. Japan → EU
 *  leads because it is the second-strongest page on the site. */
export async function FeaturedServices() {
  const tj = await getTranslations('Japan');
  const t = await getTranslations('Featured');
  const tp = await getTranslations('Popular');
  const list = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => t(`${prefix}${i + 1}`));
  const check = { label: tj('ctaCheck'), href: '#vin-check' };
  const slides: FeatureSlide[] = [
    {
      key: 'japan',
      eyebrow: tj('eyebrow'),
      heading: tj('heading'),
      price: tj('price'),
      items: ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7'].map((k) => tj(k)),
      primary: check,
      secondary: { label: tj('ctaBook'), href: '/japan-import-bmw-conversion-ireland' },
    },
    {
      key: 'carplay',
      eyebrow: t('carplayEyebrow'),
      heading: t('carplayHeading'),
      price: tp('carplayPrice'),
      items: list('carplayI', 6),
      primary: check,
      secondary: { label: t('carplayCta'), href: '/apple-carplay-activation-dublin' },
    },
    {
      key: 'coding',
      eyebrow: t('codingEyebrow'),
      heading: t('codingHeading'),
      price: tp('codingPrice'),
      items: list('codingI', 6),
      primary: check,
      secondary: { label: t('codingCta'), href: '/bmw-coding-dublin' },
    },
    {
      key: 'retrofits',
      eyebrow: t('retrofitsEyebrow'),
      heading: t('retrofitsHeading'),
      price: t('retrofitsPrice'),
      items: list('retrofitsI', 6),
      primary: check,
      secondary: { label: t('retrofitsCta'), href: '/bmw-retrofits-dublin' },
    },
    {
      key: 'diagnostics',
      eyebrow: t('diagEyebrow'),
      heading: t('diagHeading'),
      price: t('diagPrice'),
      items: list('diagI', 6),
      primary: check,
      secondary: { label: t('diagCta'), href: '/bmw-diagnostics-dublin' },
    },
  ];
  return (
    <section id="japan" className="relative border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <FeatureCarousel slides={slides} prevLabel={t('prev')} nextLabel={t('next')} />
      </div>
    </section>
  );
}

export async function HowItWorksSteps() {
  const t = await getTranslations('Steps');
  const steps = ['s1', 's2', 's3', 's4'].map((k) => t(k));
  return (
    <section id="process" className="relative border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <SectionHead eyebrow={t('eyebrow')} heading={t('heading')} />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s} className="border border-white/10 bg-graphite-800/40 p-5">
              <span className="font-mono text-2xl text-bmw">0{i + 1}</span>
              <p className="mt-3 text-ink">{s}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export async function WhyUs() {
  const t = await getTranslations('Why');
  const points = ['p1', 'p2', 'p3', 'p4', 'p5'].map((k) => ({ title: t(`${k}Title`), body: t(`${k}Body`) }));
  return (
    <section id="why" className="relative border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <SectionHead eyebrow={t('eyebrow')} heading={t('heading')} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {points.map((p) => (
            <div key={p.title} className="border border-white/10 bg-graphite-800/40 p-5">
              <h3 className="text-ink">{p.title}</h3>
              <p className="mt-2 text-sm text-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function Guides() {
  const t = await getTranslations('Guides');
  const posts = BLOG_POSTS.slice(0, 3);
  return (
    <section id="guides" className="relative border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <SectionHead eyebrow={t('eyebrow')} heading={t('heading')} />
        <div className="grid gap-4 md:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group flex flex-col border border-white/10 bg-graphite-800/40 p-5 hover:border-white/25">
              <h3 className="text-ink">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted">{p.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-bmw">
                {t('read')} <ArrowRight size={12} />
              </span>
            </Link>
          ))}
        </div>
        <Link href="/blog" className="mt-6 inline-block text-sm text-bmw hover:underline">{t('all')} →</Link>
      </div>
    </section>
  );
}
