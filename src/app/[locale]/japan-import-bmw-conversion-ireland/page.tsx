import type { Metadata } from 'next';
import { ServiceLanding } from '@/components/site/ServiceLanding';
import { serviceMetadata } from '@/lib/servicePages';

const SLUG = 'japan-import-bmw-conversion-ireland';

// Cached for fast TTFB; content is static SEO copy.
export const revalidate = 86400;

export function generateMetadata(): Metadata {
  return serviceMetadata(SLUG);
}

export default function Page() {
  return <ServiceLanding slug={SLUG} />;
}
