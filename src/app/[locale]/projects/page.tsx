import type { Metadata } from 'next';
import Image from 'next/image';
import { setRequestLocale } from 'next-intl/server';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { MobileActionBar } from '@/components/site/MobileActionBar';
import { getGallery, getSettings, waLink } from '@/lib/data';
import { projectLinks } from '@/lib/projectLinks';
import { seoDescription, seoTitle } from '@/lib/seoText';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';
const TITLE = 'Real BMW Coding & Retrofit Projects | Ireland';
const DESC =
  'Photos of real BMW jobs we have completed in Ireland: Japan to EU conversions, CarPlay activations, ID6 updates, 6WB clusters and map updates — no stock images.';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: seoTitle(TITLE) },
  description: seoDescription(DESC),
  alternates: { canonical: '/projects' },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/projects`,
    siteName: 'BMW Coding',
    title: TITLE,
    description: seoDescription(DESC),
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'Real BMW coding projects' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: seoDescription(DESC), images: ['/og.jpg'] },
};

// Every job here is a real photo with the owner's own caption from the admin
// gallery. Model year, starting equipment and the customer's request are not
// recorded yet, so they are not shown — nothing is filled in by guesswork.
export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [settings, gallery] = await Promise.all([getSettings(), getGallery()]);
  const wa = waLink(settings.whatsapp, 'Hi — I saw your projects page. I would like the same for my BMW. It is a ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/projects#page`,
        url: `${SITE_URL}/projects`,
        name: TITLE,
        description: DESC,
        about: { '@id': `${SITE_URL}/#business` },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: gallery.map((g, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            item: { '@type': 'ImageObject', contentUrl: g.image_url, caption: g.caption || 'BMW coding project' },
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Real projects', item: `${SITE_URL}/projects` },
        ],
      },
    ],
  };

  return (
    <div className="grain relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e') }}
      />
      <Header />
      <main>
        <section className="notice-room relative overflow-hidden border-b border-white/5 pb-14 pt-28 md:pb-20 md:pt-40">
          <div className="absolute inset-0 -z-10">
            <div className="blueprint absolute inset-0 opacity-60" />
            <div className="absolute inset-0 hero-glow" />
          </div>
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-faint">
              <Link href="/" className="transition-colors hover:text-ink">Home</Link>
              <span>/</span>
              <span className="text-muted">Real projects</span>
            </nav>
            <h1 className="max-w-4xl font-display text-[clamp(2.1rem,6vw,4.2rem)] leading-[0.95]">Real BMW projects</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Jobs we have actually done on customers’ cars in Ireland — photographed on the day. Each one links to the
              service page that explains the work, the prices and what your car needs.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/#vin-check" className="btn-primary">Check my BMW</Link>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center gap-2">
                <MessageCircle size={16} /> WhatsApp us
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-edge px-5 md:px-8">
            {gallery.length === 0 ? (
              <p className="text-muted">Project photos are on their way.</p>
            ) : (
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((g, i) => {
                  const links = projectLinks(g.caption || '');
                  return (
                    <li key={g.id} className="flex flex-col overflow-hidden border border-white/8 bg-graphite-800/40">
                      <div className="relative aspect-[4/3] w-full">
                        <Image
                          src={g.image_url}
                          alt={g.caption || 'BMW coding project'}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover"
                          priority={i < 2}
                        />
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <h2 className="text-base font-semibold leading-snug text-ink">{g.caption || 'BMW project'}</h2>
                        {links.length > 0 && (
                          <ul className="mt-4 flex flex-wrap gap-2">
                            {links.map((l) => (
                              <li key={l.slug}>
                                <Link
                                  href={`/${l.slug}`}
                                  className="inline-flex items-center gap-1 border border-white/10 px-3 py-1.5 text-xs text-muted transition-colors hover:border-bmw hover:text-ink"
                                >
                                  {l.label} <ArrowRight size={12} />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="mt-12 border border-white/10 bg-graphite-800">
              <div className="m-stripe h-1 w-full" />
              <div className="flex flex-col items-start justify-between gap-5 p-7 md:flex-row md:items-center">
                <div>
                  <h2 className="font-display text-2xl text-ink">Want the same on your BMW?</h2>
                  <p className="mt-1 text-sm text-muted">Send the last 7 of your VIN — we reply with what your car supports and the price.</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <Link href="/#vin-check" className="btn-primary">Check my BMW</Link>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center gap-2">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer settings={settings} />
      <MobileActionBar phone={settings.phone} whatsapp={settings.whatsapp} />
    </div>
  );
}
