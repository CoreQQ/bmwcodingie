import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Manrope } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { getLocale, getTranslations } from 'next-intl/server';
import './globals.css';
import { getCatalog, getSettings } from '@/lib/data';
import { MetaPixel } from '@/components/site/MetaPixel';
import { GoogleAdsTag } from '@/components/site/GoogleAdsTag';
import { CookieConsent } from '@/components/site/CookieConsent';
import { VisitorPing } from '@/components/site/VisitorPing';

const bebas = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bmwcoding.ie';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'BMW Coding Dublin & Ireland | Coding, Diagnostics & Retrofits',
    template: '%s | BMW Coding',
  },
  description:
    'BMW coding in Dublin and across Ireland — ISTA diagnostics, coding and retrofits. In person around Dublin, or remotely anywhere in Ireland (Cork, Waterford and beyond) over ENET. CarPlay, Android Auto, ambient lighting, cruise control, Japan→EU conversions. F and G series.',
  keywords: [
    'BMW coding Dublin',
    'BMW coding Ireland',
    'BMW coding Cork',
    'BMW coding Waterford',
    'BMW coding dublin ireland',
    'BMW diagnostics Dublin',
    'BMW diagnostics Ireland',
    'mobile BMW coding Ireland',
    'remote BMW coding Ireland',
    'BMW retrofit Dublin',
    'BMW retrofit Ireland',
    'CarPlay activation BMW',
    'ambient lighting retrofit BMW',
    'ISTA Rheingold',
    'E-Sys coding',
    'Japan to EU BMW conversion',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: SITE_URL,
    siteName: 'BMW Coding',
    title: 'BMW Coding — Coding, Diagnostics & Retrofits in Dublin & across Ireland',
    description:
      'Dealer-level BMW coding — diagnostics and retrofits, in person around Dublin or remotely anywhere in Ireland over ENET. F and G series.',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'BMW Coding Dublin — BMW Coding IE' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BMW Coding Dublin — Coding, Diagnostics & Retrofits',
    description: 'BMW coding Dublin — diagnostics and retrofits, in person or remote.',
    images: ['/og.jpg'],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, catalog, locale, tCookie] = await Promise.all([
    getSettings(),
    getCatalog(),
    getLocale(),
    getTranslations('CookieConsent'),
  ]);

  const sameAs = settings.instagram
    ? [`https://instagram.com/${settings.instagram.replace(/^@/, '')}`]
    : [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // WebSite entity — this is the primary signal Google uses to show
      // "BMW Coding" (not the bare domain) as the site name in results.
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
          addressLocality: 'Dublin',
          addressCountry: 'IE',
        },
        geo: { '@type': 'GeoCoordinates', latitude: 53.3498, longitude: -6.2603 },
        openingHoursSpecification: [
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            opens: '09:00',
            closes: '19:00',
          },
          {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: ['Saturday'],
            opens: '10:00',
            closes: '16:00',
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
      },
    ],
  };

  return (
    <html lang={locale} className={`${bebas.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased">
        <MetaPixel />
        <GoogleAdsTag />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
          }}
        />
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important;animation:none!important}`}</style>
        </noscript>
        {children}
        <VisitorPing />
        <CookieConsent
          text={tCookie('text')}
          necessaryOnly={tCookie('necessaryOnly')}
          acceptAll={tCookie('acceptAll')}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
