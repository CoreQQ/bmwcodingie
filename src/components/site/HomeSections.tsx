import { ArrowRight, Check, Gauge, Languages, LayoutGrid, MessageCircle, Smartphone, Sparkles, Stethoscope } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BLOG_POSTS } from '@/lib/blog';
import { waHref, waMessageFor } from '@/lib/waMessage';
import { FeatureCarousel, type FeatureSlide } from './FeatureCarousel';
import { OfferPrice } from './OfferPrice';

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

// Each tile has its own accent, picked from what the service is about (the
// amber of a warning light, the red of Japan…); green stays Android Auto's.
const POPULAR = [
  { key: 'carplay', href: '/apple-carplay-activation-dublin', wa: '/carplay', accent: '#5ac8fa', Icon: Smartphone },
  { key: 'japan', href: '/japan-import-bmw-conversion-ireland', wa: '/japan', accent: '#ff4d5e', Icon: Languages },
  { key: 'coding', href: '/bmw-coding-dublin', wa: '/', accent: '#a78bfa', Icon: Sparkles },
  { key: 'idrive', href: '/bmw-id4-to-id6-upgrade', wa: '/idrive', accent: '#4f8cff', Icon: LayoutGrid },
  { key: 'cluster', href: '/bmw-6wa-to-6wb-retrofit', wa: '/6wb', accent: '#2dd4bf', Icon: Gauge },
  { key: 'diagnostics', href: '/bmw-diagnostics-dublin', wa: '/diagnostics', accent: '#ffb020', Icon: Stethoscope },
] as const;

/** "From €150" → a small "From" and a big "€150"; anything without an amount
 *  ("Quoted per car") stays one modest line. */
function TilePrice({ text }: { text: string }) {
  const at = text.indexOf('€');
  if (at < 0) return <p className="font-display text-xl leading-tight text-ink">{text}</p>;
  const lead = text.slice(0, at).trim();
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      {lead && <span className="text-sm text-muted">{lead}</span>}
      <span className="font-display text-[2.6rem] font-bold leading-none text-white">
        <OfferPrice text={text.slice(at)} />
      </span>
    </p>
  );
}

export async function PopularServices({ whatsapp }: { whatsapp: string }) {
  const [t, tf, tj] = await Promise.all([
    getTranslations('Popular'),
    getTranslations('Featured'),
    getTranslations('Japan'),
  ]);
  // Eyebrows and ticks reuse the carousel's translated lines where they exist.
  const copy: Record<(typeof POPULAR)[number]['key'], { eyebrow: string; points: string[]; price: string }> = {
    carplay: { eyebrow: tf('carplayEyebrow'), points: [tf('carplayI1'), tf('carplayI2'), tf('carplayI3')], price: t('carplayPrice') },
    japan: { eyebrow: tj('eyebrow'), points: [tj('i1'), tj('i2'), tj('i4')], price: t('japanPrice') },
    coding: { eyebrow: tf('codingEyebrow'), points: [tf('codingI1'), tf('codingI2'), tf('codingI6')], price: t('codingPrice') },
    // €50, as on the ID6 page and in the calculator (usually done with CarPlay).
    idrive: { eyebrow: t('idriveEyebrow'), points: [t('idriveI1'), t('idriveI2'), t('idriveI3')], price: '€50' },
    cluster: { eyebrow: t('clusterEyebrow'), points: [t('clusterI1'), t('clusterI2'), t('clusterI3')], price: tf('retrofitsPrice') },
    diagnostics: { eyebrow: tf('diagEyebrow'), points: [tf('diagI1'), tf('diagI3'), tf('diagI5')], price: tf('diagPrice') },
  };
  return (
    <section id="services" className="relative border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <SectionHead eyebrow={t('eyebrow')} heading={t('heading')} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POPULAR.map(({ key, href, wa, accent, Icon }) => {
            const c = copy[key];
            const title = t(`${key}Title`);
            return (
              <article
                key={key}
                className="relative flex flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#0d1013]/80 p-6 backdrop-blur-sm transition-colors duration-200 hover:border-white/20 md:p-7"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0"
                  style={{ background: `radial-gradient(75% 55% at 100% 0%, ${accent}24, transparent 70%)` }}
                />
                <div className="relative flex flex-1 flex-col">
                  <p className="flex items-center gap-2.5">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#0b0d10]" style={{ background: accent }}>
                      <Icon size={15} strokeWidth={2.4} aria-hidden="true" />
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{c.eyebrow}</span>
                  </p>
                  <h3 className="mt-4 text-balance font-display text-[1.75rem] leading-[1.05] text-white">{title}</h3>
                  <p className="mt-1.5 font-display text-base leading-snug" style={{ color: accent }}>
                    {t(`${key}Desc`)}
                  </p>
                  <ul className="mt-5 grid gap-2">
                    {c.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-ink">
                        <Check size={16} className="mt-0.5 shrink-0" style={{ color: accent }} /> {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto pt-6">
                    <TilePrice text={c.price} />
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Link href={href} className="btn-ghost px-3 text-[13px]">
                      {t('moreInfo')}
                      {/* "More info" ×6 is meaningless out of context (screen readers, link lists, search engines). */}
                      <span className="sr-only"> — {title}</span>
                    </Link>
                    <a
                      href={waHref(whatsapp, waMessageFor(wa))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary px-3 text-[13px]"
                    >
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-muted">
          {t('allPrices')}{' '}
          <Link href="/bmw-coding-price-calculator" className="text-bmw underline underline-offset-2 hover:text-ink">
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
