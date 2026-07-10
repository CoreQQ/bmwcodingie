import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Manrope } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { MetaPixel } from '@/components/site/MetaPixel';
import { GoogleAdsTag } from '@/components/site/GoogleAdsTag';
import { Attribution } from '@/components/site/Attribution';
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

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Tints the mobile browser chrome to match the site's graphite background.
  themeColor: '#0A0B0D',
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
    title: 'BMW Coding IE — Coding, Diagnostics & Retrofits in Dublin',
    description:
      'Independent BMW coding team in Dublin. In-person and remote BMW coding, CarPlay activation, diagnostics, retrofits and Japan import conversions.',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'BMW Coding Dublin — BMW Coding IE' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BMW Coding Dublin — Coding, Diagnostics & Retrofits',
    description: 'BMW coding Dublin — diagnostics and retrofits, in person or remote.',
    images: ['/og.jpg'],
  },
  robots: { index: true, follow: true },
  verification: { google: 'a-hsX_ynxFXHXAANoFr_0Py4hanbe_CwDQmLLtaAdys' },
};

// The root layout stays locale-independent so pages can render statically and
// be edge-cached (fast TTFB). Locale-specific work — the <html lang>, the
// JSON-LD business schema and the cookie banner — lives in the [locale] layout,
// which sets the request locale and therefore renders statically too.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebas.variable} ${manrope.variable}`}>
      <body className="font-sans antialiased">
        {/* Guard against the "removeChild/insertBefore: not a child" crash that
            browser auto-translate (Google Translate etc.) triggers by swapping
            React's text nodes. Runs before hydration; no-ops the bad call
            instead of letting it throw. Canonical community mitigation. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){if(typeof Node!=='function'||!Node.prototype)return;var r=Node.prototype.removeChild;Node.prototype.removeChild=function(c){if(c&&c.parentNode!==this){return c;}return r.apply(this,arguments);};var i=Node.prototype.insertBefore;Node.prototype.insertBefore=function(n,ref){if(ref&&ref.parentNode!==this){return n;}return i.apply(this,arguments);};})();`,
          }}
        />
        <MetaPixel />
        <GoogleAdsTag />
        <Attribution />
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important;animation:none!important}`}</style>
        </noscript>
        {children}
        <VisitorPing />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
