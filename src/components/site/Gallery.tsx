'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { GalleryItem } from '@/lib/types';
import { Reveal } from './Reveal';

// Real jobs as a moving strip (owner, 22 Nov 2026: "more interesting, like a
// running line — newest work first"). The list arrives newest first
// (getGallery). Desktop: two rows drifting in opposite directions; phone: one.
// Hover pauses, the pause button stops it for good (WCAG 2.2.2), and under
// prefers-reduced-motion it is a plain scrollable row (globals.css).
// Tap a photo for the full-screen view, swipe there to move between jobs.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-14T…" → "Nov 2026". From the string itself, so the server and the
 *  browser always print the same thing (no time zones, no hydration mismatch). */
function monthOf(iso?: string): string {
  const m = /^(\d{4})-(\d{2})/.exec(iso ?? '');
  return m ? `${MONTHS[Number(m[2]) - 1] ?? ''} ${m[1]}` : '';
}

/** The chassis code the caption starts with ("G30 Japan to EU…" → "G30"). */
function chassisOf(caption: string): string {
  const m = /\b([EFGU]\d{2})\b/.exec(caption);
  const mini = /\bmini\b/i.test(caption);
  if (m) return mini ? `MINI ${m[1]}` : m[1];
  return mini ? 'MINI' : '';
}

/** The caption without its leading chassis code and dash. */
function workOf(caption: string): string {
  return caption.replace(/^\s*(mini\s+cooper\s+)?[EFGU]\d{2}\s*[-–—:]?\s*/i, '').trim() || caption;
}

function Card({
  g,
  index,
  latest,
  hidden,
  size,
  onOpen,
  labels,
}: {
  g: GalleryItem;
  index: number;
  latest: boolean;
  /** The second copy that makes the loop seamless: not read out, not tabbable. */
  hidden: boolean;
  size: 'lg' | 'sm';
  onOpen: (i: number) => void;
  labels: { latest: string; alt: string };
}) {
  const chassis = chassisOf(g.caption || '');
  const when = monthOf(g.created_at);
  return (
    <div className="pr-4" aria-hidden={hidden || undefined}>
      <button
        type="button"
        tabIndex={hidden ? -1 : 0}
        onClick={() => onOpen(index)}
        className={`group relative block overflow-hidden rounded-[18px] border border-white/10 bg-graphite-800 text-left ${
          size === 'lg' ? 'w-[78vw] max-w-[360px] md:w-[380px] md:max-w-none' : 'w-[300px]'
        }`}
      >
        <div className={`relative w-full overflow-hidden ${size === 'lg' ? 'aspect-[4/3]' : 'aspect-[16/10]'}`}>
          <Image
            src={g.image_url}
            alt={g.caption || labels.alt}
            fill
            sizes={size === 'lg' ? '(min-width: 768px) 380px, 78vw' : '300px'}
            className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
          />
          <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
        </div>
        <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {chassis && (
            <span className="rounded-full bg-black/70 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
              {chassis}
            </span>
          )}
          {latest && (
            <span className="rounded-full bg-bmw px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
              {labels.latest}
            </span>
          )}
        </span>
        <span className="absolute inset-x-0 bottom-0 p-4">
          <span className="line-clamp-2 block text-sm font-semibold leading-snug text-white">{workOf(g.caption || labels.alt)}</span>
          {when && <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em] text-white/60">{when}</span>}
        </span>
        <span className="m-stripe absolute left-0 top-0 h-full w-1 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    </div>
  );
}

function Strip({
  items,
  order,
  reverse,
  size,
  seconds,
  paused,
  onOpen,
  labels,
  className = '',
}: {
  items: GalleryItem[];
  /** Indexes into `items`, in the order this row shows them. */
  order: number[];
  reverse?: boolean;
  size: 'lg' | 'sm';
  seconds: number;
  paused: boolean;
  onOpen: (i: number) => void;
  labels: { latest: string; alt: string };
  className?: string;
}) {
  // Two identical halves; the track moves by exactly one half and starts over.
  return (
    <div className={`gallery-marquee ${className}`} data-paused={paused || undefined}>
      <div className={`gallery-track${reverse ? ' gallery-track--reverse' : ''}`} style={{ animationDuration: `${seconds}s` }}>
        {[0, 1].map((copy) =>
          order.map((i) => (
            <Card
              key={`${copy}-${items[i].id}`}
              g={items[i]}
              index={i}
              latest={i === 0}
              hidden={copy === 1}
              size={size}
              onOpen={onOpen}
              labels={labels}
            />
          )),
        )}
      </div>
    </div>
  );
}

