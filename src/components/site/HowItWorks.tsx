import { getTranslations } from 'next-intl/server';
import { Reveal } from './Reveal';

export async function HowItWorks() {
  const t = await getTranslations('HowItWorks');
  const STEPS = [
    { n: '01', title: t('step1Title'), body: t('step1Body') },
    { n: '02', title: t('step2Title'), body: t('step2Body') },
    { n: '03', title: t('step3Title'), body: t('step3Body') },
    { n: '04', title: t('step4Title'), body: t('step4Body') },
  ];
  return (
    <section id="process" className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="mb-14 flex items-center gap-3">
          <span className="label">{t('eyebrow')}</span>
          <span className="m-stripe h-[2px] w-10" />
        </div>
        <h2 className="mb-16 max-w-3xl font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">
          {t('heading')}
        </h2>

        <div className="grid grid-cols-1 gap-px bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 80}>
              <div className="relative h-full bg-graphite-900 p-7">
                <span className="font-display text-5xl text-graphite-500">{s.n}</span>
                <div className="m-stripe my-4 h-[2px] w-10" />
                <h3 className="text-lg font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
