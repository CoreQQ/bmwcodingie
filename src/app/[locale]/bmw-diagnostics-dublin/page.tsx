import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ServiceLanding } from '@/components/site/ServiceLanding';
import { serviceMetadata } from '@/lib/servicePages';

const SLUG = 'bmw-diagnostics-dublin';

// Cached for fast TTFB; content is static SEO copy.
export const revalidate = 86400;

export function generateMetadata(): Metadata {
  return serviceMetadata(SLUG);
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ServiceLanding slug={SLUG} />;
}
