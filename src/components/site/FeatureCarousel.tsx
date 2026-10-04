'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';

export type FeatureSlide = {
  key: string;
  eyebrow: string;
  heading: string;
  price: string;
  items: string[];
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
};

/**
 * Featured services, one big panel at a time. Swipe on a phone (native
 * scroll-snap, so it feels like the OS), arrows and dots on a computer. No
 * autoplay: a panel that moves while someone is reading it is a panel they
 * stop reading.
 */
export function FeatureCarousel({ slides, prevLabel, nextLabel }: { slides: FeatureSlide[]; prevLabel: string; nextLabel: string }) {
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const onScroll = () => setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const n = (i + slides.length) % slides.length;
    el.scrollTo({ left: n * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Featured BMW services">
      <div
        ref={track}
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((s, i) => (
          <article
            key={s.key}
            aria-roledescription="slide"
            aria-label={`${i + 1} / ${slides.length}`}
            className="w-full shrink-0 snap-center px-px"
          >
            <div className="grid h-full gap-8 border border-white/10 bg-graphite-800/40 p-6 md:grid-cols-12 md:p-10">
              <div className="min-w-0 md:col-span-6">
                <span className="label">{s.eyebrow}</span>
                <h3 className="mt-3 font-display text-[clamp(1.8rem,4.4vw,3.2rem)] text-ink">{s.heading}</h3>
                <p className="mt-5 font-mono text-2xl text-bmw">{s.price}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href={s.primary.href} className="btn-primary">{s.primary.label}</a>
                  <a href={s.secondary.href} className="btn-ghost">{s.secondary.label}</a>
                </div>
              </div>
              <ul className="min-w-0 space-y-3 md:col-span-6">
                {s.items.map((it) => (
                  <li key={it} className="flex items-start gap-3 text-ink">
                    <Check size={17} className="mt-0.5 shrink-0 text-bmw" /> {it}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => go(i)}
              aria-label={`${s.heading} (${i + 1}/${slides.length})`}
              aria-current={active === i}
              className={`h-2.5 rounded-full transition-all ${active === i ? 'w-8 bg-white' : 'w-2.5 bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => go(active - 1)} aria-label={prevLabel} className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/10 text-ink backdrop-blur hover:bg-white/20">
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={() => go(active + 1)} aria-label={nextLabel} className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-white/10 text-ink backdrop-blur hover:bg-white/20">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
