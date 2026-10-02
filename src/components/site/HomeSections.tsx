import { ArrowRight, Check, MessageCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { BLOG_POSTS } from '@/lib/blog';
import { waHref, waMessageFor } from '@/lib/waMessage';

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
  { key: 'idrive', href: '/bmw-retrofits-dublin', wa: '/idrive', priced: false },
  { key: 'cluster', href: '/bmw-retrofits-dublin', wa: '/6wb', priced: false },
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

export async function JapanSection() {
  const t = await getTranslations('Japan');
  const items = ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7'].map((k) => t(k));
  return (
    <section id="japan" className="relative border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="grid gap-10 border border-white/10 bg-graphite-800/40 p-6 md:grid-cols-12 md:p-10">
          <div className="md:col-span-6">
            <span className="label text-bmw">{t('eyebrow')}</span>
            <h2 className="mt-3 font-display text-[clamp(2.2rem,6vw,4rem)] leading-[0.92]">{t('heading')}</h2>
            <p className="mt-6 font-mono text-2xl text-bmw">{t('price')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#vin-check" className="btn-primary">{t('ctaCheck')}</a>
              <Link href="/japan-import-bmw-conversion-ireland" className="btn-ghost">{t('ctaBook')}</Link>
            </div>
          </div>
          <ul className="space-y-3 md:col-span-6">
            {items.map((i) => (
              <li key={i} className="flex items-start gap-3 text-ink">
                <Check size={17} className="mt-0.5 shrink-0 text-bmw" /> {i}
              </li>
            ))}
          </ul>
        </div>
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
