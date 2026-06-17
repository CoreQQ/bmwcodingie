import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="grain relative flex min-h-screen items-center overflow-hidden">
      <div className="blueprint absolute inset-0 opacity-60" />
      <div className="absolute inset-0 hero-glow" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-graphite-900 to-transparent" />

      <div className="relative mx-auto max-w-edge px-5 py-24 md:px-8">
        <div className="mb-7 flex items-center gap-3">
          <span className="m-stripe h-[3px] w-12" />
          <span className="label text-muted">ISTA · Fault scan complete</span>
        </div>

        <h1 className="font-display text-[clamp(3.5rem,18vw,11rem)] leading-[0.82] tracking-tight">
          <span className="block text-m-gradient">404</span>
        </h1>

        <p className="mt-4 max-w-xl font-mono text-sm uppercase tracking-wider text-faint">
          Fault code 0x404 — &quot;Route not found&quot;
        </p>

        <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
          Even an M4 with a fresh ISTA flash couldn&apos;t find this page. Whatever you were
          chasing, it&apos;s not coded into this map — let&apos;s get you back on the road.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link href="/" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} /> Back home
          </Link>
          <Link href="/#contact" className="btn-ghost inline-flex items-center gap-2">
            <MessageCircle size={16} /> Talk to us instead
          </Link>
        </div>

        <div className="mt-14 max-w-md border border-white/10 bg-graphite-800/60 backdrop-blur-sm">
          <div className="m-stripe m-stripe-anim h-1 w-full" />
          <div className="divide-y divide-white/5">
            <SpecRow k="Status" v="DTC stored — not cleared" />
            <SpecRow k="Module" v="Site navigation (NAV)" />
            <SpecRow k="Recommended action" v="Return to known good route" />
          </div>
        </div>
      </div>
    </div>
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
