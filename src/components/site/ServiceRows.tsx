'use client';

import { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { Service } from '@/lib/types';

// Collapsible service list: the top rows show immediately, the rest expand on
// demand — keeps the homepage compact without hiding anything.
const VISIBLE = 3;

export function ServiceRows({
  services,
  remoteOkLabel,
  showAllLabel,
  showLessLabel,
}: {
  services: Service[];
  remoteOkLabel: string;
  showAllLabel: string;
  showLessLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const shown = open ? services : services.slice(0, VISIBLE);
  const hidden = services.length - VISIBLE;

  return (
    <>
      <ul>
        {shown.map((s) => (
          <li key={s.id}>
            <div className="group relative grid grid-cols-12 items-baseline gap-3 border-b border-white/8 py-6 transition-all duration-300 hover:bg-white/[0.02] hover:pl-5">
              <span
                className="m-stripe-v absolute bottom-4 left-0 top-4 w-[3px] origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100"
                aria-hidden="true"
              />
              <div className="col-span-12 sm:col-span-8">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-semibold text-ink">{s.title}</h4>
                  {s.mobile_available && (
                    <span className="inline-flex items-center gap-1 border border-white/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-faint">
                      <Check size={10} className="text-bmw" /> {remoteOkLabel}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{s.description}</p>
              </div>
              <div className="col-span-12 text-left sm:col-span-4 sm:text-right">
                <span className="font-mono text-sm text-bmw transition-colors group-hover:text-ink sm:text-base">
                  {s.price_label}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-4 inline-flex items-center gap-2 border border-white/10 px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-muted transition-colors hover:border-bmw hover:text-ink"
        >
          {open ? showLessLabel : showAllLabel.replace('{n}', String(services.length))}
          <ChevronDown size={14} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
    </>
  );
}
