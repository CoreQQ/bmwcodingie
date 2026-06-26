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
    default: 'BMW Coding Dublin | Coding, Diagnostics & Retrofits — BMW Coding IE',
    template: '%s | BMW Coding Dublin',
  },
  description:
    'BMW coding Dublin — ISTA diagnostics, coding and retrofits, in person or remotely over ENET. CarPlay, Android Auto, ambient lighting, cruise control, Japan→EU conversions. F and G series.',
  keywords: [
    'BMW coding Dublin',
    'BMW coding dublin ireland',
    'BMW diagnostics Dublin',
    'mobile BMW coding Ireland',
    'BMW retrofit Dublin',
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
    siteName: 'BMW Coding Dublin',
    title: 'BMW Coding Dublin — Coding, Diagnostics & Retrofits | BMW Coding IE',
    description:
      'Dealer-level BMW coding Dublin — diagnostics and retrofits, in person or remotely over ENET. F and G series.',
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: 'BMW Coding Dublin — BMW Coding IE',
    alternateName: 'BMW Coding IE',
    description:
      'BMW coding Dublin — diagnostics and retrofit team serving Dublin and surrounding counties, in person or remotely over ENET.',
    slogan: 'Dealer-level BMW coding, diagnostics and retrofits in Dublin',
    url: SITE_URL,
    telephone: settings.phone,
    email: settings.email,
    image: `${SITE_URL}/og.jpg`,
    priceRange: '€€',
    areaServed: [
      { '@type': 'City', name: 'Dublin' },
      { '@type': 'AdministrativeArea', name: 'County Dublin' },
      { '@type': 'AdministrativeArea', name: 'Kildare' },
      { '@type': 'AdministrativeArea', name: 'Wicklow' },
      { '@type': 'AdministrativeArea', name: 'Meath' },
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
          itemOffered: { '@type': 'Service', name: s.title, areaServed: 'Dublin' },
        })),
      ),
    },
    sameAs: settings.instagram
      ? [`https://instagram.com/${settings.instagram.replace(/^@/, '')}`]
      : [],
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
