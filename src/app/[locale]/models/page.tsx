import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { ModelPicker } from '@/components/site/ModelPicker';
import { getCarModels, getCatalog, getCompatibility, getSettings } from '@/lib/data';

// Cached for fast TTFB; admin edits revalidate on demand, with a 10-minute
// fallback so model/compatibility changes never stay stale for long.
export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ModelsPage' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: '/models' },
  };
}

export default async function ModelsPage() {
  const t = await getTranslations('ModelsPage');
  const [models, catalog, compatibility, settings] = await Promise.all([
    getCarModels(),
    getCatalog(),
    getCompatibility(),
    getSettings(),
  ]);

  return (
    <div className="grain relative min-h-screen">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-white/5 pb-16 pt-28 md:pb-20 md:pt-40">
          <div className="absolute inset-0 -z-10">
            <div className="blueprint absolute inset-0 opacity-60" />
            <div className="absolute inset-0 hero-glow" />
          </div>
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="m-stripe h-[3px] w-12" />
              <span className="label text-muted">{t('eyebrow')}</span>
            </div>
            <h1 className="font-display text-[clamp(2.2rem,8vw,5rem)] leading-[0.9]">
              {t('heading1')} <span className="text-bmw">{t('headingHighlight')}</span> {t('heading2')}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{t('intro')}</p>
          </div>
        </section>

        <ModelPicker models={models} catalog={catalog} compatibility={compatibility} settings={settings} />
      </main>
      <Footer settings={settings} />
    </div>
  );
}
