import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ArrowRight, Clock } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { getSettings } from '@/lib/data';
import { BLOG_POSTS } from '@/lib/blog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'BMW Coding Guides | CarPlay, Hidden Features & Remote Coding',
  description:
    'Practical guides on BMW coding: CarPlay activation on NBT Evo and MGU, the best hidden features for F-series cars, and how remote ENET coding works.',
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/blog`,
    siteName: 'BMW Coding',
    title: 'BMW Coding Guides',
    description: 'Practical guides on BMW coding, CarPlay activation and remote ENET sessions.',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'BMW Coding guides' }],
  },
};

function fmtDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default async function BlogIndex({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await getSettings();

  return (
    <div className="grain relative min-h-screen">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-white/5 pb-14 pt-28 md:pb-20 md:pt-40">
          <div className="absolute inset-0 -z-10">
            <div className="blueprint absolute inset-0 opacity-60" />
            <div className="absolute inset-0 hero-glow" />
          </div>
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="m-stripe h-[3px] w-12" />
              <span className="label text-muted">Guides · BMW Coding</span>
            </div>
            <h1 className="max-w-3xl font-display text-[clamp(2.2rem,7vw,4.5rem)] leading-[0.95]">
              BMW Coding Guides
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Practical, honest write-ups from actual jobs — what can be coded, what it involves and
              what to skip. No fluff.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {BLOG_POSTS.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col border border-white/8 bg-graphite-800/40 transition-colors hover:border-bmw/50"
                >
                  <div className="m-stripe h-1 w-full" />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-wider text-faint">
                      <span>{fmtDate(p.date)}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {p.readMinutes} min
                      </span>
                    </div>
                    <h2 className="mt-3 font-display text-2xl leading-tight text-ink">{p.title}</h2>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{p.description}</p>
                    <span className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-bmw">
                      Read guide <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
    </div>
  );
}
