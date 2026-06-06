'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';

const FAQS = [
  {
    q: 'Will coding affect my BMW warranty?',
    a: 'Coding changes software parameters that already exist in your car — it is reversible and I can return any setting to factory before a dealer visit. I will always tell you up front if a specific request is likely to be flagged.',
  },
  {
    q: 'Which BMW models do you cover?',
    a: 'F, G and I-series across NBT, NBT Evo and MGU (iDrive 6/7/8) head units. Send me your model, year and VIN-derived build and I will confirm exactly what is possible on your car.',
  },
  {
    q: 'Do I need to drive anywhere?',
    a: 'No — that is the whole point. I come to your home, workplace or wherever the car is parked across Dublin and the surrounding counties. Most coding jobs are done in under an hour at your door.',
  },
  {
    q: 'How do I pay?',
    a: 'On completion, once you have seen the feature working. Card or cash on site. Prices for diagnostics and conversions are confirmed before I start so there are no surprises.',
  },
  {
    q: 'Can you retrofit hardware, not just code?',
    a: 'Yes — ambient lighting, cruise control and similar retrofits that need wiring or modules can be scoped. Some need parts ordered first, so message me early and I will quote the full job.',
  },
  {
    q: 'My import is Japanese spec — can you convert it?',
    a: 'Japan→EU conversions are a regular job: region change, FSC, ETC mirror handling and TCB considerations. Send the details and I will tell you what your specific car needs.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="grid grid-cols-12 gap-x-4 md:gap-x-10 gap-y-10">
          <div className="col-span-12 md:col-span-4">
            <div className="mb-4 flex items-center gap-3">
              <span className="label">05 / FAQ</span>
              <span className="m-stripe h-[2px] w-10" />
            </div>
            <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.9]">
              QUESTIONS, <br /> ANSWERED
            </h2>
          </div>

          <div className="col-span-12 md:col-span-8">
            <ul className="border-t border-white/8">
              {FAQS.map((f, i) => {
                const isOpen = open === i;
                return (
                  <li key={i} className="border-b border-white/8">
                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-6 py-6 text-left"
                      aria-expanded={isOpen}
                    >
                      <span className="text-lg font-semibold text-ink">{f.q}</span>
                      <Plus
                        size={20}
                        className={`shrink-0 text-bmw transition-transform duration-300 ${
                          isOpen ? 'rotate-45' : ''
                        }`}
                      />
                    </button>
                    <div
                      className="grid transition-all duration-300 ease-out"
                      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                    >
                      <div className="overflow-hidden">
                        <p className="max-w-2xl pb-6 leading-relaxed text-muted">{f.a}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
