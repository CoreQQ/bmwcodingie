import { ArrowDown, MapPin } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import { waLink } from '@/lib/data';

export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Background: blueprint grid + atmospheric blue glow.
          Drop a real photo at /public/hero.jpg to override the gradient. */}
      <div className="absolute inset-0 -z-10">
        <div className="blueprint absolute inset-0 opacity-60" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 78% 0%, rgba(28,105,212,0.22) 0%, rgba(10,11,13,0) 55%), radial-gradient(80% 60% at 0% 100%, rgba(92,45,145,0.14) 0%, rgba(10,11,13,0) 60%)',
          }}
        />
        <div
          className="absolute inset-0 bg-[url('/hero.jpg')] bg-cover bg-center opacity-0 [background-blend-mode:overlay]"
          style={{ opacity: 'var(--hero-photo, 0)' }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-graphite-900 to-transparent" />
      </div>

      <div className="mx-auto max-w-edge px-5 pb-16 pt-20 sm:pt-28 md:px-8 md:pb-28 md:pt-44">
        <div className="grid grid-cols-12 gap-y-12 md:gap-x-10">
          {/* Headline block */}
          <div className="col-span-12 lg:col-span-8">
            <div className="mb-7 flex items-center gap-3 reveal is-in">
              <span className="m-stripe h-[3px] w-12" />
              <span className="label text-muted">Independent BMW Specialist · Est. Dublin</span>
            </div>

            <h1 className="font-display text-[clamp(2.2rem,10vw,6.5rem)] leading-[0.86] tracking-tight">
              <span className="block">BMW CODING</span>
              <span className="block text-bmw">&amp; RETROFITS</span>
              <span className="block text-muted">MOBILE · DUBLIN</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
              {settings.hero_subtitle}
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#contact" className="btn-primary">
                Book now
              </a>
              <a href="#services" className="btn-ghost">
                View coding services
              </a>
            </div>

            <a
              href="#services"
              className="mt-8 sm:mt-14 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-faint transition-colors hover:text-ink"
            >
              <ArrowDown size={14} className="animate-bounce" /> Scroll
            </a>
          </div>

          {/* Spec readout card — offset right */}
          <div className="col-span-12 lg:col-span-4 lg:pt-24">
            <div className="border border-white/10 bg-graphite-800/60 backdrop-blur-sm">
              <div className="m-stripe h-1 w-full" />
              <div className="space-y-0 divide-y divide-white/5">
                <SpecRow k="Format" v="Mobile — I come to you" />
                <SpecRow k="Coverage" v="Dublin + surrounding counties" />
                <SpecRow k="Tooling" v="ISTA · E-Sys · BimmerCode" />
                <SpecRow k="Platforms" v="F · G · I-series" />
                <SpecRow k="Payment" v="On completion, on site" />
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 px-5 py-4 text-sm text-muted">
                <MapPin size={15} className="text-bmw" />
                <span>{settings.service_area}</span>
              </div>
            </div>

            <a
              href={waLink(settings.whatsapp, 'Hi — I have a BMW and I need coding.')}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block border border-white/10 px-5 py-3 text-center font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-bmw hover:text-ink"
            >
              WhatsApp a quick question →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpecRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-5 py-3.5">
      <span className="label">{k}</span>
      <span className="text-right text-sm text-ink">{v}</span>
    </div>
  );
}
