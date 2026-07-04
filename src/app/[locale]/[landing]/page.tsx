import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { ServiceLanding } from '@/components/site/ServiceLanding';
import { ALL_LANDINGS, DYNAMIC_LANDING_SLUGS, landingMetadata } from '@/lib/landings';

// Programmatic SEO landings: location pages (bmw-coding-cork, …) and
// model/chassis pages (bmw-f30-coding, …). Static service dirs and other
// real routes take precedence over this dynamic segment; anything else
// falls through to the [...rest] catch-all 404.
export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return DYNAMIC_LANDING_SLUGS.map((landing) => ({ landing }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ landing: string }>;
}): Promise<Metadata> {
  const { landing } = await params;
  return landingMetadata(landing);
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; landing: string }>;
}) {
  const { locale, landing } = await params;
  if (!ALL_LANDINGS[landing]) notFound();
  setRequestLocale(locale);
  return <ServiceLanding slug={landing} />;
}
