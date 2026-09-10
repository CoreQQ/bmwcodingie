import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AlertTriangle, MapPin, MessageCircle, Navigation, Phone, Truck } from 'lucide-react';
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import { MobileActionBar } from '@/components/site/MobileActionBar';
import { getSettings, waLink } from '@/lib/data';
import { isMobileOnly, mobileFromLabel } from '@/lib/transition';
import {
  ADDRESS_LINE,
  STEPS,
  appleDirectionsUrl,
  googleDirectionsUrl,
  mapEmbedUrl,
} from '@/lib/directions';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const mobileOnly = isMobileOnly();
  const title = mobileOnly
    ? 'Mobile BMW Coding — We Come to You | Dublin & Nationwide Remote'
    : 'Find Us | BMW Coding Workshop — Greenogue Business Park, Rathcoole';
  const description = mobileOnly
    ? 'BMW Coding is a mobile service: we come to your home or workplace across Dublin, Kildare, Wicklow and Meath, or work remotely over ENET anywhere in Ireland.'
    : 'How to find the BMW Coding workshop in Greenogue Business Park, Rathcoole (West Dublin, off the N7). Use our directions button — sat-nav pins route into a dead end.';
  return {
    title,
    description,
    alternates: { canonical: '/find-us' },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/find-us`,
      siteName: 'BMW Coding',
      title: mobileOnly ? 'Mobile BMW coding across Dublin' : 'Find the BMW Coding workshop',
      description,
      images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'BMW Coding' }],
    },
  };
}

export default async function FindUsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const settings = await getSettings();
  const mobileOnly = isMobileOnly();
  const wa = waLink(
    settings.whatsapp,
    mobileOnly
      ? 'Hi — I’d like to book a mobile visit. '
      : 'Hi — I’m on my way to the workshop and need a hand finding the unit. ',
  );

  return (
    <div className="grain relative min-h-screen">
      <Header />
      <main>
        <section className="relative overflow-hidden border-b border-white/5 pb-12 pt-28 md:pb-16 md:pt-40">
          <div className="absolute inset-0 -z-10">
            <div className="blueprint absolute inset-0 opacity-60" />
            <div className="absolute inset-0 hero-glow" />
          </div>
          <div className="mx-auto max-w-edge px-5 md:px-8">
            <div className="mb-5 flex items-center gap-3">
              <span className="m-stripe h-[3px] w-12" />
              <span className="label text-muted">
                {mobileOnly ? 'Mobile service · Dublin & surrounding counties' : 'Workshop · Rathcoole, West Dublin'}
              </span>
            </div>
            <h1 className="max-w-3xl font-display text-[clamp(2.2rem,7vw,4.5rem)] leading-[0.95]">
              {mobileOnly ? 'We come to you' : 'How to find us'}
            </h1>
            <p className="mt-5 flex max-w-2xl items-start gap-2 text-lg leading-relaxed text-muted">
              <MapPin size={20} className="mt-1 shrink-0 text-bmw" />{' '}
              {mobileOnly
                ? 'We work at your home or workplace across Dublin, Kildare, Wicklow and Meath — or remotely over ENET, anywhere in Ireland.'
                : ADDRESS_LINE}
            </p>

            {mobileOnly ? (
              <div className="mt-6 flex max-w-2xl items-start gap-3 border border-bmw/30 bg-bmw/5 p-4">
                <Truck size={18} className="mt-0.5 shrink-0 text-bmw" />
                <p className="text-sm leading-relaxed text-muted">
                  <span className="font-semibold text-ink">Nothing to drive to.</span> Tell us where the car
                  is parked and when suits, and we turn up with everything needed. Most coding is done
                  where the car stands, in under an hour.
                </p>
              </div>
            ) : (
              <>
                {/* Ends with the lease — after that there is nowhere to drive to. */}
                <div className="mt-6 flex max-w-2xl items-start gap-3 border border-bmw/30 bg-bmw/5 p-4">
                  <Truck size={18} className="mt-0.5 shrink-0 text-bmw" />
                  <p className="text-sm leading-relaxed text-muted">
                    <span className="font-semibold text-ink">
                      From {mobileFromLabel()} we come to you instead.
                    </span>{' '}
                    This is the last month at the Rathcoole unit. After that every job is done at your
                    home or workplace, or remotely over ENET — same work, same prices.
                  </p>
                </div>

                {/* The one warning that matters */}
                <div className="mt-4 flex max-w-2xl items-start gap-3 border border-amber-400/30 bg-amber-400/5 p-4">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-400" />
                  <p className="text-sm leading-relaxed text-muted">
                    <span className="font-semibold text-ink">Don’t follow a sat-nav pin for the address</span> — Google’s
                    default pin routes you into a dead-end road. Use the buttons below: they navigate to the
                    exact entrance instead.
                  </p>
                </div>
              </>
            )}

            <div className="mt-7 flex flex-wrap gap-4">
              {mobileOnly ? (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex items-center gap-2">
                  <MessageCircle size={16} /> Book a mobile visit
                </a>
              ) : (
                <>
                  <a
                    href={googleDirectionsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <Navigation size={16} /> Google Maps — correct route
                  </a>
                  <a
                    href={appleDirectionsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost inline-flex items-center gap-2"
                  >
                    <Navigation size={16} /> Apple Maps
                  </a>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="mx-auto max-w-edge px-5 md:px-8">
            {mobileOnly ? (
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <h2 className="font-display text-[clamp(1.6rem,4vw,2.6rem)] leading-tight">
                    How a mobile visit works
                  </h2>
                  <ol className="mt-6 space-y-4">
                    {[
                      'Message us with your model, year and what you want done. We confirm what your build supports before anything is booked.',
                      'Pick an evening or weekend slot. Tell us where the car will be parked — home, work, anywhere with a bit of space beside the car.',
                      'We arrive with the laptop, cables and power. Most coding takes under an hour and the car stays where it is.',
                      'You see it working before you pay. Payment is on completion, card or cash.',
                    ].map((step, i) => (
                      <li key={i} className="flex gap-4 border border-white/8 bg-graphite-800/40 p-4">
                        <span className="font-mono text-lg text-bmw">0{i + 1}</span>
                        <p className="text-sm leading-relaxed text-muted">{step}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-7 grid grid-cols-2 gap-3">
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">
                      <MessageCircle size={15} /> WhatsApp us
                    </a>
                    <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="btn-ghost justify-center">
                      <Phone size={15} /> Call us
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-white/10 bg-graphite-800/40 p-5">
                    <h3 className="label mb-3">Where we come</h3>
                    <p className="text-sm leading-relaxed text-muted">
                      Dublin city and county, Kildare, Wicklow and Meath in person. A call-out fee applies
                      and you are always told the exact figure before you book.
                    </p>
                  </div>
                  <div className="border border-white/10 bg-graphite-800/40 p-5">
                    <h3 className="label mb-3">Anywhere else in Ireland</h3>
                    <p className="text-sm leading-relaxed text-muted">
                      Remote coding over ENET. You need a laptop and an ENET cable, we do the rest over the
                      internet while the car sits in your own driveway. No call-out fee at all.
                    </p>
                  </div>
                  <div className="border border-white/10 bg-graphite-800/40 p-5">
                    <h3 className="label mb-3">Bigger retrofits</h3>
                    <p className="text-sm leading-relaxed text-muted">
                      Ambient lighting and other jobs that need hours with the interior apart are done
                      undercover by arrangement. Ask and we will sort a place and a time.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-2">
                {/* Steps */}
                <div>
                  <h2 className="font-display text-[clamp(1.6rem,4vw,2.6rem)] leading-tight">Turn-by-turn</h2>
                  <ol className="mt-6 space-y-4">
                    {STEPS.map((step, i) => (
                      <li key={i} className="flex gap-4 border border-white/8 bg-graphite-800/40 p-4">
                        <span className="font-mono text-lg text-bmw">0{i + 1}</span>
                        <p className="text-sm leading-relaxed text-muted">{step}</p>
                      </li>
                    ))}
                  </ol>

                  <div className="mt-7 grid grid-cols-2 gap-3">
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary justify-center">
                      <MessageCircle size={15} /> WhatsApp us
                    </a>
                    <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="btn-ghost justify-center">
                      <Phone size={15} /> Call for help
                    </a>
                  </div>
                  <p className="mt-3 text-xs text-faint">
                    Lost in the park? Message or call — we’ll talk you to the door in under a minute.
                  </p>
                </div>

                {/* Map */}
                <div>
                  <div className="border border-white/10">
                    <div className="m-stripe h-1 w-full" />
                    <iframe
                      src={mapEmbedUrl()}
                      title="BMW Coding workshop location"
                      className="h-[380px] w-full border-0 md:h-[460px]"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-faint">
                    The marker shows our entrance. Visits are by appointment — book a slot first and
                    we’ll be expecting you.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer settings={settings} />
      <MobileActionBar phone={settings.phone} whatsapp={settings.whatsapp} />
    </div>
  );
}