export function Gallery({ items }: { items: GalleryItem[] }) {
  const t = useTranslations('Gallery');
  const [active, setActive] = useState<number | null>(null);
  const [stopped, setStopped] = useState(false);
  // The strip waits until it is on screen, so the first thing a visitor sees
  // there is the newest job, not wherever the loop has got to.
  const [seen, setSeen] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);
  const touchX = useRef<number | null>(null);
  const labels = { latest: t('latest'), alt: t('altFallback') };

  const close = useCallback(() => setActive(null), []);
  const next = useCallback(() => setActive((i) => (i === null ? null : (i + 1) % items.length)), [items.length]);
  const prev = useCallback(() => setActive((i) => (i === null ? null : (i - 1 + items.length) % items.length)), [items.length]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

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

  // Row two starts halfway through the list, so the same job is rarely on
  // screen twice; both rows take about five seconds per photo.
  const all = items.map((_, i) => i);
  const half = Math.ceil(items.length / 2);
  const second = [...all.slice(half), ...all.slice(0, half)];
  const seconds = Math.max(30, items.length * 5);
  const paused = stopped || active !== null || !seen;

  return (
    <section ref={sectionRef} id="work" className="relative overflow-hidden border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <Reveal className="mb-10 grid grid-cols-12 items-end gap-6">
          <div className="col-span-12 md:col-span-8">
            <div className="mb-4 flex items-center gap-3">
              <span className="label">{t('eyebrow')}</span>
              <span className="m-stripe h-[2px] w-10" />
            </div>
            <h2 className="text-balance font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[0.9]">{t('heading')}</h2>
          </div>
          <div className="col-span-12 md:col-span-4 md:text-right">
            <p className="text-muted">{t('intro')}</p>
            {items.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-3 md:justify-end">
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-faint">{t('count', { n: items.length })}</span>
                <button
                  type="button"
                  onClick={() => setStopped((s) => !s)}
                  aria-pressed={stopped}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/15 px-3 text-[12px] font-semibold text-ink transition-colors hover:border-white/30"
                >
                  {stopped ? <Play size={13} /> : <Pause size={13} />} {stopped ? t('play') : t('pause')}
                </button>
              </div>
            )}
          </div>
        </Reveal>
      </div>

      {items.length === 0 ? (
        <div className="mx-auto max-w-edge px-5 md:px-8">
          <EmptyState />
        </div>
      ) : (
        <div className="space-y-4">
          <Strip items={items} order={all} size="lg" seconds={seconds} paused={paused} onOpen={setActive} labels={labels} />
          {items.length >= 4 && (
            <Strip
              items={items}
              order={second}
              reverse
              size="sm"
              seconds={Math.round(seconds * 1.25)}
              paused={paused}
              onOpen={setActive}
              labels={labels}
              className="hidden md:block"
            />
          )}
        </div>
      )}

      <div className="mx-auto mt-8 max-w-edge px-5 md:px-8">
        <Link href="/projects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-bmw hover:underline">
          {t('seeAll')} <ArrowRight size={14} />
        </Link>
      </div>

      {/* Full-screen view: arrows, keys or a swipe to move between jobs. */}
      {active !== null && items[active] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-graphite-900/95 p-4 backdrop-blur-sm"
          onClick={close}
          onTouchStart={(e) => {
            touchX.current = e.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(e) => {
            const start = touchX.current;
            touchX.current = null;
            const end = e.changedTouches[0]?.clientX;
            if (start === null || end === undefined || Math.abs(end - start) < 40) return;
            if (end < start) next();
            else prev();
          }}
          role="dialog"
          aria-modal="true"
          aria-label={items[active].caption || t('altFallback')}
        >
          <button onClick={close} className="absolute right-5 top-5 text-muted transition-colors hover:text-ink" aria-label={t('close')}>
            <X size={28} />
          </button>
          {items.length > 1 && (
            <span className="absolute left-1/2 top-5 -translate-x-1/2 font-mono text-xs uppercase tracking-widest text-faint">
              {active + 1} / {items.length}
            </span>
          )}
          {items.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-3 text-muted transition-colors hover:text-ink md:left-8"
                aria-label={t('previous')}
              >
                <ChevronLeft size={36} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-3 text-muted transition-colors hover:text-ink md:right-8"
                aria-label={t('next')}
              >
                <ChevronRight size={36} />
              </button>
            </>
          )}
          <figure className="max-h-[88vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              // Full-screen view: a 1920px optimised copy instead of the raw upload.
              src={`/_next/image?url=${encodeURIComponent(items[active].image_url)}&w=1920&q=80`}
              alt={items[active].caption || t('altFallback')}
              className="max-h-[78vh] w-auto rounded-[14px] border border-white/10"
            />
            {(items[active].caption || items[active].created_at) && (
              <figcaption className="mt-3 text-center font-mono text-xs uppercase tracking-wider text-muted">
                {items[active].caption}
                {monthOf(items[active].created_at) && <span className="text-faint"> · {monthOf(items[active].created_at)}</span>}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </section>
  );
}

function EmptyState() {
  const t = useTranslations('Gallery');
  return (
    <div className="relative grid grid-cols-1 gap-px overflow-hidden border border-white/8 bg-white/8 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="blueprint flex aspect-[4/3] items-center justify-center bg-graphite-800">
          <span className="font-mono text-[11px] uppercase tracking-ticker text-faint">
            {t('emptyWork', { n: String(i + 1).padStart(2, '0') })}
          </span>
        </div>
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="bg-graphite-900/80 px-4 py-2 text-sm text-muted backdrop-blur">{t('emptyCaption')}</p>
      </div>
    </div>
  );
}
