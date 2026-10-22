import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { getCatalog, getReviews, getSettings } from '@/lib/data';
import { CookieConsent } from '@/components/site/CookieConsent';
import { SectionTime } from '@/components/site/SectionTime';
import { CallHours } from '@/components/site/CallHours';
import { WhatsAppFloat } from '@/components/site/WhatsAppFloat';
import { Announcement } from '@/components/site/Announcement';
import { isMobileOnly } from '@/lib/transition';
import { NOTICE_KEY, XMAS_NOTICE_KEY, XMAS_ON } from '@/lib/season';
import { getHours } from '@/lib/stats';
import { getSupabaseAdmin } from '@/lib/supabase';
import { DEFAULT_HOURS, type HoursMap } from '@/lib/hours';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enables static rendering for everything under [locale]: getLocale() (used
  // by getSettings/getCatalog and the client provider) reads from this store
  // instead of request headers, so the pages can be prerendered and cached.
  setRequestLocale(locale);

  const [settings, catalog, reviews, tCookie, tNotice, tXmas] = await Promise.all([
    getSettings(),
    getCatalog(),
    getReviews(),
    getTranslations('CookieConsent'),
    getTranslations('Announcement'),
    getTranslations('Christmas'),
  ]);

  const mobileOnly = isMobileOnly();

  // Opening hours in the schema come from the same table the booking diary
  // uses (admin → hours), not from a copy typed into this file.
  const sbAdmin = getSupabaseAdmin();
  const hours: HoursMap = sbAdmin ? await getHours(sbAdmin).catch(() => DEFAULT_HOURS) : DEFAULT_HOURS;
  const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hh = (n: number) => `${String(Math.min(n, 23)).padStart(2, '0')}:${n >= 24 ? '59' : '00'}`;
  const byWindow = new Map<string, string[]>();
  for (let d = 0; d < 7; d++) {
    const w = hours[d];
    if (!w) continue;
    const key = `${hh(w[0])}-${hh(w[1])}`;
    byWindow.set(key, [...(byWindow.get(key) ?? []), DAY[d]]);
  }
  const openingHoursSpecification = [...byWindow.entries()].map(([k, days]) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: days,
    opens: k.split('-')[0],
    closes: k.split('-')[1],
  }));

  const sameAs = [
    settings.instagram ? `https://instagram.com/${settings.instagram.replace(/^@/, '')}` : null,
    settings.telegram ? `https://t.me/${settings.telegram.replace(/^@/, '')}` : null,
  ].filter(Boolean) as string[];

  // Only emit rating data when there are real reviews — never fabricate it.
  const ratingData =
    reviews.length > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: (
              reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length
            ).toFixed(1),
            reviewCount: reviews.length,
            bestRating: 5,
          },
          review: reviews.slice(0, 8).map((r) => ({
            '@type': 'Review',
            author: { '@type': 'Person', name: r.author },
            reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5 },
            reviewBody: r.body,
          })),
        }
      : {};

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      // WebSite entity — the primary signal Google uses to show "BMW Coding"
      // (not the bare domain) as the site name in results.
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'BMW Coding',
        alternateName: ['BMW Coding IE', 'BMW Coding Dublin'],
        url: SITE_URL,
        publisher: { '@id': `${SITE_URL}/#business` },
      },
      {
        '@type': 'AutoRepair',
        '@id': `${SITE_URL}/#business`,
        name: 'BMW Coding',
        alternateName: ['BMW Coding IE', 'BMW Coding Dublin'],
        description:
          'Independent BMW coding, diagnostics and retrofit specialist — mobile around Dublin and surrounding counties, or remotely anywhere in Ireland over ENET.',
        slogan: 'Dealer-level BMW coding, diagnostics and retrofits — Dublin and across Ireland',
        url: SITE_URL,
        telephone: settings.phone,
        email: settings.email,
        image: `${SITE_URL}/og.jpg`,
        logo: `${SITE_URL}/logo.png`,
        priceRange: '€€',
        areaServed: [
          { '@type': 'City', name: 'Dublin' },
          { '@type': 'City', name: 'Cork' },
          { '@type': 'City', name: 'Waterford' },
          { '@type': 'AdministrativeArea', name: 'County Dublin' },
          { '@type': 'AdministrativeArea', name: 'Kildare' },
          { '@type': 'AdministrativeArea', name: 'Wicklow' },
          { '@type': 'AdministrativeArea', name: 'Meath' },
          { '@type': 'Country', name: 'Ireland' },
        ],
        // A service-area business must not publish premises it no longer has —
        // Google suspends profiles for it, and customers turn up at a stranger's
        // unit. Only the town and country remain.
        address: mobileOnly
          ? { '@type': 'PostalAddress', addressLocality: 'Dublin', addressCountry: 'IE' }
          : {
              '@type': 'PostalAddress',
              streetAddress: 'Grants View, Greenogue Business Park',
              addressLocality: 'Rathcoole',
              addressRegion: 'Co. Dublin',
              addressCountry: 'IE',
            },
        ...(mobileOnly
          ? {}
          : { geo: { '@type': 'GeoCoordinates', latitude: 53.3000625, longitude: -6.4818572 } }),
        ...(openingHoursSpecification.length ? { openingHoursSpecification } : {}),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'BMW coding & retrofit services',
          itemListElement: catalog.flatMap((cat) =>
            cat.services.map((s) => ({
              '@type': 'Offer',
              itemOffered: { '@type': 'Service', name: s.title, areaServed: 'Ireland' },
            })),
          ),
        },
        sameAs,
        ...ratingData,
      },
    ],
  };

  return (
    <NextIntlClientProvider>
      {/* The <html> element is rendered statically as lang="en" in the root
          layout; correct it to the active locale on the client for a11y/SEO. */}
      {locale !== 'en' && (
        <script
          dangerouslySetInnerHTML={{ __html: `document.documentElement.lang=${JSON.stringify(locale)}` }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e'),
        }}
      />
      {/* Reserve the notice's space in the hero before first paint; doing it
          after hydration shifted the whole page (CLS). Key matches Announcement. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{if(localStorage.getItem(${JSON.stringify(XMAS_ON ? XMAS_NOTICE_KEY : NOTICE_KEY)})!=='seen')document.documentElement.dataset.notice='1'}catch(e){document.documentElement.dataset.notice='1'}`,
        }}
      />
      {/* During the Christmas offer its notice replaces the "we come to you" one. */}
      {XMAS_ON ? (
        <Announcement
          title={tXmas('title')}
          body={tXmas('body')}
          cta={tXmas('cta')}
          href="/bmw-coding-price-calculator"
          dismissLabel={tNotice('dismiss')}
          storageKey={XMAS_NOTICE_KEY}
          festive
        />
      ) : (
        <Announcement
          title={tNotice('title')}
          body={tNotice('body')}
          cta={tNotice('cta')}
          href="/find-us"
          dismissLabel={tNotice('dismiss')}
        />
      )}
      {children}
      <SectionTime />
      <CallHours whatsapp={settings.whatsapp} />
      <WhatsAppFloat whatsapp={settings.whatsapp} />
      <CookieConsent
        text={tCookie('text')}
        necessaryOnly={tCookie('necessaryOnly')}
        acceptAll={tCookie('acceptAll')}
      />
    </NextIntlClientProvider>
  );
}
