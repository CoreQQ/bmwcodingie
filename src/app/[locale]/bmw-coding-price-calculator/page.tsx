import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { PriceCalculator } from '@/components/site/PriceCalculator';
import { PRICE_ITEMS } from '@/lib/pricing';
import { getSettings } from '@/lib/data';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

const TITLE = 'BMW Coding Price Calculator | Instant Estimate — BMW Coding IE';
const DESCRIPTION =
  'Work out what your BMW coding will cost in seconds: CarPlay, Android Auto, Japan→EU conversion, hidden features, diagnostics and retrofit add-ons. Real prices, no "on request".';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: '/bmw-coding-price-calculator' },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/bmw-coding-price-calculator`,
      siteName: 'BMW Coding',
      title: TITLE,
      description: DESCRIPTION,
      images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'BMW coding prices — BMW Coding IE' }],
    },
  };
}

export default async function PriceCalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await getSettings();

  // Machine-readable prices so search engines can show them too.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: 'BMW coding prices — BMW Coding IE',
    url: `${SITE_URL}/bmw-coding-price-calculator`,
    itemListElement: PRICE_ITEMS.map((item) => ({
      '@type': 'Offer',
      name: item.label,
      priceCurrency: 'EUR',
      price: item.price['nbt-evo'] ?? item.price.mgu ?? undefined,
      availability: 'https://schema.org/InStock',
    })),
  };

  return (
    <div className="grain relative min-h-screen">
      <Header />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="mx-auto max-w-edge px-5 pb-24 pt-32 md:px-8 md:pt-40">
        <div className="mb-10 flex items-center gap-3">
          <span className="label">Prices</span>
          <span className="m-stripe h-[2px] w-10" />
        </div>

        <h1 className="mb-4 max-w-3xl font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">
          WHAT WILL IT COST?
        </h1>
        <p className="mb-12 max-w-2xl text-sm leading-relaxed text-muted">
          Pick your iDrive and what you want done — the estimate updates as you go. These are our
          real prices, the same ones we quote on the phone. The final figure is confirmed from your
          model, year and VIN before you book, and you pay on completion once you have seen it
          working.
        </p>

        <PriceCalculator />

        <div className="mt-16 border-t border-white/10 pt-8">
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Not sure which iDrive you have? Send us a photo of your home screen on{' '}
            <Link href="/#contact" className="text-bmw underline-offset-4 hover:underline">
              the contact form
            </Link>{' '}
            or WhatsApp and we will tell you in a minute — it changes the price on CarPlay and
            Japanese imports. See also{' '}
            <Link href="/bmw-coding-list" className="text-bmw underline-offset-4 hover:underline">
              the full coding list
            </Link>{' '}
            and{' '}
            <Link href="/blog/bmw-coding-cost-ireland" className="text-bmw underline-offset-4 hover:underline">
              what decides the final price
            </Link>
            .
          </p>
        </div>
      </main>

      <Footer settings={settings} />
    </div>
  );
}
