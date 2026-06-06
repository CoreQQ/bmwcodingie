'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryItem } from '@/lib/types';

export function Gallery({ items }: { items: GalleryItem[] }) {
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const next = useCallback(
    () => setActive((i) => (i === null ? null : (i + 1) % items.length)),
    [items.length],
  );
  const prev = useCallback(
    () => setActive((i) => (i === null ? null : (i - 1 + items.length) % items.length)),
    [items.length],
  );

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [active, close, next, prev]);

  return (
    <section id="work" className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="mb-12 grid grid-cols-12 items-end gap-6">
          <div className="col-span-12 md:col-span-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="label">03 / Work</span>
              <span className="m-stripe h-[2px] w-10" />
            </div>
            <h2 className="font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">
              REAL CARS, REAL SCREENS
            </h2>
          </div>
          <p className="col-span-12 text-muted md:col-span-4 md:text-right">
            Before / after, iDrive screens and work in progress — straight from jobs around
            Dublin.
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
            {items.map((g, i) => (
              <button
                key={g.id}
                onClick={() => setActive(i)}
                className="group relative block w-full overflow-hidden border border-white/8 bg-graphite-800"
              >
                <div className="aspect-[4/3] w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.image_url}
                    alt={g.caption || 'BMW coding work'}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <span className="m-stripe absolute left-0 top-0 h-full w-1 opacity-0 transition-opacity group-hover:opacity-100" />
                {g.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-graphite-900/90 to-transparent p-4 text-left font-mono text-xs uppercase tracking-wider text-muted opacity-100 sm:translate-y-2 sm:opacity-0 sm:transition-all sm:group-hover:translate-y-0 sm:group-hover:opacity-100">
                    {g.caption}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {active !== null && items[active] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-graphite-900/95 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute right-5 top-5 text-muted transition-colors hover:text-ink"
            aria-label="Close"
          >
            <X size={28} />
          </button>
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-3 text-muted transition-colors hover:text-ink md:left-8"
                aria-label="Previous"
              >
                <ChevronLeft size={36} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-3 text-muted transition-colors hover:text-ink md:right-8"
                aria-label="Next"
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}
          <figure className="max-h-[88vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={items[active].image_url}
              alt={items[active].caption || 'BMW coding work'}
              className="max-h-[80vh] w-auto border border-white/10"
            />
            {items[active].caption && (
              <figcaption className="mt-3 text-center font-mono text-xs uppercase tracking-wider text-muted">
                {items[active].caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="relative grid grid-cols-1 gap-px overflow-hidden border border-white/8 bg-white/8 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="blueprint flex aspect-[4/3] items-center justify-center bg-graphite-800">
          <span className="font-mono text-[11px] uppercase tracking-ticker text-faint">
            Work · {String(i + 1).padStart(2, '0')}
          </span>
        </div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="bg-graphite-900/80 px-4 py-2 text-sm text-muted backdrop-blur">
          Photos from recent jobs are being added.
        </p>
      </div>
    </div>
  );
}
