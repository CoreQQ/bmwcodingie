import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ArrowRight, MapPin, Car, Wrench, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { MobileActionBar } from '@/components/site/MobileActionBar';
import { getSettings, waLink } from '@/lib/data';
import { SERVICE_NAV } from '@/lib/servicePages';
import { LOCATION_NAV } from '@/lib/locationPages';
import { CHASSIS_NAV } from '@/lib/chassisPages';
import { routing } from '@/i18n/routing';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';
const SLUG = 'bmw-coding-ireland';

const META_TITLE = 'BMW Coding Ireland | Every County & Model — CarPlay, Hidden Features';
const META_DESC =
  'BMW coding across Ireland — in person around Dublin, Kildare, Wicklow and Meath, and remote over ENET nationwide. Browse every county we cover and every BMW model we code.';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const url = `/${SLUG}`;
  const languages: Record<string, string> = Object.fromEntries(
    routing.locales.map((l) => [
      l,
      l === routing.defaultLocale ? `${SITE_URL}${url}` : `${SITE_URL}/${l}${url}`,
    ]),
  );
  languages['x-default'] = `${SITE_URL}${url}`;
  return {
    title: META_TITLE,
    description: META_DESC,
    alternates: { canonical: url, languages },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}${url}`,
      siteName: 'BMW Coding',
      title: META_TITLE,
      description: META_DESC,
      images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'BMW Coding Ireland' }],
    },
  };
}

// Service pages carry city/service names; strip the shared "BMW Coding " prefix
// for tidy chips.
const AREA_ALL = [{ slug: 'bmw-coding-dublin', label: 'Dublin' }, ...LOCATION_NAV];

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await getSettings();
  const wa = waLink(settings.whatsapp, 'Hi — I’d like BMW coding. My car is a ');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/${SLUG}#page`,
        name: META_TITLE,
        description: META_DESC,
        url: `${SITE_URL}/${SLUG}`,
        isPartOf: { '@id': `${SITE_URL}/#website` },
      },
      {
        '@type': 'ItemList',
        '@id': `${SITE_URL}/${SLUG}#areas`,
        name: 'Counties served for BMW coding',
        itemListElement: AREA_ALL.map((a, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `BMW Coding ${a.label}`,
          url: `${SITE_URL}/${a.slug}`,
        })),
      },
      {
        '@type': 'ItemList',
        '@id': `${SITE_URL}/${SLUG}#models`,
        name: 'BMW models coded',
        itemListElement: CHASSIS_NAV.map((c, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: `BMW ${c.label} Coding`,
          url: `${SITE_URL}/${c.slug}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'BMW Coding Ireland', item: `${SITE_URL}/${SLUG}` },
        ],
      },
    ],
  };

  const Section = ({
    icon,
    title,
    sub,
    items,
    cols,
  }: {
    icon: React.ReactNode;
    title: string;
    sub: string;
    items: { slug: string; label: string }[];
    cols: string;
  }) => (
    <section className="border-b border-white/5 py-14 md:py-16">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="mb-2 flex items-center gap-3">
          <span className="text-bmw">{icon}</span>
          <h2 className="font-display text-[clamp(1.8rem,4vw,2.8rem)] leading-tight">{title}</h2>
        </div>
        <p className="mb-8 max-w-2xl text-sm leading-relaxed text-muted">{sub}</p>
        <ul className={`grid gap-3 ${cols}`}>
          {items.map((it) => (
            <li key={it.slug}>
              <Link
                href={`/${it.slug}`}
                className="group flex items-center justify-between gap-2 border border-white/8 bg-graphite-800/40 px-4 py-3.5 text-sm text-muted transition-colors hover:border-bmw hover:text-ink"
              >
                <span>{it.label}</span>
                <ArrowRight size={14} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );

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
              <span className="text-muted">BMW Coding Ireland</span>
            </nav>
            <div className="mb-5 flex items-center gap-3">
              <span className="m-stripe h-[3px] w-12" />
              <span className="label text-muted">BMW Coding · All of Ireland</span>
            </div>
            <h1 className="max-w-4xl font-display text-[clamp(2.1rem,6vw,4.2rem)] leading-[0.95]">
              BMW Coding Ireland — Every County, Every Model
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              Independent BMW coding, diagnostics and retrofits the length of the country. In person
              around Dublin and the surrounding counties from our workshop off the N7, and remotely
              over ENET anywhere in Ireland. Find your county or your model below.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/#contact" className="btn-primary">Book BMW Coding</Link>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center gap-2">
                <MessageCircle size={16} /> WhatsApp Your BMW Details
              </a>
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-faint">
              <MapPin size={15} className="text-bmw" /> Greenogue Business Park, Rathcoole, Co. Dublin · off the N7
            </p>
          </div>
        </section>

        <Section
          icon={<MapPin size={22} />}
          title="BMW coding by county"
          sub="Dublin, Kildare, Wicklow, Meath and Louth are regular in-person areas; everywhere else is covered by remote ENET coding — same work, from your own driveway."
          items={AREA_ALL}
          cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        />

        <Section
          icon={<Car size={22} />}
          title="BMW coding by model"
          sub="Generation-specific pages with the years, head units and the coding owners ask for most on each chassis — from the F30 3 Series to the X5 and the M3/M4."
          items={CHASSIS_NAV.map((c) => ({ slug: c.slug, label: `BMW ${c.label}` }))}
          cols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        />

        <Section
          icon={<Wrench size={22} />}
          title="BMW coding services"
          sub="The full menu — CarPlay and Android Auto activation, diagnostics, retrofits, Japan-to-EU conversion, map updates and remote coding."
          items={SERVICE_NAV}
          cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        />

        {/* CTA */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <div className="border border-white/10 bg-graphite-800">
              <div className="m-stripe h-1 w-full" />
              <div className="flex flex-col items-start justify-between gap-5 p-7 md:flex-row md:items-center">
                <div>
                  <h2 className="font-display text-2xl text-ink">Not sure what your car supports?</h2>
                  <p className="mt-1 text-sm text-muted">Send your model, year and VIN — we’ll confirm exactly what’s possible before you book.</p>
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
      <MobileActionBar phone={settings.phone} whatsapp={settings.whatsapp} />
    </div>
  );
}
