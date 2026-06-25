'use client';

import { useMemo, useState } from 'react';
import { Check, X, HelpCircle, Sparkles } from 'lucide-react';
import type { CarModel, CategoryWithServices, ModelCompatibility, SiteSettings } from '@/lib/types';
import { waLink } from '@/lib/data';

const STATUS_META = {
  yes: { label: 'Available', icon: Check, cls: 'border-bmw/40 bg-bmw/10 text-bmw' },
  no: { label: 'Not available', icon: X, cls: 'border-m-red/40 bg-m-red/10 text-m-red' },
  on_request: { label: 'On request', icon: HelpCircle, cls: 'border-white/15 bg-white/5 text-muted' },
} as const;

export function ModelPicker({
  models,
  catalog,
  compatibility,
  settings,
}: {
  models: CarModel[];
  catalog: CategoryWithServices[];
  compatibility: ModelCompatibility[];
  settings: SiteSettings;
}) {
  const [selectedId, setSelectedId] = useState<number | ''>('');

  const selectedModel = models.find((m) => m.id === selectedId) ?? null;

  const compatMap = useMemo(() => {
    const map = new Map<number, ModelCompatibility>();
    if (!selectedId) return map;
    for (const c of compatibility) {
      if (c.model_id === selectedId) map.set(c.service_id, c);
    }
    return map;
  }, [compatibility, selectedId]);

  const allServices = useMemo(() => catalog.flatMap((c) => c.services), [catalog]);

  function statusFor(serviceId: number) {
    return compatMap.get(serviceId)?.status ?? 'on_request';
  }

  const available = selectedId
    ? allServices.filter((s) => statusFor(s.id) === 'yes')
    : [];

  function requestQuote() {
    if (!selectedModel) return;
    const titles = available.map((s) => s.title);
    const message = titles.length
      ? `I'd like a quote for my ${selectedModel.label}: ${titles.join(', ')}.`
      : `I have a ${selectedModel.label} — can you tell me what's possible?`;
    sessionStorage.setItem(
      'bmw_quote_handoff',
      JSON.stringify({
        bmw_model: `${selectedModel.chassis_code} (${selectedModel.label})`,
        service: titles.length === 1 ? titles[0] : 'Multiple — see message',
        message,
      }),
    );
    window.location.href = '/#contact';
  }

  if (models.length === 0) {
    return (
      <section className="border-t border-white/5 py-16 md:py-24">
        <div className="mx-auto max-w-edge px-5 md:px-8">
          <p className="max-w-lg text-muted">
            We&apos;re still building out the model list. Message us your exact chassis code and
            year on WhatsApp and we&apos;ll tell you straight away what&apos;s possible.
          </p>
          <a
            href={waLink(settings.whatsapp, 'Hi — I have a BMW and want to know what coding is possible.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-6 inline-flex"
          >
            Ask on WhatsApp
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="max-w-md">
          <label className="block">
            <span className="label mb-2 block">Your BMW</span>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : '')}
              className="w-full border border-white/10 bg-graphite-900 px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-bmw"
            >
              <option value="">Select chassis code &amp; year…</option>
              {models.map((m) => (
                <option key={m.id} value={m.id} className="bg-graphite-800">
                  {m.chassis_code} — {m.label} ({m.year_from}–{m.year_to ?? 'present'})
                </option>
              ))}
            </select>
          </label>
        </div>

        {!selectedModel ? (
          <p className="mt-10 text-sm text-faint">
            Don&apos;t see your exact chassis listed?{' '}
            <a
              href={waLink(settings.whatsapp, 'Hi — I have a BMW and want to know what coding is possible.')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-bmw underline-offset-2 hover:underline"
            >
              Ask us on WhatsApp
            </a>
            .
          </p>
        ) : (
          <div className="mt-12">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6 border border-white/10 bg-graphite-800/50 p-6">
              <div>
                <p className="label">Showing results for</p>
                <p className="mt-1 font-display text-3xl text-ink">{selectedModel.chassis_code}</p>
                <p className="text-sm text-muted">{selectedModel.label}</p>
              </div>
              <button onClick={requestQuote} className="btn-primary inline-flex items-center gap-2">
                <Sparkles size={16} /> Get a quote for this model
              </button>
            </div>

            <div className="space-y-14">
              {catalog.map((cat) => (
                <div key={cat.id}>
                  <h3 className="mb-4 font-display text-2xl tracking-wide text-muted">{cat.name}</h3>
                  <div className="space-y-1.5">
                    {cat.services.map((s) => {
                      const status = statusFor(s.id);
                      const meta = STATUS_META[status];
                      const Icon = meta.icon;
                      const note = compatMap.get(s.id)?.note;
                      return (
                        <div
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-3 border border-white/8 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm text-ink">{s.title}</p>
                            {note && <p className="mt-0.5 text-xs text-faint">{note}</p>}
                          </div>
                          <span
                            className={`inline-flex shrink-0 items-center gap-1.5 border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${meta.cls}`}
                          >
                            <Icon size={12} /> {meta.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
