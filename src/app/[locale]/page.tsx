import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Header } from '@/components/site/Header';
import { Preloader } from '@/components/site/Preloader';
import { ScrollProgress } from '@/components/site/ScrollProgress';
import { Hero } from '@/components/site/Hero';
import { Gallery } from '@/components/site/Gallery';
import { Reviews } from '@/components/site/Reviews';
import { GoogleReviews } from '@/components/site/GoogleReviews';
import { Faq } from '@/components/site/Faq';
import { VinCheck } from '@/components/site/VinCheck';
import { FeaturedServices, Guides, HowItWorksSteps, PopularServices, WhyUs } from '@/components/site/HomeSections';
import { Contact } from '@/components/site/Contact';
import { Footer } from '@/components/site/Footer';
import { ChatWidgetLazy as ChatWidget } from '@/components/site/ChatWidgetLazy';
import { MobileActionBar } from '@/components/site/MobileActionBar';
import { getCatalog, getGallery, getReviews, getSettings } from '@/lib/data';

// Serve cached HTML for fast TTFB/LCP. Admin edits revalidate the site
// on demand (see refreshSite in admin/actions.ts); this is the safety
// fallback so content is never stale for more than 10 minutes.
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'HomeMetadata' });
  // The homepage is the one fully translated page, so each locale is its own
  // canonical with hreflang to the others. Every other page canonicals to
  // the English URL because its body is English regardless of locale.
  const url = (l: string) => (l === routing.defaultLocale ? '/' : `/${l}`);
  const languages: Record<string, string> = Object.fromEntries(routing.locales.map((l) => [l, url(l)]));
  languages['x-default'] = '/';
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: url(locale), languages },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [catalog, gallery, reviews, settings] = await Promise.all([
    getCatalog(),
    getGallery(),
    getReviews(),
    getSettings(),
  ]);

  const serviceOptions = catalog.flatMap((c) => c.services.map((s) => s.title));

  return (
    <div className="grain relative min-h-screen">
      <Preloader />
      <ScrollProgress />
      <Header />
      <main>
        {/* The owner's brief: every block leads to one of three actions —
            WhatsApp, the VIN check or booking. Order as specified. */}
        <Hero settings={settings} />
        <VinCheck whatsapp={settings.whatsapp} />
        <PopularServices whatsapp={settings.whatsapp} />
        <FeaturedServices />
        <Gallery items={gallery} />
        <Reviews reviews={reviews} />
        <GoogleReviews />
        <HowItWorksSteps />
        <WhyUs />
        <Faq />
        <Contact settings={settings} serviceOptions={serviceOptions} />
        <Guides />
      </main>
      <Footer settings={settings} />
      <ChatWidget />
      <MobileActionBar phone={settings.phone} whatsapp={settings.whatsapp} />
    </div>
  );
}
