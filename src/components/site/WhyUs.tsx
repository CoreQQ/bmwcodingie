import type { SiteSettings } from '@/lib/types';
import { Reveal } from './Reveal';

const TOOLING = ['ISTA / Rheingold', 'E-Sys + PSdZData', 'BimmerCode', 'FA / VO coding', 'ENET / OBD'];
const PLATFORMS = [
  { gen: 'F-series', detail: 'F2x · F3x · F1x · F8x — NBT / NBT Evo' },
  { gen: 'G-series', detail: 'G2x · G3x · G0x — MGU iDrive 7/8' },
  { gen: 'U-series', detail: 'Latest U-platform — assessed per car' },
];

export function WhyUs({ settings }: { settings: SiteSettings }) {
  return (
    <section id="about" className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="grid grid-cols-12 gap-x-10 gap-y-14">
          {/* Left: statement */}
          <div className="col-span-12 lg:col-span-7">
            <div className="mb-4 flex items-center gap-3">
              <span className="label">04 / The specialist</span>
              <span className="m-stripe h-[2px] w-10" />
            </div>
            <h2 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">
              ONE PERSON. <br />
              <span className="text-bmw">THE RIGHT TOOLS.</span>
            </h2>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted">{settings.about_text}</p>

            <div className="mt-10 grid grid-cols-3 gap-px bg-white/8">
              <Stat n="F·G·U" label="Generations" />
              <Stat n="100%" label="Mobile callout" />
              <Stat n="On site" label="See it work first" />
            </div>
          </div>

          {/* Right: tooling + platforms */}
          <div className="col-span-12 lg:col-span-5 lg:pt-16">
            <Reveal>
              <div className="border border-white/10 bg-graphite-800/50 p-7">
                <h3 className="label mb-5">Equipment</h3>
                <div className="flex flex-wrap gap-2">
                  {TOOLING.map((t) => (
                    <span
                      key={t}
                      className="border border-white/10 px-3 py-1.5 font-mono text-xs text-muted"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                <h3 className="label mb-4 mt-8">Supported platforms</h3>
                <ul className="divide-y divide-white/5">
                  {PLATFORMS.map((p) => (
                    <li key={p.gen} className="flex items-baseline justify-between gap-4 py-3">
                      <span className="font-display text-xl tracking-wide text-ink">{p.gen}</span>
                      <span className="text-right text-xs text-muted">{p.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div className="bg-graphite-900 p-5">
      <div className="font-display text-4xl leading-none text-ink">{n}</div>
      <div className="label mt-2">{label}</div>
    </div>
  );
}
