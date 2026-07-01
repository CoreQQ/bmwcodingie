import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Check, MessageCircle, ScanLine } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { getSettings, waLink } from '@/lib/data';
import { CODING_LIST, CODING_META } from '@/lib/codingList';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  return {
    title: CODING_META.title,
    description: CODING_META.description,
    alternates: { canonical: '/bmw-coding-list' },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/bmw-coding-list`,
      siteName: 'BMW Coding',
      title: CODING_META.title,
      description: CODING_META.description,
      images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'BMW coding list — BMW Coding IE' }],
    },
  };
}

export default async function CodingListPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await getSettings();
  const wa = waLink(settings.whatsapp, 'Hi — I’d like to know what you can code on my BMW. My car is a ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${SITE_URL}/bmw-coding-list#service`,
        name: 'BMW Coding & Hidden Features',
        serviceType: 'BMW coding',
        description: CODING_META.description,
        url: `${SITE_URL}/bmw-coding-list`,
        areaServed: ['Dublin', 'Kildare', 'Wicklow', 'Meath', 'Ireland'].map((name) => ({
          '@type': 'AdministrativeArea',
          name,
        })),
        provider: { '@type': 'AutoRepair', name: 'BMW Coding', url: SITE_URL },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'BMW Coding List', item: `${SITE_URL}/bmw-coding-list` },
        ],
      },
    ],
  };

  return (
    <div className="grain relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
        }}
      />
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5 pb-14 pt-28 md:pb-20 md:pt-40">
          <div className="absolute inset-0 -z-10">
            <div className="blueprint absolute inset-0 opacity-60" />
            <div className="absolute inset-0 hero-glow" />
          </div>
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-faint">
              <Link href="/" className="transition-colors hover:text-ink">Home</Link>
              <span>/</span>
              <span className="text-muted">BMW Coding List</span>
            </nav>
            <div className="mb-5 flex items-center gap-3">
              <span className="m-stripe h-[3px] w-12" />
              <span className="label text-muted">Coding reference · Dublin &amp; Ireland</span>
            </div>
            <h1 className="max-w-4xl font-display text-[clamp(2.1rem,6vw,4.2rem)] leading-[0.95]">
              BMW Coding List — What We Can Enable
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              A reference of the features and hidden functions we can typically code on BMW F- and
              G-series cars. What’s possible on yours depends on the model, year, head unit
              (NBT / NBT Evo / MGU) and installed hardware — so treat this as a menu, and we’ll
              confirm your exact car from the VIN.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/models" className="btn-primary inline-flex items-center gap-2">
                <ScanLine size={16} /> Check your car by VIN
              </Link>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center gap-2">
                <MessageCircle size={16} /> Ask about your BMW
              </a>
            </div>
          </div>
        </section>

        {/* Category grid */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {CODING_LIST.map((cat) => (
                <div key={cat.key} className="border border-white/8 bg-graphite-800/40">
                  <div className="m-stripe h-1 w-full" />
                  <div className="p-5">
                    <h2 className="font-display text-xl leading-tight text-ink">{cat.title}</h2>
                    <ul className="mt-4 space-y-2.5">
                      {cat.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-muted">
                          <Check size={15} className="mt-0.5 shrink-0 text-bmw" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-8 max-w-3xl text-sm leading-relaxed text-faint">
              Not on the list? Hidden features and bespoke coding are a normal part of the job — tell
              us the car and what you want, and we’ll say straight whether it’s possible. Some
              features need specific hardware or a retrofit; we confirm everything per car before any
              work starts.
            </p>

            {/* CTA band */}
            <div className="mt-12 border border-white/10 bg-graphite-800">
              <div className="m-stripe h-1 w-full" />
              <div className="flex flex-col items-start justify-between gap-5 p-7 md:flex-row md:items-center">
                <div>
                  <h2 className="font-display text-2xl text-ink">Tell us your BMW</h2>
                  <p className="mt-1 text-sm text-muted">Send your model, year and what you want — we’ll confirm what’s codable and the price.</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <Link href="/#contact" className="btn-primary">Book BMW Coding</Link>
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
    </div>
  );
}
