'use client';

import { useEffect, useState } from 'react';

// A live countdown to a real moment of an offer — its start, or its end
// (owner, 18 Nov 2026: "count down to Black Friday"). Only ever pointed at
// the actual dates in season-dates.json: no fake urgency.
//
// The time is read only after mounting: the server and the first client
// render show the same placeholder, so the page never mismatches on
// hydration (the rule in CLAUDE.md about new Date() in a first render).

export type CountdownUnits = { d: string; h: string; m: string; s: string };

function parts(ms: number) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(t / 86400), h: Math.floor((t % 86400) / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}
const two = (n: number) => String(n).padStart(2, '0');

export function OfferCountdown({
  to,
  label,
  done,
  units,
  size = 'lg',
  accent = '#ffd23f',
  reloadWhenDone = false,
}: {
  /** ISO time the countdown reaches zero at. */
  to: string;
  label: string;
  /** Shown once the time has passed. */
  done: string;
  units: CountdownUnits;
  size?: 'lg' | 'sm';
  accent?: string;
  /** At zero, offer a tap to reload — the new prices come with the next build. */
  reloadWhenDone?: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const target = new Date(to).getTime();
  const left = now === null ? null : target - now;
  const p = left === null ? null : parts(left);
  const show = (n: number | undefined) => (n === undefined ? '--' : two(n));

  if (left !== null && left <= 0) {
    return reloadWhenDone ? (
      <button
        type="button"
        onClick={() => window.location.reload()}
        className={`${size === 'lg' ? 'mt-4 text-sm' : 'text-[12px]'} font-semibold underline-offset-2 hover:underline`}
        style={{ color: accent }}
      >
        {done}
      </button>
    ) : (
      <p className={`${size === 'lg' ? 'mt-4 text-sm' : 'text-[12px]'} font-semibold`} style={{ color: accent }}>
        {done}
      </p>
    );
  }

  const cells: [string, string][] = [
    ...(p && p.d > 0 ? [[String(p.d), units.d] as [string, string]] : []),
    [show(p?.h), units.h],
    [show(p?.m), units.m],
    [show(p?.s), units.s],
  ];
  const spoken = p ? `${label} ${p.d ? `${p.d} ${units.d} ` : ''}${p.h} ${units.h} ${p.m} ${units.m}` : label;

  if (size === 'sm') {
    return (
      <span role="timer" aria-label={spoken} className="inline-flex items-baseline gap-1 whitespace-nowrap font-mono text-[12px] tabular-nums">
        <span className="font-sans text-muted">{label}</span>
        <span aria-hidden="true" className="font-semibold" style={{ color: accent }}>
          {cells.map(([v, u]) => `${v}${u}`).join(' ')}
        </span>
      </span>
    );
  }

  return (
    <div role="timer" aria-label={spoken} className="mt-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
      <div aria-hidden="true" className="mt-2 flex flex-wrap gap-2">
        {cells.map(([v, u], i) => (
          <div key={i} className="min-w-[4.25rem] rounded-[12px] border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
            <span className="block font-display text-3xl font-bold leading-none tabular-nums text-white md:text-4xl">{v}</span>
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: accent }}>
              {u}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
