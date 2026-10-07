'use client';

import { useState } from 'react';
import { ScanSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { waHref } from '@/lib/waMessage';
import { normalizePhone } from '@/lib/phone';
import { trackGaEvent, trackGoogleConversion } from './GoogleAdsTag';
import { trackMetaEvent } from './MetaPixel';

// Grouped so a long list still reads quickly in the phone's picker.
const SERVICE_GROUPS: { label: string; items: string[] }[] = [
  {
    label: 'Phone & screen',
    items: ['Apple CarPlay', 'Fullscreen CarPlay', 'Android Auto', 'Video in Motion (passenger use)'],
  },
  {
    label: 'Import & navigation',
    items: ['Japan → EU conversion', 'Navigation map update / FSC code', 'Language / radio region change'],
  },
  {
    label: 'Coding',
    items: [
      'Hidden features / custom coding',
      'Folding mirrors / Comfort Access',
      'Lighting (welcome, DRL, indicators)',
      'Sport displays / digital speed',
      'Start/Stop, seatbelt & reminders',
    ],
  },
  {
    label: 'Upgrades & retrofits',
    items: [
      'iDrive ID4 → ID6',
      '6WA → 6WB digital cluster',
      'Reverse camera retrofit',
      'Ambient lighting retrofit',
      'Cruise control',
    ],
  },
  {
    label: 'Diagnostics & other',
    items: ['Diagnostics / warning light', 'Stage 1 / Stage 2 remap', 'Not sure — advise me', 'Other'],
  },
];
const SERVICES = SERVICE_GROUPS.flatMap((g) => g.items);

/**
 * Compatibility check: last 7 of the VIN plus what they want. With a number
 * it is sent through the site; without one it opens WhatsApp with everything
 * already typed, and Alex is told in the background either way.
 */
export function VinCheck({ whatsapp }: { whatsapp: string }) {
  const t = useTranslations('VinCheck');
  const path = usePathname() || '/';
  const [vin, setVin] = useState('');
  const [model, setModel] = useState('');
  const [service, setService] = useState(SERVICES[0]);
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<'idle' | 'sent'>('idle');
  // Which field is wrong, so the message sits under the field and the rest stays quiet.
  const [error, setError] = useState<'vin' | 'model' | 'phone' | null>(null);

  const clean = vin.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const vinOk = clean.length === 7;
  const e164 = normalizePhone(phone);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // Every field is required: a check with no number or no car is a lead
    // Alex cannot act on (that is what the old optional form produced).
    if (!vinOk) return setError('vin');
    if (model.trim().length < 3) return setError('model');
    if (!e164) return setError('phone');
    setError(null);
    const payload = JSON.stringify({ vin: clean, model: model.trim(), service, phone: e164, page: path });
    fetch('/api/vin-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    trackMetaEvent('Lead', { content_name: `VIN check · ${service}` });
    trackGoogleConversion();
    trackGaEvent('vin_check_submit', { service });
    setState('sent');
  }

  // After sending, the same details pre-typed for WhatsApp so the chat can start at once.
  const waText =
    `Hi, I'd like to check my BMW.\n` +
    `VIN (last 7): ${clean}\n` +
    (model ? `Model: ${model}\n` : '') +
    `Interested in: ${service}`;

  const input = 'w-full border border-white/10 bg-graphite-800 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-bmw focus:outline-none';

  return (
    <section id="vin-check" className="relative border-t border-white/5 py-16 md:py-24">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="grid gap-8 border border-bmw/30 bg-graphite-900/70 p-6 md:grid-cols-12 md:p-10">
          <div className="md:col-span-5">
            <div className="mb-4 flex items-center gap-3">
              <ScanSearch size={18} className="text-bmw" />
              <span className="label">{t('eyebrow')}</span>
            </div>
            <h2 className="font-display text-[clamp(2rem,5vw,3.4rem)] leading-[0.95]">{t('heading')}</h2>
            <p className="mt-4 text-muted">{t('body')}</p>
          </div>

          <form onSubmit={submit} noValidate className="space-y-3 md:col-span-7">
            {state === 'sent' ? (
              <div role="alert" className="border border-bmw/40 bg-bmw/10 p-5 text-sm text-ink">
                <p>{t('sent')}</p>
                <a href={waHref(whatsapp, waText)} target="_blank" rel="noopener noreferrer" className="btn-ghost mt-4 inline-flex items-center gap-2">
                  {t('sentWhatsapp')}
                </a>
              </div>
            ) : (
              <>
                <label className="block">
                  <span className="label mb-2 block">{t('vinLabel')} *</span>
                  <input
                    value={vin}
                    onChange={(e) => {
                      setVin(e.target.value);
                      if (error === 'vin') setError(null);
                    }}
                    required
                    aria-invalid={error === 'vin'}
                    maxLength={9}
                    autoCapitalize="characters"
                    autoComplete="off"
                    placeholder="e.g. FK41749"
                    className={`${input} font-mono uppercase tracking-widest`}
                  />
                  {error === 'vin' && <p className="mt-2 text-sm text-red-400">{t('vinError')}</p>}
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="label mb-2 block">{t('modelLabel')} *</span>
                    <input
                      value={model}
                      onChange={(e) => {
                        setModel(e.target.value);
                        if (error === 'model') setError(null);
                      }}
                      placeholder="e.g. F30 320d, 2017"
                      required
                      aria-invalid={error === 'model'}
                      className={input}
                    />
                    {error === 'model' && <p className="mt-2 text-sm text-red-400">{t('modelError')}</p>}
                  </label>
                  <label className="block">
                    <span className="label mb-2 block">{t('serviceLabel')} *</span>
                    <select value={service} onChange={(e) => setService(e.target.value)} className={input}>
                      {SERVICE_GROUPS.map((g) => (
                        <optgroup key={g.label} label={g.label} className="bg-graphite-800">
                          {g.items.map((s) => (
                            <option key={s} value={s} className="bg-graphite-800">{s}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block">
                  <span className="label mb-2 block">{t('phoneLabel')} *</span>
                  <input
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (error === 'phone') setError(null);
                    }}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="087 123 4567 or +353 …"
                    required
                    aria-invalid={error === 'phone'}
                    className={input}
                  />
                  {error === 'phone' && <p className="mt-2 text-sm text-red-400">{t('phoneError')}</p>}
                </label>
                <button type="submit" className="btn-primary w-full justify-center">
                  {t('cta')}
                </button>
                <p className="text-[12px] text-faint">{t('hint')}</p>
              </>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
