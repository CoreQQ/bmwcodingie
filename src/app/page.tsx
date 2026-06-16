import { Header } from '@/components/site/Header';
import { Preloader } from '@/components/site/Preloader';
import { ScrollProgress } from '@/components/site/ScrollProgress';
import { Hero } from '@/components/site/Hero';
import { Services } from '@/components/site/Services';
import { HowItWorks } from '@/components/site/HowItWorks';
import { Gallery } from '@/components/site/Gallery';
import { WhyUs } from '@/components/site/WhyUs';
import { Faq } from '@/components/site/Faq';
import { Contact } from '@/components/site/Contact';
import { Footer } from '@/components/site/Footer';
import { ChatWidget } from '@/components/site/ChatWidget';
import { getCatalog, getGallery, getSettings } from '@/lib/data';

// Always render fresh so admin edits appear immediately.
export const dynamic = 'force-dynamic';

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
        <Contact settings={settings} serviceOptions={serviceOptions} />
      </main>
      <Footer settings={settings} />
      <ChatWidget />
    </div>
  );
}
