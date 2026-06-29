'use client';

import { useEffect, useState } from 'react';
import { Phone, MessageCircle, Send, Instagram, Mail, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SiteSettings } from '@/lib/types';
import { waLink } from '@/lib/data';
import { trackMetaEvent } from './MetaPixel';
import { trackGoogleConversion } from './GoogleAdsTag';
import { SlotPicker } from './SlotPicker';

export function Contact({
  settings,
  serviceOptions,
}: {
  settings: SiteSettings;
  serviceOptions: string[];
}) {
  const t = useTranslations('Contact');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    name: '',
    contact: '',
    bmw_model: '',
    service: '',
    message: '',
    slot_date: '',
    slot_time: '',
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  // Lets the quote builder hand off its selection without prop drilling —
  // both sections are mounted on the same page at the same time.
  useEffect(() => {
    function onQuoteApply(e: Event) {
      const detail = (e as CustomEvent<{ service: string; message: string }>).detail;
      setForm((f) => ({ ...f, service: detail.service, message: detail.message }));
    }
    window.addEventListener('quote:apply', onQuoteApply);
    return () => window.removeEventListener('quote:apply', onQuoteApply);
  }, []);

  // The /models page hands off its selection via sessionStorage since it's a
  // separate page navigation, not a same-page event.
  useEffect(() => {
    const raw = sessionStorage.getItem('bmw_quote_handoff');
    if (!raw) return;
    sessionStorage.removeItem('bmw_quote_handoff');
    try {
      const detail = JSON.parse(raw) as { bmw_model?: string; service?: string; message?: string };
      setForm((f) => ({
        ...f,
        bmw_model: detail.bmw_model ?? f.bmw_model,
        service: detail.service ?? f.service,
        message: detail.message ?? f.message,
      }));
    } catch {
      // ignore malformed handoff data
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) {
      setStatus('error');
      setErrorMsg(t('validationError'));
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('failed');
      setStatus('sent');
      trackMetaEvent('Lead', { content_name: form.service || 'General enquiry' });
      trackGoogleConversion();
      setForm({ name: '', contact: '', bmw_model: '', service: '', message: '', slot_date: '', slot_time: '' });
    } catch {
      setStatus('error');
      setErrorMsg(t('submitError'));
    }
  }

  const tg = settings.telegram.replace(/^@/, '');
  const ig = settings.instagram.replace(/^@/, '');

  return (
    <section id="contact" className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="mb-12 flex items-center gap-3">
          <span className="label">{t('eyebrow')}</span>
          <span className="m-stripe h-[2px] w-10" />
        </div>

        <div className="grid grid-cols-12 gap-x-4 md:gap-x-10 gap-y-12">
          {/* Left: pitch + direct contact */}
          <div className="col-span-12 lg:col-span-5">
            <h2 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.9]">
              {t('heading1')} <br /> {t('heading2')}
            </h2>
            <p className="mt-6 max-w-md text-muted">{t('intro')}</p>

            <div className="mt-9 space-y-3">
              <a
                href={waLink(settings.whatsapp, 'Hi — I’d like to book BMW coding.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 border border-white/10 p-4 transition-colors hover:border-bmw"
              >
                <MessageCircle size={20} className="text-bmw" />
                <span className="font-mono text-sm uppercase tracking-wider text-ink">{t('whatsapp')}</span>
                <span className="ml-auto text-sm text-muted">{settings.whatsapp}</span>
              </a>
              <a
                href={`https://instagram.com/${ig}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 border border-white/10 p-4 transition-colors hover:border-bmw"
              >
                <Instagram size={20} className="text-bmw" />
                <span className="font-mono text-sm uppercase tracking-wider text-ink">{t('instagram')}</span>
                <span className="ml-auto text-sm text-muted">@{ig}</span>
              </a>
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-4 border border-white/10 p-4 transition-colors hover:border-bmw"
              >
                <Phone size={20} className="text-bmw" />
                <span className="font-mono text-sm uppercase tracking-wider text-ink">{t('call')}</span>
                <span className="ml-auto text-sm text-muted">{settings.phone}</span>
              </a>
            </div>

            <div className="mt-6 flex items-start gap-2 text-sm text-muted">
              <MapPin size={16} className="mt-0.5 shrink-0 text-bmw" />
              <span>{settings.service_area}</span>
            </div>
          </div>

          {/* Right: form */}
          <div className="col-span-12 lg:col-span-7">
            <div className="border border-white/10 bg-graphite-800/50">
              <div className="m-stripe h-1 w-full" />
              <form onSubmit={submit} className="space-y-5 p-6 md:p-8">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t('nameLabel')}>
                    <input
                      value={form.name}
                      onChange={update('name')}
                      placeholder={t('namePlaceholder')}
                      required
                      aria-required="true"
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t('contactLabel')}>
                    <input
                      value={form.contact}
                      onChange={update('contact')}
                      placeholder={t('contactPlaceholder')}
                      required
                      aria-required="true"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label={t('modelLabel')}>
                    <input
                      value={form.bmw_model}
                      onChange={update('bmw_model')}
                      placeholder={t('modelPlaceholder')}
                      className={inputCls}
                    />
                  </Field>
                  <Field label={t('serviceLabel')}>
                    <select value={form.service} onChange={update('service')} className={inputCls}>
                      <option value="">{t('serviceSelectPlaceholder')}</option>
                      {form.service &&
                        !serviceOptions.includes(form.service) &&
                        form.service !== 'Other / not sure' && (
                          <option value={form.service} className="bg-graphite-800">
                            {form.service}
                          </option>
                        )}
                      {serviceOptions.map((s) => (
                        <option key={s} value={s} className="bg-graphite-800">
                          {s}
                        </option>
                      ))}
                      <option value="Other / not sure" className="bg-graphite-800">
                        {t('serviceOther')}
                      </option>
                    </select>
                  </Field>
                </div>

                <Field label={t('messageLabel')}>
                  <textarea
                    value={form.message}
                    onChange={update('message')}
                    rows={3}
                    placeholder={t('messagePlaceholder')}
                    className={`${inputCls} resize-none`}
                  />
                </Field>

                <SlotPicker
                  value={{ date: form.slot_date, time: form.slot_time }}
                  onChange={(v) => setForm((f) => ({ ...f, slot_date: v.date, slot_time: v.time }))}
                />

                {status === 'sent' ? (
                  <div role="alert" className="border border-bmw/40 bg-bmw/10 p-4 text-sm text-ink">
                    {t('sentMessage')}
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="btn-primary w-full disabled:opacity-60"
                  >
                    {status === 'sending' ? t('sendingButton') : t('sendButton')}
                  </button>
                )}
                {status === 'error' && (
                  <p role="alert" className="text-sm text-m-red">{errorMsg}</p>
                )}

                <div className="flex items-center gap-4 pt-1 text-faint">
                  <a
                    href={`https://instagram.com/${ig}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs transition-colors hover:text-ink"
                  >
                    <Instagram size={14} /> @{ig}
                  </a>
                  <a
                    href={`mailto:${settings.email}`}
                    className="inline-flex items-center gap-1.5 text-xs transition-colors hover:text-ink"
                  >
                    <Mail size={14} /> {settings.email}
                  </a>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const inputCls =
  'w-full border border-white/10 bg-graphite-900 px-4 py-3 text-sm text-ink placeholder:text-faint outline-none transition-colors focus:border-bmw';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label mb-2 block">{label}</span>
      {children}
    </label>
  );
}
