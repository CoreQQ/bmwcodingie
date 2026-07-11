import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getCatalog, getReviews, getSettings } from '@/lib/data';
import { CookieConsent } from '@/components/site/CookieConsent';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables static rendering for everything under [locale]: getLocale() (used
  // by getSettings/getCatalog and the client provider) reads from this store
  // instead of request headers, so the pages can be prerendered and cached.
  setRequestLocale(locale);

  const [settings, catalog, reviews, tCookie] = await Promise.all([
    getSettings(),
    getCatalog(),
    getReviews(),
    getTranslations('CookieConsent'),
  ]);

  const sameAs = [
    settings.instagram ? `https://instagram.com/${settings.instagram.replace(/^@/, '')}` : null,
    settings.telegram ? `https://t.me/${settings.telegram.replace(/^@/, '')}` : null,
  ].filter(Boolean) as string[];

  // Only emit rating data when there are real reviews — never fabricate it.
  const ratingData =
    reviews.length > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (
              reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
            ).toFixed(1),
            reviewCount: reviews.length,
            bestRating: 5,
          },
          review: reviews.slice(0, 8).map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.author },
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
            reviewBody: r.body,
          })),
        }
      : {};

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // WebSite entity — the primary signal Google uses to show "BMW Coding"
      // (not the bare domain) as the site name in results.
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'BMW Coding',
        alternateName: ['BMW Coding IE', 'BMW Coding Dublin'],
        url: SITE_URL,
        publisher: { '@id': `${SITE_URL}/#business` },
      },
      {
        '@type': 'AutoRepair',
        '@id': `${SITE_URL}/#business`,
        name: 'BMW Coding',
        alternateName: ['BMW Coding IE', 'BMW Coding Dublin'],
        description:
          'BMW coding, diagnostics and retrofit team — in person around Dublin and surrounding counties, or remotely anywhere in Ireland over ENET.',
        slogan: 'Dealer-level BMW coding, diagnostics and retrofits — Dublin and across Ireland',
        url: SITE_URL,
        telephone: settings.phone,
        email: settings.email,
        image: `${SITE_URL}/og.jpg`,
        logo: `${SITE_URL}/logo.png`,
        priceRange: '€€',
        areaServed: [
          { '@type': 'City', name: 'Dublin' },
          { '@type': 'City', name: 'Cork' },
          { '@type': 'City', name: 'Waterford' },
          { '@type': 'AdministrativeArea', name: 'County Dublin' },
          { '@type': 'AdministrativeArea', name: 'Kildare' },
          { '@type': 'AdministrativeArea', name: 'Wicklow' },
          { '@type': 'AdministrativeArea', name: 'Meath' },
          { '@type': 'Country', name: 'Ireland' },
        ],
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Grants View, Greenogue Business Park',
          addressLocality: 'Rathcoole',
          addressRegion: 'Co. Dublin',
          addressCountry: 'IE',
        },
        geo: { '@type': 'GeoCoordinates', latitude: 53.3000625, longitude: -6.4818572 },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '19:00',
            closes: '23:00',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Saturday', 'Sunday'],
            opens: '11:00',
            closes: '23:00',
          },
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'BMW coding & retrofit services',
          itemListElement: catalog.flatMap((cat) =>
            cat.services.map((s) => ({
              '@type': 'Offer',
              itemOffered: { '@type': 'Service', name: s.title, areaServed: 'Ireland' },
            })),
          ),
        },
        sameAs,
        ...ratingData,
      },
    ],
  };

  return (
    <NextIntlClientProvider>
      {/* The <html> element is rendered statically as lang="en" in the root
          layout; correct it to the active locale on the client for a11y/SEO. */}
      {locale !== 'en' && (
        <script
          dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(locale)}` }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
        }}
      />
      {children}
      <CookieConsent
        text={tCookie('text')}
        necessaryOnly={tCookie('necessaryOnly')}
        acceptAll={tCookie('acceptAll')}
      />
    </NextIntlClientProvider>
  );
}
