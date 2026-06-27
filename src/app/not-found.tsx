import { ArrowLeft, MessageCircle } from 'lucide-react';

// Root-level fallback for any request that never reaches the [locale]
// segment. Self-contained, English copy, no i18n context — mirrors the
// styled localized 404 so visitors never see the bare framework page.
export default function RootNotFound() {
  return (
    <div className="grain relative flex min-h-screen items-center overflow-hidden bg-graphite-900 text-ink">
      <div className="blueprint absolute inset-0 opacity-60" />
      <div className="absolute inset-0 hero-glow" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-graphite-900 to-transparent" />

      <div className="relative mx-auto max-w-edge px-5 py-24 md:px-8">
        <div className="mb-7 flex items-center gap-3">
          <span className="m-stripe h-[3px] w-12" />
          <span className="label text-muted">ISTA · Fault scan complete</span>
        </div>

        <h1 className="font-display text-[clamp(3.5rem,18vw,11rem)] leading-[0.82] tracking-tight">
          <span className="block text-bmw">404</span>
        </h1>

        <p className="mt-4 max-w-xl font-mono text-sm uppercase tracking-wider text-faint">
          Fault code 0x404 — &quot;Route not found&quot;
        </p>

        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
          This page isn&apos;t coded into the map. Let&apos;s get you back on the road.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back home
          </a>
          <a href="/#contact" className="btn-ghost inline-flex items-center gap-2">
            <MessageCircle size={16} /> Talk to us instead
          </a>
        </div>
      </div>
    </div>
  );
}
