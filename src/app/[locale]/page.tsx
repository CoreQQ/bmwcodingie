import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/site/Header';
import { Preloader } from '@/components/site/Preloader';
import { ScrollProgress } from '@/components/site/ScrollProgress';
import { Hero } from '@/components/site/Hero';
import { Marquee } from '@/components/site/Marquee';
import { Services } from '@/components/site/Services';
import { HowItWorks } from '@/components/site/HowItWorks';
import { Gallery } from '@/components/site/Gallery';
import { WhyUs } from '@/components/site/WhyUs';
import { Reviews } from '@/components/site/Reviews';
import { Faq } from '@/components/site/Faq';
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
  return { title: t('title'), description: t('description') };
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
        <Hero settings={settings} />
        <Marquee />
        <Services catalog={catalog} />
        <HowItWorks />
        <Gallery items={gallery} />
        <WhyUs settings={settings} />
        <Reviews reviews={reviews} />
        <Faq />
        <Contact settings={settings} serviceOptions={serviceOptions} />
      </main>
      <Footer settings={settings} />
      <ChatWidget />
      <MobileActionBar phone={settings.phone} whatsapp={settings.whatsapp} />
    </div>
  );
}
