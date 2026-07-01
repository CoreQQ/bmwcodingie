'use client';

import { useState } from 'react';
import { ScanLine, Loader2, Check, AlertTriangle, ArrowRight, MessageCircle, Download } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Decoded = {
  ok: boolean;
  isBmw?: boolean;
  make?: string;
  model?: string;
  series?: string;
  year?: string;
  body?: string;
  engine?: string;
  headUnit?: string;
  error?: string;
};

function waLink(whatsapp: string, text: string): string {
  const digits = whatsapp.replace(/[^\d]/g, '');
  if (!digits) return '#';
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function VinDecoder({ whatsapp }: { whatsapp: string }) {
  const t = useTranslations('VinDecoder');
  const [vin, setVin] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'invalid' | 'notbmw' | 'error'>('idle');
  const [result, setResult] = useState<Decoded | null>(null);

  const cleaned = vin.replace(/[^A-HJ-NPR-Z0-9]/gi, '').toUpperCase().slice(0, 17);

  async function decode(e: React.FormEvent) {
    e.preventDefault();
    if (cleaned.length !== 17) {
      setStatus('invalid');
      return;
    }
    setStatus('loading');
    setResult(null);
    try {
      const res = await fetch(`/api/vin?vin=${cleaned}`);
      const data: Decoded = await res.json();
      if (!data.ok) {
        setStatus(data.error === 'invalid_vin' ? 'invalid' : 'error');
        return;
      }
      setResult(data);
      setStatus(data.isBmw ? 'done' : 'notbmw');
    } catch {
      setStatus('error');
    }
  }

  const rows: [string, string | undefined][] = result
    ? [
        [t('model'), result.model],
        [t('series'), result.series],
        [t('year'), result.year],
        [t('body'), result.body],
        [t('engine'), result.engine],
      ]
    : [];

  const waText = result
    ? `${t('waText')} ${cleaned} (${[result.year, result.model].filter(Boolean).join(' ')}). `
    : '';

  return (
    <div id="vin" className="border border-white/10 bg-graphite-800">
      <div className="m-stripe h-1 w-full" />
      <div className="p-6 md:p-8">
        <div className="mb-4 flex items-center gap-2">
          <ScanLine size={16} className="text-bmw" />
          <span className="label">{t('eyebrow')}</span>
        </div>
        <h2 className="font-display text-[clamp(1.6rem,4vw,2.6rem)] leading-tight">{t('heading')}</h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">{t('intro')}</p>

        <form onSubmit={decode} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={vin}
            onChange={(e) => {
              setVin(e.target.value);
              if (status !== 'idle') setStatus('idle');
            }}
            placeholder={t('placeholder')}
            spellCheck={false}
            autoCapitalize="characters"
            maxLength={20}
            aria-label="VIN"
            className="w-full flex-1 border border-white/10 bg-graphite-900 px-4 py-3 font-mono text-sm uppercase tracking-wider text-ink placeholder:text-faint placeholder:normal-case outline-none transition-colors focus:border-bmw"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="btn-primary shrink-0 justify-center disabled:opacity-60"
          >
            {status === 'loading' ? (
              <>
                <Loader2 size={15} className="animate-spin" /> {t('decoding')}
              </>
            ) : (
              t('button')
            )}
          </button>
        </form>

        <p className="mt-2 font-mono text-[11px] text-faint">
          {cleaned.length}/17
        </p>

        {status === 'invalid' && <Notice icon="warn" text={t('invalid')} />}
        {status === 'error' && <Notice icon="warn" text={t('error')} />}
        {status === 'notbmw' && <Notice icon="warn" text={t('notBmw')} />}

        {status === 'done' && result && (
          <div className="mt-6 border border-bmw/30 bg-bmw/5 p-5">
            <div className="mb-3 flex items-center gap-2 text-bmw">
              <Check size={16} />
              <span className="label text-bmw">{t('resultTitle')}</span>
            </div>
            <p className="font-display text-[clamp(1.5rem,4vw,2.2rem)] leading-none text-ink">
              {`${result.make || 'BMW'} ${result.model || ''}`.trim()}
            </p>
            {[result.series, result.year, result.body].filter(Boolean).length > 0 && (
              <p className="mt-1.5 font-mono text-xs uppercase tracking-wider text-muted">
                {[result.series, result.year, result.body].filter(Boolean).join(' · ')}
              </p>
            )}

            {result.headUnit && (
              <div className="mt-4 border border-white/10 bg-graphite-900 p-4">
                <p className="font-mono text-[11px] uppercase tracking-wider text-faint">{t('headUnit')}</p>
                <p className="mt-1 text-lg font-semibold text-bmw">{result.headUnit}</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-faint">{t('headUnitNote')}</p>
              </div>
            )}

            <dl className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
              {rows
                .filter(([, v]) => v)
                .map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3 border-b border-white/5 pb-1.5">
                    <dt className="font-mono text-[11px] uppercase tracking-wider text-faint">{k}</dt>
                    <dd className="text-right text-sm text-ink">{v}</dd>
                  </div>
                ))}
            </dl>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#model-check"
                className="btn-primary"
                onClick={() =>
                  document.getElementById('model-check')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                {t('ctaOptions')} <ArrowRight size={15} />
              </a>
              <a
                href={`/api/vin/report?vin=${cleaned}`}
                className="btn-ghost inline-flex items-center gap-2"
              >
                <Download size={15} /> {t('download')}
              </a>
              <a
                href={waLink(whatsapp, waText)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost inline-flex items-center gap-2"
              >
                <MessageCircle size={15} /> {t('ctaWhatsApp')}
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Notice({ icon, text }: { icon: 'warn'; text: string }) {
  return (
    <div className="mt-4 flex items-start gap-2 border border-white/10 bg-graphite-900 p-4 text-sm text-muted">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
      <span>{text}</span>
    </div>
  );
}
