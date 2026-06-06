import type { ReactNode } from 'react';

export const aInput =
  'w-full rounded-md border border-white/10 bg-graphite-900 px-3 py-2 text-sm text-ink placeholder:text-faint outline-none transition-colors focus:border-bmw';

export const aBtn =
  'inline-flex items-center justify-center gap-2 rounded-md bg-bmw px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-bmw-dark disabled:opacity-50';

export const aBtnGhost =
  'inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-muted transition-colors hover:border-white/30 hover:text-ink';

export const aBtnDanger =
  'inline-flex items-center justify-center gap-2 rounded-md border border-m-red/40 px-3 py-2 text-sm text-m-red transition-colors hover:bg-m-red/10';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-white/10 bg-graphite-800/60 ${className}`}>
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-faint">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

export function PageHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-7">
      <h1 className="font-display text-4xl tracking-wide text-ink">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
  );
}
