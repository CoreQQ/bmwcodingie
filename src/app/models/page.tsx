import type { Metadata } from 'next';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { ModelPicker } from '@/components/site/ModelPicker';
import { getCarModels, getCatalog, getCompatibility, getSettings } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Check your BMW model',
  description:
    'Pick your exact BMW chassis code and year to see which coding, diagnostics and retrofit options are available for your car in Dublin.',
  alternates: { canonical: '/models' },
};

export default async function ModelsPage() {
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
              <span className="label text-muted">Check your exact model</span>
            </div>
            <h1 className="font-display text-[clamp(2.2rem,8vw,5rem)] leading-[0.9]">
              WHAT CAN <span className="text-m-gradient">YOUR BMW</span> DO?
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              Pick your chassis code and year — we&apos;ll show you exactly what&apos;s available,
              what isn&apos;t, and what we need to confirm in person.
            </p>
          </div>
        </section>

        <ModelPicker models={models} catalog={catalog} compatibility={compatibility} settings={settings} />
      </main>
      <Footer settings={settings} />
    </div>
  );
}
