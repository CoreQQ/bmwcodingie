import { Check } from 'lucide-react';
import type { CategoryWithServices } from '@/lib/types';
import { Reveal } from './Reveal';

export function Services({ catalog }: { catalog: CategoryWithServices[] }) {
  return (
    <section id="services" className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="mb-16 grid grid-cols-12 items-end gap-6">
          <div className="col-span-12 md:col-span-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="label">01 / Services</span>
              <span className="m-stripe h-[2px] w-10" />
            </div>
            <h2 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">
              WHAT I CODE
            </h2>
          </div>
          <p className="col-span-12 text-muted md:col-span-4 md:text-right">
            Fixed prices where I can give them, honest “on request” where the car decides. Every
            job is mobile unless the hardware says otherwise.
          </p>
        </div>

        <div className="space-y-16 md:space-y-24">
          {catalog.map((cat, ci) => (
            <div key={cat.id} className="grid grid-cols-12 gap-x-4 md:gap-x-8 gap-y-6">
              {/* Sticky category header (left rail) */}
              <div className="col-span-12 md:col-span-4">
                    <div className="md:sticky md:top-28">
                      <span className="font-display text-4xl md:text-6xl text-graphite-500">
                        {String(ci + 1).padStart(2, '0')}
                      </span>
                      <h3 className="mt-1 font-display text-2xl md:text-3xl leading-none tracking-wide text-ink">
                        {cat.name}
                      </h3>
                  <div className="m-stripe mt-4 h-[2px] w-16" />
                </div>
              </div>

              {/* Service rows */}
              <ul className="col-span-12 md:col-span-8">
                {cat.services.map((s, i) => (
                  <Reveal as="li" key={s.id} delay={i * 50}>
                    <div className="group grid grid-cols-12 items-baseline gap-3 border-b border-white/8 py-6 transition-colors hover:bg-white/[0.015]">
                      <div className="col-span-12 sm:col-span-8">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-ink">{s.title}</h4>
                          {s.mobile_available && (
                            <span className="inline-flex items-center gap-1 border border-white/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-faint">
                              <Check size={10} className="text-bmw" /> Mobile
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">
                          {s.description}
                        </p>
                      </div>
                      <div className="col-span-12 text-left sm:col-span-4 sm:text-right">
                        <span className="font-mono text-sm sm:text-base text-bmw transition-colors group-hover:text-ink">
                          {s.price_label}
                        </span>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-14 max-w-xl text-sm text-faint">
          Don’t see your exact request? Hidden features and bespoke coding are part of the job —
          message me the car and what you want, and I’ll tell you straight whether it’s possible.
        </p>
      </div>
    </section>
  );
}
