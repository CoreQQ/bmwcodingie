import type { Metadata } from 'next';
import { Bebas_Neue, Manrope } from 'next/font/google';
import './globals.css';
import { getSettings } from '@/lib/data';

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

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'BMW Coding IE — Mobile BMW Coding, Diagnostics & Retrofits in Dublin',
    template: '%s · BMW Coding IE',
  },
  description:
    'Mobile BMW coding, ISTA diagnostics and retrofits across Dublin. CarPlay, Android Auto, ambient lighting, cruise control, Japan→EU conversions. I come to you.',
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IE',
    url: SITE_URL,
    siteName: 'BMW Coding IE',
    title: 'BMW Coding IE — Mobile BMW Coding & Retrofits in Dublin',
    description:
      'Dealer-level BMW coding, diagnostics and retrofits at your door across Dublin and the surrounding counties.',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'BMW Coding IE' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BMW Coding IE — Mobile BMW Coding & Retrofits in Dublin',
    description: 'Mobile BMW coding, diagnostics and retrofits across Dublin.',
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
      'Mobile BMW coding, diagnostics and retrofit specialist serving Dublin and surrounding counties.',
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
