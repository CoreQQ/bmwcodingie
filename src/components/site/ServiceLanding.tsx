import { ArrowRight, Check, MapPin, MessageCircle } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getSettings, waLink } from '@/lib/data';
import { Header } from './Header';
import { Footer } from './Footer';
import { SERVICE_PAGES, HONEST_COMPATIBILITY_NOTE } from '@/lib/servicePages';
import { MobileActionBar } from './MobileActionBar';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';
const AREA = ['Dublin', 'Kildare', 'Wicklow', 'Meath', 'Ireland'];

export async function ServiceLanding({ slug }: { slug: string }) {
  const p = SERVICE_PAGES[slug];
  if (!p) return null;
  const settings = await getSettings();

  const wa = waLink(settings.whatsapp, p.waMessage);
  const url = `${SITE_URL}/${p.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        '@id': `${url}#service`,
        name: p.serviceName,
        serviceType: p.serviceName,
        description: p.metaDescription,
        url,
        areaServed: AREA.map((name) => ({ '@type': 'AdministrativeArea', name })),
        provider: {
          '@type': 'AutoRepair',
          name: 'BMW Coding',
          url: SITE_URL,
          telephone: settings.phone,
          email: settings.email,
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: p.faqs.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: p.serviceName, item: url },
        ],
      },
    ],
  };

  const ctaRow = (
    <div className="mt-8 flex flex-wrap items-center gap-4">
      <Link href="/#contact" className="btn-primary">
        Book BMW Coding
      </Link>
      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center gap-2">
        <MessageCircle size={16} /> WhatsApp Your BMW Details
      </a>
    </div>
  );

  return (
    <div className="grain relative min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
        }}
      />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/5 pb-14 pt-28 md:pb-20 md:pt-40">
          <div className="absolute inset-0 -z-10">
            <div className="blueprint absolute inset-0 opacity-60" />
            <div className="absolute inset-0 hero-glow" />
          </div>
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-faint">
              <Link href="/" className="transition-colors hover:text-ink">Home</Link>
              <span>/</span>
              <span className="text-muted">{p.serviceName}</span>
            </nav>
            <div className="mb-5 flex items-center gap-3">
              <span className="m-stripe h-[3px] w-12" />
              <span className="label text-muted">{p.eyebrow}</span>
            </div>
            <h1 className="max-w-4xl font-display text-[clamp(2.1rem,6vw,4.2rem)] leading-[0.95]">{p.h1}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">{p.heroSub}</p>
            {ctaRow}
            <p className="mt-6 flex items-center gap-2 text-sm text-faint">
              <MapPin size={15} className="text-bmw" /> In person across Dublin, Kildare, Wicklow &amp; Meath · remote across Ireland
            </p>
          </div>
        </section>

        {/* Intro */}
        <section className="border-b border-white/5 py-16 md:py-20">
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <div className="grid grid-cols-12 gap-x-10 gap-y-8">
              <div className="col-span-12 lg:col-span-7">
                {p.intro.map((para, i) => (
                  <p key={i} className="mb-5 max-w-2xl text-base leading-relaxed text-muted">{para}</p>
                ))}
              </div>
              <div className="col-span-12 lg:col-span-5">
                <div className="border border-white/10 bg-graphite-800">
                  <div className="m-stripe h-1 w-full" />
                  <div className="p-6">
                    <h2 className="label mb-4">{p.includedHeading}</h2>
                    <ul className="space-y-2.5">
                      {p.included.map((it) => (
                        <li key={it} className="flex items-start gap-2.5 text-sm text-ink">
                          <Check size={16} className="mt-0.5 shrink-0 text-bmw" /> {it}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Supported models */}
        <section className="border-b border-white/5 py-16 md:py-20">
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] leading-tight">{p.modelsHeading}</h2>
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {p.models.map((m) => (
                <li key={m} className="flex items-start gap-3 border border-white/8 bg-graphite-800/40 p-4 text-sm text-muted">
                  <span className="m-stripe mt-1 h-3 w-[3px] shrink-0" /> {m}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Process */}
        <section className="border-b border-white/5 py-16 md:py-20">
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] leading-tight">How it works</h2>
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {p.process.map((step, i) => (
                <div key={step.title} className="border border-white/8 bg-graphite-800/40 p-5">
                  <span className="font-mono text-xs text-bmw">0{i + 1}</span>
                  <h3 className="mt-2 text-base font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
                </div>
              ))}
            </div>
            {ctaRow}
          </div>
        </section>

        {/* FAQ */}
        <section className="border-b border-white/5 py-16 md:py-20">
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <h2 className="font-display text-[clamp(1.8rem,4vw,3rem)] leading-tight">Frequently asked questions</h2>
            <div className="mt-8 max-w-3xl divide-y divide-white/8 border-y border-white/8">
              {p.faqs.map((f) => (
                <div key={f.q} className="py-6">
                  <h3 className="text-lg font-semibold text-ink">{f.q}</h3>
                  <p className="mt-2 leading-relaxed text-muted">{f.a}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 max-w-3xl text-sm leading-relaxed text-faint">{HONEST_COMPATIBILITY_NOTE}</p>
          </div>
        </section>

        {/* Related + CTA */}
        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <h2 className="label mb-5">Related BMW services</h2>
            <div className="flex flex-wrap gap-3">
              {p.related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${r.slug}`}
                  className="inline-flex items-center gap-2 border border-white/10 px-4 py-2.5 text-sm text-muted transition-colors hover:border-bmw hover:text-ink"
                >
                  {r.label} <ArrowRight size={14} />
                </Link>
              ))}
            </div>

            <div className="mt-12 border border-white/10 bg-graphite-800">
              <div className="m-stripe h-1 w-full" />
              <div className="flex flex-col items-start justify-between gap-5 p-7 md:flex-row md:items-center">
                <div>
                  <h2 className="font-display text-2xl text-ink">Ready when you are</h2>
                  <p className="mt-1 text-sm text-muted">Send your model, year and what you want — we’ll confirm what’s possible and the price up front.</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-3">
                  <Link href="/#contact" className="btn-primary">Book BMW Coding</Link>
                  <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex items-center gap-2">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer settings={settings} />
      <MobileActionBar phone={settings.phone} whatsapp={settings.whatsapp} />
    </div>
  );
}
