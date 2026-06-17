'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Send, Instagram, Mail, MapPin } from 'lucide-react';
import type { SiteSettings } from '@/lib/types';
import { waLink } from '@/lib/data';
import { trackMetaEvent } from './MetaPixel';

export function Contact({
  settings,
  serviceOptions,
}: {
  settings: SiteSettings;
  serviceOptions: string[];
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    name: '',
    contact: '',
    bmw_model: '',
    service: '',
    message: '',
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) {
      setStatus('error');
      setErrorMsg('Please add at least your name and a contact number.');
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
      setForm({ name: '', contact: '', bmw_model: '', service: '', message: '' });
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong — please try again or message us on WhatsApp.');
    }
  }

  const tg = settings.telegram.replace(/^@/, '');
  const ig = settings.instagram.replace(/^@/, '');

  return (
    <section id="contact" className="relative border-t border-white/5 py-20 md:py-28">
      <div className="mx-auto max-w-edge px-5 md:px-8">
        <div className="mb-12 flex items-center gap-3">
          <span className="label">06 / Book</span>
          <span className="m-stripe h-[2px] w-10" />
        </div>

        <div className="grid grid-cols-12 gap-x-4 md:gap-x-10 gap-y-12">
          {/* Left: pitch + direct contact */}
          <div className="col-span-12 lg:col-span-5">
            <h2 className="font-display text-[clamp(2.5rem,7vw,5rem)] leading-[0.9]">
              BOOK <br /> A SLOT
            </h2>
            <p className="mt-6 max-w-md text-muted">
              Tell us the car and what you need. We’ll reply with whether it’s codable, a price and
              the soonest slot. Prefer to chat? Message us directly.
            </p>

            <div className="mt-9 space-y-3">
              <a
                href={waLink(settings.whatsapp, 'Hi — I’d like to book BMW coding.')}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 border border-white/10 p-4 transition-colors hover:border-bmw"
              >
                <MessageCircle size={20} className="text-bmw" />
                <span className="font-mono text-sm uppercase tracking-wider text-ink">WhatsApp</span>
                <span className="ml-auto text-sm text-muted">{settings.whatsapp}</span>
              </a>
              <a
                href={`https://instagram.com/${ig}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 border border-white/10 p-4 transition-colors hover:border-bmw"
              >
                <Instagram size={20} className="text-bmw" />
                <span className="font-mono text-sm uppercase tracking-wider text-ink">Instagram</span>
                <span className="ml-auto text-sm text-muted">@{ig}</span>
              </a>
              <a
                href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                className="flex items-center gap-4 border border-white/10 p-4 transition-colors hover:border-bmw"
              >
                <Phone size={20} className="text-bmw" />
                <span className="font-mono text-sm uppercase tracking-wider text-ink">Call</span>
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
                  <Field label="Name *">
                    <input
                      value={form.name}
                      onChange={update('name')}
                      placeholder="Your name"
                      required
                      aria-required="true"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Phone / WhatsApp *">
                    <input
                      value={form.contact}
                      onChange={update('contact')}
                      placeholder="+353 …"
                      required
                      aria-required="true"
                      className={inputCls}
                    />
                  </Field>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="BMW model & year">
                    <input
                      value={form.bmw_model}
                      onChange={update('bmw_model')}
                      placeholder="e.g. G30 530e, 2019"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Service needed">
                    <select value={form.service} onChange={update('service')} className={inputCls}>
                      <option value="">Select…</option>
                      {serviceOptions.map((s) => (
                        <option key={s} value={s} className="bg-graphite-800">
                          {s}
                        </option>
                      ))}
                      <option value="Other / not sure" className="bg-graphite-800">
                        Other / not sure
                      </option>
                    </select>
                  </Field>
                </div>

                <Field label="Anything else">
                  <textarea
                    value={form.message}
                    onChange={update('message')}
                    rows={3}
                    placeholder="Tell us what you’re after…"
                    className={`${inputCls} resize-none`}
                  />
                </Field>

                {status === 'sent' ? (
                  <div role="alert" className="border border-bmw/40 bg-bmw/10 p-4 text-sm text-ink">
                    Got it — we’ll be in touch shortly. For anything urgent, message us on WhatsApp.
                  </div>
                ) : (
                  <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="btn-primary w-full disabled:opacity-60"
                  >
                    {status === 'sending' ? 'Sending…' : 'Send request'}
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
