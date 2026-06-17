import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Manrope } from 'next/font/google';
import './globals.css';
import { getSettings } from '@/lib/data';
import { MetaPixel } from '@/components/site/MetaPixel';

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
    default: 'BMW Coding IE',
    template: '%s · BMW Coding IE',
  },
  description:
    'BMW coding, ISTA diagnostics and retrofits across Dublin — in person or remotely over ENET. CarPlay, Android Auto, ambient lighting, cruise control, Japan→EU conversions. F and G series.',
  keywords: [
    'BMW coding Dublin',
    'BMW diagnostics Dublin',
    'mobile BMW coding Ireland',
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
    siteName: 'BMW Coding IE',
    title: 'BMW Coding IE — BMW Coding & Retrofits in Dublin',
    description:
      'Dealer-level BMW coding, diagnostics and retrofits across Dublin — in person or remotely over ENET. F and G series.',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'BMW Coding IE' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BMW Coding IE — BMW Coding & Retrofits in Dublin',
    description: 'BMW coding, diagnostics and retrofits across Dublin — in person or remote.',
    images: ['/og.jpg'],
  },
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    name: 'BMW Coding IE',
    description:
      'BMW coding, diagnostics and retrofit team serving Dublin and surrounding counties — in person or remotely over ENET.',
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
    sameAs: settings.instagram
      ? [`https://instagram.com/${settings.instagram.replace(/^@/, '')}`]
      : [],
  };

  return (
    <html lang="en" className={`${bebas.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased">
        <MetaPixel />
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
      </body>
    </html>
  );
}
