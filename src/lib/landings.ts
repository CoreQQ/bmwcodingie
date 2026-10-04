import type { Metadata } from 'next';
import { SERVICE_PAGES, buildLandingMetadata, type ServicePage } from './servicePages';
import { LOCATION_PAGES } from './locationPages';
import { CHASSIS_PAGES } from './chassisPages';
import { EXTRA_LANDINGS } from './extraLandings';
import { UPGRADE_LANDINGS } from './upgradeLandings';

// Single registry of every SEO landing page on the site. The seven core
// service pages keep their own static routes; location and chassis pages are
// served by the dynamic [landing] route.
export const ALL_LANDINGS: Record<string, ServicePage> = {
  ...SERVICE_PAGES,
  ...LOCATION_PAGES,
  ...CHASSIS_PAGES,
  ...EXTRA_LANDINGS,
  ...UPGRADE_LANDINGS,
};

/** Slugs served by the dynamic [landing] route (everything except the static dirs). */
export const DYNAMIC_LANDING_SLUGS = [
  ...Object.keys(LOCATION_PAGES),
  ...Object.keys(CHASSIS_PAGES),
  ...Object.keys(EXTRA_LANDINGS),
  ...Object.keys(UPGRADE_LANDINGS),
];

export function landingMetadata(slug: string): Metadata {
  const p = ALL_LANDINGS[slug];
  if (!p) return {};
  return buildLandingMetadata(p);
}
