'use client';

import { useState } from 'react';
import { ScanSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { waHref } from '@/lib/waMessage';
import { trackGoogleConversion } from './GoogleAdsTag';
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
  const [state, setState] = useState<'idle' | 'sent' | 'error'>('idle');

  const clean = vin.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const valid = clean.length === 7;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setState('error');
      return;
    }
    const payload = JSON.stringify({ vin: clean, model, service, phone, page: path });
    // keepalive so the heads-up still reaches Alex when WhatsApp takes over the tab.
    fetch('/api/vin-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    trackMetaEvent('Lead', { content_name: `VIN check · ${service}` });
    trackGoogleConversion();
    if (phone.trim()) {
      setState('sent');
      return;
    }
    const text =
      `Hi, I'd like to check my BMW.\n` +
      `VIN (last 7): ${clean}\n` +
      (model ? `Model: ${model}\n` : '') +
      `Interested in: ${service}`;
    window.open(waHref(whatsapp, text), '_blank', 'noopener');
  }

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

          <form onSubmit={submit} className="space-y-3 md:col-span-7">
            {state === 'sent' ? (
              <div role="alert" className="border border-bmw/40 bg-bmw/10 p-5 text-sm text-ink">{t('sent')}</div>
            ) : (
              <>
                <label className="block">
                  <span className="label mb-2 block">{t('vinLabel')} *</span>
                  <input
                    value={vin}
                    onChange={(e) => {
                      setVin(e.target.value);
                      if (state === 'error') setState('idle');
                    }}
                    maxLength={9}
                    autoCapitalize="characters"
                    autoComplete="off"
                    placeholder="e.g. FK41749"
                    className={`${input} font-mono uppercase tracking-widest`}
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="label mb-2 block">{t('modelLabel')}</span>
                    <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. F30 320d, 2017" className={input} />
                  </label>
                  <label className="block">
                    <span className="label mb-2 block">{t('serviceLabel')}</span>
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
                  <span className="label mb-2 block">{t('phoneLabel')}</span>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+353 …" className={input} />
                </label>
                {state === 'error' && <p className="text-sm text-red-400">{t('vinError')}</p>}
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
