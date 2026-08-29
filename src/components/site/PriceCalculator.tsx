'use client';

import { useMemo, useState } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import {
  ADD_ONS,
  CALL_OUT,
  HEAD_UNITS,
  PRICE_ITEMS,
  isBundledOut,
  type HeadUnit,
} from '@/lib/pricing';

// Instant estimate so visitors never have to ask "how much?" — the number one
// reason people leave a service site. Prices come from src/lib/pricing.ts, the
// same list the AI agents quote from.
export function PriceCalculator({ contactHref = '/#contact' }: { contactHref?: string }) {
  const [unit, setUnit] = useState<HeadUnit>('unknown');
  const [picked, setPicked] = useState<string[]>([]);
  const [addOns, setAddOns] = useState<string[]>([]);
  const [mobile, setMobile] = useState(false);

  const priceUnit: Exclude<HeadUnit, 'unknown'> = unit === 'mgu' ? 'mgu' : 'nbt-evo';

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const { total, anyFrom, lines } = useMemo(() => {
    const lines: { label: string; amount: number | null; bundled?: boolean }[] = [];
    let total = 0;
    let anyFrom = false;

    for (const item of PRICE_ITEMS) {
      if (!picked.includes(item.id)) continue;
      const amount = item.price[priceUnit];
      if (amount === null) {
        lines.push({ label: item.label, amount: null });
        continue;
      }
      if (isBundledOut(picked, item.id, unit)) {
        lines.push({ label: item.label, amount: 0, bundled: true });
        continue;
      }
      lines.push({ label: item.label, amount });
      total += amount;
      if (item.from) anyFrom = true;
    }
    for (const a of ADD_ONS) {
      if (!addOns.includes(a.id)) continue;
      lines.push({ label: a.label, amount: a.price });
      total += a.price;
    }
    if (mobile) {
      lines.push({ label: 'Call-out around Dublin', amount: CALL_OUT.base });
      total += CALL_OUT.base;
    }
    return { total, anyFrom, lines };
  }, [picked, addOns, mobile, priceUnit, unit]);

  const summary = picked
    .map((id) => PRICE_ITEMS.find((i) => i.id === id)?.label)
    .filter(Boolean)
    .join(', ');

  const bookHref = summary
    ? `${contactHref}?service=${encodeURIComponent(summary)}`
    : contactHref;

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
      <div className="space-y-6 lg:col-span-7">
        {/* Head unit */}
        <div>
          <p className="label mb-3">1 · Your iDrive</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {HEAD_UNITS.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setUnit(h.id)}
                className={`border p-3 text-left transition-colors duration-200 ${
                  unit === h.id
                    ? 'border-bmw bg-bmw/10 text-ink'
                    : 'border-white/10 bg-graphite-800/40 text-muted hover:border-white/25'
                }`}
              >
                <span className="block font-mono text-[11px] uppercase tracking-wider">{h.label}</span>
                <span className="mt-1 block text-[11px] text-faint">{h.hint}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Services */}
        <div>
          <p className="label mb-3">2 · What you want</p>
          <div className="space-y-2">
            {PRICE_ITEMS.map((item) => {
              const amount = item.price[priceUnit];
              const unavailable = amount === null;
              const on = picked.includes(item.id);
              const bundled = isBundledOut(picked, item.id, unit) && on;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={unavailable}
                  onClick={() => toggle(picked, setPicked, item.id)}
                  className={`flex w-full items-start gap-3 border p-3 text-left transition-colors duration-200 ${
                    unavailable
                      ? 'cursor-not-allowed border-white/5 bg-graphite-800/20 opacity-50'
                      : on
                        ? 'border-bmw bg-bmw/10'
                        : 'border-white/10 bg-graphite-800/40 hover:border-white/25'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border ${
                      on ? 'border-bmw bg-bmw text-white' : 'border-white/25'
                    }`}
                  >
                    {on && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink">{item.label}</span>
                    {item.note && <span className="mt-0.5 block text-[11px] leading-snug text-faint">{item.note}</span>}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">
                    {unavailable
                      ? 'n/a'
                      : bundled
                        ? 'included'
                        : `${item.from ? 'from ' : ''}€${amount}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Add-ons + call-out */}
        <div>
          <p className="label mb-3">3 · Extras</p>
          <div className="space-y-2">
            {ADD_ONS.map((a) => {
              const on = addOns.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggle(addOns, setAddOns, a.id)}
                  className={`flex w-full items-center gap-3 border p-3 text-left transition-colors duration-200 ${
                    on ? 'border-bmw bg-bmw/10' : 'border-white/10 bg-graphite-800/40 hover:border-white/25'
                  }`}
                >
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center border ${on ? 'border-bmw bg-bmw text-white' : 'border-white/25'}`}>
                    {on && <Check size={11} strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-ink">{a.label}</span>
                    {a.note && <span className="mt-0.5 block text-[11px] text-faint">{a.note}</span>}
                  </span>
                  <span className="shrink-0 font-mono text-xs text-muted">+€{a.price}</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setMobile(!mobile)}
              className={`flex w-full items-center gap-3 border p-3 text-left transition-colors duration-200 ${
                mobile ? 'border-bmw bg-bmw/10' : 'border-white/10 bg-graphite-800/40 hover:border-white/25'
              }`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center border ${mobile ? 'border-bmw bg-bmw text-white' : 'border-white/25'}`}>
                {mobile && <Check size={11} strokeWidth={3} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-ink">Come to my car (around Dublin)</span>
                <span className="mt-0.5 block text-[11px] text-faint">
                  Outside Dublin it is €{CALL_OUT.perKm.toFixed(2)}/km from the workshop
                </span>
              </span>
              <span className="shrink-0 font-mono text-xs text-muted">+€{CALL_OUT.base}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estimate */}
      <div className="lg:sticky lg:top-24 lg:col-span-5">
        <div className="border border-white/10 bg-graphite-800/60 p-5">
          <p className="label mb-4">Your estimate</p>

          {lines.length === 0 ? (
            <p className="text-sm text-muted">Pick what you need and the price appears here.</p>
          ) : (
            <ul className="space-y-2 border-b border-white/10 pb-4">
              {lines.map((l, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-muted">{l.label}</span>
                  <span className="shrink-0 font-mono text-xs text-ink">
                    {l.amount === null ? 'n/a' : l.bundled ? 'included' : `€${l.amount}`}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-baseline justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-faint">Total</span>
            <span className="font-display text-4xl leading-none">
              {anyFrom && total > 0 ? 'from ' : ''}€{total}
            </span>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-faint">
            An estimate, not a quote. The exact price is confirmed from your model, year and VIN
            before anything is booked — and you pay on completion, once you have seen it working.
            {unit === 'unknown' && ' Prices shown assume NBT Evo; MGU differs on some items.'}
          </p>

          <a href={bookHref} className="btn-primary mt-5 w-full">
            Book this <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  );
}
