import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/site/Header';
import { Preloader } from '@/components/site/Preloader';
import { ScrollProgress } from '@/components/site/ScrollProgress';
import { Hero } from '@/components/site/Hero';
import { Services } from '@/components/site/Services';
import { HowItWorks } from '@/components/site/HowItWorks';
import { Gallery } from '@/components/site/Gallery';
import { WhyUs } from '@/components/site/WhyUs';
import { Faq } from '@/components/site/Faq';
import { QuoteBuilder } from '@/components/site/QuoteBuilder';
import { Contact } from '@/components/site/Contact';
import { Footer } from '@/components/site/Footer';
import { ChatWidget } from '@/components/site/ChatWidget';
import { getCatalog, getGallery, getSettings } from '@/lib/data';

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

export default async function HomePage() {
  const [catalog, gallery, settings] = await Promise.all([
    getCatalog(),
    getGallery(),
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
        <Services catalog={catalog} />
        <HowItWorks />
        <Gallery items={gallery} />
        <WhyUs settings={settings} />
        <Faq />
        <QuoteBuilder catalog={catalog} />
        <Contact settings={settings} serviceOptions={serviceOptions} />
      </main>
      <Footer settings={settings} />
      <ChatWidget />
    </div>
  );
}
