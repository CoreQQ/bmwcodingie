import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { ALL_SERVICE_SLUGS } from '@/lib/servicePages';
import { DYNAMIC_LANDING_SLUGS } from '@/lib/landings';
import { BLOG_POSTS } from '@/lib/blog';

const PATHS = [
  { path: '', priority: 1 },
  { path: '/models', priority: 0.8 },
  { path: '/bmw-coding-list', priority: 0.8 },
  { path: '/blog', priority: 0.7 },
  { path: '/find-us', priority: 0.6 },
  ...BLOG_POSTS.map((p) => ({ path: `/blog/${p.slug}`, priority: 0.7 })),
  ...ALL_SERVICE_SLUGS.map((slug) => ({ path: `/${slug}`, priority: 0.9 })),
  ...DYNAMIC_LANDING_SLUGS.map((slug) => ({ path: `/${slug}`, priority: 0.8 })),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.bmwcoding.ie';

  function localeUrl(locale: string, path: string) {
    const prefix = locale === routing.defaultLocale ? '' : `/${locale}`;
    return `${base}${prefix}${path}`;
  }

  return PATHS.flatMap(({ path, priority }) =>
    routing.locales.map((locale) => ({
      url: localeUrl(locale, path),
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map((l) => [l, localeUrl(l, path)]),
        ),
      },
    })),
  );
}
