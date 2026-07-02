import { getTranslations } from 'next-intl/server';
import { CODING_LIST } from '@/lib/codingList';
import { CountUp } from './CountUp';
import { Reveal } from './Reveal';

// speedy.io-style number band. Every figure is real: coding options are
// counted from the actual coding list, the rest are product facts.
export async function StatsBand() {
  const t = await getTranslations('StatsBand');
  const codingCount = CODING_LIST.reduce((n, c) => n + c.items.length, 0);

  const STATS: { value: number; prefix?: string; suffix?: string; label: string }[] = [
    { value: Math.floor(codingCount / 10) * 10, suffix: '+', label: t('options') },
    { value: 7, label: t('days') },
    { value: 6, label: t('languages') },
    { value: 0, prefix: '€', label: t('upfront') },
  ];

  return (
    <section className="relative border-t border-white/5 bg-graphite-800/30 py-14 md:py-16">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <Reveal className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <CountUp
                value={s.value}
                prefix={s.prefix}
                suffix={s.suffix}
                className="font-display text-[clamp(2.6rem,7vw,4.5rem)] leading-none text-ink"
              />
              <div className="mx-auto mt-3 h-[2px] w-10 m-stripe" />
              <div className="label mt-3">{s.label}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
