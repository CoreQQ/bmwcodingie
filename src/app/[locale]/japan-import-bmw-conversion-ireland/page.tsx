import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ServiceLanding } from '@/components/site/ServiceLanding';
import { serviceMetadata } from '@/lib/servicePages';

const SLUG = 'japan-import-bmw-conversion-ireland';

// Cached for fast TTFB; content is static SEO copy.
export const revalidate = 86400;

export function generateMetadata(): Metadata {
  return serviceMetadata(SLUG);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Palette from the ui-ux-pro-max data (automotive: premium dark + action
  // red), softened to #F04A54 so it clears 4.5:1 on the graphite background —
  // the brand M-red would only reach 3.98:1. Sand recalls the JDM auction sheet.
  return <ServiceLanding slug={SLUG} accent="#F04A54" accentSoft="#E8C39E" />;
}
